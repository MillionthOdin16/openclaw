import fs from 'node:fs';
let code = fs.readFileSync('src/utils.ts', 'utf8');

const replacement = `const lidMappingCache = new Map<string, { value: string | null; expiresAt: number }>();

function readLidReverseMapping(lid: string, opts?: JidToE164Options): string | null {
  const cacheKey = \`\${lid}:\${opts ? JSON.stringify(opts) : ''}\`;
  const now = Date.now();

  if (lidMappingCache.has(cacheKey)) {
    const cached = lidMappingCache.get(cacheKey)!;
    if (cached.expiresAt > now) {
      return cached.value;
    } else {
      lidMappingCache.delete(cacheKey);
    }
  }

  const mappingFilename = \`lid-mapping-\${lid}_reverse.json\`;
  const mappingDirs = resolveLidMappingDirs(opts);
  for (const dir of mappingDirs) {
    const mappingPath = path.join(dir, mappingFilename);
    try {
      const data = fs.readFileSync(mappingPath, "utf8");
      const phone = JSON.parse(data) as string | number | null;
      if (phone === null || phone === undefined) {
        continue;
      }
      const result = normalizeE164(String(phone));
      if (lidMappingCache.size >= 10000) {
        lidMappingCache.clear();
      }
      // Positive cache: valid for 1 hour
      lidMappingCache.set(cacheKey, { value: result, expiresAt: now + 60 * 60 * 1000 });
      return result;
    } catch {
      // Try the next location.
    }
  }

  if (lidMappingCache.size >= 10000) {
    lidMappingCache.clear();
  }
  // Negative cache: valid for 5 minutes
  lidMappingCache.set(cacheKey, { value: null, expiresAt: now + 5 * 60 * 1000 });
  return null;
}`;

code = code.replace(/const lidMappingCache = new Map[\s\S]*?return null;\n}/, replacement);
fs.writeFileSync('src/utils.ts', code);
