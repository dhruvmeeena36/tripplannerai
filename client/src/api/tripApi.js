const BASE_URL = import.meta.env.VITE_API_URL ?? "";

export async function planTrip(description, signal) {
  const res = await fetch(`${BASE_URL}/api/plan-trip`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ description }),
    signal,
  });

  let body;
  try {
    body = await res.json();
  } catch {
    throw new Error("The server sent back something unreadable. Please try again.");
  }

  if (!res.ok) {
    throw new Error(body?.error || "Something went wrong. Please try again.");
  }

  return body.itinerary;
}
