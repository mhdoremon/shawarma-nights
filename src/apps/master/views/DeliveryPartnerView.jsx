import React, { useState, useMemo } from 'react';
import { useMaster } from '../context/MasterContext';
import { Bike, Phone, MessageCircle, MapPin, CheckCircle2, ShieldCheck, LogOut, Check, X } from 'lucide-react';

export default function DeliveryPartnerView() {
  const { orders, user, logout, verifyDeliveryOtp, showToast } = useMaster();

  const [otpModalOrder, setOtpModalOrder] = useState(null);
  const [deliveryOtpInput, setDeliveryOtpInput] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // Active orders assigned or in transit
  const activeDeliveries = useMemo(() => {
    const list = Array.isArray(orders) ? orders : [];
    return list.filter(o => o.status === 'out_for_delivery' || o.status === 'preparing');
  }, [orders]);

  // Delivered history
  const completedDeliveries = useMemo(() => {
    const list = Array.isArray(orders) ? orders : [];
    return list.filter(o => o.status === 'delivered');
  }, [orders]);

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!deliveryOtpInput.trim()) {
      showToast('Enter 4-digit Delivery OTP', 'error');
      return;
    }

    setIsVerifying(true);
    const res = await verifyDeliveryOtp(otpModalOrder.id, deliveryOtpInput.trim());
    setIsVerifying(false);

    if (res.success) {
      setOtpModalOrder(null);
      setDeliveryOtpInput('');
    } else {
      showToast(res.message || 'Incorrect delivery OTP', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-4 sm:p-6 space-y-6 max-w-2xl mx-auto pb-20">
      
      {/* Top Rider Header */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#DC2626]/10 border border-[#DC2626]/20 text-[#DC2626] flex items-center justify-center">
            <Bike className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <h2 className="text-base font-black text-white">ChuruOne Rider Portal</h2>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Rider Mobile: {user?.phone || 'Active Partner'}
            </p>
          </div>
        </div>

        <button
          onClick={logout}
          className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-white"
          title="Logout"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      {/* Active Orders Assigned */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
          Active Dispatched Deliveries ({activeDeliveries.length})
        </h3>

        {activeDeliveries.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 text-center text-zinc-500 text-xs">
            Abhi koi active delivery order nahi hai. Dukan se order dispatch hone par yahan aayega.
          </div>
        ) : (
          <div className="space-y-4">
            {activeDeliveries.map(ord => {
              const customerName = ord.customer?.name || ord.customerName || 'Customer';
              const customerPhone = ord.customer?.phone || ord.customerPhone || '';

              return (
                <div
                  key={ord.id}
                  className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 space-y-4 shadow-lg"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-sm font-black text-white">
                        #{ord.orderNumber || ord.id?.slice(-4)}
                      </span>
                      <h4 className="text-base font-bold text-zinc-200 mt-0.5">
                        {customerName}
                      </h4>
                    </div>
                    <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-sky-500/10 text-sky-400 border border-sky-500/20">
                      {ord.status}
                    </span>
                  </div>

                  {ord.address && (
                    <div className="flex items-start gap-2 bg-zinc-950 p-3 rounded-2xl border border-zinc-800 text-xs text-zinc-300">
                      <MapPin className="w-4 h-4 text-[#DC2626] shrink-0 mt-0.5" />
                      <span>{ord.address}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-400">Collect Amount:</span>
                    <span className="text-base font-black text-white">
                      ₹{ord.total || ord.grandTotal || 0} ({ord.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Already Paid Online'})
                    </span>
                  </div>

                  {/* Rider Contact Client */}
                  {customerPhone && (
                    <div className="grid grid-cols-2 gap-2">
                      <a
                        href={`tel:${customerPhone}`}
                        className="py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs font-bold flex items-center justify-center gap-1.5"
                      >
                        <Phone className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Call Customer</span>
                      </a>
                      <a
                        href={`https://wa.me/${customerPhone.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs font-bold flex items-center justify-center gap-1.5"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                        <span>WhatsApp</span>
                      </a>
                    </div>
                  )}

                  {/* Mark Delivered Trigger */}
                  <button
                    onClick={() => {
                      setOtpModalOrder(ord);
                      setDeliveryOtpInput('');
                    }}
                    className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Complete Delivery (Enter Customer OTP)</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* DELIVERY OTP VERIFICATION MODAL */}
      {otpModalOrder && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 text-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-base font-black">Verify Delivery OTP</h3>
              <button
                onClick={() => setOtpModalOrder(null)}
                className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-400">
              Ask customer <strong>{otpModalOrder.customer?.name || otpModalOrder.customerName}</strong> for the 4-digit Delivery OTP sent on their phone.
            </p>

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <input
                  type="text"
                  required
                  autoFocus
                  value={deliveryOtpInput}
                  onChange={(e) => setDeliveryOtpInput(e.target.value)}
                  placeholder="e.g. 4821"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-3 text-center text-xl font-black text-white tracking-widest focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isVerifying}
                  className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider"
                >
                  {isVerifying ? 'Verifying...' : 'Confirm & Complete'}
                </button>
                <button
                  type="button"
                  onClick={() => setOtpModalOrder(null)}
                  className="py-3 px-4 rounded-xl bg-zinc-800 text-zinc-300 font-bold text-xs"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
