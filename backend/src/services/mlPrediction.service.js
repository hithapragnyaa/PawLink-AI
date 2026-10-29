import { query } from "../config/database.js";

const ML_SERVICE_URL =
  process.env.ML_SERVICE_URL || "http://localhost:8000";

/*
 * -------------------------------------------------------
 * Call ML Service
 * -------------------------------------------------------
 */

export const requestRescuePriorityPrediction = async ({
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
}) => {
  const payload = {
    animal_type: animalType,
    age_group: ageGroup ?? null,
    injury_severity: injurySeverity ?? null,
    visible_bleeding: visibleBleeding ?? false,
    mobility_status: mobilityStatus ?? null,
    consciousness: consciousness ?? null,
    breathing_difficulty: breathingDifficulty ?? false,
    time_since_injury_hours:
      timeSinceInjuryHours ?? null,
    location_type: locationType ?? null,
    traffic_risk: trafficRisk ?? null,
    weather_condition: weatherCondition ?? null,
    previous_reports: previousReports ?? 0,
    reporter_confidence:
      reporterConfidence ?? null,
  };

  const response = await fetch(
    `${ML_SERVICE_URL}/predict/rescue-priority`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  let responseData;

  try {
    responseData = await response.json();
  } catch {
    const error = new Error(
      "ML service returned an invalid response."
    );

    error.statusCode = 502;
    throw error;
  }

  if (!response.ok) {
    const error = new Error(
      responseData?.detail ||
        responseData?.message ||
        "ML service request failed."
    );

    error.statusCode = 502;
    throw error;
  }

  return responseData;
};


/*
 * -------------------------------------------------------
 * Call the SVM using its 12 trained features
 * -------------------------------------------------------
 */

export const requestSvmRescuePriorityPrediction = async (
  features
) => {
  const response = await fetch(
    `${ML_SERVICE_URL}/predict/rescue-priority`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(features),
    }
  );

  let responseData;

  try {
    responseData = await response.json();
  } catch {
    const error = new Error(
      "ML service returned an invalid response."
    );
    error.statusCode = 502;
    throw error;
  }

  if (!response.ok) {
    const error = new Error(
      responseData?.detail ||
        responseData?.message ||
        "SVM prediction request failed."
    );
    error.statusCode = 502;
    throw error;
  }

  return responseData;
};

/*
 * -------------------------------------------------------
 * Save ML Prediction
 * -------------------------------------------------------
 */


export const saveMLPrediction = async ({
  rescueReportId,
  predictedPriority,
  confidenceScore,
  modelVersion,
  featureSnapshot,
}) => {
  if (!predictedPriority || !modelVersion) {
    const error = new Error(
      "Cannot save an incomplete ML prediction."
    );
    error.statusCode = 400;
    throw error;
  }

  if (
    confidenceScore !== undefined &&
    confidenceScore !== null &&
    (
      !Number.isFinite(Number(confidenceScore)) ||
      Number(confidenceScore) < 0 ||
      Number(confidenceScore) > 100
    )
  ) {
    const error = new Error(
      "ML prediction confidence must be between 0 and 100."
    );
    error.statusCode = 400;
    throw error;
  }

  const sql = `
    INSERT INTO ml_predictions (
      rescue_report_id,
      predicted_priority,
      confidence_score,
      model_version,
      feature_snapshot
    )
    VALUES ($1, $2, $3, $4, $5)
    RETURNING
      id,
      rescue_report_id,
      predicted_priority,
      confidence_score,
      model_version,
      prediction_time,
      feature_snapshot,
      created_at
  `;

  const values = [
    rescueReportId,
    predictedPriority,
    confidenceScore === undefined || confidenceScore === null
      ? null
      : Number(confidenceScore),
    modelVersion,
    featureSnapshot ?? null,
  ];

  const result = await query(sql, values);
  return result.rows[0];
};



/*
 * -------------------------------------------------------
 * Get ML Prediction For Rescue Report
 * -------------------------------------------------------
 */

export const getMLPredictionByReportId = async (
  rescueReportId
) => {
  const sql = `
    SELECT
      id,
      rescue_report_id,
      predicted_priority,
      confidence_score,
      model_version,
      prediction_time,
      feature_snapshot,
      created_at
    FROM ml_predictions
    WHERE rescue_report_id = $1
  `;

  const result = await query(sql, [
    rescueReportId,
  ]);

  return result.rows[0] ?? null;
};