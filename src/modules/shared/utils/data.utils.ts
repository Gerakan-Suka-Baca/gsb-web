/**
 * Generic data utility functions shared across all modules.
 */

/**
 * Safely extract a string ID from a value that could be a string, ObjectId, or object with id.
 */
export const extractId = (val: unknown): string | null => {
  if (!val) return null;
  if (typeof val === "string") return val;
  if (typeof val === "object") {
    const obj = val as Record<string, unknown>;
    if (typeof obj.$oid === "string") return obj.$oid;
    if (typeof obj.toString === "function") {
      const s = obj.toString();
      if (s !== "[object Object]") return s;
    }
  }
  return String(val);
};
