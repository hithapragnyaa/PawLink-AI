
import {
  requestSvmRescuePriorityPrediction,
  saveMLPrediction,
} from "../services/mlPrediction.service.js";
export const testRescuePriorityPrediction = async (
  req,
  res,
  next
) => {
  try {
    const prediction =
      await requestSvmRescuePriorityPrediction(req.body);

    return res.status(200).json({
      success: true,
      data: prediction,
    });
  } catch (error) {
    return next(error);
  }
};
