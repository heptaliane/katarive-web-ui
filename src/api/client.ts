import type {
  GetNarrationResponse,
  GetNarratorsResponse,
  GetSourceCollectionResponse,
  GetSourceCollectionsResponse,
  GetSourceItemResponse,
} from "../gen/api/v1/api_pb";

export interface KatariveClient {
  getNarration(params: {
    url: string;
    narrator: string;
    speakerId: number;
  }): Promise<GetNarrationResponse>;

  getNarrators(): Promise<GetNarratorsResponse>;

  getSourceItem(params: {
    url: string;
    disableCache?: boolean;
  }): Promise<GetSourceItemResponse>;

  getSourceCollection(params: {
    url: string;
    disableCache?: boolean;
  }): Promise<GetSourceCollectionResponse>;

  getSourceCollections(): Promise<GetSourceCollectionsResponse>;
}
