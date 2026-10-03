import React, { useState, useMemo } from 'react';
import { useMaster } from '../context/MasterContext';
import { Search, Phone, MessageCircle, ShoppingBag, IndianRupee } from 'lucide-react';

export default function CustomersTab() {
  const { customers, orders } = useMaster();
  const [searchQuery, setSearchQuery] = useState('');

  // Enrich customers with order calculations if not already present
  const enrichedCustomers = useMemo(() => {
    const list = Array.isArray(customers) ? [...customers] : [];
    const allOrders = Array.isArray(orders) ? orders : [];

    return list.map(c => {
      const custOrders = allOrders.filter(o => 
        (o.customer?.phone && o.customer.phone === c.phone) ||
        (o.customerPhone && o.customerPhone === c.phone)
      );

      const totalSpent = custOrders.reduce((sum, o) => sum + (Number(o.total || o.grandTotal) || 0), 0);
      const ordersCount = custOrders.length || c.ordersCount || 0;

      return {
        ...c,
        calculatedOrdersCount: ordersCount,
        calculatedTotalSpent: totalSpent || c.totalSpent || 0
      };
    });
  }, [customers, orders]);

  // Filtered customers
  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) return enrichedCustomers;
    const q = searchQuery.toLowerCase();
    return enrichedCustomers.filter(c => 
      (c.name || '').toLowerCase().includes(q) ||
      (c.phone || '').toLowerCase().includes(q) ||
      (c.address || '').toLowerCase().includes(q)
    );
  }, [enrichedCustomers, searchQuery]);

  return (
    <div className="space-y-5 pb-16">
      
      {/* Search Bar & Summary */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xl space-y-4 border-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-zinc-900">Customer CRM Directory</h2>
            <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
              Verified customer profiles, order frequency and loyalty spend analytics
            </p>
          </div>
          <span className="text-xs font-black px-3.5 py-1.5 rounded-full bg-zinc-100 text-zinc-800 self-start sm:self-auto">
            Total Customers: {customers?.length || 0}
          </span>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-zinc-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by customer name, mobile phone or address..."
            className="w-full bg-[#FFFBF7] rounded-2xl pl-11 pr-4 py-3 text-sm text-zinc-900 placeholder-zinc-400 focus:bg-white focus:ring-2 focus:ring-[#DC2626] focus:outline-none transition-all shadow-xs border-0"
          />
        </div>
      </div>

      {/* Customers List */}
      {filteredCustomers.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center text-zinc-400 text-sm space-y-1 shadow-lg border-0">
          <p className="font-bold text-zinc-700">No customers found</p>
          <p className="text-xs">Customers placing orders via OTP will automatically register here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCustomers.map(cust => (
            <div
              key={cust.id || cust.phone}
              className="bg-white rounded-3xl p-6 flex flex-col justify-between space-y-4 shadow-xl hover:shadow-2xl transition-all border-0"
            >
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-zinc-900 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-sm">
                    {(cust.name || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-black text-zinc-900 truncate">
                      {cust.name || 'Customer'}
                    </h3>
                    <p className="text-xs text-zinc-500 font-mono mt-0.5">
                      {cust.phone}
                    </p>
                  </div>
                </div>

                {cust.address && (
                  <p className="text-xs text-zinc-600 line-clamp-2 bg-[#FFFBF7] p-3 rounded-2xl shadow-xs">
                    {cust.address}
                  </p>
                )}

                {/* Orders & Spend Metrics */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-[#FFFBF7] p-3 rounded-2xl shadow-xs">
                    <div className="text-[10px] text-zinc-400 uppercase font-bold">Orders</div>
                    <div className="text-sm font-black text-zinc-900 mt-0.5 flex items-center gap-1">
                      <ShoppingBag className="w-3.5 h-3.5 text-zinc-500" />
                      <span>{cust.calculatedOrdersCount}</span>
                    </div>
                  </div>
                  <div className="bg-[#FFFBF7] p-3 rounded-2xl shadow-xs">
                    <div className="text-[10px] text-zinc-400 uppercase font-bold">Total Spent</div>
                    <div className="text-sm font-black text-emerald-600 mt-0.5 flex items-center gap-0.5">
                      <IndianRupee className="w-3.5 h-3.5" />
                      <span>{cust.calculatedTotalSpent}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-100">
                <a
                  href={`tel:${cust.phone}`}
                  className="py-2.5 px-3 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Call</span>
                </a>
                <a
                  href={`https://wa.me/${cust.phone?.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2.5 px-3 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>WhatsApp</span>
                </a>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
}
