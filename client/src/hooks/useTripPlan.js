import { useCallback, useRef, useState } from "react";
import { planTrip } from "../api/tripApi.js";
import { isValidItinerary } from "../utils/validateItinerary.js";

// status: "idle" | "loading" | "error" | "success"
export function useTripPlan() {
  const [status, setStatus] = useState("idle");
  const [itinerary, setItinerary] = useState(null);
  const [error, setError] = useState(null);
  const [lastDescription, setLastDescription] = useState("");

  // Guards against a slow earlier request overwriting a newer one: every
  // call gets a ticket, and a response only gets applied if its ticket is
  // still the latest one issued. The AbortController is a courtesy to the
  // network layer on top of that, not a substitute for it.
  const requestIdRef = useRef(0);
  const controllerRef = useRef(null);

  const run = useCallback(async (description) => {
    const myRequestId = ++requestIdRef.current;

    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setStatus("loading");
    setError(null);
    setLastDescription(description);

    try {
      const result = await planTrip(description, controller.signal);

      if (requestIdRef.current !== myRequestId) return; // stale, ignore

      if (!isValidItinerary(result)) {
        setStatus("error");
        setError("The itinerary came back in an unexpected shape. Please try again.");
        return;
      }

      // Give every stop a stable client-side id for React keys and reordering,
      // since the AI response doesn't include one.
      const withIds = {
        ...result,
        days: result.days.map((day, di) => ({
          ...day,
          stops: day.stops.map((stop, si) => ({
            ...stop,
            _id: `${di}-${si}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          })),
        })),
      };

      setItinerary(withIds);
      setStatus("success");
    } catch (err) {
      if (requestIdRef.current !== myRequestId) return; // stale, ignore
      if (err.name === "AbortError") return; // superseded by a newer request
      setStatus("error");
      setError(err.message || "Something went wrong. Please try again.");
    }
  }, []);

  const retry = useCallback(() => {
    if (lastDescription) run(lastDescription);
  }, [lastDescription, run]);

  return { status, itinerary, error, run, retry, setItinerary };
}
