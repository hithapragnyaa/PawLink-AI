
import { query, getClient } from "../config/database.js";

const ACTIVE_ASSIGNMENT_STATUSES = [
  "PENDING",
  "ACCEPTED",
  "IN_PROGRESS",
];

const createError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

/**
 * Assign an active volunteer to a rescue case.
 * All related reads and writes run in one transaction.
 */
export const createVolunteerAssignment = async ({
  rescueCaseId,
  volunteerId,
  assignedBy,
  organizationId,
}) => {
  const client = await getClient();

  try {
    await client.query("BEGIN");

    const caseResult = await client.query(
      `
        SELECT id, organization_id, rescue_report_id,
               animal_id, final_priority, status
        FROM rescue_cases
        WHERE id = $1 AND organization_id = $2
        FOR UPDATE
      `,
      [rescueCaseId, organizationId]
    );

    if (caseResult.rows.length === 0) {
      throw createError("Rescue case not found.", 404);
    }

    const rescueCase = caseResult.rows[0];

    if (!["OPEN", "ASSIGNED"].includes(rescueCase.status)) {
      throw createError(
        "Volunteers can only be assigned to OPEN or ASSIGNED cases.",
        409
      );
    }

    const volunteerResult = await client.query(
      `
        SELECT u.id, u.organization_id, u.email,
               u.first_name, u.last_name, u.status,
               r.name AS role
        FROM users u
        JOIN roles r ON r.id = u.role_id
        WHERE u.id = $1
          AND u.organization_id = $2
          AND r.name = 'VOLUNTEER'
          AND u.status = 'ACTIVE'
      `,
      [volunteerId, organizationId]
    );

    if (volunteerResult.rows.length === 0) {
      throw createError(
        "Active volunteer not found in this organization.",
        400
      );
    }

    const existingResult = await client.query(
      `
        SELECT id
        FROM volunteer_assignments
        WHERE rescue_case_id = $1
          AND volunteer_id = $2
          AND status IN ('PENDING', 'ACCEPTED', 'IN_PROGRESS')
        LIMIT 1
      `,
      [rescueCaseId, volunteerId]
    );

    if (existingResult.rows.length > 0) {
      throw createError(
        "This volunteer already has an active assignment for this case.",
        409
      );
    }

    const assignmentResult = await client.query(
      `
        INSERT INTO volunteer_assignments (
          rescue_case_id, volunteer_id, assigned_by
        )
        VALUES ($1, $2, $3)
        RETURNING id, rescue_case_id, volunteer_id, assigned_by,
                  status, assigned_at, accepted_at, completed_at, notes
      `,
      [rescueCaseId, volunteerId, assignedBy]
    );

    // The case becomes ASSIGNED when it receives its first assignment.
    if (rescueCase.status === "OPEN") {
      await client.query(
        `
          UPDATE rescue_cases
          SET status = 'ASSIGNED'
          WHERE id = $1 AND organization_id = $2
        `,
        [rescueCaseId, organizationId]
      );
    }

    await client.query("COMMIT");

    return {
      assignment: assignmentResult.rows[0],
      rescueCase: {
        ...rescueCase,
        status:
          rescueCase.status === "OPEN"
            ? "ASSIGNED"
            : rescueCase.status,
      },
      volunteer: volunteerResult.rows[0],
    };
  } catch (error) {
    await client.query("ROLLBACK");

    if (error.code === "23505") {
      throw createError(
        "This volunteer already has an active assignment for this case.",
        409
      );
    }

    throw error;
  } finally {
    client.release();
  }
};

/**
 * Get assignments belonging to the authenticated volunteer
 * and the volunteer's organization.
 */
export const getVolunteerAssignments = async ({
  volunteerId,
  organizationId,
}) => {
  const result = await query(
    `
      SELECT
        va.id,
        va.rescue_case_id,
        va.volunteer_id,
        va.assigned_by,
        va.status,
        va.assigned_at,
        va.accepted_at,
        va.completed_at,
        va.notes,
        rc.final_priority,
        rc.status AS case_status,
        rc.rescue_report_id,
        rc.animal_id
      FROM volunteer_assignments va
      JOIN rescue_cases rc ON rc.id = va.rescue_case_id
      WHERE va.volunteer_id = $1
        AND rc.organization_id = $2
      ORDER BY va.assigned_at DESC
    `,
    [volunteerId, organizationId]
  );

  return result.rows;
};

/**
 * Accept only the authenticated volunteer's own pending assignment.
 */
export const acceptVolunteerAssignment = async ({
  assignmentId,
  volunteerId,
  organizationId,
}) => {
  const result = await query(
    `
      UPDATE volunteer_assignments va
      SET status = 'ACCEPTED',
          accepted_at = NOW()
      FROM rescue_cases rc
      WHERE va.id = $1
        AND va.volunteer_id = $2
        AND va.rescue_case_id = rc.id
        AND rc.organization_id = $3
        AND va.status = 'PENDING'
      RETURNING
        va.id, va.rescue_case_id, va.volunteer_id,
        va.assigned_by, va.status, va.assigned_at,
        va.accepted_at, va.completed_at, va.notes
    `,
    [assignmentId, volunteerId, organizationId]
  );

  return result.rows[0] ?? null;
};

/**
 * Reject only the authenticated volunteer's own pending assignment.
 */
export const rejectVolunteerAssignment = async ({
  assignmentId,
  volunteerId,
  organizationId,
  notes = null,
}) => {
  const result = await query(
    `
      UPDATE volunteer_assignments va
      SET status = 'REJECTED',
          notes = COALESCE($4, va.notes)
      FROM rescue_cases rc
      WHERE va.id = $1
        AND va.volunteer_id = $2
        AND va.rescue_case_id = rc.id
        AND rc.organization_id = $3
        AND va.status = 'PENDING'
      RETURNING
        va.id, va.rescue_case_id, va.volunteer_id,
        va.assigned_by, va.status, va.assigned_at,
        va.accepted_at, va.completed_at, va.notes
    `,
    [assignmentId, volunteerId, organizationId, notes]
  );

  return result.rows[0] ?? null;
};
