# SEC Formation Owner Input Checklist — 2026-09-26

## Current state

PR #468 is **finished and merged**. The SEC work is no longer waiting on QA. It is waiting on real owner/signatory/account and corporation-structure information that must not be guessed.

The owner has supplied real Philippine identity/tax evidence. Sensitive identifiers and images are intentionally **not** stored in GitHub.

Confirmed:
- current surname: **Hardin**
- a PhilHealth ID type acceptable to SEC eSECURE is available
- a BIR TIN card is available
- the older BIR/TIN card displays **Capuno**; the reason for that difference is not assumed

## Inputs still required before the actual SEC/eSECURE filing

| Input | Why SEC/eSECURE needs it | Current status | Handling rule |
|---|---|---|---|
| Complete current legal name | Registrant/signatory identity | Surname Hardin confirmed; full legal-name format still needs owner confirmation | Do not infer from an uploaded ID image or old record |
| Current residential address | Registrant identity/contact | Not confirmed for filing | Use the current legal address the owner confirms; do not choose between old ID addresses |
| Personal email | eSECURE/SEC account + OTP/contact | Not confirmed | Use a personal mailbox controlled by the actual signatory |
| Philippine mobile number | OTP/official contact | Not confirmed | Must be controlled by the actual signatory |
| Nationality/citizenship | Ownership/foreign-equity and SEC disclosures | Not confirmed | Do not infer |
| Incorporator/shareholder identity and ownership % | Articles/capital table | Not confirmed | Must total correctly and comply with any activity-specific ownership rules |
| Director/officer roles | Corporate governance | Not confirmed | Use actual people who will serve |
| Principal office address | Articles/LGU/BIR alignment | Not confirmed | Should be the real Philippine principal office |
| Authorized capital / subscription / paid-in facts | SEC fee and capitalization | Not confirmed | Do not invent paid-in capital or payment |
| OPC nominee/alternate nominee | Only if an OPC structure is selected | Not applicable until structure decision | Never invent nominees |
| eSECURE identities of required signatories | SEC ZERO digital-signing workflow | Not yet evidenced | Signatories must create/use their real eSECURE identities |
| Final primary/secondary purpose wording | Determines filing route and regulated-activity wording | Draft concept exists; SEC/NTC classification still open | Do not overstate telecom authority |

## Corporation-structure decision still needed

The permanent business architecture is already fixed at **one Philippine corporation** for:
- I AM MAGNANIMOUS WAY™
- Magnanimous AI / software / SaaS
- Magnanimous Call Center / BPO
- Magnanimous Telecom, subject to separate NTC/carrier authority

What is not yet fixed is the exact ownership/governance form inside that one corporation.

### Option A — One Person Corporation (OPC)
Use only if the actual ownership facts and planned regulated activities make OPC appropriate and the owner deliberately selects it. An OPC requires real nominee/alternate nominee information and must not be chosen merely because it is faster.

### Option B — Ordinary stock corporation
Use if there will be multiple actual incorporators/shareholders/directors or if the filing/purpose structure is better suited to the regular stock-corporation path.

## Filing route

- Current SEC eSPARC guidance uses SEC ZERO for domestic stock corporations other than lending/financing companies.
- OneSEC with ZERO is a narrow automated path. It should be used only when the actual primary purpose fits the permitted automated scope and no outside clearance/endorsement is required.
- Because Magnanimous intends future NTC-regulated telecom activities, **Regular with ZERO** remains the safer documented path if SEC requires outside clearance/endorsement for the chosen purpose wording.
- SEC iMessage is the current official inquiry/ticket route and requires eSECURE sign-in.

## Name/TIN record reconciliation

The owner has confirmed **Hardin** as the current surname. The older BIR/TIN card displays **Capuno**. Do not rewrite the BIR record in code or documentation. If SEC/eSECURE rejects the TIN because the BIR taxpayer name does not match the current legal name, the proper next action is a BIR taxpayer-record update using the real civil/tax evidence.

## Privacy boundary

Never persist these values in GitHub, public logs, screenshots, project documentation or ordinary chat exports:
- TIN
- PhilHealth number
- full ID number
- signature image
- birth date
- residential address
- OTP codes
- eSECURE credentials
- password/security answers

Use those values only in the official filing system when the owner is actively completing the filing.

## Next executable sequence

1. Owner confirms the missing non-secret facts above.
2. Decide OPC vs ordinary stock corporation from the real ownership/governance facts.
3. Resolve the current legal-name/BIR TIN match if eSECURE requires it.
4. Create/verify eSECURE identities for actual signatories.
5. Finalize SEC purpose wording around BPO/IT + AI/software + future separately authorized telecom.
6. Use OneSEC only if the selected purpose is eligible without outside endorsement; otherwise use Regular with ZERO.
7. Review the SEC-generated fee assessment before payment.
8. Sign digitally through the real signatories.
9. After the actual SEC certificate exists, use the real registration data for BIR and Bayawan BOSS.
10. Then submit the QBO/Startup Philippines application with the actual SEC registration and existing MVP evidence.

No step may be marked complete merely because the platform generated a draft or checklist.
