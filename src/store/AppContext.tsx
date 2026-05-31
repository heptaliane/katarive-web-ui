import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useRef,
} from "react";
import type { KatariveClient } from "../api/client";
import { createStubClient } from "../api/stub";
import { createConnectClient } from "../api/rpc";
import { JobStatus } from "../gen/api/v1/api_pb";
import type {
  Narrator,
  SourceCollection,
  SourceItem,
  SourceSummary,
} from "../gen/api/v1/api_pb";

// -----------------------------------------------------------------------
// State
// -----------------------------------------------------------------------

export interface NarrationState {
  // Key for polling: url + narrator + speakerId
  url: string;
  narrator: string;
  speakerId: number;
  status: JobStatus;
  audioPath?: string;
}

export interface BatchNarrationItem {
  url: string;
  title: string;
  status: JobStatus;
  audioPath?: string;
}

export interface BatchNarrationState {
  items: BatchNarrationItem[];
  currentIndex: number;
  isRunning: boolean;
}

export interface AppState {
  // Header
  inputUrl: string;
  selectedNarrator: string;
  selectedSpeakerId: number | null;

  // Narrators dropdown
  narrators: Narrator[];

  // SourceCollections area
  collections: SourceCollection[];
  collectionsLoading: boolean;

  // SourceCollectionDetail area
  selectedCollectionUrl: string | null;
  selectedCollection: SourceCollection | null;
  collectionItems: SourceSummary[];
  collectionDetailLoading: boolean;

  // SourceItemNarration area
  selectedSourceItemUrl: string | null;
  sourceItemStatus: JobStatus | null;
  sourceItem: SourceItem | null;
  sourceItemLoading: boolean;

  // Narration
  narration: NarrationState | null;

  // Batch narration
  batchNarration: BatchNarrationState | null;
}

const initialState: AppState = {
  inputUrl: "",
  selectedNarrator: "",
  selectedSpeakerId: null,

  narrators: [],

  collections: [],
  collectionsLoading: false,

  selectedCollectionUrl: null,
  selectedCollection: null,
  collectionItems: [],
  collectionDetailLoading: false,

  selectedSourceItemUrl: null,
  sourceItemStatus: null,
  sourceItem: null,
  sourceItemLoading: false,

  narration: null,

  batchNarration: null,
};

// -----------------------------------------------------------------------
// Actions
// -----------------------------------------------------------------------

type Action =
  | { type: "SET_INPUT_URL"; url: string }
  | { type: "SET_NARRATOR"; narrator: string }
  | { type: "SET_SPEAKER_ID"; speakerId: number }
  | { type: "SET_NARRATORS"; narrators: Narrator[] }
  | { type: "SET_COLLECTIONS_LOADING" }
  | { type: "SET_COLLECTIONS"; collections: SourceCollection[] }
  | { type: "SET_COLLECTION_DETAIL_LOADING"; url: string; silent?: boolean }
  | {
      type: "SET_COLLECTION_DETAIL";
      collection: SourceCollection;
      items: SourceSummary[];
    }
  | { type: "SET_COLLECTION_DETAIL_STATUS"; status: JobStatus }
  | { type: "SET_SOURCE_ITEM_LOADING"; url: string }
  | { type: "SET_SOURCE_ITEM"; status: JobStatus; item?: SourceItem }
  | { type: "SET_NARRATION"; narration: NarrationState }
  | { type: "UPDATE_NARRATION_STATUS"; status: JobStatus; audioPath?: string }
  | { type: "START_BATCH_NARRATION"; items: BatchNarrationItem[] }
  | {
      type: "UPDATE_BATCH_ITEM";
      index: number;
      status: JobStatus;
      audioPath?: string;
    }
  | { type: "ADVANCE_BATCH"; nextIndex: number }
  | { type: "FINISH_BATCH" }
  | { type: "CANCEL_BATCH" };

