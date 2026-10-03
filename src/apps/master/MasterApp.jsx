import React from 'react';
import { MasterProvider, useMaster } from './context/MasterContext';
import MasterAuth from './MasterAuth';
import MasterLayout from './MasterLayout';

function MasterRoot() {
  const { isAuthenticated } = useMaster();

  if (!isAuthenticated) {
    return <MasterAuth />;
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
