CREATE TABLE users (
    user_number SERIAL PRIMARY KEY NOT NULL,
    user_id VARCHAR(50) UNIQUE NOT NULL,
    pass VARCHAR(255) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    birth DATE NOT NULL,
    phone VARCHAR(15) UNIQUE NOT NULL,
    gender VARCHAR(10) NOT NULL CHECK (user_gender IN ('male', 'female')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL,
    delete_at TIMESTAMP NULL,
    status BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE user_inbody (
    user_inbody_number SERIAL PRIMARY KEY NOT NULL,
    user_height DECIMAL(5,2) NOT NULL,
    user_weight DECIMAL(5,2) NOT NULL,
    user_body_fat_percentage DECIMAL(5,2) NOT NULL,
    user_body_fat_mass DECIMAL(5,2) NOT NULL,
    user_muscle_mass DECIMAL(5,2) NOT NULL,
    user_metabolic_rate INT,
    user_abdominal_fat_amount DECIMAL(3,2) CHECK (user_abdominal_fat_amount <= 1.2),
    user_visceral_fat_level INT CHECK (user_visceral_fat_level <= 20),
    user_total_body_water DECIMAL(5,2),
    user_protein DECIMAL(5,2),
    user_measurement_date DATE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL,
    delete_at TIMESTAMP NULL,
    status BOOLEAN NOT NULL DEFAULT TRUE,
    user_number INT REFERENCES users(user_number)
);

CREATE TABLE trainers (
    trainer_number SERIAL PRIMARY KEY NOT NULL,
    trainer_id VARCHAR(50) UNIQUE NOT NULL,
    pass VARCHAR(255) NOT NULL,
    name VARCHAR(50) NOT NULL,
    gender VARCHAR(10) NOT NULL CHECK (gender IN ('male', 'female')),
    phone VARCHAR(15) UNIQUE NOT NULL,
    status BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL,
    delete_at TIMESTAMP NULL
);

CREATE TABLE chat_room (
    room_id SERIAL PRIMARY KEY NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    delete_at TIMESTAMP NULL,
    status VARCHAR(10) NOT NULL DEFAULT 'active',
    user_number INT REFERENCES users(user_number),
    trainer_number INT REFERENCES trainers(trainer_number)
);

CREATE TABLE chat_message (
    message_number SERIAL PRIMARY KEY NOT NULL,
    sender_name VARCHAR(50) NOT NULL,
    content VARCHAR(255) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP NULL,
    status VARCHAR(10) NOT NULL DEFAULT 'unread',
    delete_at TIMESTAMP NULL,
    room_id INT REFERENCES chat_room(room_id)
);

CREATE TABLE user_address (
    address_number SERIAL PRIMARY KEY NOT NULL,
    user_zipcode VARCHAR(255) NOT NULL,
    user_address VARCHAR(100) NOT NULL,
    user_detail_address VARCHAR(255) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL,
    delete_at TIMESTAMP NULL,
    status BOOLEAN NOT NULL DEFAULT TRUE,
    user_number INT REFERENCES users(user_number)
);

CREATE TABLE trainer_image (
    trainer_img_number SERIAL PRIMARY KEY NOT NULL,
    image VARCHAR(255) NULL,
    resume TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL,
    delete_at TIMESTAMP NULL,
    status BOOLEAN NOT NULL DEFAULT TRUE,
    trainer_number INT REFERENCES trainers(trainer_number)
);

CREATE TABLE gym_address (
    gym_number SERIAL PRIMARY KEY NOT NULL,
    trainer_zipcode VARCHAR(100) NOT NULL,
    trainer_address TEXT NOT NULL,
    trainer_detail_address TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL,
    delete_at TIMESTAMP NULL,
    status BOOLEAN NOT NULL DEFAULT TRUE,
    trainer_number INT REFERENCES trainers(trainer_number)
);

CREATE TABLE service_option (
    service_number SERIAL PRIMARY KEY NOT NULL,
    service_name VARCHAR(15) UNIQUE NOT NULL
);

CREATE TABLE service_link (
    service_number INT REFERENCES service_option(service_number),
    trainer_number INT REFERENCES trainers(trainer_number)
);

CREATE TABLE pt_cost_option (
    amount_number SERIAL PRIMARY KEY NOT NULL,
    option VARCHAR(50) NULL,
    amount VARCHAR(50) NULL,
    frequency VARCHAR(50) NULL,
    update TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL,
    delete_at TIMESTAMP NULL,
    status BOOLEAN NOT NULL DEFAULT TRUE,
    trainer_number INT REFERENCES trainers(trainer_number)
);

CREATE TABLE pt_schedule (
    pt_number SERIAL PRIMARY KEY NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    status VARCHAR(10) NOT NULL DEFAULT 'progress',
    amount_number INT REFERENCES pt_cost_option(amount_number),
    user_number INT REFERENCES users(user_number),
    trainer_number INT REFERENCES trainers(trainer_number)
);

CREATE TABLE pt_payment (
    payment_number SERIAL PRIMARY KEY NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    payments_status BOOLEAN NOT NULL DEFAULT FALSE,
    payment_option VARCHAR(50) NULL,
    pt_number INT REFERENCES pt_schedule(pt_number)
);

CREATE TABLE payment_completed (
    payment_id_completed SERIAL PRIMARY KEY NOT NULL,
    payments_key VARCHAR(50) UNIQUE,
    payment_number INT REFERENCES pt_payment(payment_number)
);

CREATE TABLE user_refund (
    refund_number SERIAL PRIMARY KEY NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Pending Refund',
    refund_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    refund_completed_date DATE NULL,
    account VARCHAR(50) NULL,
    bank_name VARCHAR(50) NULL,
    account_name VARCHAR(50) NULL,
    pt_number INT REFERENCES pt_schedule(pt_number)
);

CREATE TABLE schedule_records (
    schedule_number SERIAL PRIMARY KEY NOT NULL,
    class_date DATE NOT NULL,
    time TIME NOT NULL,
    address VARCHAR(50) NOT NULL,
    status VARCHAR(10) NOT NULL DEFAULT 'registered',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NULL,
    delete_at TIMESTAMP NULL,
    pt_number INT REFERENCES pt_schedule(pt_number)
);

CREATE TABLE paycheck (
    paycheck_number SERIAL PRIMARY KEY NOT NULL,
    created_at TIMESTAMP NULL,
    schedule_number INT REFERENCES schedule_records(schedule_number),
    trainer_account_number INT REFERENCES trainer_bank_account(trainer_account_number)
);

CREATE TABLE paycheck_record (
    amount VARCHAR(50) NULL,
    paycheck_date TIMESTAMP NULL,
    status BOOLEAN NOT NULL DEFAULT FALSE,
    paycheck_number INT REFERENCES paycheck(paycheck_number)
);

CREATE TABLE user_refund_reason (
    refund_reason_id SERIAL PRIMARY KEY NOT NULL,
    refund_reason VARCHAR(255) NULL,
    status BOOLEAN NOT NULL DEFAULT FALSE,
    refund_number INT REFERENCES user_refund(refund_number)
);

CREATE TABLE trainer_bank_account (
    trainer_account_number SERIAL PRIMARY KEY NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    delete_at TIMESTAMP NULL,
    status BOOLEAN NOT NULL DEFAULT TRUE,
    account INT NOT NULL,
    bank_name VARCHAR(50) NOT NULL,
    account_name VARCHAR(50) NOT NULL,
    trainer_number INT REFERENCES trainers(trainer_number)
);
