# I AM Magnanimous AI Platform

Odin-powered AI platform with free/local tools, Text → Video, owner administration, Canva support, and editable sponsored/affiliate links.

## Owner admin
Set `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and a strong `SESSION_SECRET` in the backend environment. The owner can sign in from Admin Login and edit the site and revenue links.

## Cloudflare
For production, use Cloudflare Workers for the frontend and migrate the SQLite persistence layer to D1 and generated media to R2. Cloudflare's current Next.js recommendation is vinext.
