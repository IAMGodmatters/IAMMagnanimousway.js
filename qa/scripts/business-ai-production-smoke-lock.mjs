import fs from'node:fs';
const y=fs.readFileSync(new URL('../../.github/workflows/deploy.yml',import.meta.url),'utf8');
const required=[
 '/api/business-ai/tools',
 'len(tools) == 47',
 '/api/business-ai/jobs',
 'sticky-notes',
 'workflow_complete',
 'not_verified',
 '/api/business-ai/jobs/$business_ai_job_id/verify',
 'Business AI verification endpoint returned HTTP $status',
 'Business AI POST /verify returned 200',
 'magnanimous_business_ai_jobs'
];
for(const item of required)if(!y.includes(item))throw Error('missing Business AI production smoke '+item);
console.log('Business AI 47-tool and direct verification-endpoint production smoke contract passed.');
