CREATE TABLE IF NOT EXISTS email_archive (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    athlete_name VARCHAR(255) NULL,
    to_email VARCHAR(255) NOT NULL,
    from_display VARCHAR(255) NULL,
    from_email VARCHAR(255) NULL,
    template VARCHAR(64) NULL,
    subject VARCHAR(255) NULL,
    body_text MEDIUMTEXT NULL,
    message_id VARCHAR(255) NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_archive_sent (sent_at),
    INDEX idx_archive_template (template, sent_at),
    INDEX idx_archive_user (user_id)
);
