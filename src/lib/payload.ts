import { getPayload } from "payload";
import config from "@payload-config";
import { setServers } from "node:dns/promises";

type PayloadCache = {
  promise: ReturnType<typeof getPayload> | null;
};

const globalPayload = globalThis as { payload?: PayloadCache };
const cached = globalPayload.payload ?? { promise: null };
globalPayload.payload = cached;

export async function getPayloadCached(): Promise<Awaited<ReturnType<typeof getPayload>>> {
  if (!cached.promise) {
    setServers(["1.1.1.1", "8.8.8.8"]);
    cached.promise = getPayload({ config });
  }
  return cached.promise;
}
