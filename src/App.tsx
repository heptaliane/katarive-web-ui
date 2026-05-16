import { useState } from "react";
import { useQueueNarration } from "./hooks/useQueueNarration";
import { useJobStatus } from "./hooks/useJobStatus";
import { NarrationForm } from "./components/NarrationForm";
import { JobStatusCard } from "./components/JobStatusCard";
import { AudioPlayer } from "./components/AudioPlayer";
import { JobStatus } from "./gen/api/v1/api_pb";

function App() {
  const [jobId, setJobId] = useState<string | null>(null);
  const queueNarration = useQueueNarration();
  const { data: jobStatus, error: statusError } = useJobStatus(jobId);

  const handleCreate = (url: string, narrator: string, speakerId: number) => {
    console.log("Starting QueueNarration for:", { url, narrator, speakerId });
    setJobId(null);
    queueNarration.mutate({ url, narrator, speakerId }, {
      onSuccess: (res: any) => {
        console.log("QueueNarration Success:", res);
        setJobId(res.id);
      },
      onError: (err) => {
        console.error("QueueNarration Error:", err);
      }
    });
  };

  // Log every job status change
  if (jobStatus) {
    console.log("JobStatus Update:", { jobId, status: jobStatus.status, path: jobStatus.path });
  }

  // Log polling errors if they occur
  if (statusError) {
    console.error("GetNarration Polling Error:", statusError);
  }

  const isProgressing = jobStatus?.status === JobStatus.PROGRESSING;
  const isCompleted = jobStatus?.status === JobStatus.COMPLETED;
  const isFailed = jobStatus?.status === JobStatus.FAILED || 
                 jobStatus?.status === JobStatus.NOT_FOUND;

  return (
    <div className="card">
      <h1>Katarive</h1>
      <p style={{ opacity: 0.7, marginBottom: '2rem' }}>
        Paste a URL and generate its narration in seconds.
      </p>

      <NarrationForm 
        onSubmit={handleCreate} 
        isLoading={queueNarration.isPending} 
        disabled={isProgressing}
      />

      {queueNarration.isError && (
        <p className="status-failed" style={{ marginTop: '1rem', padding: '0.5rem', borderRadius: '8px' }}>
          Failed to start job: {queueNarration.error.message}
        </p>
      )}

      {jobId && jobStatus && (
        <>
          <JobStatusCard status={jobStatus.status} />
          
          {isCompleted && jobStatus.path && (
            <AudioPlayer path={jobStatus.path} />
          )}

          {isFailed && (
            <p style={{ marginTop: '1rem', color: '#ef4444' }}>
              Something went wrong. Please try again.
            </p>
          )}
        </>
      )}

      {statusError && (
        <p style={{ marginTop: '1rem', color: '#ef4444' }}>
          Error polling status: {statusError.message}
        </p>
      )}
    </div>
  );
}

export default App;
