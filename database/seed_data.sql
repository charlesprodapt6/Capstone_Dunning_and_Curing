-- ============================================================
-- Dunning and Curing Management System - Seed Data
-- Sample data for testing and development
-- ============================================================

-- Insert sample customers
INSERT INTO customers (name, email, phone, customer_type, plan_type, billing_date, due_date, overdue_days, outstanding_amount, dunning_status) VALUES
('Ramesh Kumar', 'ramesh.kumar@email.com', '+91-9876543210', 'POSTPAID', '₹599 Monthly', '2025-10-01', '2025-10-10', 13, 599.00, 'NOTIFIED'),
('Priya Sharma', 'priya.sharma@email.com', '+91-9876543211', 'PREPAID', '1.5GB/day Plan', '2025-10-15', '2025-10-20', 3, 299.00, 'ACTIVE'),
('Amit Patel', 'amit.patel@email.com', '+91-9876543212', 'POSTPAID', '₹799 Monthly', '2025-09-25', '2025-10-05', 18, 799.00, 'RESTRICTED'),
('Sneha Reddy', 'sneha.reddy@email.com', '+91-9876543213', 'POSTPAID', '₹999 Monthly', '2025-10-05', '2025-10-15', 8, 999.00, 'NOTIFIED'),
('Vijay Singh', 'vijay.singh@email.com', '+91-9876543214', 'PREPAID', '2GB/day Plan', '2025-10-18', '2025-10-23', 0, 0.00, 'ACTIVE'),
('Anita Desai', 'anita.desai@email.com', '+91-9876543215', 'POSTPAID', '₹699 Monthly', '2025-09-20', '2025-09-30', 23, 699.00, 'BARRED'),
('Rajesh Verma', 'rajesh.verma@email.com', '+91-9876543216', 'POSTPAID', '₹1299 Monthly', '2025-10-08', '2025-10-18', 5, 1299.00, 'ACTIVE'),
('Kavita Joshi', 'kavita.joshi@email.com', '+91-9876543217', 'PREPAID', '1GB/day Plan', '2025-10-12', '2025-10-17', 6, 199.00, 'NOTIFIED'),
('Suresh Nair', 'suresh.nair@email.com', '+91-9876543218', 'POSTPAID', '₹549 Monthly', '2025-09-28', '2025-10-08', 15, 549.00, 'RESTRICTED'),
('Meera Iyer', 'meera.iyer@email.com', '+91-9876543219', 'POSTPAID', '₹899 Monthly', '2025-10-10', '2025-10-20', 3, 899.00, 'ACTIVE');

-- Insert dunning rules
INSERT INTO dunning_rules (rule_name, customer_type, trigger_day, action_type, notification_channel, priority, is_active) VALUES
('Day 2 Reminder - Postpaid', 'POSTPAID', 2, 'NOTIFY', 'SMS', 1, TRUE),
('Day 2 Reminder - Prepaid', 'PREPAID', 2, 'NOTIFY', 'SMS', 1, TRUE),
('Day 5 Email Alert - Postpaid', 'POSTPAID', 5, 'NOTIFY', 'EMAIL', 2, TRUE),
('Day 5 Email Alert - Prepaid', 'PREPAID', 5, 'NOTIFY', 'EMAIL', 2, TRUE),
('Day 8 Data Throttle - Postpaid', 'POSTPAID', 8, 'THROTTLE', 'ALL', 3, TRUE),
('Day 8 Speed Limit - Prepaid', 'PREPAID', 8, 'THROTTLE', 'ALL', 3, TRUE),
('Day 10 Outgoing Bar - Postpaid', 'POSTPAID', 10, 'BAR_OUTGOING', 'APP', 4, TRUE),
('Day 15 Service Restriction - Postpaid', 'POSTPAID', 15, 'BAR_OUTGOING', 'ALL', 5, TRUE),
('Day 20 Final Notice - Postpaid', 'POSTPAID', 20, 'NOTIFY', 'ALL', 6, TRUE),
('Day 25 Deactivation - Postpaid', 'POSTPAID', 25, 'DEACTIVATE', 'ALL', 7, TRUE),
('Day 10 Prepaid Expiry Warning', 'PREPAID', 10, 'NOTIFY', 'APP', 4, TRUE),
('Day 15 Prepaid Service Bar', 'PREPAID', 15, 'DEACTIVATE', 'ALL', 5, TRUE);

-- Insert sample payments
INSERT INTO payments (customer_id, amount, payment_method, payment_status, transaction_id, payment_date) VALUES
(2, 299.00, 'UPI', 'SUCCESS', 'TXN20251024001', '2025-10-24 09:30:00'),
(5, 399.00, 'CREDIT_CARD', 'SUCCESS', 'TXN20251024002', '2025-10-24 10:15:00'),
(7, 1299.00, 'NET_BANKING', 'SUCCESS', 'TXN20251023001', '2025-10-23 14:20:00'),
(1, 599.00, 'DEBIT_CARD', 'PENDING', 'TXN20251024003', '2025-10-24 11:00:00'),
(10, 899.00, 'WALLET', 'SUCCESS', 'TXN20251022001', '2025-10-22 16:45:00');

