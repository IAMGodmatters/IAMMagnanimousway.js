# Magnanimous Freight Logistics + ERP — clean-room research and implementation map

Date: 2026-10-08
Owner brain: **Magnanimous AI**
Implementation posture: **free-first, additive, tenant-safe, approval-gated for consequential actions**

## Purpose

Research the public capabilities and workflow ideas visible around LoadHunter and combine the useful patterns with a native Magnanimous ERP/TMS design. The goal is not to depend on LoadHunter or copy its code. The goal is for Magnanimous AI to own the workflow, normalized data, policy, memory, analytics and UX while outside load boards, mapping, weather, email, telephony, factoring, carrier and payment services remain replaceable rails.

## Legal / clean-room boundary

LoadHunter's current Terms of Service prohibit reverse engineering, and the Firefox listing marks the extension source as **All Rights Reserved**. Therefore Magnanimous must not copy LoadHunter source code, private APIs, branding, assets, hidden implementation details, tokens, sessions or proprietary data. We can independently implement **functional ideas and general workflow patterns** learned from public descriptions, public release notes, open standards and our own product design.

Public research basis:

- https://loadhunter.io/
- https://loadhunter.io/privacy
- https://loadhunter.io/terms
- https://chromewebstore.google.com/detail/loadhunter/ogepjnnfghfpkpjjieenkcppifhmmcdg
- https://addons.mozilla.org/en-US/firefox/addon/loadhunter/versions/
- https://docs.frappe.io/erpnext/introduction
- https://docs.frappe.io/erpnext/setting-up
- https://docs.frappe.io/erpnext/accounting-entries
- https://www.odoo.com/erp
- https://csa.fmcsa.dot.gov/

## Public LoadHunter capability map worth absorbing as independent Magnanimous capabilities

### 1. Smart freight board

Publicly described behaviors include a high-performance customizable board, reorderable/resizable/hidden columns, pinned rows, auto-refresh, multiple board support, saved loads, per-tab search state, duplicate suppression, ignored brokers/states, preferred parties and a simplified board view.

Magnanimous implementation direction:

- canonical `freight_posting` object independent of source board;
- source adapters normalize DAT, Truckstop, Super Dispatch or future authorized rails into one schema;
- per-workspace saved views and per-search state;
- deterministic duplicate key using source id + lane + dates + equipment + counterparty + normalized rate window;
- hide/pin/prefer/ignore rules owned by Magnanimous, not the source board;
- incremental row updates rather than full-board redraws;
- virtualized lists for large result sets;
- stable sort and filter state;
- board-source provenance on every field.

### 2. Load economics

Publicly visible features include RPM, deadhead, tolls, fuel, profit calculators, average-rate context and spot-rate style decision support.

Magnanimous implementation direction:

- gross rate;
- loaded miles;
- origin and destination deadhead;
- total miles;
- loaded RPM and all-in RPM;
- fuel gallons and fuel cost;
- toll estimate;
- driver/contractor cost;
- fixed/other trip cost;
- estimated contribution profit and margin;
- break-even gross and break-even RPM;
- confidence/provenance for every live input;
- configurable company cost model rather than a hard-coded formula.

The first functional calculator is implemented at `/logistics-erp`.

### 3. Communication automation

Publicly described features include one-click email, multiple mailboxes, templates, signatures, automated outreach, call/SMS integration, duplicate-contact suppression and broker reply processing.

Magnanimous design:

- connected Gmail/Outlook through OAuth with least privilege;
- reusable tenant-owned templates with dynamic variables;
- conversation identity tied to posting/load and counterparty;
- duplicate-contact guard before automated outreach;
- throttling, quiet hours and anti-spam policy;
- draft-first mode for uncertain or consequential communication;
- reusable telephony rail abstraction rather than vendor lock-in;
- never speak or message on behalf of a user outside enabled rules.

### 4. Alerts and attention routing

