import { Router } from "express";

import {
  listAnimals,
  getAnimal,
  addAnimal,
  editAnimal,
  changeAnimalStatus,
  removeAnimal,
} from "../controllers/animal.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/role.middleware.js";

const router = Router();

router.use(authenticate);

router.get(
  "/",
  listAnimals
);

router.get(
  "/:animalId",
  getAnimal
);

router.post(
  "/",
  authorizeRoles(
    "ADMINISTRATOR",
    "VOLUNTEER"
  ),
  addAnimal
);

router.put(
  "/:animalId",
  authorizeRoles(
    "ADMINISTRATOR",
    "VOLUNTEER"
  ),
  editAnimal
);

router.patch(
  "/:animalId/status",
  authorizeRoles(
    "ADMINISTRATOR",
    "VOLUNTEER",
    "VETERINARIAN"
  ),
  changeAnimalStatus
);

router.delete(
  "/:animalId",
  authorizeRoles("ADMINISTRATOR"),
  removeAnimal
);

export default router;