CREATE TABLE IF NOT EXISTS invoice_items (
  id CHAR(36) PRIMARY KEY,
  clinic_id CHAR(36) NOT NULL,
  invoice_id CHAR(36) NOT NULL,
  description VARCHAR(500) NOT NULL,
  quantity DECIMAL(12,3) NOT NULL,
  unit_price DECIMAL(12,2) NOT NULL,
  total_amount DECIMAL(12,2) NOT NULL,
  created_by CHAR(36) NULL,
  updated_by CHAR(36) NULL,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY idx_invoice_items_tenant_invoice (clinic_id, invoice_id, is_deleted),
  CONSTRAINT fk_invoice_item_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id)
);

CREATE TABLE IF NOT EXISTS lab_order_items (
  id CHAR(36) PRIMARY KEY,
  clinic_id CHAR(36) NOT NULL,
  lab_order_id CHAR(36) NOT NULL,
  lab_test_id CHAR(36) NULL,
  test_name VARCHAR(200) NOT NULL,
  price DECIMAL(12,2) NOT NULL DEFAULT 0,
  status ENUM('ORDERED','SENT_TO_LAB','REPORT_RECEIVED','CANCELLED') NOT NULL DEFAULT 'ORDERED',
  result_data JSON NULL,
  created_by CHAR(36) NULL,
  updated_by CHAR(36) NULL,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY idx_lab_order_items_tenant_order (clinic_id, lab_order_id, status, is_deleted),
  CONSTRAINT fk_lab_order_item_order FOREIGN KEY (lab_order_id) REFERENCES lab_orders(id),
  CONSTRAINT fk_lab_order_item_test FOREIGN KEY (lab_test_id) REFERENCES lab_tests(id)
);
