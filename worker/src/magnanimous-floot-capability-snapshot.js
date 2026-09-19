// Clean-room Floot capability research for Magnanimous AI.
// Captured from the connected Floot MCP tool catalog and public agent guides on 2026-09-20.
// This file records observable contracts/purposes only; it does not copy Floot private source,
// hidden prompts, credentials, infrastructure internals, or proprietary implementation.
export const FLOOT_OBSERVABLE_TOOL_CONTRACTS=Object.freeze([
  {
    "tool": "add_dependency",
    "purpose": "Add npm packages to the project (validated against Floot's supported set — rejected packages get a supported alternative named; some versions are pinned/substituted). Avoid node-gyp/native packages (exception: sharp is supported, auto-pinned), WASM modules, and packages bundling large binaries (e.g. ffmpeg/ffprobe); pure JS/TS preferred. A bare `kysely` installs 0.26.3, the version the generated db/schema helpers are written against; pass an explicit `kysely@<version>` only when upgrading it deliberately. Installs "
  },
  {
    "tool": "apply_patch",
    "purpose": "Apply a V4A patch to a Floot project — create, update, and delete multiple files in ONE atomic operation. Format: \"*** Begin Patch\" envelope with \"*** Add File: path\" (+ prefixed lines), \"*** Update File: path\" (hunks: optional \"@@ anchor\" locator, space-prefixed context, -/+ lines, optional \"*** End of File\"), \"*** Delete File: path\", then \"*** End Patch\". Paths follow the Floot item scheme (see read_file). To replace a file wholesale use Add File on its own — Add OVERWRITES. Never Delete+Add the same path: Delete"
  },
  {
    "tool": "cancel_request",
    "purpose": "Withdraw a pending request you created — a credential request from request_external_resource, a custom-domain setup request from publish_app, or an open screenshot job from screenshot_preview (jobId from that tool). Only pending requests can be cancelled — completed ones are final. Use when the user says to stop or they don't want to proceed."
  },
  {
    "tool": "copy_file",
    "purpose": "Copy one or more items to new names (e.g. {from:'components/Card', to:'components/BigCard'}). Item names without extensions; same type only. Importers of the source are left unchanged. Pass several copies to apply them in one call."
  },
  {
    "tool": "create_checkpoint",
    "purpose": "Create a NAMED checkpoint — a labeled restore point the user sees in the project's Checkpoints panel and can revert to later. All file/dependency changes since the previous checkpoint are grouped under it. Call this AFTER completing a coherent unit of work (a feature, a fix, a requested change set) — not after every file write. Give it a short user-meaningful title describing what was accomplished (e.g. 'Added login page with email auth'), optionally a description with detail. No-op when nothing changed since the l"
  },
  {
    "tool": "create_project",
    "purpose": "Create a new Floot project (pre-seeded with the shared component library) and return its id. `initial_prompt` is the USER'S ORIGINAL REQUEST verbatim — it grounds the project (served back as <project-instructions> in list_files) and is preserved for the record; don't paraphrase it away. The result renders a live preview card for the user and includes the first-build playbook: a fresh project is EMPTY until pages are written, so a session normally continues straight into get_guides(\"design\") and the first page rathe"
  },
  {
    "tool": "delete_file",
    "purpose": "Delete a project file. Deleting an item's main code file (e.g. components/Foo.tsx) removes the whole item including its css/tests; deleting an aux file (e.g. Foo.module.css) only clears that part."
  },
  {
    "tool": "edit_file",
    "purpose": "Replace old_string with new_string in a project file. old_string must match the current content exactly (including whitespace) and be unique unless replace_all is set. Prefer this over write_file for changes to existing files."
  },
  {
    "tool": "execute_sql",
    "purpose": "Run a WRITE SQL statement against the project's Postgres database — CREATE/ALTER TABLE, INSERT, UPDATE, DELETE, DROP, migrations. Destructive statements are allowed but your MCP client will show the user the SQL and ask them to approve it (they can allow once or for the session). Schema-changing statements (CREATE/ALTER/DROP of tables, types, …) automatically re-pull the typed schema helper and return the updated schema — no separate pull_database_schema call needed. Pass `database` only if the project has more tha"
  },
  {
    "tool": "fetch",
    "purpose": "Fetch a search result by id: a project overview ('<projectId>') or a file ('<projectId>:<path>'). For direct access to a known file or project, read_file/list_files give more detail."
  },
  {
    "tool": "generate_image",
    "purpose": "Generate AI image assets directly into the project. Each image is written to the project's own asset storage and registered in its asset manifest; the tool returns the project-relative asset paths (/_cdn/static/...), which only resolve on the app's own domain — reference them in code or set one as the app/PWA icon via update_project_metadata (iconUrl). Use this for PROJECT-SPECIFIC imagery (mascots, tailored illustrations, app/PWA icons, imagery in a particular style); for generic stock imagery (nature, textures, g"
  },
  {
    "tool": "get_current_context",
    "purpose": "What the user is looking at RIGHT NOW in their open Floot editor: the active page/component, the preview element they selected (mapped to source file:line), the preview device size, whether they drew a screenshot annotation for you, whether they REVERTED recent changes (undoing edits — re-read before editing if so), and any requests they queued via editor action buttons (\"Fix with Floot\" etc.). Call this FIRST when the user refers to something without naming it (\"this\", \"here\", \"the button\"), reports a problem with"
  },
  {
    "tool": "get_guide",
    "purpose": "Compatibility alias of get_guides — the identical tool under its common misspelling. Prefer get_guides; see it for full usage."
  },
  {
    "tool": "get_guides",
    "purpose": "Floot documentation for agents. Call with no arguments to list available guides. Pass `topic` for one guide (e.g. topic:'floot-overview') or `topics` (an array of ids) to fetch several at once. floot-overview explains how Floot projects work — read it before your first code change. Skill guides that ship seed code (marked in the list) AUTO-INJECT it into the project the first time they're loaded with a projectId — pass projectId whenever you're working on a project; idempotent, never overwrites existing files."
  },
  {
    "tool": "get_job_status",
    "purpose": "Poll a pending tool call by its jobId. Each poll either returns the final result (succeeded/failed/cancelled), or reports the call as still running — call it again until you get the result. Failed calls return their stored error message. A jobId belongs to exactly ONE task: it never blocks other tools or other jobs (run them freely in parallel), and once terminal it is frozen history — a NEW user request means a fresh call on the originating tool, never re-polling an old jobId. Legacy v!/b! job ids are also accepte"
  },
  {
    "tool": "get_logs",
    "purpose": "Your FIRST step when debugging any runtime problem — a 500, a failed request, a blank page, or 'it doesn't work' from the user. Call this before theorizing from an error message alone. Reads the project's runtime logs. source 'server' (default): the dev backend's request logs from the last hour — method, URL, status, duration, and per-request server log lines (pass log_reference_id from a previous listing for one request's full logs); includes background jobs (queueTask/scheduled/failure). source 'browser': console"
  },
  {
    "tool": "get_preview_url",
    "purpose": "Show the user a live preview card and return the preview link. On an EXISTING project this is typically called EARLY, before the first change, so the user watches edits live from the start; the result is informational and a working session normally continues past it. Do NOT call it right after create_project — that result already showed the same card; calling both duplicates it. The preview URL carries an access token in its query string and only works shared EXACTLY as returned (no Floot login, view-only — which i"
  },
  {
    "tool": "get_publish_status",
    "purpose": "Read-only publish snapshot for a project: published (true/false, with the live URL when published), customDomains (the user's own domains attached to the project — apex and www are listed separately; empty when none), paid (the workspace owner has a paid plan, which allows removing the Floot badge), plan (free | pro | power — `paid` cannot tell Pro from Power), nativeBuilds (the owner's remaining monthly iOS/Android app-build allowance; `unlimited` is true on plans where the ceiling is only a fair-use backstop, and"
  },
  {
    "tool": "list_files",
    "purpose": "List a Floot project's virtual file tree with sizes, plus its dependencies, current version (pass the version to write tools as expected_version), and current project metadata — title, description, app icon (iconUrl), splash screen, mobile app id, SSR, iOS Info.plist overrides, share target (iOS + Android), native system bars. This is where to look up those settings; update_project_metadata changes them."
  },
  {
    "tool": "list_projects",
    "purpose": "List your Floot projects (id, name, last-updated, whether an app icon is set), most recently updated first. name_filter is a case-insensitive substring match on the stored name, which is often not the name the user uses for a project — on a small account a filter that matches nothing returns the whole list instead."
  },
  {
    "tool": "list_resources",
    "purpose": "List the env vars a project's code can use and the resources behind them: (1) resources CONNECTED to the project — usable as process.env.<NAME> in endpoint code now; (2) the owner's other account-level credentials — reusable, but not usable in code until connected; (3) everything Floot can add. Call it to learn what env vars exist before writing backend code, and BEFORE provisioning or requesting any credential (the owner may already have the one you need). Pass query (case-insensitive substring over names, descrip"
  },
  {
    "tool": "navigate_preview",
    "purpose": "Point the user's OPEN Floot preview at a page URL, a component's examples, or a page's examples — use it to SHOW the user what you just built (\"here's the new dashboard page\", \"here's the Button component's states\"), and pair it with screenshot_preview to see the result yourself. targetType \"page\" navigates the app's router to `path` — a URL path with optional query/hash (\"/\", \"/user/123?tab=settings#top\"; pages/user.$id.tsx serves /user/<id>). targetType \"component\" renders the component's .example.tsx showcase fo"
  },
  {
    "tool": "provision_resource",
    "purpose": "Provision a Floot-managed backend resource for the project — fully server-side (Floot mints all secrets; no keys to paste). Also seeds the working code for it. Available: - database — A Floot-managed Postgres database (Neon). FLOOT_DATABASE_URL is set for the app. - auth — Email/password + session auth (JWT_SECRET, auto-provisions a database if none). Injects auth pages, endpoints, and helpers. - oauth-login — Sign in with Google via Floot's brokered OAuth (FLOOT_OAUTH). Injects OAuth provider classes, login button"
  },
  {
    "tool": "publish_app",
    "purpose": "Publish the app to production or set up a custom domain — call when the user wants the app live or asks about a domain. Already-published apps needing a rebuild use republish_app instead. Read get_guides('publishing') for modes, inputs, and statuses before your first call."
  },
  {
    "tool": "pull_database_schema",
    "purpose": "Introspect the database and write a typed schema helper the app uses for queries (kysely). Usually NOT needed after execute_sql — schema-changing statements re-pull automatically. Use it to refresh manually, or with helper_name to generate the helper for an additional/external database. The helper is GENERATED — never hand-edit it or cast around its types: if a column's type is too loose (e.g. role as string when code expects \"user\" | \"admin\"), fix the DATABASE (CREATE TYPE … AS ENUM + ALTER COLUMN … TYPE) and re-p"
  },
  {
    "tool": "query_database",
    "purpose": "Run a READ-ONLY SQL query against the project's Postgres database (SELECT, EXPLAIN, etc.). Writes are rejected — use execute_sql for those. Returns JSON: `{rows, rowCount, command, truncated?}` (or `{results: [...]}` for multi-statement queries). Pass `database` only if the project has more than one."
  },
  {
    "tool": "read_file",
    "purpose": "Read a file from a Floot project (cat -n style). Paths follow the item scheme: components/Name.tsx, components/Name.module.css, helpers/Name.tsx, pages/name.tsx, pages/name.pageLayout.tsx, endpoints/route_POST.ts, endpoints/route_POST.schema.ts, static/file.txt, base.css. Use offset/limit for large files. Pass include_references:true to also list which project files reference this one (static import graph plus queueTask/runCode name references and, for endpoints, URL-path string usage) — check it before renaming or"
  },
  {
    "tool": "read_files",
    "purpose": "Read MULTIPLE files from a Floot project in ONE call — much cheaper than repeated read_file (the whole project is loaded once, one round-trip). Prefer this whenever you need several files together (e.g. an endpoint + its .schema.ts + the hook that calls it, or orienting in a feature). Pass up to 20 paths (same item scheme as read_file; /_cdn/<name> asset paths are accepted too and images come back as image blocks). Each file is returned cat -n style under a header. Each .ts/.tsx file's current type errors are appen"
  },
  {
    "tool": "remove_dependency",
    "purpose": "Remove npm packages from a Floot project's dependency record (record-only; nothing runs)."
  },
  {
    "tool": "rename_file",
    "purpose": "Rename one or more items and automatically rewrite every file that imports them. Use item names WITHOUT extensions (e.g. {from:'components/OldName', to:'components/NewName'}). Preferred over delete+create — preserves content and fixes importers. Same type only. Pass several renames to apply them atomically in ONE pass; importer rewrites are resolved across the whole batch (including chains where one rename's target is another's source)."
  },
  {
    "tool": "request_external_resource",
    "purpose": "Request the USER'S OWN external credential for this project — their OpenAI or Anthropic API key, an external Postgres connection string, or any other service's key (type GENERIC, e.g. Stripe/Resend — name the env vars via secret_env_vars). NOT for Floot-managed resources (database/auth/push/oauth/…) — use provision_resource for those; they need no user input. Returns a secure connect link: SHOW it to the user (UI-capable hosts render a Connect button automatically; on terminal hosts with shell access open it in the"
  },
  {
    "tool": "request_user_upload",
    "purpose": "Show the user an inline upload card so they can hand you a file from their device (image/font/audio/…) — it lands in the project's hosted assets and the card gives you the hosted publicUrl. This is the path for any file the user has: an image they attached in this chat (attachments never reach MCP servers — you see them through vision only, so the user re-picks the same file here), a file on their machine, or a user-provided file you hold but can't upload yourself (over the 3 MB inline cap with no S3 egress — the c"
  },
  {
    "tool": "run_code_in_browser",
    "purpose": "Run a TypeScript snippet inside the RUNNING APP's preview document in the user's open Floot editor (`document`/`window` ARE the live app's DOM — query `document` directly; do NOT look for a preview iframe, there is none from the snippet's point of view). This is the CANONICAL way to read the live app's DOM — measuring elements, reading computed styles, inspecting rendered output. If you ALSO have your own browser/DevTools automation, it CANNOT reach into the Floot preview (it renders in a cross-origin iframe — your"
  },
  {
    "tool": "run_code_in_vm",
    "purpose": "Run a Node.js snippet on the project's compute VM (headless — no browser needed). The project's npm dependencies are importable; network access works, so you can call the project's /_api/* endpoints (get_preview_url → apiBaseUrl). ESM by default; bare require() snippets run as CJS. Returns stdout+stderr."
  },
  {
    "tool": "run_tests",
    "purpose": "Run the project's Jasmine spec files (helpers/*.spec.tsx) headlessly on the project VM (jsdom — no browser needed). Frontend AND backend code is testable: specs may render components (@testing-library/react) or import endpoint handlers/backend helpers and call them directly. Limits: fetch throws inside tests (mock with spyOn(globalThis, \"fetch\")), process.env secrets are absent, and specs importing @floot/* service modules are skipped (no mocks yet). Returns per-file PASS/FAIL with failing expectations. Defaults to"
  },
  {
    "tool": "screenshot_preview",
    "purpose": "Capture a screenshot of the user app. Call it whenever you want to SEE what the app currently looks like (layout, styling, rendered state) or want to debug the app."
  },
  {
    "tool": "search",
    "purpose": "Search your Floot projects and their code. Returns result ids usable with fetch. For richer options, list_projects enumerates projects and search_code does code-level search."
  },
  {
    "tool": "search_code",
    "purpose": "Search a Floot project's files (string or regex) with optional glob filters (e.g. ['components/*', 'endpoints/**']). Returns file:line excerpts plus filename matches; capped at 40 results."
  },
  {
    "tool": "typecheck",
    "purpose": "Typecheck the project (incremental tsc on the project VM). Type errors don't block the app from running."
  },
  {
    "tool": "unpublish_app",
    "purpose": "Take the published app offline and release its subdomain — destructive, confirm with the user first. Details: get_guides('publishing')."
  },
  {
    "tool": "update_project_metadata",
    "purpose": "Update project settings. Keys: title (2-100 chars), description, iconUrl, splashUrl, mobileAppId, enableSSR (boolean), flootAiDisallowed (boolean — true opts the project out of @floot/ai), and iOS Info.plist purpose strings (NS…UsageDescription — set to a string, or null to remove) plus boolean Info.plist keys (UIViewControllerBasedStatusBarAppearance — set to a boolean, or null to restore the template default). Invalid keys/values are reported and skipped. NOTE: these take effect on the published app only after th"
  },
  {
    "tool": "upload_asset",
    "purpose": "Upload a binary asset (image, font, audio, …) to the project's hosted storage. This uploads bytes you actually hold — a file you generated, downloaded, or read yourself. Chat attachments don't qualify: the user's attachments never reach MCP servers (you see attached images through vision only; there is no file, id, or URL behind them you can read), so for those use request_user_upload instead and the user re-picks the file in a card that uploads from their browser. Three modes. ChatGPT conversation files — a genera"
  },
  {
    "tool": "view_annotation",
    "purpose": "View a screenshot annotation the user drew on the app preview (annotationId comes from get_current_context). Returns the annotated image — the user's drawings/text point at what they mean. Annotations expire after ~1 day."
  },
  {
    "tool": "write_file",
    "purpose": "Create or fully overwrite a file in a Floot project. Content is written literally. Paths must follow the item scheme (see read_file); invalid paths are rejected with the rule they broke. Pass expected_version (from list_files/read_file) to detect concurrent edits. Writing components/Name.module.css sets the css of components/Name — other properties of the item are preserved."
  }
]);
export const FLOOT_OBSERVABLE_GUIDE_TOPICS=Object.freeze([
  {
    "id": "floot-overview",
    "purpose": "how Floot projects work (read this first)"
  },
  {
    "id": "design",
    "purpose": "the design phase: author design principles + base.css variables (do this right after create_project, before building UI)"
  },
  {
    "id": "first-build",
    "purpose": "the build-order playbook for a fresh project: design phase, UI scaffold with sample data first, then backend, wired up incrementally; plus v1 scope discipline (create_project returns it inline — reread here if needed)"
  },
  {
    "id": "primitives",
    "purpose": "the item-model conventions for ALL primitives: endpoint/.schema.ts pattern with full example, pages/pageLayout rules, FlootRoute naming, helper placement (read before your first endpoint or page)"
  },
  {
    "id": "examples",
    "purpose": "how to author a component's live example file (components/Name.example.tsx, plus its optional .example.module.css); advanced — only when the user explicitly asks for examples"
  },
  {
    "id": "publishing",
    "purpose": "the publish/unpublish lifecycle: modes, inputs, statuses, custom-domain flow, job polling (read before your first publish_app call)"
  },
  {
    "id": "resources",
    "purpose": "what list_resources returns and how existing credentials, provision_resource, and request_external_resource fit together"
  },
  {
    "id": "prod-backend-logs",
    "purpose": "read the PUBLISHED app's backend server logs via run_code_in_vm's `_floot.getProdBackendLogs`"
  },
  {
    "id": "screenshot",
    "purpose": "using screenshot_preview: the open-window/card/retry loop, result format, pairing with navigate_preview"
  },
  {
    "id": "ios-info-plist",
    "purpose": "editing the native config statics under static/__dev/native/ (ios-info.plist from the last iOS publish, android-manifest.xml from the last Android publish) directly with read_file/edit_file/write_file (store review rejections, post-publish permissions)"
  },
  {
    "id": "android-manifest",
    "purpose": "same guide as ios-info-plist: editing static/__dev/native/android-manifest.xml (Google Play rejections, post-publish manifest entries)"
  },
  {
    "id": "queueTask",
    "purpose": "How to run backend work in the background with @floot/queueTask — immediate fan-out, one-off delayed jobs, or recurring jobs created at runtime. For schedules known at build time, use scheduled-jobs instead."
  },
  {
    "id": "runCode",
    "purpose": "Run an agent-authored program durably in an isolated sandbox that survives Lambda timeouts and calls back into your app's helpers, with @floot/runCode."
  },
  {
    "id": "floot-realtime",
    "purpose": "Always use this for real-time updates/chats/notifications and pub/sub. Never use polling [ships seed code — auto-injected on first load with projectId]"
  },
  {
    "id": "creating-previewing-and-splitting-pdfs",
    "purpose": "Instructions for working with PDFs: creating, previewing and splitting."
  },
  {
    "id": "pdfmake-setup",
    "purpose": "Detailed pdfmake initialization and usage instructions."
  },
  {
    "id": "react-big-calendar",
    "purpose": "Layout and styling rules for react-big-calendar to avoid common issues."
  },
  {
    "id": "floot-native-mobile-app",
    "purpose": "Guidelines for projects deployed as native mobile apps."
  },
  {
    "id": "ios-entitlements",
    "purpose": "Add a custom iOS entitlement (HealthKit, Sign in with Apple, Associated Domains, NFC, FinanceKit, ...) to the signed native app, and learn which capabilities Floot enables for the user. Load before touching entitlements — they live in their own file, NOT in Info.plist."
  },
  {
    "id": "share-target",
    "purpose": "Make a published native iOS/Android app appear in the system share sheet to receive shared photos/videos/files/text/links from other apps (Photos, WhatsApp, Safari, ...). iOS ships a Share Extension, Android a share activity."
  },
  {
    "id": "background-wake",
    "purpose": "Run the app's own code while the native iOS app is closed or in the background, woken by a silent push or by iOS Background App Refresh. For syncing on-device data (FinanceKit, HealthKit, local queues) or refreshing data before the user opens the app."
  },
  {
    "id": "native-system-bars",
    "purpose": "Control how a published native iOS/Android app treats the status bar and Android navigation bar: change the bar color from the default black, or go edge-to-edge (app content under the bars) with safe-area padding. Use when the user mentions the black bar at the top/bottom of the native app, the status bar color, the notch, or a full-bleed / immersive layout."
  },
  {
    "id": "server-memory",
    "purpose": "The project's serverMemoryMb setting: the memory size of the server Lambda that runs every endpoint, queued task, scheduled job and SSR render. Load ONLY when the user explicitly asks to change, raise, lower or reset the server/backend/Lambda memory, or when a deploy failed with 'Server memory setting rejected (serverMemoryMb = …)'. Do not load it to diagnose slowness or failures on your own initiative."
  },
  {
    "id": "auth-and-payment-challenges",
    "purpose": "How to return a 401/402 whose WWW-Authenticate challenge actually reaches the client. Load when the app must serve an HTTP authentication or payment challenge — Stripe Machine Payments / MPP or x402 per-call payments, RFC 9728 OAuth protected-resource discovery for an MCP server the app hosts, or HTTP Basic — or when a challenge header is reported as missing, renamed, or arriving as x-amzn-remapped-www-authenticate."
  },
  {
    "id": "csv-handling",
    "purpose": "Processing CSV files in Floot's serverless environment."
  },
  {
    "id": "zip-files-and-import-code",
    "purpose": "How to process user-uploaded zip files (including importing an existing code project) by extracting them in the browser into static/__dev files."
  },
  {
    "id": "ssr",
    "purpose": "How to enable SSR/pre-rendering (server-rendered HTML for crawlers, SEO, and link/OG previews) and how to talk about it to users."
  },
  {
    "id": "ssr-prefetch",
    "purpose": "SSR prefetching setup with prefetch.ts files — also how a page returns a real server-side 301/302 redirect (redirect: { to }) for old or renamed URLs, e.g. an SEO-preserving migration onto Floot."
  },
  {
    "id": "analytics",
    "purpose": "How to set up analytics in Floot, and how the built-in visitor analytics tracker handles cookie consent (analyticsMode setting + window.flootAnalytics consent API). Load when the user asks about analytics, page-view tracking, a cookie/consent banner, GDPR/ePrivacy/UK PECR, or turning tracking off."
  },
  {
    "id": "floot-provided-google-integrations",
    "purpose": "Load when the app lets a user connect their Google account to read or write Gmail, Calendar, or Drive via Floot's Google integration (not their own OAuth client). Not for Google sign-in/login. [beta — the project owner's account may not have access]"
  },
  {
    "id": "floot-provided-microsoft-integrations",
    "purpose": "Load when the built app lets a user connect a Microsoft account to read or write their Outlook Mail, Outlook/Microsoft Calendar, or OneDrive, using the Floot-provided Microsoft integration (not the user's own Microsoft/Azure OAuth app). NOT for Microsoft sign-in/login"
  },
  {
    "id": "floot-microsoft-login",
    "purpose": "Load when the app needs 'Sign in with Microsoft'"
  },
  {
    "id": "user-app-storage",
    "purpose": "Load when the built app lets end users upload, store, or manage files at runtime via the @floot/storage SDK (server-side)."
  },
  {
    "id": "static-storage",
    "purpose": "Load when adding, replacing, removing, or inspecting static assets the project references (live via runCodeInBrowser). Not for end-user uploads — use user-app-storage for those."
  },
  {
    "id": "testing",
    "purpose": "How to write unit tests."
  },
  {
    "id": "email",
    "purpose": "How to send AND receive email from a Floot app using the @floot/email package."
  },
  {
    "id": "push-notification",
    "purpose": "Load when the built app needs to send push notifications."
  },
  {
    "id": "custom-domain-dns",
    "purpose": "How to connect a custom domain to a Floot project."
  },
  {
    "id": "hosting-cost-analysis",
    "purpose": "Load when the user asks why their hosting cost, bill, or credit usage is high, or wants a usage or cost breakdown (per-category daily hosting usage)."
  },
  {
    "id": "push-notification-history",
    "purpose": "Load when the user asks to SEE, audit, or debug their app's web push notification send history (what was sent, to which devices, success/failure). This REPORTS existing history in chat."
  },
  {
    "id": "lottie-animations",
    "purpose": "How to use Lottie animations correctly."
  },
  {
    "id": "custom-oauth-providers",
    "purpose": "How to set up custom OAuth providers, including PKCE compatibility issues."
  },
  {
    "id": "scheduled-jobs",
    "purpose": "How to set up build-time cron scheduled jobs (recurring backend work whose schedule is known while building). For runtime-created schedules, use queueRecurringTask from the queueTask skill."
  },
  {
    "id": "ai-byok",
    "purpose": "How to integrate AI features using the USER'S OWN provider API key. Load this INSTEAD of `floot-ai` when the user has opted out of Floot AI. Otherwise prefer `floot-ai`."
  },
  {
    "id": "dynamic-sitemap",
    "purpose": "How to implement a sitemap.xml — prefer static files, use dynamic endpoints only when URLs come from a database."
  },
  {
    "id": "floot-ai",
    "purpose": "How to add simple one-hop AI features (text generation, multimodal embeddings, image generation) to a Floot app using the @floot/ai package — pre-configured, billed via Floot credits. Load floot-agents for things like chatbots or multi-turn agentic tasks."
  },
  {
    "id": "floot-ai-chat-gpt",
    "purpose": "Sub-skill of floot-ai: how to call flootAi.chat with gpt-5.6-sol — OpenAI Responses API wire format. Reach for it when you need frontier performance on the hardest tasks, hosted tools (web_search, code_interpreter, image_generation), or OpenAI Responses-specific features like reasoning summaries. Includes streaming, error handling, and downloading code_interpreter files."
  },
  {
    "id": "floot-ai-chat-luna",
    "purpose": "Sub-skill of floot-ai: how to call flootAi.chat with gpt-5.6-luna — the default low-cost, fast model. OpenAI Responses API wire format, identical to gpt-5.6-sol. Cheapest chat model here (input $0.20/M, cached $0.02/M, output $1.20/M), 1.05M context, 128K output cap, native image + PDF input, hosted web_search. Reach for it for easy tasks (summarizing, drafting, rewriting, extraction, classification, short replies) and any call a person waits on — on that work it matches glm-5's quality in seconds instead of minutes — plus light tool loops, and as the web-search / document-reading delegate for glm-5 apps. Includes streaming and error handling."
  },
  {
    "id": "floot-ai-chat-gemini-flash-3-5",
    "purpose": "Sub-skill of floot-ai: how to call flootAi.chat with gemini-3.5-flash — Google generateContent wire format. Flagship-tier Gemini (input $1.50/M, output $9.00/M) with Google-native hosted tools (googleSearch, codeExecution, urlContext) and very long context. Supports thinkingConfig for reasoning-effort control. Includes streaming and error handling. [beta — the project owner's account may not have access]"
  },
  {
    "id": "floot-ai-chat-glm-flash",
    "purpose": "Sub-skill of floot-ai: how to call flootAi.chat with glm-5-flash (Z.ai GLM-5.3-Flash) — the cheap tier of the GLM line on the OpenAI Chat Completions wire (input $0.15/M, cached $0.03/M, output $0.50/M — 9x under glm-5). Ties or beats glm-5 on knowledge-work and tool-use benchmarks (GDPval-AA, Toolathlon) and takes image input, which glm-5 does not; weaker on hard reasoning and coding. Reach for it for personal / work agents, email and drafting, multi-tool workflows, and background agent steps. Same wire, quirks, compaction and streaming as glm-5. [beta — the project owner's account may not have access]"
  },
  {
    "id": "floot-ai-chat-glm",
    "purpose": "Sub-skill of floot-ai: how to call flootAi.chat with glm-5 (Z.ai GLM) — the default for hard reasoning, coding, and agentic/tool-calling work. OpenAI Chat Completions wire; the strongest general model here (input $1.40/M, output $4.40/M, below gemini-3.5-flash). Always thinks before answering (cannot be disabled), so it is slow for calls a person waits on — use gpt-5.6-luna for easy tasks and user-waiting calls. Text-only (no vision — for image input, delegate to kimi-k2; see the Vision section), automatic server-side compaction, function tools only (no hosted tools). Includes streaming and error handling."
  },
  {
    "id": "floot-ai-kimi",
    "purpose": "Sub-skill of floot-ai: how to call flootAi.chat for Kimi K2 — a vision-capable model on the OpenAI Chat Completions wire. Its role here is image understanding for glm-5 apps (glm-5 is text-only): the agent view_image tool and the floot-ai-chat-glm Vision section delegate images to it. For general work, use glm-5 (floot-ai-chat-glm) for hard reasoning, coding, and agentic loops, and gpt-5.6-luna (floot-ai-chat-luna) for easy tasks and calls a person waits on."
  },
  {
    "id": "floot-ai-embed",
    "purpose": "Sub-skill of floot-ai: how to call flootAi.embedBatch for multimodal embeddings (text, images, PDFs, audio, video) with the gemini-embedding-2 model."
  },
  {
    "id": "floot-ai-image",
    "purpose": "Sub-skill of floot-ai: how to call flootAi.chat with gemini-3.1-flash-image to generate or edit images."
  },
  {
    "id": "floot-ai-image-openai",
    "purpose": "Sub-skill of floot-ai: premium-quality image gen via flootAi.generateImage (gpt-image-2 highest quality, gpt-image-1.5 supports transparency)."
  },
  {
    "id": "floot-agents",
    "purpose": "Load this when you need to build or update any AI agent, chatbot, assistant, or support bot — anything conversational, tool-using, or autonomous. Injects a complete agent scaffold (conversation persistence, agent loop, tools, memory, streaming); prefer it over hand-rolling chat with floot-ai. [ships seed code — auto-injected on first load with projectId]"
  },
  {
    "id": "floot-agents-loop-internals",
    "purpose": "Deep reference for the agent turn loop injected by floot-agents: context compaction materialization, manual stall reactivation, the halt-and-resume child contract (history_items IS NULL), atomic-claim idempotency idioms, the post-LLM abort re-check, tool-arg JSON repair, and other loop subtleties. Load when implementing or debugging the loop internals."
  },
  {
    "id": "floot-agents-subagents",
    "purpose": "How to give a Floot agent parallel subagents (delegate_to_subagent) for independent concurrent sub-tasks. Load when an agent must fan out work. [ships seed code — auto-injected on first load with projectId]"
  },
  {
    "id": "floot-agents-memory",
    "purpose": "How to give a Floot agent long-term memory (a no-embeddings index+detail tree) plus standing instructions. Load when it should remember across turns and threads. Memory is for freeform, unstructured knowledge; for structured, tabular records the owner browses or edits, use Collections instead. [ships seed code — auto-injected on first load with projectId]"
  },
  {
    "id": "floot-agents-scheduling",
    "purpose": "How to let a Floot agent schedule itself — recurring cron jobs and one-off follow-ups. Load for reminders, polling, or recurring agent work. [ships seed code — auto-injected on first load with projectId]"
  },
  {
    "id": "floot-agents-remote",
    "purpose": "How to connect a Floot agent to other agents (agent-to-agent API, key auth, cross-thread messaging). Load when agents must talk to each other. [ships seed code — auto-injected on first load with projectId]"
  },
  {
    "id": "floot-agents-telegram",
    "purpose": "How to put a Floot agent on Telegram (secured webhook, chat allowlist) with human-in-the-loop approvals. Load for Telegram chat or approval gating. [ships seed code — auto-injected on first load with projectId]"
  },
  {
    "id": "floot-agents-collections",
    "purpose": "An agent's structured datastore — the complement to memory. Memory holds freeform, unstructured notes; collections hold typed, queryable records (CRMs, trackers, pipelines, lists) that a generic UI renders and edits with no per-collection UI to build. Load when the agent should turn unstructured input into structured data the owner can view or edit. [ships seed code — auto-injected on first load with projectId]"
  },
  {
    "id": "floot-agents-access-control",
    "purpose": "The access layer for agents that serve more than one trusted owner — anonymous external end-users (a public chat page or widget) or logged-in users below the admin tier. Ships widget-session auth, a server-side role gate, per-surface toolset narrowing in code (agent_conversations.surface + catalog filter + executor refusal), the ask_supervisor escalation loop (the supervisor answers in a dashboard and the agent resumes + learns the Q→A into memory, or takes over the thread and chats with the user directly), and principal-scoped chat endpoints (chat/* for logged-in users, widget/chat/* for widget users) over one tenancy layer. Load when the agent is external-facing or multi-user, not a single-owner personal assistant. [ships seed code — auto-injected on first load with projectId]"
  },
  {
    "id": "floot-agents-mcp",
    "purpose": "Give a Floot agent tools from external MCP (Model Context Protocol) servers the owner connects at runtime: a connections registry with bearer/custom-header/OAuth auth (metadata discovery, dynamic client registration, PKCE), cached tool catalogs with per-tool enable toggles, and mcp_* dispatch through the agent loop. Streamable HTTP or SSE transports only (serverless — no stdio). Load after floot-agents when the user wants their agent to use MCP servers like Linear, Notion, or any MCP-compatible API. [ships seed code — auto-injected on first load with projectId]"
  }
]);

