import { Router } from "express";

import {
  getUsers,
  getUser,
  changeUserStatus,
} from "../controllers/user.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";
import { authorizeRoles  } from "../middleware/role.middleware.js";

const router = Router();

router.use(authenticate);

router.get(
  "/",
  authorizeRoles("ADMINISTRATOR"),
  getUsers
);

router.get(
  "/:userId",
  authorizeRoles("ADMINISTRATOR"),
  getUser
);

router.patch(
  "/:userId/status",
  authorizeRoles("ADMINISTRATOR"),
  changeUserStatus
);

export default router;