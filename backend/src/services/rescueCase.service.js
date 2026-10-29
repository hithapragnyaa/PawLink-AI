import { query } from "../config/database.js";

/*
 * Get a rescue case using the rescue report ID.
 * Organization ID is always required for tenant isolation.
 */
export const getRescueCaseByReportId = async (
  rescueReportId,
  organizationId
) => {
  const sql = `
    SELECT
      id,
      organization_id,
      rescue_report_id,
      animal_id,
      final_priority,
      admin_decision,
      admin_decided_by,
      admin_decision_reason,
      status,
      created_at,
      updated_at
    FROM rescue_cases
    WHERE rescue_report_id = $1
      AND organization_id = $2
  `;

  const result = await query(sql, [
    rescueReportId,
    organizationId,
  ]);

  return result.rows[0] ?? null;
};
export const createOrUpdateRescueCase = async ({
  rescueReportId,
  organizationId,
  animalId,
  finalPriority,
  adminDecision,
  adminDecidedBy,
  adminDecisionReason,
}) => {
  const sql = `
    INSERT INTO rescue_cases (
      organization_id,
      rescue_report_id,
      animal_id,
      final_priority,
      admin_decision,
      admin_decided_by,
      admin_decision_reason,
      status
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, 'OPEN')
    ON CONFLICT (rescue_report_id)
    DO UPDATE SET
      animal_id = EXCLUDED.animal_id,
      final_priority = EXCLUDED.final_priority,
      admin_decision = EXCLUDED.admin_decision,
      admin_decided_by = EXCLUDED.admin_decided_by,
      admin_decision_reason = EXCLUDED.admin_decision_reason,
      updated_at = NOW()
    RETURNING
      id,
      organization_id,
      rescue_report_id,
      animal_id,
      final_priority,
      admin_decision,
      admin_decided_by,
      admin_decision_reason,
      status,
      created_at,
      updated_at
  `;

  const result = await query(sql, [
    organizationId,
    rescueReportId,
    animalId ?? null,
    finalPriority,
    adminDecision,
    adminDecidedBy,
    adminDecisionReason ?? null,
  ]);

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
export const updateRescueCaseStatus = async ({
  rescueCaseId,
  organizationId,
  status,
  userId,
  userRole,
}) => {
  const caseResult = await query(
    `
      SELECT
        rc.id,
        rc.organization_id,
        rc.rescue_report_id,
        rc.animal_id,
        rc.final_priority,
        rc.admin_decision,
        rc.admin_decided_by,
        rc.admin_decision_reason,
        rc.status,
        rc.created_at,
        rc.updated_at
      FROM rescue_cases rc
      WHERE rc.id = $1
        AND rc.organization_id = $2
    `,
    [rescueCaseId, organizationId]
  );

  if (caseResult.rows.length === 0) {
    const error = new Error("Rescue case not found.");
    error.statusCode = 404;
    throw error;
  }

  const currentStatus = caseResult.rows[0].status;

  const allowedTransitions = {
    ADMINISTRATOR: {
      OPEN: ["ASSIGNED", "IN_PROGRESS", "CANCELLED"],
      ASSIGNED: ["IN_PROGRESS", "CANCELLED"],
      IN_PROGRESS: ["RESCUED", "CANCELLED"],
      RESCUED: ["MEDICAL_CARE", "SHELTERED", "CLOSED"],
      MEDICAL_CARE: ["SHELTERED", "CLOSED"],
      SHELTERED: ["CLOSED"],
      CLOSED: [],
      CANCELLED: [],
    },

    VOLUNTEER: {
      IN_PROGRESS: ["RESCUED"],
    },

    VETERINARIAN: {
      RESCUED: ["MEDICAL_CARE"],
      MEDICAL_CARE: ["SHELTERED"],
    },
  };

  const allowed =
    allowedTransitions[userRole]?.[currentStatus] ?? [];

  if (!allowed.includes(status)) {
    const error = new Error(
      `Role ${userRole} cannot change case status from ${currentStatus} to ${status}.`
    );
    error.statusCode = 403;
    throw error;
  }

  /*
   * Volunteers may update only cases assigned to them
   * through an accepted assignment.
   */
  if (userRole === "VOLUNTEER") {
    const assignmentResult = await query(
      `
        SELECT id
        FROM volunteer_assignments
        WHERE rescue_case_id = $1
          AND volunteer_id = $2
          AND status = 'ACCEPTED'
      `,
      [rescueCaseId, userId]
    );

    if (assignmentResult.rows.length === 0) {
      const error = new Error(
        "You do not have an accepted assignment for this rescue case."
      );
      error.statusCode = 403;
      throw error;
    }
  }

  const result = await query(
    `
      UPDATE rescue_cases
      SET
        status = $1,
        updated_at = NOW()
      WHERE id = $2
        AND organization_id = $3
      RETURNING
        id,
        organization_id,
        rescue_report_id,
        animal_id,
        final_priority,
        admin_decision,
        admin_decided_by,
        admin_decision_reason,
        status,
        created_at,
        updated_at
    `,
    [
      status,
      rescueCaseId,
      organizationId,
    ]
  );

  return result.rows[0] ?? null;
};