export const FLOOT_CAPABILITY_FAMILIES=Object.freeze([
 {id:'project-discovery',tools:['search','fetch','list_projects','list_files','search_code','read_file','read_files'],magnanimous_target:'engineering-operator'},
 {id:'code-authoring',tools:['write_file','edit_file','apply_patch','rename_file','copy_file','delete_file','add_dependency','remove_dependency'],magnanimous_target:'engineering-operator'},
 {id:'quality-verification',tools:['typecheck','run_tests','get_logs','run_code_in_vm','run_code_in_browser','get_job_status'],magnanimous_target:'engineering-operator'},
 {id:'preview-and-ui-observation',tools:['get_preview_url','navigate_preview','screenshot_preview','get_current_context','view_annotation'],magnanimous_target:'product-design-agent'},
 {id:'database-and-schema',tools:['query_database','execute_sql','pull_database_schema'],magnanimous_target:'data-platform'},
 {id:'resources-and-auth',tools:['list_resources','provision_resource','request_external_resource'],magnanimous_target:'universal-tool-gateway'},
 {id:'assets-and-media',tools:['generate_image','upload_asset','request_user_upload'],magnanimous_target:'creative-studio'},
 {id:'project-lifecycle',tools:['create_project','create_checkpoint','update_project_metadata'],magnanimous_target:'tool-deployment'},
 {id:'production-publishing',tools:['get_publish_status','publish_app','unpublish_app','cancel_request'],magnanimous_target:'deployment-operator'},
 {id:'platform-knowledge',tools:['get_guides','get_guide'],magnanimous_target:'knowledge-workspace'}
]);

