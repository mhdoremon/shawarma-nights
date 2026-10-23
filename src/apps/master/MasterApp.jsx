import React from 'react';
import { MasterProvider, useMaster } from './context/MasterContext';
import MasterLayout from './MasterLayout';

function MasterRoot() {
  const { isAuthenticated } = useMaster();

  if (!isAuthenticated) {
    const params = new URLSearchParams(window.location.search);
    const storeId = params.get('storeId') || params.get('store') || '';
    const target = storeId 
      ? `/auth?role=dukandar&mode=login&storeId=${encodeURIComponent(storeId)}`
      : '/auth?role=dukandar&mode=login';
    window.location.replace(target);
    return null;
  }

  return <MasterLayout />;
}

export default function MasterApp() {
  return (
    <MasterProvider>
      <MasterRoot />
    </MasterProvider>
  );
}
