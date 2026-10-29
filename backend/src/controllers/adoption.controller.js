
import {
  submitAdoptionApplication,
  getAdoptionApplications,
  reviewAdoptionApplication,
  completeAdoption,
} from "../services/adoption.service.js";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const isUuid = (value) =>
  typeof value === "string" && UUID_PATTERN.test(value);

const sendError = (res, error) => {
  const statusCode = error.statusCode || 500;

  if (statusCode === 500) {
    console.error("Adoption operation failed:", error);
  }

  return res.status(statusCode).json({
    success: false,
    message:
      statusCode === 500
        ? "Internal server error"
        : error.message,
  });
};

export const applyForAdoption = async (req, res) => {
  try {
    const { animalId, applicationNotes } = req.body;

    if (!isUuid(animalId)) {
      return res.status(400).json({
        success: false,
        message: "A valid animalId UUID is required.",
      });
    }

    if (
      applicationNotes !== undefined &&
      applicationNotes !== null &&
      typeof applicationNotes !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "applicationNotes must be a string.",
      });
    }

    if (
      typeof applicationNotes === "string" &&
      applicationNotes.length > 5000
    ) {
      return res.status(400).json({
        success: false,
        message: "Application notes cannot exceed 5000 characters.",
      });
    }

    const application = await submitAdoptionApplication({
      organizationId: req.user.organizationId,
      animalId,
      adopterId: req.user.id,
      applicationNotes: applicationNotes?.trim() || null,
    });

    return res.status(201).json({
      success: true,
      message: "Adoption application submitted successfully.",
      data: application,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

export const listAdoptionApplications = async (req, res) => {
  try {
    const applications = await getAdoptionApplications({
      organizationId: req.user.organizationId,
      userId: req.user.id,
      userRole: req.user.role,
    });

    return res.status(200).json({
      success: true,
      count: applications.length,
      data: applications,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

export const decideAdoptionApplication = async (req, res) => {
  try {
    const { adoptionId } = req.params;
    const { decision, rejectionReason } = req.body;

    if (!isUuid(adoptionId)) {
      return res.status(400).json({
        success: false,
        message: "A valid adoptionId UUID is required.",
      });
    }

    if (!["APPROVED", "REJECTED"].includes(decision)) {
      return res.status(400).json({
        success: false,
        message: "decision must be APPROVED or REJECTED.",
      });
    }

    if (
      decision === "REJECTED" &&
      (typeof rejectionReason !== "string" ||
        !rejectionReason.trim())
    ) {
      return res.status(400).json({
        success: false,
        message: "A rejection reason is required.",
      });
    }

    if (
      rejectionReason !== undefined &&
      rejectionReason !== null &&
      typeof rejectionReason !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "rejectionReason must be a string.",
      });
    }

    if (
      typeof rejectionReason === "string" &&
      rejectionReason.length > 2000
    ) {
      return res.status(400).json({
        success: false,
        message: "Rejection reason cannot exceed 2000 characters.",
      });
    }

    const application = await reviewAdoptionApplication({
      organizationId: req.user.organizationId,
      adoptionId,
      coordinatorId: req.user.id,
      decision,
      rejectionReason: rejectionReason?.trim() || null,
    });

    return res.status(200).json({
      success: true,
      message: `Adoption application ${decision.toLowerCase()}.`,
      data: application,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

export const finalizeAdoption = async (req, res) => {
  try {
    const { adoptionId } = req.params;

    if (!isUuid(adoptionId)) {
      return res.status(400).json({
        success: false,
        message: "A valid adoptionId UUID is required.",
      });
    }

    const application = await completeAdoption({
      organizationId: req.user.organizationId,
      adoptionId,
      coordinatorId: req.user.id,
    });

    return res.status(200).json({
      success: true,
      message: "Adoption completed successfully.",
      data: application,
    });
  } catch (error) {
    return sendError(res, error);
  }
};
