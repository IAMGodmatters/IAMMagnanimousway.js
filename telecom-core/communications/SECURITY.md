# Communications security contract

Magnanimous Communications treats identity, authorization, encryption and abuse prevention as product invariants.

- Every conversation operation must authorize membership server-side.
- Attachments must use authenticated, expiring access rather than public permanent URLs in production.
- Realtime sessions must authenticate and be revocable per device.
- Block state must be enforced before message/call fanout.
- Rate limits and abuse reporting must precede public launch.
- Secrets, private keys and message plaintext must never enter logs.
- E2EE must use a reviewed established cryptographic construction/protocol; do not invent cryptography.
- E2EE product claims remain disabled until client key lifecycle, identity verification, forward secrecy, multi-device behavior, backups/recovery and independent review are complete.
- PSTN/emergency/regulatory capabilities remain governed by Magnanimous Telecom authority truth locks.
