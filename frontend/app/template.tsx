import React from 'react';

// Authentication is enforced by the route guard in the root layout and by
// authenticated API endpoints. Keeping the global template server-rendered
// means public sales, pricing, review and trust pages are visible to search
// engines and link-preview crawlers even when they do not execute JavaScript.
export default function Template({children}:{children:React.ReactNode}){
  return <>{children}</>;
}
