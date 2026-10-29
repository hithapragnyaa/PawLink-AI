
import {
  createVolunteerAssignment,
  getVolunteerAssignments,
  acceptVolunteerAssignment,
  rejectVolunteerAssignment,
} from "../services/volunteerAssignment.service.js";

export const assignVolunteer = async (req, res, next) => {
  try {
    const { caseId } = req.params;
    const { volunteerId } = req.body;

    if (!volunteerId) {
      return res.status(400).json({
        success: false,
        message: "Volunteer ID is required.",
      });
    }

    const result = await createVolunteerAssignment({
      rescueCaseId: caseId,
      volunteerId,
      assignedBy: req.user.id,
      organizationId: req.user.organizationId,
    });

    return res.status(201).json({
      success: true,
      message: "Volunteer assigned successfully.",
      data: result,
    });
  } catch (error) {
    return next(error);
  }
};

export const getMyAssignments = async (req, res, next) => {
  try {
    const assignments = await getVolunteerAssignments({
      volunteerId: req.user.id,
      organizationId: req.user.organizationId,
    });

    return res.status(200).json({
      success: true,
      count: assignments.length,
      data: assignments,
    });
  } catch (error) {
    return next(error);
  }
};

export const acceptAssignment = async (req, res, next) => {
  try {
    const assignment = await acceptVolunteerAssignment({
      assignmentId: req.params.assignmentId,
      volunteerId: req.user.id,
      organizationId: req.user.organizationId,
    });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Pending assignment not found for this volunteer.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Volunteer assignment accepted successfully.",
      data: assignment,
    });
  } catch (error) {
    return next(error);
  }
};

export const rejectAssignment = async (req, res, next) => {
  try {
    const { notes } = req.body ?? {};

    if (
      notes !== undefined &&
      notes !== null &&
      (typeof notes !== "string" || notes.length > 2000)
    ) {
      return res.status(400).json({
        success: false,
        message: "Rejection notes must be text of at most 2000 characters.",
      });
    }

    const assignment = await rejectVolunteerAssignment({
      assignmentId: req.params.assignmentId,
      volunteerId: req.user.id,
      organizationId: req.user.organizationId,
      notes: typeof notes === "string" && notes.trim()
        ? notes.trim()
        : null,
    });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Pending assignment not found for this volunteer.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Volunteer assignment rejected successfully.",
      data: assignment,
    });
  } catch (error) {
    return next(error);
  }
};
