import React, { useState, useMemo } from 'react';
import { useMaster } from '../context/MasterContext';
import { Phone, MessageCircle, Check, X, ChefHat, Bike, CheckCheck, Printer, Search, MapPin, CreditCard, Banknote, Navigation, KeyRound } from 'lucide-react';

export default function OrdersTab() {
  const { orders, updateOrderStatus, verifyDeliveryOtp, showToast } = useMaster();

  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState(null);

  // Delivery OTP Verification Dialog State (Same as Android App showDeliveryOtpDialog)
  const [deliveryOtpModalOrder, setDeliveryOtpModalOrder] = useState(null);
  const [enteredOtp, setEnteredOtp] = useState('');
  const [cashConfirmed, setCashConfirmed] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // Filtered orders list matching Android App filters: ALL, NEW, KITCHEN, DELIVERED
  const filteredOrders = useMemo(() => {
    let list = Array.isArray(orders) ? [...orders] : [];

    if (statusFilter === 'NEW') {
      list = list.filter(o => o.status === 'new' || o.status === 'pending');
    } else if (statusFilter === 'KITCHEN') {
      list = list.filter(o => o.status === 'preparing' || o.status === 'confirmed' || o.status === 'ready');
    } else if (statusFilter === 'DELIVERED') {
      list = list.filter(o => o.status === 'delivered');
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
    { id: 'ALL', label: 'ALL' },
    { id: 'NEW', label: 'NEW' },
    { id: 'KITCHEN', label: 'KITCHEN' },
    { id: 'DELIVERED', label: 'DELIVERED' }
  ];

  // Handle Verify OTP submission
  const handleVerifyOtpSubmit = async (e) => {
    e.preventDefault();
    if (!enteredOtp.trim()) {
      setOtpError('Please enter the 4-digit Delivery OTP');
      return;
    }

    const isCOD = deliveryOtpModalOrder.paymentMethod === 'cod';
    if (isCOD && !cashConfirmed) {
      setOtpError('Please confirm that you have collected the cash');
      return;
    }

    setIsVerifying(true);
    setOtpError('');

    const res = await verifyDeliveryOtp(deliveryOtpModalOrder.id, enteredOtp.trim());
    setIsVerifying(false);

    if (res.success) {
      setDeliveryOtpModalOrder(null);
      setEnteredOtp('');
      setCashConfirmed(false);
      showToast(`Order #${deliveryOtpModalOrder.orderNumber || deliveryOtpModalOrder.id?.slice(-4)} delivered successfully!`, 'success');
    } else {
      setOtpError(res.message || 'Incorrect OTP. Ask customer for the 4-digit code.');
    }
  };

  return (
    <div className="space-y-5 pb-16">
      
      {/* Search & Filter Bar */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-xl space-y-4 border-0">
        
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-zinc-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search orders by #ID, customer name or phone..."
            className="w-full bg-[#FFFBF7] rounded-2xl pl-11 pr-4 py-3 text-sm text-zinc-900 placeholder-zinc-400 focus:bg-white focus:ring-2 focus:ring-[#DC2626] focus:outline-none transition-all shadow-xs border-0"
          />
        </div>

        {/* Filter Chips Row: ALL, NEW, KITCHEN, DELIVERED */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {filterTabs.map(tab => {
            const count = tab.id === 'ALL' 
              ? (orders?.length || 0)
              : tab.id === 'NEW'
                ? (orders?.filter(o => o.status === 'new' || o.status === 'pending')?.length || 0)
                : tab.id === 'KITCHEN'
                  ? (orders?.filter(o => o.status === 'preparing' || o.status === 'confirmed' || o.status === 'ready')?.length || 0)
                  : (orders?.filter(o => o.status === 'delivered')?.length || 0);

            const active = statusFilter === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-4 py-2 rounded-full text-xs font-black whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 border-0 ${
                  active 
                    ? 'bg-[#DC2626] text-white shadow-md' 
                    : 'bg-[#FFFBF7] text-zinc-600 hover:text-zinc-900 shadow-xs'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                  active ? 'bg-white text-[#DC2626]' : 'bg-zinc-200 text-zinc-600'
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
        <div className="bg-white rounded-3xl p-12 text-center text-zinc-400 text-sm space-y-1 shadow-lg border-0">
          <p className="font-bold text-zinc-700">No orders in {statusFilter} queue</p>
          <p className="text-xs">Naye orders aane par yahan real-time alert ke sath show honge.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredOrders.map(order => {
            const customerName = order.customer?.name || order.customerName || 'Customer';
            const customerPhone = order.customer?.phone || order.customerPhone || '';
            const orderNum = order.orderNumber || order.id?.slice(-5) || 'ORD';
            const items = Array.isArray(order.items) ? order.items : [];
            const isCOD = order.paymentMethod === 'cod';
            const status = (order.status || 'new').toLowerCase();
            const total = Number(order.total || order.grandTotal || 0);
            const deliveryOtp = order.deliveryOtp || order.otp || '';

            const statusStyle = {
              new: 'bg-red-50 text-red-700',
              pending: 'bg-red-50 text-red-700',
              confirmed: 'bg-amber-50 text-amber-700',
              preparing: 'bg-amber-50 text-amber-700',
              ready: 'bg-sky-50 text-sky-700',
              out_for_delivery: 'bg-sky-50 text-sky-700',
              delivered: 'bg-emerald-50 text-emerald-700',
              cancelled: 'bg-zinc-100 text-zinc-500'
            }[status] || 'bg-zinc-100 text-zinc-700';

            return (
              <div 
                key={order.id} 
                className="bg-white rounded-3xl p-6 flex flex-col justify-between space-y-4 shadow-xl border-0"
              >
                
                {/* Header: Order ID, Time, Status Pill & OTP badge */}
                <div className="flex items-start justify-between gap-3 border-b border-zinc-100 pb-3.5">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-black text-zinc-900">#{orderNum}</span>
                      <span className="text-xs text-zinc-400 font-medium">
                        {order.createdAt ? new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                      </span>
                    </div>
                    <div className="text-xs font-black text-zinc-800 mt-0.5">
                      {customerName}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap justify-end">
                    {/* Delivery OTP Badge */}
                    {deliveryOtp && (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-50 text-amber-800 border-0 flex items-center gap-1">
                        <KeyRound className="w-3 h-3 text-amber-600" />
                        <span>OTP: {deliveryOtp}</span>
                      </span>
                    )}

                    {/* Status Pill */}
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${statusStyle}`}>
                      {status === 'new' || status === 'pending' ? 'NEW ORDER' : status === 'preparing' ? 'IN KITCHEN' : status === 'out_for_delivery' ? 'OUT FOR DELIVERY' : status}
                    </span>
                  </div>
                </div>

                {/* Appointment Slot / Salon Details */}
                {(order.timeLabel || order.dateLabel || order.dateISO) && (
                  <div className="bg-amber-50 text-amber-900 border border-amber-200/60 p-2.5 rounded-xl text-xs font-bold flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <span>📅 Slot:</span>
                      <span className="text-amber-800 font-black">{order.timeLabel || 'Booked Slot'}</span>
                      <span className="text-amber-600 font-medium">({order.dateLabel || order.dateISO})</span>
                    </span>
                    {order.workMinutes && <span className="text-[10px] text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">{order.workMinutes} mins</span>}
                  </div>
                )}

                {/* Items Breakdown */}
                <div className="space-y-1.5 text-xs text-zinc-700 bg-[#FFFBF7] p-4 rounded-2xl shadow-xs border-0">
                  {items.map((it, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <span className="font-medium">
                        <strong className="text-zinc-900 font-black">{it.qty || 1}x</strong> {it.name}
                        {it.bread?.name && <span className="text-zinc-500 text-[11px]"> ({it.bread.name})</span>}
                      </span>
                      <span className="text-zinc-900 font-bold">
                        ₹{(it.unitPrice || it.price || 0) * (it.qty || 1)}
                      </span>
                    </div>
                  ))}
                  {order.notes && (
                    <div className="pt-2 text-[11px] text-[#DC2626] font-bold border-t border-zinc-200 mt-2">
                      Note: "{order.notes}"
                    </div>
                  )}
                </div>

                {/* Customer Address & 1-Tap Google Maps Button */}
                <div className="space-y-2 text-xs">
                  {order.address && (
                    <div className="flex items-start justify-between gap-2 bg-[#FFFBF7] p-3 rounded-2xl shadow-xs">
                      <div className="flex items-start gap-1.5 text-zinc-600">
                        <MapPin className="w-4 h-4 text-[#DC2626] shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{order.address}</span>
                      </div>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.address)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-xl bg-white shadow-xs hover:shadow-md text-sky-600 flex items-center gap-1 text-[11px] font-black shrink-0 transition-all"
                        title="Open in Google Maps"
                      >
                        <Navigation className="w-3.5 h-3.5" />
                        <span>MAP</span>
                      </a>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold">
                      {isCOD ? (
                        <span className="inline-flex items-center gap-1 text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">
                          <Banknote className="w-3.5 h-3.5" /> CASH ON DELIVERY
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                          <CreditCard className="w-3.5 h-3.5" /> UPI AUTO-VERIFIED
                        </span>
                      )}
                    </div>

                    <div className="text-lg font-black text-zinc-900">
                      ₹{total}
                    </div>
                  </div>
                </div>

                {/* Customer Quick Call & WhatsApp */}
                {customerPhone && (
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-zinc-100">
                    <a
                      href={`tel:${customerPhone}`}
                      className="py-2.5 px-3 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Call Client</span>
                    </a>
                    <a
                      href={`https://wa.me/${customerPhone.replace(/[^0-9]/g, '')}?text=Namaste%20${encodeURIComponent(customerName)},%20aapka%20Shawarma%20Nights%20order%20%23${orderNum}%20process%20ho%20raha%20hai.`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2.5 px-3 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                      <span>WhatsApp</span>
                    </a>
                  </div>
                )}

                {/* PROGRESSIVE WORKFLOW ACTION BUTTON (Exact Android App Logic) */}
                <div className="pt-2 flex flex-wrap items-center gap-2">
                  
                  {/* STEP 1: NEW / PENDING -> ACCEPT & SEND TO KITCHEN */}
                  {(status === 'new' || status === 'pending') && (
                    <>
                      <button
                        onClick={() => updateOrderStatus(order.id, 'preparing')}
                        className="flex-1 py-3 px-4 rounded-full bg-[#DC2626] hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:shadow-xl border-0 active:scale-98 transition-all"
                      >
                        <ChefHat className="w-4 h-4 stroke-[2.2]" />
                        <span>ACCEPT & SEND TO KITCHEN</span>
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`Reject / Cancel Order #${orderNum}?`)) {
                            updateOrderStatus(order.id, 'cancelled');
                          }
                        }}
                        className="py-3 px-4 rounded-full bg-zinc-100 hover:bg-red-50 text-red-600 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer border-0"
                        title="Reject Order"
                      >
                        <X className="w-4 h-4" />
                        <span>REJECT</span>
                      </button>
                    </>
                  )}

                  {/* STEP 2: IN KITCHEN / PREPARING -> DISPATCH OUT FOR DELIVERY */}
                  {(status === 'preparing' || status === 'confirmed') && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'out_for_delivery')}
                      className="w-full py-3 px-4 rounded-full bg-amber-500 hover:bg-amber-600 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:shadow-xl border-0 active:scale-98 transition-all"
                    >
                      <Bike className="w-4 h-4 stroke-[2.2]" />
                      <span>DISPATCH → OUT FOR DELIVERY</span>
                    </button>
                  )}

                  {/* STEP 3: OUT FOR DELIVERY / READY -> VERIFY OTP & DELIVER */}
                  {(status === 'out_for_delivery' || status === 'ready') && (
                    <button
                      onClick={() => {
                        setDeliveryOtpModalOrder(order);
                        setEnteredOtp('');
                        setCashConfirmed(false);
                        setOtpError('');
                      }}
                      className="w-full py-3 px-4 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:shadow-xl border-0 active:scale-98 transition-all"
                    >
                      <CheckCheck className="w-4 h-4 stroke-[2.5]" />
                      <span>VERIFY OTP & DELIVER (DELIVERY CONFIRM)</span>
                    </button>
                  )}

                  {/* STEP 4: DELIVERED -> STATUS COMPLETED */}
                  {status === 'delivered' && (
                    <div className="w-full py-2.5 px-3 rounded-full bg-emerald-50 text-emerald-700 text-xs font-black text-center flex items-center justify-center gap-1.5">
                      <Check className="w-4 h-4 stroke-[2.5]" />
                      <span>ORDER DELIVERED & COMPLETED</span>
                    </div>
                  )}

                  {/* Print / View Receipt Button */}
                  <button
                    onClick={() => setSelectedReceiptOrder(order)}
                    className="p-3 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition-colors cursor-pointer border-0"
                    title="Print Receipt Slip"
                  >
                    <Printer className="w-4 h-4" />
                  </button>

                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* DELIVERY OTP VERIFICATION DIALOG (Exact Android App showDeliveryOtpDialog) */}
      {deliveryOtpModalOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white text-zinc-900 rounded-3xl max-w-sm w-full p-6 sm:p-7 space-y-4 shadow-2xl border-0">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div>
                <h3 className="text-base font-black text-emerald-700">DELIVERY CONFIRMATION OTP</h3>
                <p className="text-xs text-zinc-400 font-bold">Order #{deliveryOtpModalOrder.orderNumber || deliveryOtpModalOrder.id?.slice(-4)}</p>
              </div>
              <button
                onClick={() => setDeliveryOtpModalOrder(null)}
                className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-zinc-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-500 leading-relaxed">
              Order customer ko deliver karne ke baad unse 4-digit Delivery OTP lekar yahan enter karein.
            </p>

            {/* COD CASH COLLECTION CONFIRMATION CHECKBOX */}
            {deliveryOtpModalOrder.paymentMethod === 'cod' && (
              <div className="bg-amber-50 p-4 rounded-2xl space-y-2 border-0">
                <div className="text-xs font-black text-amber-800">
                  CASH ON DELIVERY: ₹{deliveryOtpModalOrder.total || deliveryOtpModalOrder.grandTotal || 0}
                </div>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={cashConfirmed}
                    onChange={(e) => setCashConfirmed(e.target.checked)}
                    className="rounded text-[#DC2626] focus:ring-[#DC2626]"
                  />
                  <span className="text-xs font-bold text-amber-900">
                    Haan, customer se ₹{deliveryOtpModalOrder.total || deliveryOtpModalOrder.grandTotal || 0} Cash le liya hai.
                  </span>
                </label>
              </div>
            )}

            <form onSubmit={handleVerifyOtpSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-black text-zinc-500 uppercase tracking-wider mb-1 text-center">
                  CUSTOMER DELIVERY OTP (4 DIGITS)
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  maxLength={6}
                  value={enteredOtp}
                  onChange={(e) => setEnteredOtp(e.target.value)}
                  placeholder="• • • •"
                  className="w-full bg-[#FFFBF7] rounded-2xl py-3.5 text-center text-2xl font-black text-zinc-900 tracking-widest font-mono focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all shadow-xs border-0"
                />
              </div>

              {otpError && (
                <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs font-bold text-center">
                  {otpError}
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  disabled={isVerifying}
                  className="flex-1 py-3.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider shadow-lg cursor-pointer border-0 disabled:opacity-50"
                >
                  {isVerifying ? 'Verifying...' : 'CONFIRM & DELIVER'}
                </button>
                <button
                  type="button"
                  onClick={() => setDeliveryOtpModalOrder(null)}
                  className="py-3.5 px-5 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-xs cursor-pointer border-0"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECEIPT / BILL MODAL */}
      {selectedReceiptOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white text-zinc-900 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl border-0">
            <div className="text-center space-y-1 border-b border-zinc-100 pb-3">
              <h4 className="text-lg font-black tracking-tight">SHAWARMA NIGHTS</h4>
              <p className="text-xs text-zinc-500 font-bold">Order Slip #{selectedReceiptOrder.orderNumber || selectedReceiptOrder.id?.slice(-4)}</p>
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

            <div className="border-t border-b border-zinc-100 py-3 space-y-1.5 text-xs">
              {(selectedReceiptOrder.items || []).map((it, i) => (
                <div key={i} className="flex justify-between">
                  <span>{it.qty}x {it.name}</span>
                  <span className="font-bold">₹{(it.unitPrice || it.price || 0) * (it.qty || 1)}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center text-base font-black pt-1">
              <span>TOTAL AMOUNT</span>
              <span className="text-[#DC2626]">₹{selectedReceiptOrder.total || selectedReceiptOrder.grandTotal || 0}</span>
            </div>

            <div className="pt-2 flex items-center gap-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-3 rounded-full bg-zinc-900 text-white font-bold text-xs uppercase tracking-wider"
              >
                Print Slip
              </button>
              <button
                onClick={() => setSelectedReceiptOrder(null)}
                className="py-3 px-5 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-xs"
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
