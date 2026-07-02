## 2025-02-18 - Read large files using chunked reverse reading

**Vulnerability:** Reading entire large files into memory using fs.readFile and parsing everything for just a small subset of trailing data can exhaust process memory and cause Denial of Service (DoS).
**Learning:** For very large jsonl transcripts, fetching only the last N items using .slice(-N) requires an unbounded amount of memory proportional to the file size.
**Prevention:** Instead of reading the whole file, open it with fs.open and read from the end in chunks using handle.read() with a buffer, processing lines backwards until the limit is reached.
