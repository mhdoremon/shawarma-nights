import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Camera, Phone, Mail, Calendar, CheckCircle2, ShoppingBag, LogOut, ArrowRight, ShieldCheck, AlertCircle, Sparkles, MapPin, Loader2 } from 'lucide-react';
import BottomNavBar from '../../components/BottomNavBar';

export default function CustomerProfilePage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [customer, setCustomer] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('churuone_customer_user') || localStorage.getItem('churuone_user') || 'null');
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem('churuone_token') || localStorage.getItem('churuone_sso_token') || '';
  });

  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoMessage, setPhotoMessage] = useState({ text: '', type: 'info' });
  const [customerOrders, setCustomerOrders] = useState([]);

  // Sync state if user changes
  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem('churuone_customer_user') || localStorage.getItem('churuone_user') || 'null');
      setCustomer(u);
    } catch {}
  }, []);

  // Load customer orders from localStorage or API
  useEffect(() => {
    if (!customer?.phone) return;
    try {
      const storedOrders = JSON.parse(localStorage.getItem('churuone_orders') || '[]');
      const filtered = storedOrders.filter(o => o.phone === customer.phone || o.customerPhone === customer.phone);
      setCustomerOrders(filtered);
    } catch {}
  }, [customer?.phone]);

  // Handle Photo File Upload & Canvas Compression
  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setPhotoMessage({ text: 'Kripya valid photo (JPEG, PNG, WebP) chunein.', type: 'error' });
      return;
    }

    setIsUploadingPhoto(true);
    setPhotoMessage({ text: 'Photo compress aur upload ho rahi hai...', type: 'info' });

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = async () => {
        try {
          // Canvas compression: max 500x500px, quality 0.8
          const canvas = document.createElement('canvas');
          const maxDim = 500;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // Export compressed data URI
          const compressedDataUri = canvas.toDataURL('image/jpeg', 0.82);

          // Dispatch to server
          const phone = customer?.phone || '';
          const res = await fetch('/api/auth/customer/upload-avatar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              phone,
              token,
              avatarUrl: compressedDataUri
            })
          });

          const data = await res.json();
          setIsUploadingPhoto(false);

          if (data.success && data.user) {
            const updated = { ...customer, ...data.user, picture: compressedDataUri, photoURL: compressedDataUri };
            setCustomer(updated);
            localStorage.setItem('churuone_customer_user', JSON.stringify(updated));
            localStorage.setItem('churuone_user', JSON.stringify(updated));
            // Trigger instant navbar update
            window.dispatchEvent(new Event('churuone_user_updated'));
            setPhotoMessage({ text: 'Profile photo safaltapoorvak update ho gayi!', type: 'success' });
          } else {
            // Local fallback if offline
            const updated = { ...customer, picture: compressedDataUri, photoURL: compressedDataUri };
            setCustomer(updated);
            localStorage.setItem('churuone_customer_user', JSON.stringify(updated));
            localStorage.setItem('churuone_user', JSON.stringify(updated));
            window.dispatchEvent(new Event('churuone_user_updated'));
            setPhotoMessage({ text: 'Photo aapke device par save ho gayi!', type: 'success' });
          }
        } catch (err) {
          setIsUploadingPhoto(false);
          setPhotoMessage({ text: 'Photo process nahi ho payi. Dobara koshish karein.', type: 'error' });
        }
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSignOut = () => {
    localStorage.removeItem('churuone_customer_user');
    localStorage.removeItem('churuone_user');
    localStorage.removeItem('churuone_token');
    localStorage.removeItem('churuone_sso_token');
    window.dispatchEvent(new Event('churuone_user_updated'));
    navigate('/');
  };

  const avatarUrl = customer?.picture || customer?.photoURL || customer?.avatar;
  const initials = (customer?.name || 'Customer').charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-[#FFFDF9] text-zinc-900 font-sans pb-24 selection:bg-amber-400 selection:text-zinc-950">
      
      {/* 1. TOP HEADER */}
      <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-xl border-b border-zinc-200/80 px-4 py-3 sm:py-4">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-zinc-950 text-white flex items-center justify-center font-bold text-xs shadow-sm">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-base font-black tracking-tight text-zinc-950 leading-none">
                ChuruOne Profile
              </h1>
              <p className="text-[10px] text-zinc-500 font-medium">Aapka Universal Social Commerce Account</p>
            </div>
          </div>

          <button
            onClick={() => navigate('/')}
            className="text-xs font-bold text-zinc-500 hover:text-zinc-950 px-3 py-1.5 rounded-full border border-zinc-200 hover:border-zinc-300 transition-colors cursor-pointer"
          >
            ← Shop Feed
          </button>
        </div>
      </header>

      {/* 2. MAIN CONTAINER */}
      <main className="max-w-xl mx-auto px-4 py-6 space-y-6">

        {/* If user not logged in */}
        {!customer ? (
          <div className="bg-white rounded-3xl p-8 border border-zinc-200 shadow-xl text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto shadow-inner">
              <User className="w-8 h-8 stroke-[1.5]" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-zinc-950">
                Apna ChuruOne Account Kholein
              </h2>
              <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto leading-relaxed">
                Shawarma Nights, Skyline Outfits aur Nash Studio par 1-tap shopping aur direct live orders ke liye apna customer account login karein.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2 justify-center">
              <button
                onClick={() => navigate('/auth?role=customer&mode=login')}
                className="px-6 py-3 bg-zinc-950 hover:bg-black text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>Sign In Karein</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => navigate('/auth?role=customer&mode=register')}
                className="px-6 py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer"
              >
                Naya Account Banayein
              </button>
            </div>
          </div>
        ) : (
          /* Logged In Customer Profile Card */
          <>
            {/* Header / Avatar Profile Hero */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-zinc-200 shadow-xl flex flex-col items-center text-center relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-amber-500 via-red-500 to-amber-500" />

              {/* Avatar with Camera Trigger */}
              <div className="relative mb-3 group">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden bg-zinc-100 ring-4 ring-amber-400/40 shadow-lg flex items-center justify-center">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={customer.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-amber-500 to-red-600 text-white flex items-center justify-center text-3xl font-black">
                      {initials}
                    </div>
                  )}
                </div>

                {/* Hidden File Input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  className="hidden"
                />

                {/* Camera Click Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  title="Profile photo upload karein"
                  className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-zinc-950 hover:bg-black text-white flex items-center justify-center shadow-lg border-2 border-white transition-transform active:scale-90 cursor-pointer"
                >
                  {isUploadingPhoto ? (
                    <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                  ) : (
                    <Camera className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* User Name & Handle */}
              <h2 className="text-xl sm:text-2xl font-black text-zinc-950 tracking-tight">
                {customer.name || 'ChuruOne Customer'}
              </h2>
              {customer.username && (
                <span className="text-xs font-mono font-semibold text-zinc-500 mt-0.5">
                  @{customer.username}
                </span>
              )}

              {/* Verified Badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold mt-2.5 border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Verified Customer</span>
              </div>

              {/* Photo Upload Tip */}
              <p className="text-[10px] text-zinc-400 mt-3 max-w-xs leading-relaxed">
                Profile photo optional hai. Aap camera icon par tap karke kabhi bhi apni photo badal sakte hain.
              </p>

              {/* Photo Message Toast */}
              {photoMessage.text && (
                <div className={`mt-3 p-2.5 rounded-xl text-xs font-medium flex items-center gap-2 ${
                  photoMessage.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                }`}>
                  <span>{photoMessage.text}</span>
                </div>
              )}
            </div>

            {/* Account Details Card */}
            <div className="bg-white rounded-3xl p-6 border border-zinc-200 shadow-xl space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-zinc-600" />
                <span>Account Information</span>
              </h3>

              <div className="divide-y divide-zinc-100 text-xs">
                {/* Mobile */}
                <div className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5 text-zinc-500">
                    <Phone className="w-4 h-4 text-zinc-400" />
                    <span>Mobile Number</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-bold text-zinc-900">
                    <span>+91 {customer.phone}</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                </div>

                {/* Email */}
                <div className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5 text-zinc-500">
                    <Mail className="w-4 h-4 text-zinc-400" />
                    <span>Email Address</span>
                  </div>
                  <span className="font-semibold text-zinc-900">
                    {customer.email || 'Not Linked'}
                  </span>
                </div>

                {/* DOB */}
                <div className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5 text-zinc-500">
                    <Calendar className="w-4 h-4 text-zinc-400" />
                    <span>Date of Birth</span>
                  </div>
                  <span className="font-semibold text-zinc-900">
                    {customer.dob || 'Not Provided'}
                  </span>
                </div>

                {/* Unique ID */}
                <div className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5 text-zinc-500">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>ChuruOne ID</span>
                  </div>
                  <span className="font-mono text-zinc-700 bg-zinc-100 px-2 py-0.5 rounded text-[11px]">
                    {customer.churuOneId || customer.id || 'CUST-CHURU'}
                  </span>
                </div>
              </div>
            </div>

            {/* Orders Section */}
            <div className="bg-white rounded-3xl p-6 border border-zinc-200 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <ShoppingBag className="w-4 h-4 text-zinc-600" />
                  <span>Recent Orders ({customerOrders.length})</span>
                </h3>
              </div>

              {customerOrders.length === 0 ? (
                <div className="p-4 bg-zinc-50 rounded-2xl text-center text-zinc-500 text-xs">
                  Abhi tak koi order record nahi hai. ChuruOne Feed se dukan dekhein aur order karein!
                </div>
              ) : (
                <div className="space-y-2.5">
                  {customerOrders.slice(0, 5).map((ord, idx) => (
                    <div key={idx} className="p-3 bg-zinc-50 rounded-2xl flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-zinc-900 block">Order #{ord.id || ord.orderId}</span>
                        <span className="text-[10px] text-zinc-500 capitalize">{ord.storeId || 'ChuruOne Store'}</span>
                      </div>
                      <span className="font-black text-zinc-950">₹{ord.total || ord.grandTotal || 0}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sign Out Button */}
            <button
              onClick={handleSignOut}
              className="w-full bg-zinc-100 hover:bg-red-50 hover:text-red-700 text-zinc-700 font-bold py-3.5 rounded-2xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer border border-zinc-200"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out / Switch Account</span>
            </button>
          </>
        )}

      </main>

      {/* Floating Instagram-style navigation dock */}
      <BottomNavBar />

    </div>
  );
}
