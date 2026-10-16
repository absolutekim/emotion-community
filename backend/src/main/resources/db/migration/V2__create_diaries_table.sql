CREATE TABLE diaries (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    content TEXT NOT NULL,
    emotion VARCHAR(64) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_diaries_user FOREIGN KEY (user_id) REFERENCES users (id),
    INDEX idx_diaries_user_created (user_id, created_at DESC, id DESC)
);