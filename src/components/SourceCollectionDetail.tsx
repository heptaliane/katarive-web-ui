import { useApp } from "../store/AppContext";

export function SourceCollectionDetail() {
  const { state, selectSourceItem } = useApp();
  const {
    selectedCollection,
    collectionSources,
    collectionDetailLoading,
    selectedSourceItemId,
  } = state;

  if (!selectedCollection && !collectionDetailLoading) {
    return (
      <section className="panel source-collection-detail empty">
        <div className="panel-empty">Select Collection</div>
      </section>
    );
  }

  return (
    <section className="panel source-collection-detail">
      {collectionDetailLoading ? (
        <div className="panel-loading">Loading...</div>
      ) : (
        <>
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
            Items ({collectionSources.length})
          </div>
          <ul className="source-list">
            {collectionSources.map((src) => (
              <li
                key={src.id}
                className={`source-item ${src.id === selectedSourceItemId ? "selected" : ""}`}
                onClick={() => selectSourceItem(src.id)}
              >
                <div className="source-item-title">{src.title}</div>
                <div className="source-item-url">{src.url}</div>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
