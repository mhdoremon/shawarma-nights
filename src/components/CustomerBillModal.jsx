import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Printer, 
  Download, 
  CheckCircle2, 
  Flame, 
  Clock, 
  MapPin, 
  Phone, 
  ShieldCheck, 
  Receipt,
  Share2
} from 'lucide-react';

export default function CustomerBillModal({ order, isOpen, onClose }) {
  const printAreaRef = useRef(null);

  if (!isOpen || !order) return null;

  const orderId = order.orderId || order.id || 'SN-ORD';
  const orderDate = order.placedAt || order.createdAt || new Date().toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  const customerName = order.customerName || order.name || 'Valued Customer';
  const customerPhone = order.customerPhone || order.phone || '';
  const deliveryAddress = order.address || order.deliveryAddress || 'Churu, Rajasthan';
  const paymentMethod = (order.paymentMethod || 'UPI').toUpperCase();
  const paymentStatus = (order.paymentStatus || (paymentMethod === 'COD' ? 'Pending Cash' : 'Paid')).toUpperCase();
  const items = order.items || [];
  
  // Calculate pricing values
  const grandTotal = Number(order.grandTotal || order.total || order.totalAmount || 0);
  const deliveryFee = order.deliveryFee !== undefined ? Number(order.deliveryFee) : (grandTotal >= 499 ? 0 : 40);
  const taxes = order.taxes !== undefined ? Number(order.taxes) : 0;
  const discount = order.discount !== undefined ? Number(order.discount) : 0;
  const couponCode = order.couponCode || order.coupon || null;

  // Compute item subtotal
  const itemsSubtotal = items.reduce((sum, item) => {
    const qty = Number(item.quantity || item.qty || 1);
    const price = Number(item.unitPrice || item.price || 0);
    return sum + (price * qty);
  }, 0);

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    const text = `Shawarma Nights Tax Invoice #${orderId}\nTotal: ₹${grandTotal}\nPayment: ${paymentMethod} (${paymentStatus})\nThank you for ordering with us!`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Shawarma Nights Invoice #${orderId}`,
          text: text,
        });
      } catch (err) {
        // Ignored or canceled
      }
    } else {
      navigator.clipboard?.writeText(text);
      alert('Invoice details copied to clipboard!');
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white print:static">
        
        {/* Printable Invoice Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          className="bg-white border border-stone-200 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden my-auto print:shadow-none print:border-none print:w-full print:max-w-none print:rounded-none"
        >
          {/* Action Header (Hidden in Print) */}
          <div className="p-4 sm:p-5 bg-stone-900 text-white flex items-center justify-between print:hidden">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-red-600 flex items-center justify-center text-white">
                <Receipt className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black tracking-tight text-white flex items-center gap-2">
                  <span>Customer Tax Invoice</span>
                  <span className="text-[10px] bg-red-600/80 px-2 py-0.5 rounded font-mono font-bold">
                    Official
                  </span>
                </h3>
                <p className="text-[11px] text-stone-300">Order #{orderId}</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handlePrint}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                title="Print or Save PDF"
              >
                <Printer className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Print / PDF</span>
              </button>

              <button
                onClick={handleShare}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
                title="Share Invoice"
              >
                <Share2 className="w-4 h-4" />
              </button>

              <button
                onClick={onClose}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-red-600 text-white transition-all cursor-pointer ml-1"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Printable Body */}
          <div ref={printAreaRef} className="p-5 sm:p-7 space-y-5 text-stone-800 bg-[#FFFDF9] print:bg-white print:p-8">
            
            {/* Restaurant Official Header */}
            <div className="text-center pb-4 border-b-2 border-dashed border-stone-200 space-y-1.5">
              <div className="inline-flex items-center justify-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-lg bg-[#DC2626] text-white flex items-center justify-center font-black">
                  <Flame className="w-4 h-4 fill-white" />
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight font-serif uppercase">
                  SHAWARMA NIGHTS
                </h1>
              </div>

              <p className="text-xs font-medium text-stone-600">
                Artisanal Charcoal Spit Kitchen & Lebanese Rotisserie
              </p>
              <p className="text-[11px] text-stone-500">
                Station Road, Near Railway Circle, Churu (Raj.) — 331001
              </p>
              <div className="flex items-center justify-center gap-3 text-[10px] text-stone-500 pt-1 font-mono flex-wrap">
                <span>FSSAI Lic: <strong>22223074000189</strong></span>
                <span>•</span>
                <span>Ph: <strong>+91 98765-43210</strong></span>
                <span>•</span>
                <span>Unit of: <strong>VK Robotics</strong></span>
              </div>
            </div>

            {/* Invoice & Customer Meta Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-white p-3.5 rounded-2xl border border-stone-200/80 shadow-2xs">
              <div>
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                  Invoice / Order ID
                </span>
                <span className="font-mono font-black text-stone-900 text-sm">
                  #{orderId}
                </span>
                <span className="text-[11px] text-stone-500 block mt-0.5">
                  {orderDate}
                </span>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                  Billed To (Customer)
                </span>
                <span className="font-bold text-stone-900 block truncate">
                  {customerName}
                </span>
                {customerPhone && (
                  <span className="font-mono text-stone-600 block text-[11px]">
                    {customerPhone.startsWith('+91') ? customerPhone : `+91 ${customerPhone}`}
                  </span>
                )}
              </div>

              <div className="col-span-2 pt-2 border-t border-stone-100 flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                    Delivery Destination
                  </span>
                  <p className="text-[11px] text-stone-700 font-medium leading-snug truncate">
                    {deliveryAddress}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                    Payment Status
                  </span>
                  <span className={`inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${
                    paymentStatus.includes('PAID') 
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                      : 'bg-amber-100 text-amber-900 border border-amber-300'
                  }`}>
                    <CheckCircle2 className="w-3 h-3" />
                    {paymentMethod} • {paymentStatus}
                  </span>
                </div>
              </div>
            </div>

            {/* Itemized Table */}
            <div>
              <div className="flex items-center justify-between text-[11px] font-black text-stone-500 uppercase tracking-wider pb-2 border-b border-stone-200">
                <span className="flex-1">Item Description</span>
                <span className="w-12 text-center">Qty</span>
                <span className="w-16 text-right">Price</span>
                <span className="w-16 text-right">Amount</span>
              </div>

              <div className="divide-y divide-stone-100 py-1">
                {items.length === 0 ? (
                  <div className="py-4 text-center text-xs text-stone-400 font-medium">
                    No item breakdown found for this order.
                  </div>
                ) : (
                  items.map((item, idx) => {
                    const qty = Number(item.quantity || item.qty || 1);
                    const price = Number(item.unitPrice || item.price || 0);
                    const lineTotal = price * qty;
                    const bread = item.bread?.name || item.bread || item.selectedBread;
                    const spice = item.spiciness || item.spiceLevel;
                    const addons = Array.isArray(item.addons) ? item.addons : [];

                    return (
                      <div key={idx} className="py-2.5 flex items-start justify-between text-xs gap-2">
                        <div className="flex-1 min-w-0 pr-2">
                          <div className="font-bold text-stone-900 leading-snug flex items-center gap-1.5 flex-wrap">
                            <span>{item.name}</span>
                            {(item?.isCombo || item?.comboItems) && (
                              <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[9px] font-black px-1.5 py-0.2 rounded uppercase">
                                COMBO FEAST
                              </span>
                            )}
                          </div>
                          
                          {/* Bundled Items if Combo */}
                          {(Array.isArray(item?.comboItems) && item.comboItems.length > 0) && (
                            <div className="text-[10px] text-stone-600 font-medium mt-0.5">
                              Includes: {item.comboItems.map(c => c.name).join(' • ')}
                            </div>
                          )}
                          
                          {/* Customization Details */}
                          {(bread || spice || addons.length > 0) && (
                            <div className="text-[10px] text-stone-500 mt-0.5 space-y-0.5">
                              {bread && (
                                <div className="text-stone-600">
                                  • Wrap: <span className="font-semibold text-stone-800">{bread}</span>
                                </div>
                              )}
                              {spice && (
                                <div className="text-orange-700">
                                  • Spice: <span className="font-semibold">{spice}</span>
                                </div>
                              )}
                              {addons.length > 0 && (
                                <div className="text-stone-600">
                                  • Addons: {addons.map(a => typeof a === 'object' ? `${a.name}${a.price ? ` (+₹${a.price})` : ''}` : a).join(', ')}
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="w-12 text-center font-mono font-bold text-stone-700">
                          {qty}
                        </div>

                        <div className="w-16 text-right font-mono text-stone-600">
                          ₹{price}
                        </div>

                        <div className="w-16 text-right font-mono font-bold text-stone-900">
                          ₹{lineTotal}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Calculations Breakdown */}
            <div className="bg-stone-50/80 rounded-2xl p-4 border border-stone-200/70 space-y-2 text-xs">
              <div className="flex justify-between text-stone-600">
                <span>Items Subtotal</span>
                <span className="font-mono font-semibold">₹{itemsSubtotal || grandTotal}</span>
              </div>

              <div className="flex justify-between text-stone-600">
                <span>Delivery Charge</span>
                <span className="font-mono font-semibold">
                  {deliveryFee === 0 ? (
                    <span className="text-emerald-700 font-bold uppercase text-[11px]">FREE</span>
                  ) : (
                    `₹${deliveryFee}`
                  )}
                </span>
              </div>

              {discount > 0 && (
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>Promo Discount {couponCode ? `(${couponCode})` : ''}</span>
                  <span className="font-mono font-bold">-₹{discount}</span>
                </div>
              )}

              {taxes > 0 && (
                <div className="flex justify-between text-stone-600">
                  <span>Taxes & Kitchen Packaging</span>
                  <span className="font-mono font-semibold">₹{taxes}</span>
                </div>
              )}

              <div className="pt-2.5 border-t border-stone-200 flex justify-between items-baseline">
                <div>
                  <span className="text-sm font-black text-stone-900 block">
                    GRAND TOTAL
                  </span>
                  <span className="text-[10px] text-stone-400">
                    Inclusive of all applicable taxes
                  </span>
                </div>
                <span className="text-2xl font-black font-mono text-[#DC2626]">
                  ₹{grandTotal}
                </span>
              </div>
            </div>

            {/* Delivery Confirmation OTP Notice if applicable */}
            {order.deliveryOtp && (
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wider block">
                    Delivery Verification OTP
                  </span>
                  <span className="text-[11px] text-amber-700">Verified upon doorstep arrival</span>
                </div>
                <span className="font-mono font-black text-lg text-amber-950 bg-white px-2.5 py-0.5 rounded border border-amber-300">
                  {order.deliveryOtp}
                </span>
              </div>
            )}

            {/* Bill Footer & Assurance */}
            <div className="text-center pt-2 border-t-2 border-dashed border-stone-200 space-y-1">
              <p className="text-xs font-black text-stone-800">
                Thank you for choosing Shawarma Nights!
              </p>
              <p className="text-[11px] text-stone-500">
                Slow-roasted on charcoal spits, wrapped with love.
              </p>
              <p className="text-[10px] text-stone-400 font-mono pt-1">
                This is a computer-generated digital invoice • www.churuone.in
              </p>
            </div>

          </div>

          {/* Action Footer (Print Friendly Button) */}
          <div className="p-4 bg-stone-100 border-t border-stone-200 flex items-center justify-between gap-3 print:hidden">
            <button
              onClick={handlePrint}
              className="flex-1 py-2.5 px-4 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Download Tax Receipt</span>
            </button>

            <button
              onClick={onClose}
              className="py-2.5 px-5 rounded-xl bg-white hover:bg-stone-200 text-stone-700 text-xs font-bold border border-stone-300 transition-all cursor-pointer"
            >
              Close
            </button>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
