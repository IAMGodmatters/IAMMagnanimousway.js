# I AM Connected Assistant

The Connected Assistant lets each signed-in I AM workspace authorize its own external accounts and then give the AI assistant controlled access to those accounts.

## Tenant isolation

Every connected account is stored with the authenticated `tenant_id`. OAuth state is also bound to that tenant. Access and refresh tokens are encrypted before D1 storage and are only decrypted server-side when an approved provider action is executed.

The browser never receives stored provider access tokens. The connection-status API only returns provider names, external account IDs, display names, expiration information, capabilities, permissions, and audit status.

## Two-layer control

1. **Connections** (`/connections`) — the user authorizes Facebook, Instagram, WhatsApp, Shopify, Shopee, X, Snapchat and other supported services.
2. **Connected Assistant** (`/assistant-actions`) — the user controls whether AI may read data, whether AI may perform write actions, and whether outgoing writes require confirmation.

Write actions default to confirmation required. The assistant creates an action in `needs_confirmation` status and waits for the signed-in user to approve it.

## Internal D1 data

The platform uses these tenant-scoped tables:

- `integrations` — encrypted provider credentials and account metadata.
- `integration_states` — short-lived OAuth state, PKCE data, return origin and connection metadata.
- `assistant_permissions` — per-tenant/per-provider read, write and confirmation settings.
- `assistant_actions` — requested, queued, approved, running, completed and failed assistant actions.
- `assistant_activity` — compact audit trail of connected-account activity.

## Provider architecture

### Facebook Pages

Uses the platform Meta application credentials. After user authorization, the backend resolves Pages available to that user and stores each Page as a separate tenant connection. Page publishing and engagement reads are exposed through the assistant broker when the approved Meta permissions are available.

### Instagram Business

Uses Meta OAuth and resolves professional Instagram accounts connected to authorized Facebook Pages. The broker supports profile reads and media publishing for eligible Instagram professional accounts.

### WhatsApp Business

Uses Meta/WhatsApp Business authorization. A production Meta configuration may use `WHATSAPP_CONFIG_ID`. Messaging actions require the applicable WhatsApp Business phone-number ID and the permissions approved for the Meta app.

### Shopify

Uses the Shopify authorization-code flow for the merchant's own store. The user enters the `*.myshopify.com` domain before authorization. The callback validates Shopify HMAC and stores the tenant's encrypted access token. The assistant currently exposes secure product, order and customer reads through the Admin GraphQL API.

### Shopee Seller

Uses Shopee Partner credentials, a signed authorization URL and signed Open Platform requests. Each connected seller shop is stored separately. Availability and exact permissions depend on the partner application's approval and region.

### X

Uses OAuth 2.0 Authorization Code with PKCE and requests offline access so refresh credentials can be issued when the X app is eligible. The current assistant broker supports profile reading and confirmation-gated post publishing.

### Snapchat Business

The connector is for Snapchat Business/Marketing API access, such as business/ad-account context and approved marketing capabilities. It is not an unrestricted personal Snapchat Story/posting connector. Available actions depend on Snap's approved scopes and application access.

## Required production secrets

Configure production credentials as Cloudflare Worker secrets/environment variables, never in frontend code or GitHub:

- `INTEGRATION_CREDENTIALS_KEY`
- `META_APP_ID`, `META_APP_SECRET`, optional `META_GRAPH_VERSION`, optional `WHATSAPP_CONFIG_ID`
- `SHOPIFY_API_KEY`, `SHOPIFY_API_SECRET`
- `SHOPEE_PARTNER_ID`, `SHOPEE_PARTNER_KEY`
- `X_CLIENT_ID`, `X_CLIENT_SECRET`
- `SNAPCHAT_CLIENT_ID`, `SNAPCHAT_CLIENT_SECRET`
- Existing Google/Microsoft/Slack/Discord OAuth credentials when those integrations are enabled

## Redirect URIs

Each provider application should allow the Worker callback corresponding to the provider:

`https://<worker-or-production-api-host>/api/integrations/<provider>/callback`

Examples include `/facebook/callback`, `/instagram/callback`, `/whatsapp/callback`, `/shopify/callback`, `/shopee/callback`, `/x/callback`, and `/snapchat/callback` under `/api/integrations/`.

## AI action safety model

The AI assistant may suggest an action without executing it. The action broker is the only component that receives decrypted provider credentials. The broker checks the signed-in tenant, connected account, advertised capability, read/write permission and confirmation policy before it calls an external API. Every attempted action is recorded for that tenant.
