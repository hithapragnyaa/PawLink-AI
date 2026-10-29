
import {
  getRescueReports,
  getRescueReportById,
  getMyRescueReports as getMyRescueReportsService,
  createRescueReport as createRescueReportService,
} from "../services/rescueReport.service.js";

import {
  requestSvmRescuePriorityPrediction,
  saveMLPrediction,
} from "../services/mlPrediction.service.js";

const VALID_INJURY_SEVERITIES = [1, 2, 3, 4, 5];


export const getAllRescueReports = async (req, res, next) => {
  try {
    const { status, animalType, search } = req.query;

    const reports = await getRescueReports({
      organizationId: req.user.organizationId,
      status,
      animalType,
      search,
    });

    return res.status(200).json({
      success: true,
      count: reports.length,
      data: reports,
    });
  } catch (error) {
    return next(error);
  }
};

export const getRescueReport = async (req, res, next) => {
  try {
    const report = await getRescueReportById(
      req.params.reportId,
      req.user.organizationId
    );

    return res.status(200).json({
      success: true,
      data: report,
    });
  } catch (error) {
    return next(error);
  }
};

export const createRescueReport = async (req, res, next) => {
  try {
    const {
  // Keep all your existing fields unchanged.
  animalId,
  animalType,
  ageGroup,
  injurySeverity,
  visibleBleeding,
  mobilityStatus,
  consciousness,
  breathingDifficulty,
  timeSinceInjuryHours,
  locationType,
  trafficRisk,
  weatherCondition,
  previousReports,
  reporterConfidence,
  latitude,
  longitude,
  address,
  description,
  imageUrl,
  svmFeatures,
} = req.body;

    if (!animalType || typeof animalType !== "string" || !animalType.trim()) {
      return res.status(400).json({
        success: false,
        message: "Animal type is required.",
      });
    }

    if (
      injurySeverity !== undefined &&
      injurySeverity !== null &&
      !VALID_INJURY_SEVERITIES.includes(Number(injurySeverity))
    ) {
      return res.status(400).json({
        success: false,
        message: "Injury severity must be an integer between 1 and 5.",
      });
    }

    const report = await createRescueReportService({
  organizationId: req.user.organizationId,
  reporterUserId: req.user.id,
  animalId,
  animalType: animalType.trim(),
  ageGroup,
  injurySeverity:
    injurySeverity === undefined ||
    injurySeverity === null
      ? null
      : Number(injurySeverity),
  visibleBleeding:
    visibleBleeding ?? false,
  mobilityStatus,
  consciousness,
  breathingDifficulty:
    breathingDifficulty ?? false,
  timeSinceInjuryHours:
    timeSinceInjuryHours === undefined ||
    timeSinceInjuryHours === null
      ? null
      : Number(timeSinceInjuryHours),
  locationType,
  trafficRisk,
  weatherCondition,
  previousReports:
    previousReports === undefined ||
    previousReports === null
      ? 0
      : Number(previousReports),
  reporterConfidence:
    reporterConfidence === undefined ||
    reporterConfidence === null
      ? null
      : Number(reporterConfidence),
  latitude:
    latitude === undefined ||
    latitude === null
      ? null
      : Number(latitude),
  longitude:
    longitude === undefined ||
    longitude === null
      ? null
      : Number(longitude),
  address,
  description,
  imageUrl,
});


/*
 * -------------------------------------------------------
 * Attempt SVM Prediction
 * -------------------------------------------------------
 */

let mlPrediction = null;
let mlStatus = "ASSESSMENT_MISSING";

if (svmFeatures && typeof svmFeatures === "object") {
  try {
    const svmResponse =
      await requestSvmRescuePriorityPrediction(svmFeatures);

    const rawPriority = svmResponse?.priority;

    const normalizedPriority =
      typeof rawPriority === "string"
        ? rawPriority
            .trim()
            .toUpperCase()
            .replace(/[_-]+/g, " ")
            .replace(/\s+/g, " ")
        : "";

    const priorityMap = {
      HIGH: "HIGH",
      MEDIUM: "MEDIUM",
      LOW: "LOW",
      "VERY HIGH": "VERY_HIGH",
    };

    const predictedPriority = priorityMap[normalizedPriority];

    if (!predictedPriority || !svmResponse?.model_version) {
      throw new Error(
        "SVM returned an invalid priority or model version."
      );
    }

    mlPrediction = await saveMLPrediction({
      rescueReportId: report.id,
      predictedPriority,
      confidenceScore: svmResponse.confidence ?? null,
      modelVersion: svmResponse.model_version,
      featureSnapshot: svmFeatures,
    });

    mlStatus = "PREDICTION_SAVED";
  } catch (mlError) {
    console.error(
      "SVM prediction unavailable:",
      mlError.message
    );

    mlStatus = "UNAVAILABLE";
  }
}

/*
 * -------------------------------------------------------
 * Response
 * -------------------------------------------------------
 */

return res.status(201).json({
  success: true,
  message: "Rescue report submitted successfully.",
  data: {
    report,
    ml: {
      status: mlStatus,
      prediction: mlPrediction,
    },
  },
});
} catch (error) {
  return next(error);
}
};
export const getMyRescueReports = async (req, res, next) => {
  try {
    const reports = await getMyRescueReportsService({
      organizationId: req.user.organizationId,
      reporterUserId: req.user.id,
    });

    return res.status(200).json({
      success: true,
      count: reports.length,
      data: reports,
    });
  } catch (error) {
    return next(error);
  }
};