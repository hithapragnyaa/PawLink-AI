import {
  getUsersByOrganization,
  getUserById,
  updateUserStatus,
} from "../services/user.service.js";

const VALID_STATUSES = [
  "ACTIVE",
  "INACTIVE",
  "SUSPENDED",
];

export const getUsers = async (req, res, next) => {
  try {
    const users = await getUsersByOrganization(
      req.user.organizationId
    );

    return res.status(200).json({
      success: true,
      data: {
        users,
        count: users.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getUser = async (req, res, next) => {
  try {
    const user = await getUserById(
      req.params.userId,
      req.user.organizationId
    );

    return res.status(200).json({
      success: true,
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const changeUserStatus = async (
  req,
  res,
  next
) => {
  try {
    const { status } = req.body;

    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message:
          "Status must be ACTIVE, INACTIVE or SUSPENDED.",
      });
    }

    if (req.params.userId === req.user.id) {
      return res.status(400).json({
        success: false,
        message:
          "You cannot change your own account status.",
      });
    }

    const user = await updateUserStatus(
      req.params.userId,
      req.user.organizationId,
      status
    );

    return res.status(200).json({
      success: true,
      message: "User status updated successfully.",
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
};