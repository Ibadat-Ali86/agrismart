// Multi-provider AI service: OpenAI or Gemini, selected by AI_PROVIDER env.
// Falls back to a helpful stub if no key is configured (dev mode).
import { ApiError } from "../middleware/error.js";

const PROVIDER = (process.env.AI_PROVIDER || "gemini").toLowerCase();
const KEY = process.env.AI_API_KEY;

const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-flash-latest";

function ensureKey() {
  if (!KEY) throw new ApiError(503, "AI is not configured. Set AI_API_KEY in backend/.env");
}

export async function generateText({ system, history = [], message }) {
  ensureKey();
  if (PROVIDER === "gemini") {
    const contents = [
      ...history.map((h) => ({ role: h.role === "assistant" ? "model" : "user", parts: [{ text: h.content }] })),
      { role: "user", parts: [{ text: message }] },
    ];
    const body = { contents, systemInstruction: { parts: [{ text: system }] } };
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${KEY}`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
    );
    const j = await r.json();
    if (!r.ok) throw new ApiError(r.status, j.error?.message || "AI error");
    return j.candidates?.[0]?.content?.parts?.[0]?.text || "";
  }
  // OpenAI
  const messages = [
    { role: "system", content: system },
    ...history.map((h) => ({ role: h.role, content: h.content })),
    { role: "user", content: message },
  ];
  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${KEY}` },
    body: JSON.stringify({ model: OPENAI_MODEL, messages, temperature: 0.4 }),
  });
  const j = await r.json();
  if (!r.ok) throw new ApiError(r.status, j.error?.message || "AI error");
  return j.choices?.[0]?.message?.content || "";
}

export async function analyzeImage(buffer, mimetype) {
  ensureKey();
  const dataUrl = `data:${mimetype};base64,${buffer.toString("base64")}`;
  const prompt = `You are a crop disease expert. Analyze this plant photo. Reply ONLY with valid JSON of shape: {"crop":"...","disease":"...","severity":"low|medium|high","confidence":0-1,"symptoms":["..."],"treatment":["..."],"prevention":["..."]}`;

  if (PROVIDER === "gemini") {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${KEY}`,
      {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [
            { text: prompt },
            { inline_data: { mime_type: mimetype, data: buffer.toString("base64") } },
          ] }],
        }),
      }
    );
    const j = await r.json();
    if (!r.ok) throw new ApiError(r.status, j.error?.message || "AI error");
    return parseJson(j.candidates?.[0]?.content?.parts?.[0]?.text || "");
  }
  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${KEY}` },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      response_format: { type: "json_object" },
      messages: [{ role: "user", content: [
        { type: "text", text: prompt },
        { type: "image_url", image_url: { url: dataUrl } },
      ] }],
    }),
  });
  const j = await r.json();
  if (!r.ok) throw new ApiError(r.status, j.error?.message || "AI error");
  return parseJson(j.choices?.[0]?.message?.content || "");
}

function parseJson(text) {
  try {
    const match = text.match(/\{[\s\S]*\}/);
    return JSON.parse(match ? match[0] : text);
  } catch {
    return { raw: text };
  }
}
