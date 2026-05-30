import { createClient } from "@connectrpc/connect";
import { createConnectTransport } from "@connectrpc/connect-web";
import { KatariveService } from "../gen/api/v1/api_pb";
import type { KatariveClient } from "./client";

export function createConnectClient(baseUrl: string): KatariveClient {
  const transport = createConnectTransport({ baseUrl });
  const rpc = createClient(KatariveService, transport);

  return {
    async queueNarration({ url, narrator, speakerId }) {
      return rpc.queueNarration({ url, narrator, speakerId });
    },

    async getNarration(id) {
      return rpc.getNarration({ id });
    },

    async getNarrators() {
      return rpc.getNarrators({});
    },

    async queueSourceItem({ url, disableCache = false }) {
      return rpc.queueSourceItem({ url, disableCache });
    },

    async getSourceItem(id) {
      return rpc.getSourceItem({ id });
    },

    async queueSourceCollection({ url, disableCache = false }) {
      return rpc.queueSourceCollection({ url, disableCache });
    },

    async getSourceCollection(id) {
      return rpc.getSourceCollection({ id });
    },

    async getSourceCollections() {
      return rpc.getSourceCollections({});
    },
  };
}
