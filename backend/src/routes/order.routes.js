import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import * as c from "../controllers/orders.controller.js";

const r = Router();
r.use(requireAuth);
r.get("/", asyncHandler(c.listMine));
r.post("/", validate(c.OrderCreateSchema), asyncHandler(c.create));
r.patch("/:id/status", validate(c.OrderStatusSchema), asyncHandler(c.updateStatus));
export default r;
