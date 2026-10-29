
import {
  getRescueCaseByReportId,
  createOrUpdateRescueCase,
  updateRescueCaseStatus,
} from "../services/rescueCase.service.js";

import { getRescueReportById } from "../services/rescueReport.service.js";

const VALID_PRIORITIES = ["HIGH", "MEDIUM", "LOW"];

const VALID_CASE_STATUSES = [
  "OPEN",
  "ASSIGNED",
  "IN_PROGRESS",
  "RESCUED",
  "MEDICAL_CARE",
  "SHELTERED",
  "CLOSED",
  "CANCELLED",
];

/**
 * Review a rescue report and create or update its rescue case.
 * Only administrators can access this endpoint.
 */
export const reviewRescueReport = async (req, res, next) => {
  try {
    const { reportId } = req.params;

    const {
      finalPriority,
      adminDecision,
      adminDecisionReason,
    } = req.body;

    // Validate the administrator's final priority.
    if (!VALID_PRIORITIES.includes(finalPriority)) {
      return res.status(400).json({
        success: false,
        message: "Final priority must be HIGH, MEDIUM, or LOW.",
      });
    }

    // Validate the administrator's decision.
    if (typeof adminDecision !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "Admin decision must be a boolean.",
      });
    }

    // Require an explanation when the AI priority is overridden.
    if (
      adminDecision === false &&
      (typeof adminDecisionReason !== "string" ||
        !adminDecisionReason.trim())
    ) {
      return res.status(400).json({
        success: false,
        message:
          "A reason is required when overriding the AI priority.",
      });
    }

    // Retrieve the report within the current organization.
    const report = await getRescueReportById(
      reportId,
      req.user.organizationId
    );

    // Create the case or update the existing case for this report.
    const rescueCase = await createOrUpdateRescueCase({
      rescueReportId: report.id,
      organizationId: req.user.organizationId,
      animalId: report.animal_id,
      finalPriority,
      adminDecision,
      adminDecidedBy: req.user.id,
      adminDecisionReason:
        adminDecisionReason?.trim() || null,
    });

    return res.status(200).json({
      success: true,
      message: "Rescue report reviewed successfully.",
      data: {
        report,
        rescueCase,
      },
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Retrieve the rescue case associated with a report.
 */
export const getRescueCase = async (req, res, next) => {
  try {
    const rescueCase = await getRescueCaseByReportId(
      req.params.reportId,
      req.user.organizationId
    );

    if (!rescueCase) {
      return res.status(404).json({
        success: false,
        message: "Rescue case not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: rescueCase,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Update a rescue case's status.
 * Allowed transitions depend on the user's role and current status.
 */
export const updateCaseStatus = async (req, res, next) => {
  try {
    const { caseId } = req.params;
    const { status } = req.body;

    if (!VALID_CASE_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message:
          "Status must be OPEN, ASSIGNED, IN_PROGRESS, RESCUED, MEDICAL_CARE, SHELTERED, CLOSED, or CANCELLED.",
      });
    }

    const rescueCase = await updateRescueCaseStatus({
      rescueCaseId: caseId,
      organizationId: req.user.organizationId,
      status,
      userId: req.user.id,
      userRole: req.user.role,
    });

    if (!rescueCase) {
      return res.status(404).json({
        success: false,
        message: "Rescue case not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Rescue case status updated successfully.",
      data: rescueCase,
    });
  } catch (error) {
    return next(error);
  }
};
