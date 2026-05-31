import { useApp } from "../store/AppContext";

export function SourceCollections() {
  const { state, selectCollection } = useApp();
  const { collections, collectionsLoading, selectedCollectionUrl } = state;

  return (
    <aside className="panel source-collections">
      <div className="panel-header">Collections</div>
      {collectionsLoading && <div className="panel-loading">Loading...</div>}
      <ul className="collection-list">
        {collections.map((col) => (
          <li
            key={col.id}
            className={`collection-item ${col.url === selectedCollectionUrl ? "selected" : ""}`}
            onClick={() => selectCollection(col.url)}
          >
            <div className="collection-item-title">{col.title}</div>
            <div className="collection-item-url">{col.url}</div>
          </li>
        ))}
      </ul>
    </aside>
  );
}
