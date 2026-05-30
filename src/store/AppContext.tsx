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
  SourceSummary,
} from "../gen/api/v1/api_pb";

export interface NarrationState {
  jobId: string;
  sourceItemId: string;
  status: JobStatus;
  audioPath?: string;
}

export interface AppState {
  // Header
  inputUrl: string;
  selectedNarrator: string;
  selectedSpeakerId: number | null;

  // Narrators Dropdown
  narrators: Narrator[];

  // SourceCollections Area
  collections: SourceCollection[];
  collectionsLoading: boolean;

  // SourceCollectionDetail Area
  selectedCollectionId: string | null;
  selectedCollection: SourceCollection | null;
  collectionSources: SourceSummary[];
  collectionDetailLoading: boolean;

  // SourceItemNarration Area
  selectedSourceItemId: string | null;
  sourceItemStatus: JobStatus | null;
  sourceItemMetadata: SourceSummary | null;
  sourceItemContent: string | null;
  sourceItemLoading: boolean;

  // Narration
  narration: NarrationState | null;
}

const initialState: AppState = {
  inputUrl: "",
  selectedNarrator: "",
  selectedSpeakerId: null,

  narrators: [],

  collections: [],
  collectionsLoading: false,

  selectedCollectionId: null,
  selectedCollection: null,
  collectionSources: [],
  collectionDetailLoading: false,

  selectedSourceItemId: null,
  sourceItemStatus: null,
  sourceItemMetadata: null,
  sourceItemContent: null,
  sourceItemLoading: false,

  narration: null,
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
  | { type: "SET_COLLECTION_DETAIL_LOADING"; id: string }
  | {
      type: "SET_COLLECTION_DETAIL";
      collection: SourceCollection;
      sources: SourceSummary[];
    }
  | { type: "SET_SOURCE_ITEM_LOADING"; id: string }
  | {
      type: "SET_SOURCE_ITEM";
      status: JobStatus;
      metadata?: SourceSummary;
      content?: string;
    }
  | { type: "SET_NARRATION"; narration: NarrationState }
  | {
      type: "UPDATE_NARRATION_STATUS";
      jobId: string;
      status: JobStatus;
      audioPath?: string;
    };

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
        selectedCollectionId: action.id,
        selectedCollection: null,
        collectionSources: [],
        collectionDetailLoading: true,
        selectedSourceItemId: null,
        sourceItemStatus: null,
        sourceItemMetadata: null,
        sourceItemContent: null,
        narration: null,
      };
    case "SET_COLLECTION_DETAIL":
      return {
        ...state,
        selectedCollection: action.collection,
        collectionSources: action.sources,
        collectionDetailLoading: false,
      };

    case "SET_SOURCE_ITEM_LOADING":
      return {
        ...state,
        selectedSourceItemId: action.id,
        sourceItemStatus: null,
        sourceItemMetadata: null,
        sourceItemContent: null,
        sourceItemLoading: true,
        narration: null,
      };
    case "SET_SOURCE_ITEM":
      return {
        ...state,
        sourceItemStatus: action.status,
        sourceItemMetadata: action.metadata ?? null,
        sourceItemContent: action.content ?? null,
        sourceItemLoading: false,
      };

    case "SET_NARRATION":
      return { ...state, narration: action.narration };
    case "UPDATE_NARRATION_STATUS":
      if (!state.narration || state.narration.jobId !== action.jobId)
        return state;
      return {
        ...state,
        narration: {
          ...state.narration,
          status: action.status,
          audioPath: action.audioPath ?? state.narration.audioPath,
        },
      };

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

  // Action handler
  setInputUrl: (url: string) => void;
  setNarrator: (narrator: string) => void;
  setSpeakerId: (id: number) => void;
  selectCollection: (id: string) => void;
  selectSourceItem: (id: string) => void;
  startNarration: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

// -----------------------------------------------------------------------
// Provider
// -----------------------------------------------------------------------

const POLLING_INTERVAL_MS = 2000;

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const client = useRef<KatariveClient>(
    import.meta.env.VITE_API_BASE_URL
      ? createConnectClient(window.location.origin)
      : createStubClient(),
  ).current;

  // Initial Narrator load
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

  // Initial Collections load
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

    const timer = setInterval(async () => {
      const current = narrationRef.current;
      if (!current || current.status !== JobStatus.PROGRESSING) {
        clearInterval(timer);
        return;
      }
      const res = await client.getNarration(current.jobId);
      dispatch({
        type: "UPDATE_NARRATION_STATUS",
        jobId: current.jobId,
        status: res.status,
        audioPath: res.path,
      });
      if (res.status !== JobStatus.PROGRESSING) {
        clearInterval(timer);
      }
    }, POLLING_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [state.narration?.jobId, client]);

  const setInputUrl = useCallback((url: string) => {
    dispatch({ type: "SET_INPUT_URL", url });
  }, []);

  const setNarrator = useCallback((narrator: string) => {
    dispatch({ type: "SET_NARRATOR", narrator });
  }, []);

  const setSpeakerId = useCallback((id: number) => {
    dispatch({ type: "SET_SPEAKER_ID", speakerId: id });
  }, []);

  const selectCollection = useCallback(
    async (id: string) => {
      dispatch({ type: "SET_COLLECTION_DETAIL_LOADING", id });
      const res = await client.getSourceCollection(id);
      if (res.collection) {
        dispatch({
          type: "SET_COLLECTION_DETAIL",
          collection: res.collection,
          sources: res.sources,
        });
      }
    },
    [client],
  );

  const selectSourceItem = useCallback(
    async (id: string) => {
      dispatch({ type: "SET_SOURCE_ITEM_LOADING", id });
      const res = await client.getSourceItem(id);
      dispatch({
        type: "SET_SOURCE_ITEM",
        status: res.status,
        metadata: res.metadata,
        content: res.content,
      });
    },
    [client],
  );

  const startNarration = useCallback(async () => {
    const {
      inputUrl,
      selectedNarrator,
      selectedSpeakerId,
      selectedSourceItemId,
    } = state;
    if (!inputUrl || !selectedNarrator || selectedSpeakerId === null) return;
    const res = await client.queueNarration({
      url: inputUrl,
      narrator: selectedNarrator,
      speakerId: selectedSpeakerId,
    });
    dispatch({
      type: "SET_NARRATION",
      narration: {
        jobId: res.id,
        sourceItemId: selectedSourceItemId ?? "",
        status: JobStatus.PROGRESSING,
      },
    });
  }, [state, client]);

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
        startNarration,
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
