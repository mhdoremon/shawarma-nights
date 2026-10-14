import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Store, Compass, Star, MapPin, Tag, ShoppingBag, ArrowRight, Sparkles, Filter, CheckCircle2, ChevronRight, X } from 'lucide-react';
import BottomNavBar from '../../components/BottomNavBar';

export default function ExplorePage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [stores, setStores] = useState([]);
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Categories
  const categories = [
    { id: 'all', label: 'Sabhi (All)' },
    { id: 'food', label: '🍔 Food & Cafes' },
    { id: 'fashion', label: '👔 Fashion & Outfits' },
    { id: 'salon', label: '✂️ Salon & Grooming' },
    { id: 'grocery', label: '🛒 Kirana & Daily' },
    { id: 'electronics', label: '📱 Electronics' }
  ];

  // Default rich stores list
  const initialStores = [
    {
      id: 'shawarma',
      name: 'Shawarma Nights',
      tagline: 'Authentic Charcoal Grilled Rolls, Platters & Fries',
      category: 'food',
      rating: 4.9,
      reviewsCount: 342,
      location: 'Lal Ghantaghar, Churu',
      image: 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?auto=format&fit=crop&w=800&q=80',
      badge: 'Flagship Food',
      url: '/shawarma'
    },
    {
      id: 'skyline',
      name: 'Skyline Premium Outfits',
      tagline: 'Architectural Menswear, Shirts & Bespoke Shoes',
      category: 'fashion',
      rating: 4.8,
      reviewsCount: 189,
      location: 'Subhash Chowk, Churu',
      image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=80',
      badge: 'Premium Fashion',
      url: '/skyline'
    },
    {
      id: 'nash-studio',
      name: 'Nash Studio Luxury Salon',
      tagline: 'Executive Grooming, Beard Spa & Modern Haircraft',
      category: 'salon',
      rating: 4.9,
      reviewsCount: 215,
      location: 'Railway Station Road, Churu',
      image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=80',
      badge: 'Luxury Salon',
      url: '/nash'
    }
  ];

  // Default items catalog across stores
  const initialItems = [
    // Shawarma Nights
    {
      id: 'sn-1',
      storeId: 'shawarma',
      storeName: 'Shawarma Nights',
      name: 'Smokey Chicken Shawarma Roll',
      category: 'food',
      price: 130,
      originalPrice: 160,
      image: 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?auto=format&fit=crop&w=600&q=80',
      type: 'non-veg',
      rating: 4.9,
      url: '/shawarma'
    },
    {
      id: 'sn-2',
      storeId: 'shawarma',
      storeName: 'Shawarma Nights',
      name: 'Peri Peri Loaded Cheesy Fries',
      category: 'food',
      price: 110,
      originalPrice: 140,
      image: 'https://images.unsplash.com/photo-1585109649139-366815a0d713?auto=format&fit=crop&w=600&q=80',
      type: 'veg',
      rating: 4.8,
      url: '/shawarma'
    },
    {
      id: 'sn-3',
      storeId: 'shawarma',
      storeName: 'Shawarma Nights',
      name: 'Royal Arabian Meat Platter',
      category: 'food',
      price: 240,
      originalPrice: 290,
      image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80',
      type: 'non-veg',
      rating: 5.0,
      url: '/shawarma'
    },
    {
      id: 'sn-4',
      storeId: 'shawarma',
      storeName: 'Shawarma Nights',
      name: 'Paneer Tikka Roll',
      category: 'food',
      price: 110,
      originalPrice: 130,
      image: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=600&q=80',
      type: 'veg',
      rating: 4.7,
      url: '/shawarma'
    },
    // Skyline Outfits
    {
      id: 'sky-1',
      storeId: 'skyline',
      storeName: 'Skyline Premium Outfits',
      name: 'Classic Linen Textured Overshirt',
      category: 'fashion',
      price: 1299,
      originalPrice: 1999,
      image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=600&q=80',
      type: 'apparel',
      rating: 4.8,
      url: '/skyline'
    },
    {
      id: 'sky-2',
      storeId: 'skyline',
      storeName: 'Skyline Premium Outfits',
      name: 'Architectural Oxford Shoes',
      category: 'fashion',
      price: 2499,
      originalPrice: 3499,
      image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=600&q=80',
      type: 'footwear',
      rating: 4.9,
      url: '/skyline'
    },
    {
      id: 'sky-3',
      storeId: 'skyline',
      storeName: 'Skyline Premium Outfits',
      name: 'Royal Navy Blazer & Trouser Set',
      category: 'fashion',
      price: 3999,
      originalPrice: 5999,
      image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=600&q=80',
      type: 'apparel',
      rating: 4.9,
      url: '/skyline'
    },
    // Nash Studio
    {
      id: 'nash-1',
      storeId: 'nash-studio',
      storeName: 'Nash Studio',
      name: 'Signature Executive Haircut & Styling',
      category: 'salon',
      price: 250,
      originalPrice: 350,
      image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80',
      type: 'service',
      rating: 4.9,
      url: '/nash'
    },
    {
      id: 'nash-2',
      storeId: 'nash-studio',
      storeName: 'Nash Studio',
      name: 'Royal Charcoal Beard Spa & Trim',
      category: 'salon',
      price: 180,
      originalPrice: 250,
      image: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=600&q=80',
      type: 'service',
      rating: 5.0,
      url: '/nash'
    },
    {
      id: 'nash-3',
      storeId: 'nash-studio',
      storeName: 'Nash Studio',
      name: 'Hydra Glow Detox Facial',
      category: 'salon',
      price: 699,
      originalPrice: 999,
      image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=600&q=80',
      type: 'service',
      rating: 4.8,
      url: '/nash'
    }
  ];

  useEffect(() => {
    // Attempt to load dynamic stores and products from API
    const loadData = async () => {
      try {
        const res = await fetch('/api/stores').catch(() => null);
        if (res && res.ok) {
          const data = await res.json();
          if (Array.isArray(data.stores) && data.stores.length > 0) {
            // Merge with initial stores
            const merged = [...initialStores];
            data.stores.forEach(s => {
              if (!merged.find(m => m.id === s.id) && s.status !== 'pending_review') {
                merged.push({
                  id: s.id,
                  name: s.name,
                  tagline: s.tagline || 'Churu Marketplace Partner',
                  category: s.type || 'retail',
                  rating: 4.8,
                  reviewsCount: 50,
                  location: 'Churu',
                  image: s.branding?.heroImage || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=80',
                  badge: 'Verified Dukan',
                  url: `/?storeId=${s.slug || s.id}`
                });
              }
            });
            setStores(merged);
          } else {
            setStores(initialStores);
          }
        } else {
          setStores(initialStores);
        }
      } catch {
        setStores(initialStores);
      }

      setItems(initialItems);
      setIsLoading(false);
    };

    loadData();
  }, []);

  // Filter stores
  const filteredStores = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return stores.filter(s => {
      const matchCat = selectedCategory === 'all' || s.category === selectedCategory;
      const matchQuery = !q || s.name.toLowerCase().includes(q) || s.tagline.toLowerCase().includes(q) || s.location.toLowerCase().includes(q);
      return matchCat && matchQuery;
    });
  }, [stores, searchQuery, selectedCategory]);

  // Filter items
  const filteredItems = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return items.filter(it => {
      const matchCat = selectedCategory === 'all' || it.category === selectedCategory;
      const matchQuery = !q || it.name.toLowerCase().includes(q) || it.storeName.toLowerCase().includes(q);
      return matchCat && matchQuery;
    });
  }, [items, searchQuery, selectedCategory]);

  return (
    <div className="min-h-screen bg-[#FFFDF9] text-zinc-900 font-sans pb-24 selection:bg-amber-400 selection:text-zinc-950">
      
      {/* 1. TOP HEADER & SEARCH BAR */}
      <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-xl border-b border-zinc-200/80 px-4 py-3 sm:py-4">
        <div className="max-w-4xl mx-auto space-y-3">
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-red-500 text-white flex items-center justify-center font-black text-xs shadow-md">
                <Compass className="w-4 h-4" />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-black tracking-tight text-zinc-950 leading-none">
                  ChuruOne Explore
                </h1>
                <p className="text-[10px] text-zinc-500 font-medium">Churu ke saare dukane aur products ek jagah</p>
              </div>
            </div>

            <button
              onClick={() => navigate('/')}
              className="text-xs font-bold text-zinc-500 hover:text-zinc-950 px-3 py-1.5 rounded-full border border-zinc-200 hover:border-zinc-300 transition-colors cursor-pointer"
            >
              ← Back to Feed
            </button>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search shawarma, shirts, salon haircut, shop name..."
              className="w-full bg-zinc-100/90 focus:bg-white border border-transparent focus:border-zinc-900 rounded-2xl pl-10 pr-9 py-2.5 text-xs text-zinc-900 placeholder-zinc-400 outline-none transition-all shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Category Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
            {categories.map(c => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`px-3 py-1.5 rounded-full whitespace-nowrap font-bold text-[11px] transition-all cursor-pointer ${
                  selectedCategory === c.id
                    ? 'bg-zinc-950 text-white shadow-sm'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

        </div>
      </header>

      {/* 2. MAIN CONTENT AREA */}
      <main className="max-w-4xl mx-auto px-4 py-6 space-y-8">
        
        {/* ========================================================= */}
        {/* SECTION 1: DUKANEIN (PARTNER STORES)                      */}
        {/* ========================================================= */}
        <section>
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2">
              <Store className="w-4 h-4 text-amber-600" />
              <h2 className="text-sm sm:text-base font-extrabold text-zinc-950 uppercase tracking-wider">
                Churu Ki Dukanein ({filteredStores.length})
              </h2>
            </div>
            <span className="text-[11px] text-zinc-500 font-medium">Verified Local Merchants</span>
          </div>

          {filteredStores.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 text-center border border-zinc-200 text-zinc-500 text-xs">
              Is category ya search query ke liye koi dukan nahi mili.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredStores.map(store => (
                <div
                  key={store.id}
                  onClick={() => navigate(store.url)}
                  className="bg-white rounded-2xl overflow-hidden border border-zinc-200 hover:border-zinc-400 transition-all shadow-sm hover:shadow-md cursor-pointer flex flex-col justify-between group"
                >
                  <div className="relative h-32 overflow-hidden bg-zinc-100">
                    <img
                      src={store.image}
                      alt={store.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-2.5 left-2.5 bg-black/75 backdrop-blur-xs text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                      {store.badge}
                    </div>
                    <div className="absolute top-2.5 right-2.5 bg-white/95 backdrop-blur-xs text-zinc-900 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                      <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                      <span>{store.rating}</span>
                    </div>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-sm font-black text-zinc-950 group-hover:text-amber-600 transition-colors">
                        {store.name}
                      </h3>
                      <p className="text-[11px] text-zinc-500 line-clamp-1 mt-0.5">
                        {store.tagline}
                      </p>
                      <div className="flex items-center gap-1 text-[10px] text-zinc-400 mt-2">
                        <MapPin className="w-3 h-3" />
                        <span>{store.location}</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Live Store
                      </span>
                      <span className="text-xs font-bold text-zinc-950 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                        <span>Visit Dukan</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ========================================================= */}
        {/* SECTION 2: PRODUCTS & SERVICES FEED                        */}
        {/* ========================================================= */}
        <section>
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-red-600" />
              <h2 className="text-sm sm:text-base font-extrabold text-zinc-950 uppercase tracking-wider">
                Trending Products & Services ({filteredItems.length})
              </h2>
            </div>
            <span className="text-[11px] text-zinc-500 font-medium">Direct Store Order</span>
          </div>

          {filteredItems.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 text-center border border-zinc-200 text-zinc-500 text-xs">
              Is khoj ke anusar koi item nahi mila. Kripya doosra keyword search karein.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {filteredItems.map(item => {
                const discount = item.originalPrice ? Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100) : 0;
                return (
                  <div
                    key={item.id}
                    onClick={() => navigate(item.url)}
                    className="bg-white rounded-2xl overflow-hidden border border-zinc-200 hover:border-zinc-400 transition-all shadow-xs hover:shadow-md cursor-pointer flex flex-col justify-between group"
                  >
                    <div className="relative aspect-square overflow-hidden bg-zinc-100">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      {discount > 0 && (
                        <div className="absolute top-2 left-2 bg-red-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
                          {discount}% OFF
                        </div>
                      )}
                      <div className="absolute bottom-2 left-2 bg-black/75 backdrop-blur-xs text-white text-[9px] font-semibold px-2 py-0.5 rounded-full">
                        {item.storeName}
                      </div>
                    </div>

                    <div className="p-3 flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-zinc-900 line-clamp-2 leading-tight">
                          {item.name}
                        </h4>
                        
                        <div className="flex items-baseline gap-1.5 mt-2">
                          <span className="text-sm font-black text-zinc-950">₹{item.price}</span>
                          {item.originalPrice && (
                            <span className="text-[10px] text-zinc-400 line-through">₹{item.originalPrice}</span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(item.url);
                        }}
                        className="w-full mt-3 bg-zinc-950 hover:bg-black text-white text-[11px] font-bold py-2 rounded-xl transition-colors flex items-center justify-center gap-1"
                      >
                        <span>View / Order</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

      </main>

      {/* Floating Instagram-style navigation dock */}
      <BottomNavBar />

    </div>
  );
}
