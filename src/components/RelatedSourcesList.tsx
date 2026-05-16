import { SourceSummary, JobStatus } from "../gen/api/v1/api_pb";

interface Props {
  sources: SourceSummary[];
  status: JobStatus;
  onSelect: (url: string) => void;
  isLoading: boolean;
}

export const RelatedSourcesList = ({ sources, status, onSelect, isLoading }: Props) => {
  const isProgressing = status === JobStatus.PROGRESSING;

  if (!isProgressing && sources.length === 0) {
    return null;
  }

  return (
    <div className="related-sources">
      <h3>Related Sources</h3>
      {isProgressing && (
        <div className="loading-container" style={{ margin: '1rem 0' }}>
          <span className="loader"></span>
          <span style={{ marginLeft: '0.5rem', opacity: 0.7 }}>Finding related sources...</span>
        </div>
      )}
      <ul className="sources-list">
        {sources.map((source) => (
          <li key={source.id} className="source-item">
            <button 
              onClick={() => onSelect(source.url)}
              disabled={isLoading}
              className="source-button"
            >
              <span className="source-title">{source.title}</span>
              <span className="source-url">{source.url}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};
