interface Props {
  path: string;
}

export const AudioPlayer = ({ path }: Props) => {
  const baseUrl = import.meta.env.VITE_AUDIO_BASE_URL || "http://localhost:9421";
  // The path from server is like 'data/xxxx.mp3'. 
  // If the static server is pointing at 'data/', we might need to strip it.
  // But usually, it's safer to just provide the full URL logic.
  const audioUrl = `${baseUrl}/${path}`;

  return (
    <div className="audio-container">
      <p style={{ marginBottom: '1rem', opacity: 0.6, fontSize: '0.9rem' }}>Narration Ready</p>
      <audio controls src={audioUrl}>
        Your browser does not support the audio element.
      </audio>
    </div>
  );
};
