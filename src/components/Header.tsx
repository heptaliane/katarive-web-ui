import { useApp } from "../store/AppContext";

export function Header() {
  const { state, setInputUrl, setNarrator, setSpeakerId, startNarration } =
    useApp();
  const { inputUrl, selectedNarrator, selectedSpeakerId, narrators } = state;

  const selectedNarratorObj = narrators.find(
    (n) => n.name === selectedNarrator,
  );
  const canStart = inputUrl.trim() !== "" && selectedSpeakerId !== null;

  return (
    <header className="header">
      <div className="header-brand">Katarive</div>
      <div className="header-controls">
        <input
          className="header-url-input"
          type="url"
          placeholder="https://example.com"
          value={inputUrl}
          onChange={(e) => setInputUrl(e.target.value)}
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
          className={`header-narration-btn ${canStart ? "active" : "disabled"}`}
          onClick={startNarration}
          disabled={!canStart}
          title="Generate Narration"
        >
          Generate Narration
        </button>
      </div>
    </header>
  );
}
