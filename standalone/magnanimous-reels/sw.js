const CACHE='magnanimous-reels-v6';
const CORE=['/','/manifest.webmanifest','/series.js','/creator.js','/api/stories','/assets/icon-192.svg','/assets/icon-512.svg'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET')return;
 const url=new URL(event.request.url);
 const privatePath=url.pathname.startsWith('/api/account/')||url.pathname==='/api/monetization'||url.pathname.startsWith('/audio/')||url.pathname.startsWith('/series-video/')||url.pathname.startsWith('/creator-audio/')||url.pathname.startsWith('/creator-timings/');
 if(privatePath){event.respondWith(fetch(event.request));return;}
 event.respondWith(fetch(event.request).then(response=>{if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));}return response}).catch(()=>caches.match(event.request)));
});
