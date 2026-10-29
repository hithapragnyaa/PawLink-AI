import "dotenv/config";
import app from "./src/app.js";

const PORT = Number(process.env.PORT) || 5000;

const server = app.listen(PORT, () => {
  console.log("");
  console.log("========================================");
  console.log("        PAWLINK AI BACKEND");
  console.log("========================================");
  console.log(`Environment : ${process.env.NODE_ENV || "development"}`);
  console.log(`Port        : ${PORT}`);
  console.log(`API         : http://localhost:${PORT}`);
  console.log(`Health      : http://localhost:${PORT}/api/health`);
  console.log("========================================");
  console.log("");
});

/*
 * -------------------------------------------------------
 * Graceful Shutdown
 * -------------------------------------------------------
 */

const shutdown = (signal) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);

  server.close(() => {
    console.log("HTTP server closed.");
    process.exit(0);
  });

  setTimeout(() => {
    console.error("Forced shutdown after timeout.");
    process.exit(1);
  }, 10000);
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

/*
 * -------------------------------------------------------
 * Process-Level Error Handling
 * -------------------------------------------------------
 */

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Promise Rejection:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);

  server.close(() => {
    process.exit(1);
  });
});