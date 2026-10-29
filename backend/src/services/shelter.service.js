
import { query, getClient } from "../config/database.js";

const makeError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

export const createShelter = async ({
  organizationId,
  name,
  address,
  city,
  state,
  capacity,
  contactPhone,
  description,
}) => {
  const result = await query(
    `INSERT INTO shelters (
       organization_id,
       name,
       address,
       city,
       state,
       capacity,
       contact_phone,
       description
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      organizationId,
      name,
      address ?? null,
      city ?? null,
      state ?? null,
      capacity ?? null,
      contactPhone ?? null,
      description ?? null,
    ]
  );

  return result.rows[0];
};

export const getShelters = async (organizationId) => {
  const result = await query(
    `SELECT
       s.*,
       COUNT(ss.id) FILTER (
         WHERE ss.check_out_at IS NULL
       )::integer AS current_occupancy
     FROM shelters s
     LEFT JOIN shelter_stays ss ON ss.shelter_id = s.id
     WHERE s.organization_id = $1
     GROUP BY s.id
     ORDER BY s.created_at DESC`,
    [organizationId]
  );

  return result.rows;
};

export const checkInAnimal = async ({
  organizationId,
  animalId,
  shelterId,
  kennelNumber,
  notes,
}) => {
  const client = await getClient();

  try {
    await client.query("BEGIN");

    // Lock the shelter row so concurrent check-ins cannot
    // exceed its capacity.
    const shelterResult = await client.query(
      `SELECT id, capacity, is_active
       FROM shelters
       WHERE id = $1 AND organization_id = $2
       FOR UPDATE`,
      [shelterId, organizationId]
    );

    if (shelterResult.rows.length === 0) {
      throw makeError(
        "Shelter not found in your organization.",
        404
      );
    }

    const shelter = shelterResult.rows[0];

    if (!shelter.is_active) {
      throw makeError("This shelter is inactive.", 409);
    }

    const animalResult = await client.query(
      `SELECT id
       FROM animals
       WHERE id = $1 AND organization_id = $2`,
      [animalId, organizationId]
    );

    if (animalResult.rows.length === 0) {
      throw makeError(
        "Animal not found in your organization.",
        404
      );
    }

    const activeStayResult = await client.query(
      `SELECT ss.id
       FROM shelter_stays ss
       JOIN shelters s ON s.id = ss.shelter_id
       WHERE ss.animal_id = $1
         AND s.organization_id = $2
         AND ss.check_out_at IS NULL
       LIMIT 1`,
      [animalId, organizationId]
    );

    if (activeStayResult.rows.length > 0) {
      throw makeError(
        "This animal already has an active shelter stay.",
        409
      );
    }

    const occupancyResult = await client.query(
      `SELECT COUNT(*)::integer AS occupancy
       FROM shelter_stays
       WHERE shelter_id = $1
         AND check_out_at IS NULL`,
      [shelterId]
    );

    const occupancy = occupancyResult.rows[0].occupancy;

    if (
      shelter.capacity !== null &&
      occupancy >= shelter.capacity
    ) {
      throw makeError(
        "Shelter capacity has been reached.",
        409
      );
    }

    const stayResult = await client.query(
      `INSERT INTO shelter_stays (
         animal_id,
         shelter_id,
         kennel_number,
         notes
       )
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [
        animalId,
        shelterId,
        kennelNumber ?? null,
        notes ?? null,
      ]
    );

    await client.query("COMMIT");
    return stayResult.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const getShelterStays = async ({
  organizationId,
  activeOnly = false,
}) => {
  const result = await query(
    `SELECT
       ss.id,
       ss.animal_id,
       a.name AS animal_name,
       ss.shelter_id,
       s.name AS shelter_name,
       ss.check_in_at,
       ss.check_out_at,
       ss.kennel_number,
       ss.notes,
       ss.created_at
     FROM shelter_stays ss
     JOIN shelters s ON s.id = ss.shelter_id
     JOIN animals a ON a.id = ss.animal_id
     WHERE s.organization_id = $1
       AND a.organization_id = $1
       AND ($2::boolean = false OR ss.check_out_at IS NULL)
     ORDER BY ss.check_in_at DESC`,
    [organizationId, activeOnly]
  );

  return result.rows;
};

export const checkOutAnimal = async ({
  organizationId,
  stayId,
}) => {
  const client = await getClient();

  try {
    await client.query("BEGIN");

    const result = await client.query(
      `UPDATE shelter_stays ss
       SET check_out_at = NOW()
       FROM shelters s
       JOIN animals a ON a.organization_id = s.organization_id
       WHERE ss.id = $1
         AND ss.shelter_id = s.id
         AND ss.animal_id = a.id
         AND s.organization_id = $2
         AND a.organization_id = $2
         AND ss.check_out_at IS NULL
       RETURNING
         ss.id,
         ss.animal_id,
         ss.shelter_id,
         ss.check_in_at,
         ss.check_out_at,
         ss.kennel_number,
         ss.notes,
         ss.created_at`,
      [stayId, organizationId]
    );

    if (result.rows.length === 0) {
      const existingResult = await client.query(
        `SELECT ss.id, ss.check_out_at
         FROM shelter_stays ss
         JOIN shelters s ON s.id = ss.shelter_id
         WHERE ss.id = $1
           AND s.organization_id = $2`,
        [stayId, organizationId]
      );

      if (existingResult.rows.length === 0) {
        throw makeError(
          "Shelter stay not found in your organization.",
          404
        );
      }

      throw makeError(
        "This animal has already been checked out.",
        409
      );
    }

    await client.query("COMMIT");
    return result.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};
