import { Router } from "express";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import * as controller from "../controllers/marketPriceController.js";

const router = Router();
router.get("/", validate(controller.ListQuerySchema, "query"), asyncHandler(controller.list));
router.get("/cities", asyncHandler(controller.cities));
router.get("/crops", asyncHandler(controller.crops));
router.get("/latest", validate(controller.ListQuerySchema.pick({ city: true, crop: true }), "query"), asyncHandler(controller.latest));
router.get("/trends", validate(controller.TrendQuerySchema, "query"), asyncHandler(controller.trends));
router.get("/dashboard", asyncHandler(controller.dashboard));
export default router;