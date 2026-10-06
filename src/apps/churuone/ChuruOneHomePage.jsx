import React, { useState } from 'react';
import { 
  Store, 
  ShoppingBag, 
  Smartphone, 
  ArrowRight, 
  Search, 
  ShieldCheck, 
  Truck, 
  MapPin, 
  ExternalLink, 
  Zap, 
  ChevronRight, 
  Star, 
  Globe,
  SlidersHorizontal,
  Building2
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ChuruOneHomePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', label: 'Sabhi Dukaane' },
    { id: 'food', label: 'Food & Dining' },
    { id: 'salon', label: 'Salon & Grooming' },
    { id: 'sweets', label: 'Sweets & Bakery' },
    { id: 'grocery', label: 'Kirana & Daily' },
    { id: 'fashion', label: 'Fashion & Retail' }
  ];

  const stores = [
    {
      id: 'shawarma',
      name: 'Shawarma Nights',
      tagline: 'Authentic Charcoal Shawarma, Burgers & Rolls',
      category: 'food',
      rating: '4.9',
      reviewCount: '1.2k+ reviews',
      deliveryTime: '20-25 mins',
      minOrder: '₹99',
      status: 'OPEN NOW',
      isLive: true,
      image: 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?auto=format&fit=crop&w=800&q=80',
      actionUrl: '/?storeId=shawarma',
      subdomainUrl: 'https://shawarma.churuone.in',
      badge: 'Flagship Partner'
    },
    {
      id: 'nash-studio',
      name: 'Nash Studio',
      tagline: 'Precision Grooming, Luxury Haircuts & Beard Sculpting',
      category: 'salon',
      rating: '4.9',
      reviewCount: '450+ reviews',
      deliveryTime: 'Slot Booking',
      minOrder: '₹500',
      status: 'OPEN NOW',
      isLive: true,
      image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=80',
      actionUrl: 'https://nash.churuone.in',
      subdomainUrl: 'https://nash.churuone.in',
      badge: 'Live Salon'
    },
    {
      id: 'pizza-club',
      name: 'Churu Pizza Club',
      tagline: 'Wood-fired Italian Pizzas & Cheesy Garlic Bread',
      category: 'food',
      rating: '4.7',
      reviewCount: '580 reviews',
      deliveryTime: '30-35 mins',
      minOrder: '₹149',
      status: 'COMING SOON',
      isLive: false,
      image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80',
      actionUrl: '#',
      subdomainUrl: 'https://pizza.churuone.in',
      badge: 'Onboarding'
    },
    {
      id: 'bikaner-sweets',
      name: 'Bikaner Mishthan Bhandar',
      tagline: 'Pure Desi Ghee Sweets, Namkeen & Rajasthani Snacks',
      category: 'sweets',
      rating: '4.8',
      reviewCount: '890 reviews',
      deliveryTime: '25-30 mins',
      minOrder: '₹199',
      status: 'COMING SOON',
      isLive: false,
      image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80',
      actionUrl: '#',
      subdomainUrl: 'https://sweets.churuone.in',
      badge: 'Onboarding'
    },
    {
      id: 'city-kirana',
      name: 'Churu Super Daily Mart',
      tagline: 'Daily Essentials, Fresh Dairy & Packed Groceries',
      category: 'grocery',
      rating: '4.6',
      reviewCount: '340 reviews',
      deliveryTime: '40 mins',
      minOrder: '₹249',
      status: 'COMING SOON',
      isLive: false,
      image: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=800&q=80',
      actionUrl: '#',
      subdomainUrl: 'https://kirana.churuone.in',
      badge: 'Onboarding'
    }
  ];

  const filteredStores = stores.filter(store => {
    const matchesCategory = selectedCategory === 'all' || store.category === selectedCategory;
    const matchesSearch = store.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          store.tagline.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased selection:bg-blue-600 selection:text-white">
      
      {/* ─── Top Brand Navbar ───────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-none shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          
          {/* Logo */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-lg shadow-sm">
                C1
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1">
                  <span className="text-xl font-black tracking-tight text-slate-900">CHURU</span>
                  <span className="text-xl font-black tracking-tight text-blue-600">ONE</span>
                </div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 -mt-1">
                  Commerce Network
                </span>
              </div>
            </Link>
          </div>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-600">
            <a href="#stores" className="hover:text-blue-600 transition-colors">
              Dukaane
            </a>
            <Link to="/apps" className="hover:text-blue-600 transition-colors flex items-center gap-1.5">
              <span>App Hub</span>
              <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-bold">APK</span>
            </Link>
            <a href="#how-it-works" className="hover:text-blue-600 transition-colors">
              Kyun Judein?
            </a>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-2.5">
            <Link 
              to="/admin" 
              className="text-xs sm:text-sm font-semibold text-slate-700 hover:text-blue-600 px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Store className="w-4 h-4 text-slate-500" />
              <span className="hidden sm:inline">Dukandar</span> Portal
            </Link>
            <Link
              to="/apps"
              className="text-xs sm:text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-lg transition-colors shadow-sm flex items-center gap-1.5"
            >
              <Smartphone className="w-4 h-4" />
              <span>Get App</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ─── Hero Section ──────────────────────────────── */}
      <section className="bg-white pt-10 pb-12 sm:pt-16 sm:pb-20">
        <div className="max-w-6xl mx-auto px-4 text-center">
          
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-5 shadow-sm">
            <MapPin className="w-3.5 h-3.5" />
            <span>Churu Shahar Ka Digital Network</span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-slate-900 max-w-4xl mx-auto leading-tight">
            Churu ki har dukan, <br />
            <span className="text-blue-600">ab aapke phone par.</span>
          </h1>

          <p className="mt-4 sm:mt-5 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto font-normal">
            Local restaurants, bakeries aur shops se seedhe order karein. Har dukan ka apna official store aur fast local delivery.
          </p>

          {/* Clean Search Bar */}
          <div className="mt-8 max-w-xl mx-auto">
            <div className="bg-white p-2 rounded-xl shadow-md flex items-center gap-2">
              <Search className="w-5 h-5 text-slate-400 ml-2 shrink-0" />
              <input
                type="text"
                placeholder="Dukan ya dish ka naam search karein (e.g. Shawarma, Pizza)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-sm text-slate-800 placeholder-slate-400 focus:outline-none py-1.5"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="text-xs font-bold text-slate-400 hover:text-slate-600 px-2"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="mt-10 pt-8 max-w-3xl mx-auto grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-xl sm:text-2xl font-black text-slate-900">100%</div>
              <div className="text-xs text-slate-500 font-medium mt-0.5">Local Churu Shops</div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-blue-600">Direct</div>
              <div className="text-xs text-slate-500 font-medium mt-0.5">Kitchen to Doorstep</div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-slate-900">20 Mins</div>
              <div className="text-xs text-slate-500 font-medium mt-0.5">Average Delivery</div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Store Directory Section ────────────────────── */}
      <section id="stores" className="py-12 sm:py-16 max-w-6xl mx-auto px-4">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
              Shahar Ki Dukaane
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Select karein aur seedhe dukan ke official menu se order karein
            </p>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`text-xs font-semibold px-3 py-2 rounded-lg whitespace-nowrap transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:bg-slate-100'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Stores Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredStores.map((store) => (
            <div 
              key={store.id}
              className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                {/* Store Banner Image */}
                <div className="relative h-48 w-full bg-slate-200 overflow-hidden">
                  <img 
                    src={store.image} 
                    alt={store.name} 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider ${
                      store.isLive 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-slate-800 text-white'
                    }`}>
                      {store.status}
                    </span>
                    <span className="text-[11px] font-semibold bg-white/90 text-slate-800 px-2 py-1 rounded-md">
                      {store.badge}
                    </span>
                  </div>

                  <div className="absolute bottom-3 right-3 bg-white/90 px-2.5 py-1 rounded-md text-xs font-bold text-slate-900 flex items-center gap-1 shadow-sm">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{store.rating}</span>
                  </div>
                </div>

                {/* Store Body */}
                <div className="p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600">
                        {store.name}
                      </h3>
                      <p className="text-sm text-slate-500 mt-1 line-clamp-1">
                        {store.tagline}
                      </p>
                    </div>
                  </div>

                  {/* Store Specs */}
                  <div className="mt-4 flex items-center gap-4 text-xs font-semibold text-slate-600">
                    <div className="flex items-center gap-1">
                      <Truck className="w-3.5 h-3.5 text-blue-600" />
                      <span>{store.deliveryTime}</span>
                    </div>
                    <div className="w-1 h-1 rounded-full bg-slate-300" />
                    <div>
                      <span>Min Order: {store.minOrder}</span>
                    </div>
                    <div className="w-1 h-1 rounded-full bg-slate-300" />
                    <div>
                      <span>{store.reviewCount}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Store Footer Action */}
              <div className="p-5 pt-0">
                {store.isLive ? (
                  <Link
                    to={store.actionUrl}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-sm"
                  >
                    <span>Menu Dekhein & Order Karein</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                ) : (
                  <div className="w-full bg-slate-100 text-slate-400 py-2.5 px-4 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 cursor-not-allowed">
                    <span>Jald Shuru Ho Raha Hai</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredStores.length === 0 && (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
            <Store className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">Koi dukan nahi mili</h3>
            <p className="text-xs text-slate-500 mt-1">Dusra naam search karein ya category badlein.</p>
          </div>
        )}
      </section>

      {/* ─── Kyun Judein / Platform Benefits ─────────────── */}
      <section id="how-it-works" className="py-12 sm:py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
              Churu Shahar Ka Digital System
            </h2>
            <p className="text-sm text-slate-500 mt-2 font-normal">
              Customer ko fast local service, aur dukandar ko complete digital azaadi.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Feature 1 */}
            <div className="bg-slate-50 p-6 rounded-2xl shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-4">
                <Globe className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Har Dukan Ki Apni Website
              </h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Har dukandar ko unka personal web address milta hai (e.g. shawarma.churuone.in). Dukandar apne brand se direct order le sakte hain.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-slate-50 p-6 rounded-2xl shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-4">
                <Smartphone className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Master App & OTP Relay
              </h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Android phone se orders accept karein, status change karein aur live customer OTP relay chalayein bina kisi SMS company ke kharche ke.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-slate-50 p-6 rounded-2xl shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-4">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Direct UPI & 0% Middleman
              </h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Customer ka payment seedhe dukandar ke bank UPI account me. Kisi third-party gateway par fasne ya commission katne ka chakkar nahi.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ─── Dukandar CTA Card ──────────────────────────── */}
      <section className="py-12 max-w-6xl mx-auto px-4">
        <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 shadow-sm flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-xl text-center md:text-left">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
              For Store Owners & Merchants
            </span>
            <h2 className="text-2xl sm:text-4xl font-black mt-2 leading-tight">
              Kya aap Churu me dukan chalate hain?
            </h2>
            <p className="text-sm text-slate-300 mt-2 font-normal">
              ChuruOne network par apni dukan ko 5 minute me live karein. Master Dukandar App aur Web Portal se apna pura business manage karein.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <Link
              to="/admin"
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold text-sm text-center transition-colors shadow-sm"
            >
              Dukandar Portal Kholein
            </Link>
            <Link
              to="/apps"
              className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 text-white px-6 py-3 rounded-xl font-bold text-sm text-center transition-colors"
            >
              Download APKs
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Footer ─────────────────────────────────────── */}
      <footer className="bg-white py-10 shadow-inner">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900">CHURUONE</span>
            <span>•</span>
            <span>Local Digital Commerce Network, Churu (Rajasthan)</span>
          </div>

          <div className="flex items-center gap-6 font-semibold">
            <Link to="/apps" className="hover:text-blue-600">App Hub</Link>
            <Link to="/admin" className="hover:text-blue-600">Dukandar Portal</Link>
            <Link to="/" className="hover:text-blue-600">Shawarma Nights</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
