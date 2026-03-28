const GENERIC_PATTERNS = [
  /^basic ingredients/i,
  /^ingredients not available/i,
  /^preparation steps not available/i,
  /^method not available/i,
  /^n\/a$/i,
  /^na$/i,
];

const normalizeList = (value) => {
  if (value == null) return [];
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item || "").trim())
      .filter(Boolean);
  }
  return [String(value).trim()].filter(Boolean);
};

const isGeneric = (value) => {
  const text = String(value || "").trim();
  if (!text) return true;
  return GENERIC_PATTERNS.some((pattern) => pattern.test(text));
};

export function formatIngredients(data) {
  const items = normalizeList(data);
  if (items.length === 0) return [];

  const expanded = items.flatMap((item) => {
    if (String(item).includes(";")) return String(item).split(";");
    if (String(item).includes(",")) return String(item).split(",");
    return [item];
  });

  return expanded
    .map((item) => String(item || "").replace(/^[-*\d.)\s]+/, "").trim())
    .filter((item) => item && !isGeneric(item));
}

export function formatSteps(data) {
  const items = normalizeList(data);
  if (items.length === 0) return [];

  const text = items.join("\n").trim();
  if (!text || isGeneric(text)) return [];

  const numbered = text
    .split(/\n|\r|(?=\d+\.)|(?=\d+\))|(?=step\s*\d+[:.)-]?)/i)
    .map((part) => part.trim())
    .filter(Boolean);

  const parts =
    numbered.length > 1
      ? numbered
      : text
          .split(/(?:\.\s+)|(?:\n+)|(?:;\s+)/)
          .map((part) => part.trim())
          .filter(Boolean);

  return parts
    .map((part) =>
      part
        .replace(/^step\s*\d+[:.)-]?\s*/i, "")
        .replace(/^\d+[:.)-]?\s*/, "")
        .trim(),
    )
    .filter(Boolean);
}

export function hasNutrition(recipe) {
  return ["calories", "protein", "carbs", "fat"].some((key) =>
    Number.isFinite(Number(recipe?.[key])),
  );
}
