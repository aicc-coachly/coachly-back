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

CREATE TABLE trainer_bank_account (
    trainer_account_number SERIAL PRIMARY KEY NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    delete_at TIMESTAMP NULL,
    status BOOLEAN NOT NULL DEFAULT TRUE,
    account VARCHAR(50) NOT NULL, -- 계좌번호를 VARCHAR로 변경
    bank_name VARCHAR(50) NOT NULL,
    account_name VARCHAR(50) NOT NULL,
    trainer_number INT REFERENCES trainers(trainer_number)
);
