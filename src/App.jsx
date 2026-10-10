import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import CustomerApp from './apps/customer/CustomerApp';
import MasterApp from './apps/master/MasterApp';
import AppStorePage from './apps/hub/AppStorePage';
import ChuruOneHomePage from './apps/churuone/ChuruOneHomePage';
import ChuruOneAuthPage from './apps/churuone/ChuruOneAuthPage';
import NashStudioApp from './apps/nash/NashStudioApp';
import SkylineApp from './apps/skyline/SkylineApp';
import LegalPage from './apps/legal/LegalPage';
import CashfreeTestPage from './apps/test/CashfreeTestPage';

function RootEntry() {
  const location = useLocation();
  const host = window.location.hostname.toLowerCase();
  const path = location.pathname.toLowerCase();
  const params = new URLSearchParams(location.search);
  const storeParam = (params.get('storeId') || params.get('store') || '').toLowerCase();

  // PhonePe Compliant Legal Policies (Contact Us, Terms, Privacy, Refund, Shipping)
  if (
    path.startsWith('/contact-us') ||
    path.startsWith('/contact') ||
    path.startsWith('/terms-and-conditions') ||
    path.startsWith('/terms') ||
    path.startsWith('/privacy-policy') ||
    path.startsWith('/privacy') ||
    path.startsWith('/refund-policy') ||
    path.startsWith('/refund') ||
    path.startsWith('/cancellation') ||
    path.startsWith('/shipping-policy') ||
    path.startsWith('/shipping') ||
    path.startsWith('/delivery-policy') ||
    path.startsWith('/policies') ||
    path.startsWith('/legal')
  ) {
    return <LegalPage />;
  }

  // Cashfree PG Sandbox Test Lab
  if (path.startsWith('/test-cashfree') || path.startsWith('/test-payment')) {
    return <CashfreeTestPage />;
  }

  // About Portal
  if (path.startsWith('/about')) {
    return <ChuruOneHomePage />;
  }

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

  // 3. Skyline Premium Outfits (Subdomain: skyline.churuone.in or ?storeId=skyline or /skyline or /outfits)
  if (host.startsWith('skyline.') || storeParam === 'skyline' || storeParam === 'skyline-outfits' || path.startsWith('/skyline') || path.startsWith('/outfits')) {
    return <SkylineApp />;
  }

  // 3. ChuruOne Main City Marketplace (root domain churuone.in, onrender backend, or explicit paths)
  if (
    host === 'churuone.in' || 
    host === 'www.churuone.in' || 
    host.includes('churuone-backend.onrender.com') ||
    path.startsWith('/churuone') ||
    params.get('view') === 'churuone' || 
    params.get('portal') === '1' || 
    params.get('home') === '1'
  ) {
    return <ChuruOneHomePage />;
  }

  // 4. Default: If any storeId is provided, show customer store
  if (storeParam) {
    return <CustomerApp />;
  }

  // Otherwise, default to the main city marketplace (ChuruOne)
  return <ChuruOneHomePage />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* PhonePe Compliant Legal & Compliance Routes */}
        <Route path="/contact-us/*" element={<LegalPage />} />
        <Route path="/contact/*" element={<LegalPage />} />
        <Route path="/terms-and-conditions/*" element={<LegalPage />} />
        <Route path="/terms/*" element={<LegalPage />} />
        <Route path="/privacy-policy/*" element={<LegalPage />} />
        <Route path="/privacy/*" element={<LegalPage />} />
        <Route path="/refund-policy/*" element={<LegalPage />} />
        <Route path="/refund/*" element={<LegalPage />} />
        <Route path="/cancellation-policy/*" element={<LegalPage />} />
        <Route path="/cancellation/*" element={<LegalPage />} />
        <Route path="/shipping-policy/*" element={<LegalPage />} />
        <Route path="/shipping/*" element={<LegalPage />} />
        <Route path="/delivery-policy/*" element={<LegalPage />} />
        <Route path="/policies/*" element={<LegalPage />} />
        <Route path="/legal/*" element={<LegalPage />} />

        {/* Cashfree PG Sandbox Test Lab */}
        <Route path="/test-cashfree/*" element={<CashfreeTestPage />} />
        <Route path="/test-payment/*" element={<CashfreeTestPage />} />

        {/* ChuruOne Unified SSO Auth Portal */}
        <Route path="/auth/*" element={<ChuruOneAuthPage />} />
        <Route path="/login/*" element={<ChuruOneAuthPage />} />
        <Route path="/signup/*" element={<ChuruOneAuthPage />} />

        {/* ChuruOne Main City Portal & Marketplace */}
        <Route path="/churuone/*" element={<ChuruOneHomePage />} />
        <Route path="/home/*" element={<ChuruOneHomePage />} />
        <Route path="/portal/*" element={<ChuruOneHomePage />} />
        <Route path="/churuone-home/*" element={<ChuruOneHomePage />} />
        <Route path="/city/*" element={<ChuruOneHomePage />} />
        <Route path="/about/*" element={<ChuruOneHomePage />} />

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

        {/* Skyline Premium Outfits Menswear Store */}
        <Route path="/skyline/*" element={<SkylineApp />} />
        <Route path="/outfits/*" element={<SkylineApp />} />

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