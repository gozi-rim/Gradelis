/** How many letters you'd change to turn a into b. */
export function editDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  let curr = new Array<number>(b.length + 1);

  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    [prev, curr] = [curr, prev];
  }

  return prev[b.length];
}

/** 1 = identical, 0 = nothing in common. */
export function similarity(a: string, b: string): number {
  const longest = Math.max(a.length, b.length);
  return longest === 0 ? 1 : 1 - editDistance(a, b) / longest;
}

export type Candidate<T> = { item: T; score: number };

/** Closest matches first. Ties sort by name so the list never shuffles. */
export function suggestCandidates<T>(
  raw: string,
  pool: T[],
  key: (item: T) => string,
  { limit = 5, minScore = 0.5 }: { limit?: number; minScore?: number } = {},
): Candidate<T>[] {
  return pool
    .map((item) => ({ item, score: similarity(raw, key(item)) }))
    .filter((c) => c.score >= minScore)
    .sort((a, b) => b.score - a.score || key(a.item).localeCompare(key(b.item)))
    .slice(0, limit);
}