// -----------------------------------------------------------------------
// Reducer
// -----------------------------------------------------------------------

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "SET_INPUT_URL":
      return { ...state, inputUrl: action.url };
    case "SET_NARRATOR":
      return {
        ...state,
        selectedNarrator: action.narrator,
        selectedSpeakerId: null,
      };
    case "SET_SPEAKER_ID":
      return { ...state, selectedSpeakerId: action.speakerId };
    case "SET_NARRATORS":
      return { ...state, narrators: action.narrators };

    case "SET_COLLECTIONS_LOADING":
      return { ...state, collectionsLoading: true };
    case "SET_COLLECTIONS":
      return {
        ...state,
        collections: action.collections,
        collectionsLoading: false,
      };

    case "SET_COLLECTION_DETAIL_LOADING":
      return {
        ...state,
        selectedCollectionUrl: action.url,
        selectedCollection: action.silent ? state.selectedCollection : null,
        collectionItems: action.silent ? state.collectionItems : [],
        collectionDetailLoading: true,
        // Reset SourceItem selection only when explicitly switching collections
        ...(action.silent
          ? {}
          : {
              selectedSourceItemUrl: null,
              sourceItemStatus: null,
              sourceItem: null,
              narration: null,
            }),
      };
    case "SET_COLLECTION_DETAIL":
      return {
        ...state,
        selectedCollection: action.collection,
        collectionItems: action.items,
        collectionDetailLoading: false,
      };
    case "SET_COLLECTION_DETAIL_STATUS":
      // Update status only while PROGRESSING (collection data not yet available)
      return {
        ...state,
        collectionDetailLoading: action.status === JobStatus.PROGRESSING,
      };

    case "SET_SOURCE_ITEM_LOADING":
      return {
        ...state,
        selectedSourceItemUrl: action.url,
        sourceItemStatus: null,
        sourceItem: null,
        sourceItemLoading: true,
        narration: null,
      };
    case "SET_SOURCE_ITEM":
      return {
        ...state,
        sourceItemStatus: action.status,
        sourceItem: action.item ?? null,
        sourceItemLoading: false,
      };

    case "SET_NARRATION":
      return { ...state, narration: action.narration };
    case "UPDATE_NARRATION_STATUS":
      if (!state.narration) return state;
      return {
        ...state,
        narration: {
          ...state.narration,
          status: action.status,
          audioPath: action.audioPath ?? state.narration.audioPath,
        },
      };

    case "START_BATCH_NARRATION":
      return {
        ...state,
        batchNarration: {
          items: action.items,
          currentIndex: 0,
          isRunning: true,
        },
      };
    case "UPDATE_BATCH_ITEM":
      if (!state.batchNarration) return state;
      return {
        ...state,
        batchNarration: {
          ...state.batchNarration,
          items: state.batchNarration.items.map((item, i) =>
            i === action.index
              ? {
                  ...item,
                  status: action.status,
                  audioPath: action.audioPath ?? item.audioPath,
                }
              : item,
          ),
        },
      };
    case "ADVANCE_BATCH":
      if (!state.batchNarration) return state;
      return {
        ...state,
        batchNarration: {
          ...state.batchNarration,
          currentIndex: action.nextIndex,
        },
      };
    case "FINISH_BATCH":
      if (!state.batchNarration) return state;
      return {
        ...state,
        batchNarration: { ...state.batchNarration, isRunning: false },
      };
    case "CANCEL_BATCH":
      return { ...state, batchNarration: null };

    default:
      return state;
  }
}

// -----------------------------------------------------------------------
// Context
// -----------------------------------------------------------------------

interface AppContextValue {
  state: AppState;
  client: KatariveClient;
  setInputUrl: (url: string) => void;
  setNarrator: (narrator: string) => void;
  setSpeakerId: (id: number) => void;
  // Flow 2: Select collection by URL
  selectCollection: (url: string) => void;
  // Flow 2: Select SourceItem by URL (also updates collection after completion)
  selectSourceItem: (url: string) => void;
  // Flow 1: Load SourceItem from URL input (also updates collection after completion)
  loadSourceItemFromUrl: (url: string) => void;
  // Common for Flow 1/2: Start narration and begin polling
  startNarration: () => void;
  // Retry on failure
  retryNarration: () => void;
  // Refresh CollectionDetail with disableCache=true
  refreshCollectionDetail: () => void;
  // Start batch narration for all items in the current collection
  startBatchNarration: () => void;
  // Cancel batch narration
  cancelBatchNarration: () => void;
  // Select a batch-completed item to view in SourceItemNarration
  selectBatchItem: (index: number) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

// -----------------------------------------------------------------------
// Provider
// -----------------------------------------------------------------------

const POLLING_INTERVAL_MS = 2000;

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const client = useRef<KatariveClient>(
    // Use stub only in development when VITE_API_BASE_URL is not set.
    // In production, always use the real client against the same origin.
    import.meta.env.DEV && !import.meta.env.VITE_API_BASE_URL
      ? createStubClient()
      : createConnectClient(window.location.origin),
  ).current;

  // Load narrators on mount
  useEffect(() => {
    client.getNarrators().then((res) => {
      dispatch({ type: "SET_NARRATORS", narrators: res.narrator });
      if (res.narrator.length > 0) {
        dispatch({ type: "SET_NARRATOR", narrator: res.narrator[0].name });
        if (res.narrator[0].speakers.length > 0) {
          dispatch({
            type: "SET_SPEAKER_ID",
            speakerId: res.narrator[0].speakers[0].id,
          });
        }
      }
    });
  }, [client]);

