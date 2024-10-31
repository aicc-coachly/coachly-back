CREATE TABLE chat_room (
    room_id SERIAL PRIMARY KEY NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    delete_at TIMESTAMP NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    user_number INT REFERENCES users(user_number),
    trainer_number INT REFERENCES trainers(trainer_number)
);

CREATE TABLE chat_message (
    message_number SERIAL PRIMARY KEY NOT NULL,
    sender_name VARCHAR(50) NOT NULL,
    content VARCHAR(255) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(10) NOT NULL CHECK (status IN ('unread', 'read', 'deleted')) DEFAULT 'unread',
    delete_at TIMESTAMP NULL,
    room_id INT REFERENCES chat_room(room_id)
);