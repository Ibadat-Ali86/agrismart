import { Router } from "express";
import { z } from "zod";
import multer from "multer";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { ApiError } from "../middleware/error.js";
import { generateText, analyzeImage } from "../services/ai.service.js";

const r = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024 } });

r.use(requireAuth);

r.post("/chat",
  validate(z.object({ message: z.string().min(1).max(2000), history: z.array(z.object({ role: z.enum(["user","assistant"]), content: z.string() })).optional() })),
  asyncHandler(async (req, res) => {
    const { message, history = [] } = req.body;
    const system = "You are AgriSmart, an expert agronomy advisor. Give concise, practical advice for farmers. Use simple language.";
    const reply = await generateText({ system, history, message });
    res.json({ ok: true, reply });
  })
);

r.post("/price-insight",
  validate(z.object({ crop: z.string().min(2).max(80), region: z.string().min(2).max(80).optional() })),
  asyncHandler(async (req, res) => {
    const { crop, region } = req.body;
    const reply = await generateText({
      system: "You are a market analyst for agricultural commodities. Give a 3-bullet insight: trend, expected price range, suggestion.",
      message: `Crop: ${crop}. Region: ${region || "India"}. Provide insight.`,
    });
    res.json({ ok: true, insight: reply });
  })
);

r.post("/scan", upload.single("image"), asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, "Image required");
  const result = await analyzeImage(req.file.buffer, req.file.mimetype);
  res.json({ ok: true, result });
}));

export default r;
