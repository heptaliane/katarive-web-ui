import { useApp } from "../store/AppContext";
import { JobStatus } from "../gen/api/v1/api_pb";

function StatusBadge({ status }: { status: JobStatus }) {
  const map: Record<JobStatus, { label: string; className: string }> = {
    [JobStatus.UNSPECIFIED]: { label: "—", className: "status-unspecified" },
    [JobStatus.PROGRESSING]: {
      label: "Progressing",
      className: "status-progressing",
    },
    [JobStatus.COMPLETED]: {
      label: "Completed",
      className: "status-completed",
    },
    [JobStatus.FAILED]: { label: "Failed", className: "status-failed" },
    [JobStatus.NOT_FOUND]: {
      label: "Not Found",
      className: "status-not-found",
    },
  };
  const { label, className } = map[status] ?? map[JobStatus.UNSPECIFIED];
  return <span className={`status-badge ${className}`}>{label}</span>;
}

export function SourceItemNarration() {
  const { state } = useApp();
  const {
    selectedSourceItemId,
    sourceItemLoading,
    sourceItemStatus,
    sourceItemMetadata,
    sourceItemContent,
    narration,
  } = state;

  if (!selectedSourceItemId && !sourceItemLoading) {
    return (
      <section className="panel source-item-narration empty">
        <div className="panel-empty">Select Item</div>
      </section>
    );
  }

  return (
    <section className="panel source-item-narration">
      {sourceItemLoading ? (
        <div className="panel-loading">Loading...</div>
      ) : (
        <>
          <div className="panel-header">
            {sourceItemMetadata?.title ?? "SourceItem"}
            {sourceItemStatus !== null && (
              <StatusBadge status={sourceItemStatus} />
            )}
          </div>

          {sourceItemMetadata?.url && (
            <a
              className="source-item-url-link"
              href={sourceItemMetadata.url}
              target="_blank"
              rel="noreferrer"
            >
              {sourceItemMetadata.url}
            </a>
          )}

          {sourceItemContent && (
            <div className="source-item-content">{sourceItemContent}</div>
          )}

          {/* Narration Area */}
          <div className="narration-area">
            <div className="narration-area-header">Narration</div>
            {narration ? (
              <div className="narration-status">
                <StatusBadge status={narration.status} />
                {narration.status === JobStatus.COMPLETED &&
                  narration.audioPath && (
                    <audio
                      className="narration-audio"
                      controls
                      src={narration.audioPath}
                    />
                  )}
                {narration.status === JobStatus.PROGRESSING && (
                  <div className="narration-waiting">
                    Generating narration...
                  </div>
                )}
                {narration.status === JobStatus.FAILED && (
                  <div className="narration-error">
                    Failed to generate narration
                  </div>
                )}
              </div>
            ) : (
              <div className="narration-empty">
                Enter the URL in the header and press 'Create' to generate
                narration.
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}
