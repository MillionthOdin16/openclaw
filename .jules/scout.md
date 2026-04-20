## 2024-05-18 - Google Chat Webhook Pattern

**Defect Pattern:** Webhook requests reject valid tokens when the issuer is accounts.google.com and the email is an add-on service account.
**Local Impact:** Google Chat plugin fails to authenticate any incoming webhooks, returning 401 Unauthorized.
**Review Strategy:** Check webhook authentication logic across plugins, specifically `verifyGoogleChatRequest` in `extensions/googlechat/src/auth.ts`.
