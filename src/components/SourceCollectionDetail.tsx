import { useApp } from "../store/AppContext";

export function SourceCollectionDetail() {
  const { state, selectSourceItem, refreshCollectionDetail } = useApp();
  const {
    selectedCollection,
    collectionItems,
    collectionDetailLoading,
    selectedSourceItemUrl,
  } = state;

  if (!selectedCollection && !collectionDetailLoading) {
    return (
      <section className="panel source-collection-detail empty">
        <div className="panel-empty">Select a collection</div>
      </section>
    );
  }

  // Full loading (no existing content to show yet)
  if (!selectedCollection && collectionDetailLoading) {
    return (
      <section className="panel source-collection-detail">
        <div className="panel-loading">Loading...</div>
      </section>
    );
  }

  return (
    <section className="panel source-collection-detail">
      <div className="panel-header">{selectedCollection?.title}</div>
      <div className="collection-meta">
        {selectedCollection?.author && (
          <span className="meta-tag">by {selectedCollection.author}</span>
        )}
        {selectedCollection?.tags.map((tag) => (
          <span key={tag} className="meta-tag">
            #{tag}
          </span>
        ))}
      </div>
      {selectedCollection?.description && (
        <p className="collection-description">
          {selectedCollection.description}
        </p>
      )}
      <div className="source-list-header">
        <span>
          Items ({collectionItems.length})
          {collectionDetailLoading && (
            <span className="refreshing-indicator"> Refreshing...</span>
          )}
        </span>
        <button
          className="refresh-btn"
          onClick={refreshCollectionDetail}
          disabled={collectionDetailLoading}
          title="Refresh (disable cache)"
        >
          ↻
        </button>
      </div>
      <ul
        className={`source-list ${collectionDetailLoading ? "disabled" : ""}`}
      >
        {collectionItems.map((item) => (
          <li
            key={item.id}
            className={`source-item ${item.url === selectedSourceItemUrl ? "selected" : ""} ${collectionDetailLoading ? "disabled" : ""}`}
            onClick={() =>
              !collectionDetailLoading && selectSourceItem(item.url)
            }
          >
            <div className="source-item-title">{item.title}</div>
            <div className="source-item-url">{item.url}</div>
          </li>
        ))}
      </ul>
    </section>
  );
}
