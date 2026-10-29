import { checkDatabaseConnection } from "../services/database.service.js";

export const getDatabaseHealth = async (req, res, next) => {
  try {
    const database = await checkDatabaseConnection();

    res.status(200).json({
      success: true,
      service: "PawLink AI Database",
      status: "healthy",
      database,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};