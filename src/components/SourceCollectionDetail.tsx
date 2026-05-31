import { useApp } from "../store/AppContext";
import { JobStatus } from "../gen/api/v1/api_pb";

export function SourceCollectionDetail() {
  const {
    state,
    selectSourceItem,
    refreshCollectionDetail,
    startBatchNarration,
    cancelBatchNarration,
    selectBatchItem,
  } = useApp();
  const {
    selectedCollection,
    collectionItems,
    collectionDetailLoading,
    selectedSourceItemUrl,
    batchNarration,
    selectedNarrator,
    selectedSpeakerId,
  } = state;

  if (!selectedCollection && !collectionDetailLoading) {
    return (
      <section className="panel source-collection-detail empty">
        <div className="panel-empty">Select a collection</div>
      </section>
    );
  }

  if (!selectedCollection && collectionDetailLoading) {
    return (
      <section className="panel source-collection-detail">
        <div className="panel-loading">Loading...</div>
      </section>
    );
  }

  const canBatch =
    !collectionDetailLoading &&
    !!selectedNarrator &&
    selectedSpeakerId !== null &&
    collectionItems.length > 0;
  const batchCompleted =
    batchNarration?.items.filter((i) => i.status === JobStatus.COMPLETED)
      .length ?? 0;
  const batchTotal = batchNarration?.items.length ?? 0;
  const batchProgress =
    batchTotal > 0 ? Math.round((batchCompleted / batchTotal) * 100) : 0;

  return (
    <section className="panel source-collection-detail">
      <div className="panel-header">{selectedCollection?.title}</div>
      <div className="collection-meta">
        {selectedCollection?.author && (
          <span className="meta-tag">by {selectedCollection.author}</span>
        )}
        {selectedCollection?.tags.map((tag) => (
          <span key={tag} className="meta-tag">
            #{tag}
          </span>
        ))}
      </div>
      {selectedCollection?.description && (
        <p className="collection-description">
          {selectedCollection.description}
        </p>
      )}

      {/* Toolbar: Items count + batch + refresh */}
      <div className="source-list-header">
        <span>
          Items ({collectionItems.length})
          {collectionDetailLoading && (
            <span className="refreshing-indicator"> Refreshing...</span>
          )}
        </span>
        <div className="source-list-actions">
          {batchNarration?.isRunning ? (
            <button
              className="batch-btn cancel"
              onClick={cancelBatchNarration}
              title="Cancel batch narration"
            >
              ✕
            </button>
          ) : (
            <button
              className={`batch-btn ${canBatch ? "active" : "disabled"}`}
              onClick={startBatchNarration}
              disabled={!canBatch}
              title="Generate narration for all items"
            >
              ▶▶
            </button>
          )}
          <button
            className="refresh-btn"
            onClick={refreshCollectionDetail}
            disabled={collectionDetailLoading || batchNarration?.isRunning}
            title="Refresh (disable cache)"
          >
            ↻
          </button>
        </div>
      </div>

      {/* Batch progress bar */}
      {batchNarration && (
        <div className="batch-progress-area">
          <div className="batch-progress-label">
            {batchNarration.isRunning
              ? `Generating... ${batchCompleted} / ${batchTotal}`
              : `Completed ${batchCompleted} / ${batchTotal}`}
          </div>
          <div className="batch-progress-bar">
            <div
              className="batch-progress-fill"
              style={{ width: `${batchProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Item list */}
      <ul
        className={`source-list ${collectionDetailLoading ? "disabled" : ""}`}
      >
        {collectionItems.map((item, i) => {
          const batchItem = batchNarration?.items[i];
          const isCompleted = batchItem?.status === JobStatus.COMPLETED;
          const isProgressing =
            batchItem?.status === JobStatus.PROGRESSING &&
            batchNarration?.currentIndex === i;
          const isFailed = batchItem?.status === JobStatus.FAILED;

          return (
            <li
              key={item.id}
              className={[
                "source-item",
                item.url === selectedSourceItemUrl ? "selected" : "",
                collectionDetailLoading ? "disabled" : "",
                isCompleted ? "batch-completed" : "",
                isProgressing ? "batch-progressing" : "",
                isFailed ? "batch-failed" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => {
                if (collectionDetailLoading) return;
                if (isCompleted) {
                  selectBatchItem(i);
                } else {
                  selectSourceItem(item.url);
                }
              }}
            >
              <div className="source-item-title">
                {item.title}
                {isCompleted && <span className="batch-status-icon">✓</span>}
                {isProgressing && (
                  <span className="batch-status-icon spinning">⟳</span>
                )}
                {isFailed && (
                  <span className="batch-status-icon failed">✕</span>
                )}
              </div>
              <div className="source-item-url">{item.url}</div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
