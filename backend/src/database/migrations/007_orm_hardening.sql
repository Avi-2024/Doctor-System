CREATE TABLE IF NOT EXISTS queue_counters (
  id CHAR(36) PRIMARY KEY,
  clinic_id CHAR(36) NOT NULL,
  queue_date DATE NOT NULL,
  next_token INT NOT NULL DEFAULT 1,
  created_by CHAR(36) NULL,
  updated_by CHAR(36) NULL,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_queue_counter_date (clinic_id, queue_date),
  KEY idx_queue_counter_tenant (clinic_id, queue_date, is_deleted),
  CONSTRAINT fk_queue_counter_clinic FOREIGN KEY (clinic_id) REFERENCES clinics(id)
);

ALTER TABLE clinics DROP INDEX uq_clinic_code;
ALTER TABLE clinics
  ADD COLUMN active_unique_key TINYINT GENERATED ALWAYS AS (IF(is_deleted = FALSE, 1, NULL)) STORED,
  ADD UNIQUE KEY uq_clinic_code_active (code, active_unique_key);

ALTER TABLE users DROP INDEX uq_users_tenant_email;
ALTER TABLE users
  ADD COLUMN tenant_unique_key CHAR(36) GENERATED ALWAYS AS (COALESCE(clinic_id, '00000000-0000-0000-0000-000000000000')) STORED,
  ADD COLUMN active_unique_key TINYINT GENERATED ALWAYS AS (IF(is_deleted = FALSE, 1, NULL)) STORED,
  ADD UNIQUE KEY uq_users_email_active (tenant_unique_key, email, active_unique_key);

ALTER TABLE patients DROP INDEX uq_patient_code;
ALTER TABLE patients
  ADD COLUMN active_unique_key TINYINT GENERATED ALWAYS AS (IF(is_deleted = FALSE, 1, NULL)) STORED,
  ADD UNIQUE KEY uq_patient_code_active (clinic_id, patient_code, active_unique_key);

ALTER TABLE invoices DROP INDEX uq_invoice_number;
ALTER TABLE invoices
  ADD COLUMN active_unique_key TINYINT GENERATED ALWAYS AS (IF(is_deleted = FALSE, 1, NULL)) STORED,
  ADD UNIQUE KEY uq_invoice_number_active (clinic_id, invoice_number, active_unique_key);

ALTER TABLE payments DROP INDEX uq_receipt_number;
ALTER TABLE payments
  ADD COLUMN active_unique_key TINYINT GENERATED ALWAYS AS (IF(is_deleted = FALSE, 1, NULL)) STORED,
  ADD UNIQUE KEY uq_receipt_number_active (clinic_id, receipt_number, active_unique_key);

ALTER TABLE whatsapp_messages DROP INDEX uq_whatsapp_message;
ALTER TABLE whatsapp_messages
  ADD COLUMN active_unique_key TINYINT GENERATED ALWAYS AS (IF(is_deleted = FALSE, 1, NULL)) STORED,
  ADD UNIQUE KEY uq_whatsapp_provider_active (clinic_id, provider_message_id, active_unique_key);

ALTER TABLE whatsapp_templates DROP INDEX uq_whatsapp_template;
ALTER TABLE whatsapp_templates
  ADD COLUMN active_unique_key TINYINT GENERATED ALWAYS AS (IF(is_deleted = FALSE, 1, NULL)) STORED,
  ADD UNIQUE KEY uq_whatsapp_template_active (clinic_id, provider_template_name, language_code, active_unique_key);
