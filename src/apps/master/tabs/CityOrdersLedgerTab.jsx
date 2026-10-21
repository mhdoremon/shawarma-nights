import React, { useState, useMemo } from 'react';
import { useMaster } from '../context/MasterContext';
import { 
  ShoppingBag, 
  Search, 
  Filter, 
  Store, 
  Clock, 
  IndianRupee, 
  Phone, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  RefreshCw, 
  Calendar,
  Layers,
  ChevronDown,
  User,
  Package
} from 'lucide-react';

export default function CityOrdersLedgerTab() {
  const { 
    orders, 
    isHistoricalOrdersLoaded, 
    isLoadingHistoricalOrders, 
    loadHistoricalOrders, 
    refreshData 
  } = useMaster();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStore, setSelectedStore] = useState('all');
  const [selectedChannel, setSelectedChannel] = useState('all'); // 'all' | 'churuone' | 'storefront'
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Filtered orders list
  const filteredOrders = useMemo(() => {
    const list = Array.isArray(orders) ? orders : [];
    return list.filter(order => {
      const q = searchQuery.toLowerCase().trim();
      const orderNum = String(order.orderNumber || order.id || '').toLowerCase();
      const custName = String(order.customer?.name || order.customerName || order.name || '').toLowerCase();
      const custPhone = String(order.customer?.phone || order.customerPhone || order.phone || '').toLowerCase();
      const sId = String(order.storeId || '').toLowerCase();
      const sName = String(order.storeName || '').toLowerCase();

      const matchesSearch = !q || 
        orderNum.includes(q) || 
        custName.includes(q) || 
        custPhone.includes(q) || 
        sId.includes(q) || 
        sName.includes(q);

      const matchesStore = selectedStore === 'all' || order.storeId === selectedStore;

      const isChuruOne = order.channel === 'churuone' || order.fromChuruOne === true;
      const matchesChannel = selectedChannel === 'all' || 
        (selectedChannel === 'churuone' && isChuruOne) ||
        (selectedChannel === 'storefront' && !isChuruOne);

      const status = (order.status || '').toLowerCase();
      const matchesStatus = selectedStatus === 'all' || 
        (selectedStatus === 'delivered' && (status === 'delivered' || status === 'completed')) ||
        (selectedStatus === 'active' && ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'booked'].includes(status)) ||
        (selectedStatus === 'cancelled' && ['cancelled', 'rejected'].includes(status));

      return matchesSearch && matchesStore && matchesChannel && matchesStatus;
    });
  }, [orders, searchQuery, selectedStore, selectedChannel, selectedStatus]);

  // Financial calculations
  const stats = useMemo(() => {
    const list = Array.isArray(orders) ? orders : [];
    const valid = list.filter(o => o.status !== 'cancelled' && o.status !== 'rejected');
    const churuoneList = valid.filter(o => o.channel === 'churuone' || o.fromChuruOne === true);
    const storefrontList = valid.filter(o => o.channel !== 'churuone' && !o.fromChuruOne);

    const totalRevenue = valid.reduce((sum, o) => sum + (Number(o.total || o.grandTotal || o.totalPrice) || 0), 0);
    const churuoneRevenue = churuoneList.reduce((sum, o) => sum + (Number(o.total || o.grandTotal || o.totalPrice) || 0), 0);
    const storefrontRevenue = storefrontList.reduce((sum, o) => sum + (Number(o.total || o.grandTotal || o.totalPrice) || 0), 0);

    return {
      totalCount: list.length,
      churuoneCount: churuoneList.length,
      storefrontCount: storefrontList.length,
      totalRevenue,
      churuoneRevenue,
      storefrontRevenue
    };
  }, [orders]);

  const getStoreBadgeColor = (sId) => {
    if (sId === 'shawarma') return 'bg-red-50 text-red-700 border-red-200';
    if (sId === 'skyline') return 'bg-zinc-900 text-white border-zinc-700';
    if (sId === 'nash-studio') return 'bg-amber-50 text-amber-800 border-amber-300';
    return 'bg-blue-50 text-blue-700 border-blue-200';
  };

  const getStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'delivered' || s === 'completed') {
      return <span className="bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full text-xs font-bold inline-flex items-center gap-1">✓ Delivered</span>;
    }
    if (s === 'out_for_delivery' || s === 'dispatched') {
      return <span className="bg-purple-100 text-purple-800 px-2.5 py-0.5 rounded-full text-xs font-bold inline-flex items-center gap-1">🛵 Out for Delivery</span>;
    }
    if (s === 'preparing' || s === 'in_chair') {
      return <span className="bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full text-xs font-bold inline-flex items-center gap-1">⏳ In Progress</span>;
    }
    if (s === 'cancelled' || s === 'rejected') {
      return <span className="bg-red-100 text-red-800 px-2.5 py-0.5 rounded-full text-xs font-bold inline-flex items-center gap-1">✕ Cancelled</span>;
    }
    return <span className="bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full text-xs font-bold inline-flex items-center gap-1">● Pending</span>;
  };

  const formatTimestamp = (ts) => {
    if (!ts) return '-';
    try {
      const d = new Date(ts);
      return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) + ', ' + d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    } catch {
      return String(ts);
    }
  };

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto font-sans">
      
      {/* 1. HEADER & EXECUTIVE TRANSACTION SUMMARY */}
      <div className="bg-gradient-to-r from-stone-900 via-zinc-900 to-black text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-80 bg-gradient-to-l from-indigo-500/20 to-transparent pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400 text-stone-950 text-xs font-black uppercase tracking-wider shadow-sm">
              <Layers className="w-3.5 h-3.5" />
              <span>ChuruOne Platform Audit Ledger</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              CITY ORDERS & TRANSACTION LOG
            </h2>
            <p className="text-xs sm:text-sm text-stone-300 max-w-2xl leading-relaxed">
              Platform-level unified transaction ledger. Shawarma Nights, Skyline Outfits, aur Nash Studio ke sabhi orders ka live record. Order fulfillment dukandar khud karte hain; Super Admin yahan se transparency aur audit track karta hai.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => refreshData()}
              className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer border border-white/20 active:scale-95"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>

            {!isHistoricalOrdersLoaded ? (
              <button
                onClick={() => loadHistoricalOrders()}
                disabled={isLoadingHistoricalOrders}
                className="px-5 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-stone-950 text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-95"
              >
                {isLoadingHistoricalOrders ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Calendar className="w-4 h-4" />
                )}
                <span>📦 Load All Historical Archive</span>
              </button>
            ) : (
              <span className="px-4 py-2.5 rounded-2xl bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
                ✓ Full Archive Loaded ({orders.length} orders)
              </span>
            )}
          </div>
        </div>

        {/* Financial Overview Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10">
          <div className="bg-white/5 backdrop-blur-xs rounded-2xl p-4 border border-white/10">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">ChuruOne Page Sales</span>
            <span className="text-2xl font-black text-amber-400">₹{stats.churuoneRevenue.toLocaleString()}</span>
            <span className="text-[11px] text-stone-400 block mt-1">{stats.churuoneCount} orders placed via ChuruOne</span>
          </div>

          <div className="bg-white/5 backdrop-blur-xs rounded-2xl p-4 border border-white/10">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Direct Storefront Sales</span>
            <span className="text-2xl font-black text-white">₹{stats.storefrontRevenue.toLocaleString()}</span>
            <span className="text-[11px] text-stone-400 block mt-1">{stats.storefrontCount} orders on merchant websites</span>
          </div>

          <div className="bg-white/5 backdrop-blur-xs rounded-2xl p-4 border border-white/10">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Total Platform Gross</span>
            <span className="text-2xl font-black text-emerald-400">₹{stats.totalRevenue.toLocaleString()}</span>
            <span className="text-[11px] text-stone-400 block mt-1">Ecosystem gross transaction value</span>
          </div>

          <div className="bg-white/5 backdrop-blur-xs rounded-2xl p-4 border border-white/10">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Total Transaction Volume</span>
            <span className="text-2xl font-black text-white">{stats.totalCount}</span>
            <span className="text-[11px] text-stone-400 block mt-1">
              {!isHistoricalOrdersLoaded ? "Today's live queue only" : "All-time database count"}
            </span>
          </div>
        </div>
      </div>

      {/* 2. FILTER & SEARCH CONTROLS */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-xl border-0 space-y-4">
        
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-zinc-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Order #, Customer Name, Mobile Phone, or Store..."
            className="w-full bg-[#FFFBF7] rounded-2xl pl-11 pr-4 py-3 text-sm text-zinc-900 placeholder-zinc-400 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none transition-all shadow-xs border-0"
          />
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          
          {/* Store Filter */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-bold text-zinc-400 mr-1 flex items-center gap-1">
              <Store className="w-3.5 h-3.5" /> Dukan:
            </span>
            <button
              onClick={() => setSelectedStore('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                selectedStore === 'all'
                  ? 'bg-zinc-900 text-white shadow-sm'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}
            >
              All Stores
            </button>
            <button
              onClick={() => setSelectedStore('shawarma')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                selectedStore === 'shawarma'
                  ? 'bg-red-700 text-white shadow-sm'
                  : 'bg-red-50 text-red-800 hover:bg-red-100'
              }`}
            >
              🌯 Shawarma Nights
            </button>
            <button
              onClick={() => setSelectedStore('skyline')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                selectedStore === 'skyline'
                  ? 'bg-zinc-900 text-white shadow-sm'
                  : 'bg-zinc-100 text-zinc-800 hover:bg-zinc-200'
              }`}
            >
              👔 Skyline Outfits
            </button>
            <button
              onClick={() => setSelectedStore('nash-studio')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                selectedStore === 'nash-studio'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
              }`}
            >
              ✂️ Nash Studio
            </button>
          </div>

          {/* Channel Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-zinc-400 mr-1">Channel:</span>
            <button
              onClick={() => setSelectedChannel('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedChannel === 'all'
                  ? 'bg-zinc-900 text-white font-black shadow-xs'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSelectedChannel('churuone')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedChannel === 'churuone'
                  ? 'bg-amber-500 text-stone-950 font-black shadow-xs'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
              }`}
            >
              👑 ChuruOne Orders
            </button>
            <button
              onClick={() => setSelectedChannel('storefront')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedChannel === 'storefront'
                  ? 'bg-zinc-900 text-white font-black shadow-xs'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}
            >
              Direct Storefronts
            </button>
          </div>
        </div>
      </div>

      {/* 3. TRANSACTION TABLE */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center shadow-lg border-0 space-y-3">
          <ShoppingBag className="w-10 h-10 text-zinc-300 mx-auto" />
          <h3 className="text-base font-black text-zinc-900">Koi Order Nahi Mila</h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            {!isHistoricalOrdersLoaded 
              ? "Aaj ke orders filter me nahi mile. Purane orders dekhne ke liye uper diye gaye 'Load All Historical Archive' button par click karein."
              : "Diye gaye filter criteria ke mutabik koi order record nahi hai."
            }
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-xl border-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-zinc-50/80 border-b border-zinc-200 text-zinc-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4">Order / Token</th>
                  <th className="py-3.5 px-4">Date & Time</th>
                  <th className="py-3.5 px-4">Partner Store</th>
                  <th className="py-3.5 px-4">Channel Origin</th>
                  <th className="py-3.5 px-4">Customer Details</th>
                  <th className="py-3.5 px-4">Items Summary</th>
                  <th className="py-3.5 px-4">Total Amount</th>
                  <th className="py-3.5 px-4">Payment & Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 font-medium">
                {filteredOrders.map((o) => {
                  const isChuruOne = o.channel === 'churuone' || o.fromChuruOne === true;
                  const orderNum = o.orderNumber || o.id || o.token || '-';
                  const custName = o.customer?.name || o.customerName || o.name || 'Customer';
                  const custPhone = o.customer?.phone || o.customerPhone || o.phone || '-';
                  const total = Number(o.total || o.grandTotal || o.totalPrice) || 0;
                  const items = Array.isArray(o.items) ? o.items : [];
                  const itemsCount = items.reduce((s, it) => s + (Number(it.quantity) || 1), 0);

                  return (
                    <tr key={o.id || o.orderNumber} className="hover:bg-zinc-50/60 transition-colors">
                      {/* Order Number */}
                      <td className="py-4 px-4 font-mono font-bold text-zinc-900">
                        #{orderNum}
                      </td>

                      {/* Timestamp */}
                      <td className="py-4 px-4 text-zinc-500 whitespace-nowrap">
                        {formatTimestamp(o.createdAt || o.placedAt || o.timestamp)}
                      </td>

                      {/* Partner Store */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${getStoreBadgeColor(o.storeId)}`}>
                          {o.storeName || o.storeId}
                        </span>
                      </td>

                      {/* Channel */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        {isChuruOne ? (
                          <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full text-[10px] font-black tracking-wide inline-flex items-center gap-1">
                            👑 ChuruOne Page
                          </span>
                        ) : (
                          <span className="bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide">
                            Direct Storefront
                          </span>
                        )}
                      </td>

                      {/* Customer Details */}
                      <td className="py-4 px-4">
                        <div className="font-bold text-zinc-900 leading-tight">{custName}</div>
                        <div className="text-[11px] text-zinc-500 font-mono mt-0.5">{custPhone}</div>
                      </td>

                      {/* Items */}
                      <td className="py-4 px-4 max-w-xs">
                        {items.length > 0 ? (
                          <div className="text-zinc-700 line-clamp-1 text-[11px]">
                            {items.map(it => `${it.quantity || 1}x ${it.name}`).join(', ')}
                          </div>
                        ) : (
                          <span className="text-zinc-400 text-[11px]">{o.styleName || 'Order Package'}</span>
                        )}
                      </td>

                      {/* Total */}
                      <td className="py-4 px-4 whitespace-nowrap font-black text-zinc-900 text-sm">
                        ₹{total}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="space-y-1">
                          {getStatusBadge(o.status)}
                          <div className="text-[10px] text-zinc-400 capitalize">
                            {o.paymentMethod || o.paymentMode || 'COD'} • {o.paymentStatus || 'Pending'}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
