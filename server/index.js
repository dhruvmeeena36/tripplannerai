import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { SCHEMA_DESCRIPTION, isValidItinerary } from "./itinerarySchema.js";

// Load .env.local only in local development — on Render env vars are injected by the platform
if (process.env.NODE_ENV !== "production") {
  dotenv.config({ path: ".env.local" });
}

const app = express();

// Allow requests from the deployed Vercel frontend and local dev
const FRONTEND_URL = process.env.FRONTEND_URL;
app.use(
  cors({
    origin: (origin, cb) => {
      // Allow requests with no origin (curl, Postman, health checks)
      if (!origin) return cb(null, true);
      const allowed = [
        FRONTEND_URL,                              // Render env var (optional)
        "https://tripplannerai-black.vercel.app",  // production alias
        "http://localhost:5173",
        "http://localhost:4173",
      ].filter(Boolean);
      // Also allow any Vercel preview deploy URL for this project
      const isVercelPreview = /^https:\/\/tripplannerai.*\.vercel\.app$/.test(origin);
      if (allowed.includes(origin) || isVercelPreview) return cb(null, true);
      cb(new Error(`CORS: origin ${origin} not allowed`));
    },
    methods: ["GET", "POST"],
  })
);
app.use(express.json({ limit: "20kb" }));


const PORT = process.env.PORT || 8787;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = "llama-3.3-70b-versatile";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

const SYSTEM_PROMPT = `You plan trips. Given a traveler's free-form description, you output a
day-by-day itinerary as JSON and nothing else — no markdown fences, no commentary before or after.

Exact shape to return:
${SCHEMA_DESCRIPTION}

Rules:
- 2 to 7 days depending on what the description implies. If it's unclear, go with 3.
- Every day needs a short theme and 3 to 6 stops.
- Stops need a real, specific name — not "local restaurant" or "a museum". Times should be
  roughly realistic ("9:00 AM"), not identical across every stop.
- Base everything on the actual destination in the description. If none is given, pick one
  plausible destination that fits and stick with it for the whole trip.
- Category must be exactly one of: food, sight, activity, transport, rest.`;

async function callGroq(description, { strict = false } = {}) {
  const userPrompt = strict
    ? `${description}\n\n(Your last attempt was invalid JSON or missing required fields — this time make sure every day has a theme and stops, and every stop has all four fields.)`
    : description;

  const controller = new AbortController();
  const killSwitch = setTimeout(() => controller.abort(), 25000);

  try {
    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: GROQ_MODEL,
        temperature: 0.8,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error(`Groq API error ${res.status}: ${errText.slice(0, 300)}`);
    }

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) throw new Error("Groq returned no content");

    try {
      return JSON.parse(content);
    } catch {
      throw new Error("Groq returned malformed JSON");
    }
  } finally {
    clearTimeout(killSwitch);
  }
}

app.post("/api/plan-trip", async (req, res) => {
  const { description } = req.body || {};

  if (typeof description !== "string" || !description.trim()) {
    return res.status(400).json({ error: "A trip description is required." });
  }
  if (description.length > 2000) {
    return res.status(400).json({ error: "Keep it under 2000 characters." });
  }
  if (!GROQ_API_KEY) {
    return res.status(500).json({ error: "Server is missing GROQ_API_KEY." });
  }

  try {
    let itinerary = await callGroq(description);

    // Groq's json_object mode guarantees valid JSON, not the shape we asked for —
    // so this is where most of the actual failure handling happens. One retry
    // with a stricter nudge covers the majority of "model dropped a field" cases.
    if (!isValidItinerary(itinerary)) {
      itinerary = await callGroq(description, { strict: true });
    }

    if (!isValidItinerary(itinerary)) {
      return res.status(422).json({ error: "Couldn't get a usable itinerary. Try again?" });
    }

    return res.json({ itinerary });
  } catch (err) {
    const timedOut = err.name === "AbortError";
    console.error("plan-trip failed:", err.message);
    return res.status(timedOut ? 504 : 502).json({
      error: timedOut
        ? "That took too long. Try again in a bit."
        : "Couldn't reach the AI service right now.",
    });
  }
});

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`Trip planner server up on http://localhost:${PORT}`);
});
