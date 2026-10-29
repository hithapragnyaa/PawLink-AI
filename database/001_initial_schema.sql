-- ============================================================
-- PawLink AI
-- Initial PostgreSQL Database Schema
-- ============================================================

-- ------------------------------------------------------------
-- Extensions
-- ------------------------------------------------------------

CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ============================================================
-- ENUM TYPES
-- ============================================================

CREATE TYPE user_status AS ENUM (
    'ACTIVE',
    'INACTIVE',
    'SUSPENDED'
);

CREATE TYPE animal_gender AS ENUM (
    'MALE',
    'FEMALE',
    'UNKNOWN'
);

CREATE TYPE animal_status AS ENUM (
    'REPORTED',
    'RESCUED',
    'UNDER_TREATMENT',
    'IN_SHELTER',
    'AVAILABLE_FOR_ADOPTION',
    'ADOPTION_PENDING',
    'ADOPTED',
    'RELEASED',
    'DECEASED'
);

CREATE TYPE rescue_priority AS ENUM (
    'HIGH',
    'MEDIUM',
    'LOW'
);

CREATE TYPE rescue_report_status AS ENUM (
    'SUBMITTED',
    'VALIDATED',
    'REJECTED',
    'CONVERTED_TO_CASE'
);

CREATE TYPE rescue_case_status AS ENUM (
    'OPEN',
    'ASSIGNED',
    'IN_PROGRESS',
    'RESCUED',
    'MEDICAL_CARE',
    'SHELTERED',
    'CLOSED',
    'CANCELLED'
);

CREATE TYPE assignment_status AS ENUM (
    'PENDING',
    'ACCEPTED',
    'REJECTED',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED'
);

CREATE TYPE adoption_status AS ENUM (
    'AVAILABLE',
    'APPLICATION_SUBMITTED',
    'UNDER_REVIEW',
    'APPROVED',
    'REJECTED',
    'COMPLETED',
    'CANCELLED'
);

CREATE TYPE notification_type AS ENUM (
    'RESCUE',
    'ASSIGNMENT',
    'MEDICAL',
    'ADOPTION',
    'SYSTEM'
);


-- ============================================================
-- ROLES
-- ============================================================

CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(50) NOT NULL UNIQUE,

    description TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- ORGANIZATIONS
-- ============================================================

CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(150) NOT NULL,

    email VARCHAR(255),

    phone VARCHAR(30),

    address TEXT,

    city VARCHAR(100),

    state VARCHAR(100),

    country VARCHAR(100),

    description TEXT,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- USERS
-- ============================================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    organization_id UUID NOT NULL,

    role_id UUID NOT NULL,

    first_name VARCHAR(100) NOT NULL,

    last_name VARCHAR(100) NOT NULL,

    email VARCHAR(255) NOT NULL,

    password_hash TEXT NOT NULL,

    phone VARCHAR(30),

    status user_status NOT NULL DEFAULT 'ACTIVE',

    last_login_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_users_organization
        FOREIGN KEY (organization_id)
        REFERENCES organizations(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_users_role
        FOREIGN KEY (role_id)
        REFERENCES roles(id)
        ON DELETE RESTRICT,

    CONSTRAINT uq_users_org_email
        UNIQUE (organization_id, email)
);


-- ============================================================
-- ANIMALS
-- ============================================================

CREATE TABLE animals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    organization_id UUID NOT NULL,

    name VARCHAR(100),

    animal_type VARCHAR(100) NOT NULL,

    breed VARCHAR(100),

    gender animal_gender NOT NULL DEFAULT 'UNKNOWN',

    age_years NUMERIC(5,2),

    color VARCHAR(100),

    weight_kg NUMERIC(6,2),

    status animal_status NOT NULL DEFAULT 'REPORTED',

    identification_marks TEXT,

    description TEXT,

    photo_url TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_animals_organization
        FOREIGN KEY (organization_id)
        REFERENCES organizations(id)
        ON DELETE CASCADE,

    CONSTRAINT chk_animals_age
        CHECK (age_years IS NULL OR age_years >= 0),

    CONSTRAINT chk_animals_weight
        CHECK (weight_kg IS NULL OR weight_kg > 0)
);


-- ============================================================
-- RESCUE REPORTS
-- ============================================================