-- Insert sample notifications
INSERT INTO notifications (customer_id, rule_id, channel, message, status, sent_at) VALUES
(1, 1, 'SMS', 'Dear Ramesh, your bill of ₹599 is overdue. Please pay to avoid service disruption.', 'DELIVERED', '2025-10-12 10:00:00'),
(1, 3, 'EMAIL', 'Reminder: Your payment of ₹599 is still pending. Due date was 10th Oct.', 'SENT', '2025-10-15 09:00:00'),
(3, 1, 'SMS', 'Dear Amit, your outstanding amount of ₹799 needs immediate attention.', 'DELIVERED', '2025-10-07 11:00:00'),
(3, 5, 'APP', 'Your data speed has been throttled due to payment delay. Pay now to restore.', 'DELIVERED', '2025-10-13 12:00:00'),
(4, 1, 'SMS', 'Dear Sneha, gentle reminder: ₹999 payment is due. Please clear your dues.', 'DELIVERED', '2025-10-17 10:30:00'),
(8, 2, 'SMS', 'Hi Kavita, your prepaid plan of ₹199 is overdue by 6 days.', 'DELIVERED', '2025-10-18 14:00:00'),
(9, 1, 'SMS', 'Dear Suresh, your service may be restricted if payment is not received soon.', 'DELIVERED', '2025-10-10 09:00:00'),
(9, 7, 'APP', 'Your outgoing calls have been barred. Pay ₹549 to restore service.', 'DELIVERED', '2025-10-18 10:00:00'),
(6, 9, 'EMAIL', 'FINAL NOTICE: Clear ₹699 immediately to avoid permanent disconnection.', 'SENT', '2025-10-20 08:00:00');

-- Insert sample curing actions
INSERT INTO curing_actions (customer_id, payment_id, previous_status, action_taken, success_flag, cured_at, remarks) VALUES
(2, 1, 'NOTIFIED', 'Service restored to ACTIVE status. Data speed normalized. SMS confirmation sent.', TRUE, '2025-10-24 09:35:00', 'Customer paid full outstanding amount via UPI'),
(5, 2, 'ACTIVE', 'Payment received before dunning. No restoration needed.', TRUE, '2025-10-24 10:20:00', 'Proactive payment'),
(7, 3, 'NOTIFIED', 'Full service access restored. Dunning status cleared.', TRUE, '2025-10-23 14:25:00', 'Payment via net banking successful'),
(10, 5, 'NOTIFIED', 'All restrictions lifted. Customer account status updated to ACTIVE.', TRUE, '2025-10-22 16:50:00', 'Wallet payment successful');

-- Insert sample dunning logs
INSERT INTO dunning_logs (customer_id, rule_id, action_type, status, details, created_at) VALUES
(1, 1, 'NOTIFY', 'SUCCESS', '{"channel": "SMS", "message_sent": true, "overdue_days": 2}', '2025-10-12 10:00:00'),
(1, 3, 'NOTIFY', 'SUCCESS', '{"channel": "EMAIL", "message_sent": true, "overdue_days": 5}', '2025-10-15 09:00:00'),
(3, 1, 'NOTIFY', 'SUCCESS', '{"channel": "SMS", "message_sent": true, "overdue_days": 2}', '2025-10-07 11:00:00'),
(3, 5, 'THROTTLE', 'SUCCESS', '{"action": "data_throttle", "speed_limited_to": "512kbps", "overdue_days": 8}', '2025-10-13 12:00:00'),
(4, 1, 'NOTIFY', 'SUCCESS', '{"channel": "SMS", "message_sent": true, "overdue_days": 2}', '2025-10-17 10:30:00'),
(6, 7, 'BAR_OUTGOING', 'SUCCESS', '{"action": "outgoing_barred", "service_type": "voice", "overdue_days": 10}', '2025-10-10 10:00:00'),
(6, 9, 'NOTIFY', 'SUCCESS', '{"channel": "ALL", "final_notice": true, "overdue_days": 20}', '2025-10-20 08:00:00'),
(9, 1, 'NOTIFY', 'SUCCESS', '{"channel": "SMS", "message_sent": true, "overdue_days": 2}', '2025-10-10 09:00:00'),
(9, 7, 'BAR_OUTGOING', 'SUCCESS', '{"action": "outgoing_barred", "overdue_days": 15}', '2025-10-18 10:00:00');

-- ============================================================
-- End of Seed Data
-- ============================================================

-- Display counts
SELECT 'Data Loaded Successfully' AS Status;
SELECT 'Customers' as Table_Name, COUNT(*) as Record_Count FROM customers
UNION ALL
SELECT 'Dunning Rules', COUNT(*) FROM dunning_rules
UNION ALL
SELECT 'Payments', COUNT(*) FROM payments
UNION ALL
SELECT 'Notifications', COUNT(*) FROM notifications
UNION ALL
SELECT 'Curing Actions', COUNT(*) FROM curing_actions
UNION ALL
SELECT 'Dunning Logs', COUNT(*) FROM dunning_logs;
