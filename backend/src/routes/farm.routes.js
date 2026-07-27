import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import * as c from "../controllers/farms.controller.js";

const r = Router();
r.use(requireAuth);
r.get("/", asyncHandler(c.list));
r.get("/:id", asyncHandler(c.get));
r.post("/", validate(c.FarmSchema), asyncHandler(c.create));
r.put("/:id", validate(c.FarmSchema), asyncHandler(c.update));
r.delete("/:id", asyncHandler(c.remove));
export default r;
