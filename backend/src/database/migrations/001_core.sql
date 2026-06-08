CREATE TABLE IF NOT EXISTS schema_migrations (
  name VARCHAR(255) PRIMARY KEY,
  executed_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
);

CREATE TABLE IF NOT EXISTS clinics (
  id CHAR(36) PRIMARY KEY,
  clinic_id CHAR(36) NULL,
  name VARCHAR(160) NOT NULL,
  code VARCHAR(40) NOT NULL,
  status ENUM('ACTIVE','SUSPENDED','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  contact JSON NULL,
  address JSON NULL,
  branding JSON NULL,
  timezone VARCHAR(80) NOT NULL DEFAULT 'Asia/Kolkata',
  created_by CHAR(36) NULL,
  updated_by CHAR(36) NULL,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_clinic_code (code, is_deleted),
  KEY idx_clinics_tenant_status (clinic_id, status, is_deleted)
);

CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) PRIMARY KEY,
  clinic_id CHAR(36) NULL,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL,
  phone VARCHAR(20) NULL,
  password_hash VARCHAR(255) NOT NULL,
  refresh_token_hash CHAR(64) NULL,
  role ENUM('SUPER_ADMIN','CLINIC_OWNER','DOCTOR','RECEPTIONIST','PATIENT') NOT NULL,
  permissions JSON NOT NULL,
  profile JSON NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_login_at DATETIME(3) NULL,
  created_by CHAR(36) NULL,
  updated_by CHAR(36) NULL,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_users_tenant_email (clinic_id, email, is_deleted),
  KEY idx_users_tenant_role (clinic_id, role, is_active, is_deleted),
  CONSTRAINT fk_users_clinic FOREIGN KEY (clinic_id) REFERENCES clinics(id)
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id CHAR(36) PRIMARY KEY,
  clinic_id CHAR(36) NULL,
  user_id CHAR(36) NOT NULL,
  token_hash CHAR(64) NOT NULL,
  expires_at DATETIME(3) NOT NULL,
  revoked_at DATETIME(3) NULL,
  replaced_by_token_id CHAR(36) NULL,
  created_by CHAR(36) NULL,
  updated_by CHAR(36) NULL,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_refresh_token_hash (token_hash),
  KEY idx_refresh_user (clinic_id, user_id, expires_at),
  CONSTRAINT fk_refresh_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id CHAR(36) PRIMARY KEY,
  clinic_id CHAR(36) NULL,
  user_id CHAR(36) NOT NULL,
  token_hash CHAR(64) NOT NULL,
  expires_at DATETIME(3) NOT NULL,
  consumed_at DATETIME(3) NULL,
  created_by CHAR(36) NULL,
  updated_by CHAR(36) NULL,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_password_reset_hash (token_hash),
  KEY idx_password_reset_user (clinic_id, user_id, expires_at)
);

CREATE TABLE IF NOT EXISTS clinic_branches (
  id CHAR(36) PRIMARY KEY,
  clinic_id CHAR(36) NOT NULL,
  name VARCHAR(140) NOT NULL,
  contact JSON NULL,
  address JSON NULL,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by CHAR(36) NULL,
  updated_by CHAR(36) NULL,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY idx_branches_tenant (clinic_id, is_active, is_deleted),
  CONSTRAINT fk_branches_clinic FOREIGN KEY (clinic_id) REFERENCES clinics(id)
);

CREATE TABLE IF NOT EXISTS patients (
  id CHAR(36) PRIMARY KEY,
  clinic_id CHAR(36) NOT NULL,
  patient_code VARCHAR(40) NOT NULL,
  full_name VARCHAR(140) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(160) NULL,
  gender ENUM('MALE','FEMALE','OTHER','UNKNOWN') NOT NULL DEFAULT 'UNKNOWN',
  date_of_birth DATE NULL,
  blood_group VARCHAR(10) NULL,
  demographics JSON NULL,
  medical_summary JSON NULL,
  created_by CHAR(36) NULL,
  updated_by CHAR(36) NULL,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_patient_code (clinic_id, patient_code, is_deleted),
  KEY idx_patient_search (clinic_id, phone, full_name, is_deleted),
  CONSTRAINT fk_patients_clinic FOREIGN KEY (clinic_id) REFERENCES clinics(id)
);

