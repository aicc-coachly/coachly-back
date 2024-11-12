CREATE TABLE pt_schedule (
    pt_number SERIAL PRIMARY KEY NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    status VARCHAR(10) NOT NULL CHECK (status IN ('progress', 'completed', 'canceled', 'refund')) DEFAULT 'progress',
    amount_number INT REFERENCES pt_cost_option(amount_number),
    user_number INT REFERENCES users(user_number),
    trainer_number INT REFERENCES trainers(trainer_number)
);

CREATE TABLE pt_payment (
    payment_number SERIAL PRIMARY KEY NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    payments_status BOOLEAN NOT NULL,
    payment_option VARCHAR(50) NULL,
    pt_number INT REFERENCES pt_schedule(pt_number)
);

CREATE TABLE schedule_records (
    schedule_number SERIAL PRIMARY KEY NOT NULL,
    class_date DATE NOT NULL,
    time TIME NOT NULL,
    address VARCHAR(50) NOT NULL,
    status VARCHAR(10) NOT NULL CHECK (status IN ('registered', 'completed', 'canceled', 'deleted')) DEFAULT 'registered',
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

CREATE TABLE payment_completed (
    payments_key VARCHAR(50) UNIQUE,
    order_id VARCHAR(50) NOT NULL,  -- 주문 ID 컬럼 추가
    amount DECIMAL(10, 2) NOT NULL,  -- 결제 금액 컬럼 추가, 소수점 2자리까지 허용
    payment_number INT REFERENCES pt_payment(payment_number),
);
