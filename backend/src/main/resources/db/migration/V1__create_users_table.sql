CREATE TABLE users (
    id BIGINT NOT NULL AUTO_INCREMENT,
    login_id VARCHAR(64) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT uk_users_login_id UNIQUE (login_id)
);