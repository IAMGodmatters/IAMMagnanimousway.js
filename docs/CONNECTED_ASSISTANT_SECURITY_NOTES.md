# Connected Assistant security notes

The security boundary is authoritative. UI wording and controls must accurately reflect server behavior but are not trusted as the enforcement layer.

Consequential writes are staged first, then separately approved. The browser cannot convert preparation into approval by sending `confirm:true`, changing permission flags, forging a referer, or reusing a stale pending action.

Provider secrets stay server-side. Provider-specific execution remains beneath Magnanimous AI's control plane and does not alter Magnanimous AI's identity, memory ownership, or orchestration role.

Future refactors should preserve this order: authenticate → resolve tenant/user → enforce consequential-action policy → route provider action → complete audit state → return safe response.
