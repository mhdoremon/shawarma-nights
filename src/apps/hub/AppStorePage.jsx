import React, { useState } from 'react';
import { 
  Download, 
  ExternalLink, 
  Smartphone, 
  Globe, 
  Store, 
  Bike, 
  Zap, 
  ShieldCheck, 
  Check, 
  Star, 
  ChevronRight, 
  HelpCircle, 
  ArrowLeft,
  Sparkles,
  Info,
  Search
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AppStorePage() {
  const [filter, setFilter] = useState('ALL'); // 'ALL' | 'APK' | 'WEB'
  const [searchQuery, setSearchQuery] = useState('');

  const apps = [
    {
      id: 'otp-relay',
      name: 'ChuruOne OTP Relay (Lite)',
      developer: 'ChuruOne Technologies • Communication & SMS',
      type: 'APK',
      badge: 'NEW • 1.2 MB',
      rating: '4.9',
      reviewCount: '128 reviews',
      size: '1.2 MB',
      version: 'v1.0.0 (Android 6.0+)',
      icon: <Zap className="w-7 h-7 text-[#DC2626]" />,
      iconBg: 'bg-red-50',
      description: 'Dukan ke customer login OTP aur order SMS bhejne ke liye ultra-lightweight gateway app. Family ke kisi bhi Android phone me install karein — isme dukan ka private data nahi dikhta, sirf background me customer OTP send karta hai.',
      features: [
        'Dukan / Store ID configuration (e.g. shawarma, pizza)',
        'Explicit User Consent Checkbox (सहमति टिक बॉक्स)',
        '24/7 Foreground Service (Android never kills it)',
        'Real-time live sent OTP feed & test SMS button'
      ],
      downloadUrl: '/otp-relay.apk',
      downloadLabel: 'DOWNLOAD APK (1.2 MB)',
      isApk: true,
      popular: true
    },
    {
      id: 'master-apk',
      name: 'ChuruOne Master Dukandar OS',
      developer: 'ChuruOne Technologies • Business POS',
      type: 'APK',
      badge: 'FULL SUITE • 3.5 MB',
      rating: '5.0',
      reviewCount: '520 reviews',
      size: '3.5 MB',
      version: 'v2.1.0 (Android 7.0+)',
      icon: <Store className="w-7 h-7 text-amber-600" />,
      iconBg: 'bg-amber-50',
      description: 'Complete Android Master App for store owners. Real-time kitchen order queue, progressive order action buttons, kitchen alert chimes, menu photo upload, deals manager aur full SMS gateway engine.',
      features: [
        'Progressive order workflow: Accept -> Kitchen -> Dispatch -> Deliver',
        'Kitchen alert chime audio notifications',
        'Direct 1-tap customer call & Google Maps navigation',
        'Built-in SMS Gateway and UPI auto-verification'
      ],
      downloadUrl: '/app.apk',
      downloadLabel: 'DOWNLOAD APK (3.5 MB)',
      isApk: true,
      popular: false
    },
    {
      id: 'master-web',
      name: 'ChuruOne Master Store Web (For iPhone & PC)',
      developer: 'ChuruOne Technologies • Cloud Web OS',
      type: 'WEB',
      badge: 'ZERO INSTALL • ALL DEVICES',
      rating: '5.0',
      reviewCount: '1.2k users',
      size: '0 MB (Web)',
      version: 'Latest Cloud Web (iOS / Mac / Windows)',
      icon: <Globe className="w-7 h-7 text-sky-600" />,
      iconBg: 'bg-sky-50',
      description: 'iPhone, Mac, Windows aur tablet users ke liye browser me chalne wala master store operating system. Exact Android app ki tarah saare features, progressive order buttons, photo presets aur instant store settings sync.',
      features: [
        'Works on iPhone Safari, Chrome, Mac & Windows',
        'Phone + Password login for Dukandar & Delivery Boy',
        'Direct menu dish promo to homepage hero banner',
        'Taxes, packaging fee & free delivery threshold controls'
      ],
      launchUrl: '/admin',
      downloadLabel: 'LAUNCH WEB OS (OPEN)',
      isApk: false,
      popular: false
    },
    {
      id: 'customer-web',
      name: 'Shawarma Nights Online Storefront',
      developer: 'Shawarma Nights Churu • Food & Drink',
      type: 'WEB',
      badge: 'STOREFRONT • ALL DEVICES',
      rating: '4.8',
      reviewCount: '3.4k customers',
      size: '0 MB (Web)',
      version: 'Fast Mobile Web PWA',
      icon: <Smartphone className="w-7 h-7 text-[#DC2626]" />,
      iconBg: 'bg-red-50',
      description: 'Official customer online order website. Authentic charcoal grilled shawarma, rolls, custom saj bread, UPI auto-verification, coupon engine aur live order tracker.',
      features: [
        'Real charcoal slow-turned grilled shawarma menu',
        'Instant UPI QR payment with auto-verification',
        'Live order tracking with step-by-step progress',
        'Interactive franchise inquiry application form'
      ],
      launchUrl: '/',
      downloadLabel: 'VISIT STOREFRONT (WEBSITE)',
      isApk: false,
      popular: false
    },
    {
      id: 'delivery-web',
      name: 'ChuruOne Delivery Partner Console',
      developer: 'ChuruOne Logistics • Rider Portal',
      type: 'WEB',
      badge: 'RIDER PORTAL • ALL DEVICES',
      rating: '4.9',
      reviewCount: '84 riders',
      size: '0 MB (Web)',
      version: 'Mobile Web Console',
      icon: <Bike className="w-7 h-7 text-emerald-600" />,
      iconBg: 'bg-emerald-50',
      description: 'Delivery boy progressive workflow portal. 1-tap direct customer call, Google Maps directions, nearest-first proximity engine, aur 4-digit OTP delivery confirmation with COD cash collection verification.',
      features: [
        'Phone + Password login & 1-tap partner registration',
        '1-Tap Google Maps navigation to customer door',
        'COD cash collection confirmation checkbox',
        'Zero-cancel/reject security architecture for riders'
      ],
      launchUrl: '/admin',
      downloadLabel: 'LAUNCH RIDER PORTAL',
      isApk: false,
      popular: false
    }
  ];

  const filteredApps = apps.filter(app => {
    if (filter === 'APK' && !app.isApk) return false;
    if (filter === 'WEB' && app.isApk) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return app.name.toLowerCase().includes(q) || app.description.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#FFFBF7] text-zinc-900 font-sans selection:bg-[#DC2626] selection:text-white pb-24">
      
      {/* 1. APP STORE HEADER */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-zinc-100 shadow-xs">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <Link 
              to="/" 
              className="p-2 rounded-full hover:bg-zinc-100 text-zinc-600 transition-colors"
              title="Back to Website"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-2xl bg-[#DC2626] text-white flex items-center justify-center font-black text-sm shadow-sm">
                C1
              </div>
              <div>
                <h1 className="text-base font-black text-zinc-900 tracking-tight leading-tight">
                  ChuruOne App Hub
                </h1>
                <p className="text-[11px] text-zinc-400 font-bold">
                  Official Downloads & Digital Portals
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/admin"
              className="px-4 py-2 rounded-full bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-black uppercase tracking-wider transition-all"
            >
              Store OS
            </Link>
          </div>

        </div>
      </header>

      {/* 2. MAIN CONTAINER */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 space-y-6">

        {/* HERO BANNER CARD */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border-0 space-y-3 relative overflow-hidden">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-50 text-[#DC2626] text-xs font-black uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Digital Commerce & Merchant Suite</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight leading-tight">
            Apni Dukan ke Sabhi Apps aur Web Portals Ek Hi Jagah
          </h2>

          <p className="text-xs sm:text-sm text-zinc-500 leading-relaxed max-w-2xl">
            Android users direct <strong>.APK files</strong> download kar sakte hain, aur iPhone, Mac ya Windows users bina kisi app ke <strong>Instant Web Portals</strong> khol sakte hain.
          </p>

          {/* Search Box */}
          <div className="pt-2">
            <div className="relative max-w-md">
              <Search className="w-4 h-4 text-zinc-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search apps by name or feature..."
                className="w-full bg-[#FFFBF7] rounded-2xl pl-11 pr-4 py-3 text-sm text-zinc-900 placeholder-zinc-400 focus:bg-white focus:ring-2 focus:ring-[#DC2626] focus:outline-none transition-all shadow-xs border-0"
              />
            </div>
          </div>

        </div>

        {/* 3. CATEGORY FILTER TABS */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'ALL', label: 'ALL APPS' },
            { id: 'APK', label: 'ANDROID APKS (.apk)' },
            { id: 'WEB', label: 'WEB PORTALS (Zero Install)' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-4 py-2 rounded-full text-xs font-black whitespace-nowrap transition-all cursor-pointer border-0 ${
                filter === tab.id
                  ? 'bg-[#DC2626] text-white shadow-md'
                  : 'bg-white text-zinc-600 hover:bg-zinc-100 shadow-sm'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 4. APP CARDS LIST (Play Store Style) */}
        <div className="space-y-5">
          {filteredApps.map(app => (
            <div
              key={app.id}
              className="bg-white rounded-3xl p-6 sm:p-7 shadow-xl border-0 space-y-5 transition-all hover:shadow-2xl"
            >
              
              {/* Top Row: App Icon & Meta */}
              <div className="flex items-start justify-between gap-4">
                
                <div className="flex items-start gap-4">
                  <div className={`w-15 h-15 rounded-3xl ${app.iconBg} flex items-center justify-center shadow-xs shrink-0`}>
                    {app.icon}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base sm:text-lg font-black text-zinc-900 leading-tight">
                        {app.name}
                      </h3>
                      {app.popular && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-100 text-[#DC2626]">
                          RECOMMENDED
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-zinc-500 font-medium mt-0.5">
                      {app.developer}
                    </p>

                    <div className="flex items-center gap-3 text-xs text-zinc-600 font-bold mt-2 flex-wrap">
                      <span className="flex items-center gap-1 text-amber-600">
                        <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                        <span>{app.rating}</span>
                      </span>
                      <span>•</span>
                      <span>{app.size}</span>
                      <span>•</span>
                      <span className="text-zinc-400">{app.version}</span>
                    </div>
                  </div>
                </div>

                <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-zinc-100 text-zinc-600 shrink-0">
                  {app.badge}
                </span>

              </div>

              {/* Description */}
              <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
                {app.description}
              </p>

              {/* Key Highlights */}
              <div className="bg-[#FFFBF7] rounded-2xl p-4 shadow-xs space-y-1.5 text-xs text-zinc-700">
                <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 block mb-1">
                  KEY FEATURES & CAPABILITIES:
                </span>
                {app.features.map((feat, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5 stroke-[2.5]" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>

              {/* Action Button */}
              <div>
                {app.isApk ? (
                  <a
                    href={app.downloadUrl}
                    download
                    className="w-full py-4 rounded-full bg-[#DC2626] hover:bg-red-700 active:scale-98 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all cursor-pointer no-underline"
                  >
                    <Download className="w-4 h-4 stroke-[2.5]" />
                    <span>{app.downloadLabel}</span>
                  </a>
                ) : (
                  <Link
                    to={app.launchUrl}
                    className="w-full py-4 rounded-full bg-zinc-900 hover:bg-zinc-800 active:scale-98 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all cursor-pointer no-underline"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>{app.downloadLabel}</span>
                  </Link>
                )}
              </div>

            </div>
          ))}
        </div>

        {/* 5. PLAY STORE STYLE INSTALLATION GUIDE */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border-0 space-y-4">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-sky-600" />
            <h3 className="text-base font-black text-zinc-900">
              Android Phone Par APK Kaise Install Karein? (Guide)
            </h3>
          </div>

          <div className="space-y-3 text-xs sm:text-sm text-zinc-600 leading-relaxed">
            <div className="flex items-start gap-3 bg-[#FFFBF7] p-3.5 rounded-2xl shadow-xs">
              <span className="w-6 h-6 rounded-full bg-[#DC2626] text-white font-black text-xs flex items-center justify-center shrink-0">1</span>
              <div>
                <strong className="text-zinc-900 block">Download APK Button Par Tap Karein:</strong>
                Upar diye gaye red button par tap karke <code>.apk</code> file download karein.
              </div>
            </div>

            <div className="flex items-start gap-3 bg-[#FFFBF7] p-3.5 rounded-2xl shadow-xs">
              <span className="w-6 h-6 rounded-full bg-[#DC2626] text-white font-black text-xs flex items-center justify-center shrink-0">2</span>
              <div>
                <strong className="text-zinc-900 block">Chrome Warning Aane Par:</strong>
                Agar Chrome <em>"File might be harmful"</em> dikhaye, toh <strong>"Download anyway"</strong> par tap karein (kyunki yeh dukan ka private verified APK hai, Play Store par nahi).
              </div>
            </div>

            <div className="flex items-start gap-3 bg-[#FFFBF7] p-3.5 rounded-2xl shadow-xs">
              <span className="w-6 h-6 rounded-full bg-[#DC2626] text-white font-black text-xs flex items-center justify-center shrink-0">3</span>
              <div>
                <strong className="text-zinc-900 block">Install Unknown Apps Ko Allow Karein:</strong>
                Downloaded file par tap karke <em>"Install"</em> karein. Agar phone permission maange toh <em>"Allow from this source"</em> ON karein.
              </div>
            </div>

            <div className="flex items-start gap-3 bg-[#FFFBF7] p-3.5 rounded-2xl shadow-xs">
              <span className="w-6 h-6 rounded-full bg-[#DC2626] text-white font-black text-xs flex items-center justify-center shrink-0">4</span>
              <div>
                <strong className="text-zinc-900 block">Dukan ID Dalein & Sahmat Checkbox Tick Karein:</strong>
                App open karein, apni dukan ID dalein, consent checkbox tick karein aur Start dabayein!
              </div>
            </div>
          </div>
        </div>

        {/* 6. SECURITY & ARCHITECTURE GUARANTEE */}
        <div className="p-6 rounded-3xl bg-emerald-50 text-emerald-950 space-y-2 border-0">
          <div className="flex items-center gap-2 font-black text-sm text-emerald-800">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <span>100% Secure & Private Architecture</span>
          </div>
          <p className="text-xs text-emerald-800 leading-relaxed">
            ChuruOne ke sabhi APKs aur Web applications SSL/TLS encrypted WebSocket gateway se judte hain. APKs me koi advertisement ya third-party tracking nahi hai.
          </p>
        </div>

      </main>

    </div>
  );
}
