# Magnanimous Telecom Carrier Bridge

Magnanimous Telecom owns the customer-facing telecom identity, call-control API, orchestration, policy, AI behavior, callbacks, and service logic. The external carrier is a replaceable network rail beneath Magnanimous.

## Native-first boundary

The bridge is carrier-neutral. `AsteriskSipCarrierBridge` implements the `CarrierBridge` port and connects Magnanimous call control to a configured SIP interconnect. A future carrier can be swapped by implementing the same port without changing `CallService`, monitoring, callback policy, authentication, or public API routes.

External carrier names are not returned through the public control API. The bridge reports the public identity as `Magnanimous Telecom`.

## SOLID / composition structure

- `config.py` — environment/configuration only.
- `domain.py` — phone/call validation and normalized channel states.
- `ports.py` — carrier/status interfaces and domain transfer objects.
- `security.py` — telecom API-token authentication only.
- `adapters/asterisk.py` — Asterisk ARI transport and SIP carrier bridge.
- `adapters/callbacks.py` — callback allowlist and status delivery.
- `services/calls.py` — place/get/hangup use-cases.
- `services/monitoring.py` — call-state monitor lifecycle.
- `services/health.py` — public and protected carrier health views.
- `container.py` — composition root and dependency injection.
- `main.py` — thin HTTP routes only.

This removes the previous monolithic `main.py` while preserving the existing call API.

## Carrier configuration

Preferred variables:

```bash
CARRIER_SIP_ENDPOINT=pstn-trunk
CARRIER_SIP_HOST=sip.example-carrier.net
CARRIER_SIP_PORT=5060
CARRIER_SIP_USERNAME=...
CARRIER_SIP_PASSWORD=...
CARRIER_SIP_FROM_DOMAIN=sip.example-carrier.net
CARRIER_DIAL_CONTEXT=magnanimous-outbound
```

The Asterisk entrypoint keeps backward compatibility with the previous `PSTN_TRUNK_*` variables. If the new `CARRIER_SIP_*` values are absent, existing `PSTN_TRUNK_HOST`, `PSTN_TRUNK_PORT`, `PSTN_TRUNK_USERNAME`, `PSTN_TRUNK_PASSWORD`, and `PSTN_TRUNK_FROM_DOMAIN` values are reused.

### Planner-selected route execution

Legacy `interconnect.endpoint` keeps its existing meaning and is never silently reinterpreted. A route opts into protected native selected-route execution only by setting `policy.asterisk_endpoint` (or the accepted alias `policy.endpoint_key`) to an **Asterisk PJSIP endpoint key** such as `pstn-trunk` or `pstn-secondary`. The route API accepts that field only for migrated SIP/BYOC interconnect types and validates its identifier shape before storage. The protected Telecom Core then requires the key to be in `CARRIER_SIP_ENDPOINT`, `CARRIER_SIP_SECONDARY_ENDPOINT`, or the owner-supplied `CARRIER_SIP_ALLOWED_ENDPOINTS` allowlist and checks it through authenticated Asterisk ARI before origination. `offline`, `unknown`, missing, or unallowlisted endpoints fail closed.

A generic workspace BYOC bridge has a separate opt-in contract. A `byoc-bridge` route may declare `policy.byoc_route_key`, an opaque non-URL selector that contains no credential or internal Asterisk endpoint. The owner must also set `VOIP_BYOC_ROUTE_CONTRACT=magnanimous-route-v1`. Only then can the selected route be handed to the workspace bridge, and the payload is reduced to route/interconnect attribution, the opaque `route_key`, planner mode, health/quality, and estimated rate. `asterisk_endpoint` and `byoc_route_key` are mutually exclusive so protected Telecom Core details cannot be mixed into a generic bridge request.

An explicit planner-selected attempt does not silently fail over to another route. Unbound BYOC routes fail closed instead of silently falling through the generic bridge. The control plane must make any later failover decision so route IDs, rate policy, health, and CDR attribution remain consistent. Twilio and Plivo remain behind their explicit planner-selected adapters. The no-route compatibility fallback is preserved temporarily for tenants that have not yet been migrated to explicit routes; that fallback is why the platform still does not claim every live PSTN path is planner-controlled.

## API

Existing API remains:

- `POST /v1/calls`
- `GET /v1/calls/{provider_call_id}`
- `DELETE /v1/calls/{provider_call_id}`
- `GET /health`

Added protected bridge introspection:

- `GET /v1/carrier`
- `GET /v1/carrier/health`

The bridge currently implements voice through SIP/Asterisk. SMS, SIM/eSIM provisioning, and number provisioning remain `false` until real authorized carrier APIs for those capabilities are connected; the platform does not pretend those external network actions exist.

## Regulatory boundary

The bridge does not create PSTN numbering rights, emergency-calling authorization, SIM/eSIM inventory, spectrum access, interconnection agreements, or telecom licenses. Those external rights must come from an authorized carrier/MVNO/MNO or the applicable regulatory framework. Magnanimous can keep its own identity and software control while using those network rails.
