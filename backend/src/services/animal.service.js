import { query } from "../config/database.js";

const ANIMAL_SELECT = `
  SELECT
    a.id,
    a.organization_id,
    a.name,
    a.animal_type,
    a.breed,
    a.gender,
    a.age_years,
    a.color,
    a.weight_kg,
    a.status,
    a.identification_marks,
    a.description,
    a.photo_url,
    a.created_at,
    a.updated_at
  FROM animals a
`;

export const getAnimals = async ({
  organizationId,
  status,
  animalType,
  search,
}) => {
  const conditions = ["a.organization_id = $1"];
  const params = [organizationId];

  if (status) {
    params.push(status);
    conditions.push(`a.status = $${params.length}`);
  }

  if (animalType) {
    params.push(animalType);
    conditions.push(
      `LOWER(a.animal_type) = LOWER($${params.length})`
    );
  }

  if (search) {
    params.push(`%${search}%`);

    conditions.push(`
      (
        LOWER(COALESCE(a.name, '')) LIKE LOWER($${params.length})
        OR LOWER(a.animal_type) LIKE LOWER($${params.length})
        OR LOWER(COALESCE(a.breed, '')) LIKE LOWER($${params.length})
        OR LOWER(COALESCE(a.description, '')) LIKE LOWER($${params.length})
      )
    `);
  }

  const result = await query(
    `
    ${ANIMAL_SELECT}
    WHERE ${conditions.join(" AND ")}
    ORDER BY a.created_at DESC
    `,
    params
  );

  return result.rows;
};

export const getAnimalById = async (
  animalId,
  organizationId
) => {
  const result = await query(
    `
    ${ANIMAL_SELECT}
    WHERE a.id = $1
      AND a.organization_id = $2
    LIMIT 1
    `,
    [animalId, organizationId]
  );

  if (result.rows.length === 0) {
    const error = new Error("Animal not found.");
    error.statusCode = 404;
    throw error;
  }

  return result.rows[0];
};

export const createAnimal = async ({
  organizationId,
  name,
  animalType,
  breed,
  gender,
  ageYears,
  color,
  weightKg,
  status,
  identificationMarks,
  description,
  photoUrl,
}) => {
  const result = await query(
    `
    INSERT INTO animals (
      organization_id,
      name,
      animal_type,
      breed,
      gender,
      age_years,
      color,
      weight_kg,
      status,
      identification_marks,
      description,
      photo_url
    )
    VALUES (
      $1, $2, $3, $4, $5, $6,
      $7, $8, $9, $10, $11, $12
    )
    RETURNING
      id,
      organization_id,
      name,
      animal_type,
      breed,
      gender,
      age_years,
      color,
      weight_kg,
      status,
      identification_marks,
      description,
      photo_url,
      created_at,
      updated_at
    `,
    [
      organizationId,
      name ?? null,
      animalType,
      breed ?? null,
      gender ?? "UNKNOWN",
      ageYears ?? null,
      color ?? null,
      weightKg ?? null,
      status ?? "REPORTED",
      identificationMarks ?? null,
      description ?? null,
      photoUrl ?? null,
    ]
  );

  return result.rows[0];
};

export const updateAnimal = async (
  animalId,
  organizationId,
  {
    name,
    animalType,
    breed,
    gender,
    ageYears,
    color,
    weightKg,
    status,
    identificationMarks,
    description,
    photoUrl,
  }
) => {
  const result = await query(
    `
    UPDATE animals
    SET
      name = COALESCE($3, name),
      animal_type = COALESCE($4, animal_type),
      breed = COALESCE($5, breed),
      gender = COALESCE($6, gender),
      age_years = COALESCE($7, age_years),
      color = COALESCE($8, color),
      weight_kg = COALESCE($9, weight_kg),
      status = COALESCE($10, status),
      identification_marks = COALESCE($11, identification_marks),
      description = COALESCE($12, description),
      photo_url = COALESCE($13, photo_url),
      updated_at = NOW()
    WHERE id = $1
      AND organization_id = $2
    RETURNING
      id,
      organization_id,
      name,
      animal_type,
      breed,
      gender,
      age_years,
      color,
      weight_kg,
      status,
      identification_marks,
      description,
      photo_url,
      created_at,
      updated_at
    `,
    [
      animalId,
      organizationId,
      name ?? null,
      animalType ?? null,
      breed ?? null,
      gender ?? null,
      ageYears ?? null,
      color ?? null,
      weightKg ?? null,
      status ?? null,
      identificationMarks ?? null,
      description ?? null,
      photoUrl ?? null,
    ]
  );

  if (result.rows.length === 0) {
    const error = new Error("Animal not found.");
    error.statusCode = 404;
    throw error;
  }

  return result.rows[0];
};

export const updateAnimalStatus = async (
  animalId,
  organizationId,
  status
) => {
  const result = await query(
    `
    UPDATE animals
    SET
      status = $3,
      updated_at = NOW()
    WHERE id = $1
      AND organization_id = $2
    RETURNING
      id,
      organization_id,
      name,
      animal_type,
      breed,
      gender,
      age_years,
      color,
      weight_kg,
      status,
      identification_marks,
      description,
      photo_url,
      created_at,
      updated_at
    `,
    [animalId, organizationId, status]
  );

  if (result.rows.length === 0) {
    const error = new Error("Animal not found.");
    error.statusCode = 404;
    throw error;
  }

  return result.rows[0];
};

export const deleteAnimal = async (
  animalId,
  organizationId
) => {
  const result = await query(
    `
    DELETE FROM animals
    WHERE id = $1
      AND organization_id = $2
    RETURNING id
    `,
    [animalId, organizationId]
  );

  if (result.rows.length === 0) {
    const error = new Error("Animal not found.");
    error.statusCode = 404;
    throw error;
  }

  return {
    id: result.rows[0].id,
  };
};