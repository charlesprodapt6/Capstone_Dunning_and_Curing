-- ============================================================
-- Dunning and Curing Management System - Database Schema
-- MySQL 8.0+
-- ============================================================

-- Drop existing tables if they exist
DROP TABLE IF EXISTS dunning_logs;
DROP TABLE IF EXISTS curing_actions;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS dunning_rules;
DROP TABLE IF EXISTS customers;

-- ============================================================
-- Table: customers
-- Stores customer information and dunning status
-- ============================================================
CREATE TABLE customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    customer_type ENUM('POSTPAID', 'PREPAID') NOT NULL,
    plan_type VARCHAR(50) NOT NULL,
    billing_date DATE,
    due_date DATE,
    overdue_days INT DEFAULT 0,
    outstanding_amount DECIMAL(10, 2) DEFAULT 0.00,
    dunning_status ENUM('ACTIVE', 'NOTIFIED', 'RESTRICTED', 'BARRED', 'CURED') DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_customer_type (customer_type),
    INDEX idx_dunning_status (dunning_status),
    INDEX idx_overdue_days (overdue_days)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Table: dunning_rules
-- Defines rules for dunning actions based on customer type and overdue days
-- ============================================================
CREATE TABLE dunning_rules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rule_name VARCHAR(100) NOT NULL,
    customer_type ENUM('POSTPAID', 'PREPAID', 'ALL') NOT NULL,
    trigger_day INT NOT NULL COMMENT 'Days overdue to trigger this rule',
    action_type ENUM('NOTIFY', 'THROTTLE', 'BAR_OUTGOING', 'DEACTIVATE') NOT NULL,
    notification_channel ENUM('SMS', 'EMAIL', 'APP', 'ALL') NOT NULL,
    priority INT DEFAULT 0 COMMENT 'Higher priority rules execute first',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_customer_type (customer_type),
    INDEX idx_trigger_day (trigger_day),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Table: payments
-- Records all payment transactions
-- ============================================================
CREATE TABLE payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    payment_method ENUM('CREDIT_CARD', 'DEBIT_CARD', 'UPI', 'NET_BANKING', 'WALLET') NOT NULL,
    payment_status ENUM('PENDING', 'SUCCESS', 'FAILED') DEFAULT 'PENDING',
    transaction_id VARCHAR(100) UNIQUE,
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    INDEX idx_customer_id (customer_id),
    INDEX idx_payment_status (payment_status),
    INDEX idx_payment_date (payment_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Table: notifications
-- Logs all notifications sent to customers
-- ============================================================
CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    rule_id INT,
    channel ENUM('SMS', 'EMAIL', 'APP') NOT NULL,
    message TEXT NOT NULL,
    status ENUM('PENDING', 'SENT', 'FAILED', 'DELIVERED') DEFAULT 'PENDING',
    sent_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (rule_id) REFERENCES dunning_rules(id) ON DELETE SET NULL,
    INDEX idx_customer_id (customer_id),
    INDEX idx_status (status),
    INDEX idx_channel (channel)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Table: curing_actions
-- Records curing actions taken after payment
-- ============================================================
CREATE TABLE curing_actions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    payment_id INT NOT NULL,
    previous_status VARCHAR(50) NOT NULL,
    action_taken TEXT NOT NULL COMMENT 'Description of actions taken to restore service',
    success_flag BOOLEAN DEFAULT TRUE,
    cured_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    remarks TEXT,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE,
    INDEX idx_customer_id (customer_id),
    INDEX idx_payment_id (payment_id),
    INDEX idx_cured_at (cured_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Table: dunning_logs
-- Audit trail for all dunning actions
-- ============================================================
CREATE TABLE dunning_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    rule_id INT,
    action_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    details JSON COMMENT 'Additional details in JSON format',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (rule_id) REFERENCES dunning_rules(id) ON DELETE SET NULL,
    INDEX idx_customer_id (customer_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- End of Schema
-- ============================================================
