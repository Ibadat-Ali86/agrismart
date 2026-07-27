import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import * as c from "../controllers/users.controller.js";

const r = Router();
r.use(requireAuth);
r.patch("/me", validate(c.ProfileSchema), asyncHandler(c.updateMe));
export default r;
