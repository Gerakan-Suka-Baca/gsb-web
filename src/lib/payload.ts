import { getPayload } from "payload";
import config from "../payload.config";
import { setServers } from "node:dns/promises";



// eslint-disable-next-line @typescript-eslint/no-explicit-any
let cached = (global as any).payload;

if (!cached) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cached = (global as any).payload = { promise: null };
}

export async function getPayloadCached(): Promise<Awaited<ReturnType<typeof getPayload>>> {
  if (!cached.promise) {
    setServers(["1.1.1.1", "8.8.8.8"]);
    
    cached.promise = getPayload({ config });
  }
  return cached.promise;
}
