import { useState, useEffect, useRef, useCallback } from "react";
import { useQueueNarration } from "./hooks/useQueueNarration";
import { useJobStatus } from "./hooks/useJobStatus";
import { useQueueSourceCollection, useSourceCollection } from "./hooks/useSourceCollection";
import { NarrationForm } from "./components/NarrationForm";
import { JobStatusCard } from "./components/JobStatusCard";
import { RelatedSourcesList } from "./components/RelatedSourcesList";
import { AudioPlayer } from "./components/AudioPlayer";
import { JobStatus } from "./gen/api/v1/api_pb";

function App() {
  const [url, setUrl] = useState("");
  const [selectedSpeakerKey, setSelectedSpeakerKey] = useState("");
  const [jobId, setJobId] = useState<string | null>(null);
  const [collectionId, setCollectionId] = useState<string | null>(null);
  const [autoNarrate, setAutoNarrate] = useState(false);

  const queueNarration = useQueueNarration();
  const { data: jobStatus, error: statusError } = useJobStatus(jobId);

  const queueSourceCollection = useQueueSourceCollection();
  const { data: collectionData } = useSourceCollection(collectionId);

  const autoNarratedJobIdRef = useRef<string | null>(null);

  const handleCreate = useCallback((url: string, narrator: string, speakerId: number) => {
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

    // Also fetch related sources for this URL only if it's not already in the displayed sources
    const isAlreadyInCollection = collectionData?.sources?.some(s => s.url === url);
    if (!isAlreadyInCollection) {
      console.log("Starting QueueSourceCollection for:", url);
      queueSourceCollection.mutate(url, {
        onSuccess: (res: any) => {
          console.log("QueueSourceCollection Success:", res);
          setCollectionId(res.id);
        }
      });
    } else {
      console.log("URL is already in the currently displayed sources. Skipping QueueSourceCollection.");
    }
  }, [queueNarration, queueSourceCollection, collectionData]);

  const handleSelectRelated = useCallback((newUrl: string) => {
    setUrl(newUrl);
    // Trigger narration for the new URL using the currently selected speaker
    if (selectedSpeakerKey) {
      const [narrator, speakerIdStr] = selectedSpeakerKey.split("-");
      handleCreate(newUrl, narrator, parseInt(speakerIdStr, 10));
    }
  }, [setUrl, selectedSpeakerKey, handleCreate]);

  // Automatically trigger narration for the next source once the currently narrating source is completed
  useEffect(() => {
    if (
      autoNarrate &&
      jobId &&
      jobStatus?.status === JobStatus.COMPLETED &&
      autoNarratedJobIdRef.current !== jobId
    ) {
      autoNarratedJobIdRef.current = jobId;
      if (collectionData?.sources) {
        const currentIndex = collectionData.sources.findIndex(s => s.url === url);
        if (currentIndex !== -1 && currentIndex + 1 < collectionData.sources.length) {
          const nextSource = collectionData.sources[currentIndex + 1];
          console.log("Auto progression triggering for next source:", nextSource.url);
          handleSelectRelated(nextSource.url);
        }
      }
    }
  }, [autoNarrate, jobId, jobStatus, collectionData, url, handleSelectRelated]);


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
        url={url}
        onUrlChange={setUrl}
        selectedSpeakerKey={selectedSpeakerKey}
        onSpeakerKeyChange={setSelectedSpeakerKey}
        onSubmit={handleCreate} 
        isLoading={queueNarration.isPending} 
        disabled={isProgressing}
        autoNarrate={autoNarrate}
        onAutoNarrateChange={setAutoNarrate}
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

      {collectionData && (
        <RelatedSourcesList 
          sources={collectionData.sources}
          status={collectionData.status}
          onSelect={handleSelectRelated}
          isLoading={queueNarration.isPending}
        />
      )}
    </div>
  );
}

export default App;
