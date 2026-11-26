CREATE TABLE community_posts (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    title VARCHAR(200) NOT NULL,
    body TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_community_posts_user FOREIGN KEY (user_id) REFERENCES users (id),
    INDEX idx_community_posts_created (created_at DESC, id DESC)
);