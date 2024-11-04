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

CREATE TABLE service_option (
    service_number SERIAL PRIMARY KEY NOT NULL,
    service_name VARCHAR(15) UNIQUE NOT NULL
);

CREATE TABLE service_link (
    service_number INT REFERENCES service_option(service_number),
    trainer_number INT REFERENCES trainers(trainer_number)
);

CREATE TABLE user_refund (
    refund_number SERIAL PRIMARY KEY NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'completed', 'canceled', 'delete')) DEFAULT 'pending',
    refund_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    refund_completed_date DATE NULL,
    account VARCHAR(50) NULL,
    bank_name VARCHAR(50) NULL,
    account_name VARCHAR(50) NULL,
    pt_number INT REFERENCES pt_schedule(pt_number)
);

CREATE TABLE user_refund_reason (
    refund_reason_id SERIAL PRIMARY KEY NOT NULL,
    refund_reason VARCHAR(255) NULL,
    status BOOLEAN NOT NULL DEFAULT TRUE,
    refund_number INT REFERENCES user_refund(refund_number)
);