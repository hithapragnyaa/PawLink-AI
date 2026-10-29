
import {
  createShelter,
  getShelters,
  checkInAnimal,
  getShelterStays,
  checkOutAnimal,
} from "../services/shelter.service.js";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const isUuid = (value) =>
  typeof value === "string" && UUID_PATTERN.test(value);

const isOptionalText = (value) =>
  value === undefined ||
  value === null ||
  typeof value === "string";

const sendError = (res, error) => {
  const statusCode = error.statusCode || 500;

  if (statusCode === 500) {
    console.error("Shelter operation failed:", error);
  }

  return res.status(statusCode).json({
    success: false,
    message:
      statusCode === 500
        ? "Internal server error"
        : error.message,
  });
};

export const addShelter = async (req, res) => {
  try {
    const {
      name,
      address,
      city,
      state,
      capacity,
      contactPhone,
      description,
    } = req.body;

    if (
      typeof name !== "string" ||
      !name.trim() ||
      name.trim().length > 150
    ) {
      return res.status(400).json({
        success: false,
        message: "A valid shelter name is required (max 150 characters).",
      });
    }

    for (const [field, value] of Object.entries({
      address,
      city,
      state,
      contactPhone,
      description,
    })) {
      if (!isOptionalText(value)) {
        return res.status(400).json({
          success: false,
          message: `${field} must be a string.`,
        });
      }
    }

    if (
      capacity !== undefined &&
      capacity !== null &&
      (!Number.isSafeInteger(capacity) || capacity < 1)
    ) {
      return res.status(400).json({
        success: false,
        message: "Capacity must be a positive whole number or null.",
      });
    }

    const shelter = await createShelter({
      organizationId: req.user.organizationId,
      name: name.trim(),
      address: address?.trim() || null,
      city: city?.trim() || null,
      state: state?.trim() || null,
      capacity: capacity ?? null,
      contactPhone: contactPhone?.trim() || null,
      description: description?.trim() || null,
    });

    return res.status(201).json({
      success: true,
      message: "Shelter created successfully.",
      data: shelter,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

export const listShelters = async (req, res) => {
  try {
    const shelters = await getShelters(
      req.user.organizationId
    );

    return res.status(200).json({
      success: true,
      count: shelters.length,
      data: shelters,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

export const admitAnimal = async (req, res) => {
  try {
    const { animalId, shelterId, kennelNumber, notes } =
      req.body;

    if (!isUuid(animalId) || !isUuid(shelterId)) {
      return res.status(400).json({
        success: false,
        message: "Valid animalId and shelterId UUIDs are required.",
      });
    }

    if (
      !isOptionalText(kennelNumber) ||
      !isOptionalText(notes)
    ) {
      return res.status(400).json({
        success: false,
        message: "kennelNumber and notes must be strings.",
      });
    }

    if (
      typeof kennelNumber === "string" &&
      kennelNumber.length > 100
    ) {
      return res.status(400).json({
        success: false,
        message: "kennelNumber cannot exceed 100 characters.",
      });
    }

    const stay = await checkInAnimal({
      organizationId: req.user.organizationId,
      animalId,
      shelterId,
      kennelNumber: kennelNumber?.trim() || null,
      notes: notes?.trim() || null,
    });

    return res.status(201).json({
      success: true,
      message: "Animal checked into shelter successfully.",
      data: stay,
    });
   } catch (error) {
    console.error("SHELTER ADMISSION DIAGNOSTIC:", {
      message: error.message,
      code: error.code,
      detail: error.detail,
      constraint: error.constraint,
      stack: error.stack,
    });

    return sendError(res, error);
  }
};
export const listShelterStays = async (req, res) => {
  try {
    const activeOnly = req.query.activeOnly ?? "true";

    if (!["true", "false"].includes(activeOnly)) {
      return res.status(400).json({
        success: false,
        message: "activeOnly must be true or false.",
      });
    }

    const stays = await getShelterStays({
      organizationId: req.user.organizationId,
      activeOnly: activeOnly === "true",
    });

    return res.status(200).json({
      success: true,
      count: stays.length,
      data: stays,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

export const dischargeAnimal = async (req, res) => {
  try {
    const { stayId } = req.params;

    if (!isUuid(stayId)) {
      return res.status(400).json({
        success: false,
        message: "A valid shelter stay UUID is required.",
      });
    }

    const stay = await checkOutAnimal({
      organizationId: req.user.organizationId,
      stayId,
    });

    return res.status(200).json({
      success: true,
      message: "Animal checked out successfully.",
      data: stay,
    });
  } catch (error) {
    return sendError(res, error);
  }
};
