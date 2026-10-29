
import express from "express";

import {
  applyForAdoption,
  listAdoptionApplications,
  decideAdoptionApplication,
  finalizeAdoption,
} from "../controllers/adoption.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/role.middleware.js";

const router = express.Router();

router.use(authenticate);

// Adopters can submit applications and see their own applications.
router.post(
  "/",
  authorizeRoles("ADOPTER"),
  applyForAdoption
);

router.get(
  "/",
  authorizeRoles("ADOPTER", "ADOPTION_COORDINATOR", "ADMINISTRATOR"),
  listAdoptionApplications
);

// Only coordinators review and finalize adoptions.
router.patch(
  "/:adoptionId/review",
  authorizeRoles("ADOPTION_COORDINATOR"),
  decideAdoptionApplication
);

router.patch(
  "/:adoptionId/complete",
  authorizeRoles("ADOPTION_COORDINATOR"),
  finalizeAdoption
);

export default router;
