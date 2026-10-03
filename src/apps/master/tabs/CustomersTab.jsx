import React, { useState, useMemo } from 'react';
import { useMaster } from '../context/MasterContext';
import { Search, Phone, MessageCircle, User, ShoppingBag, IndianRupee } from 'lucide-react';

export default function CustomersTab() {
  const { customers, orders } = useMaster();
  const [searchQuery, setSearchQuery] = useState('');

  // Enrich customers with order calculations if not already present
  const enrichedCustomers = useMemo(() => {
    const list = Array.isArray(customers) ? [...customers] : [];
    const allOrders = Array.isArray(orders) ? orders : [];

    return list.map(c => {
      // Find orders for this customer phone
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
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-white">Customer CRM Directory</h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Verified customer profiles, order frequency and loyalty spend analytics
            </p>
          </div>
          <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-zinc-950 border border-zinc-800 text-zinc-300 self-start sm:self-auto">
            Total Customers: {customers?.length || 0}
          </span>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by customer name, mobile phone or address..."
            className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#DC2626] transition-colors"
          />
        </div>
      </div>

      {/* Customers List */}
      {filteredCustomers.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-12 text-center text-zinc-500 text-sm space-y-1">
          <p className="font-bold text-zinc-400">No customers found</p>
          <p className="text-xs">Customers placing orders via OTP will automatically register here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCustomers.map(cust => (
            <div
              key={cust.id || cust.phone}
              className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 flex flex-col justify-between space-y-4 hover:border-zinc-700 transition-colors"
            >
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-zinc-950 border border-zinc-800 text-white font-black text-sm flex items-center justify-center shrink-0">
                    {(cust.name || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-white truncate">
                      {cust.name || 'Unnamed Customer'}
                    </h3>
                    <p className="text-xs text-zinc-400 font-mono">
                      {cust.phone}
                    </p>
                  </div>
                </div>

                {cust.address && (
                  <p className="text-xs text-zinc-400 line-clamp-2 bg-zinc-950/50 p-2.5 rounded-xl border border-zinc-800/40">
                    {cust.address}
                  </p>
                )}

                {/* Orders & Spend Metrics */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800/50">
                    <div className="text-[10px] text-zinc-500 uppercase font-bold">Orders</div>
                    <div className="text-sm font-black text-white mt-0.5 flex items-center gap-1">
                      <ShoppingBag className="w-3.5 h-3.5 text-zinc-400" />
                      <span>{cust.calculatedOrdersCount}</span>
                    </div>
                  </div>
                  <div className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800/50">
                    <div className="text-[10px] text-zinc-500 uppercase font-bold">Total Spent</div>
                    <div className="text-sm font-black text-emerald-400 mt-0.5 flex items-center gap-0.5">
                      <IndianRupee className="w-3.5 h-3.5" />
                      <span>{cust.calculatedTotalSpent}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-800/80">
                <a
                  href={`tel:${cust.phone}`}
                  className="py-2 px-3 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Call</span>
                </a>
                <a
                  href={`https://wa.me/${cust.phone?.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2 px-3 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
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
