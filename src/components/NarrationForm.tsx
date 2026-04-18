import { useState } from "react";

interface Props {
  onSubmit: (url: string) => void;
  isLoading: boolean;
  disabled: boolean;
}

export const NarrationForm = ({ onSubmit, isLoading, disabled }: Props) => {
  const [url, setUrl] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onSubmit(url.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Enter source URL (e.g. https://example.com)"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        disabled={disabled}
      />
      <button type="submit" disabled={disabled || !url.trim() || isLoading}>
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
