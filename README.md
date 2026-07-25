# Waypoint — AI Trip Planner

## LINK FOR FRONTEND LIVE - https://tripplannerai-black.vercel.app
## LINK FOR BACKEND LIVE - https://tripplannerai-1.onrender.com

You describe a trip in a sentence or two, the app hands back an editable,
day-by-day itinerary. Not a chatbot — the model returns JSON, which gets
parsed into stop cards you can expand, reorder, or delete.

Built for the frontend internship take-home assignment.

## Stack

- **Frontend:** React 18 (hooks, functional components), Vite, plain
  JavaScript — no TypeScript.
- **Backend:** A small Express server sits between the browser and Groq, so
  the API key never ends up in client-side code.
- **AI:** [Groq](https://console.groq.com) running `llama-3.3-70b-versatile`,
  using its OpenAI-compatible `response_format: json_object` mode.

## Project structure

```
trip-planner/
  server/            Express backend (keeps the Groq key server-side)
    index.js
    itinerarySchema.js
    .env.example
  client/            Vite + React frontend
    src/
      App.jsx
      components/    TripForm, Itinerary, StopCard, StatePanels
      hooks/         useTripPlan.js (request lifecycle, stale-response guard)
      utils/         validateItinerary.js
      api/           tripApi.js
```

## Setup

Grab a free API key from [console.groq.com](https://console.groq.com/keys).

**1. Backend**

```bash
cd server
npm install
cp .env.example .env
# paste your GROQ_API_KEY into .env
npm run dev
# -> http://localhost:8787
```

**2. Frontend** (separate terminal)

```bash
cd client
npm install
npm run dev
# -> http://localhost:5173
```

Vite proxies `/api/*` to `localhost:8787` in dev, so the frontend never
touches the Groq key directly.

## Handling bad AI output

This was the actual point of the assignment, so a rundown of where the
guardrails live:

- **Groq's `json_object` mode** guarantees the response parses as JSON, but
  it doesn't enforce *our* shape — no fields required, nothing stopping an
  empty `days` array. So the prompt spells out the exact structure, and
  everything past that is validation, not trust.
- **`isValidItinerary()`** in `itinerarySchema.js` walks the parsed object
  and checks every day has a theme and stops, every stop has a name and
  description. Runs on the server before anything ships to the client, and
  again on the client (`validateItinerary.js`) before it ever touches state
  — two network hops, two checks.
- **One retry** with a stricter prompt if validation fails the first time.
  If it still fails, the server sends back a clear error instead of a 500.
- **Stale responses can't win.** `useTripPlan.js` tags each request with an
  incrementing id and aborts the previous controller on every new submit.
  If you fire off a second trip before the first one lands, the first
  response gets thrown away even if it arrives after — no flicker, no
  overwritten result.
- **Every failure mode gets its own message:** empty input, request too
  long, missing API key, Groq timeout, Groq network failure, malformed JSON,
  wrong shape after retry. All render through the same `ErrorState` with a
  **Try again** button rather than a blank screen.

## Interactive bits

- Stops sit along a route-line layout grouped by day; click one to expand
  its description.
- **Reorder** with ↑ / ↓ inside a day — chose this over drag-and-drop so it
  works the same on a phone as a trackpad, no extra library needed.
- **Remove** a stop with ✕; an emptied-out day says so instead of just
  vanishing.
- Responsive down to small phones.

## AI-usage note

Used Claude to scaffold the Express backend, the request-id/AbortController
pattern in `useTripPlan.js`, and most of the CSS. I went through and adjusted
the Groq prompt, the validation logic, and the layout myself — happy to
walk through any of it.

## Known limitations

- No login or persistence — refresh and the itinerary's gone (save/reload
  was a stretch goal, skipped it).
- Reordering only works within a day, not across days.
- Retry is a single attempt, no backoff — fine for a take-home, not for
  real traffic.
- No streaming, the itinerary arrives all at once.
- Not deployed; run it locally per the steps above.

## Time spent

~[X] hours — *(fill in before you submit)*.
