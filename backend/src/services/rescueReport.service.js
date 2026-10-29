
import { query } from "../config/database.js";

/*
 * -------------------------------------------------------
 * Common Rescue Report Fields
 * -------------------------------------------------------
 */

const REPORT_SELECT = `
  SELECT
    id,
    organization_id,
    reporter_user_id,
    animal_id,
    animal_type,
    age_group,
    injury_severity,
    visible_bleeding,
    mobility_status,
    consciousness,
    breathing_difficulty,
    time_since_injury_hours,
    location_type,
    traffic_risk,
    weather_condition,
    previous_reports,
    reporter_confidence,
    latitude,
    longitude,
    address,
    description,
    image_url,
        (
      SELECT mp.predicted_priority
      FROM ml_predictions mp
      WHERE mp.rescue_report_id = rescue_reports.id
      ORDER BY mp.created_at DESC
      LIMIT 1
    ) AS predicted_priority,
    status,
    created_at,
    updated_at
  FROM rescue_reports
`;

/*
 * -------------------------------------------------------
 * Get All Rescue Reports
 * -------------------------------------------------------
 */

export const getRescueReports = async ({
  organizationId,
  status,
  animalType,
  search,
}) => {
  const conditions = [
    "organization_id = $1",
  ];

  const values = [organizationId];

  if (status) {
    values.push(status);
    conditions.push(
      `status = $${values.length}`
    );
  }

  if (animalType) {
    values.push(animalType);
    conditions.push(
      `animal_type ILIKE $${values.length}`
    );
  }

  if (search) {
    values.push(`%${search}%`);

    conditions.push(
      `(animal_type ILIKE $${values.length}
        OR description ILIKE $${values.length}
        OR address ILIKE $${values.length})`
    );
  }

  const sql = `
    ${REPORT_SELECT}
    WHERE ${conditions.join(" AND ")}
    ORDER BY created_at DESC
  `;

  const result = await query(sql, values);

  return result.rows;
};

/*
 * -------------------------------------------------------
 * Get Rescue Report By ID
 * -------------------------------------------------------
 */

export const getRescueReportById = async (
  reportId,
  organizationId
) => {
  const sql = `
    ${REPORT_SELECT}
    WHERE id = $1
      AND organization_id = $2
  `;

  const result = await query(sql, [
    reportId,
    organizationId,
  ]);

  if (result.rows.length === 0) {
    const error = new Error("Rescue report not found.");
    error.statusCode = 404;
    throw error;
  }

  return result.rows[0];
};

/*
 * -------------------------------------------------------
 * Create Rescue Report
 * -------------------------------------------------------
 */

export const createRescueReport = async ({
  organizationId,
  reporterUserId,
  animalId,
  animalType,
  ageGroup,
  injurySeverity,
  visibleBleeding,
  mobilityStatus,
  consciousness,
  breathingDifficulty,
  timeSinceInjuryHours,
  locationType,
  trafficRisk,
  weatherCondition,
  previousReports,
  reporterConfidence,
  latitude,
  longitude,
  address,
  description,
  imageUrl,
}) => {

  /*
   * Verify that an associated animal belongs
   * to the same organization.
   */

  if (animalId) {
    const animalResult = await query(
      `
        SELECT id
        FROM animals
        WHERE id = $1
          AND organization_id = $2
      `,
      [animalId, organizationId]
    );

    if (animalResult.rows.length === 0) {
      const error = new Error(
        "Animal not found in this organization."
      );

      error.statusCode = 404;
      throw error;
    }
  }

  const sql = `
    INSERT INTO rescue_reports (
      organization_id,
      reporter_user_id,
      animal_id,
      animal_type,
      age_group,
      injury_severity,
      visible_bleeding,
      mobility_status,
      consciousness,
      breathing_difficulty,
      time_since_injury_hours,
      location_type,
      traffic_risk,
      weather_condition,
      previous_reports,
      reporter_confidence,
      latitude,
      longitude,
      address,
      description,
      image_url
    )
    VALUES (
      $1, $2, $3, $4, $5, $6, $7,
      $8, $9, $10, $11, $12, $13, $14,
      $15, $16, $17, $18, $19, $20, $21
    )
    RETURNING *
  `;

  const values = [
    organizationId,
    reporterUserId,
    animalId || null,
    animalType,
    ageGroup ?? null,
    injurySeverity ?? null,
    visibleBleeding ?? false,
    mobilityStatus ?? null,
    consciousness ?? null,
    breathingDifficulty ?? false,
    timeSinceInjuryHours ?? null,
    locationType ?? null,
    trafficRisk ?? null,
    weatherCondition ?? null,
    previousReports ?? 0,
    reporterConfidence ?? null,
    latitude ?? null,
    longitude ?? null,
    address ?? null,
    description ?? null,
    imageUrl ?? null,
  ];

  const result = await query(sql, values);

  return result.rows[0];
};
export const updateRescueReportStatus = async (
  reportId,
  organizationId,
  status
) => {
  const sql = `
    UPDATE rescue_reports
    SET
      status = $1,
      updated_at = NOW()
    WHERE id = $2
      AND organization_id = $3
    RETURNING
      id,
      organization_id,
      reporter_user_id,
      animal_id,
      animal_type,
      age_group,
      injury_severity,
      visible_bleeding,
      mobility_status,
      consciousness,
      breathing_difficulty,
      time_since_injury_hours,
      location_type,
      traffic_risk,
      weather_condition,
      previous_reports,
      reporter_confidence,
      latitude,
      longitude,
      address,
      description,
      image_url,
      status,
      created_at,
      updated_at
  `;

  const result = await query(sql, [
    status,
    reportId,
    organizationId,
  ]);

  return result.rows[0] ?? null;
};

export const getMyRescueReports = async ({
  organizationId,
  reporterUserId,
}) => {
  const sql = `
    ${REPORT_SELECT}
    WHERE organization_id = $1
      AND reporter_user_id = $2
    ORDER BY created_at DESC
  `;

  const result = await query(sql, [
    organizationId,
    reporterUserId,
  ]);

  return result.rows;
};
