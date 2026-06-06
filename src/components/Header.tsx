import { useApp } from "../store/AppContext";

export function Header() {
  const { state, setInputUrl, setNarrator, setSpeakerId, loadSourceItemFromUrl } = useApp();
  const { inputUrl, selectedNarrator, selectedSpeakerId, narrators } = state;

  const selectedNarratorObj = narrators.find((n) => n.name === selectedNarrator);
  const canLoad = inputUrl.trim() !== "";

  const handleLoad = () => {
    if (canLoad) loadSourceItemFromUrl(inputUrl.trim());
  };

  return (
    <header className="header">
      <div className="header-brand">
        <img src="/favicon.svg" className="header-logo" alt="" aria-hidden="true" />
        Katarive
      </div>
      <div className="header-controls">
        <input
          className="header-url-input"
          type="url"
          placeholder="Enter URL..."
          value={inputUrl}
          onChange={(e) => setInputUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleLoad()}
        />
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
        <button
          className={`header-load-btn ${canLoad ? "active" : "disabled"}`}
          onClick={handleLoad}
          disabled={!canLoad}
          title="Load source item"
        >
          Load
        </button>
      </div>
    </header>
  );
}
