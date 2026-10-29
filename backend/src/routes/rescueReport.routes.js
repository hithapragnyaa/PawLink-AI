
import express from "express";

import { authorizeRoles } from "../middleware/role.middleware.js";
import {
  getAllRescueReports,
  getRescueReport,
  createRescueReport,
  getMyRescueReports,
} from "../controllers/rescueReport.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";


const router = express.Router();

// Staff can view rescue reports belonging to their organization.
const staffRoles = [
  "ADMINISTRATOR",
  "VOLUNTEER",
  "VETERINARIAN",
  "ADOPTION_COORDINATOR",
];

// Submit a rescue report.
router.post(
  "/",
  authenticate,
  authorizeRoles("REPORTER", "ADMINISTRATOR"),
  createRescueReport
);


router.get(
  "/mine",
  authenticate,
  authorizeRoles("REPORTER"),
  getMyRescueReports
);
 
// View organization rescue reports.
router.get(
  "/",
  authenticate,
  authorizeRoles(...staffRoles),
  getAllRescueReports
);

// View a specific rescue report.
router.get(
  "/:reportId",
  authenticate,
  authorizeRoles(...staffRoles),
  getRescueReport
);

export default router;