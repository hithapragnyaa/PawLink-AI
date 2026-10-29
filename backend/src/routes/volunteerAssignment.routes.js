
import express from "express";

import {
  assignVolunteer,
  getMyAssignments,
  acceptAssignment,
  rejectAssignment,
} from "../controllers/volunteerAssignment.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/role.middleware.js";

const router = express.Router();

router.post(
  "/cases/:caseId/assign",
  authenticate,
  authorizeRoles("ADMINISTRATOR"),
  assignVolunteer
);

router.get(
  "/my",
  authenticate,
  authorizeRoles("VOLUNTEER"),
  getMyAssignments
);

router.patch(
  "/:assignmentId/accept",
  authenticate,
  authorizeRoles("VOLUNTEER"),
  acceptAssignment
);

router.patch(
  "/:assignmentId/reject",
  authenticate,
  authorizeRoles("VOLUNTEER"),
  rejectAssignment
);

export default router;
