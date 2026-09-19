import React from 'react';

const runtime=`(function(){
  function normalize(path){var clean=(path||'/').replace(/\\/+$/,'');return clean||'/';}
  var publicPaths=['/','/teach','/shop','/login','/signup','/owner-login','/forgot-password','/solutions','/guide','/launchplan','/business-plan','/security','/free-tools','/ai-apps','/pricing','/reviews','/privacy','/terms','/advertise','/white-label'];
  function isPublicPath(path){return publicPaths.indexOf(path)!==-1||path.indexOf('/teach/')===0||path.indexOf('/shop/')===0||path.indexOf('/reviews/')===0;}
  var currentPath=normalize(location.pathname);
  var standalone=currentPath==='/magnanimous'||currentPath.indexOf('/magnanimous/')===0;
  if(isPublicPath(currentPath))document.documentElement.setAttribute('data-iam-public','true');
  if(standalone)document.documentElement.setAttribute('data-iam-standalone','true');
  var main=document.querySelector('main');if(main&&!main.id)main.id='iam-main';

  function safeGet(storage,key){try{return storage.getItem(key)}catch(e){return null}}
  function safeSet(storage,key,value){try{storage.setItem(key,value)}catch(e){}}
  function safeRemove(storage,key){try{storage.removeItem(key)}catch(e){}}

  function installRootAutosave(){
    if(window.__iamRootAutosaveInstalled)return;window.__iamRootAutosaveInstalled=true;
    var sessionPrefix='iam_session_draft:';
    var persistentPrefix='iam_progress_draft:';
    var sensitive=/password|passwd|passcode|secret|token|authorization|api.?key|card|cvv|cvc|security.?code|ssn|social.?security|routing.?number|account.?number/i;
    function eligible(el){
      if(!(el instanceof HTMLInputElement||el instanceof HTMLTextAreaElement))return false;
      if(el instanceof HTMLInputElement&&['text','search','email','url','tel','number'].indexOf(el.type)===-1)return false;
      var marker=[el.name,el.id,el.getAttribute('aria-label'),el.placeholder,el.autocomplete].filter(Boolean).join(' ');
      return !sensitive.test(marker)&&!el.closest('[data-no-autosave="true"]');
    }
    function persistent(el){return el.getAttribute('data-persist-draft')==='true'||!!el.closest('[data-persist-draft="true"]');}
    function storage(el){return persistent(el)?localStorage:sessionStorage;}
    function prefix(el){return persistent(el)?persistentPrefix:sessionPrefix;}
    function field(el){return String(el.name||el.id||el.getAttribute('aria-label')||el.placeholder||el.tagName.toLowerCase()).slice(0,180);}
    function clean(value){return String(value||'').replace(/\\bBearer\\s+\\S+/gi,'Bearer [REDACTED]').replace(/(password|passwd|passcode|secret|token|authorization|api.?key|cvv|cvc|ssn|routing.?number|account.?number)\\s*[:=]\\s*\\S+/gi,'$1=[REDACTED]').slice(0,30000);}
    function key(el){return prefix(el)+location.pathname+':'+field(el);}
    function save(event){
      var el=event&&event.target;if(!eligible(el))return;
      var record={value:clean(el.value),updatedAt:Date.now(),path:location.pathname,field:field(el),stage:'working',persistent:persistent(el)};
      safeSet(storage(el),key(el),JSON.stringify(record));
    }
    function restore(root){
      var scope=root&&root.querySelectorAll?root:document;
      scope.querySelectorAll('input,textarea').forEach(function(el){
        if(!eligible(el)||String(el.value||'').trim())return;
        try{
          var raw=safeGet(storage(el),key(el));if(!raw)return;
          var record=JSON.parse(raw);if(!record||!record.value||record.stage==='submitted'||Date.now()-Number(record.updatedAt||0)>604800000)return;
          var proto=el instanceof HTMLTextAreaElement?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;
          var descriptor=Object.getOwnPropertyDescriptor(proto,'value');var setter=descriptor&&descriptor.set;
          if(setter)setter.call(el,record.value);else el.value=record.value;
          el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));
        }catch(e){}
      });
    }
    document.addEventListener('input',save,true);document.addEventListener('change',save,true);
    restore(document);setTimeout(function(){restore(document)},120);setTimeout(function(){restore(document)},700);
    window.__iamRestoreDrafts=restore;
  }

  function migrateMagnanimousSession(){
    var official=safeGet(localStorage,'magnanimous_admin_token');
    var legacy=safeGet(localStorage,'odin_admin_token');
    if(!official&&legacy){safeSet(localStorage,'magnanimous_admin_token',legacy);official=legacy;}
    return official||legacy||'';
  }
  function activeSession(){
    var active=safeGet(sessionStorage,'iam_session_active');
    var customer=safeGet(localStorage,'iam_account_token')||'';
    var owner=migrateMagnanimousSession();
    var customerExpiresAt=Number(safeGet(localStorage,'iam_account_session_expires_at')||0);
    var ownerExpiresAt=Number(safeGet(localStorage,'magnanimous_admin_session_expires_at')||0);
    if(customer&&customerExpiresAt&&Date.now()>=customerExpiresAt){safeRemove(localStorage,'iam_account_token');safeRemove(localStorage,'iam_account_session_expires_at');customer='';}
    if(owner&&ownerExpiresAt&&Date.now()>=ownerExpiresAt){safeRemove(localStorage,'magnanimous_admin_token');safeRemove(localStorage,'odin_admin_token');safeRemove(localStorage,'magnanimous_admin_session_expires_at');owner='';}
    if(active==='owner'&&owner)return{kind:'owner',token:owner};
    if(active==='user'&&customer)return{kind:'user',token:customer};
    if(owner){safeSet(sessionStorage,'iam_session_active','owner');return{kind:'owner',token:owner};}
    if(customer){safeSet(sessionStorage,'iam_session_active','user');return{kind:'user',token:customer};}
    return null;
  }
  function clearActiveSession(kind){
    if(kind==='owner'){safeRemove(localStorage,'magnanimous_admin_token');safeRemove(localStorage,'odin_admin_token');safeRemove(localStorage,'magnanimous_admin_session_expires_at');}
    if(kind==='user'){safeRemove(localStorage,'iam_account_token');safeRemove(localStorage,'iam_account_session_expires_at');}
    safeRemove(sessionStorage,'iam_session_active');safeRemove(sessionStorage,'iam_session_validated_at');
  }
  function guardProtectedRoute(){
    if(isPublicPath(currentPath)||standalone)return;
    var session=activeSession();
    if(!session){var returnTo=currentPath+(location.search||'');location.replace('/login?returnTo='+encodeURIComponent(returnTo));}
  }
  function validateActiveSession(){
    if(isPublicPath(currentPath)||standalone)return;
    var session=activeSession();if(!session)return;
    var last=Number(safeGet(sessionStorage,'iam_session_validated_at')||0);if(last&&Date.now()-last<300000)return;
    fetch('/api/auth/me',{headers:{Authorization:'Bearer '+session.token},cache:'no-store'}).then(function(response){
      if(response.ok){safeSet(sessionStorage,'iam_session_validated_at',String(Date.now()));if(session.kind==='owner'&&!Number(safeGet(localStorage,'magnanimous_admin_session_expires_at')||0))safeSet(localStorage,'magnanimous_admin_session_expires_at',String(Date.now()+43200000));if(session.kind==='user'&&!Number(safeGet(localStorage,'iam_account_session_expires_at')||0))safeSet(localStorage,'iam_account_session_expires_at',String(Date.now()+43200000));return;}
      if(response.status===401||response.status===403){clearActiveSession(session.kind);var returnTo=currentPath+(location.search||'');location.replace('/login?returnTo='+encodeURIComponent(returnTo));}
    }).catch(function(){});
  }

  function polishTextNode(node){
    if(!node||node.nodeType!==Node.TEXT_NODE)return;
    var parent=node.parentElement;if(parent&&['SCRIPT','STYLE','NOSCRIPT','TEXTAREA'].indexOf(parent.tagName)!==-1)return;
    var before=node.nodeValue||'';
    var after=before.replace(/ODIN/g,'MAGNANIMOUS AI').replace(/Odin/g,'Magnanimous AI').replace(/I AM OPERATOR/g,'MAGNANIMOUS AI').replace(/I AM Operator/g,'Magnanimous AI').split('Owner / Admin').join('Workspace Admin');
    if(after!==before)node.nodeValue=after;
  }
  function polishProviderMetric(card){
    if(!card||card.nodeType!==Node.ELEMENT_NODE)return;
    if((card.textContent||'').indexOf('READY PROVIDERS')!==-1){card.style.display='none';var parent=card.parentElement;if(parent)parent.style.gridTemplateColumns='repeat(3,minmax(0,1fr))';}
  }
  function polishCustomerUI(root){
    if(isPublicPath(currentPath)||standalone||!root)return;
    if(root.nodeType===Node.TEXT_NODE){polishTextNode(root);return;}
    if(root.nodeType!==Node.ELEMENT_NODE&&root!==document.body)return;
    var walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);while(walker.nextNode())polishTextNode(walker.currentNode);
    if(root.matches&&root.matches('.metrics article'))polishProviderMetric(root);
    if(root.querySelectorAll)root.querySelectorAll('.metrics article').forEach(polishProviderMetric);
  }
  function observeIncrementally(){
    if(isPublicPath(currentPath)||standalone)return;
    polishCustomerUI(document.body);
    new MutationObserver(function(mutations){
      mutations.forEach(function(mutation){mutation.addedNodes.forEach(function(node){polishCustomerUI(node);if(window.__iamRestoreDrafts&&node.nodeType===Node.ELEMENT_NODE)window.__iamRestoreDrafts(node);});});
    }).observe(document.body,{subtree:true,childList:true});
  }

  function loadAds(){
    fetch('/api/monetization/config',{cache:'no-store'}).then(function(r){return r.ok?r.json():null}).then(function(c){
      if(!c)return;var configured=!!(c.adsense_configured||c.auto_ads_ready||c.ads_enabled);var client=c.adsense_client_id||c.adsense_client||'';
      if(!configured||!client||document.querySelector('script[data-iam-adsense="true"],#iam-adsense'))return;
      var s=document.createElement('script');s.id='iam-adsense';s.dataset.iamAdsense='true';s.async=true;s.crossOrigin='anonymous';s.src='https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client='+encodeURIComponent(client);document.head.appendChild(s);
    }).catch(function(){});
  }

  installRootAutosave();migrateMagnanimousSession();guardProtectedRoute();validateActiveSession();observeIncrementally();if(!standalone)loadAds();
})();`;

export default function PlatformRuntimeScript(){
  return <script id="iam-platform-runtime" dangerouslySetInnerHTML={{__html:runtime}}/>;
}
