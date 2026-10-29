
import express from "express";

import {
  addShelter,
  listShelters,
  admitAnimal,
  listShelterStays,
  dischargeAnimal,
} from "../controllers/shelter.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/role.middleware.js";

const router = express.Router();

router.use(authenticate);

// Shelter directory
router.get("/", listShelters);

router.post(
  "/",
  authorizeRoles("ADMINISTRATOR"),
  addShelter
);

// Shelter stays
router.get(
  "/stays",
  listShelterStays
);

router.post(
  "/stays",
  authorizeRoles(
    "ADMINISTRATOR",
    "VOLUNTEER",
    "VETERINARIAN"
  ),
  admitAnimal
);

router.patch(
  "/stays/:stayId/checkout",
  authorizeRoles(
    "ADMINISTRATOR",
    "VOLUNTEER"
  ),
  dischargeAnimal
);

export default router;
