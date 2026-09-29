import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRealtimeDB } from '../context/RealtimeContext';
import { motion } from 'framer-motion';
import { User, LogOut, CheckCircle2, ShoppingBag, MapPin, Edit3, Trash2, ShieldAlert } from 'lucide-react';

export default function Profile({ onBack }) {
  const { currentUser, logout } = useAuth();
  const { orders } = useRealtimeDB();
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Fallback states for profile edits (frontend only for demo)
  const [profileData, setProfileData] = useState({
    name: currentUser?.name || 'Guest User',
    phone: currentUser?.phone || '',
    email: currentUser?.email || '',
    address: currentUser?.address || 'No address saved.'
  });

  // Filter out the orders for this user
  const userOrders = orders?.filter(o => o.phone === currentUser?.phone) || [];

  const handleSave = () => {
    setIsEditing(false);
    // In real app, this would dispatch to backend
  };

  const handleLogout = () => {
    logout();
    onBack(); // Return to home view
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="max-w-4xl mx-auto px-4 py-8 sm:py-12"
    >
      <button 
        onClick={onBack}
        className="mb-8 text-sm font-bold text-zinc-500 hover:text-[#DC2626] flex items-center gap-2 transition-colors uppercase tracking-wider"
      >
        ← Back to Shop
      </button>

      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Left Column: Avatar & Quick Actions */}
        <div className="w-full md:w-1/3 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-zinc-200 shadow-sm flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#DC2626] to-orange-500 flex items-center justify-center text-white text-4xl font-black shadow-lg mb-4 ring-4 ring-red-50">
              {profileData.name.charAt(0).toUpperCase()}
            </div>
            <h2 className="text-xl font-black text-zinc-900 mb-1">{profileData.name}</h2>
            <div className="flex items-center justify-center gap-1.5 text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full text-xs font-bold mb-6">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Verified User
            </div>
            
            <div className="w-full h-px bg-zinc-100 mb-6"></div>

            <button 
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-red-50 hover:bg-red-100 text-red-600 font-bold text-sm transition-colors"
            >
              <LogOut className="w-4 h-4" /> Log Out
            </button>
          </div>

          <div className="bg-zinc-900 rounded-3xl p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#DC2626] rounded-full blur-3xl opacity-20 -mr-10 -mt-10"></div>
            <h3 className="text-white font-black text-lg mb-2">Shawarma Rewards</h3>
            <p className="text-zinc-400 text-xs mb-4">You have earned 120 spice points!</p>
            <div className="w-full bg-zinc-800 rounded-full h-2 mb-2">
              <div className="bg-gradient-to-r from-orange-400 to-[#DC2626] h-2 rounded-full w-[60%]"></div>
            </div>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest text-right">60% to free wrap</p>
          </div>
        </div>

        {/* Right Column: Details & Orders */}
        <div className="w-full md:w-2/3 space-y-8">
          
          {/* Profile Details */}
          <div className="bg-white rounded-3xl p-8 border border-zinc-200 shadow-sm relative overflow-hidden">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-2xl font-black text-zinc-900 tracking-tight">Personal Details</h3>
                <p className="text-sm text-zinc-500">Manage your shipping and contact info.</p>
              </div>
              <button 
                onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full font-bold text-xs transition-colors ${
                  isEditing 
                  ? 'bg-zinc-900 text-white hover:bg-zinc-800' 
                  : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                }`}
              >
                {isEditing ? <CheckCircle2 className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                {isEditing ? 'Save Details' : 'Edit'}
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Full Name</label>
                <input 
                  type="text" 
                  value={profileData.name} 
                  onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                  disabled={!isEditing}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm font-bold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#DC2626] disabled:bg-white disabled:border-transparent disabled:px-0 disabled:text-lg transition-all"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Phone Number</label>
                <input 
                  type="text" 
                  value={profileData.phone} 
                  disabled={true}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm font-bold text-zinc-900 disabled:bg-white disabled:border-transparent disabled:px-0 disabled:text-lg transition-all opacity-80"
                />
                {isEditing && <span className="text-[10px] text-[#DC2626] font-bold mt-1 block">Phone number cannot be changed.</span>}
              </div>
              <div>
                <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Email (Optional)</label>
                <input 
                  type="email" 
                  value={profileData.email} 
                  onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                  disabled={!isEditing}
                  placeholder="Not set"
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm font-bold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#DC2626] disabled:bg-white disabled:border-transparent disabled:px-0 disabled:text-lg transition-all"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Delivery Address</label>
                <textarea 
                  value={profileData.address} 
                  onChange={(e) => setProfileData({...profileData, address: e.target.value})}
                  disabled={!isEditing}
                  rows={2}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm font-bold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#DC2626] disabled:bg-white disabled:border-transparent disabled:px-0 disabled:text-lg transition-all resize-none"
                />
              </div>
            </div>
          </div>

          {/* Recent Orders */}
          <div className="bg-white rounded-3xl p-8 border border-zinc-200 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <ShoppingBag className="w-5 h-5 text-[#DC2626]" />
              <h3 className="text-xl font-black text-zinc-900 tracking-tight">Recent Orders</h3>
            </div>
            
            {userOrders.length > 0 ? (
              <div className="space-y-4">
                {userOrders.map((order, idx) => (
                  <div key={order.id || idx} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border border-zinc-100 rounded-2xl hover:border-zinc-200 transition-colors bg-zinc-50/50">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase">Order #{order.id}</span>
                      <h4 className="font-bold text-zinc-900 text-sm mt-0.5">{order.cart?.length} items • ₹{order.total}</h4>
                    </div>
                    <div className="mt-3 sm:mt-0 px-3 py-1 bg-white border border-zinc-200 rounded-full text-xs font-bold capitalize text-zinc-700 shadow-sm">
                      {order.status}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <ShoppingBag className="w-6 h-6 text-zinc-300" />
                </div>
                <p className="text-sm font-bold text-zinc-500">No orders placed yet.</p>
                <button 
                  onClick={onBack}
                  className="mt-4 px-6 py-2 bg-[#DC2626] text-white font-bold rounded-full text-xs shadow-md hover:bg-red-700 transition-colors"
                >
                  Order Now
                </button>
              </div>
            )}
          </div>

          {/* Danger Zone */}
          <div className="bg-red-50 rounded-3xl p-8 border border-red-100">
            <h3 className="text-lg font-black text-red-700 mb-2 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5" /> Danger Zone
            </h3>
            <p className="text-sm text-red-900/80 mb-6 font-medium">Permanently delete your Shawarma Nights account and all associated order history. This action cannot be undone.</p>
            
            {!showDeleteConfirm ? (
              <button 
                onClick={() => setShowDeleteConfirm(true)}
                className="px-6 py-2.5 bg-white border border-red-200 hover:border-red-600 text-red-600 rounded-xl text-xs font-bold transition-all hover:bg-red-600 hover:text-white"
              >
                Delete Account
              </button>
            ) : (
              <div className="bg-white p-4 rounded-2xl border border-red-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <span className="text-sm font-bold text-zinc-900">Are you absolutely sure?</span>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-xs font-bold transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    className="px-4 py-2 bg-[#DC2626] hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-colors shadow-md"
                  >
                    Yes, Delete
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </motion.div>
  );
}
