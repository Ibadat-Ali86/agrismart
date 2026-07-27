import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import * as c from "../controllers/dashboard.controller.js";

const r = Router();
r.use(requireAuth);
r.get("/", asyncHandler(c.summary));
export default r;
