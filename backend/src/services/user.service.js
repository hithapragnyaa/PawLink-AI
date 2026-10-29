import { query } from "../config/database.js";

export const getUsersByOrganization = async (
  organizationId
) => {
  const result = await query(
    `
    SELECT
      u.id,
      u.organization_id,
      u.role_id,
      r.name AS role,
      u.first_name,
      u.last_name,
      u.email,
      u.phone,
      u.status,
      u.last_login_at,
      u.created_at,
      u.updated_at
    FROM users u
    INNER JOIN roles r
      ON r.id = u.role_id
    WHERE u.organization_id = $1
    ORDER BY u.created_at DESC
    `,
    [organizationId]
  );

  return result.rows;
};

export const getUserById = async (
  userId,
  organizationId
) => {
  const result = await query(
    `
    SELECT
      u.id,
      u.organization_id,
      u.role_id,
      r.name AS role,
      u.first_name,
      u.last_name,
      u.email,
      u.phone,
      u.status,
      u.last_login_at,
      u.created_at,
      u.updated_at
    FROM users u
    INNER JOIN roles r
      ON r.id = u.role_id
    WHERE u.id = $1
      AND u.organization_id = $2
    LIMIT 1
    `,
    [userId, organizationId]
  );

  if (result.rows.length === 0) {
    const error = new Error("User not found.");
    error.statusCode = 404;
    throw error;
  }

  return result.rows[0];
};

export const updateUserStatus = async (
  userId,
  organizationId,
  status
) => {
  const result = await query(
    `
    UPDATE users
    SET
      status = $3,
      updated_at = NOW()
    WHERE id = $1
      AND organization_id = $2
    RETURNING
      id,
      organization_id,
      role_id,
      first_name,
      last_name,
      email,
      phone,
      status,
      last_login_at,
      created_at,
      updated_at
    `,
    [
      userId,
      organizationId,
      status,
    ]
  );

  if (result.rows.length === 0) {
    const error = new Error("User not found.");
    error.statusCode = 404;
    throw error;
  }

  return result.rows[0];
};