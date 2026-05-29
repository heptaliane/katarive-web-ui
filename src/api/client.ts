import type {
  GetNarrationResponse,
  GetNarratorsResponse,
  GetSourceCollectionResponse,
  GetSourceCollectionsResponse,
  GetSourceItemResponse,
  QueueNarrationResponse,
  QueueSourceCollectionResponse,
  QueueSourceItemResponse,
} from "../gen/api/v1/api_pb";

export interface KatariveClient {
  queueNarration(params: {
    url: string;
    narrator: string;
    speakerId: number;
  }): Promise<QueueNarrationResponse>;

  getNarration(id: string): Promise<GetNarrationResponse>;

  getNarrators(): Promise<GetNarratorsResponse>;

  queueSourceItem(params: {
    url: string;
    disableCache?: boolean;
  }): Promise<QueueSourceItemResponse>;

  getSourceItem(id: string): Promise<GetSourceItemResponse>;

  queueSourceCollection(params: {
    url: string;
    disableCache?: boolean;
  }): Promise<QueueSourceCollectionResponse>;

  getSourceCollection(id: string): Promise<GetSourceCollectionResponse>;

  getSourceCollections(): Promise<GetSourceCollectionsResponse>;
}
