import React, { useState, useMemo } from 'react';
import { useMaster } from '../context/MasterContext';
import { Phone, MessageCircle, Check, X, ChefHat, Bike, CheckCheck, Printer, Search, MapPin, CreditCard, Banknote } from 'lucide-react';

export default function OrdersTab() {
  const { orders, updateOrderStatus, showToast } = useMaster();

  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState(null);

  // Filtered orders list
  const filteredOrders = useMemo(() => {
    let list = Array.isArray(orders) ? [...orders] : [];

    if (statusFilter !== 'all') {
      list = list.filter(o => o.status === statusFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(o => {
        const num = (o.orderNumber || o.id || '').toLowerCase();
        const name = (o.customer?.name || o.customerName || '').toLowerCase();
        const phone = (o.customer?.phone || o.customerPhone || '').toLowerCase();
        return num.includes(q) || name.includes(q) || phone.includes(q);
      });
    }

    return list;
  }, [orders, statusFilter, searchQuery]);

  const filterTabs = [
    { id: 'all', label: 'All Orders' },
    { id: 'pending', label: 'Pending' },
    { id: 'confirmed', label: 'Confirmed' },
    { id: 'preparing', label: 'Preparing' },
    { id: 'out_for_delivery', label: 'Out for Delivery' },
    { id: 'delivered', label: 'Delivered' },
    { id: 'cancelled', label: 'Cancelled' }
  ];

  return (
    <div className="space-y-5 pb-16">
      
      {/* Search & Filter Bar */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-4 sm:p-5 space-y-3.5">
        
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Order #, customer name or phone..."
            className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#DC2626] transition-colors"
          />
        </div>

        {/* Status Filter Horizontal Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {filterTabs.map(tab => {
            const count = tab.id === 'all' 
              ? (orders?.length || 0) 
              : (orders?.filter(o => o.status === tab.id)?.length || 0);

            const active = statusFilter === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  active 
                    ? 'bg-[#DC2626] text-white shadow-md' 
                    : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                  active ? 'bg-black/30 text-white' : 'bg-zinc-800 text-zinc-400'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-12 text-center text-zinc-500 text-sm space-y-1">
          <p className="font-bold text-zinc-400">No orders found in this filter</p>
          <p className="text-xs">Customers ke naye orders aane par yahan auto-show honge.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredOrders.map(order => {
            const customerName = order.customer?.name || order.customerName || 'Customer';
            const customerPhone = order.customer?.phone || order.customerPhone || '';
            const orderNum = order.orderNumber || order.id?.slice(-5) || 'ORD';
            const items = Array.isArray(order.items) ? order.items : [];
            const isCOD = order.paymentMethod === 'cod';

            return (
              <div 
                key={order.id} 
                className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 flex flex-col justify-between space-y-4 shadow-lg hover:border-zinc-700 transition-colors"
              >
                
                {/* Header: Order #, Time, Status */}
                <div className="flex items-start justify-between gap-3 border-b border-zinc-800/80 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-black text-white">#{orderNum}</span>
                      <span className="text-xs text-zinc-500">
                        {order.createdAt ? new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent'}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-zinc-300 mt-0.5">
                      {customerName}
                    </div>
                  </div>

                  {/* Status Badge */}
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                    {
                      confirmed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                      preparing: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
                      out_for_delivery: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
                      delivered: 'bg-zinc-800 text-zinc-300 border-zinc-700',
                      cancelled: 'bg-red-500/10 text-red-400 border-red-500/20'
                    }[order.status] || 'bg-zinc-800 text-zinc-300 border-zinc-700'
                  }`}>
                    {order.status || 'Pending'}
                  </span>
                </div>

                {/* Items Breakdown */}
                <div className="space-y-1.5 text-xs text-zinc-300 bg-zinc-950/70 p-3 rounded-2xl border border-zinc-800/50">
                  {items.map((it, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <span className="font-medium">
                        <strong className="text-white font-black">{it.qty || 1}x</strong> {it.name}
                        {it.bread?.name && <span className="text-zinc-500 text-[11px]"> ({it.bread.name})</span>}
                      </span>
                      <span className="text-zinc-400 font-bold">
                        ₹{(it.unitPrice || it.price || 0) * (it.qty || 1)}
                      </span>
                    </div>
                  ))}
                  {order.notes && (
                    <div className="pt-1 text-[11px] text-amber-400 font-medium italic border-t border-zinc-800 mt-2">
                      Note: "{order.notes}"
                    </div>
                  )}
                </div>

                {/* Customer Contact & Address */}
                <div className="space-y-1 text-xs text-zinc-400">
                  {order.address && (
                    <div className="flex items-start gap-1.5 text-[11px] text-zinc-400 line-clamp-2">
                      <MapPin className="w-3.5 h-3.5 text-zinc-500 shrink-0 mt-0.5" />
                      <span>{order.address}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1.5 text-xs">
                      {isCOD ? (
                        <span className="inline-flex items-center gap-1 text-amber-400 font-bold">
                          <Banknote className="w-3.5 h-3.5" /> COD (Cash)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-emerald-400 font-bold">
                          <CreditCard className="w-3.5 h-3.5" /> UPI / Paid
                        </span>
                      )}
                    </div>

                    <div className="text-base font-black text-white">
                      ₹{order.total || order.grandTotal || 0}
                    </div>
                  </div>
                </div>

                {/* Customer Quick Call & WhatsApp */}
                {customerPhone && (
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-zinc-800/60">
                    <a
                      href={`tel:${customerPhone}`}
                      className="py-2 px-3 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Call Client</span>
                    </a>
                    <a
                      href={`https://wa.me/${customerPhone.replace(/[^0-9]/g, '')}?text=Namaste%20${encodeURIComponent(customerName)},%20aapka%20Shawarma%20Nights%20order%20%23${orderNum}%20process%20ho%20raha%20hai.`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2 px-3 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                      <span>WhatsApp</span>
                    </a>
                  </div>
                )}

                {/* Status Action Buttons */}
                <div className="pt-2 flex flex-wrap items-center gap-2">
                  
                  {order.status === 'pending' && (
                    <>
                      <button
                        onClick={() => updateOrderStatus(order.id, 'confirmed')}
                        className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                      >
                        <Check className="w-4 h-4 stroke-[2.5]" />
                        <span>Accept Order</span>
                      </button>
                      <button
                        onClick={() => updateOrderStatus(order.id, 'cancelled')}
                        className="py-2.5 px-3 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-red-500/50 text-red-400 text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                        <span>Reject</span>
                      </button>
                    </>
                  )}

                  {order.status === 'confirmed' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'preparing')}
                      className="w-full py-2.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                    >
                      <ChefHat className="w-4 h-4" />
                      <span>Start Preparing (Kitchen)</span>
                    </button>
                  )}

                  {order.status === 'preparing' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'out_for_delivery')}
                      className="w-full py-2.5 px-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                    >
                      <Bike className="w-4 h-4" />
                      <span>Dispatch / Out for Delivery</span>
                    </button>
                  )}

                  {order.status === 'out_for_delivery' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'delivered')}
                      className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                    >
                      <CheckCheck className="w-4 h-4 stroke-[2.5]" />
                      <span>Mark Delivered</span>
                    </button>
                  )}

                  {/* Print / View Receipt Button */}
                  <button
                    onClick={() => setSelectedReceiptOrder(order)}
                    className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 hover:text-white text-zinc-400 transition-colors cursor-pointer"
                    title="Print Receipt"
                  >
                    <Printer className="w-4 h-4" />
                  </button>

                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* RECEIPT / BILL MODAL */}
      {selectedReceiptOrder && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white text-zinc-900 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <div className="text-center space-y-1 border-b border-zinc-200 pb-3">
              <h4 className="text-lg font-black tracking-tight">SHAWARMA NIGHTS</h4>
              <p className="text-[11px] text-zinc-500">Order Slip #{selectedReceiptOrder.orderNumber || selectedReceiptOrder.id?.slice(-4)}</p>
              <p className="text-[10px] text-zinc-400">{new Date(selectedReceiptOrder.createdAt || Date.now()).toLocaleString()}</p>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-zinc-600">
                <span>Customer:</span>
                <span className="font-bold text-zinc-900">{selectedReceiptOrder.customer?.name || selectedReceiptOrder.customerName || 'Walk-in'}</span>
              </div>
              <div className="flex justify-between text-zinc-600">
                <span>Phone:</span>
                <span className="font-bold text-zinc-900">{selectedReceiptOrder.customer?.phone || selectedReceiptOrder.customerPhone || 'N/A'}</span>
              </div>
              {selectedReceiptOrder.address && (
                <div className="text-zinc-600">
                  <span>Address: </span>
                  <span className="text-zinc-900 font-medium">{selectedReceiptOrder.address}</span>
                </div>
              )}
            </div>

            <div className="border-t border-b border-zinc-200 py-2.5 space-y-1.5 text-xs">
              {(selectedReceiptOrder.items || []).map((it, i) => (
                <div key={i} className="flex justify-between">
                  <span>{it.qty}x {it.name}</span>
                  <span className="font-bold">₹{(it.unitPrice || it.price || 0) * (it.qty || 1)}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center text-sm font-black pt-1">
              <span>TOTAL AMOUNT</span>
              <span className="text-[#DC2626]">₹{selectedReceiptOrder.total || selectedReceiptOrder.grandTotal || 0}</span>
            </div>

            <div className="pt-2 flex items-center gap-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 rounded-xl bg-zinc-900 text-white font-bold text-xs"
              >
                Print Slip
              </button>
              <button
                onClick={() => setSelectedReceiptOrder(null)}
                className="py-2.5 px-4 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
