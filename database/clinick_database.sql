-- Clinick dental clinic database

CREATE DATABASE IF NOT EXISTS clinick
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE clinick;

CREATE TABLE IF NOT EXISTS users (
  user_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin', 'staff', 'patient') NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS patients (
  patient_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL UNIQUE,
  phone VARCHAR(30),
  address VARCHAR(255),
  CONSTRAINT fk_patients_user
    FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS providers (
  provider_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL UNIQUE,
  specialty VARCHAR(100),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  CONSTRAINT fk_providers_user
    FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS services (
  service_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  service_name VARCHAR(100) NOT NULL UNIQUE,
  description VARCHAR(255),
  duration_minutes SMALLINT UNSIGNED NOT NULL DEFAULT 30,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS appointments (
  appointment_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  patient_id INT UNSIGNED NOT NULL,
  provider_id INT UNSIGNED NOT NULL,
  service_id INT UNSIGNED NOT NULL,
  starts_at DATETIME NOT NULL,
  ends_at DATETIME NOT NULL,
  reason VARCHAR(500),
  status ENUM('pending', 'confirmed', 'completed', 'cancelled', 'no_show')
    NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_appointments_patient
    FOREIGN KEY (patient_id) REFERENCES patients(patient_id),
  CONSTRAINT fk_appointments_provider
    FOREIGN KEY (provider_id) REFERENCES providers(provider_id),
  CONSTRAINT fk_appointments_service
    FOREIGN KEY (service_id) REFERENCES services(service_id),
  CONSTRAINT chk_appointment_times CHECK (ends_at > starts_at),
  INDEX idx_appointments_calendar (starts_at, status),
  INDEX idx_appointments_provider_time (provider_id, starts_at, ends_at),
  INDEX idx_appointments_patient_time (patient_id, starts_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS notifications (
  notification_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  appointment_id INT UNSIGNED NULL,
  title VARCHAR(120) NOT NULL,
  message VARCHAR(500) NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notifications_user
    FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON DELETE CASCADE,
  CONSTRAINT fk_notifications_appointment
    FOREIGN KEY (appointment_id) REFERENCES appointments(appointment_id)
    ON DELETE SET NULL,
  INDEX idx_notifications_user_read (user_id, is_read, created_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS clinic_settings (
  setting_key VARCHAR(80) PRIMARY KEY,
  setting_value VARCHAR(255) NOT NULL
) ENGINE=InnoDB;

INSERT IGNORE INTO services (service_name, description, duration_minutes, price)
VALUES
  ('Dental Cleaning', 'Routine teeth cleaning', 45, 1000.00),
  ('Dental Check-up', 'General dental examination', 30, 500.00),
  ('Tooth Extraction', 'Tooth extraction consultation and treatment', 60, 1500.00),
  ('Dental Consultation', 'Consultation with a dental provider', 30, 300.00);

INSERT IGNORE INTO clinic_settings (setting_key, setting_value)
VALUES
  ('clinic_name', 'Meija-Domingo Dental Clinic'),
  ('clinic_contact', '0912 345 6789'),
  ('clinic_email', 'clinic@clinick.com'),
  ('clinic_hours', '8:00 AM - 5:00 PM');
