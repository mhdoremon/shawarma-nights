import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import CustomerApp from './apps/customer/CustomerApp';
import MasterApp from './apps/master/MasterApp';
import AppStorePage from './apps/hub/AppStorePage';
import ChuruOneHomePage from './apps/churuone/ChuruOneHomePage';

function RootEntry() {
  const params = new URLSearchParams(window.location.search);

  // If query parameter has storeId (e.g. ?storeId=shawarma), open customer store
  if (params.get('storeId') || params.get('store')) {
    return <CustomerApp />;
  }

  // If explicitly requested via query parameter ?view=churuone or ?portal=1
  if (params.get('view') === 'churuone' || params.get('portal') === '1' || params.get('home') === '1') {
    return <ChuruOneHomePage />;
  }

  // If accessed directly on root domain churuone.in (without a subdomain)
  const host = window.location.hostname.toLowerCase();
  if (host === 'churuone.in' || host === 'www.churuone.in') {
    return <ChuruOneHomePage />;
  }

  // Otherwise, default to the flagship store (Shawarma Nights)
  return <CustomerApp />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ChuruOne Main City Portal & Marketplace */}
        <Route path="/portal/*" element={<ChuruOneHomePage />} />
        <Route path="/churuone-home/*" element={<ChuruOneHomePage />} />
        <Route path="/city/*" element={<ChuruOneHomePage />} />

        {/* ChuruOne App Hub & Downloads Page (Google Play Store style) */}
        <Route path="/apps/*" element={<AppStorePage />} />
        <Route path="/downloads/*" element={<AppStorePage />} />
        <Route path="/store/*" element={<AppStorePage />} />

        {/* ChuruOne Master Web OS for iPhone, Mac, Desktop & Tablets */}
        <Route path="/admin/*" element={<MasterApp />} />
        <Route path="/master/*" element={<MasterApp />} />
        <Route path="/dukandar/*" element={<MasterApp />} />

        {/* Root Route: Automatically routes based on domain or query */}
        <Route path="/*" element={<RootEntry />} />
      </Routes>
    </BrowserRouter>
  );
}