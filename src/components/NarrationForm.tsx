import { useState, useMemo } from "react";
import { useGetNarrators } from "../hooks/useGetNarrators";
import { Narrator, Speaker } from "../gen/api/v1/api_pb";

interface Props {
  onSubmit: (url: string, narrator: string, speakerId: number) => void;
  isLoading: boolean;
  disabled: boolean;
}

interface FlattenedSpeaker {
  narratorName: string;
  speakerId: number;
  speakerLabel: string;
  key: string;
}

export const NarrationForm = ({ onSubmit, isLoading, disabled }: Props) => {
  const [url, setUrl] = useState("");
  const { data: narratorsData, isLoading: isNarratorsLoading } = useGetNarrators();
  const [selectedSpeakerKey, setSelectedSpeakerKey] = useState<string>("");

  const flattenedSpeakers = useMemo<FlattenedSpeaker[]>(() => {
    if (!narratorsData?.narrator) return [];
    return narratorsData.narrator.flatMap((n: Narrator) => 
      n.speakers.map((s: Speaker) => ({
        narratorName: n.name,
        speakerId: s.id,
        speakerLabel: s.label,
        key: `${n.name}-${s.id}`
      }))
    );
  }, [narratorsData]);

  // Set default selection when speakers are loaded
  useMemo(() => {
    if (flattenedSpeakers.length > 0 && !selectedSpeakerKey) {
      setSelectedSpeakerKey(flattenedSpeakers[0].key);
    }
  }, [flattenedSpeakers, selectedSpeakerKey]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const speaker = flattenedSpeakers.find(s => s.key === selectedSpeakerKey);
    if (url.trim() && speaker) {
      onSubmit(url.trim(), speaker.narratorName, speaker.speakerId);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="narration-form">
      <div className="input-group">
        <label htmlFor="url-input">Source URL</label>
        <input
          id="url-input"
          type="text"
          placeholder="https://example.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={disabled}
        />
      </div>

      <div className="input-group">
        <label htmlFor="speaker-select">Select Speaker</label>
        {isNarratorsLoading ? (
          <div className="loading-text">Loading speakers...</div>
        ) : (
          <select
            id="speaker-select"
            value={selectedSpeakerKey}
            onChange={(e) => setSelectedSpeakerKey(e.target.value)}
            disabled={disabled || flattenedSpeakers.length === 0}
          >
            {flattenedSpeakers.map((s) => (
              <option key={s.key} value={s.key}>
                {s.speakerLabel} ({s.narratorName})
              </option>
            ))}
            {flattenedSpeakers.length === 0 && <option>No speakers available</option>}
          </select>
        )}
      </div>

      <button 
        type="submit" 
        className="generate-button"
        disabled={disabled || !url.trim() || isLoading || flattenedSpeakers.length === 0}
      >
        {isLoading ? (
          <>
            <span className="loader"></span> Generating...
          </>
        ) : (
          "Generate Narration"
        )}
      </button>
    </form>
  );
};