CREATE TABLE IF NOT EXISTS doctor_schedules (
  id CHAR(36) PRIMARY KEY,
  clinic_id CHAR(36) NOT NULL,
  doctor_id CHAR(36) NOT NULL,
  branch_id CHAR(36) NULL,
  weekly_schedule JSON NOT NULL,
  timezone VARCHAR(80) NOT NULL DEFAULT 'Asia/Kolkata',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by CHAR(36) NULL,
  updated_by CHAR(36) NULL,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY idx_schedule_doctor (clinic_id, doctor_id, is_active, is_deleted),
  CONSTRAINT fk_schedule_doctor FOREIGN KEY (doctor_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS doctor_leaves (
  id CHAR(36) PRIMARY KEY,
  clinic_id CHAR(36) NOT NULL,
  doctor_id CHAR(36) NOT NULL,
  starts_at DATETIME(3) NOT NULL,
  ends_at DATETIME(3) NOT NULL,
  reason VARCHAR(1000) NULL,
  status ENUM('REQUESTED','APPROVED','REJECTED','CANCELLED') NOT NULL DEFAULT 'APPROVED',
  created_by CHAR(36) NULL,
  updated_by CHAR(36) NULL,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY idx_leave_doctor (clinic_id, doctor_id, starts_at, ends_at, is_deleted)
);

CREATE TABLE IF NOT EXISTS patient_records (
  id CHAR(36) PRIMARY KEY,
  clinic_id CHAR(36) NOT NULL,
  patient_id CHAR(36) NOT NULL,
  record_type ENUM('FAMILY_MEMBER','MEDICAL_HISTORY','ALLERGY','DOCUMENT') NOT NULL,
  record_data JSON NOT NULL,
  created_by CHAR(36) NULL,
  updated_by CHAR(36) NULL,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY idx_patient_records (clinic_id, patient_id, record_type, is_deleted)
);

CREATE TABLE IF NOT EXISTS appointments (
  id CHAR(36) PRIMARY KEY,
  clinic_id CHAR(36) NOT NULL,
  patient_id CHAR(36) NOT NULL,
  doctor_id CHAR(36) NOT NULL,
  branch_id CHAR(36) NULL,
  appointment_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status ENUM('SCHEDULED','CHECKED_IN','IN_CONSULTATION','COMPLETED','CANCELLED','NO_SHOW') NOT NULL DEFAULT 'SCHEDULED',
  source VARCHAR(30) NOT NULL DEFAULT 'WALKIN',
  reason VARCHAR(500) NULL,
  cancellation_reason VARCHAR(500) NULL,
  created_by CHAR(36) NULL,
  updated_by CHAR(36) NULL,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY idx_appointment_doctor (clinic_id, doctor_id, appointment_date, status, is_deleted),
  KEY idx_appointment_patient (clinic_id, patient_id, appointment_date, is_deleted),
  CONSTRAINT fk_appointment_patient FOREIGN KEY (patient_id) REFERENCES patients(id),
  CONSTRAINT fk_appointment_doctor FOREIGN KEY (doctor_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS queue_entries (
  id CHAR(36) PRIMARY KEY,
  clinic_id CHAR(36) NOT NULL,
  patient_id CHAR(36) NOT NULL,
  doctor_id CHAR(36) NOT NULL,
  appointment_id CHAR(36) NULL,
  queue_date DATE NOT NULL,
  token_number INT NOT NULL,
  priority INT NOT NULL DEFAULT 0,
  status ENUM('WAITING','CALLED','IN_PROGRESS','COMPLETED','NO_SHOW','SKIPPED') NOT NULL DEFAULT 'WAITING',
  called_at DATETIME(3) NULL,
  completed_at DATETIME(3) NULL,
  created_by CHAR(36) NULL,
  updated_by CHAR(36) NULL,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_queue_token (clinic_id, queue_date, token_number, is_deleted),
  KEY idx_queue_doctor (clinic_id, doctor_id, queue_date, status, is_deleted)
);

CREATE TABLE IF NOT EXISTS consultations (
  id CHAR(36) PRIMARY KEY,
  clinic_id CHAR(36) NOT NULL,
  patient_id CHAR(36) NOT NULL,
  doctor_id CHAR(36) NOT NULL,
  appointment_id CHAR(36) NULL,
  status ENUM('DRAFT','COMPLETED') NOT NULL DEFAULT 'DRAFT',
  clinical_data JSON NOT NULL,
  created_by CHAR(36) NULL,
  updated_by CHAR(36) NULL,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY idx_consultation_patient (clinic_id, patient_id, created_at, is_deleted)
);

CREATE TABLE IF NOT EXISTS vitals (
  id CHAR(36) PRIMARY KEY,
  clinic_id CHAR(36) NOT NULL,
  patient_id CHAR(36) NOT NULL,
  consultation_id CHAR(36) NULL,
  vital_data JSON NOT NULL,
  created_by CHAR(36) NULL,
  updated_by CHAR(36) NULL,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY idx_vitals_patient (clinic_id, patient_id, created_at, is_deleted)
);

CREATE TABLE IF NOT EXISTS prescriptions (
  id CHAR(36) PRIMARY KEY,
  clinic_id CHAR(36) NOT NULL,
  patient_id CHAR(36) NOT NULL,
  doctor_id CHAR(36) NOT NULL,
  consultation_id CHAR(36) NULL,
  diagnosis TEXT NULL,
  medicines JSON NOT NULL,
  advice TEXT NULL,
  created_by CHAR(36) NULL,
  updated_by CHAR(36) NULL,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY idx_prescription_patient (clinic_id, patient_id, created_at, is_deleted)
);

CREATE TABLE IF NOT EXISTS prescription_templates (
  id CHAR(36) PRIMARY KEY,
  clinic_id CHAR(36) NOT NULL,
  doctor_id CHAR(36) NOT NULL,
  name VARCHAR(160) NOT NULL,
  template_data JSON NOT NULL,
  created_by CHAR(36) NULL,
  updated_by CHAR(36) NULL,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY idx_prescription_template (clinic_id, doctor_id, name, is_deleted)
);

CREATE TABLE IF NOT EXISTS lab_tests (
  id CHAR(36) PRIMARY KEY,
  clinic_id CHAR(36) NOT NULL,
  code VARCHAR(40) NOT NULL,
  name VARCHAR(160) NOT NULL,
  category VARCHAR(100) NULL,
  price DECIMAL(12,2) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by CHAR(36) NULL,
  updated_by CHAR(36) NULL,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_lab_test_code (clinic_id, code, is_deleted)
);

CREATE TABLE IF NOT EXISTS lab_orders (
  id CHAR(36) PRIMARY KEY,
  clinic_id CHAR(36) NOT NULL,
  order_number VARCHAR(40) NOT NULL,
  patient_id CHAR(36) NOT NULL,
  doctor_id CHAR(36) NOT NULL,
  status ENUM('ORDERED','SENT_TO_LAB','REPORT_RECEIVED','CANCELLED') NOT NULL DEFAULT 'ORDERED',
  items JSON NOT NULL,
  report_attachment_id CHAR(36) NULL,
  created_by CHAR(36) NULL,
  updated_by CHAR(36) NULL,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_lab_order (clinic_id, order_number, is_deleted),
  KEY idx_lab_patient (clinic_id, patient_id, created_at, is_deleted)
);

CREATE TABLE IF NOT EXISTS lab_reports (
  id CHAR(36) PRIMARY KEY,
  clinic_id CHAR(36) NOT NULL,
  lab_order_id CHAR(36) NOT NULL,
  patient_id CHAR(36) NOT NULL,
  attachment_id CHAR(36) NOT NULL,
  result_data JSON NULL,
  reviewed_by CHAR(36) NULL,
  reviewed_at DATETIME(3) NULL,
  created_by CHAR(36) NULL,
  updated_by CHAR(36) NULL,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY idx_lab_report_patient (clinic_id, patient_id, created_at, is_deleted)
);

CREATE TABLE IF NOT EXISTS invoices (
  id CHAR(36) PRIMARY KEY,
  clinic_id CHAR(36) NOT NULL,
  invoice_number VARCHAR(40) NOT NULL,
  patient_id CHAR(36) NULL,
  subtotal DECIMAL(12,2) NOT NULL,
  discount DECIMAL(12,2) NOT NULL DEFAULT 0,
  tax DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(12,2) NOT NULL,
  paid_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  due_amount DECIMAL(12,2) NOT NULL,
  status ENUM('UNPAID','PARTIALLY_PAID','PAID','CANCELLED','REFUNDED') NOT NULL DEFAULT 'UNPAID',
  items JSON NOT NULL,
  created_by CHAR(36) NULL,
  updated_by CHAR(36) NULL,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_invoice_number (clinic_id, invoice_number, is_deleted),
  KEY idx_invoice_status (clinic_id, status, created_at, is_deleted)
);

CREATE TABLE IF NOT EXISTS payments (
  id CHAR(36) PRIMARY KEY,
  clinic_id CHAR(36) NOT NULL,
  invoice_id CHAR(36) NOT NULL,
  receipt_number VARCHAR(60) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  method ENUM('CASH','UPI','CARD','BANK_TRANSFER','RAZORPAY') NOT NULL,
  reference_number VARCHAR(160) NULL,
  paid_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  created_by CHAR(36) NULL,
  updated_by CHAR(36) NULL,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_receipt_number (clinic_id, receipt_number, is_deleted),
  KEY idx_payment_invoice (clinic_id, invoice_id, paid_at, is_deleted),
  CONSTRAINT fk_payment_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id)
);

CREATE TABLE IF NOT EXISTS attachments (
  id CHAR(36) PRIMARY KEY,
  clinic_id CHAR(36) NOT NULL,
  owner_type VARCHAR(60) NOT NULL,
  owner_id CHAR(36) NULL,
  file_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(120) NOT NULL,
  size_bytes BIGINT NOT NULL,
  bucket VARCHAR(255) NOT NULL,
  object_key VARCHAR(500) NOT NULL,
  created_by CHAR(36) NULL,
  updated_by CHAR(36) NULL,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY idx_attachment_owner (clinic_id, owner_type, owner_id, is_deleted)
);

CREATE TABLE IF NOT EXISTS notifications (
  id CHAR(36) PRIMARY KEY,
  clinic_id CHAR(36) NOT NULL,
  channel ENUM('IN_APP','WHATSAPP','EMAIL','SMS') NOT NULL,
  recipient VARCHAR(160) NOT NULL,
  message TEXT NOT NULL,
  payload JSON NULL,
  status ENUM('QUEUED','PROCESSING','SENT','DELIVERED','READ','FAILED') NOT NULL DEFAULT 'QUEUED',
  scheduled_for DATETIME(3) NULL,
  provider_message_id VARCHAR(255) NULL,
  attempts INT NOT NULL DEFAULT 0,
  created_by CHAR(36) NULL,
  updated_by CHAR(36) NULL,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY idx_notification_queue (clinic_id, channel, status, scheduled_for, is_deleted)
);

CREATE TABLE IF NOT EXISTS whatsapp_accounts (
  id CHAR(36) PRIMARY KEY,
  clinic_id CHAR(36) NOT NULL,
  phone_number_id VARCHAR(160) NOT NULL,
  business_account_id VARCHAR(160) NOT NULL,
  display_phone_number VARCHAR(40) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by CHAR(36) NULL,
  updated_by CHAR(36) NULL,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_whatsapp_phone_id (phone_number_id, is_deleted),
  KEY idx_whatsapp_account (clinic_id, is_active, is_deleted)
);

CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id CHAR(36) PRIMARY KEY,
  clinic_id CHAR(36) NOT NULL,
  notification_id CHAR(36) NULL,
  patient_id CHAR(36) NULL,
  direction ENUM('INBOUND','OUTBOUND') NOT NULL,
  sender VARCHAR(40) NOT NULL,
  recipient VARCHAR(40) NOT NULL,
  message_type VARCHAR(30) NOT NULL DEFAULT 'TEXT',
  message_body TEXT NULL,
  provider_message_id VARCHAR(255) NULL,
  status VARCHAR(30) NOT NULL,
  payload JSON NULL,
  created_by CHAR(36) NULL,
  updated_by CHAR(36) NULL,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_whatsapp_message (clinic_id, provider_message_id, is_deleted),
  KEY idx_whatsapp_history (clinic_id, patient_id, created_at, is_deleted)
);

CREATE TABLE IF NOT EXISTS subscription_plans (
  id CHAR(36) PRIMARY KEY,
  clinic_id CHAR(36) NULL,
  code VARCHAR(40) NOT NULL,
  name VARCHAR(140) NOT NULL,
  monthly_price DECIMAL(12,2) NOT NULL DEFAULT 0,
  yearly_price DECIMAL(12,2) NOT NULL DEFAULT 0,
  limits JSON NOT NULL,
  features JSON NOT NULL,
  created_by CHAR(36) NULL,
  updated_by CHAR(36) NULL,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_plan_code (code, is_deleted)
);

CREATE TABLE IF NOT EXISTS clinic_subscriptions (
  id CHAR(36) PRIMARY KEY,
  clinic_id CHAR(36) NOT NULL,
  plan_id CHAR(36) NOT NULL,
  status ENUM('TRIAL','ACTIVE','PAST_DUE','SUSPENDED','CANCELLED') NOT NULL DEFAULT 'TRIAL',
  starts_at DATETIME(3) NOT NULL,
  ends_at DATETIME(3) NULL,
  usage_data JSON NOT NULL,
  created_by CHAR(36) NULL,
  updated_by CHAR(36) NULL,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY idx_subscription_tenant (clinic_id, status, starts_at, ends_at, is_deleted)
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id CHAR(36) PRIMARY KEY,
  clinic_id CHAR(36) NULL,
  actor_user_id CHAR(36) NULL,
  action VARCHAR(80) NOT NULL,
  module_name VARCHAR(80) NOT NULL,
  entity_type VARCHAR(80) NOT NULL,
  entity_id CHAR(36) NULL,
  request_id VARCHAR(80) NULL,
  before_data JSON NULL,
  after_data JSON NULL,
  metadata JSON NULL,
  created_by CHAR(36) NULL,
  updated_by CHAR(36) NULL,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY idx_audit_tenant (clinic_id, module_name, action, created_at)
);

CREATE TABLE IF NOT EXISTS settings (
  id CHAR(36) PRIMARY KEY,
  clinic_id CHAR(36) NULL,
  setting_key VARCHAR(160) NOT NULL,
  setting_value JSON NULL,
  scope ENUM('PLATFORM','CLINIC') NOT NULL DEFAULT 'CLINIC',
  is_encrypted BOOLEAN NOT NULL DEFAULT FALSE,
  created_by CHAR(36) NULL,
  updated_by CHAR(36) NULL,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_setting_key (clinic_id, setting_key, is_deleted),
  KEY idx_settings_tenant (clinic_id, scope, is_deleted)
);