CREATE TABLE rescue_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    organization_id UUID NOT NULL,

    reporter_user_id UUID,

    animal_id UUID,

    animal_type VARCHAR(100) NOT NULL,

    age_group VARCHAR(50),

    injury_severity INTEGER,

    visible_bleeding BOOLEAN NOT NULL DEFAULT FALSE,

    mobility_status VARCHAR(100),

    consciousness VARCHAR(100),

    breathing_difficulty BOOLEAN NOT NULL DEFAULT FALSE,

    time_since_injury_hours NUMERIC(8,2),

    location_type VARCHAR(100),

    traffic_risk VARCHAR(50),

    weather_condition VARCHAR(100),

    previous_reports INTEGER NOT NULL DEFAULT 0,

    reporter_confidence NUMERIC(5,2),

    latitude NUMERIC(10,7),

    longitude NUMERIC(10,7),

    address TEXT,

    description TEXT,

    image_url TEXT,

    status rescue_report_status NOT NULL DEFAULT 'SUBMITTED',

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_rescue_reports_organization
        FOREIGN KEY (organization_id)
        REFERENCES organizations(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_rescue_reports_reporter
        FOREIGN KEY (reporter_user_id)
        REFERENCES users(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_rescue_reports_animal
        FOREIGN KEY (animal_id)
        REFERENCES animals(id)
        ON DELETE SET NULL,

    CONSTRAINT chk_injury_severity
        CHECK (
            injury_severity IS NULL
            OR injury_severity BETWEEN 1 AND 5
        ),

    CONSTRAINT chk_reporter_confidence
        CHECK (
            reporter_confidence IS NULL
            OR reporter_confidence BETWEEN 0 AND 100
        ),

    CONSTRAINT chk_previous_reports
        CHECK (previous_reports >= 0)
);


-- ============================================================
-- ML PREDICTIONS
-- ============================================================

CREATE TABLE ml_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    rescue_report_id UUID NOT NULL UNIQUE,

    predicted_priority rescue_priority NOT NULL,

    confidence_score NUMERIC(5,2) NOT NULL,

    model_version VARCHAR(100) NOT NULL,

    prediction_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    feature_snapshot JSONB,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_ml_predictions_report
        FOREIGN KEY (rescue_report_id)
        REFERENCES rescue_reports(id)
        ON DELETE CASCADE,

    CONSTRAINT chk_prediction_confidence
        CHECK (
            confidence_score BETWEEN 0 AND 100
        )
);


-- ============================================================
-- RESCUE CASES
-- ============================================================

