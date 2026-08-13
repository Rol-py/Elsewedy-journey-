export default function CheckpointCard({ activeCheckpoint, progress, justReachedMessage }) {
  if (!activeCheckpoint && !justReachedMessage && progress.total === 0) {
    return null;
  }

  return (
    <div className="checkpoint-card">
      {justReachedMessage && (
        <p className="checkpoint-card__reached">{justReachedMessage}</p>
      )}

      {activeCheckpoint ? (
        <>
          <span className="checkpoint-card__label">
            Next checkpoint · {progress.completed}/{progress.total}
          </span>
          <span className="checkpoint-card__name">{activeCheckpoint.name}</span>
        </>
      ) : progress.total > 0 ? (
        <span className="checkpoint-card__label">All checkpoints complete ✓</span>
      ) : null}
    </div>
  );
}
