import bcrypt from "bcryptjs";

import { getClient, query } from "../config/database.js";
import { generateAccessToken } from "../utils/jwt.js";

const normalizeEmail = (email) => email.trim().toLowerCase();

const validatePassword = (password) => {
  if (typeof password !== "string") {
    return "Password is required.";
  }

  if (password.length < 8) {
    return "Password must contain at least 8 characters.";
  }

  if (password.length > 128) {
    return "Password must not exceed 128 characters.";
  }

  return null;
};

const validateRequiredName = (value, fieldName) => {
  if (typeof value !== "string" || !value.trim()) {
    return `${fieldName} is required.`;
  }

  if (value.trim().length > 100) {
    return `${fieldName} must not exceed 100 characters.`;
  }

  return null;
};

const sanitizeUser = (user) => ({
  id: user.id,
  organizationId: user.organization_id,
  organizationName: user.organization_name,
  role: user.role,
  firstName: user.first_name,
  lastName: user.last_name,
  email: user.email,
  phone: user.phone,
  status: user.status,
});

export const registerOrganizationAdmin = async ({
  organizationName,
  organizationEmail,
  firstName,
  lastName,
  email,
  password,
  phone,
}) => {
  const organizationNameError = validateRequiredName(
    organizationName,
    "Organization name"
  );

  if (organizationNameError) {
    throw new Error(organizationNameError);
  }

  const firstNameError = validateRequiredName(firstName, "First name");

  if (firstNameError) {
    throw new Error(firstNameError);
  }

  const lastNameError = validateRequiredName(lastName, "Last name");

  if (lastNameError) {
    throw new Error(lastNameError);
  }

  const passwordError = validatePassword(password);

  if (passwordError) {
    throw new Error(passwordError);
  }

  const normalizedEmail = normalizeEmail(email);

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw new Error("Please provide a valid email address.");
  }

  const client = await getClient();

  try {
    await client.query("BEGIN");

    const roleResult = await client.query(
      `
      SELECT id, name
      FROM roles
      WHERE name = 'ADMINISTRATOR'
      LIMIT 1
      `
    );

    if (roleResult.rows.length === 0) {
      throw new Error("Administrator role is not configured.");
    }

    const existingEmailResult = await client.query(
      `
      SELECT id
      FROM users
      WHERE LOWER(email) = LOWER($1)
      LIMIT 1
      `,
      [normalizedEmail]
    );

    if (existingEmailResult.rows.length > 0) {
      throw new Error("An account with this email already exists.");
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const organizationResult = await client.query(
      `
      INSERT INTO organizations (
        name,
        email,
        phone,
        description
      )
      VALUES ($1, $2, $3, $4)
      RETURNING id, name, email
      `,
      [
        organizationName.trim(),
        organizationEmail?.trim().toLowerCase() || null,
        phone?.trim() || null,
        "Organization created through PawLink AI registration.",
      ]
    );

    const organization = organizationResult.rows[0];

    const userResult = await client.query(
      `
      INSERT INTO users (
        organization_id,
        role_id,
        first_name,
        last_name,
        email,
        password_hash,
        phone,
        status
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        'ACTIVE'
      )
      RETURNING
        id,
        organization_id,
        first_name,
        last_name,
        email,
        phone,
        status
      `,
      [
        organization.id,
        roleResult.rows[0].id,
        firstName.trim(),
        lastName.trim(),
        normalizedEmail,
        passwordHash,
        phone?.trim() || null,
      ]
    );

    const user = {
      ...userResult.rows[0],
      organization_name: organization.name,
      role: roleResult.rows[0].name,
    };

    const accessToken = generateAccessToken({
      id: user.id,
      organizationId: user.organization_id,
      role: user.role,
      email: user.email,
    });

    await client.query("COMMIT");

    return {
      user: sanitizeUser(user),
      accessToken,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const loginUser = async ({
  email,
  password,
  organizationId,
}) => {
  if (typeof email !== "string" || !email.trim()) {
    throw new Error("Email is required.");
  }

  const passwordError = validatePassword(password);

  if (passwordError) {
    throw new Error("Invalid email or password.");
  }

  const normalizedEmail = normalizeEmail(email);

  let userQuery = `
    SELECT
      u.id,
      u.organization_id,
      u.first_name,
      u.last_name,
      u.email,
      u.password_hash,
      u.phone,
      u.status,
      o.name AS organization_name,
      r.name AS role
    FROM users u
    INNER JOIN organizations o
      ON o.id = u.organization_id
    INNER JOIN roles r
      ON r.id = u.role_id
    WHERE LOWER(u.email) = LOWER($1)
      AND u.status = 'ACTIVE'
      AND o.is_active = TRUE
  `;

  const params = [normalizedEmail];

  if (organizationId) {
    userQuery += ` AND u.organization_id = $2::uuid`;
    params.push(organizationId);
  }

  userQuery += `
    ORDER BY u.created_at ASC
  `;

  const result = await query(userQuery, params);

  if (result.rows.length === 0) {
    throw new Error("Invalid email or password.");
  }

  if (result.rows.length > 1 && !organizationId) {
    throw new Error(
      "This email belongs to multiple organizations. Please provide organizationId."
    );
  }

  const user = result.rows[0];

  const passwordMatches = await bcrypt.compare(
    password,
    user.password_hash
  );

  if (!passwordMatches) {
    throw new Error("Invalid email or password.");
  }

  await query(
    `
    UPDATE users
    SET last_login_at = NOW(),
        updated_at = NOW()
    WHERE id = $1
    `,
    [user.id]
  );

  const accessToken = generateAccessToken({
    id: user.id,
    organizationId: user.organization_id,
    role: user.role,
    email: user.email,
  });

  return {
    user: sanitizeUser(user),
    accessToken,
  };
};

export const getAuthenticatedUser = async (userId, organizationId) => {
  const result = await query(
    `
    SELECT
      u.id,
      u.organization_id,
      u.first_name,
      u.last_name,
      u.email,
      u.phone,
      u.status,
      o.name AS organization_name,
      r.name AS role
    FROM users u
    INNER JOIN organizations o
      ON o.id = u.organization_id
    INNER JOIN roles r
      ON r.id = u.role_id
    WHERE u.id = $1
      AND u.organization_id = $2
      AND o.is_active = TRUE
    LIMIT 1
    `,
    [userId, organizationId]
  );

  if (result.rows.length === 0) {
    throw new Error("Authenticated user no longer exists.");
  }

  return sanitizeUser(result.rows[0]);
};