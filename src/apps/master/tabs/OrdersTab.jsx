import React, { useState, useMemo } from 'react';
import { useMaster } from '../context/MasterContext';
import { Phone, MessageCircle, Check, X, ChefHat, Bike, CheckCheck, Printer, Search, MapPin, CreditCard, Banknote, Navigation, KeyRound, Scissors, Calendar, Clock, ChevronDown, ChevronUp, Sparkles, User, ExternalLink } from 'lucide-react';

const WORK_START = 11 * 60; // 11:00 AM (660 mins)
const WORK_END = 23 * 60; // 11:00 PM (1380 mins)
const ROW_STEP = 30; // 30 min intervals
const DOW = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

function formatTimeLabel(h, m) {
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

function parseTimeToMinutes(timeStr) {
  if (!timeStr) return null;
  const match = String(timeStr).match(/(\d+):(\d+)\s*(AM|PM)?/i);
  if (!match) return null;
  let h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const ampm = match[3] ? match[3].toUpperCase() : null;
  if (ampm === "PM" && h < 12) h += 12;
  if (ampm === "AM" && h === 12) h = 0;
  return h * 60 + m;
}

function printStandaloneTicket(b, storeInfo) {
  const win = window.open("", "_blank");
  if (!win) return;
  const advanceFee = b.bookingFee || 50;
  const remDue = b.remainingDue !== undefined ? b.remainingDue : Math.max(0, (b.totalPrice || b.total || 0) - advanceFee);
  win.document.write(`
    <html>
      <head>
        <title>Token Ticket - ${b.token || b.orderNumber || b.id}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, monospace; padding: 20px; max-width: 320px; margin: auto; }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .divider { border-top: 1px dashed #000; margin: 10px 0; }
          .row { display: flex; justify-content: space-between; margin: 4px 0; font-size: 13px; }
        </style>
      </head>
      <body>
        <div class="center">
          <h2 style="margin:4px 0;">${storeInfo?.name || "NASH STUDIO"}</h2>
          <p style="margin:2px 0; font-size:12px; color:#555;">${storeInfo?.address || "Barbershop & Grooming Lounge"}</p>
          <div class="divider"></div>
          <h1 style="margin:8px 0; font-size:24px;">TOKEN: ${b.token || b.orderNumber || b.id?.slice(-4)}</h1>
          <p style="margin:2px 0; font-size:12px;">DATE: ${b.dateISO || new Date().toISOString().split('T')[0]}</p>
          <p style="margin:2px 0; font-size:12px;">TIME: ${b.timeLabel || "Appointment Slot"}</p>
        </div>
        <div class="divider"></div>
        <div class="row"><span>Customer:</span><span class="bold">${b.name || "Client"}</span></div>
        <div class="row"><span>Phone:</span><span>${b.phone || ""}</span></div>
        <div class="row"><span>Service:</span><span class="bold">${b.styleName || "Grooming"}</span></div>
        <div class="row"><span>Tier:</span><span>${b.tier === "premium" ? "✦ Premium (60m)" : "Standard (30m)"}</span></div>
        <div class="divider"></div>
        <div class="row"><span>Total Bill:</span><span class="bold">₹${b.totalPrice || 0}</span></div>
        <div class="row"><span>Advance Paid:</span><span class="bold" style="color:green;">₹${advanceFee}</span></div>
        <div class="row"><span>Remaining Due:</span><span class="bold" style="font-size:15px; color:#c2410c;">₹${remDue}</span></div>
        <div class="divider"></div>
        <div class="center" style="font-size:11px; color:#666; margin-top:10px;"><p>Thank you for visiting! Please arrive 5 mins early.</p></div>
      </body>
    </html>
  `);
  win.document.close();
  win.print();
}

export default function OrdersTab() {
  const { orders, updateOrderStatus, verifyDeliveryOtp, showToast, storeInfo, storeId } = useMaster();
  const isSalon = storeInfo?.vertical === 'salon' || (storeId || '').includes('nash');

  const [viewMode, setViewMode] = useState(isSalon ? 'timeline' : 'list'); // 'list' | 'timeline'
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  });
  const [expandedRowId, setExpandedRowId] = useState(null);

  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState(null);

  // 10-day date tabs generator starting from today
  const dateTabs = useMemo(() => {
    const tabs = [];
    const base = new Date();
    for (let i = 0; i < 10; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      tabs.push(`${y}-${m}-${day}`);
    }
    return tabs;
  }, []);

  // Delivery OTP Verification Dialog State (Same as Android App showDeliveryOtpDialog)
  const [deliveryOtpModalOrder, setDeliveryOtpModalOrder] = useState(null);
  const [enteredOtp, setEnteredOtp] = useState('');
  const [cashConfirmed, setCashConfirmed] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // Normalized bookings for the visual timeline grid
  const dayBookings = useMemo(() => {
    return (orders || []).map(o => {
      const custName = o.customer?.name || o.customerName || o.name || 'Customer';
      const custPhone = o.customer?.phone || o.customerPhone || o.phone || '';
      const styleName = o.styleName || (o.items && o.items[0]?.name) || 'Salon Service';
      const tier = o.tier || (styleName.toLowerCase().includes('premium') ? 'premium' : 'standard');
      const totalMinutes = Number(o.totalMinutes || o.workMinutes || (tier === 'premium' ? 60 : 30));

      let dateISO = o.dateISO || o.date;
      if (!dateISO && o.createdAt) {
        dateISO = new Date(o.createdAt).toISOString().split('T')[0];
      }
      if (!dateISO) {
        dateISO = new Date().toISOString().split('T')[0];
      }

      let startMin = o.startMin;
      if (startMin === undefined || startMin === null) {
        startMin = parseTimeToMinutes(o.timeLabel || o.time);
      }
      if (startMin === null && o.createdAt) {
        const cd = new Date(o.createdAt);
        startMin = cd.getHours() * 60 + (cd.getMinutes() >= 30 ? 30 : 0);
      }
      if (startMin === null) {
        startMin = 11 * 60;
      }

      const totalPrice = Number(o.totalPrice || o.total || o.grandTotal || 0);
      const bookingFee = Number(o.bookingFee || 50);
      const remainingDue = o.remainingDue !== undefined ? Number(o.remainingDue) : Math.max(0, totalPrice - bookingFee);
      const token = o.token || o.orderNumber || (o.id ? 'NS-' + o.id.slice(-4).toUpperCase() : 'NS-001');

      return {
        ...o,
        id: o.id || token,
        token,
        name: custName,
        phone: custPhone,
        styleName,
        tier,
        totalMinutes,
        dateISO,
        startMin,
        totalPrice,
        bookingFee,
        remainingDue
      };
    }).filter(b => b.dateISO === selectedDate);
  }, [orders, selectedDate]);

  // Timeline rows: 11:00 AM to 11:00 PM in 30-minute rows
  const timelineRows = useMemo(() => {
    const rows = [];
    for (let t = WORK_START; t < WORK_END; t += ROW_STEP) {
      const label = formatTimeLabel(Math.floor(t / 60), t % 60);
      let occupying = null;
      let isStart = false;

      for (const b of dayBookings) {
        const bS = b.startMin;
        const bE = b.startMin + (b.totalMinutes || 30);
        if (bS <= t && bE > t) {
          occupying = b;
          isStart = bS >= t - ROW_STEP + 1 && bS <= t;
          break;
        }
      }

      rows.push({ t, label, booking: occupying, isStart });
    }
    return rows;
  }, [dayBookings]);

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

  const filterTabs = isSalon ? [
    { id: 'ALL', label: 'ALL SLOTS' },
    { id: 'NEW', label: 'NEW BOOKINGS' },
    { id: 'KITCHEN', label: 'IN CHAIR' },
    { id: 'DELIVERED', label: 'COMPLETED' }
  ] : [
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
        
        {/* VIEW MODE TOGGLE BUTTONS */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 pb-3.5">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer border-0 flex items-center gap-1.5 ${
                viewMode === 'list'
                  ? 'bg-zinc-900 text-white shadow-md'
                  : 'bg-zinc-100 text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <span>📋 ORDER CARDS LIST</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('timeline')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer border-0 flex items-center gap-1.5 ${
                viewMode === 'timeline'
                  ? 'bg-[#DC2626] text-white shadow-md'
                  : 'bg-zinc-100 text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>📅 30-MIN TIMELINE MATRIX (SALON SCHEDULE)</span>
            </button>
          </div>
          {isSalon && (
            <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-3 py-1 rounded-full border border-amber-200/60 flex items-center gap-1.5">
              <Scissors className="w-3.5 h-3.5" />
              <span>Nash Studio Chair Schedule Matrix</span>
            </span>
          )}
        </div>

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

      {/* VIEW MODE 1: TIMELINE MATRIX (30-MIN BARBER CHAIR GRID) */}
      {viewMode === 'timeline' && (
        <div className="space-y-4">
          
          {/* 10-DAY DATE PICKER CHIPS */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-xl space-y-3 border-0">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-zinc-500 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#DC2626]" />
                <span>SELECT DATE (10-DAY APPOINTMENT SCHEDULE):</span>
              </h3>
              <span className="text-xs font-mono text-zinc-500 font-bold">
                Selected: <strong className="text-zinc-900">{selectedDate}</strong>
              </span>
            </div>

            <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none">
              {dateTabs.map(iso => {
                const d = new Date(iso + 'T00:00:00');
                const isSun = d.getDay() === 0;
                const isSel = iso === selectedDate;
                const cnt = dayBookings.length > 0 && iso === selectedDate
                  ? dayBookings.length
                  : (orders || []).filter(o => (o.dateISO === iso || o.date === iso || (o.createdAt && o.createdAt.startsWith(iso)))).length;

                return (
                  <button
                    key={iso}
                    type="button"
                    disabled={isSun}
                    onClick={() => !isSun && setSelectedDate(iso)}
                    className={`flex flex-col items-center justify-center min-w-[70px] px-3 py-2.5 rounded-2xl transition-all cursor-pointer border-0 shrink-0 ${
                      isSel
                        ? 'bg-[#DC2626] text-white shadow-lg scale-105'
                        : isSun
                          ? 'bg-zinc-100/60 text-zinc-400 opacity-60 cursor-not-allowed'
                          : 'bg-[#FFFBF7] text-zinc-700 hover:bg-zinc-100 shadow-xs'
                    }`}
                  >
                    <span className="text-[10px] font-black uppercase tracking-wider">
                      {DOW[d.getDay()]}
                    </span>
                    <span className="text-lg font-black leading-tight mt-0.5">
                      {d.getDate()}
                    </span>
                    {isSun ? (
                      <span className="text-[9px] font-bold text-red-500 mt-1 uppercase">Closed</span>
                    ) : cnt > 0 ? (
                      <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-full mt-1 ${isSel ? 'bg-white text-[#DC2626]' : 'bg-red-100 text-red-700'}`}>
                        {cnt} Booked
                      </span>
                    ) : (
                      <span className="text-[9px] text-zinc-400 mt-1">Open</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* DAY SUMMARY BANNER */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-0">
            <div>
              <h2 className="text-lg font-black text-zinc-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#DC2626]" />
                <span>
                  {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Operating Hours: 11:00 AM – 11:00 PM (30-Minute Barber Chair Slots)
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1.5 rounded-xl bg-zinc-100 text-zinc-800 text-xs font-black">
                Total Booked: {dayBookings.length}
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-zinc-900 text-white text-xs font-black flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                ✦ Premium: {dayBookings.filter(b => b.tier === 'premium').length}
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-black">
                Standard: {dayBookings.filter(b => b.tier !== 'premium').length}
              </span>
            </div>
          </div>

          {/* TIMELINE MATRIX ROWS */}
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden border-0">
            <div className="grid grid-cols-12 bg-zinc-50 text-[11px] font-black uppercase tracking-wider text-zinc-500 p-4 border-b border-zinc-100">
              <div className="col-span-3 sm:col-span-2 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-zinc-400" />
                <span>Time (वक्त)</span>
              </div>
              <div className="col-span-3 sm:col-span-2">Status</div>
              <div className="col-span-6 sm:col-span-8">Client / Chair Booking Details</div>
            </div>

            <div className="divide-y divide-zinc-100">
              {timelineRows.map(row => {
                const isBooked = Boolean(row.booking);
                const b = row.booking;
                const isPrem = b && b.tier === 'premium';
                const tok = b ? b.token : null;
                const rowId = b ? (b.id || b.token) : null;
                const isExp = rowId && expandedRowId === rowId;
                const isHour = row.t % 60 === 0;

                return (
                  <div
                    key={row.t}
                    onClick={() => {
                      if (b && row.isStart) {
                        setExpandedRowId(isExp ? null : rowId);
                      }
                    }}
                    className={`grid grid-cols-12 p-3.5 sm:p-4 transition-colors ${
                      isHour ? 'bg-zinc-50/60' : 'bg-white'
                    } ${
                      isBooked
                        ? isPrem
                          ? 'hover:bg-amber-50/50 cursor-pointer'
                          : 'hover:bg-red-50/40 cursor-pointer'
                        : 'hover:bg-zinc-50/40'
                    }`}
                  >
                    {/* Time Col */}
                    <div className="col-span-3 sm:col-span-2 flex items-center gap-2">
                      <span className={`text-xs font-black ${isHour ? 'text-zinc-900 font-black' : 'text-zinc-500'}`}>
                        {row.label}
                      </span>
                      {isHour && <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626]" />}
                    </div>

                    {/* Status Col */}
                    <div className="col-span-3 sm:col-span-2 flex items-center">
                      {isBooked ? (
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                          isPrem ? 'bg-zinc-900 text-amber-300' : 'bg-red-100 text-[#DC2626]'
                        }`}>
                          {isPrem ? '✦ PREMIUM' : 'STANDARD'}
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700">
                          AVAILABLE
                        </span>
                      )}
                    </div>

                    {/* Details Col */}
                    <div className="col-span-6 sm:col-span-8">
                      {isBooked && row.isStart ? (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-black text-zinc-900">{b.name}</span>
                              <span className="px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-700 font-mono text-[10px] font-bold">
                                #{tok}
                              </span>
                              <span className="text-xs text-zinc-400 font-medium">
                                ({b.totalMinutes} min)
                              </span>
                            </div>
                            <span className="text-[11px] font-bold text-zinc-400 flex items-center gap-1">
                              {isExp ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                              <span>{isExp ? 'Hide Details' : 'View Details'}</span>
                            </span>
                          </div>

                          {/* Expanded Details Card */}
                          {isExp && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="mt-3 p-4 rounded-2xl bg-zinc-50 border border-zinc-200/80 space-y-3"
                            >
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                <div className="flex items-center gap-2">
                                  <Phone className="w-3.5 h-3.5 text-zinc-400" />
                                  <span className="text-zinc-500">Phone:</span>
                                  <a href={`tel:${b.phone}`} className="font-bold text-zinc-900 hover:text-[#DC2626]">
                                    {b.phone || 'N/A'}
                                  </a>
                                </div>

                                <div className="flex items-center gap-2">
                                  <Scissors className="w-3.5 h-3.5 text-zinc-400" />
                                  <span className="text-zinc-500">Service:</span>
                                  <span className="font-bold text-zinc-900">{b.styleName}</span>
                                </div>

                                <div className="flex items-center gap-2">
                                  <CreditCard className="w-3.5 h-3.5 text-zinc-400" />
                                  <span className="text-zinc-500">Total Bill:</span>
                                  <span className="font-bold text-zinc-900">₹{b.totalPrice}</span>
                                </div>

                                <div className="flex items-center gap-2">
                                  <span className="w-3.5 h-3.5 text-center text-emerald-600 font-bold">✓</span>
                                  <span className="text-zinc-500">Advance Paid:</span>
                                  <span className="font-bold text-emerald-600">₹{b.bookingFee}</span>
                                </div>

                                <div className="sm:col-span-2 flex items-center gap-2 pt-1 border-t border-zinc-200/60">
                                  <span className="text-zinc-500">Remaining Due at Salon:</span>
                                  <span className="text-sm font-black text-amber-700 bg-amber-100/60 px-2 py-0.5 rounded-lg">
                                    ₹{b.remainingDue}
                                  </span>
                                </div>
                              </div>

                              {/* Quick Action Buttons */}
                              <div className="flex items-center gap-2 pt-1 flex-wrap">
                                {b.phone && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const cleanPhone = (b.phone || '').replace(/[^0-9]/g, '');
                                      const text = `Hi ${b.name}, your slot at ${storeInfo?.name || 'Nash Studio'} is confirmed for ${row.label} (Token #${tok})! Advance ₹${b.bookingFee} received. Remaining at salon: ₹${b.remainingDue}.`;
                                      window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`, '_blank');
                                    }}
                                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center gap-1.5 cursor-pointer border-0 shadow-xs"
                                  >
                                    <MessageCircle className="w-3.5 h-3.5" />
                                    <span>WhatsApp</span>
                                  </button>
                                )}

                                {b.phone && (
                                  <a
                                    href={`tel:${b.phone}`}
                                    className="px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-black text-xs flex items-center gap-1.5 text-decoration-none shadow-xs"
                                  >
                                    <Phone className="w-3.5 h-3.5" />
                                    <span>Call Client</span>
                                  </a>
                                )}

                                <button
                                  type="button"
                                  onClick={() => printStandaloneTicket(b, storeInfo)}
                                  className="px-3.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-900 text-white font-black text-xs flex items-center gap-1.5 cursor-pointer border-0 shadow-xs"
                                >
                                  <Printer className="w-3.5 h-3.5" />
                                  <span>Print Ticket</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={async () => {
                                    await updateOrderStatus(b.id, 'delivered');
                                    showToast(`Appointment #${tok} marked as completed!`, 'success');
                                  }}
                                  className="px-3.5 py-1.5 rounded-xl bg-zinc-200 hover:bg-emerald-100 hover:text-emerald-800 text-zinc-700 font-black text-xs flex items-center gap-1.5 cursor-pointer border-0 transition-colors"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Mark Done</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : isBooked && !row.isStart ? (
                        <span className="text-xs text-zinc-400 italic">
                          {b.name} ka session jari hai...
                        </span>
                      ) : (
                        <span className="text-xs text-emerald-600 font-medium">
                          Chair Available (कुर्सी खाली है)
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODE 2: ORDERS CARDS LIST */}
      {viewMode === 'list' && (
        <>
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
                      href={`https://wa.me/${customerPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                        isSalon
                          ? `Namaste ${customerName}, aapka Nash Studio salon appointment #${orderNum} confirm ho gaya hai. Time: ${order.timeLabel || order.slot || 'Scheduled'}.`
                          : `Namaste ${customerName}, aapka Shawarma Nights order #${orderNum} process ho raha hai.`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2.5 px-3 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                      <span>WhatsApp</span>
                    </a>
                  </div>
                )}

                {/* PROGRESSIVE WORKFLOW ACTION BUTTON */}
                <div className="pt-2 flex flex-wrap items-center gap-2">
                  
                  {/* SALON SPECIFIC WORKFLOW */}
                  {isSalon ? (
                    <>
                      {/* STEP 1: NEW / PENDING -> CONFIRM APPOINTMENT */}
                      {(status === 'new' || status === 'pending') && (
                        <>
                          <button
                            onClick={() => updateOrderStatus(order.id, 'confirmed')}
                            className="flex-1 py-3 px-4 rounded-full bg-[#d4af37] hover:bg-[#b8972e] text-black font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:shadow-xl border-0 active:scale-98 transition-all"
                          >
                            <Calendar className="w-4 h-4 stroke-[2.2]" />
                            <span>CONFIRM APPOINTMENT</span>
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`Cancel Appointment #${orderNum}?`)) {
                                updateOrderStatus(order.id, 'cancelled');
                              }
                            }}
                            className="py-3 px-4 rounded-full bg-zinc-100 hover:bg-red-50 text-red-600 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer border-0"
                            title="Cancel Appointment"
                          >
                            <X className="w-4 h-4" />
                            <span>CANCEL</span>
                          </button>
                        </>
                      )}

                      {/* STEP 2: CONFIRMED / PREPARING -> CLIENT IN CHAIR OR FINISH */}
                      {(status === 'preparing' || status === 'confirmed') && (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'delivered')}
                          className="flex-1 py-3 px-4 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:shadow-xl border-0 active:scale-98 transition-all"
                        >
                          <CheckCheck className="w-4 h-4 stroke-[2.5]" />
                          <span>SERVICE COMPLETED (MARK DONE)</span>
                        </button>
                      )}

                      {/* STEP 3: COMPLETED */}
                      {(status === 'delivered' || status === 'completed') && (
                        <div className="flex-1 py-2.5 px-3 rounded-full bg-emerald-50 text-emerald-700 text-xs font-black text-center flex items-center justify-center gap-1.5">
                          <Check className="w-4 h-4 stroke-[2.5]" />
                          <span>APPOINTMENT COMPLETED</span>
                        </div>
                      )}
                    </>
                  ) : (
                    /* RESTAURANT WORKFLOW (Shawarma Nights) */
                    <>
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
                    </>
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
      </>
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
