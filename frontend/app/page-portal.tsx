'use client';
import { useEffect } from 'react';

export default function CustomerEntryGate() {
  useEffect(() => {
    const customer = localStorage.getItem('iam_account_token');
    const owner = localStorage.getItem('odin_admin_token');
    if (!customer && !owner) window.location.replace('/signup');
  }, []);
  return null;
}
