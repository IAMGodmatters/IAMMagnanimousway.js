# Owner email delivery readiness

Owner email-code sign-in must be advertised only when a sender approved for sensitive authentication messages is ready.

## Free-first readiness rules

- Owner password login remains available at all times.
- Cloudflare Email Service is not considered ready merely because the Worker binding exists.
- Before Cloudflare Email Service can send, the owner must complete sender-domain onboarding in Cloudflare Email Service and explicitly set `MAGNANIMOUS_EMAIL_SENDER_DOMAIN_READY=true`.
- Cloudflare Email Service delivery is restricted to the exact recipient addresses in the Worker secret `MAGNANIMOUS_EMAIL_VERIFIED_RECIPIENTS` (comma-, semicolon-, or whitespace-separated). Only add destination addresses that Cloudflare shows as verified and that are intentionally approved for this platform.
- Connected Gmail/Outlook can be used as a free owner-authentication fallback only when the provider-returned OAuth token response records the actual granted send scope (`https://www.googleapis.com/auth/gmail.send` for Gmail or `Mail.Send` for Outlook), and the connection has a usable access token or refresh credentials. The requested-scope list is retained for audit only; it is never proof that the provider granted permission. Older connections without recorded granted scopes must be reconnected before they can advertise owner email-code sign-in.
- Security-sensitive codes and recovery messages never fall through to the optional Magnanimous communications API. That route may be metered and remains available only for non-sensitive messages through the existing configured provider path.
- `MAGNANIMOUS_MAIL_DELIVERY_AVAILABLE` controls the general mail subsystem. `MAGNANIMOUS_OWNER_EMAIL_LOGIN_READY` is computed separately and is the only signal used by the owner login page and owner email-code request route.

## Owner-only Cloudflare setup

1. In Cloudflare Dashboard, open **Compute → Email Service → Email Sending** and complete sender-domain onboarding for the platform's sending domain.
2. Confirm the required DNS records and the sender domain's verified/onboarded status in Cloudflare. This repository change does not change DNS.
3. Confirm the owner's destination address is listed as a verified destination address in the same Cloudflare account.
4. Add only the verified destination address(es) approved for this service to the Worker secret `MAGNANIMOUS_EMAIL_VERIFIED_RECIPIENTS`.
5. After confirming the domain is onboarded, change `MAGNANIMOUS_EMAIL_SENDER_DOMAIN_READY` to `true` in `worker/wrangler.jsonc`, then deploy through the protected main workflow.
6. Reconnect Gmail/Outlook if its provider-returned granted send scope is missing. Verify the non-sending production readiness endpoint and then perform one owner-authorized test delivery. Do not send test codes to other users.

Do not enable a paid plan, change DNS, or add arbitrary recipients as part of this procedure. If no approved sender is configured, the owner portal must keep email-code sign-in hidden and clearly offer password login.
