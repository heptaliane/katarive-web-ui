import { useApp } from "../store/AppContext";

export function Header() {
  const {
    state,
    setInputUrl,
    setNarrator,
    setSpeakerId,
    loadSourceItemFromUrl,
  } = useApp();
  const { inputUrl, selectedNarrator, selectedSpeakerId, narrators } = state;

  const selectedNarratorObj = narrators.find(
    (n) => n.name === selectedNarrator,
  );
  const canLoad = inputUrl.trim() !== "";

  const handleLoad = () => {
    if (canLoad) loadSourceItemFromUrl(inputUrl.trim());
  };

  return (
    <header className="header">
      {/* Left: brand + narrator/speaker */}
      <div className="header-left">
        <div className="header-brand">
          <img
            src="/static/favicon.svg"
            className="header-logo"
            alt=""
            aria-hidden="true"
          />
          Katarive
        </div>
        <div className="header-narrator">
          <select
            className="header-select"
            value={selectedNarrator}
            onChange={(e) => setNarrator(e.target.value)}
          >
            {narrators.map((n) => (
              <option key={n.name} value={n.name}>
                {n.name}
              </option>
            ))}
          </select>
          <select
            className="header-select"
            value={selectedSpeakerId ?? ""}
            onChange={(e) => setSpeakerId(Number(e.target.value))}
          >
            {(selectedNarratorObj?.speakers ?? []).map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Right: URL input + load button (merged) */}
      <div className="header-right">
        <div className="header-url-wrapper">
          <input
            className="header-url-input"
            type="url"
            placeholder="Enter URL..."
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLoad()}
          />
          <button
            className="header-load-btn"
            onClick={handleLoad}
            disabled={!canLoad}
            aria-label="Load"
            title="Load source item"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M3 8H13M13 8L9 4M13 8L9 12"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
