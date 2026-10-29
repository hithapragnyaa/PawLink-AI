import { query } from "../config/database.js";

export const getOrganizationById = async (organizationId) => {
  const result = await query(
    `
    SELECT
      id,
      name,
      email,
      phone,
      address,
      city,
      state,
      country,
      description,
      is_active,
      created_at,
      updated_at
    FROM organizations
    WHERE id = $1
    LIMIT 1
    `,
    [organizationId]
  );

  if (result.rows.length === 0) {
    const error = new Error("Organization not found.");
    error.statusCode = 404;
    throw error;
  }

  return result.rows[0];
};

export const updateOrganization = async (
  organizationId,
  {
    name,
    email,
    phone,
    address,
    city,
    state,
    country,
    description,
  }
) => {
  const result = await query(
    `
    UPDATE organizations
    SET
      name = COALESCE($2, name),
      email = COALESCE($3, email),
      phone = COALESCE($4, phone),
      address = COALESCE($5, address),
      city = COALESCE($6, city),
      state = COALESCE($7, state),
      country = COALESCE($8, country),
      description = COALESCE($9, description),
      updated_at = NOW()
    WHERE id = $1
    RETURNING
      id,
      name,
      email,
      phone,
      address,
      city,
      state,
      country,
      description,
      is_active,
      created_at,
      updated_at
    `,
    [
      organizationId,
      name ?? null,
      email ?? null,
      phone ?? null,
      address ?? null,
      city ?? null,
      state ?? null,
      country ?? null,
      description ?? null,
    ]
  );

  if (result.rows.length === 0) {
    const error = new Error("Organization not found.");
    error.statusCode = 404;
    throw error;
  }

  return result.rows[0];
};