import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import * as c from "../controllers/market.controller.js";

const r = Router();
// public browse
r.get("/listings", asyncHandler(c.list));
r.get("/listings/:id", asyncHandler(c.get));
// auth seller routes
r.get("/mine", requireAuth, asyncHandler(c.mine));
r.post("/listings", requireAuth, validate(c.ListingSchema), asyncHandler(c.create));
r.put("/listings/:id", requireAuth, validate(c.ListingSchema), asyncHandler(c.update));
r.delete("/listings/:id", requireAuth, asyncHandler(c.remove));
export default r;
