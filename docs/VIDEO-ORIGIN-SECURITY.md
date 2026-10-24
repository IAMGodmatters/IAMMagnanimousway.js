# Video renderer origin access — security rollout

The primary `iammagnanimousway.com` application runs on Cloudflare Workers and
D1 rather than on a separately addressable web server. The optional video
renderer runs on a public Render hostname, however. Cloudflare DNS proxying the
main domain does **not** shield that independent hostname from direct requests.

## Code safeguards

- Renderer render/edit requests accept `VIDEO_RENDERER_TOKEN` as a server-held
  bearer secret. With that secret configured, missing or incorrect tokens fail
  with HTTP 401. `VIDEO_RENDERER_REQUIRE_TOKEN=true` makes an unconfigured
  renderer fail closed with HTTP 503.
- The video gateway removes any browser-supplied Authorization, Cookie and
  forwarding headers and injects only its own `VIDEO_RENDERER_TOKEN`. It does
  not automatically follow upstream redirects with a private token.
- Provider-billed Mux publishing cannot run without a correctly configured and
  presented renderer token, even while compatibility mode remains enabled.
- A public health check and random-name video download links remain available.
  Download URLs are bearer capabilities: do not expose them outside the user
  workflow or make filenames predictable.

## Required no-downtime activation

1. Generate a **new** long random secret privately. Never put it in source,
   GitHub issues, build logs, or a public variable.
2. Set `VIDEO_RENDERER_TOKEN` as a secret on the Render video renderer and on
   the Cloudflare video gateway. Also set it on the main Worker if its legacy
   direct-rendering route is in use. Do not use a `vars` entry in wrangler JSON.
3. Deploy the three consumers with the same secret, then verify the gateway can
   render a short test and its download link works. A missing token must receive
   HTTP 401 from the direct Render endpoint; no render should be created.
4. Set `VIDEO_RENDERER_REQUIRE_TOKEN=true` on Render after step 3. Repeat the
   gateway functional check, direct-origin 401 test, and public `/health` check.
5. Gate the public gateway itself behind a same-origin authenticated application
   route plus durable per-account quotas before treating anonymous rendering as
   abuse-resistant. Renderer-only authentication prevents direct-origin bypass,
   but **does not** prevent requests through an open gateway.

If step 3 fails, keep existing client routes in place and correct the secret
configuration. Do not rotate or remove an in-use secret without synchronizing
all callers. Disable paid Mux writes until provider costs have explicit limits.

## Verifications

Run `python -m unittest discover -s video-renderer -p 'test_*.py'` and
`node video-gateway/test/security.test.mjs`. Production hardening is not complete
until credentials, direct-origin rejection, gateway user authorization, rate
limits and live end-to-end behavior are independently verified.
