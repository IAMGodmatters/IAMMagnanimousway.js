import React from 'react';

export default function TeachLayout({children}:{children:React.ReactNode}){
  return <div data-iam-route-recovery="true" data-no-autosave="true">{children}</div>;
}
