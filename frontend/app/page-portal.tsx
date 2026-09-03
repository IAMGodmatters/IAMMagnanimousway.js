'use client';
import { useEffect } from 'react';
import { getMagnanimousAdminToken } from './lib/magnanimous-session';

export default function CustomerEntryGate() {
  useEffect(() => {
    const customer = localStorage.getItem('iam_account_token');
    const owner = getMagnanimousAdminToken();
    if (!customer && !owner) window.location.replace('/signup');
  }, []);
  return null;
}