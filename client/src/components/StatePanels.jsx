export function LoadingState() {
  return (
    <div className="state-panel" role="status" aria-live="polite">
      <div className="spinner" />
      <h3>Mapping out your route</h3>
      <p>This usually takes a few seconds.</p>
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="state-panel error" role="alert">
      <h3>That didn't work</h3>
      <p>{message}</p>
      {onRetry && (
        <button className="btn-secondary" style={{ marginTop: 14 }} onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}

export function EmptyState() {
  return (
    <div className="state-panel">
      <h3>No trip planned yet</h3>
      <p>Describe a trip above and your itinerary will show up here.</p>
    </div>
  );
}
