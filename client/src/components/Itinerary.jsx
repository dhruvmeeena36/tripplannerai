import StopCard from "./StopCard.jsx";

export default function Itinerary({ itinerary, setItinerary, onPlanAnother }) {
  function updateDayStops(dayIndex, updater) {
    setItinerary((prev) => {
      const days = prev.days.map((day, i) =>
        i === dayIndex ? { ...day, stops: updater(day.stops) } : day
      );
      return { ...prev, days };
    });
  }

  function removeStop(dayIndex, stopId) {
    updateDayStops(dayIndex, (stops) => stops.filter((s) => s._id !== stopId));
  }

  function moveStop(dayIndex, stopIndex, direction) {
    updateDayStops(dayIndex, (stops) => {
      const target = stopIndex + direction;
      if (target < 0 || target >= stops.length) return stops;
      const next = [...stops];
      [next[stopIndex], next[target]] = [next[target], next[stopIndex]];
      return next;
    });
  }

  return (
    <div>
      <div className="itinerary-header">
        <div className="eyebrow">{itinerary.destination || "Your trip"}</div>
        <h2>{itinerary.tripTitle}</h2>
      </div>

      <div className="route">
        {itinerary.days.map((day, dayIndex) => (
          <div className="day-block" key={day.day ?? dayIndex}>
            <div className="day-marker">{day.day ?? dayIndex + 1}</div>
            <div className="day-theme">{day.theme}</div>

            {day.stops.length === 0 ? (
              <p style={{ color: "var(--ink-faint)", fontSize: 14 }}>
                No stops left for this day — removed them all.
              </p>
            ) : (
              day.stops.map((stop, stopIndex) => (
                <StopCard
                  key={stop._id}
                  stop={stop}
                  isFirst={stopIndex === 0}
                  isLast={stopIndex === day.stops.length - 1}
                  onRemove={() => removeStop(dayIndex, stop._id)}
                  onMoveUp={() => moveStop(dayIndex, stopIndex, -1)}
                  onMoveDown={() => moveStop(dayIndex, stopIndex, 1)}
                />
              ))
            )}
          </div>
        ))}
      </div>

      <div className="itinerary-footer">
        <button className="btn-secondary" onClick={onPlanAnother}>
          Plan another trip
        </button>
      </div>
    </div>
  );
}
