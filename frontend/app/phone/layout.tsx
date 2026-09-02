import type { ReactNode } from 'react';
import CarrierConsent from './carrier-consent';

export default function PhoneLayout({ children }: { children: ReactNode }) {
  return <>
    {children}
    <CarrierConsent />
  </>;
}
