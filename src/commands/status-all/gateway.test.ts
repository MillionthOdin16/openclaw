import { describe, expect, it } from "vitest";
import { summarizeLogTail } from "./gateway.js";

describe("summarizeLogTail", () => {
    it("handles json blocks", () => {
        const lines = [
            "[openai-codex] Token refresh failed: 401 {",
            "  \"error\": {",
            "    \"code\": \"invalid_grant\",",
            "    \"message\": \"Token has been expired or revoked.\"",
            "  }",
            "}"
        ];
        expect(summarizeLogTail(lines)).toEqual([
            "[openai-codex] token refresh 401 invalid_grant · Token has been expired or revoked."
        ]);
    });
});
