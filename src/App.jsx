import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import CustomerApp from './apps/customer/CustomerApp';
import MasterApp from './apps/master/MasterApp';
import AppStorePage from './apps/hub/AppStorePage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ChuruOne App Hub & Downloads Page (Google Play Store style) */}
        <Route path="/apps/*" element={<AppStorePage />} />
        <Route path="/downloads/*" element={<AppStorePage />} />
        <Route path="/store/*" element={<AppStorePage />} />

        {/* ChuruOne Master Web OS for iPhone, Mac, Desktop & Tablets */}
        <Route path="/admin/*" element={<MasterApp />} />
        <Route path="/master/*" element={<MasterApp />} />
        <Route path="/dukandar/*" element={<MasterApp />} />
        <Route path="/churuone/*" element={<MasterApp />} />

        {/* Customer Storefront Website */}
        <Route path="/*" element={<CustomerApp />} />
      </Routes>
    </BrowserRouter>
  );
}