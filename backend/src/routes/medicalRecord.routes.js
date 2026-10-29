
import express from "express";

import {
  addMedicalRecord,
  getAnimalMedicalRecords,
} from "../controllers/medicalRecord.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/role.middleware.js";

const router = express.Router();

router.post(
  "/",
  authenticate,
  authorizeRoles("VETERINARIAN"),
  addMedicalRecord
);

router.get(
  "/animals/:animalId",
  authenticate,
  authorizeRoles(
    "VETERINARIAN",
    "ADMINISTRATOR"
  ),
  getAnimalMedicalRecords
);

export default router;
