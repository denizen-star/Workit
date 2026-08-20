CREATE TABLE IF NOT EXISTS email_sends (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    template VARCHAR(64) NOT NULL,
    dedupe_key VARCHAR(191) NOT NULL,
    to_email VARCHAR(255) NOT NULL,
    subject VARCHAR(255),
    message_id VARCHAR(255),
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_send (template, dedupe_key),
    INDEX idx_user (user_id),
    INDEX idx_template_sent (template, sent_at)
);
