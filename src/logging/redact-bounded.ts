export const REDACT_REGEX_CHUNK_THRESHOLD = 32_768;
export const REDACT_REGEX_CHUNK_SIZE = 16_384;
const REDACT_REGEX_CHUNK_OVERLAP = 512;

type BoundedRedactOptions = {
  chunkThreshold?: number;
  chunkSize?: number;
  chunkOverlap?: number;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ReplaceReplacer = (substring: string, ...args: any[]) => string;

export function replacePatternBounded(
  text: string,
  pattern: RegExp,
  replacer: ReplaceReplacer | string,
  options?: BoundedRedactOptions,
): string {
  const chunkThreshold = options?.chunkThreshold ?? REDACT_REGEX_CHUNK_THRESHOLD;
  const chunkSize = options?.chunkSize ?? REDACT_REGEX_CHUNK_SIZE;
  const chunkOverlap = options?.chunkOverlap ?? REDACT_REGEX_CHUNK_OVERLAP;

  if (chunkThreshold <= 0 || chunkSize <= 0 || text.length <= chunkThreshold) {
    // @ts-expect-error TypeScript types over-constrain string vs function replacements here
    return text.replace(pattern, replacer);
  }

  const globalPattern = new RegExp(
    pattern.source,
    pattern.flags.includes("g") ? pattern.flags : pattern.flags + "g",
  );

  let output = "";
  let currentIndex = 0;

  while (currentIndex < text.length) {
    const chunkEnd = Math.min(currentIndex + chunkSize, text.length);
    const hasMore = chunkEnd < text.length;

    const sliceEnd = hasMore ? chunkEnd + chunkOverlap : text.length;
    const slice = text.slice(currentIndex, sliceEnd);

    let replacedSlice = "";
    let lastMatchEnd = 0;
    let match;

    globalPattern.lastIndex = 0;
    while ((match = globalPattern.exec(slice)) !== null) {
      const matchStart = match.index;
      const matchEnd = globalPattern.lastIndex;

      if (hasMore && matchStart >= chunkSize) {
        break;
      }

      replacedSlice += slice.slice(lastMatchEnd, matchStart);

      if (typeof replacer === "function") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const args: any[] = [...match];
        args.push(matchStart);
        args.push(slice);
        if (match.groups) {
          args.push(match.groups);
        }
        replacedSlice += replacer(match[0], ...args.slice(1));
      } else {
        // @ts-expect-error TypeScript types over-constrain string vs function replacements here
        replacedSlice += slice.slice(matchStart, matchEnd).replace(pattern, replacer);
      }

      lastMatchEnd = matchEnd;

      if (matchStart === matchEnd) {
        globalPattern.lastIndex++;
      }
    }

    if (hasMore) {
      const chunkEndInSlice = Math.max(chunkSize, lastMatchEnd);
      replacedSlice += slice.slice(lastMatchEnd, chunkEndInSlice);
      output += replacedSlice;
      currentIndex += chunkEndInSlice;
    } else {
      replacedSlice += slice.slice(lastMatchEnd);
      output += replacedSlice;
      currentIndex = text.length;
    }
  }

  return output;
}
