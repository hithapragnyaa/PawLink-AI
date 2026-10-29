
BEGIN;

-- Support the fourth priority returned by the SVM.
ALTER TYPE rescue_priority ADD VALUE IF NOT EXISTS 'VERY_HIGH';

-- SVM currently does not provide calibrated confidence.
ALTER TABLE ml_predictions
ALTER COLUMN confidence_score DROP NOT NULL;

COMMIT;
