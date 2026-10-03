import React, { useMemo } from 'react';
import { useMaster } from '../context/MasterContext';
import { TrendingUp, ShoppingBag, Clock, CheckCircle2, IndianRupee, Store, Plus, Tag, Users, Building2, AlertCircle } from 'lucide-react';

export default function DashboardTab() {
  const { orders, menu, deals, customers, franchiseInquiries, setActiveTab, storeInfo } = useMaster();

  // Metrics calculation
  const metrics = useMemo(() => {
    const list = Array.isArray(orders) ? orders : [];
    const totalOrders = list.length;
    
    // Revenue sum from non-cancelled orders
    const totalRevenue = list
      .filter(o => o.status !== 'cancelled' && o.status !== 'rejected')
      .reduce((sum, o) => sum + (Number(o.total || o.grandTotal) || 0), 0);

    const activeOrders = list.filter(o => 
      ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'payment_pending'].includes(o.status)
    ).length;

    const deliveredOrders = list.filter(o => o.status === 'delivered').length;
    const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / (deliveredOrders || totalOrders || 1)) : 0;

    return { totalOrders, totalRevenue, activeOrders, deliveredOrders, avgOrderValue };
  }, [orders]);

  // Recent 5 orders
  const recentOrders = useMemo(() => {
    const list = Array.isArray(orders) ? [...orders] : [];
    return list.slice(0, 6);
  }, [orders]);

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Banner / Store State */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">Live Operating System</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">
            {storeInfo?.name || 'Shawarma Nights'}
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Realtime Dukan Terminal • ChuruOne Universal Backend Synced
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab(1)}
            className="px-4 py-2.5 rounded-2xl bg-[#DC2626] hover:bg-red-700 text-white text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Manage Orders ({metrics.activeOrders})</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Stat 1: Total Revenue */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Gross Sales</span>
            <div className="w-7 h-7 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">
            ₹{metrics.totalRevenue.toLocaleString()}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-emerald-400" />
            <span>Across all recorded orders</span>
          </div>
        </div>

        {/* Stat 2: Active Orders */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Active Queue</span>
            <div className="w-7 h-7 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-400">
            {metrics.activeOrders}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">
            Pending, preparing or in-transit
          </div>
        </div>

        {/* Stat 3: Total Orders */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">All Orders</span>
            <div className="w-7 h-7 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">
            {metrics.totalOrders}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">
            {metrics.deliveredOrders} fulfilled successfully
          </div>
        </div>

        {/* Stat 4: Average Ticket (AOV) */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Avg Order Value</span>
            <div className="w-7 h-7 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">
            ₹{metrics.avgOrderValue}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">
            Calculated per order
          </div>
        </div>

      </div>

      {/* Quick Action Shortcuts */}
      <div className="space-y-2.5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
          Quick Dukandar Actions
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={() => setActiveTab(2)}
            className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-left transition-all cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-xl bg-red-500/10 text-[#DC2626] flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <Plus className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold text-white">Add Menu Item</div>
            <div className="text-[10px] text-zinc-500 mt-0.5">{menu?.length || 0} items active</div>
          </button>

          <button
            onClick={() => setActiveTab(3)}
            className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-left transition-all cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <Tag className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold text-white">Manage Deals</div>
            <div className="text-[10px] text-zinc-500 mt-0.5">{deals?.length || 0} active coupons</div>
          </button>

          <button
            onClick={() => setActiveTab(4)}
            className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-left transition-all cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <Users className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold text-white">Customer Base</div>
            <div className="text-[10px] text-zinc-500 mt-0.5">{customers?.length || 0} registered</div>
          </button>

          <button
            onClick={() => setActiveTab(7)}
            className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-left transition-all cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <Building2 className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold text-white">Franchise Desk</div>
            <div className="text-[10px] text-zinc-500 mt-0.5">{franchiseInquiries?.length || 0} leads pending</div>
          </button>
        </div>
      </div>

      {/* Live Recent Orders Feed */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-black text-white">Live Orders Stream</h3>
            <p className="text-xs text-zinc-400">Auto-updates instantly as customers place orders</p>
          </div>
          <button
            onClick={() => setActiveTab(1)}
            className="text-xs font-bold text-[#DC2626] hover:underline cursor-pointer"
          >
            View All ({metrics.totalOrders}) →
          </button>
        </div>

        {recentOrders.length === 0 ? (
          <div className="text-center py-10 text-zinc-500 text-xs">
            Abhi koi order nahi hai. Naye order aane par yahan live dikhenge!
          </div>
        ) : (
          <div className="space-y-2.5">
            {recentOrders.map((ord) => {
              const statusColor = {
                confirmed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                preparing: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
                out_for_delivery: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
                delivered: 'bg-zinc-800 text-zinc-300 border-zinc-700',
                cancelled: 'bg-red-500/10 text-red-400 border-red-500/20'
              }[ord.status] || 'bg-zinc-800 text-zinc-300 border-zinc-700';

              return (
                <div
                  key={ord.id}
                  onClick={() => setActiveTab(1)}
                  className="bg-zinc-950 border border-zinc-800/80 hover:border-zinc-700 rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors cursor-pointer"
                >
                  <div className="flex items-start sm:items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center text-xs font-black text-zinc-300 shrink-0">
                      #{ord.orderNumber ? ord.orderNumber.replace('SN-', '') : ord.id?.slice(-4)}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white flex items-center gap-2">
                        <span>{ord.customer?.name || ord.customerName || 'Customer'}</span>
                        <span className="text-xs text-zinc-500 font-normal">
                          • {ord.customer?.phone || ord.customerPhone || ''}
                        </span>
                      </div>
                      <div className="text-xs text-zinc-400 mt-0.5 line-clamp-1">
                        {Array.isArray(ord.items) 
                          ? ord.items.map(i => `${i.qty || 1}x ${i.name}`).join(', ')
                          : 'Order items'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                    <span className="text-sm font-black text-white">
                      ₹{ord.total || ord.grandTotal || 0}
                    </span>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${statusColor}`}>
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
