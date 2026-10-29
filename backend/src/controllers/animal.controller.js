import {
  getAnimals,
  getAnimalById,
  createAnimal,
  updateAnimal,
  updateAnimalStatus,
  deleteAnimal,
} from "../services/animal.service.js";

const VALID_GENDERS = [
  "MALE",
  "FEMALE",
  "UNKNOWN",
];

const VALID_STATUSES = [
  "REPORTED",
  "RESCUED",
  "UNDER_TREATMENT",
  "IN_SHELTER",
  "AVAILABLE_FOR_ADOPTION",
  "ADOPTION_PENDING",
  "ADOPTED",
  "RELEASED",
  "DECEASED",
];

const isValidNumber = (value) => {
  return value === null ||
    value === undefined ||
    (
      typeof value === "number" &&
      Number.isFinite(value)
    );
};

export const listAnimals = async (
  req,
  res,
  next
) => {
  try {
    const animals = await getAnimals({
      organizationId: req.user.organizationId,
      status: req.query.status,
      animalType: req.query.animalType,
      search: req.query.search,
    });

    return res.status(200).json({
      success: true,
      data: {
        animals,
        count: animals.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getAnimal = async (
  req,
  res,
  next
) => {
  try {
    const animal = await getAnimalById(
      req.params.animalId,
      req.user.organizationId
    );

    return res.status(200).json({
      success: true,
      data: {
        animal,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const addAnimal = async (
  req,
  res,
  next
) => {
  try {
    const {
      name,
      animalType,
      breed,
      gender,
      ageYears,
      color,
      weightKg,
      status,
      identificationMarks,
      description,
      photoUrl,
    } = req.body;

    if (
      !animalType ||
      typeof animalType !== "string" ||
      !animalType.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Animal type is required.",
      });
    }

    if (
      gender !== undefined &&
      !VALID_GENDERS.includes(gender)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Gender must be MALE, FEMALE or UNKNOWN.",
      });
    }

    if (
      status !== undefined &&
      !VALID_STATUSES.includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid animal status.",
      });
    }

    if (!isValidNumber(ageYears)) {
      return res.status(400).json({
        success: false,
        message: "Age must be a valid number.",
      });
    }

    if (
      ageYears !== undefined &&
      ageYears !== null &&
      ageYears < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Age cannot be negative.",
      });
    }

    if (!isValidNumber(weightKg)) {
      return res.status(400).json({
        success: false,
        message: "Weight must be a valid number.",
      });
    }

    if (
      weightKg !== undefined &&
      weightKg !== null &&
      weightKg <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Weight must be greater than zero.",
      });
    }

    const animal = await createAnimal({
      organizationId: req.user.organizationId,
      name:
        typeof name === "string"
          ? name.trim()
          : null,
      animalType: animalType.trim(),
      breed:
        typeof breed === "string"
          ? breed.trim()
          : null,
      gender: gender || "UNKNOWN",
      ageYears:
        ageYears !== undefined
          ? ageYears
          : null,
      color:
        typeof color === "string"
          ? color.trim()
          : null,
      weightKg:
        weightKg !== undefined
          ? weightKg
          : null,
      status: status || "REPORTED",
      identificationMarks:
        typeof identificationMarks === "string"
          ? identificationMarks.trim()
          : null,
      description:
        typeof description === "string"
          ? description.trim()
          : null,
      photoUrl:
        typeof photoUrl === "string"
          ? photoUrl.trim()
          : null,
    });

    return res.status(201).json({
      success: true,
      message: "Animal created successfully.",
      data: {
        animal,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const editAnimal = async (
  req,
  res,
  next
) => {
  try {
    const {
      name,
      animalType,
      breed,
      gender,
      ageYears,
      color,
      weightKg,
      status,
      identificationMarks,
      description,
      photoUrl,
    } = req.body;

    if (
      gender !== undefined &&
      !VALID_GENDERS.includes(gender)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Gender must be MALE, FEMALE or UNKNOWN.",
      });
    }

    if (
      status !== undefined &&
      !VALID_STATUSES.includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid animal status.",
      });
    }

    if (
      ageYears !== undefined &&
      ageYears !== null &&
      (
        typeof ageYears !== "number" ||
        !Number.isFinite(ageYears) ||
        ageYears < 0
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Age must be a non-negative number.",
      });
    }

    if (
      weightKg !== undefined &&
      weightKg !== null &&
      (
        typeof weightKg !== "number" ||
        !Number.isFinite(weightKg) ||
        weightKg <= 0
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Weight must be greater than zero.",
      });
    }

    if (
      animalType !== undefined &&
      (
        typeof animalType !== "string" ||
        !animalType.trim()
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Animal type cannot be empty.",
      });
    }

    const animal = await updateAnimal(
      req.params.animalId,
      req.user.organizationId,
      {
        name:
          name !== undefined
            ? name.trim()
            : undefined,
        animalType:
          animalType !== undefined
            ? animalType.trim()
            : undefined,
        breed:
          breed !== undefined
            ? breed?.trim()
            : undefined,
        gender,
        ageYears,
        color:
          color !== undefined
            ? color?.trim()
            : undefined,
        weightKg,
        status,
        identificationMarks:
          identificationMarks !== undefined
            ? identificationMarks?.trim()
            : undefined,
        description:
          description !== undefined
            ? description?.trim()
            : undefined,
        photoUrl:
          photoUrl !== undefined
            ? photoUrl?.trim()
            : undefined,
      }
    );

    return res.status(200).json({
      success: true,
      message: "Animal updated successfully.",
      data: {
        animal,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const changeAnimalStatus = async (
  req,
  res,
  next
) => {
  try {
    const { status } = req.body;

    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid animal status.",
      });
    }

    const animal = await updateAnimalStatus(
      req.params.animalId,
      req.user.organizationId,
      status
    );

    return res.status(200).json({
      success: true,
      message: "Animal status updated successfully.",
      data: {
        animal,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const removeAnimal = async (
  req,
  res,
  next
) => {
  try {
    const deleted = await deleteAnimal(
      req.params.animalId,
      req.user.organizationId
    );

    return res.status(200).json({
      success: true,
      message: "Animal deleted successfully.",
      data: {
        animalId: deleted.id,
      },
    });
  } catch (error) {
    next(error);
  }
};