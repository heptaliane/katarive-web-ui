import type {
  Narrator,
  SourceCollection,
  SourceSummary,
} from "../gen/api/v1/api_pb";
import { JobStatus } from "../gen/api/v1/api_pb";
import type { KatariveClient } from "./client";

const STUB_COLLECTIONS: SourceCollection[] = [
  {
    $typeName: "api.v1.SourceCollection",
    id: "col-1",
    url: "https://example.com/blog",
    title: "Tech Blog",
    description:
      "A curated collection of technical articles for software engineers.",
    author: "Tech Writer",
    tags: ["engineering", "tech"],
  },
  {
    $typeName: "api.v1.SourceCollection",
    id: "col-2",
    url: "https://example.com/news",
    title: "News Digest",
    description: "A collection of the latest global news.",
    author: "News Bot",
    tags: ["news", "daily"],
  },
];

const STUB_SOURCES: Record<string, SourceSummary[]> = {
  "col-1": [
    {
      $typeName: "api.v1.SourceSummary",
      id: "src-1",
      url: "https://example.com/blog/1",
      title: "Getting Started with Protobuf",
    },
    {
      $typeName: "api.v1.SourceSummary",
      id: "src-2",
      url: "https://example.com/blog/2",
      title: "gRPC Communication with connect-es",
    },
    {
      $typeName: "api.v1.SourceSummary",
      id: "src-3",
      url: "https://example.com/blog/3",
      title: "Setting Up a React + Vite Environment",
    },
  ],
  "col-2": [
    {
      $typeName: "api.v1.SourceSummary",
      id: "src-4",
      url: "https://example.com/news/1",
      title: "Latest Trends in AI",
    },
    {
      $typeName: "api.v1.SourceSummary",
      id: "src-5",
      url: "https://example.com/news/2",
      title: "Weekly OSS Roundup",
    },
  ],
};

const STUB_NARRATORS: Narrator[] = [
  {
    $typeName: "api.v1.Narrator",
    name: "voicevox",
    speakers: [
      { $typeName: "api.v1.Speaker", id: 1, label: "Speaker 1" },
      { $typeName: "api.v1.Speaker", id: 2, label: "Speaker 2" },
      { $typeName: "api.v1.Speaker", id: 3, label: "Speaker 3" },
    ],
  },
];

// -----------------
// Polling functions
// -----------------
const jobCallCount = new Map<string, number>();

function simulateJobStatus(id: string, completesAfter = 3): JobStatus {
  const count = (jobCallCount.get(id) ?? 0) + 1;
  jobCallCount.set(id, count);
  if (count >= completesAfter) return JobStatus.COMPLETED;
  return JobStatus.PROGRESSING;
}

let idCounter = 1000;
function nextId(prefix: string) {
  return `${prefix}-${++idCounter}`;
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

// --------------------------
// Stub client implementation
// --------------------------

export function createStubClient(): KatariveClient {
  return {
    async queueNarration({ url, narrator, speakerId }) {
      await delay(300);
      const id = nextId("narration");
      console.log("[stub] queueNarration", { url, narrator, speakerId, id });
      return { $typeName: "api.v1.QueueNarrationResponse", id };
    },

    async getNarration(id) {
      await delay(500);
      const status = simulateJobStatus(id);
      console.log("[stub] getNarration", { id, status });
      return {
        $typeName: "api.v1.GetNarrationResponse",
        status,
        path: status === JobStatus.COMPLETED ? "/audio/stub.mp3" : undefined,
        source: undefined,
      };
    },

    async getNarrators() {
      await delay(200);
      return {
        $typeName: "api.v1.GetNarratorsResponse",
        narrator: STUB_NARRATORS,
      };
    },

    async queueSourceItem({ url, disableCache = false }) {
      await delay(300);
      const id = nextId("src");
      console.log("[stub] queueSourceItem", { url, disableCache, id });
      return { $typeName: "api.v1.QueueSourceItemResponse", id };
    },

    async getSourceItem(id) {
      await delay(400);
      const status = simulateJobStatus(id, 2);
      return {
        $typeName: "api.v1.GetSourceItemResponse",
        status,
        metadata: {
          $typeName: "api.v1.SourceSummary",
          id,
          url: "https://example.com/stub",
          title: "Stub Article Title",
        },
        content:
          status === JobStatus.COMPLETED
            ? "This is stub content. The actual body text will be displayed once connected to the real API."
            : undefined,
      };
    },

    async queueSourceCollection({ url, disableCache = false }) {
      await delay(300);
      const id = nextId("col");
      console.log("[stub] queueSourceCollection", { url, disableCache, id });
      return { $typeName: "api.v1.QueueSourceCollectionResponse", id };
    },

    async getSourceCollection(id) {
      await delay(400);
      const collection = STUB_COLLECTIONS.find((c) => c.id === id);
      const sources = STUB_SOURCES[id] ?? [];
      return {
        $typeName: "api.v1.GetSourceCollectionResponse",
        status: JobStatus.COMPLETED,
        collection,
        sources,
      };
    },

    async getSourceCollections() {
      await delay(400);
      return {
        $typeName: "api.v1.GetSourceCollectionsResponse",
        collection: STUB_COLLECTIONS,
      };
    },
  };
}
