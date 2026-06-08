ALTER TABLE notifications
  ADD COLUMN last_error VARCHAR(1000) NULL AFTER attempts,
  ADD KEY idx_notification_stale (status, updated_at, attempts, is_deleted);
