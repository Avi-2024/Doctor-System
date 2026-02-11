const fs = require('fs');
const path = require('path');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const STORAGE_DRIVER = process.env.STORAGE_DRIVER || 'local';
const LOCAL_STORAGE_PATH = process.env.LOCAL_STORAGE_PATH || path.join(process.cwd(), 'backend', 'storage');

const ensureLocalDir = (folderPath) => {
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }
};

const uploadLocal = async ({ buffer, key, contentType = 'application/pdf' }) => {
  const fullPath = path.join(LOCAL_STORAGE_PATH, key);
  ensureLocalDir(path.dirname(fullPath));
  fs.writeFileSync(fullPath, buffer);

  return {
    driver: 'local',
    key,
    contentType,
    path: fullPath,
    url: `${process.env.FILE_BASE_URL || ''}/${key}`.replace(/([^:]\/)\/+/, '$1'),
  };
};

const uploadS3 = async ({ buffer, key, contentType = 'application/pdf' }) => {
  const region = process.env.AWS_REGION;
  const bucket = process.env.AWS_S3_BUCKET;

  if (!region || !bucket) {
    const error = new Error('Missing AWS_REGION or AWS_S3_BUCKET for S3 storage');
    error.statusCode = 500;
    throw error;
  }

  const client = new S3Client({
    region,
    credentials:
      process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
        ? {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
          }
        : undefined,
  });

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      ACL: process.env.AWS_S3_ACL || 'private',
    })
  );

  return {
    driver: 's3',
    key,
    contentType,
    bucket,
    url: process.env.AWS_S3_PUBLIC_BASE_URL
      ? `${process.env.AWS_S3_PUBLIC_BASE_URL}/${key}`
      : `https://${bucket}.s3.${region}.amazonaws.com/${key}`,
  };
};

const uploadBuffer = async ({ buffer, key, contentType = 'application/pdf' }) => {
  if (!buffer || !Buffer.isBuffer(buffer)) {
    const error = new Error('uploadBuffer requires a valid Buffer');
    error.statusCode = 400;
    throw error;
  }

  if (!key) {
    const error = new Error('uploadBuffer requires key');
    error.statusCode = 400;
    throw error;
  }

  if (STORAGE_DRIVER === 's3') {
    return uploadS3({ buffer, key, contentType });
  }

  return uploadLocal({ buffer, key, contentType });
};

module.exports = {
  uploadBuffer,
};
