CREATE TABLE `users` (
	`user_number` INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
	`user_id` VARCHAR(50) UNIQUE NOT NULL,
	`user_pass` VARCHAR(255) NOT NULL,
	`user_email` VARCHAR(100) UNIQUE NOT NULL,
	`user_name` VARCHAR(100) NOT NULL,
	`user_date_of_birth` DATE NOT NULL,
	`user_phone` VARCHAR(15) UNIQUE NOT NULL,
	`user_gender` ENUM('male', 'female') NOT NULL,
	`created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` TIMESTAMP NULL,
	`delete_at` TIMESTAMP NULL,
	`status` BOOLEAN NOT NULL DEFAULT TRUE,
);

CREATE TABLE `user_inbody` (
	`user_inbody_number` INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
	`user_height` DECIMAL(5,2) NOT NULL,
	`user_weight` DECIMAL(5,2) NOT NULL,
	`user_body_fat_percentage` DECIMAL(5,2) NOT NULL,
	`user_body_fat_mass` DECIMAL(5,2) NOT NULL,
	`user_muscle_mass` DECIMAL(5,2) NOT NULL,
	`user_metabolic_rate` INT NULL,
	`user_abdominal_fat_amount` DECIMAL(3,2) CHECK(user_abdominal_fat_amount <= 1.2) NULL,
	`user_visceral_fat_level` INT CHECK(user_visceral_fat_level <= 20) NULL,
	`user_total_body_water` DECIMAL(5,2) NULL,
	`user_protein` DECIMAL(5,2) NULL,
	`user_measurement_date` DATE NULL,
	`created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` TIMESTAMP NULL,
	`delete_at` TIMESTAMP NULL,
	`status` BOOLEAN NOT NULL DEFAULT TRUE,
	FOREIGN KEY (`user_number`) REFERENCES `users` (`user_number`)
);

CREATE TABLE `trainers` (
	`trainer_number` INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
	`trainer_id` VARCHAR(50) UNIQUE NOT NULL,
	`trainer_name` VARCHAR(50) NOT NULL,
	`trainer_gender` ENUM('male', 'female') NOT NULL,
	`trainer_phone` VARCHAR(15) UNIQUE NOT NULL,
	`trainer_status` BOOLEAN NOT NULL DEFAULT TRUE,
	`trainer_password` VARCHAR(255) NOT NULL,
	`trainer_created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`trainer_updated_at` TIMESTAMP NULL,
	`trainer_delete_at` TIMESTAMP NULL,
);

CREATE TABLE `chat_room` (
	`room_id` INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
	`created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `delete_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NULL,
	`status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
	FOREIGN KEY (`user_number`) REFERENCES `users` (`user_number`),
	FOREIGN KEY (`trainer_number`) REFERENCES `trainers` (`trainer_number`)
);

CREATE TABLE `chat_message` (
	`message_number` INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
	`sender_name` VARCHAR(50) NOT NULL,
	`content` VARCHAR(255) NOT NULL,
	`timestamp` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NULL,
	`status` ENUM('read', 'unread') NOT NULL DEFAULT 'unread',
	`delete_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NULL,
	FOREIGN KEY (`room_id`) REFERENCES `chat_room` (`room_id`)
);

CREATE TABLE `user_address` (
	`address_number` INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
	`user_zipcode` VARCHAR(255) NOT NULL,
	`user_address` VARCHAR(100) NOT NULL,
	`user_detail_address` VARCHAR(255) NULL,
	`created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` TIMESTAMP NULL,
	`delete_at` TIMESTAMP NULL,
	`status` BOOLEAN NOT NULL DEFAULT TRUE,
	FOREIGN KEY (`user_number`) REFERENCES `users` (`user_number`)
);

CREATE TABLE `trainer_image` (
	`trainer_img_number` INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
	`image` VARCHAR(255) NULL,
	`resume` TEXT NULL,
	`created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` TIMESTAMP NULL,
	`delete_at` TIMESTAMP NULL,
	`status` BOOLEAN NOT NULL DEFAULT TRUE,
	FOREIGN KEY (`trainer_number`) REFERENCES `trainers` (`trainer_number`)
);

CREATE TABLE `gym_address` (
	`gym_number` INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
	`trainer_zipcode` VARCHAR(100) NOT NULL,
	`trainer_address` TEXT NOT NULL,
	`trainer_detail_address` TEXT NULL,
	`created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` TIMESTAMP NULL,
	`delete_at` TIMESTAMP NULL,
	`status` BOOLEAN NOT NULL DEFAULT TRUE,
	FOREIGN KEY (`trainer_number`) REFERENCES `trainers` (`trainer_number`)
);

CREATE TABLE `service_option` (
	`service_number` INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
	`service_name` VARCHAR(15) UNIQUE NOT NULL
);

CREATE TABLE `service_link` (
	FOREIGN KEY (`service_number`) REFERENCES `service_option` (`service_number`),
	FOREIGN KEY (`trainer_number`) REFERENCES `trainers` (`trainer_number`)
);

CREATE TABLE `pt_cost_option` (
	`amount_number` INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
	`option` VARCHAR(50) NULL,
	`amount` VARCHAR(50) NULL,
	`frequency` VARCHAR(50) NULL,
	`update` TIMESTAMP NULL,
	`created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `delete_at` TIMESTAMP NULL,
	`status` BOOLEAN NOT NULL DEFAULT TRUE,
	FOREIGN KEY (`trainer_number`) REFERENCES `trainers` (`trainer_number`)
);

