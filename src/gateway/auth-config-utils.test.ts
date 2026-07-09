import { describe, expect, it, vi } from "vitest";
import { withGatewayAuthPassword, resolveGatewayPasswordSecretRef } from "./auth-config-utils.js";
import type { OpenClawConfig } from "../config/config.js";
import * as resolveSecretModule from "./resolve-configured-secret-input-string.js";
import * as secretsTypesModule from "../config/types.secrets.js";

describe("auth-config-utils", () => {
  describe("withGatewayAuthPassword", () => {
    it("adds password to existing gateway auth config", () => {
      const cfg = { gateway: { auth: { mode: "password" as const } } } as OpenClawConfig;
      const result = withGatewayAuthPassword(cfg, "new-pass");

      expect(result.gateway?.auth?.password).toBe("new-pass");
      expect(result.gateway?.auth?.mode).toBe("password");
    });

    it("creates gateway and auth config if missing", () => {
      const cfg = {} as OpenClawConfig;
      const result = withGatewayAuthPassword(cfg, "new-pass");

      expect(result.gateway?.auth?.password).toBe("new-pass");
    });
  });

  describe("resolveGatewayPasswordSecretRef", () => {
    it("returns cfg if no ref in password", async () => {
      const cfg = { gateway: { auth: { password: "plain-password" } } } as OpenClawConfig;
      vi.spyOn(secretsTypesModule, "resolveSecretInputRef").mockReturnValue({} as unknown as ReturnType<typeof secretsTypesModule.resolveSecretInputRef>);
      const result = await resolveGatewayPasswordSecretRef({
        cfg,
        env: {},
        hasPasswordCandidate: false,
        hasTokenCandidate: false,
      });

      expect(result).toBe(cfg);
    });

    it("returns cfg if should not resolve (has password candidate)", async () => {
      const cfg = { gateway: { auth: { password: "ref:secret" } } } as unknown as OpenClawConfig;
      vi.spyOn(secretsTypesModule, "resolveSecretInputRef").mockReturnValue({ ref: "secret" } as unknown as ReturnType<typeof secretsTypesModule.resolveSecretInputRef>);
      const result = await resolveGatewayPasswordSecretRef({
        cfg,
        env: {},
        hasPasswordCandidate: true,
        hasTokenCandidate: false,
      });

      expect(result).toBe(cfg);
    });

    it("returns cfg if should not resolve (token mode)", async () => {
      const cfg = { gateway: { auth: { password: "ref:secret" } } } as unknown as OpenClawConfig;
      vi.spyOn(secretsTypesModule, "resolveSecretInputRef").mockReturnValue({ ref: "secret" } as unknown as ReturnType<typeof secretsTypesModule.resolveSecretInputRef>);
      const result = await resolveGatewayPasswordSecretRef({
        cfg,
        env: {},
        mode: "token",
        hasPasswordCandidate: false,
        hasTokenCandidate: false,
      });

      expect(result).toBe(cfg);
    });

    it("returns cfg if resolved value is empty", async () => {
      const cfg = { gateway: { auth: { password: "ref:secret" } } } as unknown as OpenClawConfig;
      vi.spyOn(secretsTypesModule, "resolveSecretInputRef").mockReturnValue({ ref: "secret" } as unknown as ReturnType<typeof secretsTypesModule.resolveSecretInputRef>);
      vi.spyOn(resolveSecretModule, "resolveRequiredConfiguredSecretRefInputString").mockResolvedValue("");

      const result = await resolveGatewayPasswordSecretRef({
        cfg,
        env: {},
        mode: "password",
        hasPasswordCandidate: false,
        hasTokenCandidate: false,
      });

      expect(result).toBe(cfg);
    });

    it("resolves secret ref and updates config", async () => {
      const cfg = { gateway: { auth: { password: "ref:secret" } } } as unknown as OpenClawConfig;
      vi.spyOn(secretsTypesModule, "resolveSecretInputRef").mockReturnValue({ ref: "secret" } as unknown as ReturnType<typeof secretsTypesModule.resolveSecretInputRef>);
      vi.spyOn(resolveSecretModule, "resolveRequiredConfiguredSecretRefInputString").mockResolvedValue("resolved-password");

      const result = await resolveGatewayPasswordSecretRef({
        cfg,
        env: {},
        mode: "password",
        hasPasswordCandidate: false,
        hasTokenCandidate: false,
      });

      expect(result.gateway?.auth?.password).toBe("resolved-password");
    });

    it("should resolve when no mode and no token candidate", async () => {
      const cfg = { gateway: { auth: { password: "ref:secret" } } } as unknown as OpenClawConfig;
      vi.spyOn(secretsTypesModule, "resolveSecretInputRef").mockReturnValue({ ref: "secret" } as unknown as ReturnType<typeof secretsTypesModule.resolveSecretInputRef>);
      vi.spyOn(resolveSecretModule, "resolveRequiredConfiguredSecretRefInputString").mockResolvedValue("resolved-password");

      const result = await resolveGatewayPasswordSecretRef({
        cfg,
        env: {},
        hasPasswordCandidate: false,
        hasTokenCandidate: false,
      });

      expect(result.gateway?.auth?.password).toBe("resolved-password");
    });

    it("should not resolve when no mode but has token candidate", async () => {
      const cfg = { gateway: { auth: { password: "ref:secret" } } } as unknown as OpenClawConfig;
      vi.spyOn(secretsTypesModule, "resolveSecretInputRef").mockReturnValue({ ref: "secret" } as unknown as ReturnType<typeof secretsTypesModule.resolveSecretInputRef>);

      const result = await resolveGatewayPasswordSecretRef({
        cfg,
        env: {},
        hasPasswordCandidate: false,
        hasTokenCandidate: true,
      });

      expect(result).toBe(cfg);
    });
  });
});
