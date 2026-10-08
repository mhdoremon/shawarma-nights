import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useRealtimeDB } from '../context/RealtimeContext';
import { useCart } from '../context/CartContext';
import { sounds } from '../utils/soundEffects';
import { RESTAURANT_INFO } from '../data/menuData';
import { 
  X, 
  LogOut, 
  ShieldCheck, 
  MapPin, 
  Phone, 
  Mail, 
  Edit3, 
  Check, 
  ShoppingBag, 
  Clock, 
  Trash2,
  AlertTriangle,
  AlertCircle,
  User,
  MessageCircle,
  HelpCircle
} from 'lucide-react';

export default function ProfileDrawer() {
  const { 
    isProfileOpen, 
    setIsProfileOpen, 
    currentUser, 
    updateUserProfile, 
    deleteUserAccount, 
    logout,
    openAuthModal
  } = useAuth();

  const { orders, storeInfo, menu } = useRealtimeDB();
  const { addToCart, setIsCartOpen } = useCart();

  const [activeTab, setActiveTab] = useState('details'); // 'details', 'orders', 'settings'
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!currentUser) return null;

  // Filter orders for this customer by clean 10-digit phone
  const cleanUserPhone = (currentUser.phone || '').replace(/\D/g, '').slice(-10);
  const userOrders = (orders || []).filter(o => {
    const oPhone = (o.customerPhone || o.phone || '').replace(/\D/g, '').slice(-10);
    return oPhone === cleanUserPhone;
  });

  const handleStartEdit = () => {
    setEditName(currentUser.name || '');
    setEditAddress(currentUser.address || '');
    setEditEmail(currentUser.email || '');
    setIsEditing(true);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    const res = await updateUserProfile({
      name: editName.trim() || currentUser.name,
      address: editAddress.trim() || currentUser.address,
      email: editEmail.trim() || currentUser.email,
    });
    setIsSaving(false);
    if (res?.success) {
      setIsEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    await deleteUserAccount();
    setIsDeleting(false);
    setShowDeleteConfirm(false);
  };

  const getOrderStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'delivered') {
      return {
        label: 'Delivered',
        className: 'bg-emerald-50 text-emerald-700 border-emerald-200'
      };
    }
    if (s === 'out' || s === 'out_for_delivery') {
      return {
        label: 'Out for Delivery',
        className: 'bg-sky-50 text-sky-700 border-sky-200'
      };
    }
    if (s === 'preparing' || s === 'cooking') {
      return {
        label: 'Cooking / Preparing',
        className: 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'
      };
    }
    return {
      label: s ? s.charAt(0).toUpperCase() + s.slice(1) : 'Order Placed',
      className: 'bg-stone-100 text-stone-700 border-stone-200'
    };
  };

  // Dukandar / Support contacts
  const storePhone = storeInfo?.ownerPhone || '7023963189';
  const rawWhatsApp = storeInfo?.socials?.whatsapp || '7023963189';
  const cleanWhatsApp = String(rawWhatsApp).replace(/\D/g, '').slice(-10);
  const whatsappUrl = `https://wa.me/91${cleanWhatsApp}?text=${encodeURIComponent('Hi Shawarma Nights, I need help with my order')}`;
  const storeHours = storeInfo?.timing || RESTAURANT_INFO?.timing || 'Open Daily: 12:00 PM – 04:00 AM';

  return (
    <AnimatePresence>
      {isProfileOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsProfileOpen(false)}
            className="fixed inset-0 bg-stone-900/60 transition-opacity"
          />

          {/* Clean User Profile Modal */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            transition={{ type: 'spring', damping: 26, stiffness: 280 }}
            className="relative w-full max-w-xl bg-[#FFFDF9] rounded-3xl shadow-2xl border border-stone-200 overflow-hidden z-10 flex flex-col max-h-[90vh]"
          >
            {/* Header: Clean, elegant "My Profile" with user name, phone, and close button */}
            <div className="flex items-center justify-between p-5 sm:p-6 border-b border-stone-100 bg-[#FFFDF9] shrink-0">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[#DC2626] text-white flex items-center justify-center font-black text-lg sm:text-xl shadow-sm shrink-0">
                  {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg sm:text-xl font-black text-stone-900 tracking-tight">
                      My Profile
                    </h2>
                    {currentUser.phoneVerified && currentUser.phone ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full shrink-0">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full shrink-0">
                        <AlertCircle className="w-3 h-3 text-amber-600" />
                        Phone Unverified
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-stone-500 font-medium truncate mt-0.5">
                    <span className="font-bold text-stone-800">{currentUser.name}</span>
                    <span className="mx-1.5 text-stone-300">•</span>
                    {currentUser.phone ? (
                      <span className="font-mono text-stone-600">+91 {currentUser.phone}</span>
                    ) : (
                      <span className="text-amber-700 font-bold">No mobile added</span>
                    )}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsProfileOpen(false)}
                className="w-9 h-9 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 hover:text-stone-800 flex items-center justify-center transition-all cursor-pointer shrink-0"
                title="Close"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Simple Tab Navigation */}
            <div className="px-5 sm:px-6 pt-3.5 pb-3 bg-[#FFFDF9] border-b border-stone-100 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
              {[
                { key: 'details', label: 'Profile & Address', icon: User },
                { key: 'orders', label: `My Orders (${userOrders.length})`, icon: ShoppingBag },
                { key: 'settings', label: 'Help & Sign Out', icon: HelpCircle },
              ].map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => {
                      setActiveTab(tab.key);
                      sounds.playTick();
                    }}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 border cursor-pointer ${
                      isActive
                        ? 'bg-[#DC2626] text-white border-[#DC2626] shadow-sm'
                        : 'bg-[#FAF7F2] text-stone-600 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-stone-500'}`} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Success Notification Banner */}
            {saveSuccess && (
              <div className="mx-5 sm:mx-6 mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-bounce">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Profile details updated successfully!</span>
              </div>
            )}

            {/* Scrollable Content Body */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">

              {/* ======================================================== */}
              {/* TAB 1: PROFILE & ADDRESS DETAILS                         */}
              {/* ======================================================== */}
              {activeTab === 'details' && (
                <div className="space-y-4">
                  {!isEditing ? (
                    <div className="space-y-4">
                      <div className="bg-[#FAF7F2] rounded-2xl border border-stone-200 p-4 space-y-4">
                        {/* Full Name */}
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-white border border-stone-200 flex items-center justify-center text-stone-500 shrink-0 mt-0.5">
                            <User className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                              Full Name
                            </span>
                            <p className="text-sm font-bold text-stone-900 mt-0.5">
                              {currentUser.name || 'Not provided'}
                            </p>
                          </div>
                        </div>

                        {/* Phone */}
                        <div className="flex items-start gap-3 pt-3 border-t border-stone-200/70">
                          <div className="w-8 h-8 rounded-lg bg-white border border-stone-200 flex items-center justify-center text-stone-500 shrink-0 mt-0.5">
                            <Phone className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                              Phone Number {currentUser.phoneVerified && currentUser.phone ? '(SMS Verified)' : '(Verification Pending)'}
                            </span>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-sm font-mono font-bold text-stone-900">
                                {currentUser.phone ? `+91 ${currentUser.phone}` : 'Not provided'}
                              </span>
                              {currentUser.phoneVerified && currentUser.phone ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                                  Verified
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => { setIsProfileOpen(false); openAuthModal('phone'); }}
                                  className="inline-flex items-center gap-1 text-[10px] font-extrabold text-[#DC2626] bg-red-50 hover:bg-red-100 border border-red-200 px-2.5 py-0.5 rounded-full transition-colors cursor-pointer"
                                >
                                  Verify OTP
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Delivery Address */}
                        <div className="flex items-start gap-3 pt-3 border-t border-stone-200/70">
                          <div className="w-8 h-8 rounded-lg bg-white border border-stone-200 flex items-center justify-center text-stone-500 shrink-0 mt-0.5">
                            <MapPin className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                              Delivery Address
                            </span>
                            <p className="text-sm font-medium text-stone-800 mt-0.5 leading-relaxed">
                              {currentUser.address || (
                                <span className="text-stone-400 italic">No delivery address saved yet</span>
                              )}
                            </p>
                          </div>
                        </div>

                        {/* Email Address */}
                        <div className="flex items-start gap-3 pt-3 border-t border-stone-200/70">
                          <div className="w-8 h-8 rounded-lg bg-white border border-stone-200 flex items-center justify-center text-stone-500 shrink-0 mt-0.5">
                            <Mail className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                              Email Address
                            </span>
                            <p className="text-sm font-medium text-stone-800 mt-0.5">
                              {currentUser.email || (
                                <span className="text-stone-400 italic">No email provided</span>
                              )}
                            </p>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleStartEdit}
                        className="w-full py-3 rounded-xl bg-stone-900 hover:bg-[#DC2626] text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
                      >
                        <Edit3 className="w-4 h-4" />
                        <span>Edit Details</span>
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleSaveProfile} className="space-y-4 bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
                      <div>
                        <label className="text-[11px] font-black text-stone-700 uppercase tracking-wider block mb-1">
                          Full Name
                        </label>
                        <input
                          type="text"
                          required
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          placeholder="Your full name"
                          className="w-full bg-[#FAF7F2] border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-stone-900 focus:outline-none focus:border-[#DC2626] focus:ring-1 focus:ring-[#DC2626]"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-black text-stone-700 uppercase tracking-wider block mb-1">
                          Mobile Number
                        </label>
                        {currentUser.phoneVerified && currentUser.phone ? (
                          <div className="flex items-center justify-between bg-[#F5F2EC] border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-stone-500">
                            <span>+91 {currentUser.phone}</span>
                            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-sans font-bold border border-emerald-200">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                              Verified
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between bg-amber-50/70 border border-amber-200 rounded-xl px-3.5 py-2.5 text-xs">
                            <span className="font-mono font-bold text-amber-900">
                              {currentUser.phone ? `+91 ${currentUser.phone}` : 'No phone linked'}
                            </span>
                            <button
                              type="button"
                              onClick={() => { setIsProfileOpen(false); openAuthModal('phone'); }}
                              className="text-[10px] font-extrabold text-[#DC2626] hover:underline"
                            >
                              Verify OTP
                            </button>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="text-[11px] font-black text-stone-700 uppercase tracking-wider block mb-1">
                          Delivery Address
                        </label>
                        <textarea
                          rows={3}
                          required
                          value={editAddress}
                          onChange={(e) => setEditAddress(e.target.value)}
                          placeholder="Flat/House No, Building, Street, Area, Landmark..."
                          className="w-full bg-[#FAF7F2] border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-stone-900 focus:outline-none focus:border-[#DC2626] focus:ring-1 focus:ring-[#DC2626] resize-none leading-relaxed"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-black text-stone-700 uppercase tracking-wider block mb-1">
                          Email Address (Optional)
                        </label>
                        <input
                          type="email"
                          value={editEmail}
                          onChange={(e) => setEditEmail(e.target.value)}
                          placeholder="yourname@example.com"
                          className="w-full bg-[#FAF7F2] border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-stone-900 focus:outline-none focus:border-[#DC2626] focus:ring-1 focus:ring-[#DC2626]"
                        />
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setIsEditing(false)}
                          className="flex-1 py-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isSaving}
                          className="flex-1 py-3 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white font-black text-xs shadow-md flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-70"
                        >
                          {isSaving ? (
                            <span>Saving...</span>
                          ) : (
                            <>
                              <Check className="w-4 h-4" />
                              <span>Save Changes</span>
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {/* ======================================================== */}
              {/* TAB 2: MY ORDERS WITH STATUS & REORDER                   */}
              {/* ======================================================== */}
              {activeTab === 'orders' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-black text-stone-900">Order History</h4>
                      <p className="text-xs text-stone-500">Aapke sabhi purane orders ki list</p>
                    </div>
                    <span className="text-xs font-extrabold text-[#DC2626] bg-red-50 px-2.5 py-1 rounded-full border border-red-200">
                      {userOrders.length} {userOrders.length === 1 ? 'Order' : 'Orders'}
                    </span>
                  </div>

                  {userOrders.length === 0 ? (
                    <div className="bg-[#FAF7F2] border border-stone-200 rounded-2xl p-8 text-center space-y-3">
                      <div className="w-12 h-12 mx-auto rounded-full bg-stone-100 flex items-center justify-center text-stone-400">
                        <ShoppingBag className="w-6 h-6" />
                      </div>
                      <h5 className="font-bold text-stone-800 text-sm">No orders yet</h5>
                      <p className="text-xs text-stone-500 max-w-sm mx-auto">
                        You haven't placed any orders with this phone number yet. Explore our mouth-watering shawarmas and platters!
                      </p>
                      <button
                        onClick={() => {
                          setIsProfileOpen(false);
                          document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="px-5 py-2.5 bg-[#DC2626] hover:bg-[#B91C1C] text-white rounded-xl font-black text-xs shadow-md transition-colors cursor-pointer inline-flex items-center gap-2"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>Browse Menu</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {userOrders.map((order, idx) => {
                        const statusBadge = getOrderStatusBadge(order.status);
                        const orderTotal = order.grandTotal || order.total || order.totalAmount || 0;
                        return (
                          <div 
                            key={order.orderId || order.id || idx}
                            className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs space-y-3"
                          >
                            {/* Top bar: Order ID, Date/Time, Status Badge */}
                            <div className="flex items-center justify-between border-b border-stone-100 pb-2.5 text-xs">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono font-black text-stone-900">
                                  #{order.orderId || order.id}
                                </span>
                                <span className="text-stone-400 font-medium">
                                  • {order.placedAt || order.createdAt || 'Recent'}
                                </span>
                              </div>

                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${statusBadge.className}`}>
                                {statusBadge.label}
                              </span>
                            </div>

                            {/* Items List */}
                            <div className="space-y-1.5 text-xs text-stone-700">
                              {(order.items || []).map((it, i) => (
                                <div key={i} className="flex justify-between items-center py-0.5">
                                  <span className="font-medium text-stone-800">
                                    <span className="font-bold text-stone-900">{it.quantity || it.qty || 1}×</span> {it.name}
                                    {(it.bread || it.selectedBread) && (
                                      <span className="text-[10px] text-stone-400 block font-normal">
                                        {it.bread || it.selectedBread}
                                      </span>
                                    )}
                                  </span>
                                  <span className="font-mono font-semibold text-stone-900">
                                    ₹{(it.unitPrice || it.price || 0) * (it.quantity || it.qty || 1)}
                                  </span>
                                </div>
                              ))}
                            </div>

                            {/* Delivery OTP Badge for Active Orders */}
                            {order.deliveryOtp && order.status !== 'delivered' && (
                              <div className="bg-amber-50 border border-amber-200/90 rounded-xl p-3 flex items-center justify-between">
                                <div>
                                  <div className="text-[10px] font-black text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                                    <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                                    <span>Delivery Confirmation OTP</span>
                                  </div>
                                  <div className="text-[11px] text-amber-700 mt-0.5">Rider ko order lene ke baad dein</div>
                                </div>
                                <div className="text-xl font-black font-mono tracking-widest text-[#DC2626] bg-white px-3 py-1 rounded-lg border border-amber-300 shadow-xs">
                                  {order.deliveryOtp}
                                </div>
                              </div>
                            )}

                            {/* Footer with Total */}
                            <div className="flex items-center justify-between pt-2.5 border-t border-stone-100 text-xs">
                              <div>
                                <span className="text-[10px] font-bold text-stone-400 block uppercase tracking-wider">
                                  Total Amount
                                </span>
                                <span className="font-black text-stone-900 text-sm">
                                  ₹{orderTotal}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ======================================================== */}
              {/* TAB 3: HELP & SIGN OUT / DELETE ACCOUNT                  */}
              {/* ======================================================== */}
              {activeTab === 'settings' && (
                <div className="space-y-4">
                  {/* Customer Care & Support Section */}
                  <div className="bg-white rounded-2xl border border-stone-200 p-4 sm:p-5 shadow-xs space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-red-50 text-[#DC2626] flex items-center justify-center shrink-0">
                        <HelpCircle className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-stone-900">Customer Care & Support</h4>
                        <p className="text-xs text-stone-500">Need help with an order or inquiry? We're available.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50 text-emerald-800 text-xs font-bold transition-all flex items-center gap-2.5 cursor-pointer"
                      >
                        <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                          <MessageCircle className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <span className="block font-black text-emerald-900">WhatsApp Support</span>
                          <span className="text-[10px] text-emerald-700 block truncate">+91 {cleanWhatsApp}</span>
                        </div>
                      </a>

                      <a
                        href={`tel:+91${storePhone.replace(/\D/g, '').slice(-10)}`}
                        className="p-3 rounded-xl border border-stone-200 bg-[#FAF7F2] hover:bg-stone-100 text-stone-800 text-xs font-bold transition-all flex items-center gap-2.5 cursor-pointer"
                      >
                        <div className="w-7 h-7 rounded-lg bg-stone-800 text-white flex items-center justify-center shrink-0">
                          <Phone className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <span className="block font-black text-stone-900">Call Kitchen Hotline</span>
                          <span className="text-[10px] text-stone-500 block truncate">+91 {storePhone}</span>
                        </div>
                      </a>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-stone-500 pt-1 border-t border-stone-100">
                      <Clock className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <span>{storeHours}</span>
                    </div>
                  </div>

                  {/* Sign Out Card */}
                  <div className="bg-white rounded-2xl border border-stone-200 p-4 sm:p-5 shadow-xs flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-stone-100 text-stone-700 flex items-center justify-center shrink-0">
                        <LogOut className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-black text-stone-900">Sign Out</h4>
                        <p className="text-xs text-stone-500 truncate">Sign out of this session on your browser</p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setIsProfileOpen(false);
                        logout();
                      }}
                      className="px-4 py-2 rounded-xl border border-stone-300 hover:bg-stone-50 text-stone-800 font-bold text-xs transition-all cursor-pointer shrink-0"
                    >
                      Sign Out
                    </button>
                  </div>

                  {/* Delete Account Card */}
                  <div className="bg-red-50/50 rounded-2xl border border-red-200 p-4 sm:p-5 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-red-900">Delete Account</h4>
                        <p className="text-xs text-red-700">Permanently delete your account and personal details</p>
                      </div>
                    </div>

                    {!showDeleteConfirm ? (
                      <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="w-full py-2.5 rounded-xl bg-white border border-red-300 text-red-600 hover:bg-red-600 hover:text-white font-bold text-xs transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete My Account</span>
                      </button>
                    ) : (
                      <div className="p-3.5 rounded-xl bg-white border border-red-300 space-y-2.5">
                        <p className="text-xs font-bold text-stone-800">
                          Are you sure you want to permanently delete your account? This action cannot be undone.
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setShowDeleteConfirm(false)}
                            disabled={isDeleting}
                            className="flex-1 py-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs transition-colors cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleDeleteAccount}
                            disabled={isDeleting}
                            className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-black text-xs shadow-xs transition-colors cursor-pointer disabled:opacity-70"
                          >
                            {isDeleting ? 'Deleting...' : 'Yes, Delete'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>

            {/* Footer note */}
            <div className="p-3.5 bg-[#FAF7F2] border-t border-stone-200 text-center text-[11px] font-semibold text-stone-400 shrink-0">
              Shawarma Nights • Fresh Charcoal Flavors
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
