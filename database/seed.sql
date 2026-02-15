-- ============================================================
-- Three Seas Digital — Seed Data
-- Created: 2026-02-09
-- Purpose: Default data for a fresh installation. Inserts the
--          5 default email templates matching the frontend.
-- Usage:   mysql -u root -p three_seas_digital < seed.sql
-- Prereq:  Run schema.sql first.
-- ============================================================

-- Default email templates (5 templates matching frontend defaults)
INSERT INTO email_templates (id, name, subject, body, category, is_default) VALUES
(UUID(), 'Invoice Reminder', 'Payment Reminder - Invoice #{invoiceId}', 'Hi {clientName},\n\nThis is a friendly reminder that invoice #{invoiceId} for ${amount} is due on {dueDate}.\n\nPlease let us know if you have any questions.\n\nBest regards,\nThree Seas Digital', 'invoice', TRUE),
(UUID(), 'Appointment Confirmation', 'Your Appointment is Confirmed', 'Hi {clientName},\n\nYour appointment has been confirmed for {date} at {time}.\n\nService: {service}\n\nWe look forward to meeting with you!\n\nBest regards,\nThree Seas Digital', 'appointment', TRUE),
(UUID(), 'Follow-Up', 'Following Up on Our Conversation', 'Hi {clientName},\n\nThank you for taking the time to speak with us. We wanted to follow up on our conversation about {service}.\n\nPlease don''t hesitate to reach out if you have any questions.\n\nBest regards,\nThree Seas Digital', 'follow-up', TRUE),
(UUID(), 'Project Complete', 'Your Project is Complete!', 'Hi {clientName},\n\nGreat news! Your project "{projectName}" has been completed.\n\nPlease review the deliverables and let us know if you need any adjustments.\n\nThank you for choosing Three Seas Digital!\n\nBest regards,\nThree Seas Digital', 'project', TRUE),
(UUID(), 'Welcome', 'Welcome to Three Seas Digital!', 'Hi {clientName},\n\nWelcome aboard! We''re excited to work with you.\n\nYour account has been set up and you can access your client portal at any time.\n\nIf you have any questions, don''t hesitate to reach out.\n\nBest regards,\nThree Seas Digital', 'general', TRUE);
