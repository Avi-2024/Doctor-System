/**
 * Storage Service
 * Uploads tenant files to AWS S3.
 */

const crypto = require('crypto');
const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { env } = require('../../config/env');
const { ApiError } = require('../../common/errors/ApiError');
const { createBaseRepository } = require('../../common/repositories/BaseRepository');
const { validateReferences } = require('../../common/services/reference.service');
const { assertUsage } = require('../subscriptions/subscriptions.service');
const logger = require('../../common/utils/logger');

const repository = createBaseRepository({
  table: 'attachments',
  columns: ['id', 'clinic_id', 'owner_type', 'owner_id', 'file_name', 'mime_type', 'size_bytes', 'bucket', 'object_key', 'created_by', 'updated_by', 'is_deleted'],
  filterable: ['owner_type', 'owner_id'],
});
const ownerTables = Object.freeze({
  PATIENT: 'patients',
  APPOINTMENT: 'appointments',
  CONSULTATION: 'consultations',
  PRESCRIPTION: 'prescriptions',
  LAB_ORDER: 'lab_orders',
  INVOICE: 'invoices',
  USER: 'users',
});

// Create S3 client.
const createClient = () => new S3Client({
  region: env.AWS_REGION,
  credentials: env.AWS_ACCESS_KEY_ID ? { accessKeyId: env.AWS_ACCESS_KEY_ID, secretAccessKey: env.AWS_SECRET_ACCESS_KEY } : undefined,
});

// Upload attachment.
const upload = async ({ file, ownerType, ownerId, context }) => {
  if (!env.AWS_S3_BUCKET) throw new ApiError(500, 'AWS S3 bucket is not configured');
  if (!file) throw new ApiError(400, 'File is required');
  await assertUsage({ clinicId: context.clinicId, metric: 'storageBytes', increment: file.size });
  if (ownerType !== 'GENERAL') {
    const table = ownerTables[ownerType];
    if (!table || !ownerId) throw new ApiError(422, 'Valid attachment owner required');
    await validateReferences({ owner_id: ownerId }, context.clinicId, { owner_id: table });
  }
  const extension = file.originalname.includes('.') ? file.originalname.split('.').pop().replace(/[^a-z0-9]/gi, '') : 'bin';
  const objectKey = `${context.clinicId}/${ownerType}/${crypto.randomUUID()}.${extension}`;
  const client = createClient();
  await client.send(new PutObjectCommand({ Bucket: env.AWS_S3_BUCKET, Key: objectKey, Body: file.buffer, ContentType: file.mimetype, ServerSideEncryption: 'AES256' }));
  try {
    return await repository.create({
      clinic_id: context.clinicId,
      owner_type: ownerType,
      owner_id: ownerId || null,
      file_name: file.originalname,
      mime_type: file.mimetype,
      size_bytes: file.size,
      bucket: env.AWS_S3_BUCKET,
      object_key: objectKey,
      created_by: context.userId,
      updated_by: context.userId,
    });
  } catch (error) {
    try {
      await client.send(new DeleteObjectCommand({ Bucket: env.AWS_S3_BUCKET, Key: objectKey }));
    } catch (cleanupError) {
      logger.error('Orphaned S3 object cleanup failed', { objectKey, error: cleanupError.message });
    }
    throw error;
  }
};

// Create signed download URL.
const signedUrl = async (id, context) => {
  const attachment = await repository.findById(id, context.clinicId);
  if (!attachment) throw new ApiError(404, 'Attachment not found');
  const url = await getSignedUrl(createClient(), new GetObjectCommand({ Bucket: attachment.bucket, Key: attachment.object_key }), { expiresIn: env.S3_SIGNED_URL_EXPIRES_SECONDS });
  return { id, fileName: attachment.file_name, signedUrl: url, expiresIn: env.S3_SIGNED_URL_EXPIRES_SECONDS };
};

// List tenant attachment metadata.
const list = async (requestQuery, context) => repository.list(context.clinicId, requestQuery);

module.exports = { upload, signedUrl, list };