CREATE TABLE `pt_schedule` (
	`pt_number` INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
	`created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`status` ENUM('completed', 'cancelled', 'progress', 'refunded') NOT NULL DEFAULT 'progress',
	FOREIGN KEY (`amount_number`) REFERENCES `pt_amount` (`amount_number`),
	FOREIGN KEY (`user_number`) REFERENCES `users` (`user_number`),
	FOREIGN KEY (`trainer_number`) REFERENCES `trainers` (`trainer_number`)
);

CREATE TABLE `pt_payment` (
	`payment_number` INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
	`created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`payments_status` BOOLEAN NOT NULL DEFAULT FALSE,
	`payment_option` VARCHAR(50) NULL,
	FOREIGN KEY (`pt_number`) REFERENCES `pt_schedule` (`pt_number`)
);

CREATE TABLE `payment_completed` (
	`payment_id_completed` INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
	`payments_key` VARCHAR(50) UNIQUE,
	FOREIGN KEY (`payment_number`) REFERENCES `pt_payment` (`payment_number`)
);

CREATE TABLE `user_refund` (
	`refund_number` INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
	`status` ENUM('Pending Refund', 'Refund Completed', 'Refund Denied') NOT NULL DEFAULT 'Pending Refund',
    `refund_date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	`refund_completed_date` DATE NULL,
	`account` VARCHAR(50) NULL,
	`bank_name` VARCHAR(50) NULL,
	`account_name` VARCHAR(50) NULL,
	FOREIGN KEY (`pt_number`) REFERENCES `pt_schedule` (`pt_number`)
);

CREATE TABLE `schedule_records` (
	`schedule_number` INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
	`class_date` DATE NOT NULL,
	`time` TIME NOT NULL,
	`address` VARCHAR(50) NOT NULL,
	`status` ENUM('registered', 'completed', 'cancelled') NOT NULL DEFAULT 'registered',
	`created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NULL,
	`delete_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NULL,
	FOREIGN KEY (`pt_number`) REFERENCES `pt_schedule` (`pt_number`)
);

CREATE TABLE `paycheck` (
	`paycheck_number` INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
	`created_at` TIMESTAMP NULL,
	FOREIGN KEY (`schedule_number`) REFERENCES `schedule_records` (`schedule_number`),
	FOREIGN KEY (`trainer_account_number`) REFERENCES `trainer_account` (`trainer_account_number`)
);

CREATE TABLE `paycheck_record` (
	`amount` VARCHAR(50) NULL,
	`paycheck_date` TIMESTAMP NULL,
	`status` BOOLEAN NOT NULL DEFAULT FALSE,,
	FOREIGN KEY (`paycheck_number`) REFERENCES `paycheck` (`paycheck_number`)
);

CREATE TABLE `user_refund_reason` (
	`refund_reason_id` INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
	`refund_reason` VARCHAR(255) NULL,
	`status` BOOLEAN NOT NULL DEFAULT FALSE,
	FOREIGN KEY (`refund_number`) REFERENCES `user_refund` (`refund_number`)
);

CREATE TABLE `trainer_bank_account` (
	`trainer_account_number` INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
	`created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NULL,
	`updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NULL,
	`delete_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NULL,
	`status` BOOLEAN NOT NULL DEFAULT TRUE,
	`account` INT NOT NULL,
	`bank_name` VARCHAR(50) NOT NULL,
	`account_name` VARCHAR(50) NOT NULL,
	FOREIGN KEY (`trainer_number`) REFERENCES `trainers` (`trainer_number`)
);

-- 상태정의 주석주석
