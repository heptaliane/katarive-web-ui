import { useState } from "react";
import { useGetSpeakers } from "../hooks/useGetSpeakers";
import { Speaker } from "../gen/api/v1/api_pb";

interface Props {
  onSubmit: (url: string, narrator: string, speakerId: number) => void;
  isLoading: boolean;
  disabled: boolean;
}

export const NarrationForm = ({ onSubmit, isLoading, disabled }: Props) => {
  const [url, setUrl] = useState("");
  const { data: speakersData, isLoading: isSpeakersLoading } = useGetSpeakers();
  const [selectedSpeakerIndex, setSelectedSpeakerIndex] = useState<number>(0);

  const speakers: Speaker[] = speakersData?.speakers || [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const speaker = speakers[selectedSpeakerIndex];
    if (url.trim() && speaker) {
      onSubmit(url.trim(), speaker.narrator, speaker.speakerId);
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
        {isSpeakersLoading ? (
          <div className="loading-text">Loading speakers...</div>
        ) : (
          <select
            id="speaker-select"
            value={selectedSpeakerIndex}
            onChange={(e) => setSelectedSpeakerIndex(Number(e.target.value))}
            disabled={disabled || speakers.length === 0}
          >
            {speakers.map((speaker: Speaker, index: number) => (
              <option key={`${speaker.narrator}-${speaker.speakerId}`} value={index}>
                {speaker.speakerLabel} ({speaker.narrator})
              </option>
            ))}
            {speakers.length === 0 && <option>No speakers available</option>}
          </select>
        )}
      </div>

      <button 
        type="submit" 
        className="generate-button"
        disabled={disabled || !url.trim() || isLoading || speakers.length === 0}
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
