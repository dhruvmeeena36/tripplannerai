// Groq doesn't have a hard JSON-schema constraint like Gemini's responseSchema,
// just response_format: json_object (valid JSON, but not any particular shape).
// So the shape has to be enforced by a good prompt + this validator + a retry.
// This description gets pasted straight into the prompt.
export const SCHEMA_DESCRIPTION = `{
  "tripTitle": string,
  "destination": string,
  "days": [
    {
      "day": number,
      "theme": string,
      "stops": [
        { "time": string, "name": string, "description": string, "category": "food"|"sight"|"activity"|"transport"|"rest" }
      ]
    }
  ]
}`;

export function isValidItinerary(data) {
  if (!data || typeof data !== "object") return false;
  if (typeof data.tripTitle !== "string" || !data.tripTitle.trim()) return false;
  if (!Array.isArray(data.days) || data.days.length === 0) return false;

  for (const day of data.days) {
    if (typeof day.day !== "number") return false;
    if (typeof day.theme !== "string" || !day.theme.trim()) return false;
    if (!Array.isArray(day.stops) || day.stops.length === 0) return false;

    for (const stop of day.stops) {
      if (typeof stop.name !== "string" || !stop.name.trim()) return false;
      if (typeof stop.description !== "string" || !stop.description.trim()) return false;
    }
  }

  return true;
}
