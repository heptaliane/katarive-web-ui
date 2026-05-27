import { JobStatus } from "../gen/api/v1/api_pb";

interface Props {
  status: JobStatus;
  title?: string;
}

export const JobStatusCard = ({ status, title }: Props) => {
  const getStatusText = () => {
    switch (status) {
      case JobStatus.PROGRESSING:
        return { text: "Progressing", class: "status-progressing" };
      case JobStatus.COMPLETED:
        return { text: "Success", class: "status-completed" };
      case JobStatus.FAILED:
        return { text: "Failed", class: "status-failed" };
      case JobStatus.NOT_FOUND:
        return { text: "Not Found", class: "status-failed" };
      default:
        return { text: "Unknown", class: "" };
    }
  };

  const statusInfo = getStatusText();

  return (
    <div className="job-status-card">
      {title && (
        <p className="job-status-title">{title}</p>
      )}
      <div className={`status-badge ${statusInfo.class}`}>
        {statusInfo.text}
      </div>
    </div>
  );
};
