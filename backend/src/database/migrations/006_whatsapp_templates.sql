CREATE TABLE IF NOT EXISTS whatsapp_templates (
  id CHAR(36) PRIMARY KEY,
  clinic_id CHAR(36) NOT NULL,
  name VARCHAR(160) NOT NULL,
  provider_template_name VARCHAR(160) NOT NULL,
  language_code VARCHAR(20) NOT NULL DEFAULT 'en_US',
  category ENUM('AUTHENTICATION','MARKETING','UTILITY') NOT NULL DEFAULT 'UTILITY',
  status ENUM('DRAFT','PENDING','APPROVED','REJECTED','DISABLED') NOT NULL DEFAULT 'DRAFT',
  components JSON NOT NULL,
  created_by CHAR(36) NULL,
  updated_by CHAR(36) NULL,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_whatsapp_template (clinic_id, provider_template_name, language_code, is_deleted),
  KEY idx_whatsapp_template_status (clinic_id, status, category, is_deleted),
  CONSTRAINT fk_whatsapp_template_clinic FOREIGN KEY (clinic_id) REFERENCES clinics(id)
);
