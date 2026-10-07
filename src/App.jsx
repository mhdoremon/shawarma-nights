import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import CustomerApp from './apps/customer/CustomerApp';
import MasterApp from './apps/master/MasterApp';
import AppStorePage from './apps/hub/AppStorePage';
import ChuruOneHomePage from './apps/churuone/ChuruOneHomePage';
import ChuruOneAuthPage from './apps/churuone/ChuruOneAuthPage';
import NashStudioApp from './apps/nash/NashStudioApp';

function RootEntry() {
  const location = useLocation();
  const host = window.location.hostname.toLowerCase();
  const path = location.pathname.toLowerCase();
  const params = new URLSearchParams(location.search);
  const storeParam = (params.get('storeId') || params.get('store') || '').toLowerCase();

  // 0. Unified ChuruOne SSO Authentication Portal (/auth or /login)
  if (path.startsWith('/auth') || path.startsWith('/login') || path.startsWith('/signup')) {
    return <ChuruOneAuthPage />;
  }

  // 1. Nash Studio Salon Website (Subdomain: nash.churuone.in or ?storeId=nash-studio or /nash or /salon)
  if (host.startsWith('nash.') || storeParam === 'nash-studio' || storeParam === 'nash' || storeParam === 'beared' || path.startsWith('/nash') || path.startsWith('/salon')) {
    return <NashStudioApp />;
  }

  // 2. Shawarma Nights Flagship Store (Subdomain: shawarma.churuone.in or ?storeId=shawarma or /shawarma or /sn)
  if (host.startsWith('shawarma.') || storeParam === 'shawarma' || storeParam === 'shawarma-nights' || path.startsWith('/shawarma') || path.startsWith('/sn')) {
    return <CustomerApp />;
  }

  // 3. ChuruOne Main City Marketplace (root domain churuone.in or www.churuone.in)
  if (host === 'churuone.in' || host === 'www.churuone.in' || params.get('view') === 'churuone' || params.get('portal') === '1' || params.get('home') === '1') {
    return <ChuruOneHomePage />;
  }

  // 4. Default: If any storeId is provided, show customer store
  if (storeParam) {
    return <CustomerApp />;
  }

  // Otherwise, default to the flagship store (Shawarma Nights)
  return <CustomerApp />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ChuruOne Unified SSO Auth Portal */}
        <Route path="/auth/*" element={<ChuruOneAuthPage />} />
        <Route path="/login/*" element={<ChuruOneAuthPage />} />
        <Route path="/signup/*" element={<ChuruOneAuthPage />} />

        {/* ChuruOne Main City Portal & Marketplace */}
        <Route path="/portal/*" element={<ChuruOneHomePage />} />
        <Route path="/churuone-home/*" element={<ChuruOneHomePage />} />
        <Route path="/city/*" element={<ChuruOneHomePage />} />

        {/* ChuruOne App Hub & Downloads Page (Google Play Store style) */}
        <Route path="/apps/*" element={<AppStorePage />} />
        <Route path="/downloads/*" element={<AppStorePage />} />
        <Route path="/store/*" element={<AppStorePage />} />

        {/* Shawarma Nights Flagship Store */}
        <Route path="/shawarma/*" element={<CustomerApp />} />
        <Route path="/sn/*" element={<CustomerApp />} />

        {/* Nash Studio Salon Web App */}
        <Route path="/nash/*" element={<NashStudioApp />} />
        <Route path="/salon/*" element={<NashStudioApp />} />

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