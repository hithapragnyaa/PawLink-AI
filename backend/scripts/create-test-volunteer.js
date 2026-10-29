
import "dotenv/config";
import bcrypt from "bcryptjs";
import pool from "../src/config/database.js";

const EMAIL = "volunteer2@pawlink.demo";
const PASSWORD = "PawLinkVolunteer2@123";

const createTestVolunteer = async () => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const organizationResult = await client.query(
      `SELECT id FROM organizations
       WHERE email = $1
       LIMIT 1`,
      ["admin@pawlink.demo"]
    );

    if (organizationResult.rows.length === 0) {
      throw new Error("Development organization not found.");
    }

    const organizationId = organizationResult.rows[0].id;

    const roleResult = await client.query(
      `SELECT id FROM roles
       WHERE name = 'VOLUNTEER'
       LIMIT 1`
    );

    if (roleResult.rows.length === 0) {
      throw new Error("VOLUNTEER role not found.");
    }

    const roleId = roleResult.rows[0].id;

    const existingResult = await client.query(
      `SELECT id FROM users
       WHERE organization_id = $1 AND email = $2
       LIMIT 1`,
      [organizationId, EMAIL]
    );

    if (existingResult.rows.length > 0) {
      throw new Error(
        `${EMAIL} already exists. No account was changed.`
      );
    }

    const passwordHash = await bcrypt.hash(PASSWORD, 12);

    const userResult = await client.query(
      `INSERT INTO users (
         organization_id,
         role_id,
         first_name,
         last_name,
         email,
         password_hash,
         phone,
         status
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'ACTIVE')
       RETURNING id, email, status`,
      [
        organizationId,
        roleId,
        "Volunteer",
        "Test Two",
        EMAIL,
        passwordHash,
        null,
      ]
    );

    await client.query("COMMIT");

    console.log("Test volunteer created successfully:");
    console.log(JSON.stringify(userResult.rows[0], null, 2));
    console.log(`Login email: ${EMAIL}`);
    console.log("Use the development password configured in this script.");
    console.log("No existing users or assignments were modified.");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

createTestVolunteer().catch((error) => {
  console.error("Could not create test volunteer:", error.message);
  process.exitCode = 1;
});