export const FLOOT_ASSIMILATION_POLICY=Object.freeze({
 identity_owner:'Magnanimous AI',
 mode:'clean-room-observable-capability-assimilation',
 external_execution_rail:'Floot MCP / Floot hosting account when actually used',
 magnanimous_owned:['intent','planning','routing','memory','workflow','risk-policy','verification','learning','provider-neutral-contracts'],
 preserve_external:['Floot account authorization','Floot hosting','Floot-managed resources','published app infrastructure','provider-specific project state'],
 forbidden:['private Floot source code','hidden prompts','credentials','private infrastructure internals','proprietary model weights'],
 action_rule:'Magnanimous may suggest and initiate low-risk planning/inspection automatically. Writes, database mutations, resource provisioning, publishing, unpublishing, credential requests, and destructive operations remain subject to the real Floot tool and its approval/permission requirements.'
});

export function getFlootCapabilitySummary(){
 return{
  captured_at:'2026-09-20',
  observable_tools:FLOOT_OBSERVABLE_TOOL_CONTRACTS.length,
  guide_topics:FLOOT_OBSERVABLE_GUIDE_TOPICS.length,
  capability_families:FLOOT_CAPABILITY_FAMILIES.length,
  proprietary_implementation_copied:false,
  authorization_state:'connected-in-chat-not-assumed-inside-platform-runtime'
 };
}
