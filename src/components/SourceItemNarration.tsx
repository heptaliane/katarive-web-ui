import { useState } from "react";
import { useApp } from "../store/AppContext";
import { JobStatus } from "../gen/api/v1/api_pb";

function StatusBadge({ status }: { status: JobStatus }) {
  const map: Record<JobStatus, { label: string; className: string }> = {
    [JobStatus.UNSPECIFIED]: { label: "—", className: "status-unspecified" },
    [JobStatus.PROGRESSING]: {
      label: "Processing...",
      className: "status-progressing",
    },
    [JobStatus.COMPLETED]: {
      label: "Completed",
      className: "status-completed",
    },
    [JobStatus.FAILED]: { label: "Failed", className: "status-failed" },
    [JobStatus.NOT_FOUND]: {
      label: "Not found",
      className: "status-not-found",
    },
  };
  const { label, className } = map[status] ?? map[JobStatus.UNSPECIFIED];
  return <span className={`status-badge ${className}`}>{label}</span>;
}

const CONTENT_COLLAPSED_LINES = 4;

export function SourceItemNarration() {
  const { state, retryNarration } = useApp();
  const {
    selectedSourceItemUrl,
    sourceItemLoading,
    sourceItemStatus,
    sourceItem,
    narration,
  } = state;

  const [contentExpanded, setContentExpanded] = useState(false);

  if (!selectedSourceItemUrl && !sourceItemLoading) {
    return (
      <section className="panel source-item-narration empty">
        <div className="panel-empty">Select an item or enter a URL</div>
      </section>
    );
  }

  return (
    <section className="panel source-item-narration">
      {sourceItemLoading ? (
        <div className="panel-loading">Loading...</div>
      ) : (
        <>
          {/* Title + status */}
          <div className="panel-header">
            {sourceItem?.title ?? "Source Item"}
            {sourceItemStatus !== null && (
              <StatusBadge status={sourceItemStatus} />
            )}
          </div>

          {/* Audio player — directly below the title */}
          {narration && (
            <div className="narration-audio-area">
              {narration.status === JobStatus.COMPLETED &&
              narration.audioPath ? (
                <audio
                  className="narration-audio"
                  controls
                  src={narration.audioPath}
                />
              ) : narration.status === JobStatus.PROGRESSING ? (
                <div className="narration-waiting">Generating audio...</div>
              ) : narration.status === JobStatus.FAILED ? (
                <div className="narration-error">
                  Generation failed.{" "}
                  <button
                    className="narration-retry-btn"
                    onClick={retryNarration}
                  >
                    Retry
                  </button>
                </div>
              ) : null}
            </div>
          )}

          {/* URL link */}
          {sourceItem?.url && (
            <a
              className="source-item-url-link"
              href={sourceItem.url}
              target="_blank"
              rel="noreferrer"
            >
              {sourceItem.url}
            </a>
          )}

          {/* Content with collapse */}
          {sourceItem?.content && (
            <div className="source-item-content-wrapper">
              <div
                className={`source-item-content ${contentExpanded ? "expanded" : "collapsed"}`}
                style={
                  contentExpanded
                    ? undefined
                    : { WebkitLineClamp: CONTENT_COLLAPSED_LINES }
                }
              >
                {sourceItem.content}
              </div>
              <button
                className="content-toggle-btn"
                onClick={() => setContentExpanded((v) => !v)}
              >
                {contentExpanded ? "Show less ▲" : "Show more ▼"}
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
