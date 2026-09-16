# Magnanimous DNS / Registrar Operations

The native DNS layer supports public DNS intelligence independently from registrar credentials. The optional registrar adapter becomes operational only when the owner supplies valid credentials through the encrypted Provider Vault or protected runtime secrets.

## Safe operating sequence

For normal DNS diagnostics, use the native lookup, propagation, DNSSEC, email-security, reverse-DNS, RDAP, and diagnosis routes.

For registrar-managed DNS changes, the owner should first run the provider dry-run endpoint, then stage the reviewed change. A staged change remains pending until a separate confirmation request is made. Pending confirmations expire after 15 minutes. Confirmed writes use an idempotency key and are recorded in the durable DNS provider action ledger.

Domain registration, renewal, and transfer remain outside this execution adapter because they can incur charges.
