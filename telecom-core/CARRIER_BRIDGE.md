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

Legacy `interconnect.endpoint` keeps its existing meaning and is never silently reinterpreted. A route opts into native selected-route execution only by setting `policy.asterisk_endpoint` (or the accepted alias `policy.endpoint_key`) to an **Asterisk PJSIP endpoint key** such as `pstn-trunk` or `pstn-secondary`. The route API accepts that field only for migrated SIP/BYOC interconnect types and validates its identifier shape before storage. The protected Telecom Core then requires the key to be in `CARRIER_SIP_ENDPOINT`, `CARRIER_SIP_SECONDARY_ENDPOINT`, or the owner-supplied `CARRIER_SIP_ALLOWED_ENDPOINTS` allowlist and checks it through authenticated Asterisk ARI before origination. `offline`, `unknown`, missing, or unallowlisted endpoints fail closed.

An explicit planner-selected attempt does not silently fail over to another trunk. The control plane must make any later failover decision so route IDs, rate policy, health, and CDR attribution remain consistent. Generic outside BYOC/Twilio/Plivo compatibility paths do not receive this internal route payload until they are explicitly migrated behind the same contract.

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

## Private Stasis call-control lifecycle

The Telecom Core now contains a private ARI/Stasis application layer for managed call bridges, supervisor audio, and bridge recording. It is deliberately **disabled by default** with `ASTERISK_STASIS_ENABLED=false`.

Activation requires all of the following:

1. the control API can authenticate to the private Asterisk ARI endpoint;
2. its ARI event WebSocket is connected to `ASTERISK_STASIS_APP`;
3. each target channel has actually entered that Stasis application;
4. a managed call bridge is created from Stasis-owned channels;
5. supervisor controls use a separate snoop/supervisor mixing bridge so the live call bridge is not replaced;
6. bridge recording receives explicit consent confirmation and a recorded consent basis before ARI recording is started.

Monitor uses ARI snooping with no whisper injection. Whisper and barge are separate explicit modes. A supervisor session is refused if the target/supervisor channel is outside the Magnanimous Stasis application. Recording is refused outside a managed Magnanimous bridge or when consent evidence is absent.

A carrier-free internal diagnostic extension (`MAGNANIMOUS_STASIS_DIAGNOSTIC_EXTENSION`, default `6001`) hands a native browser/SIP channel into the private Stasis app. It does not enable PSTN dialing.

Do **not** represent supervisor monitor/whisper/barge or bridge recording as production-live merely because this source is installed. The Stasis event connection, managed bridge lifecycle, supervisor media path, consent-gated recording, cleanup, and the platform owner/admin handoff must pass on the deployed Telecom Core first. Public browser WebRTC remains governed separately by `TELECOM_NATIVE_WEBRTC_LIVE`.
