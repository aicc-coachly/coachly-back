CREATE TABLE chat_room (
    room_id SERIAL PRIMARY KEY NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    delete_at TIMESTAMP NULL,
    status BOOLEAN NOT NULL DEFAULT TRUE,
    user_number INT REFERENCES users(user_number),
    trainer_number INT REFERENCES trainers(trainer_number)
);

-- 정혜현 수정사항
-- CREATE TABLE chat_room (
--     room_id SERIAL PRIMARY KEY,
--     user_number INT NOT NULL,          -- 회원 ID
--     trainer_number INT,                -- 트레이너 ID (AI 채팅방은 NULL 가능)
--     type VARCHAR(20) NOT NULL,         -- 채팅방 유형 ('trainer' 또는 'ai')
--     status VARCHAR(20) DEFAULT 'active',
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     delete_at TIMESTAMP
-- );


CREATE TABLE chat_message (
    message_number SERIAL PRIMARY KEY NOT NULL,
    sender_name VARCHAR(50) NOT NULL,
    content VARCHAR(255) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(10) NOT NULL CHECK (status IN ('unread', 'read', 'deleted')) DEFAULT 'unread',
    delete_at TIMESTAMP NULL,
    room_id INT REFERENCES chat_room(room_id)
);