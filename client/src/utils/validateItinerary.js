// The backend already validates before responding, but we never trust a
// network boundary twice — a proxy, an old cached response, or a future
// backend change could still hand this component something malformed.
export function isValidItinerary(data) {
  if (!data || typeof data !== "object") return false;
  if (typeof data.tripTitle !== "string" || !data.tripTitle.trim()) return false;
  if (!Array.isArray(data.days) || data.days.length === 0) return false;

  return data.days.every(
    (day) =>
      day &&
      typeof day.day !== "undefined" &&
      typeof day.theme === "string" &&
      Array.isArray(day.stops) &&
      day.stops.every((stop) => stop && typeof stop.name === "string" && stop.name.trim())
  );
}
