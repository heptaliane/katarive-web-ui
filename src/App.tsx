import { useState, useEffect, useRef, useCallback } from "react";
import { useQueueNarration } from "./hooks/useQueueNarration";
import { useJobStatus } from "./hooks/useJobStatus";
import { useQueueSourceCollection, useSourceCollection } from "./hooks/useSourceCollection";
import { NarrationForm } from "./components/NarrationForm";
import { JobStatusCard } from "./components/JobStatusCard";
import { RelatedSourcesList } from "./components/RelatedSourcesList";
import type { NarrationStatus } from "./components/RelatedSourcesList";
import { AudioPlayer } from "./components/AudioPlayer";
import { KatariveIcon } from "./components/KatariveIcon";
import { JobStatus, SourceSummary } from "./gen/api/v1/api_pb";

function App() {
  const [url, setUrl] = useState("");
  const [selectedSpeakerKey, setSelectedSpeakerKey] = useState("");
  const [mainJobId, setMainJobId] = useState<string | null>(null);
  const [batchJobId, setBatchJobId] = useState<string | null>(null);
  const [collectionId, setCollectionId] = useState<string | null>(null);
  const [isBatchActive, setIsBatchActive] = useState(false);
  const [isBatchPaused, setIsBatchPaused] = useState(false);
  const [sourceStatuses, setSourceStatuses] = useState<Record<string, NarrationStatus>>({});

  const queueNarration = useQueueNarration();
  const { data: mainJobStatus, error: mainStatusError } = useJobStatus(mainJobId);
  const { data: batchJobStatus } = useJobStatus(batchJobId);

  const queueSourceCollection = useQueueSourceCollection();
  const { data: collectionData } = useSourceCollection(collectionId);

  const handleCreate = useCallback((urlToQueue: string, narrator: string, speakerId: number) => {
    console.log("Starting Main QueueNarration for:", { urlToQueue, narrator, speakerId });
    setMainJobId(null);
    queueNarration.mutate({ url: urlToQueue, narrator, speakerId }, {
      onSuccess: (res: any) => {
        console.log("Main QueueNarration Success:", res);
        setMainJobId(res.id);
      },
      onError: (err) => {
        console.error("Main QueueNarration Error:", err);
      }
    });

    // Also fetch related sources for this URL only if it's not already in the displayed sources
    const isAlreadyInCollection = collectionData?.sources?.some((s: SourceSummary) => s.url === urlToQueue);
    if (!isAlreadyInCollection) {
      console.log("Starting QueueSourceCollection for:", urlToQueue);
      queueSourceCollection.mutate({ url: urlToQueue }, {
        onSuccess: (res: any) => {
          console.log("QueueSourceCollection Success:", res);
          setCollectionId(res.id);
        }
      });
    } else {
      console.log("URL is already in the currently displayed sources. Skipping QueueSourceCollection.");
    }
  }, [queueNarration, queueSourceCollection, collectionData]);

  const handleNarrateAll = useCallback(() => {
    if (!collectionData?.sources || collectionData.sources.length === 0) return;

    const firstSource = collectionData.sources[0];
    const initialStatuses: Record<string, NarrationStatus> = {};
    collectionData.sources.forEach((s: SourceSummary, idx: number) => {
      initialStatuses[s.url] = idx === 0 ? 'processing' : 'pending';
    });

    setSourceStatuses(initialStatuses);
    setIsBatchActive(true);
    setIsBatchPaused(false);
    setBatchJobId(null);

    if (selectedSpeakerKey) {
      const [narrator, speakerIdStr] = selectedSpeakerKey.split("-");
      queueNarration.mutate({ url: firstSource.url, narrator, speakerId: parseInt(speakerIdStr, 10) }, {
        onSuccess: (res: any) => {
          console.log("Batch Narrate All Success:", res);
          setBatchJobId(res.id);
        },
        onError: (err) => {
          console.error("Batch Narrate All Error:", err);
          setSourceStatuses(prev => ({ ...prev, [firstSource.url]: 'failed' }));
        }
      });
    }
  }, [collectionData, selectedSpeakerKey, queueNarration]);

  const handlePause = useCallback(() => {
    setIsBatchPaused(true);
  }, []);

  const handleResume = useCallback(() => {
    if (!collectionData?.sources) return;

    // Find the first URL in the collection that is 'pending' or 'failed'
    const nextPending = collectionData.sources.find((s: SourceSummary) => sourceStatuses[s.url] === 'pending');
    if (nextPending) {
      setSourceStatuses(prev => ({
        ...prev,
        [nextPending.url]: 'processing'
      }));
      setIsBatchPaused(false);
      if (selectedSpeakerKey) {
        const [narrator, speakerIdStr] = selectedSpeakerKey.split("-");
        queueNarration.mutate({ url: nextPending.url, narrator, speakerId: parseInt(speakerIdStr, 10) }, {
          onSuccess: (res: any) => {
            console.log("Batch Resume Success:", res);
            setBatchJobId(res.id);
          },
          onError: (err) => {
            console.error("Batch Resume Error:", err);
            setSourceStatuses(prev => ({ ...prev, [nextPending.url]: 'failed' }));
          }
        });
      }
    } else {
      setIsBatchActive(false);
      setIsBatchPaused(false);
    }
  }, [collectionData, sourceStatuses, selectedSpeakerKey, queueNarration]);

  const handleCancelBatch = useCallback(() => {
    setIsBatchActive(false);
    setIsBatchPaused(false);
    setSourceStatuses({});
    setBatchJobId(null);
  }, []);

  const handleSelectRelated = useCallback((newUrl: string) => {
    setUrl(newUrl);
    // Trigger narration for the new URL using the currently selected speaker
    if (selectedSpeakerKey) {
      const [narrator, speakerIdStr] = selectedSpeakerKey.split("-");
      handleCreate(newUrl, narrator, parseInt(speakerIdStr, 10));
    }
  }, [setUrl, selectedSpeakerKey, handleCreate]);

  const handleRefreshCollection = useCallback(() => {
    if (!collectionData?.collection?.url) return;
    console.log("Starting QueueSourceCollection (Refresh) for:", collectionData.collection.url);
    queueSourceCollection.mutate(
      { url: collectionData.collection.url, disableCache: true },
      {
        onSuccess: (res: any) => {
          console.log("Refresh Collection Success:", res);
          setCollectionId(res.id);
        },
        onError: (err) => {
          console.error("Refresh Collection Error:", err);
        }
      }
    );
  }, [collectionData, queueSourceCollection]);

  const batchCompletedJobIdRef = useRef<string | null>(null);

  // Automatically trigger narration for the next source once the currently narrating source is completed or failed
  useEffect(() => {
    if (!batchJobId || batchCompletedJobIdRef.current === batchJobId) return;

    const isCompleted = batchJobStatus?.status === JobStatus.COMPLETED;
    const isFailed = batchJobStatus?.status === JobStatus.FAILED || batchJobStatus?.status === JobStatus.NOT_FOUND;

    if (isCompleted || isFailed) {
      batchCompletedJobIdRef.current = batchJobId;

      if (collectionData?.sources) {
        const activeSource = collectionData.sources.find((s: SourceSummary) => sourceStatuses[s.url] === 'processing');
        if (activeSource) {
          const activeUrl = activeSource.url;
          setSourceStatuses(prev => ({
            ...prev,
            [activeUrl]: isCompleted ? 'completed' : 'failed'
          }));

          if (!isBatchPaused) {
            const currentIndex = collectionData.sources.findIndex((s: SourceSummary) => s.url === activeUrl);
            if (currentIndex !== -1 && currentIndex + 1 < collectionData.sources.length) {
               const nextSource = collectionData.sources[currentIndex + 1];
               setSourceStatuses(prev => ({
                 ...prev,
                 [nextSource.url]: 'processing'
               }));
               console.log("Auto batch progression triggering for next source:", nextSource.url);
               
               if (selectedSpeakerKey) {
                 const [narrator, speakerIdStr] = selectedSpeakerKey.split("-");
                 queueNarration.mutate({ url: nextSource.url, narrator, speakerId: parseInt(speakerIdStr, 10) }, {
                   onSuccess: (res: any) => {
                     setBatchJobId(res.id);
                   },
                   onError: (err) => {
                     console.error("Batch QueueNarration Error:", err);
                     setSourceStatuses(prev => ({ ...prev, [nextSource.url]: 'failed' }));
                   }
                 });
               }
            } else {
              setIsBatchActive(false);
            }
          }
        }
      }
    }
  }, [batchJobId, batchJobStatus, isBatchPaused, collectionData, sourceStatuses, selectedSpeakerKey, queueNarration]);


  // Log every job status change
  if (mainJobStatus) {
    console.log("Main JobStatus Update:", { mainJobId, status: mainJobStatus.status, path: mainJobStatus.path });
  }
  if (batchJobStatus) {
    console.log("Batch JobStatus Update:", { batchJobId, status: batchJobStatus.status });
  }

  // Log polling errors if they occur
  if (mainStatusError) {
    console.error("GetNarration Polling Error:", mainStatusError);
  }

  const isProgressing = mainJobStatus?.status === JobStatus.PROGRESSING;
  const isCompleted = mainJobStatus?.status === JobStatus.COMPLETED;
  const isFailed = mainJobStatus?.status === JobStatus.FAILED || 
                 mainJobStatus?.status === JobStatus.NOT_FOUND;

  return (
    <div className="app-container">
      <div className="card">
        <div className="brand-header">
          <KatariveIcon size={56} className="brand-logo" />
          <h1>Katarive</h1>
        </div>
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
        />

        {queueNarration.isError && (
          <p className="status-failed" style={{ marginTop: '1rem', padding: '0.5rem', borderRadius: '8px' }}>
            Failed to start job: {queueNarration.error.message}
          </p>
        )}

        {mainJobId && mainJobStatus && (
          <>
            <JobStatusCard status={mainJobStatus.status} />
            
            {isCompleted && mainJobStatus.path && (
              <AudioPlayer path={mainJobStatus.path} />
            )}

            {isFailed && (
              <p style={{ marginTop: '1rem', color: '#ef4444' }}>
                Something went wrong. Please try again.
              </p>
            )}
          </>
        )}

        {mainStatusError && (
          <p style={{ marginTop: '1rem', color: '#ef4444' }}>
            Error polling status: {mainStatusError.message}
          </p>
        )}
      </div>

      <RelatedSourcesList 
        sources={collectionData?.sources || []}
        title={collectionData?.collection?.title}
        status={collectionData?.status ?? 0}
        onSelect={handleSelectRelated}
        isLoading={queueNarration.isPending}
        sourceStatuses={sourceStatuses}
        isBatchActive={isBatchActive}
        isBatchPaused={isBatchPaused}
        onNarrateAll={handleNarrateAll}
        onPause={handlePause}
        onResume={handleResume}
        onCancelBatch={handleCancelBatch}
        onRefresh={handleRefreshCollection}
        isRefreshing={queueSourceCollection.isPending}
      />
    </div>
  );
}

export default App;
