// Original Magnanimous policy helper, based on EU AI Act Article 50 (2026 consolidated text).
// This is a transparency signal, NOT proof of C2PA signing, legal certification or an
// embedded watermark in binary images/audio/video. Keep provenance claims verifiable.
export const AI_TRANSPARENCY_POLICY = Object.freeze({
  version: '2026-10-24.article50.1',
  source: 'https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-50',
  scope: 'https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-2',
  effective_since: '2026-08-02',
  preexisting_provider_marking_transition: '2026-12-02',
  owner: 'Magnanimous AI',
});

const KINDS = new Set(['text', 'image', 'audio', 'video']);
const bool = value => value === true;

export function assessAiTransparency(input = {}) {
  const kind = KINDS.has(input.kind) ? input.kind : 'text';
  const generated = input.ai_generated !== false || bool(input.deepfake);
  // Do not mislabel human-authored material or mere standard editing as
  // synthetic substantive output. The publication context remains distinct.
  const standardEditingOnly = bool(input.standard_editing_only);
  const substantive = generated && (!standardEditingOnly || bool(input.deepfake));
  const deepfake = substantive && kind !== 'text' && bool(input.deepfake);
  const publicInterestText = substantive && kind === 'text' && bool(input.public_interest);
  const editorialExemption = bool(input.human_reviewed) && bool(input.editorial_responsibility);
  const mandatoryAudienceDisclosure = deepfake || (publicInterestText && !editorialExemption);
  const audienceLabel = !substantive ? '' : kind === 'text' ? 'AI-generated text · Magnanimous AI' :
    `AI-generated ${kind} · Magnanimous AI`;
  return {
    version: AI_TRANSPARENCY_POLICY.version,
    source: AI_TRANSPARENCY_POLICY.source,
    generated_by: substantive ? 'Magnanimous AI' : null,
    kind,
    ai_generated: substantive,
    interacting_with_ai: true,
    human_operator_not_implied: true,
    visible_disclosure: {
      text: audienceLabel,
      recommended: substantive,
      // Artistic/satirical deepfakes may use an appropriate unobtrusive disclosure,
      // but the disclosure obligation itself is not erased.
      required_for_this_context: mandatoryAudienceDisclosure,
      artistic_context: bool(input.artistic_context)
    },
    publication: {
      public_interest_text: publicInterestText,
      human_reviewed: bool(input.human_reviewed),
      editorial_responsibility: bool(input.editorial_responsibility),
      editorial_exemption_applied: publicInterestText && editorialExemption,
      deepfake,
      needs_context_review: substantive && !deepfake && kind !== 'text'
    },
    machine_readable: {
      format: 'application/json',
      marker: substantive ? 'ai-generated' : 'not-claimed',
      // This JSON metadata does not survive copy/paste, re-encoding or downloads.
      content_embedded: false,
      c2pa_signed: false,
      robust_detection_verified: false,
      requires_export_pipeline_verification: substantive
    },
    legal_compliance_certified: false
  };
}

export function chatAiTransparency() {
  return assessAiTransparency({kind:'text',ai_generated:true});
}
