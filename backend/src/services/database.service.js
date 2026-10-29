import { query } from "../config/database.js";

export const checkDatabaseConnection = async () => {
  const result = await query("SELECT NOW() AS current_time");

  return {
    connected: true,
    currentTime: result.rows[0].current_time,
  };
};