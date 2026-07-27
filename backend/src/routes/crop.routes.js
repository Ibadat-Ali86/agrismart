import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import * as c from "../controllers/crops.controller.js";

const r = Router();
r.use(requireAuth);
r.get("/", asyncHandler(c.list));
r.post("/", validate(c.CropSchema), asyncHandler(c.create));
r.put("/:id", asyncHandler(c.update));
r.delete("/:id", asyncHandler(c.remove));
export default r;
