export function classifySocialPublishFailure(error) {
  return error?.preflight === true || error?.providerRejected === true
    ? 'failed'
    : 'outcome_unknown';
}
