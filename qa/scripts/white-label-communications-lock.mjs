import fs from'node:fs';
const r=p=>fs.readFileSync(new URL('../../'+p,import.meta.url),'utf8');
const page=r('frontend/app/white-label/communications/page.tsx');
const catalog=r('frontend/app/white-label/communications/catalog.ts');
const layout=r('frontend/app/white-label/layout.tsx');
const docs=r('docs/MIRRORFLY-CAPABILITY-ABSORPTION-2026-10-16.md');
const must=(ok,msg)=>{if(!ok)throw new Error(msg)};

must(page.includes('MAGNANIMOUS COMMUNICATIONS HUB'),'White Label communications hub heading missing');
must(page.includes('Magnanimous stays the brain'),'Magnanimous identity boundary missing from communications page');
must(page.includes("'/phone'")&&page.includes("'/agent-desk'")&&page.includes("'/ai-receptionist'")&&page.includes("'/inbox'"),'Native communication launchers missing');
must(page.includes('MirrorFly is not the identity layer'),'Provider boundary not visible in communications hub');
must(catalog.includes("status:'license-gated'")&&catalog.includes("id:'mirrorfly-adapter'"),'MirrorFly adapter must remain license gated');
must(catalog.includes('no proprietary-code copying'),'Proprietary-code boundary missing from capability catalog');
must(catalog.includes('https://www.mirrorfly.com/docs/')&&catalog.includes('https://github.com/MirrorFly'),'Official MirrorFly research sources missing');
must(!page.includes("from 'mirrorfly-sdk'")&&!page.includes('from "mirrorfly-sdk"'),'White Label communications hub must not silently bundle MirrorFly SDK');
must(docs.includes('does not contain MirrorFly credentials')&&docs.includes('must not')&&docs.includes('MIRRORFLY_ENABLED=false'),'MirrorFly license/secret truth boundary missing from research document');
must(layout.includes('/white-label/communications'),'Communications Hub must be reachable from the White Label layout');
console.log('white-label communications lock passed');
