import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import CustomerApp from './apps/customer/CustomerApp';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* All website routes are served by CustomerApp */}
        <Route path="/*" element={<CustomerApp />} />
      </Routes>
    </BrowserRouter>
  );
}