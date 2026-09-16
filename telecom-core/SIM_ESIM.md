# Magnanimous Telecom SIM/eSIM Control

Magnanimous Telecom manages the customer-facing SIM/eSIM lifecycle while keeping mobile networks, MVNOs, SM-DP+ services and SIM manufacturers as replaceable infrastructure beneath Magnanimous AI.

## What Magnanimous owns

- Customer and subscription relationships.
- SIM/eSIM inventory metadata.
- Assignment of a SIM/eSIM to a customer, device and Magnanimous number.
- Provisioning workflow state.
- Mobile-adapter abstraction.
- Audit history and fraud/compliance controls.
- Magnanimous AI orchestration and customer support.

## What requires an authorized mobile-network relationship

Physical SIM authentication credentials and downloadable eSIM profiles are network credentials. Magnanimous must obtain them from an authorized MNO/MVNO/SIM personalization provider or, if Magnanimous later becomes directly authorized, from its own accredited carrier provisioning infrastructure.

The application MUST NOT generate, clone, copy or store raw Ki, OPc, ADM, KIC/KID, private keys, Bound Profile Packages, confirmation codes, or reusable activation codes.

## Physical SIM path

1. Obtain legitimately issued or authorized programmable UICCs from an MNO/MVNO/SIM provider.
2. Import only inventory metadata into Magnanimous Telecom (for example ICCID, label, assigned customer/device, adapter reference and state).
3. If personalization is required, use an authorized secure personalization station/HSM or provider API. The secret key material never enters the normal Magnanimous web database.
4. Activate through the configured mobile adapter.
5. Track state in Magnanimous as inventory → assigned → provisioning → active/suspended/retired.

## Consumer eSIM path

Magnanimous uses the GSMA consumer eSIM model through an authorized SM-DP+ or MVNO adapter. The adapter returns an opaque activation handle to Magnanimous. Any one-time activation code/QR payload should be delivered only at activation time and not persisted in normal application logs or D1 tables.

Magnanimous can display a provider-issued QR activation payload in an authenticated, short-lived activation screen after a compatible adapter is connected. The app should never manufacture an SM-DP+ activation code itself.

## IoT eSIM path

For fleets and constrained devices, the adapter layer can later support GSMA eSIM IoT architecture components such as an eIM/IPA relationship. This remains behind the same Magnanimous mobile-adapter interface.

## Runtime integration

Optional runtime bindings for a future authorized adapter:

```text
MOBILE_PROVISIONER_URL=https://<authorized-mobile-adapter>/v1
MOBILE_PROVISIONER_TOKEN=<secret runtime binding>
```

These are internal infrastructure bindings. They must not be exposed in customer-facing UI.

## Data model

- `telecom_mobile_adapters` — provider-neutral adapter metadata and secret binding names.
- `telecom_sim_inventory` — physical/eSIM inventory and assignments.
- `telecom_esim_orders` — provisioning-order state without raw profile secrets.
- `telecom_sim_events` — lifecycle audit trail.

## Deployment model

The SIM/eSIM control plane is part of the same Magnanimous Worker and Telecom Core whether the media server runs:

- on owner-hosted Magnanimous hardware, or
- on the optional Singapore DigitalOcean fallback node.

The $12 Singapore node is infrastructure only; it does not become the mobile carrier, SM-DP+, or Magnanimous identity.
