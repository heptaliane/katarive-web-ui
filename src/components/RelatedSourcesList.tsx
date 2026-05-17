import { SourceSummary, JobStatus } from "../gen/api/v1/api_pb";

export type NarrationStatus = 'idle' | 'pending' | 'processing' | 'completed' | 'failed';

interface Props {
  sources: SourceSummary[];
  status: JobStatus;
  onSelect: (url: string) => void;
  isLoading: boolean;
  sourceStatuses: Record<string, NarrationStatus>;
  isBatchActive: boolean;
  isBatchPaused: boolean;
  onNarrateAll: () => void;
  onPause: () => void;
  onResume: () => void;
  onCancelBatch: () => void;
}

export const RelatedSourcesList = ({
  sources,
  status,
  onSelect,
  isLoading,
  sourceStatuses,
  isBatchActive,
  isBatchPaused,
  onNarrateAll,
  onPause,
  onResume,
  onCancelBatch
}: Props) => {
  const isProgressing = status === JobStatus.PROGRESSING;

  // Calculate batch metrics
  const total = sources.length;
  const completed = sources.filter(s => sourceStatuses[s.url] === 'completed').length;
  const failed = sources.filter(s => sourceStatuses[s.url] === 'failed').length;
  const processing = sources.filter(s => sourceStatuses[s.url] === 'processing').length;
  const progressPercent = total > 0 ? Math.round(((completed + failed) / total) * 100) : 0;

  // Helper to render visual indicator badge
  const renderStatusBadge = (url: string) => {
    const sStatus = sourceStatuses[url] || 'idle';
    switch (sStatus) {
      case 'idle':
        return (
          <span 
            className="source-status-badge status-indicator-idle" 
            title="Idle"
            data-testid={`status-idle-${url}`}
          >
            •
          </span>
        );
      case 'pending':
        return (
          <span 
            className="source-status-badge status-indicator-pending" 
            title="Pending in Queue"
            data-testid={`status-pending-${url}`}
          >
            ⋯
          </span>
        );
      case 'processing':
        return (
          <span 
            className="source-status-badge status-indicator-processing" 
            title="Currently Narrating"
            data-testid={`status-processing-${url}`}
          >
            ⚡
          </span>
        );
      case 'completed':
        return (
          <span 
            className="source-status-badge status-indicator-completed" 
            title="Narration Completed"
            data-testid={`status-completed-${url}`}
          >
            ✓
          </span>
        );
      case 'failed':
        return (
          <span 
            className="source-status-badge status-indicator-failed" 
            title="Failed"
            data-testid={`status-failed-${url}`}
          >
            ✗
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="related-sources-panel">
      <h3>Related Sources</h3>

      {sources.length > 0 && (
        <div className="batch-toolbar">
          <div className="batch-buttons">
            {!isBatchActive ? (
              <button 
                onClick={onNarrateAll}
                disabled={isLoading}
                className="batch-btn batch-btn-primary"
                type="button"
              >
                Narrate All
              </button>
            ) : (
              <>
                {!isBatchPaused ? (
                  <button 
                    onClick={onPause}
                    className="batch-btn batch-btn-secondary"
                    type="button"
                  >
                    Pause
                  </button>
                ) : (
                  <button 
                    onClick={onResume}
                    disabled={isLoading}
                    className="batch-btn batch-btn-primary"
                    type="button"
                  >
                    Resume
                  </button>
                )}
                <button 
                  onClick={onCancelBatch}
                  className="batch-btn batch-btn-danger"
                  type="button"
                >
                  Cancel
                </button>
              </>
            )}
          </div>

          {isBatchActive && (
            <div style={{ marginTop: '0.5rem' }}>
              <div className="batch-progress-summary">
                <span>
                  Progress: {completed + failed} / {total} 
                  {processing > 0 && " (1 active)"}
                  {failed > 0 && ` (${failed} failed)`}
                </span>
                <span>{progressPercent}%</span>
              </div>
              <div className="progress-bar-container">
                <div 
                  className="progress-bar-fill" 
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      )}

      {isProgressing && sources.length === 0 && (
        <div className="loading-container" style={{ margin: '1rem 0' }}>
          <span className="loader"></span>
          <span style={{ marginLeft: '0.5rem', opacity: 0.7 }}>Finding related sources...</span>
        </div>
      )}

      {!isProgressing && sources.length === 0 && (
        <div className="empty-sources-placeholder" style={{ padding: '2.5rem 1rem', textAlign: 'center', opacity: 0.5, border: '1px dashed rgba(255, 255, 255, 0.1)', borderRadius: '16px', margin: '1rem 0' }}>
          <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: '1.5' }}>
            Enter a URL and generate narration to discover related sources.
          </p>
        </div>
      )}

      {sources.length > 0 && (
        <ul className="sources-list">
          {sources.map((source) => (
            <li key={source.id} className="source-item">
              <div className="source-item-content">
                <div className="source-item-button-wrapper">
                  <button 
                    onClick={() => onSelect(source.url)}
                    disabled={isLoading || isBatchActive}
                    className="source-button"
                    type="button"
                  >
                    <span className="source-title">{source.title}</span>
                    <span className="source-url">{source.url}</span>
                  </button>
                </div>
                {renderStatusBadge(source.url)}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
