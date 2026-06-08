/**
 * Settings Routes
 * Registers tenant setting endpoints.
 */

const { createResourceModule } = require('../../common/modules/resourceFactory');
const { settingCreateRules, settingUpdateRules } = require('./settings.validator');
const { ROLES } = require('../../common/constants/roles');
const { PERMISSIONS } = require('../../common/constants/permissions');
const { encryptJson, decryptJson } = require('../../common/utils/fieldCrypto');

// Encrypt setting payload when requested.
const prepareWrite = async (payload, context, connection, current) => {
  const shouldEncrypt = payload.is_encrypted ?? current?.is_encrypted ?? false;
  const next = { ...payload };
  if (payload.setting_value === undefined) {
    if (payload.is_encrypted === false && current?.is_encrypted) next.setting_value = decryptJson(current.setting_value);
    return next;
  }
  if (shouldEncrypt && !payload.setting_value?.encrypted) next.setting_value = encryptJson(payload.setting_value);
  if (!shouldEncrypt && payload.setting_value?.encrypted) next.setting_value = decryptJson(payload.setting_value);
  return next;
};

// Decrypt setting payload for authorized reads.
const prepareRead = async (record) => {
  if (!record.is_encrypted) return record;
  return { ...record, setting_value: decryptJson(record.setting_value) };
};

const moduleDefinition = createResourceModule({
  name: 'Setting',
  table: 'settings',
  roles: [ROLES.SUPER_ADMIN, ROLES.CLINIC_OWNER],
  readPermissions: [PERMISSIONS.SETTINGS_MANAGE],
  writePermissions: [PERMISSIONS.SETTINGS_MANAGE],
  columns: ['id', 'clinic_id', 'setting_key', 'setting_value', 'scope', 'is_encrypted', 'created_by', 'updated_by', 'is_deleted'],
  searchable: ['setting_key'],
  filterable: ['scope'],
  jsonFields: ['setting_value'],
  createRules: settingCreateRules,
  updateRules: settingUpdateRules,
  prepareWrite,
  prepareRead,
});

module.exports = moduleDefinition.router;
