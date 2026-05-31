import { createClient } from "@connectrpc/connect";
import { createGrpcWebTransport } from "@connectrpc/connect-web";
import { KatariveService } from "../gen/api/v1/api_pb";
import type { KatariveClient } from "./client";

export function createConnectClient(baseUrl: string): KatariveClient {
  const transport = createGrpcWebTransport({ baseUrl });
  const rpc = createClient(KatariveService, transport);

  return {
    async getNarration({ url, narrator, speakerId }) {
      return rpc.getNarration({ url, narrator, speakerId });
    },

    async getNarrators() {
      return rpc.getNarrators({});
    },

    async getSourceItem({ url, disableCache = false }) {
      return rpc.getSourceItem({ url, disableCache });
    },

    async getSourceCollection({ url, disableCache = false }) {
      return rpc.getSourceCollection({ url, disableCache });
    },

    async getSourceCollections() {
      return rpc.getSourceCollections({});
    },
  };
}
