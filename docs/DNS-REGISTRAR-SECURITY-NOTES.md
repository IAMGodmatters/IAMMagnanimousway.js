# DNS / Registrar Security Notes

Magnanimous AI keeps registrar providers subordinate to the platform identity and governance layer.

- Provider credentials stay server-side in the encrypted owner Provider Vault or protected runtime secrets.
- Public DNS intelligence does not require registrar credentials.
- Registrar account reads are owner-only.
- DNS and nameserver writes require provider-side dry-run validation, a durable pending action, and a separate confirmation before execution.
- Confirmed writes use an idempotency key and a 15-minute confirmation window.
- Domain registration, renewal, and transfer are deliberately not executed by this adapter because they can spend money.
- Provider identity remains private in customer-facing DNS/domain responses.
