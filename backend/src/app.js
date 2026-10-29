import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import authRoutes from "./routes/auth.routes.js";
import { getDatabaseHealth } from "./controllers/health.controller.js";
import organizationRoutes from "./routes/organization.routes.js";
import userRoutes from "./routes/user.routes.js";
import animalRoutes from "./routes/animal.routes.js";
import rescueReportRoutes from "./routes/rescueReport.routes.js";
import mlPredictionRoutes from "./routes/mlPrediction.routes.js";
import rescueCaseRoutes from "./routes/rescueCase.routes.js";
import volunteerAssignmentRoutes from "./routes/volunteerAssignment.routes.js";
import medicalRecordRoutes from "./routes/medicalRecord.routes.js";
import shelterRoutes from "./routes/shelter.routes.js";
import adoptionRoutes from "./routes/adoption.routes.js";

const app = express();

/*
 * -------------------------------------------------------
 * Security Middleware
 * -------------------------------------------------------
 */

app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: "cross-origin",
    },
  })
);

/*
 * -------------------------------------------------------
 * CORS
 * -------------------------------------------------------
 */

const allowedOrigins = [
  process.env.CLIENT_URL || "http://localhost:5173",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(
        new Error("CORS policy: Origin not allowed")
      );
    },
    credentials: true,
  })
);

/*
 * -------------------------------------------------------
 * Request Parsing
 * -------------------------------------------------------
 */

app.use(
  express.json({
    limit: "1mb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "1mb",
  })
);

/*
 * -------------------------------------------------------
 * Request Logging
 * -------------------------------------------------------
 */

if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

/*
 * -------------------------------------------------------
 * Basic Route
 * -------------------------------------------------------
 */

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to PawLink AI API",
    version: "1.0.0",
  });
});

/*
 * -------------------------------------------------------
 * Application Health
 * -------------------------------------------------------
 */

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    service: "PawLink AI Backend",
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

/*
 * -------------------------------------------------------
 * Database Health
 * -------------------------------------------------------
 */

app.get("/api/health/db", getDatabaseHealth);
app.use("/api/auth", authRoutes);
app.use("/api/organizations", organizationRoutes);
app.use("/api/users", userRoutes);
app.use("/api/animals", animalRoutes);
app.use("/api/rescue-reports", rescueReportRoutes);
app.use(
  "/api/ml-predictions",
  mlPredictionRoutes
);
app.use("/api/rescue-cases", rescueCaseRoutes);
app.use(
  "/api/volunteer-assignments",
  volunteerAssignmentRoutes
);
app.use("/api/medical-records", medicalRecordRoutes);
app.use("/api/shelters", shelterRoutes);
app.use("/api/adoptions", adoptionRoutes);
/*
 * -------------------------------------------------------
 * 404 Handler
 * 
 * -------------------------------------------------------
 */

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

/*
 * -------------------------------------------------------
 * Global Error Handler
 * -------------------------------------------------------
 */

app.use((err, req, res, next) => {
  console.error("Unhandled application error:", err);

  const statusCode = err.statusCode || 500;

  const response = {
    success: false,
    message:
      statusCode === 500
        ? "Internal server error"
        : err.message,
  };

  if (process.env.NODE_ENV === "development") {
    response.error = err.message;
  }

  res.status(statusCode).json(response);
});

export default app;