import {NextRequest,NextResponse} from 'next/server';

const MOBILE_UA=/Android|iPhone|iPad|iPod|IEMobile|Opera Mini|Mobile/i;

export function proxy(request:NextRequest){
 const userAgent=request.headers.get('user-agent')||'';
 const clientHint=request.headers.get('sec-ch-ua-mobile')||'';
 const mobile=MOBILE_UA.test(userAgent)||clientHint.includes('?1');
 const forceDesktop=request.nextUrl.searchParams.get('desktop')==='1';
 if(!mobile||forceDesktop)return NextResponse.next();
 const url=request.nextUrl.clone();
 url.pathname='/mobile-dashboard';
 url.searchParams.delete('desktop');
 url.searchParams.set('mobile','1');
 return NextResponse.rewrite(url);
}

export const config={matcher:['/']};
