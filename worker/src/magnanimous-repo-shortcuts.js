// URL construction stays native. External services never receive repository content
// or credentials from this module, and are offered only after a verified public read.
const VALID_REPO=/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;

export function buildDeveloperRepositoryShortcuts(repo,{visibility='unknown',verified=false}={}){
 if(typeof repo!=='string'||!VALID_REPO.test(repo))throw new TypeError('Invalid GitHub repository.');
 const publicVerified=verified===true&&visibility==='public';
 return{
  repo,
  visibility:verified?visibility:'unknown',
  visibility_verified:verified===true,
  third_party_enabled:publicVerified,
  github_editor:`https://github.dev/${repo}`,
  gitmcp:publicVerified?`https://gitmcp.io/${repo}`:null,
  gitingest:publicVerified?`https://gitingest.com/${repo}`:null,
  githubbox:publicVerified?`https://githubbox.com/${repo}`:null,
  privacy_note:publicVerified
   ?'Third-party shortcuts are optional. Opening one shares the public repository path with that service. Never provide credentials, private files or secrets.'
   :'Only the first-party GitHub editor is available. Third-party shortcuts stay locked until GitHub confirms that this repository is public.'
 };
}