Publicly described LoadHunter behavior includes filtered Telegram load alerts from multiple boards.

Magnanimous should generalize this into the existing Attention Watch:

- load-match events;
- lane/RPM/equipment filters;
- idle-driver alerts;
- expiring pickup windows;
- missing document alerts;
- broker reply alerts;
- route/weather exception alerts;
- payment/settlement aging alerts;
- channel preference: in-app first, then connected email/SMS/push/Telegram where authorized;
- dedupe key to prevent repeated notifications.

### 5. TMS / dispatch

Public descriptions mention driver timelines, task planning and integrated TMS workflow.

Magnanimous native model should include:

- `driver`
- `vehicle`
- `trailer`
- `availability_window`
- `load`
- `dispatch_assignment`
- `stop`
- `shipment_milestone`
- `document`
- `exception`
- `proof_of_delivery`
- `settlement`

Recommended load lifecycle:

`candidate -> contacted -> negotiating -> offered -> booked -> dispatched -> at_pickup -> in_transit -> delivered -> pod_received -> invoiced -> settled -> closed`

Every transition should record actor, time, source, previous state, new state and evidence.

### 6. Risk, authority and factoring evidence

Public materials describe factoring ratings, FMCSA lookups, community reviews, scam detection, preferred/ignored companies and multiple factoring providers.

Magnanimous implementation rule: **signals are evidence, not verdicts**.

- store MC/DOT identifiers;
- authority status and source timestamp;
- insurance/licensing references where lawfully available;
- factoring result with provider/source/time;
- payment-history observations;
- community note/review as subjective evidence;
- internal tenant notes;
- scam/anomaly indicators;
- never label a carrier legally unsafe merely from CSA/SMS performance data;
- require live verification before financial reliance.

FMCSA itself warns not to infer an overall safety determination from SMS data unless formal safety-rating/out-of-service conditions apply.

### 7. Maps, tolls and weather

Public LoadHunter descriptions show integrated maps, deadhead, toll estimates and weather along routes.

Magnanimous should own a `route_snapshot` abstraction:

- ordered stops;
- geocoded coordinates;
- route distance and duration;
- deadhead segments;
- toll estimate;
- weather snapshots and hazard flags;
- source/provider and fetched-at timestamp;
- cached result TTL;
- fallback providers.

Free-first research candidates should be preferred where usage terms permit. Paid providers should be opt-in and cost-capped.

### 8. Rate-confirmation/document AI

LoadHunter's privacy policy publicly describes AI parsing of uploaded rate confirmations.

Magnanimous clean-room equivalent:

1. upload or ingest authorized document;
2. hash document and retain source metadata;
3. extract text/structured fields;
4. return field confidence + source location;
5. compare extracted values against existing load record;
6. flag differences;
7. require review before authoritative ERP/TMS posting;
8. preserve original document and approved normalized record.

Fields: load/reference number, broker/carrier, MC/DOT, rate, currency, pickup/delivery, dates/times, equipment, commodity, weight, accessorials, detention/layover terms, payment terms and contact details.

### 9. Community notes + product feedback

Public release notes describe community notes, reviews, bug reports, feature requests and voting.

Magnanimous should split these concerns:

- private tenant notes;
- organization-shared notes;
- optional public/community evidence;
- feature request backlog;
- vote counts;
- moderation state;
- release link once shipped.

Never expose tenant-private operational data through public feedback.

## ERP architecture to absorb

ERPNext and Odoo both reinforce a modular, integrated ERP pattern. ERPNext specifically documents integrated accounting, inventory, sales, purchasing, projects, assets and common masters. Magnanimous should absorb the architecture pattern while keeping its own data model and UX.

### Canonical master data

- legal entity / company
- business unit / cost center
- customer
- supplier/vendor
- broker
- carrier
- contact
- address/location
- item/service
- driver
- vehicle/trailer/asset
- bank/payment account reference
- tax profile
- user / role / permission

