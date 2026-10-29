import express from "express";

import {
  testRescuePriorityPrediction,
} from "../controllers/mlPrediction.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/role.middleware.js";

const router = express.Router();

router.post(
  "/test/rescue-priority",
  authenticate,
  authorizeRoles("ADMINISTRATOR"),
  testRescuePriorityPrediction
);

export default router;