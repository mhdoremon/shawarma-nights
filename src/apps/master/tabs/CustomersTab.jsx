import React, { useState, useMemo } from 'react';
import { useMaster } from '../context/MasterContext';
import { 
  Search, 
  Phone, 
  MessageCircle, 
  ShoppingBag, 
  IndianRupee, 
  Mail, 
  X, 
  Clock, 
  MapPin, 
  CheckCircle, 
  ChevronRight, 
  Package, 
  ArrowLeft,
  Users,
  Sparkles,
  RefreshCw,
  Store,
  Crown,
  Layers,
  Filter
} from 'lucide-react';

export default function CustomersTab() {
  const { 
    customers, 
    orders, 
    isCustomersLoaded, 
    isLoadingCustomers, 
    loadCustomersOnDemand,
    storeId 
  } = useMaster();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState('all'); // 'all' | 'churuone' | 'storefront' | 'multi' | 'vip'

  // Helper to normalize phone numbers for accurate cross-matching
  const normalizePhone = (p) => (p || '').replace(/\D/g, '').slice(-10);

  // Enrich customers with order calculations, channel classification, and items summary
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

      const totalSpent = custOrders.reduce((sum, o) => sum + (Number(o.total || o.grandTotal || o.totalPrice) || 0), 0);
      const ordersCount = custOrders.length || c.ordersCount || 0;

      // Channel classification
      const churuoneOrders = custOrders.filter(o => o.channel === 'churuone' || o.fromChuruOne === true);
      const storefrontOrders = custOrders.filter(o => o.channel !== 'churuone' && !o.fromChuruOne);

      // Stores visited set
      const storesSet = new Set();
      custOrders.forEach(o => {
        if (o.storeId) storesSet.add(o.storeId);
      });
      const storesList = Array.from(storesSet);

      // Aggregated items summary
      const itemsMap = new Map();
      custOrders.forEach(o => {
        if (Array.isArray(o.items)) {
          o.items.forEach(it => {
            const name = it.name || 'Item';
            const qty = Number(it.quantity || it.qty || 1);
            itemsMap.set(name, (itemsMap.get(name) || 0) + qty);
          });
        } else if (o.styleName || o.serviceName) {
          const name = o.styleName || o.serviceName;
          itemsMap.set(name, (itemsMap.get(name) || 0) + 1);
        }
      });
      const topItemsSummary = Array.from(itemsMap.entries()).map(([name, qty]) => `${qty}x ${name}`);

      return {
        ...c,
        orders: custOrders,
        calculatedOrdersCount: ordersCount,
        calculatedTotalSpent: totalSpent || c.totalSpent || 0,
        churuoneOrdersCount: churuoneOrders.length,
        storefrontOrdersCount: storefrontOrders.length,
        storesList,
        isChuruOneShopper: churuoneOrders.length > 0,
        isStorefrontShopper: storefrontOrders.length > 0,
        isMultiStoreShopper: storesList.length >= 2,
        isVip: totalSpent >= 1000 || ordersCount >= 3,
        topItemsSummary
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
    return enrichedCustomers.filter(c => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        (c.name || '').toLowerCase().includes(q) ||
        (c.phone || '').toLowerCase().includes(q) ||
        (c.email || '').toLowerCase().includes(q) ||
        (c.address || '').toLowerCase().includes(q);

      const matchesFilter = 
        selectedFilter === 'all' ||
        (selectedFilter === 'churuone' && c.isChuruOneShopper) ||
        (selectedFilter === 'storefront' && c.isStorefrontShopper) ||
        (selectedFilter === 'multi' && c.isMultiStoreShopper) ||
        (selectedFilter === 'vip' && c.isVip);

      return matchesSearch && matchesFilter;
    });
  }, [enrichedCustomers, searchQuery, selectedFilter]);

  const getStatusBadge = (status) => {
    const s = (status || '').toUpperCase();
    if (s.includes('DELIVERED') || s.includes('COMPLETED')) return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    if (s.includes('OUT') || s.includes('DISPATCH')) return 'bg-purple-100 text-purple-800 border-purple-200';
    if (s.includes('KITCHEN') || s.includes('PREPAR')) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (s.includes('CONFIRM')) return 'bg-indigo-100 text-indigo-800 border-indigo-200';
    if (s.includes('CANCEL')) return 'bg-red-100 text-red-800 border-red-200';
    return 'bg-amber-100 text-amber-800 border-amber-200';
  };

  // ─── ON-DEMAND GATE: IF NOT LOADED YET, SHOW PERFORMANCE LOAD BUTTON ───
  if (!isCustomersLoaded && customers.length === 0) {
    return (
      <div className="space-y-6 pb-16 max-w-4xl mx-auto">
        <div className="bg-white rounded-3xl p-8 sm:p-12 text-center shadow-xl border-0 space-y-5">
          <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto shadow-sm">
            <Users className="w-8 h-8" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase bg-amber-100 text-amber-900 px-3 py-1 rounded-full font-bold">
              High Performance On-Demand CRM
            </span>
            <h2 className="text-2xl font-black text-zinc-900 mt-2">
              Customer CRM Directory & Purchase Classification
            </h2>
            <p className="text-xs sm:text-sm text-zinc-500 max-w-md mx-auto leading-relaxed mt-1">
              Website ko lightning-fast rakhne ke liye customer database automatic mount par load nahi hota. ChuruOne buyers, direct buyers aur customer purchase history dekhne ke liye button click karein.
            </p>
          </div>

          <button
            onClick={() => loadCustomersOnDemand()}
            disabled={isLoadingCustomers}
            className="px-6 py-3.5 bg-zinc-900 hover:bg-black text-white rounded-2xl text-xs font-black shadow-xl hover:shadow-2xl transition-all cursor-pointer inline-flex items-center gap-2 active:scale-95"
          >
            {isLoadingCustomers ? (
              <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
            ) : (
              <Sparkles className="w-4 h-4 text-amber-400" />
            )}
            <span>{isLoadingCustomers ? 'Loading Customer Database...' : '⚡ Load Customer Directory & Analytics'}</span>
          </button>
        </div>
      </div>
    );
  }

  // Counts for pills
  const churuoneCount = enrichedCustomers.filter(c => c.isChuruOneShopper).length;
  const storefrontCount = enrichedCustomers.filter(c => c.isStorefrontShopper).length;
  const multiStoreCount = enrichedCustomers.filter(c => c.isMultiStoreShopper).length;
  const vipCount = enrichedCustomers.filter(c => c.isVip).length;

  return (
    <div className="space-y-5 pb-16 max-w-7xl mx-auto font-sans">
      
      {/* Search Bar & Summary */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xl space-y-4 border-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-zinc-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-500" />
              <span>Customer CRM & Purchase Directory</span>
            </h2>
            <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
              Verified customer profiles, cross-channel classification (ChuruOne vs Direct storefronts), and lifetime purchase history.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => loadCustomersOnDemand(true)}
              disabled={isLoadingCustomers}
              className="px-3.5 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingCustomers ? 'animate-spin' : ''}`} />
              <span>Refresh CRM</span>
            </button>
            <span className="text-xs font-black px-3.5 py-1.5 rounded-full bg-zinc-900 text-white">
              {enrichedCustomers.length} Customers
            </span>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-zinc-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by customer name, mobile phone or address..."
            className="w-full bg-[#FFFBF7] rounded-2xl pl-11 pr-4 py-3 text-sm text-zinc-900 placeholder-zinc-400 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none transition-all shadow-xs border-0"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Classification Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <button
            onClick={() => setSelectedFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              selectedFilter === 'all'
                ? 'bg-zinc-900 text-white shadow-sm'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
            }`}
          >
            All Customers ({enrichedCustomers.length})
          </button>
          <button
            onClick={() => setSelectedFilter('churuone')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1 ${
              selectedFilter === 'churuone'
                ? 'bg-amber-500 text-stone-950 shadow-sm'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
            }`}
          >
            <Crown className="w-3.5 h-3.5" />
            <span>👑 ChuruOne Buyers ({churuoneCount})</span>
          </button>
          <button
            onClick={() => setSelectedFilter('storefront')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1 ${
              selectedFilter === 'storefront'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-blue-50 text-blue-800 hover:bg-blue-100'
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            <span>🏬 Direct Store Buyers ({storefrontCount})</span>
          </button>
          <button
            onClick={() => setSelectedFilter('multi')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1 ${
              selectedFilter === 'multi'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-purple-50 text-purple-800 hover:bg-purple-100'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>🌟 Multi-Store Shoppers ({multiStoreCount})</span>
          </button>
          <button
            onClick={() => setSelectedFilter('vip')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1 ${
              selectedFilter === 'vip'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>💎 VIP Spenders ({vipCount})</span>
          </button>
        </div>
      </div>

      {/* Customers List */}
      {filteredCustomers.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center text-zinc-400 text-sm space-y-1 shadow-lg border-0">
          <p className="font-bold text-zinc-700">Koi customer nahi mila</p>
          <p className="text-xs">Diye gaye filter criteria ke anusar koi profile nahi mili.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCustomers.map(cust => (
            <div
              key={cust.id || cust.phone || cust.email}
              onClick={() => setSelectedCustomer(cust)}
              className="bg-white rounded-3xl p-6 flex flex-col justify-between space-y-4 shadow-xl hover:shadow-2xl transition-all border border-transparent hover:border-amber-300 cursor-pointer group"
            >
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  {cust.picture || cust.photoURL ? (
                    <img
                      src={cust.picture || cust.photoURL}
                      alt=""
                      className="w-12 h-12 rounded-2xl object-cover shrink-0 shadow-sm border border-zinc-100"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-2xl bg-zinc-900 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-sm group-hover:bg-amber-500 group-hover:text-stone-950 transition-colors">
                      {(cust.name || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-sm font-black text-zinc-900 truncate group-hover:text-amber-800 transition-colors">
                        {cust.name || 'Customer'}
                      </h3>
                      {cust.isVip && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-sm bg-emerald-100 text-emerald-800 font-bold uppercase tracking-wider shrink-0">
                          VIP
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <p className="text-xs text-zinc-500 font-mono truncate">
                        {cust.phone || cust.email || 'Direct Client'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Channel Classification Badges */}
                <div className="flex flex-wrap gap-1">
                  {cust.isChuruOneShopper && (
                    <span className="text-[9px] font-black bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full">
                      👑 ChuruOne Buyer ({cust.churuoneOrdersCount})
                    </span>
                  )}
                  {cust.isStorefrontShopper && (
                    <span className="text-[9px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                      🏬 Direct Store Buyer ({cust.storefrontOrdersCount})
                    </span>
                  )}
                  {cust.isMultiStoreShopper && (
                    <span className="text-[9px] font-bold bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">
                      🌟 Multi-Store ({cust.storesList.length} shops)
                    </span>
                  )}
                </div>

                {/* Top Items Summary Preview */}
                {cust.topItemsSummary && cust.topItemsSummary.length > 0 && (
                  <div className="bg-[#FFFBF7] p-2.5 rounded-2xl text-[11px] text-zinc-600 line-clamp-2">
                    <span className="font-bold text-zinc-800 block text-[10px] uppercase">Bought Items:</span>
                    {cust.topItemsSummary.slice(0, 3).join(', ')}
                    {cust.topItemsSummary.length > 3 ? '...' : ''}
                  </div>
                )}

                {/* Orders & Spend Metrics */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-[#FFFBF7] p-3 rounded-2xl shadow-xs group-hover:bg-amber-50/40 transition-colors">
                    <div className="text-[10px] text-zinc-400 uppercase font-bold">Orders</div>
                    <div className="text-sm font-black text-zinc-900 mt-0.5 flex items-center gap-1">
                      <ShoppingBag className="w-3.5 h-3.5 text-zinc-500" />
                      <span>{cust.calculatedOrdersCount}</span>
                    </div>
                  </div>
                  <div className="bg-[#FFFBF7] p-3 rounded-2xl shadow-xs group-hover:bg-amber-50/40 transition-colors">
                    <div className="text-[10px] text-zinc-400 uppercase font-bold">Total Spent</div>
                    <div className="text-sm font-black text-emerald-600 mt-0.5 flex items-center gap-0.5">
                      <IndianRupee className="w-3.5 h-3.5" />
                      <span>{cust.calculatedTotalSpent}</span>
                    </div>
                  </div>
                </div>

                {/* View Purchase History Indicator */}
                <div className="w-full py-2 px-3 rounded-xl bg-zinc-50 group-hover:bg-amber-50 text-zinc-600 group-hover:text-amber-900 font-bold text-xs flex items-center justify-between transition-colors">
                  <span className="flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5" />
                    <span>View Purchase History & Timeline ({cust.calculatedOrdersCount})</span>
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

      {/* Customer Purchase Orders Slide-over Drawer / Modal */}
      {activeSelectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
          <div 
            className="fixed inset-0"
            onClick={() => setSelectedCustomer(null)}
          />
          <div className="relative w-full max-w-2xl bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[88vh] overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="p-5 sm:p-6 bg-gradient-to-r from-stone-900 to-zinc-900 text-white shrink-0">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  {activeSelectedCustomer.picture || activeSelectedCustomer.photoURL ? (
                    <img
                      src={activeSelectedCustomer.picture || activeSelectedCustomer.photoURL}
                      alt=""
                      className="w-14 h-14 rounded-2xl object-cover shrink-0 border-2 border-white/20 shadow-md"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-amber-500 text-stone-950 font-black text-xl flex items-center justify-center shrink-0 shadow-md">
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
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Items Summary in Drawer */}
              {activeSelectedCustomer.topItemsSummary && activeSelectedCustomer.topItemsSummary.length > 0 && (
                <div className="mt-4 pt-3 border-t border-white/10 text-xs text-zinc-300">
                  <span className="font-bold text-amber-300 block text-[10px] uppercase mb-1">Total Purchases Summary:</span>
                  <p className="line-clamp-2 leading-relaxed">{activeSelectedCustomer.topItemsSummary.join(' • ')}</p>
                </div>
              )}

              {activeSelectedCustomer.address && (
                <div className="mt-3 pt-2 border-t border-white/10 flex items-start gap-2 text-xs text-zinc-300">
                  <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span className="line-clamp-2">{activeSelectedCustomer.address}</span>
                </div>
              )}
            </div>

            {/* Sub-header / Quick Stats */}
            <div className="px-6 py-3 bg-[#FFFBF7] border-b border-zinc-100 flex items-center justify-between text-xs font-bold text-zinc-600 shrink-0">
              <span className="flex items-center gap-1.5 text-zinc-800 font-black">
                <ShoppingBag className="w-4 h-4 text-amber-600" />
                Purchase History Timeline
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
                    Is customer ke dvara kiye gaye sabhi orders yahan detail me dikhenge.
                  </p>
                </div>
              ) : (
                activeSelectedCustomer.orders.map((order, idx) => {
                  const items = Array.isArray(order.items) ? order.items : [];
                  const total = order.total || order.grandTotal || 0;
                  const orderDate = order.createdAt || order.placedAt || 'Recent Order';
                  const isPaid = (order.paymentStatus || '').toLowerCase() === 'paid';
                  const isChuruOne = order.channel === 'churuone' || order.fromChuruOne === true;

                  return (
                    <div 
                      key={order.orderId || order.id || idx}
                      className="bg-zinc-50 hover:bg-white rounded-2xl p-4 sm:p-5 border border-zinc-200/80 shadow-xs hover:shadow-md transition-all space-y-3"
                    >
                      {/* Order top bar */}
                      <div className="flex items-center justify-between flex-wrap gap-2 pb-2.5 border-b border-zinc-200">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-xs bg-zinc-900 text-white px-2.5 py-1 rounded-lg">
                            #{order.orderNumber || order.orderId || order.id || `ORD-${idx + 1}`}
                          </span>
                          <span className="text-xs text-zinc-500 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {typeof orderDate === 'string' ? orderDate : new Date(orderDate).toLocaleString()}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {isChuruOne ? (
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">
                              👑 ChuruOne Page
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-200 text-zinc-700">
                              Direct Storefront
                            </span>
                          )}

                          <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${getStatusBadge(order.status)}`}>
                            {order.status || 'NEW'}
                          </span>
                        </div>
                      </div>

                      {/* Store badge */}
                      {order.storeName && (
                        <div className="text-xs font-bold text-zinc-700">
                          Dukan: <span className="text-zinc-900 font-black">{order.storeName}</span>
                        </div>
                      )}

                      {/* Items list */}
                      <div className="space-y-1.5">
                        {items.length === 0 ? (
                          <p className="text-xs text-zinc-500 italic">{order.styleName || 'Order item details recorded'}</p>
                        ) : (
                          items.map((item, itemIdx) => (
                            <div key={itemIdx} className="flex items-center justify-between text-xs py-1 border-b border-dashed border-zinc-200 last:border-0">
                              <span className="font-medium text-zinc-800">
                                {item.quantity || item.qty || 1}x {item.name}
                              </span>
                              <span className="font-bold text-zinc-900">
                                ₹{(item.price || 0) * (item.quantity || item.qty || 1)}
                              </span>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Order Footer */}
                      <div className="pt-2 flex items-center justify-between text-xs font-black border-t border-zinc-200">
                        <span className="text-zinc-500">Order Total</span>
                        <span className="text-sm font-black text-emerald-700">₹{total}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
