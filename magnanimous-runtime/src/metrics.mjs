export class MagnanimousMetrics{
 constructor(){this.started=Date.now();this.requests=0;this.errors=0;this.byStatus=new Map();this.totalMs=0}
 observe(status,durationMs){
  this.requests++;
  if(Number(status)>=500)this.errors++;
  const key=String(status);
  this.byStatus.set(key,(this.byStatus.get(key)||0)+1);
  this.totalMs+=Math.max(0,Number(durationMs)||0);
 }
 prometheus(){
  const lines=[
   '# HELP magnanimous_runtime_uptime_seconds Runtime uptime.',
   '# TYPE magnanimous_runtime_uptime_seconds gauge',
   'magnanimous_runtime_uptime_seconds '+((Date.now()-this.started)/1000).toFixed(3),
   '# HELP magnanimous_http_requests_total HTTP requests processed.',
   '# TYPE magnanimous_http_requests_total counter',
   'magnanimous_http_requests_total '+this.requests,
   '# HELP magnanimous_http_errors_total HTTP 5xx responses.',
   '# TYPE magnanimous_http_errors_total counter',
   'magnanimous_http_errors_total '+this.errors,
   '# HELP magnanimous_http_request_duration_ms_total Aggregate request duration.',
   '# TYPE magnanimous_http_request_duration_ms_total counter',
   'magnanimous_http_request_duration_ms_total '+this.totalMs.toFixed(3)
  ];
  for(const [status,count] of [...this.byStatus.entries()].sort())lines.push('magnanimous_http_responses_total{status="'+status+'"} '+count);
  return lines.join('\n')+'\n';
 }
}
