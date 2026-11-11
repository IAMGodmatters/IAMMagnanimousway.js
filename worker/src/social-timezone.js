export function validIanaTimezone(value){
 const tz=String(value||'').trim();
 if(!tz||tz.length>80)return '';
 try{new Intl.DateTimeFormat('en-US',{timeZone:tz}).format(new Date());return tz}catch{return ''}
}

export function timezoneOffsetMatches(value,timezone){
 const raw=String(value||'').trim();
 const match=raw.match(/(Z|([+-])(\d{2}):(\d{2}))$/i);
 if(!match)return false;
 const date=new Date(raw),ms=date.getTime();
 if(!Number.isFinite(ms))return false;
 const supplied=match[1].toUpperCase()==='Z'?0:(match[2]==='-'?-1:1)*(Number(match[3])*60+Number(match[4]));
 try{
  const parts=new Intl.DateTimeFormat('en-US',{timeZone:timezone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(date);
  const values=Object.fromEntries(parts.filter(x=>x.type!=='literal').map(x=>[x.type,Number(x.value)]));
  const localAsUtc=Date.UTC(values.year,values.month-1,values.day,values.hour,values.minute,values.second);
  const actual=Math.round((localAsUtc-Math.floor(ms/1000)*1000)/60000);
  return actual===supplied;
 }catch{return false}
}
