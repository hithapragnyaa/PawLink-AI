
import { query, getClient } from "../config/database.js";

const makeError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

export const submitAdoptionApplication = async ({
  organizationId,
  animalId,
  adopterId,
  applicationNotes,
}) => {
  const client = await getClient();

  try {
    await client.query("BEGIN");

    const animalResult = await client.query(
      `SELECT id, status
       FROM animals
       WHERE id = $1
         AND organization_id = $2
       FOR UPDATE`,
      [animalId, organizationId]
    );

    if (animalResult.rows.length === 0) {
      throw makeError(
        "Animal not found in your organization.",
        404
      );
    }

    if (animalResult.rows[0].status !== "AVAILABLE_FOR_ADOPTION") {
      throw makeError(
        "This animal is not currently available for adoption.",
        409
      );
    }

    const adopterResult = await client.query(
      `SELECT u.id
       FROM users u
       JOIN roles r ON r.id = u.role_id
       WHERE u.id = $1
         AND u.organization_id = $2
         AND u.status = 'ACTIVE'
         AND r.name = 'ADOPTER'`,
      [adopterId, organizationId]
    );

    if (adopterResult.rows.length === 0) {
      throw makeError(
        "Active adopter account not found in your organization.",
        403
      );
    }
    
    const duplicateResult = await client.query(
      `SELECT id
       FROM adoptions
       WHERE organization_id = $1
         AND animal_id = $2
         AND adopter_id = $3
         AND status IN (
           'APPLICATION_SUBMITTED',
           'UNDER_REVIEW',
           'APPROVED'
         )
       LIMIT 1`,
      [organizationId, animalId, adopterId]
    );

    if (duplicateResult.rows.length > 0) {
      throw makeError(
        "You already have an active application for this animal.",
        409
      );
    }


    const applicationResult = await client.query(
      `INSERT INTO adoptions (
         organization_id,
         animal_id,
         adopter_id,
         status,
         application_notes
       )
       VALUES ($1, $2, $3, 'APPLICATION_SUBMITTED', $4)
       RETURNING *`,
      [
        organizationId,
        animalId,
        adopterId,
        applicationNotes ?? null,
      ]
    );

    

    await client.query("COMMIT");
    return applicationResult.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const getAdoptionApplications = async ({
  organizationId,
  userId,
  userRole,
}) => {
  const adopterOnly = userRole === "ADOPTER";

  const result = await query(
    `SELECT
       ad.id,
       ad.organization_id,
       ad.animal_id,
       a.name AS animal_name,
       ad.adopter_id,
       u.first_name AS adopter_first_name,
       u.last_name AS adopter_last_name,
       ad.coordinator_id,
       ad.status,
       ad.application_date,
       ad.review_date,
       ad.completion_date,
       ad.application_notes,
       ad.rejection_reason,
       ad.created_at,
       ad.updated_at
     FROM adoptions ad
     JOIN animals a ON a.id = ad.animal_id
     JOIN users u ON u.id = ad.adopter_id
     WHERE ad.organization_id = $1
       AND ($2::boolean = false OR ad.adopter_id = $3)
     ORDER BY ad.application_date DESC`,
    [organizationId, adopterOnly, userId]
  );

  return result.rows;
};

export const reviewAdoptionApplication = async ({
  organizationId,
  adoptionId,
  coordinatorId,
  decision,
  rejectionReason,
}) => {
  const client = await getClient();

  try {
    await client.query("BEGIN");

    const applicationResult = await client.query(
      `SELECT *
       FROM adoptions
       WHERE id = $1
         AND organization_id = $2
       FOR UPDATE`,
      [adoptionId, organizationId]
    );

    if (applicationResult.rows.length === 0) {
      throw makeError(
        "Adoption application not found in your organization.",
        404
      );
    }

    const application = applicationResult.rows[0];

    if (
      !["APPLICATION_SUBMITTED", "UNDER_REVIEW"].includes(
        application.status
      )
    ) {
      throw makeError(
        "Only submitted or under-review applications can be decided.",
        409
      );
    }

    const coordinatorResult = await client.query(
      `SELECT u.id
       FROM users u
       JOIN roles r ON r.id = u.role_id
       WHERE u.id = $1
         AND u.organization_id = $2
         AND u.status = 'ACTIVE'
         AND r.name = 'ADOPTION_COORDINATOR'`,
      [coordinatorId, organizationId]
    );

    if (coordinatorResult.rows.length === 0) {
      throw makeError(
        "Active adoption coordinator not found in your organization.",
        403
      );
    }

    const animalResult = await client.query(
      `SELECT id, status
       FROM animals
       WHERE id = $1
         AND organization_id = $2
       FOR UPDATE`,
      [application.animal_id, organizationId]
    );

    if (animalResult.rows.length === 0) {
      throw makeError("Associated animal not found.", 404);
    }

    if (decision === "APPROVED") {
  if (animalResult.rows[0].status !== "AVAILABLE_FOR_ADOPTION") {
    throw makeError(
      "Animal is no longer available for adoption.",
      409
    );
  }

  const otherApproved = await client.query(
    `SELECT id
     FROM adoptions
     WHERE animal_id = $1
       AND organization_id = $2
       AND id <> $3
       AND status IN ('APPROVED', 'COMPLETED')
     LIMIT 1`,
    [application.animal_id, organizationId, adoptionId]
  );

  if (otherApproved.rows.length > 0) {
    throw makeError(
      "Another application has already been approved for this animal.",
      409
    );
  }

  await client.query(
    `UPDATE animals
     SET status = 'ADOPTION_PENDING',
         updated_at = NOW()
     WHERE id = $1
       AND organization_id = $2
       AND status = 'AVAILABLE_FOR_ADOPTION'`,
    [application.animal_id, organizationId]
  );
}
    

    const result = await client.query(
      `UPDATE adoptions
       SET status = $1,
           coordinator_id = $2,
           review_date = NOW(),
           rejection_reason = $3,
           updated_at = NOW()
       WHERE id = $4
         AND organization_id = $5
       RETURNING *`,
      [
        decision,
        coordinatorId,
        decision === "REJECTED" ? rejectionReason : null,
        adoptionId,
        organizationId,
      ]
    );

    await client.query("COMMIT");
    return result.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const completeAdoption = async ({
  organizationId,
  adoptionId,
  coordinatorId,
}) => {
  const client = await getClient();

  try {
    await client.query("BEGIN");

    const applicationResult = await client.query(
      `SELECT *
       FROM adoptions
       WHERE id = $1
         AND organization_id = $2
       FOR UPDATE`,
      [adoptionId, organizationId]
    );

    if (applicationResult.rows.length === 0) {
      throw makeError(
        "Adoption application not found in your organization.",
        404
      );
    }

    const application = applicationResult.rows[0];

    if (application.status !== "APPROVED") {
      throw makeError(
        "Only approved applications can be completed.",
        409
      );
    }

    const animalResult = await client.query(
      `SELECT id, status
       FROM animals
       WHERE id = $1
         AND organization_id = $2
       FOR UPDATE`,
      [application.animal_id, organizationId]
    );

    if (
      animalResult.rows.length === 0 ||
      animalResult.rows[0].status !== "ADOPTION_PENDING"
    ) {
      throw makeError(
        "Animal is not in the expected adoption-pending state.",
        409
      );
    }

    await client.query(
      `UPDATE animals
       SET status = 'ADOPTED',
           updated_at = NOW()
       WHERE id = $1
         AND organization_id = $2`,
      [application.animal_id, organizationId]
    );

    const result = await client.query(
      `UPDATE adoptions
       SET status = 'COMPLETED',
           coordinator_id = $1,
           completion_date = NOW(),
           updated_at = NOW()
       WHERE id = $2
         AND organization_id = $3
         AND status = 'APPROVED'
       RETURNING *`,
      [coordinatorId, adoptionId, organizationId]
    );

    if (result.rows.length === 0) {
      throw makeError(
        "Application could not be completed.",
        409
      );
    }

    await client.query(
      `UPDATE adoptions
       SET status = 'REJECTED',
           rejection_reason = 'Animal was adopted through another completed application.',
           review_date = NOW(),
           updated_at = NOW()
       WHERE animal_id = $1
         AND organization_id = $2
         AND id <> $3
         AND status IN ('APPLICATION_SUBMITTED', 'UNDER_REVIEW', 'APPROVED')`,
      [
        application.animal_id,
        organizationId,
        adoptionId,
      ]
    );

    await client.query("COMMIT");
    return result.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};
