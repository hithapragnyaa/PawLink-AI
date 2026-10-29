
import { query } from "../config/database.js";

export const createMedicalRecord = async ({
  organizationId,
  animalId,
  veterinarianId,
  diagnosis,
  treatment,
  medications,
  vaccinationHistory,
  injuryDetails,
  medicalNotes,
  followUpDate,
}) => {
  const animalResult = await query(
    `SELECT id
     FROM animals
     WHERE id = $1 AND organization_id = $2`,
    [animalId, organizationId]
  );

  if (animalResult.rows.length === 0) {
    const error = new Error(
      "Animal not found in your organization."
    );
    error.statusCode = 404;
    throw error;
  }

  const vetResult = await query(
    `SELECT u.id
     FROM users u
     JOIN roles r ON r.id = u.role_id
     WHERE u.id = $1
       AND u.organization_id = $2
       AND r.name = 'VETERINARIAN'
       AND u.status = 'ACTIVE'`,
    [veterinarianId, organizationId]
  );

  if (vetResult.rows.length === 0) {
    const error = new Error(
      "Active veterinarian not found in your organization."
    );
    error.statusCode = 403;
    throw error;
  }

  const result = await query(
    `INSERT INTO medical_records (
       organization_id,
       animal_id,
       veterinarian_id,
       diagnosis,
       treatment,
       medications,
       vaccination_history,
       injury_details,
       medical_notes,
       follow_up_date
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING
       id,
       organization_id,
       animal_id,
       veterinarian_id,
       diagnosis,
       treatment,
       medications,
       vaccination_history,
       injury_details,
       medical_notes,
       record_date,
       follow_up_date,
       created_at,
       updated_at`,
    [
      organizationId,
      animalId,
      veterinarianId,
      diagnosis ?? null,
      treatment ?? null,
      medications ?? null,
      vaccinationHistory ?? null,
      injuryDetails ?? null,
      medicalNotes ?? null,
      followUpDate ?? null,
    ]
  );

  return result.rows[0];
};

export const getMedicalRecordsByAnimal = async ({
  animalId,
  organizationId,
}) => {
  const result = await query(
    `SELECT
       id,
       organization_id,
       animal_id,
       veterinarian_id,
       diagnosis,
       treatment,
       medications,
       vaccination_history,
       injury_details,
       medical_notes,
       record_date,
       follow_up_date,
       created_at,
       updated_at
     FROM medical_records
     WHERE animal_id = $1
       AND organization_id = $2
     ORDER BY record_date DESC`,
    [animalId, organizationId]
  );

  return result.rows;
};
