import { Router } from "express";

import {
  getMyOrganization,
  updateMyOrganization,
} from "../controllers/organization.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";
import { authorizeRoles  } from "../middleware/role.middleware.js";

const router = Router();

router.use(authenticate);

router.get(
  "/me",
  getMyOrganization
);

router.put(
  "/me",
  authorizeRoles("ADMINISTRATOR"),
  updateMyOrganization
);

export default router;