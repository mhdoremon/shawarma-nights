import React, { useState, useMemo } from 'react';
import { useMaster } from '../context/MasterContext';
import { Search, Phone, MessageCircle, ShoppingBag, IndianRupee, Mail, X, Clock, MapPin, CheckCircle, ChevronRight, Package, ArrowLeft } from 'lucide-react';

export default function CustomersTab() {
  const { customers, orders } = useMaster();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // Helper to normalize phone numbers for accurate cross-matching
  const normalizePhone = (p) => (p || '').replace(/\D/g, '').slice(-10);

  // Enrich customers with order calculations and their specific order list
  const enrichedCustomers = useMemo(() => {
    const list = Array.isArray(customers) ? [...customers] : [];
    const allOrders = Array.isArray(orders) ? orders : [];

    return list.map(c => {
      const cCleanPhone = normalizePhone(c.phone);
      const cEmail = (c.email || '').trim().toLowerCase();

      const custOrders = allOrders.filter(o => {
        const oPhone = normalizePhone(o.customer?.phone || o.customerPhone || o.phone);
        const oEmail = (o.customer?.email || o.userEmail || o.email || '').trim().toLowerCase();

        const matchPhone = Boolean(cCleanPhone && oPhone && cCleanPhone === oPhone);
        const matchEmail = Boolean(cEmail && oEmail && cEmail === oEmail);
        return matchPhone || matchEmail;
      }).sort((a, b) => new Date(b.createdAt || b.placedAt || 0) - new Date(a.createdAt || a.placedAt || 0));

      const totalSpent = custOrders.reduce((sum, o) => sum + (Number(o.total || o.grandTotal) || 0), 0);
      const ordersCount = custOrders.length || c.ordersCount || 0;

      return {
        ...c,
        orders: custOrders,
        calculatedOrdersCount: ordersCount,
        calculatedTotalSpent: totalSpent || c.totalSpent || 0
      };
    });
  }, [customers, orders]);

  // Keep selectedCustomer updated if orders or customers change
  const activeSelectedCustomer = useMemo(() => {
    if (!selectedCustomer) return null;
    return enrichedCustomers.find(c => 
      (c.id && c.id === selectedCustomer.id) || 
      (c.phone && c.phone === selectedCustomer.phone) ||
      (c.email && c.email === selectedCustomer.email)
    ) || selectedCustomer;
  }, [selectedCustomer, enrichedCustomers]);

  // Filtered customers
  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) return enrichedCustomers;
    const q = searchQuery.toLowerCase();
    return enrichedCustomers.filter(c => 
      (c.name || '').toLowerCase().includes(q) ||
      (c.phone || '').toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      (c.address || '').toLowerCase().includes(q)
    );
  }, [enrichedCustomers, searchQuery]);

  const getStatusBadge = (status) => {
    const s = (status || '').toUpperCase();
    if (s.includes('DELIVERED')) return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    if (s.includes('OUT') || s.includes('DISPATCH')) return 'bg-purple-100 text-purple-800 border-purple-200';
    if (s.includes('KITCHEN') || s.includes('PREPAR')) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (s.includes('CONFIRM')) return 'bg-indigo-100 text-indigo-800 border-indigo-200';
    if (s.includes('CANCEL')) return 'bg-red-100 text-red-800 border-red-200';
    return 'bg-amber-100 text-amber-800 border-amber-200';
  };

  return (
    <div className="space-y-5 pb-16">
      
      {/* Search Bar & Summary */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xl space-y-4 border-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-zinc-900">Customer CRM Directory</h2>
            <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
              Verified customer profiles, order frequency and loyalty spend analytics. Tap any customer to view purchase history.
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
              key={cust.id || cust.phone || cust.email}
              onClick={() => setSelectedCustomer(cust)}
              className="bg-white rounded-3xl p-6 flex flex-col justify-between space-y-4 shadow-xl hover:shadow-2xl transition-all border border-transparent hover:border-red-200 cursor-pointer group"
            >
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  {cust.picture || cust.photoURL ? (
                    <img
                      src={cust.picture || cust.photoURL}
                      alt=""
                      className="w-11 h-11 rounded-2xl object-cover shrink-0 shadow-sm border border-zinc-100"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-2xl bg-zinc-900 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-sm group-hover:bg-[#DC2626] transition-colors">
                      {(cust.name || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-sm font-black text-zinc-900 truncate group-hover:text-[#DC2626] transition-colors">
                        {cust.name || 'Customer'}
                      </h3>
                      {cust.authProvider === 'google' ? (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-sm bg-blue-50 text-blue-600 font-bold uppercase tracking-wider shrink-0">
                          Google
                        </span>
                      ) : (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-sm bg-emerald-50 text-emerald-700 font-bold uppercase tracking-wider shrink-0">
                          Phone OTP
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <p className="text-xs text-zinc-500 font-mono truncate">
                        {cust.phone || cust.email || 'Direct Client'}
                      </p>
                      {cust.phone && (
                        <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded-full ${cust.phoneVerified ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800'}`}>
                          {cust.phoneVerified ? '✓ Verified' : 'Unverified Phone'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {cust.address && (
                  <p className="text-xs text-zinc-600 line-clamp-2 bg-[#FFFBF7] p-3 rounded-2xl shadow-xs">
                    {cust.address}
                  </p>
                )}

                {/* Orders & Spend Metrics */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-[#FFFBF7] p-3 rounded-2xl shadow-xs group-hover:bg-red-50/40 transition-colors">
                    <div className="text-[10px] text-zinc-400 uppercase font-bold">Orders</div>
                    <div className="text-sm font-black text-zinc-900 mt-0.5 flex items-center gap-1">
                      <ShoppingBag className="w-3.5 h-3.5 text-zinc-500" />
                      <span>{cust.calculatedOrdersCount}</span>
                    </div>
                  </div>
                  <div className="bg-[#FFFBF7] p-3 rounded-2xl shadow-xs group-hover:bg-red-50/40 transition-colors">
                    <div className="text-[10px] text-zinc-400 uppercase font-bold">Total Spent</div>
                    <div className="text-sm font-black text-emerald-600 mt-0.5 flex items-center gap-0.5">
                      <IndianRupee className="w-3.5 h-3.5" />
                      <span>{cust.calculatedTotalSpent}</span>
                    </div>
                  </div>
                </div>

                {/* View Purchase History Indicator */}
                <div className="w-full py-2 px-3 rounded-xl bg-zinc-50 group-hover:bg-red-50 text-zinc-600 group-hover:text-[#DC2626] font-bold text-xs flex items-center justify-between transition-colors">
                  <span className="flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5" />
                    <span>View Purchase History ({cust.calculatedOrdersCount})</span>
                  </span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>

              {/* Action Buttons */}
              <div 
                className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-100"
                onClick={(e) => e.stopPropagation()}
              >
                {cust.phone ? (
                  <>
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
                  </>
                ) : (
                  <>
                    <a
                      href={`mailto:${cust.email}`}
                      className="py-2.5 px-3 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors col-span-2"
                    >
                      <Mail className="w-3.5 h-3.5 text-blue-600" />
                      <span>Email ({cust.email})</span>
                    </a>
                  </>
                )}
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Customer Purchase Orders Slide-over Drawer / Modal (Dukandar 5) */}
      {activeSelectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
          <div 
            className="fixed inset-0"
            onClick={() => setSelectedCustomer(null)}
          />
          <div className="relative w-full max-w-2xl bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[88vh] overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="p-5 sm:p-6 bg-gradient-to-r from-zinc-900 to-zinc-800 text-white shrink-0">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  {activeSelectedCustomer.picture || activeSelectedCustomer.photoURL ? (
                    <img
                      src={activeSelectedCustomer.picture || activeSelectedCustomer.photoURL}
                      alt=""
                      className="w-14 h-14 rounded-2xl object-cover shrink-0 border-2 border-white/20 shadow-md"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-[#DC2626] text-white font-black text-xl flex items-center justify-center shrink-0 shadow-md">
                      {(activeSelectedCustomer.name || 'C').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-black tracking-tight">{activeSelectedCustomer.name || 'Customer'}</h3>
                    <p className="text-xs text-zinc-300 font-mono">{activeSelectedCustomer.phone || activeSelectedCustomer.email || 'Direct Buyer'}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-zinc-200">
                        {activeSelectedCustomer.orders?.length || activeSelectedCustomer.calculatedOrdersCount || 0} Orders
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                        ₹{activeSelectedCustomer.calculatedTotalSpent || 0} Lifetime Spend
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {activeSelectedCustomer.address && (
                <div className="mt-4 pt-3 border-t border-white/10 flex items-start gap-2 text-xs text-zinc-300">
                  <MapPin className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <span className="line-clamp-2">{activeSelectedCustomer.address}</span>
                </div>
              )}
            </div>

            {/* Sub-header / Quick Stats */}
            <div className="px-6 py-3 bg-[#FFFBF7] border-b border-zinc-100 flex items-center justify-between text-xs font-bold text-zinc-600 shrink-0">
              <span className="flex items-center gap-1.5 text-zinc-800 font-black">
                <ShoppingBag className="w-4 h-4 text-[#DC2626]" />
                Store Purchase History
              </span>
              <span className="text-[11px] text-zinc-500">
                Sorted by most recent
              </span>
            </div>

            {/* Orders Stream Body */}
            <div className="flex-1 overflow-y-auto overscroll-contain p-5 sm:p-6 space-y-4">
              {(!activeSelectedCustomer.orders || activeSelectedCustomer.orders.length === 0) ? (
                <div className="py-16 text-center text-zinc-400 space-y-2">
                  <Package className="w-12 h-12 mx-auto text-zinc-300" />
                  <p className="font-bold text-zinc-600 text-sm">Koi purchase order nahi mila</p>
                  <p className="text-xs text-zinc-400 max-w-xs mx-auto">
                    Is customer ke dvara is store par kiye gaye sabhi orders yahan detail me dikhenge.
                  </p>
                </div>
              ) : (
                activeSelectedCustomer.orders.map((order, idx) => {
                  const items = Array.isArray(order.items) ? order.items : [];
                  const total = order.total || order.grandTotal || 0;
                  const orderDate = order.createdAt || order.placedAt || 'Recent Order';
                  const isPaid = (order.paymentStatus || '').toLowerCase() === 'paid';

                  return (
                    <div 
                      key={order.orderId || order.id || idx}
                      className="bg-zinc-50 hover:bg-white rounded-2xl p-4 sm:p-5 border border-zinc-200/80 shadow-xs hover:shadow-md transition-all space-y-3"
                    >
                      {/* Order top bar */}
                      <div className="flex items-center justify-between flex-wrap gap-2 pb-2.5 border-b border-zinc-200">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-xs bg-zinc-900 text-white px-2.5 py-1 rounded-lg">
                            {order.orderId || order.id || `ORD-${idx + 1}`}
                          </span>
                          <span className="text-xs text-zinc-500 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {typeof orderDate === 'string' ? orderDate : new Date(orderDate).toLocaleString()}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${getStatusBadge(order.status)}`}>
                            {order.status || 'NEW'}
                          </span>
                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                            {order.paymentMethod || 'COD'} • {isPaid ? 'PAID' : 'PENDING'}
                          </span>
                        </div>
                      </div>

                      {/* Items list */}
                      <div className="space-y-1.5">
                        {items.length === 0 ? (
                          <p className="text-xs text-zinc-500 italic">Order items details recorded in database</p>
                        ) : (
                          items.map((item, itemIdx) => (
                            <div key={itemIdx} className="flex items-center justify-between text-xs py-1 border-b border-dashed border-zinc-200 last:border-0">
                              <span className="text-zinc-800 font-bold">
                                {item.qty || item.quantity || 1}x {item.name || item.title || 'Item'}
                              </span>
                              <span className="font-mono font-bold text-zinc-700">
                                ₹{item.price ? (item.price * (item.qty || item.quantity || 1)) : (item.unitPrice ? (item.unitPrice * (item.qty || 1)) : '-')}
                              </span>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Order footer */}
                      <div className="pt-2 flex items-center justify-between text-xs">
                        <div className="text-[11px] text-zinc-500">
                          {order.deliveryAddress || order.address ? (
                            <span className="truncate max-w-[220px] sm:max-w-xs block">
                              📍 {order.deliveryAddress || order.address}
                            </span>
                          ) : (
                            <span>Delivery Order</span>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-zinc-400 block uppercase font-bold">Grand Total</span>
                          <span className="text-base font-black text-zinc-900 font-mono">₹{total}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-zinc-50 border-t border-zinc-200 flex items-center justify-between shrink-0">
              <span className="text-xs text-zinc-500 font-medium">
                Customer ID: <code className="font-mono text-zinc-700">{activeSelectedCustomer.id || activeSelectedCustomer.phone || 'GUEST'}</code>
              </span>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="px-5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs shadow-xs transition-colors"
              >
                Close History
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
