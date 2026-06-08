INSERT IGNORE INTO subscription_plans
(id, clinic_id, code, name, monthly_price, yearly_price, limits, features)
VALUES
(
  '00000000-0000-4000-8000-000000000001',
  NULL,
  'DEFAULT_TRIAL',
  'Default Trial',
  0,
  0,
  JSON_OBJECT(
    'users', 10,
    'patients', 500,
    'monthlyAppointments', 1000,
    'storageBytes', 1073741824,
    'monthlyWhatsAppMessages', 1000
  ),
  JSON_ARRAY('core_patient_management', 'appointments', 'billing', 'whatsapp')
);
