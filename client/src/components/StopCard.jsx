import { useState } from "react";

const CATEGORY_LABEL = {
  food: "Food",
  sight: "Sight",
  activity: "Activity",
  transport: "Transport",
  rest: "Rest",
};

export default function StopCard({ stop, onRemove, onMoveUp, onMoveDown, isFirst, isLast }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`stop-card${expanded ? " expanded" : ""}`}>
      <div
        className="stop-top"
        onClick={() => setExpanded((v) => !v)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setExpanded((v) => !v);
          }
        }}
        aria-expanded={expanded}
      >
        {stop.time && <span className="stop-time">{stop.time}</span>}
        <div className="stop-main">
          <div className="stop-name">{stop.name}</div>
          {stop.category && (
            <div className="stop-category">{CATEGORY_LABEL[stop.category] || stop.category}</div>
          )}
          {expanded && stop.description && (
            <p className="stop-description">{stop.description}</p>
          )}
        </div>
        <span className="chevron" aria-hidden="true">
          ▾
        </span>
      </div>

      <div className="stop-controls">
        <button
          className="icon-btn"
          aria-label="Move stop up"
          disabled={isFirst}
          onClick={onMoveUp}
        >
          ↑
        </button>
        <button
          className="icon-btn"
          aria-label="Move stop down"
          disabled={isLast}
          onClick={onMoveDown}
        >
          ↓
        </button>
        <button className="icon-btn remove" aria-label="Remove stop" onClick={onRemove}>
          ✕
        </button>
      </div>
    </div>
  );
}
