import { type Interceptor, createPromiseClient } from "@connectrpc/connect";
import { createGrpcWebTransport } from "@connectrpc/connect-web";
import { KatariveService } from "./gen/api/v1/api_connect";

const logger: Interceptor = (next) => async (req) => {
  console.log(`RPC [${req.method.name}] Request:`, req.message);
  try {
    const res = await next(req);
    console.log(`RPC [${req.method.name}] Success:`, res.message);
    return res;
  } catch (err) {
    console.error(`RPC [${req.method.name}] Error:`, err);
    throw err;
  }
};

const transport = createGrpcWebTransport({
  baseUrl: import.meta.env.VITE_GRPC_WEB_URL || window.location.origin,
  interceptors: import.meta.env.DEV ? [logger] : [],
});

export const client = createPromiseClient(KatariveService, transport);
