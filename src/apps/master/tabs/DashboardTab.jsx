import React, { useMemo } from 'react';
import { useMaster } from '../context/MasterContext';
import { TrendingUp, ShoppingBag, Clock, CheckCircle2, IndianRupee, Store, Plus, Tag, Users, Building2 } from 'lucide-react';

export default function DashboardTab() {
  const { orders, menu, deals, customers, franchiseInquiries, setActiveTab, storeInfo, storeId, capabilities } = useMaster();

  const isSalon = capabilities?.orders?.hasAppointments ?? (storeInfo?.vertical === 'salon' || (storeId || '').includes('nash'));
  const isFashion = capabilities?.catalog?.hasSizes ?? (storeInfo?.vertical === 'fashion' || (storeId || '').includes('skyline'));
  const hasAppointments = capabilities?.orders?.hasAppointments ?? isSalon;
  const hasFranchise = capabilities?.settings?.hasFranchise ?? (!isSalon);
  const showOffers = storeInfo?.settings?.showOfferCards !== false && (!hasAppointments || storeInfo?.settings?.dealsEnabled === true);

  const storeDisplayName = storeInfo?.name || storeInfo?.studioName || (isSalon ? 'Nash Studio' : isFashion ? 'Skyline Outfits' : 'Shawarma Nights');
  const orderNoun = hasAppointments ? 'Booking' : 'Order';
  const orderNounPlural = hasAppointments ? 'Bookings' : 'Orders';
  const itemNoun = capabilities?.catalog?.itemNoun || (hasAppointments ? 'Service' : isFashion ? 'Product' : 'Dish');
  const itemNounPlural = capabilities?.catalog?.itemNounPlural || (hasAppointments ? 'Services' : isFashion ? 'Products' : 'Dishes');

  // Metrics calculation
  const metrics = useMemo(() => {
    const list = Array.isArray(orders) ? orders : [];
    const totalOrders = list.length;
    
    // Revenue sum from non-cancelled orders
    const totalRevenue = list
      .filter(o => o.status !== 'cancelled' && o.status !== 'rejected')
      .reduce((sum, o) => sum + (Number(o.total || o.grandTotal || o.totalPrice) || 0), 0);

    const activeOrders = list.filter(o => 
      ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'payment_pending', 'in_chair', 'booked'].includes(o.status)
    ).length;

    const deliveredOrders = list.filter(o => o.status === 'delivered' || o.status === 'completed').length;
    const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / (deliveredOrders || totalOrders || 1)) : 0;

    return { totalOrders, totalRevenue, activeOrders, deliveredOrders, avgOrderValue };
  }, [orders]);

  // Recent 6 orders
  const recentOrders = useMemo(() => {
    const list = Array.isArray(orders) ? [...orders] : [];
    return list.slice(0, 6);
  }, [orders]);

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Banner / Store State */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-0">
        <div>
          <div className="inline-block bg-zinc-900 text-white px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-sm mb-2">
            TERMINAL ACTIVE
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 leading-tight">
            {storeDisplayName}
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">
            Realtime Dukan Terminal • ChuruOne Universal Backend Connected
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab(1)}
            className={`px-5 py-3 rounded-full ${isSalon ? 'bg-zinc-900 hover:bg-black text-[#d4af37]' : 'bg-[#DC2626] hover:bg-red-700 text-white'} text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg hover:shadow-xl cursor-pointer active:scale-95 border-0`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Manage {orderNounPlural} ({metrics.activeOrders})</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Stat 1: Total Revenue */}
        <div className="bg-white rounded-2xl p-5 shadow-lg border-0 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-[11px] font-black text-zinc-500 uppercase tracking-wider">Gross Sales</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <IndianRupee className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-zinc-900">
            ₹{metrics.totalRevenue.toLocaleString()}
          </div>
          <div className="text-[11px] text-zinc-500 mt-2 flex items-center gap-1 font-medium">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            <span>All recorded {orderNounPlural.toLowerCase()}</span>
          </div>
        </div>

        {/* Stat 2: Active Orders / Bookings */}
        <div className="bg-white rounded-2xl p-5 shadow-lg border-0 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-[11px] font-black text-zinc-500 uppercase tracking-wider">Active Queue</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-600">
            {metrics.activeOrders}
          </div>
          <div className="text-[11px] text-zinc-500 mt-2 font-medium">
            {hasAppointments ? 'Upcoming / In-Chair' : 'Pending or in-kitchen'}
          </div>
        </div>

        {/* Stat 3: Total Orders / Bookings */}
        <div className="bg-white rounded-2xl p-5 shadow-lg border-0 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-[11px] font-black text-zinc-500 uppercase tracking-wider">Total {orderNounPlural}</span>
            <div className={`w-8 h-8 rounded-xl ${isSalon ? 'bg-zinc-100 text-[#d4af37]' : 'bg-red-50 text-[#DC2626]'} flex items-center justify-center`}>
              <ShoppingBag className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-zinc-900">
            {metrics.totalOrders}
          </div>
          <div className="text-[11px] text-zinc-500 mt-2 font-medium">
            {metrics.deliveredOrders} {hasAppointments ? 'completed successfully' : 'delivered successfully'}
          </div>
        </div>

        {/* Stat 4: Average Ticket (AOV) */}
        <div className="bg-white rounded-2xl p-5 shadow-lg border-0 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-[11px] font-black text-zinc-500 uppercase tracking-wider">Avg {orderNoun}</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-zinc-900">
            ₹{metrics.avgOrderValue}
          </div>
          <div className="text-[11px] text-zinc-500 mt-2 font-medium">
            Calculated per {orderNoun.toLowerCase()}
          </div>
        </div>

      </div>

      {/* Quick Action Shortcuts */}
      <div className="space-y-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400">
          Quick Dukandar Shortcuts
        </h3>
        <div className={`grid grid-cols-2 ${hasFranchise && showOffers ? 'sm:grid-cols-4' : 'sm:grid-cols-3'} gap-3`}>
          <button
            onClick={() => setActiveTab(2)}
            className="p-4 rounded-2xl bg-white shadow-md hover:shadow-xl text-left transition-all cursor-pointer border-0 group active:scale-95"
          >
            <div className={`w-9 h-9 rounded-xl ${isSalon ? 'bg-amber-50 text-[#d4af37]' : 'bg-red-50 text-[#DC2626]'} flex items-center justify-center mb-2.5`}>
              <Plus className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div className="text-xs font-black text-zinc-900">Add {itemNoun}</div>
            <div className="text-[11px] text-zinc-500 mt-0.5">{menu?.length || 0} {itemNounPlural.toLowerCase()} live</div>
          </button>

          {showOffers && (
            <button
              onClick={() => setActiveTab(3)}
              className="p-4 rounded-2xl bg-white shadow-md hover:shadow-xl text-left transition-all cursor-pointer border-0 group active:scale-95"
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2.5">
                <Tag className="w-4 h-4 stroke-[2.5]" />
              </div>
              <div className="text-xs font-black text-zinc-900">Manage Deals</div>
              <div className="text-[11px] text-zinc-500 mt-0.5">{deals?.length || 0} active coupons</div>
            </button>
          )}

          <button
            onClick={() => setActiveTab(4)}
            className="p-4 rounded-2xl bg-white shadow-md hover:shadow-xl text-left transition-all cursor-pointer border-0 group active:scale-95"
          >
            <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mb-2.5">
              <Users className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div className="text-xs font-black text-zinc-900">{hasAppointments ? 'Client Base' : 'Customer Base'}</div>
            <div className="text-[11px] text-zinc-500 mt-0.5">{customers?.length || 0} registered</div>
          </button>

          {hasFranchise && (
            <button
              onClick={() => setActiveTab(7)}
              className="p-4 rounded-2xl bg-white shadow-md hover:shadow-xl text-left transition-all cursor-pointer border-0 group active:scale-95"
            >
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-2.5">
                <Building2 className="w-4 h-4 stroke-[2.5]" />
              </div>
              <div className="text-xs font-black text-zinc-900">Franchise Desk</div>
              <div className="text-[11px] text-zinc-500 mt-0.5">{franchiseInquiries?.length || 0} leads pending</div>
            </button>
          )}
        </div>
      </div>

      {/* Live Recent Orders / Bookings Feed */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl space-y-4 border-0">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black text-zinc-900">Live {orderNounPlural} Stream</h3>
            <p className="text-xs text-zinc-500">Auto-updates instantly as customers reserve {orderNounPlural.toLowerCase()}</p>
          </div>
          <button
            onClick={() => setActiveTab(1)}
            className={`text-xs font-black ${isSalon ? 'text-[#d4af37]' : 'text-[#DC2626]'} hover:underline cursor-pointer uppercase tracking-wider`}
          >
            View All ({metrics.totalOrders}) →
          </button>
        </div>

        {recentOrders.length === 0 ? (
          <div className="text-center py-10 text-zinc-400 text-xs font-medium">
            {hasAppointments 
              ? 'Abhi koi booking nahi hai. Nayi booking aane par yahan live show hogi.' 
              : 'Abhi koi order nahi hai. Naye order aane par yahan live show honge.'}
          </div>
        ) : (
          <div className="space-y-3">
            {recentOrders.map((ord) => {
              const statusBadgeStyle = {
                confirmed: 'bg-emerald-50 text-emerald-700',
                completed: 'bg-emerald-50 text-emerald-700',
                in_chair: 'bg-indigo-50 text-indigo-700',
                booked: 'bg-emerald-50 text-emerald-700',
                preparing: 'bg-amber-50 text-amber-700',
                out_for_delivery: 'bg-sky-50 text-sky-700',
                delivered: 'bg-zinc-100 text-zinc-600',
                cancelled: 'bg-red-50 text-red-700'
              }[ord.status] || 'bg-zinc-100 text-zinc-700';

              const orderRefId = ord.token || (ord.orderNumber ? ord.orderNumber.replace(/^(SN|NS)-/, '') : ord.id?.slice(-4));
              const itemsText = Array.isArray(ord.items) && ord.items.length > 0
                ? ord.items.map(i => `${i.qty || 1}x ${i.name}`).join(', ')
                : (ord.styleName || ord.serviceName || ord.services?.map(s => s.name).join(', ') || 'Service / Order item');

              return (
                <div
                  key={ord.id}
                  onClick={() => setActiveTab(1)}
                  className="bg-[#FFFBF7] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs hover:shadow-md transition-all cursor-pointer border-0"
                >
                  <div className="flex items-start sm:items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-white shadow-xs flex items-center justify-center text-xs font-black text-zinc-900 shrink-0">
                      #{orderRefId}
                    </div>
                    <div>
                      <div className="text-sm font-black text-zinc-900 flex items-center gap-2">
                        <span>{ord.customer?.name || ord.customerName || ord.name || 'Customer'}</span>
                        <span className="text-xs text-zinc-500 font-normal">
                          • {ord.customer?.phone || ord.customerPhone || ord.phone || ''}
                        </span>
                      </div>
                      <div className="text-xs text-zinc-600 mt-0.5 line-clamp-1">
                        {itemsText}
                        {ord.slot ? ` • Slot: ${typeof ord.slot === 'object' ? ord.slot.label : ord.slot}` : ''}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                    <span className="text-base font-black text-zinc-900">
                      ₹{ord.total || ord.grandTotal || ord.totalPrice || 0}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${statusBadgeStyle}`}>
                      {ord.status || 'Pending'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
