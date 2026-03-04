export const mergeNestedMap = <T,>(
  base: Record<string, Record<string, T>>,
  incoming: Record<string, Record<string, T>>
) => {
  const next = { ...base };
  Object.keys(incoming || {}).forEach((key) => {
    next[key] = { ...(base[key] || {}), ...(incoming[key] || {}) };
  });
  return next;
};

export const normalizeNumberMap = (value: unknown): Record<string, number> => {
  if (!value || typeof value !== "object") return {};
  const raw = value as Record<string, unknown>;
  const next: Record<string, number> = {};
  Object.keys(raw).forEach((key) => {
    const v = raw[key];
    if (typeof v === "number" && Number.isFinite(v)) next[key] = v;
  });
  return next;
};

export const normalizeExamState = (
  value: unknown
): "running" | "bridging" | undefined => {
  if (value === "paused") return "running";
  if (value === "running" || value === "bridging") return value;
  return undefined;
};
