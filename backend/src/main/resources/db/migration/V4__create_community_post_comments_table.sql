CREATE TABLE community_post_comments (
    id BIGINT NOT NULL AUTO_INCREMENT,
    post_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    body TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_community_post_comments_post FOREIGN KEY (post_id) REFERENCES community_posts (id) ON DELETE CASCADE,
    CONSTRAINT fk_community_post_comments_user FOREIGN KEY (user_id) REFERENCES users (id),
    INDEX idx_community_post_comments_post_created (post_id, created_at ASC, id ASC)
);