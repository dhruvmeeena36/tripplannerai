import { useState } from "react";

const EXAMPLES = [
  "4 days in Kyoto, slow-paced, love temples and good coffee",
  "Weekend in Goa with friends, beaches and nightlife",
  "5-day solo backpacking trip through Himachal, budget-friendly",
];

const MAX_LEN = 2000;

export default function TripForm({ onSubmit, disabled }) {
  const [text, setText] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSubmit(trimmed);
  }

  return (
    <form className="trip-form" onSubmit={handleSubmit}>
      <textarea
        value={text}
        maxLength={MAX_LEN}
        placeholder="Describe your trip — destination, duration, pace, interests, budget... anything that helps."
        onChange={(e) => setText(e.target.value)}
        aria-label="Trip description"
      />
      <div className="example-chips">
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            type="button"
            className="example-chip"
            onClick={() => setText(ex)}
          >
            {ex}
          </button>
        ))}
      </div>
      <div className="form-row">
        <span className="char-count">
          {text.length}/{MAX_LEN}
        </span>
        <button type="submit" className="btn-primary" disabled={disabled || !text.trim()}>
          {disabled ? "Planning…" : "Plan my trip"}
        </button>
      </div>
    </form>
  );
}
