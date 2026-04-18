import { GetJobStatusResponse_Status } from "../gen/api/v1/api_pb";

interface Props {
  status: GetJobStatusResponse_Status;
}

export const JobStatusCard = ({ status }: Props) => {
  const getStatusText = () => {
    switch (status) {
      case GetJobStatusResponse_Status.PROGRESSING:
        return { text: "Progressing", class: "status-progressing" };
      case GetJobStatusResponse_Status.COMPLETED:
        return { text: "Success", class: "status-completed" };
      case GetJobStatusResponse_Status.FAILED:
        return { text: "Failed", class: "status-failed" };
      case GetJobStatusResponse_Status.NOT_FOUND:
        return { text: "Not Found", class: "status-failed" };
      default:
        return { text: "Unknown", class: "" };
    }
  };

  const statusInfo = getStatusText();

  return (
    <div className={`status-badge ${statusInfo.class}`}>
      {statusInfo.text}
    </div>
  );
};
