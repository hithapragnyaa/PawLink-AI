import "dotenv/config";
import bcrypt from "bcryptjs";

import pool from "../src/config/database.js";

const DEVELOPMENT_PASSWORD = "PawLink@123";

const seed = async () => {
  const client = await pool.connect();

  try {
    console.log("");
    console.log("========================================");
    console.log("       PAWLINK AI DATABASE SEED");
    console.log("========================================");

    await client.query("BEGIN");

    // ------------------------------------------------------------
    // 1. Create development organization
    // ------------------------------------------------------------

    const organizationResult = await client.query(
      `
      INSERT INTO organizations (
        name,
        email,
        phone,
        address,
        city,
        state,
        country,
        description
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8
      )
      ON CONFLICT DO NOTHING
      RETURNING id
      `,
      [
        "PawLink Demo Organization",
        "admin@pawlink.demo",
        "+91-9000000000",
        "VIT Chennai",
        "Chennai",
        "Tamil Nadu",
        "India",
        "Development organization for PawLink AI testing.",
      ]
    );

    let organizationId;

    if (organizationResult.rows.length > 0) {
      organizationId = organizationResult.rows[0].id;
      console.log("✓ Created development organization");
    } else {
      const existingOrganization = await client.query(
        `
        SELECT id
        FROM organizations
        WHERE email = $1
        LIMIT 1
        `,
        ["admin@pawlink.demo"]
      );

      organizationId = existingOrganization.rows[0]?.id;

      if (!organizationId) {
        throw new Error("Unable to locate development organization.");
      }

      console.log("✓ Development organization already exists");
    }

    // ------------------------------------------------------------
    // 2. Retrieve roles
    // ------------------------------------------------------------

    const rolesResult = await client.query(
      `
      SELECT id, name
      FROM roles
      WHERE name = ANY($1::text[])
      `,
      [[
        "ADMINISTRATOR",
        "VOLUNTEER",
        "VETERINARIAN",
        "ADOPTION_COORDINATOR",
        "ADOPTER",
        "REPORTER",
      ]]
    );

    const roles = {};

    for (const role of rolesResult.rows) {
      roles[role.name] = role.id;
    }

    const requiredRoles = [
      "ADMINISTRATOR",
      "VOLUNTEER",
      "VETERINARIAN",
      "ADOPTION_COORDINATOR",
      "ADOPTER",
      "REPORTER",
    ];

    for (const roleName of requiredRoles) {
      if (!roles[roleName]) {
        throw new Error(`Required role not found: ${roleName}`);
      }
    }

    console.log("✓ All required roles found");

    // ------------------------------------------------------------
    // 3. Hash development password
    // ------------------------------------------------------------

    const passwordHash = await bcrypt.hash(DEVELOPMENT_PASSWORD, 12);

    // ------------------------------------------------------------
    // 4. Create development users
    // ------------------------------------------------------------

    const users = [
      {
        firstName: "Admin",
        lastName: "User",
        email: "admin@pawlink.demo",
        phone: "+91-9000000001",
        role: "ADMINISTRATOR",
      },
      {
        firstName: "Volunteer",
        lastName: "User",
        email: "volunteer@pawlink.demo",
        phone: "+91-9000000002",
        role: "VOLUNTEER",
      },
      {
        firstName: "Veterinarian",
        lastName: "User",
        email: "vet@pawlink.demo",
        phone: "+91-9000000003",
        role: "VETERINARIAN",
      },
      {
        firstName: "Adoption",
        lastName: "Coordinator",
        email: "coordinator@pawlink.demo",
        phone: "+91-9000000004",
        role: "ADOPTION_COORDINATOR",
      },
      {
        firstName: "Adopter",
        lastName: "User",
        email: "adopter@pawlink.demo",
        phone: "+91-9000000005",
        role: "ADOPTER",
      },
      {
        firstName: "Reporter",
        lastName: "User",
        email: "reporter@pawlink.demo",
        phone: "+91-9000000006",
        role: "REPORTER",
      },
    ];

    for (const user of users) {
      const result = await client.query(
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
        ON CONFLICT (organization_id, email)
        DO UPDATE SET
          role_id = EXCLUDED.role_id,
          first_name = EXCLUDED.first_name,
          last_name = EXCLUDED.last_name,
          phone = EXCLUDED.phone,
          status = 'ACTIVE',
          updated_at = NOW()
        RETURNING id
        `,
        [
          organizationId,
          roles[user.role],
          user.firstName,
          user.lastName,
          user.email,
          passwordHash,
          user.phone,
        ]
      );

      if (result.rows.length > 0) {
        console.log(`✓ Seeded ${user.role}: ${user.email}`);
      }
    }

    // ------------------------------------------------------------
    // 5. Create development shelter
    // ------------------------------------------------------------

    await client.query(
  `
  INSERT INTO shelters (
    organization_id,
    name,
    address,
    city,
    state,
    capacity,
    contact_phone,
    description
  )
  SELECT
    $1::uuid,
    $2::varchar,
    $3::text,
    $4::varchar,
    $5::varchar,
    $6::integer,
    $7::varchar,
    $8::text
  WHERE NOT EXISTS (
    SELECT 1
    FROM shelters
    WHERE organization_id = $1::uuid
      AND name = $2::varchar
  )
  `,
  [
    organizationId,
    "PawLink Demo Shelter",
    "VIT Chennai Campus",
    "Chennai",
    "Tamil Nadu",
    100,
    "+91-9000000010",
    "Development shelter used for PawLink AI testing.",
  ]
);

    console.log("✓ Development shelter verified");

    await client.query("COMMIT");

    console.log("");
    console.log("========================================");
    console.log("        DATABASE SEED COMPLETE");
    console.log("========================================");
    console.log("");
    console.log("Development login accounts:");
    console.log("");
    console.log("Administrator : admin@pawlink.demo");
    console.log("Volunteer     : volunteer@pawlink.demo");
    console.log("Veterinarian  : vet@pawlink.demo");
    console.log("Coordinator   : coordinator@pawlink.demo");
    console.log("Adopter       : adopter@pawlink.demo");
    console.log("Reporter      : reporter@pawlink.demo");
    console.log("");
    console.log(`Password      : ${DEVELOPMENT_PASSWORD}`);
    console.log("");
    console.log("⚠️ These credentials are for development only.");
    console.log("========================================");
    console.log("");
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("");
    console.error("❌ DATABASE SEED FAILED");
    console.error(error);
    console.error("");

    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
};

seed();