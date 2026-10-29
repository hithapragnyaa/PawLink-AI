import express from "express";

import {
  reviewRescueReport,
  getRescueCase,
  updateCaseStatus,
} from "../controllers/rescueCase.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/role.middleware.js";

const router = express.Router();

/*
 * Admin reviews a rescue report and creates/updates
 * the corresponding rescue case.
 */
router.post(
  "/reports/:reportId/review",
  authenticate,
  authorizeRoles("ADMINISTRATOR"),
  reviewRescueReport
);

/*
 * Get the rescue case associated with a rescue report.
 */
router.get(
  "/reports/:reportId",
  authenticate,
  authorizeRoles("ADMINISTRATOR", "VOLUNTEER", "VETERINARIAN"),
  getRescueCase
);
router.patch(
  "/:caseId/status",
  authenticate,
  authorizeRoles(
    "ADMINISTRATOR",
    "VOLUNTEER",
    "VETERINARIAN"
  ),
  updateCaseStatus
);
export default router;