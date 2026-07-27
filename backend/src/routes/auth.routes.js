import { Router } from "express";
import { z } from "zod";
import { validate } from "../middleware/validate.js";
import { requireAuth } from "../middleware/auth.js";
import * as ctrl from "../controllers/auth.controller.js";

const router = Router();

router.post("/register", validate(z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(6).max(128),
  role: z.enum(["farmer", "buyer"]).optional(),
})), ctrl.register);

router.post("/login", validate(z.object({
  email: z.string().email(),
  password: z.string().min(6),
})), ctrl.login);

router.post("/otp/request", validate(z.object({ email: z.string().email() })), ctrl.requestOtp);
router.post("/otp/verify", validate(z.object({
  email: z.string().email(),
  code: z.string().regex(/^\d{6}$/),
})), ctrl.verifyOtp);

router.post("/password/forgot", validate(z.object({ email: z.string().email() })), ctrl.forgotPassword);
router.post("/password/reset", validate(z.object({
  email: z.string().email(),
  code: z.string().regex(/^\d{6}$/),
  password: z.string().min(6).max(128),
})), ctrl.resetPassword);

router.post("/logout", ctrl.logout);
router.get("/me", requireAuth, ctrl.me);

export default router;
