import { getPayload } from "payload";
import config from "@payload-config";

let payloadPromise: ReturnType<typeof getPayload> | null = null;

/**
 * Reuses a single Payload instance per process. Avoids reconnecting to DB
 */
export async function getPayloadCached(): Promise<Awaited<ReturnType<typeof getPayload>>> {
  if (!payloadPromise) {
    payloadPromise = getPayload({ config });
  }
  return payloadPromise;
}
