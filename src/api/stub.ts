import { create } from "@bufbuild/protobuf";
import {
  GetNarrationResponseSchema,
  GetNarratorsResponseSchema,
  GetSourceCollectionResponseSchema,
  GetSourceCollectionsResponseSchema,
  GetSourceItemResponseSchema,
  JobStatus,
  NarratorSchema,
  SourceCollectionSchema,
  SourceItemSchema,
  SourceSummarySchema,
  SpeakerSchema,
} from "../gen/api/v1/api_pb";
import type { KatariveClient } from "./client";

const STUB_COLLECTIONS = [
  create(SourceCollectionSchema, {
    id: "col-1",
    url: "https://example.com/blog",
    title: "Tech Blog",
    description:
      "A curated collection of technical articles for software engineers.",
    author: "Tech Writer",
    tags: ["engineering", "tech"],
  }),
  create(SourceCollectionSchema, {
    id: "col-2",
    url: "https://example.com/news",
    title: "News Digest",
    description: "A collection of the latest global news.",
    author: "News Bot",
    tags: ["news", "daily"],
  }),
];

const STUB_ITEMS: Record<
  string,
  ReturnType<typeof create<typeof SourceSummarySchema>>[]
> = {
  "https://example.com/blog": [
    create(SourceSummarySchema, {
      id: "src-1",
      url: "https://example.com/blog/1",
      title: "Getting Started with Protobuf",
    }),
    create(SourceSummarySchema, {
      id: "src-2",
      url: "https://example.com/blog/2",
      title: "gRPC Communication with connect-es",
    }),
    create(SourceSummarySchema, {
      id: "src-3",
      url: "https://example.com/blog/3",
      title: "Setting Up a React + Vite Environment",
    }),
  ],
  "https://example.com/news": [
    create(SourceSummarySchema, {
      id: "src-4",
      url: "https://example.com/news/1",
      title: "Latest Trends in AI",
    }),
    create(SourceSummarySchema, {
      id: "src-5",
      url: "https://example.com/news/2",
      title: "Weekly OSS Roundup",
    }),
  ],
};

const STUB_NARRATORS = [
  create(NarratorSchema, {
    name: "voicevox",
    speakers: [
      create(SpeakerSchema, { id: 1, label: "Speaker 1" }),
      create(SpeakerSchema, { id: 2, label: "Speaker 2" }),
      create(SpeakerSchema, { id: 3, label: "Speaker 3" }),
    ],
  }),
];

// -----------------------------------------------------------------------
// Polling simulation
// Track the number of calls using the URL as the key.
// Simulate a reset and retry by setting `disableCache=true`.
// -----------------------------------------------------------------------

const jobCallCount = new Map<string, number>();

function simulateJobStatus(
  key: string,
  completesAfter: number,
  disableCache: boolean,
): JobStatus {
  if (disableCache) jobCallCount.delete(key);
  const count = (jobCallCount.get(key) ?? 0) + 1;
  jobCallCount.set(key, count);
  if (count >= completesAfter) return JobStatus.COMPLETED;
  return JobStatus.PROGRESSING;
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

// -----------------------------------------------------------------------
// Stub client
// -----------------------------------------------------------------------

export function createStubClient(): KatariveClient {
  return {
    async getNarration({ url, narrator, speakerId }) {
      await delay(500);
      const key = `narration:${url}:${narrator}:${speakerId}`;
      const status = simulateJobStatus(key, 4, false);
      console.log("[stub] getNarration", { url, narrator, speakerId, status });
      return create(GetNarrationResponseSchema, {
        status,
        path: status === JobStatus.COMPLETED ? "/audio/stub.mp3" : undefined,
      });
    },

    async getNarrators() {
      await delay(200);
      return create(GetNarratorsResponseSchema, { narrator: STUB_NARRATORS });
    },

    async getSourceItem({ url, disableCache = false }) {
      await delay(400);
      const status = simulateJobStatus(`item:${url}`, 2, disableCache);
      console.log("[stub] getSourceItem", { url, disableCache, status });

      const collection = STUB_COLLECTIONS.find((c) => url.startsWith(c.url));

      return create(GetSourceItemResponseSchema, {
        status,
        item:
          status === JobStatus.COMPLETED
            ? create(SourceItemSchema, {
                id: `item-${url}`,
                url,
                title: "Stub Article Title",
                content:
                  "This is stub content. The actual body text will be displayed once connected to the real API.",
              })
            : undefined,
        collection: collection,
      });
    },

    async getSourceCollection({ url, disableCache = false }) {
      await delay(400);
      const status = simulateJobStatus(`collection:${url}`, 2, disableCache);
      console.log("[stub] getSourceCollection", { url, disableCache, status });

      const collection = STUB_COLLECTIONS.find((c) => c.url === url);
      const items = STUB_ITEMS[url] ?? [];

      return create(GetSourceCollectionResponseSchema, {
        status,
        collection: status === JobStatus.COMPLETED ? collection : undefined,
        items: status === JobStatus.COMPLETED ? items : [],
      });
    },

    async getSourceCollections() {
      await delay(400);
      return create(GetSourceCollectionsResponseSchema, {
        collection: STUB_COLLECTIONS,
      });
    },
  };
}