CREATE TABLE rescue_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    organization_id UUID NOT NULL,

    rescue_report_id UUID NOT NULL UNIQUE,

    animal_id UUID,

    final_priority rescue_priority NOT NULL,

    admin_decision BOOLEAN,

    admin_decided_by UUID,

    admin_decision_reason TEXT,

    status rescue_case_status NOT NULL DEFAULT 'OPEN',

    rescued_at TIMESTAMPTZ,

    closed_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_rescue_cases_organization
        FOREIGN KEY (organization_id)
        REFERENCES organizations(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_rescue_cases_report
        FOREIGN KEY (rescue_report_id)
        REFERENCES rescue_reports(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_rescue_cases_animal
        FOREIGN KEY (animal_id)
        REFERENCES animals(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_rescue_cases_admin
        FOREIGN KEY (admin_decided_by)
        REFERENCES users(id)
        ON DELETE SET NULL
);


-- ============================================================
-- VOLUNTEER ASSIGNMENTS
-- ============================================================

CREATE TABLE volunteer_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    rescue_case_id UUID NOT NULL,

    volunteer_id UUID NOT NULL,

    assigned_by UUID,

    status assignment_status NOT NULL DEFAULT 'PENDING',

    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    accepted_at TIMESTAMPTZ,

    completed_at TIMESTAMPTZ,

    notes TEXT,

    CONSTRAINT fk_assignments_case
        FOREIGN KEY (rescue_case_id)
        REFERENCES rescue_cases(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_assignments_volunteer
        FOREIGN KEY (volunteer_id)
        REFERENCES users(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_assignments_assigned_by
        FOREIGN KEY (assigned_by)
        REFERENCES users(id)
        ON DELETE SET NULL
);


-- ============================================================
-- MEDICAL RECORDS
-- ============================================================

CREATE TABLE medical_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    organization_id UUID NOT NULL,

    animal_id UUID NOT NULL,

    veterinarian_id UUID,

    diagnosis TEXT,

    treatment TEXT,

    medications TEXT,

    vaccination_history TEXT,

    injury_details TEXT,

    medical_notes TEXT,

    record_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    follow_up_date TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_medical_organization
        FOREIGN KEY (organization_id)
        REFERENCES organizations(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_medical_animal
        FOREIGN KEY (animal_id)
        REFERENCES animals(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_medical_veterinarian
        FOREIGN KEY (veterinarian_id)
        REFERENCES users(id)
        ON DELETE SET NULL
);


-- ============================================================
-- SHELTERS
-- ============================================================

CREATE TABLE shelters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    organization_id UUID NOT NULL,

    name VARCHAR(150) NOT NULL,

    address TEXT,

    city VARCHAR(100),

    state VARCHAR(100),

    capacity INTEGER,

    contact_phone VARCHAR(30),

    description TEXT,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_shelters_organization
        FOREIGN KEY (organization_id)
        REFERENCES organizations(id)
        ON DELETE CASCADE,

    CONSTRAINT chk_shelter_capacity
        CHECK (capacity IS NULL OR capacity >= 0)
);


-- ============================================================
-- SHELTER STAYS
-- ============================================================

CREATE TABLE shelter_stays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    animal_id UUID NOT NULL,

    shelter_id UUID NOT NULL,

    check_in_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    check_out_at TIMESTAMPTZ,

    kennel_number VARCHAR(50),

    notes TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_shelter_stays_animal
        FOREIGN KEY (animal_id)
        REFERENCES animals(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_shelter_stays_shelter
        FOREIGN KEY (shelter_id)
        REFERENCES shelters(id)
        ON DELETE CASCADE,

    CONSTRAINT chk_shelter_dates
        CHECK (
            check_out_at IS NULL
            OR check_out_at >= check_in_at
        )
);


-- ============================================================
-- ADOPTIONS
-- ============================================================

CREATE TABLE adoptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    organization_id UUID NOT NULL,

    animal_id UUID NOT NULL,

    adopter_id UUID NOT NULL,

    coordinator_id UUID,

    status adoption_status NOT NULL DEFAULT 'APPLICATION_SUBMITTED',

    application_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    review_date TIMESTAMPTZ,

    completion_date TIMESTAMPTZ,

    application_notes TEXT,

    rejection_reason TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_adoptions_organization
        FOREIGN KEY (organization_id)
        REFERENCES organizations(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_adoptions_animal
        FOREIGN KEY (animal_id)
        REFERENCES animals(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_adoptions_adopter
        FOREIGN KEY (adopter_id)
        REFERENCES users(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_adoptions_coordinator
        FOREIGN KEY (coordinator_id)
        REFERENCES users(id)
        ON DELETE SET NULL
);


-- ============================================================
-- NOTIFICATIONS
-- ============================================================

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    organization_id UUID NOT NULL,

    user_id UUID NOT NULL,

    type notification_type NOT NULL,

    title VARCHAR(200) NOT NULL,

    message TEXT NOT NULL,

    related_entity_type VARCHAR(100),

    related_entity_id UUID,

    is_read BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    read_at TIMESTAMPTZ,

    CONSTRAINT fk_notifications_organization
        FOREIGN KEY (organization_id)
        REFERENCES organizations(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_notifications_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);


-- ============================================================
-- ML FEEDBACK
-- ============================================================

CREATE TABLE ml_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    ml_prediction_id UUID NOT NULL UNIQUE,

    reviewed_by UUID,

    actual_priority rescue_priority,

    was_correct BOOLEAN,

    feedback_notes TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_ml_feedback_prediction
        FOREIGN KEY (ml_prediction_id)
        REFERENCES ml_predictions(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_ml_feedback_reviewer
        FOREIGN KEY (reviewed_by)
        REFERENCES users(id)
        ON DELETE SET NULL
);


-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_users_organization
    ON users(organization_id);

CREATE INDEX idx_users_role
    ON users(role_id);

CREATE INDEX idx_animals_organization
    ON animals(organization_id);

CREATE INDEX idx_animals_status
    ON animals(status);

CREATE INDEX idx_rescue_reports_organization
    ON rescue_reports(organization_id);

CREATE INDEX idx_rescue_reports_status
    ON rescue_reports(status);

CREATE INDEX idx_rescue_reports_created_at
    ON rescue_reports(created_at);

CREATE INDEX idx_rescue_cases_organization
    ON rescue_cases(organization_id);

CREATE INDEX idx_rescue_cases_status
    ON rescue_cases(status);

CREATE INDEX idx_rescue_cases_priority
    ON rescue_cases(final_priority);

CREATE INDEX idx_assignments_volunteer
    ON volunteer_assignments(volunteer_id);

CREATE INDEX idx_assignments_status
    ON volunteer_assignments(status);

CREATE INDEX idx_medical_records_animal
    ON medical_records(animal_id);

CREATE INDEX idx_shelters_organization
    ON shelters(organization_id);

CREATE INDEX idx_shelter_stays_animal
    ON shelter_stays(animal_id);

CREATE INDEX idx_adoptions_organization
    ON adoptions(organization_id);

CREATE INDEX idx_adoptions_animal
    ON adoptions(animal_id);

CREATE INDEX idx_adoptions_adopter
    ON adoptions(adopter_id);

CREATE INDEX idx_adoptions_status
    ON adoptions(status);

CREATE INDEX idx_notifications_user
    ON notifications(user_id);

CREATE INDEX idx_notifications_unread
    ON notifications(user_id, is_read);


-- ============================================================
-- INITIAL SYSTEM ROLES
-- ============================================================

INSERT INTO roles (name, description)
VALUES
    (
        'ADMINISTRATOR',
        'Manages organization, users, rescue operations, AI decisions and system configuration.'
    ),
    (
        'VOLUNTEER',
        'Handles assigned rescue operations and updates rescue status.'
    ),
    (
        'VETERINARIAN',
        'Manages animal medical records and treatment information.'
    ),
    (
        'ADOPTION_COORDINATOR',
        'Manages adoption listings and adoption applications.'
    ),
    (
        'ADOPTER',
        'Browses available animals and submits adoption applications.'
    ),
    (
        'REPORTER',
        'Submits animal rescue reports.'
    )
ON CONFLICT (name) DO NOTHING;


-- ============================================================
-- END OF INITIAL SCHEMA
-- ============================================================