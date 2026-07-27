import { Router } from "express";
import rateLimit from "express-rate-limit";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import * as controller from "../controllers/marketPriceController.js";

const router = Router();
router.use(requireAuth, requireRole("admin"));
router.post("/sync", rateLimit({ windowMs: 15 * 60 * 1000, max: 3, standardHeaders: true, legacyHeaders: false }), asyncHandler(controller.manualSync));
router.get("/logs", validate(controller.LogQuerySchema, "query"), asyncHandler(controller.logs));
export default router;