### Commercial records

- lead/opportunity
- quotation
- sales order
- purchase order
- load / shipment
- sales invoice / receivable
- purchase invoice / payable
- payment / settlement
- credit/debit memo
- expense
- contract / rate agreement

### Finance principles

Magnanimous should not let AI directly mutate ledger balances. Approved business documents produce balanced ledger entries. Keep:

- chart of accounts;
- journal-entry engine;
- AR/AP subledgers;
- cost centers;
- fiscal periods;
- taxes;
- bank/payment reconciliation;
- immutable audit trail;
- period-close locks.

### Asset/fleet principles

Vehicle and trailer records should support:

- acquisition cost;
- assigned custodian/driver;
- location;
- service status;
- maintenance schedule;
- maintenance/repair expense;
- odometer/mileage evidence;
- depreciation policy where accounting is enabled;
- sold/scrapped/retired state.

## Magnanimous-specific advantage over a normal TMS/ERP

Magnanimous AI should be the cross-module brain instead of bolting AI onto isolated screens.

The brain can:

- reason over CRM + board + route + documents + ERP + communication context;
- suggest the next safe action;
- detect missing evidence;
- explain why a load score changed;
- compare projected vs realized margin;
- learn tenant-specific preferences without changing global policy;
- surface anomalies rather than silently editing records;
- generate drafts, summaries and plans;
- execute reversible/read-only actions proactively;
- require approval for bookings, money movement, legal attestations, credential/security changes and destructive actions.

## UX/design improvements adopted

- dense operational information, but grouped into role-focused cards;
- customizable board views;
- dark-first operations theme with accessible contrast;
- persistent search/view state;
- visual status chips instead of walls of text;
- fast keyboard-driven actions;
- profitability metrics visible before booking;
- provenance and confidence visible next to AI-derived fields;
- responsive mobile layout for owner/dispatcher checks;
- no clutter from integrations that are not configured;
- feature flags and connection-health indicators.

## Free-first implementation order

### Phase A — now

- New `/logistics-erp` command page.
- Live client-side freight profitability calculator.
- Native capability/ERP map.
- Magnanimous load scoring prototype.
- B2B/CRM/Enterprise/Connections navigation links.
- Clean-room legal boundary documented.

### Phase B — next native backend

- D1 migrations for canonical freight/ERP objects.
- `/api/logistics/*` CRUD with tenant isolation.
- event/audit table and status-transition service.
- saved board views and rules.
- load dedupe and scoring engine.
- dispatch timeline.
- document intake + review queue.
- AR/AP invoice linkage and realized-margin reconciliation.

### Phase C — authorized external rails

- load-board adapters only under valid user/business authorization and source terms;
- FMCSA/authority research adapter;
- map/weather/toll provider adapters;
- connected Gmail/Outlook conversation rail;
- telephony/SMS rail;
- factoring adapters where contracts/credentials permit;
- accounting/ERP import-export adapters.

## Do not silently claim these are live

Until verified, do not claim:

- DAT/Truckstop/Super Dispatch data access;
- live FMCSA API status;
- live factoring connection;
- live toll/weather/map data;
- live automated broker outreach;
- accounting books are production-ready;
- booking/payment authority.

The UI can expose the capability and readiness state while remaining fail-closed for unverified transactional rails.

## Success metrics

- time from new posting to qualified decision;
- duplicate contacts prevented;
- deadhead percentage;
- projected vs realized gross margin;
- average all-in RPM;
- load acceptance/book rate;
- dispatcher response time;
- on-time pickup/delivery;
- document completeness;
- invoice-to-cash days;
- payable aging;
- exceptions per 100 loads;
- connector failures;
- AI suggestions accepted/rejected;
- cost per successful automated action.

## Core rule

**Magnanimous AI owns the normalized business brain. External systems provide authorized data or execution rails only. Copy workflow ideas lawfully; do not copy proprietary code.**
