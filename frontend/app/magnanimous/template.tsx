import type {ReactNode} from 'react';

const STANDALONE_AUTH_GUARD=`(()=>{
 try{
  const hasToken=Boolean(
   localStorage.getItem('iam_account_token')||
   localStorage.getItem('magnanimous_admin_token')||
   localStorage.getItem('odin_admin_token')
  );
  if(!hasToken){
   location.replace('/login?returnTo=%2Fmagnanimous');
  }
 }catch{
  location.replace('/login?returnTo=%2Fmagnanimous');
 }
})();`;

export default function MagnanimousAuthTemplate({children}:{children:ReactNode}){
 return <>
  <script dangerouslySetInnerHTML={{__html:STANDALONE_AUTH_GUARD}}/>
  {children}
 </>;
}
