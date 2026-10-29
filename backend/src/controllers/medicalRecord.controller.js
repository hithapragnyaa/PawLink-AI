
import {
  createMedicalRecord,
  getMedicalRecordsByAnimal,
} from "../services/medicalRecord.service.js";

export const addMedicalRecord = async (req, res, next) => {
  try {
    const {
      animalId,
      diagnosis,
      treatment,
      medications,
      vaccinationHistory,
      injuryDetails,
medicalNotes,
followUpDate,
    } = req.body;
    
if (
  followUpDate !== undefined &&
  followUpDate !== null &&
  (
    typeof followUpDate !== "string" ||
    Number.isNaN(Date.parse(followUpDate))
  )
) {
  return res.status(400).json({
    success: false,
    message: "followUpDate must be a valid date.",
  });
}


    if (
      typeof animalId !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(animalId)
    ) {
      return res.status(400).json({
        success: false,
        message: "A valid animal ID is required.",
      });
    }

    for (const [field, value] of Object.entries({
      diagnosis,
      treatment,
      medications,
      vaccinationHistory,
    })) {
      if (
        value !== undefined &&
        value !== null &&
        typeof value !== "string"
      ) {
        return res.status(400).json({
          success: false,
          message: `${field} must be text.`,
        });
      }
    }

    const record = await createMedicalRecord({
      organizationId: req.user.organizationId,
      animalId,
      veterinarianId: req.user.id,
      diagnosis,
      treatment,
      medications,
      vaccinationHistory,
      injuryDetails,
medicalNotes,
followUpDate,
    });

    return res.status(201).json({
      success: true,
      message: "Medical record created successfully.",
      data: record,
    });
  } catch (error) {
    return next(error);
  }
};

export const getAnimalMedicalRecords = async (req, res, next) => {
  try {
    const { animalId } = req.params;

    const records = await getMedicalRecordsByAnimal({
      animalId,
      organizationId: req.user.organizationId,
    });

    return res.status(200).json({
      success: true,
      count: records.length,
      data: records,
    });
  } catch (error) {
    return next(error);
  }
};
