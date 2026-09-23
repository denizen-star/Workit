CREATE TABLE IF NOT EXISTS coach_voice_clips (
    id INT AUTO_INCREMENT PRIMARY KEY,
    voice_id VARCHAR(32) NOT NULL,
    eleven_voice_id VARCHAR(64) NOT NULL,
    bucket VARCHAR(32) NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    clip_key CHAR(64) NOT NULL,
    template TEXT NOT NULL,
    spoken_text TEXT NOT NULL,
    audio MEDIUMBLOB NOT NULL,
    bytes INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_coach_clip (voice_id, clip_key)
);