  // Load collections on mount
  useEffect(() => {
    dispatch({ type: "SET_COLLECTIONS_LOADING" });
    client.getSourceCollections().then((res) => {
      dispatch({ type: "SET_COLLECTIONS", collections: res.collection });
    });
  }, [client]);

  // Narration polling
  const narrationRef = useRef(state.narration);
  narrationRef.current = state.narration;
  useEffect(() => {
    if (!state.narration) return;
    if (state.narration.status !== JobStatus.PROGRESSING) return;

    const { url, narrator, speakerId } = state.narration;
    const timer = setInterval(async () => {
      const current = narrationRef.current;
      if (!current || current.status !== JobStatus.PROGRESSING) {
        clearInterval(timer);
        return;
      }
      const res = await client.getNarration({ url, narrator, speakerId });
      dispatch({
        type: "UPDATE_NARRATION_STATUS",
        status: res.status,
        audioPath: res.path,
      });
      if (res.status !== JobStatus.PROGRESSING) {
        clearInterval(timer);
      }
    }, POLLING_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [state.narration?.url, state.narration?.speakerId, client]);

  // Common handler: load SourceItem and update collection using item.collection.url.
  // Polls until COMPLETED, then starts narration and loads CollectionDetail in parallel.
  const loadSourceItem = useCallback(
    async (url: string, disableCache = false) => {
      dispatch({ type: "SET_SOURCE_ITEM_LOADING", url });

      // Poll getSourceItem until COMPLETED or FAILED
      let res = await client.getSourceItem({ url, disableCache });
      dispatch({ type: "SET_SOURCE_ITEM", status: res.status, item: res.item });

      while (res.status === JobStatus.PROGRESSING) {
        await new Promise((r) => setTimeout(r, POLLING_INTERVAL_MS));
        res = await client.getSourceItem({ url });
        dispatch({
          type: "SET_SOURCE_ITEM",
          status: res.status,
          item: res.item,
        });
      }

      if (res.status !== JobStatus.COMPLETED) return;

      // Load CollectionDetail and start narration in parallel
      const { selectedNarrator, selectedSpeakerId } = state;

      const collectionPromise = res.collection
        ? (async () => {
            const collectionUrl = res.collection!.url;
            dispatch({
              type: "SET_COLLECTION_DETAIL_LOADING",
              url: collectionUrl,
              silent: true,
            });
            const colRes = await client.getSourceCollection({
              url: collectionUrl,
            });
            if (colRes.collection) {
              dispatch({
                type: "SET_COLLECTION_DETAIL",
                collection: colRes.collection,
                items: colRes.items,
              });
            }
          })()
        : Promise.resolve();

      if (selectedNarrator && selectedSpeakerId !== null) {
        dispatch({
          type: "SET_NARRATION",
          narration: {
            url,
            narrator: selectedNarrator,
            speakerId: selectedSpeakerId,
            status: JobStatus.PROGRESSING,
          },
        });
      }

      await collectionPromise;
    },
    [client, state.selectedNarrator, state.selectedSpeakerId],
  );

  const setInputUrl = useCallback((url: string) => {
    dispatch({ type: "SET_INPUT_URL", url });
  }, []);

  const setNarrator = useCallback((narrator: string) => {
    dispatch({ type: "SET_NARRATOR", narrator });
  }, []);

  const setSpeakerId = useCallback((id: number) => {
    dispatch({ type: "SET_SPEAKER_ID", speakerId: id });
  }, []);

  // Poll getSourceCollection until COMPLETED or FAILED, then dispatch result
  const pollSourceCollection = useCallback(
    async (url: string, disableCache = false) => {
      let res = await client.getSourceCollection({ url, disableCache });
      while (res.status === JobStatus.PROGRESSING) {
        await new Promise((r) => setTimeout(r, POLLING_INTERVAL_MS));
        res = await client.getSourceCollection({ url });
      }
      if (res.collection) {
        dispatch({
          type: "SET_COLLECTION_DETAIL",
          collection: res.collection,
          items: res.items,
        });
      }
    },
    [client],
  );

  // Flow 2: Select collection by URL
  const selectCollection = useCallback(
    async (url: string) => {
      dispatch({ type: "SET_COLLECTION_DETAIL_LOADING", url });
      await pollSourceCollection(url);
    },
    [pollSourceCollection],
  );

  // Refresh current CollectionDetail with disableCache=true
  const refreshCollectionDetail = useCallback(async () => {
    const { selectedCollectionUrl } = state;
    if (!selectedCollectionUrl) return;
    dispatch({
      type: "SET_COLLECTION_DETAIL_LOADING",
      url: selectedCollectionUrl,
      silent: true,
    });
    await pollSourceCollection(selectedCollectionUrl, true);
  }, [pollSourceCollection, state.selectedCollectionUrl]);

  // Flow 2: Select SourceItem by URL
  const selectSourceItem = useCallback(
    async (url: string) => {
      await loadSourceItem(url);
    },
    [loadSourceItem],
  );

  // Flow 1: Load SourceItem directly from URL input
  const loadSourceItemFromUrl = useCallback(
    async (url: string) => {
      await loadSourceItem(url);
    },
    [loadSourceItem],
  );

  const startNarration = useCallback(async () => {
    if (
      !state.selectedSourceItemUrl ||
      !state.selectedNarrator ||
      state.selectedSpeakerId === null
    )
      return;
    dispatch({
      type: "SET_NARRATION",
      narration: {
        url: state.selectedSourceItemUrl,
        narrator: state.selectedNarrator,
        speakerId: state.selectedSpeakerId,
        status: JobStatus.PROGRESSING,
      },
    });
  }, [
    state.selectedSourceItemUrl,
    state.selectedNarrator,
    state.selectedSpeakerId,
  ]);

  const retryNarration = useCallback(async () => {
    if (!state.narration) return;
    dispatch({
      type: "SET_NARRATION",
      narration: {
        ...state.narration,
        status: JobStatus.PROGRESSING,
        audioPath: undefined,
      },
    });
    // Note: getNarration has no disable_cache option.
    // Call loadSourceItem(url, true) if SourceItem retry is also needed.
  }, [state.narration]);

  // Batch narration: process all collection items sequentially
  const startBatchNarration = useCallback(async () => {
    const { collectionItems, selectedNarrator, selectedSpeakerId } = state;
    if (
      !collectionItems.length ||
      !selectedNarrator ||
      selectedSpeakerId === null
    )
      return;

    const batchItems: BatchNarrationItem[] = collectionItems.map((item) => ({
      url: item.url,
      title: item.title,
      status: JobStatus.PROGRESSING,
    }));
    dispatch({ type: "START_BATCH_NARRATION", items: batchItems });

    for (let i = 0; i < batchItems.length; i++) {
      dispatch({ type: "ADVANCE_BATCH", nextIndex: i });
      const { url } = batchItems[i];

      // Poll until COMPLETED or FAILED
      let res = await client.getNarration({
        url,
        narrator: selectedNarrator,
        speakerId: selectedSpeakerId,
      });
      while (res.status === JobStatus.PROGRESSING) {
        await new Promise((r) => setTimeout(r, POLLING_INTERVAL_MS));
        res = await client.getNarration({
          url,
          narrator: selectedNarrator,
          speakerId: selectedSpeakerId,
        });
      }
      dispatch({
        type: "UPDATE_BATCH_ITEM",
        index: i,
        status: res.status,
        audioPath: res.path,
      });
    }

    dispatch({ type: "FINISH_BATCH" });
  }, [
    client,
    state.collectionItems,
    state.selectedNarrator,
    state.selectedSpeakerId,
  ]);

  const cancelBatchNarration = useCallback(() => {
    dispatch({ type: "CANCEL_BATCH" });
  }, []);

  // Select a batch-completed item and show it in SourceItemNarration
  const selectBatchItem = useCallback(
    (index: number) => {
      const { batchNarration } = state;
      if (!batchNarration) return;
      const item = batchNarration.items[index];
      if (item.status !== JobStatus.COMPLETED) return;
      dispatch({
        type: "SET_NARRATION",
        narration: {
          url: item.url,
          narrator: state.selectedNarrator,
          speakerId: state.selectedSpeakerId ?? 0,
          status: item.status,
          audioPath: item.audioPath,
        },
      });
      // Also update selectedSourceItemUrl to highlight in the list
      dispatch({ type: "SET_SOURCE_ITEM_LOADING", url: item.url });
      client.getSourceItem({ url: item.url }).then((res) => {
        dispatch({
          type: "SET_SOURCE_ITEM",
          status: res.status,
          item: res.item,
        });
      });
    },
    [
      client,
      state.batchNarration,
      state.selectedNarrator,
      state.selectedSpeakerId,
    ],
  );

  return (
    <AppContext.Provider
      value={{
        state,
        client,
        setInputUrl,
        setNarrator,
        setSpeakerId,
        selectCollection,
        selectSourceItem,
        loadSourceItemFromUrl,
        startNarration,
        retryNarration,
        refreshCollectionDetail,
        startBatchNarration,
        cancelBatchNarration,
        selectBatchItem,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

// -----------------------------------------------------------------------
// Hook
// -----------------------------------------------------------------------

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
