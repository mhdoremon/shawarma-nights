import React, { useState, useEffect, useRef } from 'react';
import { 
  Search,
  ShoppingBag,
  ShoppingCart,
  MapPin,
  User,
  ChevronDown,
  ArrowRight,
  Star,
  Clock,
  Plus,
  Minus,
  Trash2,
  Check,
  LogOut,
  Phone,
  Mail,
  X,
  Calendar,
  Sparkles,
  Utensils,
  Scissors,
  CheckCircle2,
  Navigation,
  CreditCard,
  QrCode,
  Tag,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
  Store,
  RotateCcw,
  Lock,
  Shirt,
  Footprints
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import LegalPoliciesModal from '../../components/LegalPoliciesModal';
import UpiPaymentModal from '../../components/UpiPaymentModal';
import { 
  getChuruOneSession, 
  setChuruOneSession, 
  clearChuruOneSession, 
  attachSsoParams,
  sanitizeChuruOneUser,
  subscribeToChuruOneAuth
} from '../../utils/ssoHelper';

// Popular Churu Landmarks for Fast Accurate City Delivery
export const CHURU_POPULAR_LANDMARKS = [
  'Subhash Chowk',
  'Station Road',
  'Nai Sarak',
  'Dharamstupa / Kotwali',
  'Collectorate Road',
  'Pankha Circle',
  'Lohiya College',
  'Nature Park / Churu Club',
  'Naya Bass'
];

export const FALLBACK_STORE_IMAGE = 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?auto=format&fit=crop&w=600&q=80';
export const FALLBACK_PRODUCT_IMAGE = 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=500&q=80';

// ─── LARGE MINIMAL LINE ICONS FOR FASHION CATEGORIES ─────────────────
function CategoryLineIcon({ categoryId, className = "w-7 h-7 sm:w-8 sm:h-8" }) {
  const common = `${className} shrink-0 stroke-[1.8]`;
  switch (categoryId) {
    case 'all':
      return <Sparkles className={common} />;
    case 'shirts':
      return <Shirt className={common} />;
    case 'pants':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={common}>
          <path d="M5 4h14v2.5l-1.5 13.5h-4l-1.5-8-1.5 8h-4L5 6.5V4z" />
          <path d="M12 4v3" />
          <path d="M5 6.5h14" />
        </svg>
      );
    case 'jeans':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={common}>
          <path d="M5 4h14v2.5l-1.5 13.5h-4l-1.5-8-1.5 8h-4L5 6.5V4z" />
          <path d="M5 6.5h14" />
          <path d="M7 9.5c0 1.2 1.3 2 2.5 2" />
          <path d="M17 9.5c0 1.2-1.3 2-2.5 2" />
          <circle cx="12" cy="5.25" r="0.6" fill="currentColor" />
        </svg>
      );
    case 'tshirts':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={common}>
          <path d="M8 3h8l2.5 4.5-3 1.5V20H8.5V9L5.5 7.5 8 3z" />
          <path d="M10 3a2 2 0 0 0 4 0" />
        </svg>
      );
    case 'jackets':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={common}>
          <path d="M6 4h12l3 5-3 2v8a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-8L3 9l3-5z" />
          <path d="M12 4v16" />
          <path d="M6 4l6 7 6-7" />
        </svg>
      );
    case 'deals':
      return <Tag className={common} />;
    default:
      return <Sparkles className={common} />;
  }
}

// Fallback Real Stores (Skyline Premium Outfits)
const FALLBACK_REAL_STORES = [
  {
    id: 'skyline',
    name: 'Skyline Premium Outfits',
    vertical: 'fashion',
    category: 'Luxury Menswear • Shirts, Pants, Jeans, Kurtas & Jackets',
    rating: '4.9',
    timing: 'Same Day Dispatch',
    image: 'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?auto=format&fit=crop&w=600&q=80',
    destination: '/skyline',
    tag: 'Fashion & Outfits',
    isOpen: true,
    address: 'Station Road, Churu, Rajasthan',
    phone: '7023963189',
    freeDeliveryThreshold: 499,
    upiId: '7023963189@fam',
    payeeName: 'Skyline Premium Outfits'
  }
];

// Fallback Real Catalog Items (Skyline Premium Outfits Fashion Collection)
const FALLBACK_REAL_ITEMS = [
  {
    "id": "sky-item-01",
    "storeId": "skyline",
    "storeName": "Skyline Premium Outfits",
    "storeVertical": "fashion",
    "name": "Normandy Flax Camp-Collar Linen Shirt",
    "type": "product",
    "category": "shirts",
    "price": 1699,
    "originalPrice": 2799,
    "discount": "-39%",
    "image": "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80",
    "description": "Woven from 100% Normandy long-staple flax linen. Enzyme garment-washed for a naturally breathable, relaxed drape with real mother-of-pearl buttons.",
    "rating": 4.9,
    "reviews": 84,
    "sizes": [
      "M",
      "L",
      "XL"
    ],
    "destination": "/skyline"
  },
  {
    "id": "sky-item-02",
    "storeId": "skyline",
    "storeName": "Skyline Premium Outfits",
    "storeVertical": "fashion",
    "name": "Striped Riviera Mandarin Linen Shirt",
    "type": "product",
    "category": "shirts",
    "price": 1849,
    "originalPrice": 2999,
    "discount": "-38%",
    "image": "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=800&q=80",
    "description": "Band-collar shirt featuring subtle vertical chalk stripes. Breathable open-weave construction designed to keep you cool under the desert sun.",
    "rating": 4.8,
    "reviews": 46,
    "sizes": [
      "M",
      "L",
      "XL"
    ],
    "destination": "/skyline"
  },
  {
    "id": "sky-item-03",
    "storeId": "skyline",
    "storeName": "Skyline Premium Outfits",
    "storeVertical": "fashion",
    "name": "Milano Double-Pleated Gurkha Trousers",
    "type": "product",
    "category": "pants",
    "price": 2199,
    "originalPrice": 3699,
    "discount": "-41%",
    "image": "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=800&q=80",
    "description": "High-rise tailored trousers with twin forward pleats and extended side buckle adjusters. Delivers a dramatic, sharp taper silhouette.",
    "rating": 5,
    "reviews": 112,
    "sizes": [
      "M",
      "L",
      "XL"
    ],
    "destination": "/skyline"
  },
  {
    "id": "sky-item-04",
    "storeId": "skyline",
    "storeName": "Skyline Premium Outfits",
    "storeVertical": "fashion",
    "name": "Minimalist Japanese Stretch Chino",
    "type": "product",
    "category": "pants",
    "price": 1799,
    "originalPrice": 2899,
    "discount": "-38%",
    "image": "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=800&q=80",
    "description": "Constructed from densely woven Japanese cotton twill with 4-way mechanical stretch. Clean flat front with hidden interior coin pocket.",
    "rating": 4.8,
    "reviews": 68,
    "sizes": [
      "M",
      "L",
      "XL"
    ],
    "destination": "/skyline"
  },
  {
    "id": "sky-item-05",
    "storeId": "skyline",
    "storeName": "Skyline Premium Outfits",
    "storeVertical": "fashion",
    "name": "Heavyweight 340 GSM Canvas Overshirt",
    "type": "product",
    "category": "shirts",
    "price": 2499,
    "originalPrice": 3999,
    "discount": "-38%",
    "image": "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=800&q=80",
    "description": "Rugged yet refined workwear silhouette cut from heavyweight duck canvas with matte horn buttons and dual chest bellows pockets.",
    "rating": 4.9,
    "reviews": 53,
    "sizes": [
      "M",
      "L",
      "XL"
    ],
    "destination": "/skyline"
  },
  {
    "id": "sky-item-06",
    "storeId": "skyline",
    "storeName": "Skyline Premium Outfits",
    "storeVertical": "fashion",
    "name": "Wale Ribbed Corduroy Chore Jacket",
    "type": "product",
    "category": "jackets",
    "price": 2799,
    "originalPrice": 4499,
    "discount": "-38%",
    "image": "https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&w=800&q=80",
    "description": "Rich 8-wale plush corduroy jacket with antique brass snap buttons and tailored interior satin sleeve lining.",
    "rating": 4.9,
    "reviews": 39,
    "sizes": [
      "M",
      "L",
      "XL"
    ],
    "destination": "/skyline"
  },
  {
    "id": "sky-item-07",
    "storeId": "skyline",
    "storeName": "Skyline Premium Outfits",
    "storeVertical": "fashion",
    "name": "Handloom Raw Silk Angrakha Kurta Set",
    "type": "product",
    "category": "ethnic",
    "price": 3499,
    "originalPrice": 5999,
    "discount": "-42%",
    "image": "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80",
    "description": "Asymmetrical overlapping Angrakha placket tailored from handwoven tussar raw silk with tonal piping and matching tailored churidar.",
    "rating": 5,
    "reviews": 77,
    "sizes": [
      "M",
      "L",
      "XL"
    ],
    "destination": "/skyline"
  },
  {
    "id": "sky-item-08",
    "storeId": "skyline",
    "storeName": "Skyline Premium Outfits",
    "storeVertical": "fashion",
    "name": "Chanderi Embroidered Short Kurta",
    "type": "product",
    "category": "ethnic",
    "price": 2199,
    "originalPrice": 3499,
    "discount": "-37%",
    "image": "https://images.unsplash.com/photo-1605518216938-7c31b7b14ad0?auto=format&fit=crop&w=800&q=80",
    "description": "Modern short kurta crafted from lightweight Chanderi blend with intricate geometric threadwork across collar and cuffs. Pairs effortlessly with linen trousers or denims.",
    "rating": 4.8,
    "reviews": 51,
    "sizes": [
      "M",
      "L",
      "XL"
    ],
    "destination": "/skyline"
  },
  {
    "id": "sky-item-09",
    "storeId": "skyline",
    "storeName": "Skyline Premium Outfits",
    "storeVertical": "fashion",
    "name": "Supima Heavyweight 260 GSM Relaxed Tee",
    "type": "product",
    "category": "tshirts",
    "price": 899,
    "originalPrice": 1499,
    "discount": "-40%",
    "image": "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80",
    "description": "Engineered with 100% California Supima extra-long staple cotton. Dense 260 GSM fabric prevents transparency and holds its structured boxy silhouette wash after wash.",
    "rating": 4.9,
    "reviews": 164,
    "sizes": [
      "M",
      "L",
      "XL"
    ],
    "destination": "/skyline"
  },
  {
    "id": "sky-item-10",
    "storeId": "skyline",
    "storeName": "Skyline Premium Outfits",
    "storeVertical": "fashion",
    "name": "Textured Open-Knit Milano Polo",
    "type": "product",
    "category": "tshirts",
    "price": 1999,
    "originalPrice": 3199,
    "discount": "-38%",
    "image": "https://images.unsplash.com/photo-1578932750294-f5075e85f44a?auto=format&fit=crop&w=800&q=80",
    "description": "Vintage European resort aesthetic featuring a retro open-stitch waffle knit pattern, Johnny collar with no buttons, and ribbed hems.",
    "rating": 4.9,
    "reviews": 42,
    "sizes": [
      "M",
      "L",
      "XL"
    ],
    "destination": "/skyline"
  },
  {
    "id": "sky-pant-03",
    "storeId": "skyline",
    "storeName": "Skyline Premium Outfits",
    "storeVertical": "fashion",
    "name": "Tailored Slim-Fit Italian Formal Trousers",
    "type": "product",
    "category": "pants",
    "price": 1999,
    "originalPrice": 3499,
    "discount": "-43%",
    "image": "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=800&q=80",
    "description": "Premium poly-viscose blend with sharp permanent front crease, tailored waistband with side adjusters, breathable formal drape.",
    "rating": 4.9,
    "reviews": 64,
    "sizes": [
      "M",
      "L",
      "XL"
    ],
    "destination": "/skyline"
  },
  {
    "id": "sky-pant-04",
    "storeId": "skyline",
    "storeName": "Skyline Premium Outfits",
    "storeVertical": "fashion",
    "name": "Pure European Flax Linen Drawstring Pants",
    "type": "product",
    "category": "pants",
    "price": 2299,
    "originalPrice": 3999,
    "discount": "-43%",
    "image": "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=800&q=80",
    "description": "100% natural pre-washed European linen with elasticated drawstring waist, relaxed tapered drape, effortless airy comfort.",
    "rating": 4.8,
    "reviews": 49,
    "sizes": [
      "M",
      "L",
      "XL"
    ],
    "destination": "/skyline"
  },
  {
    "id": "sky-pant-05",
    "storeId": "skyline",
    "storeName": "Skyline Premium Outfits",
    "storeVertical": "fashion",
    "name": "Heavy Twill Tactical 6-Pocket Cargo Pants",
    "type": "product",
    "category": "pants",
    "price": 2499,
    "originalPrice": 4299,
    "discount": "-42%",
    "image": "https://images.unsplash.com/photo-1517445312882-bc9910d016b7?auto=format&fit=crop&w=800&q=80",
    "description": "320 GSM rugged cotton twill, 6 functional bellows pockets with concealed snap buttons, relaxed street silhouette.",
    "rating": 4.9,
    "reviews": 78,
    "sizes": [
      "M",
      "L",
      "XL"
    ],
    "destination": "/skyline"
  },
  {
    "id": "sky-pant-06",
    "storeId": "skyline",
    "storeName": "Skyline Premium Outfits",
    "storeVertical": "fashion",
    "name": "Classic British Khaki Slim Stretch Chinos",
    "type": "product",
    "category": "pants",
    "price": 1799,
    "originalPrice": 2999,
    "discount": "-40%",
    "image": "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=800&q=80",
    "description": "98% combed cotton with 2% elastane flex, peach-finish soft handfeel, versatile work-to-weekend clean tailored staple.",
    "rating": 4.8,
    "reviews": 53,
    "sizes": [
      "M",
      "L",
      "XL"
    ],
    "destination": "/skyline"
  },
  {
    "id": "sky-shirt-03",
    "storeId": "skyline",
    "storeName": "Skyline Premium Outfits",
    "storeVertical": "fashion",
    "name": "Crisp White Oxford Button-Down Shirt",
    "type": "product",
    "category": "shirts",
    "price": 1899,
    "originalPrice": 3299,
    "discount": "-42%",
    "image": "https://images.unsplash.com/photo-1607345366928-199ea26cfe3e?auto=format&fit=crop&w=800&q=80",
    "description": "100% long-staple Egyptian cotton basketweave, structured button-down collar, mother-of-pearl finish buttons, wrinkle-resistant finish.",
    "rating": 5,
    "reviews": 87,
    "sizes": [
      "M",
      "L",
      "XL"
    ],
    "destination": "/skyline"
  },
  {
    "id": "sky-shirt-04",
    "storeId": "skyline",
    "storeName": "Skyline Premium Outfits",
    "storeVertical": "fashion",
    "name": "Skyline Indigo Chambray Denim Casual Shirt",
    "type": "product",
    "category": "shirts",
    "price": 1999,
    "originalPrice": 3499,
    "discount": "-43%",
    "image": "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80",
    "description": "Lightweight indigo-dyed chambray cotton with double chest patch pockets and subtle enzyme wash. Gets softer with each laundry wash.",
    "rating": 4.9,
    "reviews": 92,
    "sizes": [
      "M",
      "L",
      "XL"
    ],
    "destination": "/skyline"
  },
  {
    "id": "sky-shirt-05",
    "storeId": "skyline",
    "storeName": "Skyline Premium Outfits",
    "storeVertical": "fashion",
    "name": "Resort Drape Cuban Collar Casual Shirt",
    "type": "product",
    "category": "shirts",
    "price": 1699,
    "originalPrice": 2899,
    "discount": "-41%",
    "image": "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80",
    "description": "Breathable high-grade viscose rayon with camp open collar, relaxed holiday silhouette and soft fluid drape for tropical warmth.",
    "rating": 4.8,
    "reviews": 61,
    "sizes": [
      "M",
      "L",
      "XL"
    ],
    "destination": "/skyline"
  },
  {
    "id": "sky-shirt-06",
    "storeId": "skyline",
    "storeName": "Skyline Premium Outfits",
    "storeVertical": "fashion",
    "name": "Heritage Heavyweight Brushed Flannel Check Shirt",
    "type": "product",
    "category": "shirts",
    "price": 2199,
    "originalPrice": 3699,
    "discount": "-41%",
    "image": "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=800&q=80",
    "description": "Double-brushed 240 GSM organic cotton flannel, authentic buffalo check pattern, warm and cozy layering staple with twin flap pockets.",
    "rating": 4.9,
    "reviews": 73,
    "sizes": [
      "M",
      "L",
      "XL"
    ],
    "destination": "/skyline"
  },
  {
    "id": "sky-shirt-07",
    "storeId": "skyline",
    "storeName": "Skyline Premium Outfits",
    "storeVertical": "fashion",
    "name": "Luxury Matte Black Tailored Casual Shirt",
    "type": "product",
    "category": "shirts",
    "price": 1799,
    "originalPrice": 2999,
    "discount": "-40%",
    "image": "https://images.unsplash.com/photo-1603252109303-2751441dd157?auto=format&fit=crop&w=800&q=80",
    "description": "Deep pigment jet black poplin cotton with modern spread collar, streamlined French placket, dinner & evening occasion ready.",
    "rating": 4.9,
    "reviews": 82,
    "sizes": [
      "M",
      "L",
      "XL"
    ],
    "destination": "/skyline"
  },
  {
    "id": "sky-jean-01",
    "storeId": "skyline",
    "storeName": "Skyline Premium Outfits",
    "storeVertical": "fashion",
    "name": "Japanese Raw Selvedge Straight-Leg Jeans",
    "type": "product",
    "category": "jeans",
    "price": 2899,
    "originalPrice": 4999,
    "discount": "-42%",
    "image": "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=800&q=80",
    "description": "13.5 oz authentic vintage shuttle-loom selvedge denim, deep dark indigo raw finish with redline selvedge ID, develops custom fades over wear.",
    "rating": 5,
    "reviews": 114,
    "sizes": [
      "M",
      "L",
      "XL"
    ],
    "destination": "/skyline"
  },
  {
    "id": "sky-jean-02",
    "storeId": "skyline",
    "storeName": "Skyline Premium Outfits",
    "storeVertical": "fashion",
    "name": "Vintage Blue Slim-Tapered Stretch Jeans",
    "type": "product",
    "category": "jeans",
    "price": 2399,
    "originalPrice": 3999,
    "discount": "-40%",
    "image": "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=800&q=80",
    "description": "Authentic vintage faded mid-blue wash with hand-sanded whisker details, 12 oz ring-spun denim with 2% comfort stretch for all-day ease.",
    "rating": 4.9,
    "reviews": 95,
    "sizes": [
      "M",
      "L",
      "XL"
    ],
    "destination": "/skyline"
  },
  {
    "id": "sky-jean-03",
    "storeId": "skyline",
    "storeName": "Skyline Premium Outfits",
    "storeVertical": "fashion",
    "name": "Stay-Black Slim Straight Stretch Denim",
    "type": "product",
    "category": "jeans",
    "price": 2199,
    "originalPrice": 3799,
    "discount": "-42%",
    "image": "https://images.unsplash.com/photo-1582552938357-32b906df40cb?auto=format&fit=crop&w=800&q=80",
    "description": "Reactive-dyed non-fade pitch black denim that maintains deep shade through dozens of washes, tailored clean ankle break.",
    "rating": 4.9,
    "reviews": 88,
    "sizes": [
      "M",
      "L",
      "XL"
    ],
    "destination": "/skyline"
  },
  {
    "id": "sky-jean-04",
    "storeId": "skyline",
    "storeName": "Skyline Premium Outfits",
    "storeVertical": "fashion",
    "name": "90s Retro Loose Relaxed Baggy Jeans",
    "type": "product",
    "category": "jeans",
    "price": 2599,
    "originalPrice": 4299,
    "discount": "-40%",
    "image": "https://images.unsplash.com/photo-1565084888279-aca607ecce0c?auto=format&fit=crop&w=800&q=80",
    "description": "100% heavyweight cotton stone-washed denim in a relaxed 90s skater cut with generous thigh room and wide straight leg drape.",
    "rating": 4.8,
    "reviews": 67,
    "sizes": [
      "M",
      "L",
      "XL"
    ],
    "destination": "/skyline"
  },
  {
    "id": "sky-jean-05",
    "storeId": "skyline",
    "storeName": "Skyline Premium Outfits",
    "storeVertical": "fashion",
    "name": "Smoke Charcoal Washed Slim Denim Jeans",
    "type": "product",
    "category": "jeans",
    "price": 2299,
    "originalPrice": 3899,
    "discount": "-41%",
    "image": "https://images.unsplash.com/photo-1584370848010-d7fe6bc767ec?auto=format&fit=crop&w=800&q=80",
    "description": "Charcoal grey mineral-washed finish with subtle textured distress, reinforced chain stitching, modern urban tapered silhouette.",
    "rating": 4.9,
    "reviews": 74,
    "sizes": [
      "M",
      "L",
      "XL"
    ],
    "destination": "/skyline"
  },
  {
    "id": "sky-jean-06",
    "storeId": "skyline",
    "storeName": "Skyline Premium Outfits",
    "storeVertical": "fashion",
    "name": "Classic Rinse Indigo Regular Fit Jeans",
    "type": "product",
    "category": "jeans",
    "price": 1999,
    "originalPrice": 3299,
    "discount": "-39%",
    "image": "https://images.unsplash.com/photo-1604176354204-9268737828e4?auto=format&fit=crop&w=800&q=80",
    "description": "Everyday essential 5-pocket denim with clean single-rinse dark indigo wash, durable copper rivets and hardware, straight leg cut.",
    "rating": 4.8,
    "reviews": 58,
    "sizes": [
      "M",
      "L",
      "XL"
    ],
    "destination": "/skyline"
  },
  {
    "id": "sky-tee-02",
    "storeId": "skyline",
    "storeName": "Skyline Premium Outfits",
    "storeVertical": "fashion",
    "name": "Heavyweight 280 GSM Boxy Streetwear Tee",
    "type": "product",
    "category": "tshirts",
    "price": 999,
    "originalPrice": 1699,
    "discount": "-41%",
    "image": "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=800&q=80",
    "description": "100% bio-washed combed cotton, drop-shoulder boxy cut, ribbed thick collar that retains shape even after dozens of machine washes.",
    "rating": 4.9,
    "reviews": 104,
    "sizes": [
      "M",
      "L",
      "XL"
    ],
    "destination": "/skyline"
  },
  {
    "id": "sky-polo-02",
    "storeId": "skyline",
    "storeName": "Skyline Premium Outfits",
    "storeVertical": "fashion",
    "name": "Double-Mercerized Luxury Tipped Polo",
    "type": "product",
    "category": "tshirts",
    "price": 1599,
    "originalPrice": 2699,
    "discount": "-41%",
    "image": "https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&w=800&q=80",
    "description": "Silk-like luster double-mercerized Egyptian cotton, contrast tipping detail on collar and cuffs, engraved horn buttons.",
    "rating": 4.9,
    "reviews": 79,
    "sizes": [
      "M",
      "L",
      "XL"
    ],
    "destination": "/skyline"
  },
  {
    "id": "sky-jacket-03",
    "storeId": "skyline",
    "storeName": "Skyline Premium Outfits",
    "storeVertical": "fashion",
    "name": "Classic Suede Harrington Bomber Jacket",
    "type": "product",
    "category": "jackets",
    "price": 3499,
    "originalPrice": 5999,
    "discount": "-42%",
    "image": "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=800&q=80",
    "description": "Soft vegan micro-suede exterior with heritage tartan plaid lining, antique metal two-way zipper, ribbed elastic hem and cuffs.",
    "rating": 5,
    "reviews": 62,
    "sizes": [
      "M",
      "L",
      "XL"
    ],
    "destination": "/skyline"
  }
];

export default function ChuruOneHomePage() {
  const [legalModalOpen, setLegalModalOpen] = useState(false);
  const [legalTab, setLegalTab] = useState('terms');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [toastMessage, setToastMessage] = useState('');

  // ─── DYNAMIC MARKETPLACE DATA (Real Stores & Live Products Feed) ──
  const [stores, setStores] = useState(FALLBACK_REAL_STORES);
  const [items, setItems] = useState(FALLBACK_REAL_ITEMS);
  const [categories, setCategories] = useState([
    { id: 'all', name: 'All Collection', count: FALLBACK_REAL_ITEMS.length },
    { id: 'shirts', name: 'Shirts', count: 8 },
    { id: 'pants', name: 'Pants & Chinos', count: 6 },
    { id: 'jeans', name: 'Jeans & Denim', count: 6 },
    { id: 'tshirts', name: 'T-Shirts & Polos', count: 4 },
    { id: 'jackets', name: 'Jackets & Outerwear', count: 2 },
    { id: 'deals', name: 'Special Offers', count: FALLBACK_REAL_ITEMS.length }
  ]);
  const [deals, setDeals] = useState([]);
  const [isLoadingFeed, setIsLoadingFeed] = useState(true);

  // Unified ChuruOne SSO User State
  const [currentUser, setCurrentUser] = useState(null);
  const [authToken, setAuthToken] = useState('');
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef(null);

  // ─── CHURUONE NATIVE CART SYSTEM (Empty initially, zero dummy data) ─
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem('churuone_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Sync cart to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('churuone_cart', JSON.stringify(cartItems));
    } catch {
      // ignore
    }
  }, [cartItems]);

  // Cart Coupon State
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');

  // ─── CHURUONE CHECKOUT MODAL STATE ───────────────────────────────
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [selectedLandmark, setSelectedLandmark] = useState('Subhash Chowk');
  const [orderNotes, setOrderNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('upi'); // 'upi' (SmartPay QR) | 'cod'
  const [orderGps, setOrderGps] = useState(null);
  const [isCapturingGps, setIsCapturingGps] = useState(false);
  const [gpsStatusText, setGpsStatusText] = useState('');
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  // ─── UNIFIED PAYMENT SYSTEM & AUTH GATING STATE ─────────────────
  const [isUpiModalOpen, setIsUpiModalOpen] = useState(false);
  const [pendingPaymentData, setPendingPaymentData] = useState(null);
  const [pendingOrder, setPendingOrder] = useState(null);
  const [pendingStoreId, setPendingStoreId] = useState('shawarma');
  const [isAuthPromptOpen, setIsAuthPromptOpen] = useState(false);
  const [authPromptTitle, setAuthPromptTitle] = useState('ChuruOne Login Required');
  const [authPromptMessage, setAuthPromptMessage] = useState('');
  const [authPromptRedirectMode, setAuthPromptRedirectMode] = useState('login');
  const [authPromptRequirePhone, setAuthPromptRequirePhone] = useState(false);

  // Computed Auth & Phone OTP Verification Status
  const cleanUserPhone = String(currentUser?.phone || currentUser?.phoneNumber || '').replace(/\D/g, '').slice(-10);
  const isUserLoggedIn = Boolean(currentUser && (currentUser.id || currentUser.phone || currentUser.email || currentUser.name));
  const isUserPhoneVerified = Boolean(
    isUserLoggedIn && 
    (currentUser.phoneVerified === true || currentUser.isPhoneAuth === true || currentUser.isPhoneVerified === true) && 
    cleanUserPhone.length === 10
  );

  const navigateToChuruOneAuth = (mode = 'login', requirePhoneOtp = false) => {
    try {
      const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
      const phoneParam = requirePhoneOtp ? '&requirePhoneOtp=true' : '';
      window.location.href = `/auth?mode=${mode}&returnUrl=${returnUrl}${phoneParam}`;
    } catch {
      window.location.href = `/auth?mode=${mode}`;
    }
  };

  // Order Confirmation State
  const [orderSuccessData, setOrderSuccessData] = useState(null);

  // ─── NASH STUDIO SALON APPOINTMENT BOOKING SYSTEM ───────────────
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [bookingDate, setBookingDate] = useState('Today');
  const [bookingTime, setBookingTime] = useState('4:00 PM');
  const [bookingCustomerName, setBookingCustomerName] = useState('');
  const [bookingCustomerPhone, setBookingCustomerPhone] = useState('');
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [bookingOrderResult, setBookingOrderResult] = useState(null);

  // Set browser title
  useEffect(() => {
    document.title = "Skyline Premium | Luxury Menswear & Fashion • Churu";
  }, []);

  // ─── FETCH REAL MARKETPLACE FEED (CDRA-v1 Backend Algorithm) ─────
  useEffect(() => {
    let isMounted = true;
    async function loadFeed() {
      try {
        setIsLoadingFeed(true);
        const res = await fetch('/api/platform/marketplace');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (isMounted && data.success) {
          if (Array.isArray(data.stores) && data.stores.length > 0) {
            const valid = data.stores.filter(s => {
              const id = String(s?.id || '').toLowerCase().trim();
              return id === 'skyline';
            });
            setStores(valid.length > 0 ? valid : FALLBACK_REAL_STORES);
          }
          if (Array.isArray(data.items) && data.items.length > 0) {
            const skylineItems = data.items.filter(it => 
              String(it.storeId || '').toLowerCase() === 'skyline' &&
              it.category !== 'footwear' &&
              !it.id?.startsWith('slick-shoe') &&
              !/shoe|sneaker|footwear/i.test(it.name || '')
            );
            const finalItems = skylineItems.length > 0 ? skylineItems : FALLBACK_REAL_ITEMS;
            setItems(finalItems);

            // Dynamically calculate fashion category counts
            const countFor = (catId) => {
              if (catId === 'all') return finalItems.length;
              if (catId === 'deals') return finalItems.filter(i => (i.originalPrice || 0) > i.price).length;
              return finalItems.filter(i => i.category === catId).length;
            };
            setCategories([
              { id: 'all', name: 'All Collection', count: countFor('all') },
              { id: 'shirts', name: 'Shirts', count: countFor('shirts') },
              { id: 'pants', name: 'Pants & Chinos', count: countFor('pants') },
              { id: 'jeans', name: 'Jeans & Denim', count: countFor('jeans') },
              { id: 'tshirts', name: 'T-Shirts & Polos', count: countFor('tshirts') },
              { id: 'jackets', name: 'Jackets & Outerwear', count: countFor('jackets') },
              { id: 'deals', name: 'Special Offers', count: countFor('deals') }
            ]);
          }
          if (Array.isArray(data.deals)) {
            setDeals(data.deals.filter(d => String(d.storeId || '').toLowerCase() === 'skyline'));
          }
        }
      } catch (err) {
        console.warn('Marketplace feed fallback loaded (local or offline mode):', err);
      } finally {
        if (isMounted) setIsLoadingFeed(false);
      }
    }
    loadFeed();
    return () => { isMounted = false; };
  }, []);

  // Sync SSO session on mount & subscribe to cross-app auth changes
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlUserRaw = params.get('churuone_user');
      const urlToken = params.get('churuone_token');

      if (urlUserRaw) {
        const parsed = sanitizeChuruOneUser(JSON.parse(decodeURIComponent(urlUserRaw)));
        setCurrentUser(parsed);
        setAuthToken(urlToken || '');
        setChuruOneSession(parsed, urlToken || '');
        if (parsed.name) {
          setBookingCustomerName(parsed.name);
          setCustomerName(parsed.name);
        }
        if (parsed.phone) {
          setBookingCustomerPhone(parsed.phone);
          setCustomerPhone(parsed.phone);
        }

        params.delete('churuone_user');
        params.delete('churuone_token');
        params.delete('account_created');
        const cleanUrl = window.location.pathname + (params.toString() ? `?${params.toString()}` : '');
        window.history.replaceState({}, document.title, cleanUrl);
        return;
      }

      const session = getChuruOneSession();
      if (session && session.user) {
        const sUser = sanitizeChuruOneUser(session.user);
        setCurrentUser(sUser);
        setAuthToken(session.token || '');
        if (sUser.name) {
          setBookingCustomerName(sUser.name);
          setCustomerName(sUser.name);
        }
        if (sUser.phone) {
          setBookingCustomerPhone(sUser.phone);
          setCustomerPhone(sUser.phone);
        }
      }
    } catch (err) {
      console.warn('SSO sync warning in ChuruOneHomePage:', err);
    }

    // Cross-app reactive Single Sign-On listener
    const unsubscribeSso = subscribeToChuruOneAuth((user, token) => {
      if (user) {
        const sUser = sanitizeChuruOneUser(user);
        setCurrentUser(sUser);
        setAuthToken(token || '');
        if (sUser.name) {
          setBookingCustomerName(sUser.name);
          setCustomerName(sUser.name);
        }
        if (sUser.phone) {
          setBookingCustomerPhone(sUser.phone);
          setCustomerPhone(sUser.phone);
        }
      } else {
        setCurrentUser(null);
        setAuthToken('');
      }
    });

    return () => unsubscribeSso();
  }, []);

  // Close account dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(e.target)) {
        setIsAccountMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    clearChuruOneSession();
    setCurrentUser(null);
    setAuthToken('');
    setIsAccountMenuOpen(false);
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2500);
  };

  const getStoreUrl = (storeId) => {
    let base = `/?storeId=${storeId}`;
    if (storeId === 'shawarma') {
      base = '/shawarma';
    } else if (storeId === 'nash-studio') {
      base = '/nash';
    } else if (storeId === 'skyline') {
      base = '/skyline';
    }

    if (currentUser) {
      return attachSsoParams(base, currentUser, authToken);
    }
    return base;
  };

  // ─── CART OPERATIONS ──────────────────────────────────────────────
  const addToCart = (product) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, {
        id: product.id,
        storeId: product.storeId || 'shawarma',
        storeName: product.storeName || 'Shawarma Nights',
        storeVertical: product.storeVertical || 'food',
        name: product.name,
        price: Number(product.price) || 0,
        mrp: Number(product.originalPrice || product.mrp) || Math.round((Number(product.price) || 0) * 1.25),
        image: product.image,
        qty: 1
      }];
    });
    showToast(`Added ${product.name} to bag!`);
    // Do not auto-open cart drawer: let customer shop smoothly without interruption!
  };

  const updateCartQty = (id, delta) => {
    setCartItems(prev => {
      return prev.map(item => {
        if (item.id === id) {
          const newQty = item.qty + delta;
          return newQty > 0 ? { ...item, qty: newQty } : null;
        }
        return item;
      }).filter(Boolean);
    });
  };

  const removeFromCart = (id) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  const clearCart = () => {
    setCartItems([]);
    setAppliedCoupon(null);
  };

  // Cart Calculations
  const cartSubtotal = cartItems.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const cartMrpTotal = cartItems.reduce((sum, item) => sum + (item.mrp * item.qty), 0);
  const cartCount = cartItems.reduce((sum, item) => sum + item.qty, 0);

  // Coupon Logic
  const handleApplyCoupon = (e) => {
    e.preventDefault();
    setCouponError('');
    const cleanCode = couponInput.trim().toUpperCase();
    if (!cleanCode) return;

    if (cleanCode === 'NIGHT50' || cleanCode === 'CHURU50' || cleanCode === 'FIRSTORDER') {
      const discount = Math.min(50, Math.round(cartSubtotal * 0.2));
      setAppliedCoupon({ code: cleanCode, discount, desc: '₹50 Flat Welcome Discount' });
      showToast(`Coupon ${cleanCode} applied! Saved ₹${discount}`);
      setCouponInput('');
    } else if (cleanCode === 'FREE') {
      setAppliedCoupon({ code: cleanCode, discount: 40, desc: 'Free Delivery Bonus' });
      showToast('Coupon FREE applied!');
      setCouponInput('');
    } else {
      setCouponError('Invalid coupon code. Try NIGHT50 or CHURU50');
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponError('');
    showToast('Coupon removed');
  };

  const couponDiscount = appliedCoupon ? appliedCoupon.discount : 0;
  const deliveryFee = 0; // Free express delivery across Churu City
  const finalCartTotal = Math.max(0, cartSubtotal - couponDiscount + deliveryFee);
  const cartTotal = finalCartTotal;
  const totalSavings = (cartMrpTotal - cartSubtotal) + couponDiscount;

  // ─── GPS CAPTURE ENGINE ───────────────────────────────────────────
  const handleCaptureGPS = () => {
    setIsCapturingGps(true);
    setGpsStatusText('Locating via satellite...');
    if (!navigator.geolocation) {
      setGpsStatusText('GPS not supported by your browser');
      setIsCapturingGps(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const accuracy = Math.round(pos.coords.accuracy);
        setOrderGps({
          lat,
          lng,
          accuracy,
          mapsUrl: `https://maps.google.com/?q=${lat},${lng}`
        });
        setGpsStatusText(`GPS Captured: ${lat.toFixed(4)}, ${lng.toFixed(4)} (±${accuracy}m)`);
        setIsCapturingGps(false);
      },
      (err) => {
        console.warn('GPS error:', err);
        setGpsStatusText('Permission denied. Please select your nearest landmark below.');
        setIsCapturingGps(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // ─── MULTI-STORE ORDER PLACEMENT FLOW ────────────────────────────
  const handleProceedToCheckout = () => {
    if (cartItems.length === 0) return;

    // 1. Mandatory Login Check (Bina login ke order block)
    if (!isUserLoggedIn) {
      showToast('🔒 Order karne ke liye ChuruOne account me login hona aniwarya hai.');
      setAuthPromptTitle('ChuruOne Account Login Required');
      setAuthPromptMessage('Order complete karne ke liye pehle apna ChuruOne account login karein. Aap Google ya Mobile OTP se 1-click login kar sakte hain.');
      setAuthPromptRedirectMode('login');
      setAuthPromptRequirePhone(false);
      setIsAuthPromptOpen(true);
      return;
    }

    // 2. Mandatory Phone Verification for Home Delivery Items
    if (!isUserPhoneVerified) {
      showToast('📱 Home delivery ke liye verified mobile number aniwarya hai.');
      setAuthPromptTitle('Mobile Verification Required');
      setAuthPromptMessage('Churu City home delivery dispatch aur rider direct verification ke liye aapka mobile number OTP verified hona aniwarya hai.');
      setAuthPromptRedirectMode('verify_phone');
      setAuthPromptRequirePhone(true);
      setIsAuthPromptOpen(true);
      return;
    }

    setIsCartOpen(false);
    setIsCheckoutModalOpen(true);
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();

    // 1. Strict Login Check
    if (!isUserLoggedIn) {
      showToast('🔒 Order place karne ke liye ChuruOne account login hona aniwarya hai.');
      setIsCheckoutModalOpen(false);
      navigateToChuruOneAuth('login');
      return;
    }

    // 2. Strict Phone Verification Check for Home Delivery
    if (!isUserPhoneVerified) {
      showToast('📱 Home delivery orders ke liye mobile number OTP verify hona aniwarya hai.');
      setIsCheckoutModalOpen(false);
      navigateToChuruOneAuth('verify_phone', true);
      return;
    }

    if (!customerName.trim()) {
      showToast('Please enter your full name');
      return;
    }
    const cleanPhone = customerPhone.replace(/\D/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      showToast('Please enter a valid 10-digit mobile number');
      return;
    }
    if (!deliveryAddress.trim() && !selectedLandmark) {
      showToast('Please enter your street address or landmark');
      return;
    }

    setIsSubmittingOrder(true);
    try {
      // Group items by store for accurate multi-store order dispatch
      const itemsByStore = {};
      cartItems.forEach(item => {
        const sId = item.storeId || 'shawarma';
        if (!itemsByStore[sId]) itemsByStore[sId] = [];
        itemsByStore[sId].push(item);
      });

      const orderResults = [];

      for (const [storeId, storeItems] of Object.entries(itemsByStore)) {
        const storeSubtotal = storeItems.reduce((sum, it) => sum + (it.price * it.qty), 0);
        const storeDiscount = appliedCoupon ? Math.round(couponDiscount * (storeSubtotal / (cartSubtotal || 1))) : 0;
        const storeTotal = Math.max(0, storeSubtotal - storeDiscount);

        const fullAddress = `${deliveryAddress ? deliveryAddress + ' • ' : ''}Near ${selectedLandmark}, Churu, Rajasthan`;

        const isOnline = paymentMethod === 'upi';
        const payload = {
          storeId,
          customer: {
            name: customerName.trim(),
            phone: `+91${cleanPhone}`,
            email: currentUser?.email || ''
          },
          customerName: customerName.trim(),
          customerPhone: `+91${cleanPhone}`,
          phoneVerified: isUserPhoneVerified,
          authenticated: isUserLoggedIn,
          customerToken: authToken || currentUser?.token || '',
          items: storeItems.map(it => ({
            id: it.id,
            name: it.name,
            price: it.price,
            unitPrice: it.price,
            qty: it.qty,
            image: it.image
          })),
          deliveryType: 'delivery',
          address: fullAddress,
          landmark: selectedLandmark,
          orderGps,
          lat: orderGps?.lat,
          lng: orderGps?.lng,
          paymentMethod: isOnline ? 'upi' : 'cod',
          paymentStatus: isOnline ? 'pending_upi' : 'pending',
          status: isOnline ? 'payment_pending' : 'confirmed',
          couponCode: appliedCoupon?.code || null,
          discount: storeDiscount,
          subtotal: storeSubtotal,
          total: storeTotal,
          totalPrice: storeTotal,
          notes: orderNotes ? orderNotes.trim() : ''
        };

        const res = await fetch(`/api/orders?storeId=${storeId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-store-id': storeId,
            ...(authToken ? { 'x-auth-token': authToken } : {})
          },
          body: JSON.stringify(payload)
        });

        const data = await res.json().catch(() => ({}));
        if (data.success && data.order) {
          orderResults.push({ storeId, order: data.order });
        } else if (res.status === 401 || data.requireAuth) {
          showToast('🔒 Order karne ke liye login aniwarya hai');
          setIsCheckoutModalOpen(false);
          navigateToChuruOneAuth('login');
          return;
        } else if (res.status === 403 || data.requirePhoneOtp) {
          showToast('📱 Home delivery ke liye verified phone number aniwarya hai');
          setIsCheckoutModalOpen(false);
          navigateToChuruOneAuth('verify_phone', true);
          return;
        } else {
          // Fallback order creation
          orderResults.push({
            storeId,
            order: {
              id: `ORD-${Date.now().toString().slice(-6)}`,
              orderNumber: `CHURU-${Math.floor(1000 + Math.random() * 9000)}`,
              total: storeTotal,
              status: isOnline ? 'payment_pending' : 'confirmed',
              paymentStatus: isOnline ? 'pending_upi' : 'pending',
              customer: { name: customerName, phone: cleanPhone }
            }
          });
        }
      }

      const primaryStoreResult = orderResults[0] || {};
      const primaryOrder = primaryStoreResult.order || {};
      const primaryStoreId = primaryStoreResult.storeId || 'shawarma';
      const primaryStore = stores.find(s => s.id === primaryStoreId) || {};

      // ─── IF CASH ON DELIVERY (COD) ───
      if (paymentMethod === 'cod') {
        setOrderSuccessData({
          orderNumber: primaryOrder.orderNumber || primaryOrder.id || 'CHURU-SUCCESS',
          ordersCount: orderResults.length,
          itemsCount: cartCount,
          totalAmount: finalCartTotal,
          paymentMethod: 'Cash on Delivery (COD)',
          paymentStatus: 'Pending (Cash to Rider)',
          customerName: customerName.trim(),
          customerPhone: cleanPhone,
          address: `${deliveryAddress ? deliveryAddress + ', ' : ''}Near ${selectedLandmark}, Churu`,
          estimatedTime: '20-30 Mins Express Dispatch'
        });

        clearCart();
        setIsCheckoutModalOpen(false);
        showToast('Order placed successfully via Cash on Delivery!');
      } else {
        // ─── IF INSTANT UPI / SMARTPAY (UNIFIED PAYMENT SYSTEM) ───
        // DO NOT confirm order yet! Open Unified UpiPaymentModal Engine!
        const upiPayload = {
          orderId: primaryOrder.orderNumber || primaryOrder.id || `CHURU-${Date.now().toString().slice(-6)}`,
          id: primaryOrder.id || primaryOrder.orderNumber,
          storeId: primaryStoreId,
          storeName: primaryStore.name || 'ChuruOne Marketplace',
          grandTotal: finalCartTotal,
          total: finalCartTotal,
          upiId: primaryStore.upiId || '7023963189@fam',
          payeeName: primaryStore.payeeName || primaryStore.name || 'ChuruOne Marketplace',
          customerName: customerName.trim(),
          customerPhone: `+91 ${cleanPhone}`,
          address: `${deliveryAddress ? deliveryAddress + ' • ' : ''}Near ${selectedLandmark}, Churu`,
          orderGps,
          items: cartItems
        };

        setPendingPaymentData(upiPayload);
        setPendingOrder(primaryOrder);
        setPendingStoreId(primaryStoreId);
        setIsCheckoutModalOpen(false);
        setIsUpiModalOpen(true);
      }
    } catch (err) {
      console.error('Order placement error:', err);
      showToast('Server issue. Kripya punah prayas karein.');
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  // ─── UPI MODAL PAYMENT SUCCESS CALLBACK ───────────────────────────
  const handlePaymentSuccess = async (paymentResult) => {
    const orderToConfirm = pendingOrder;
    try {
      if (orderToConfirm?.id) {
        const sId = pendingStoreId || 'shawarma';
        await fetch('/api/orders/update-status', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-store-id': sId,
            ...(authToken ? { 'x-auth-token': authToken } : {})
          },
          body: JSON.stringify({
            orderId: orderToConfirm.id,
            status: 'confirmed',
            paymentStatus: 'paid',
            storeId: sId,
            utr: paymentResult?.utr || null
          })
        }).catch(() => {});
      }
    } catch (e) {
      console.warn('Order status update error:', e);
    }

    const cleanPhone = (customerPhone || currentUser?.phone || '').replace(/\D/g, '').slice(-10);
    setOrderSuccessData({
      orderNumber: orderToConfirm?.orderNumber || orderToConfirm?.id || pendingPaymentData?.orderId || 'CHURU-SUCCESS',
      ordersCount: 1,
      itemsCount: cartCount,
      totalAmount: finalCartTotal,
      paymentMethod: 'Instant UPI (Auto-Paid ✓)',
      paymentStatus: 'PAID',
      customerName: customerName.trim() || currentUser?.name || 'Customer',
      customerPhone: cleanPhone,
      address: `${deliveryAddress ? deliveryAddress + ', ' : ''}Near ${selectedLandmark}, Churu`,
      estimatedTime: '20-30 Mins Express Dispatch'
    });

    clearCart();
    setIsUpiModalOpen(false);
    setPendingPaymentData(null);
    setPendingOrder(null);
    showToast('Payment verified successfully! Order confirmed.');
  };

  // ─── SALON BOOKING HANDLERS (Nash Studio) ─────────────────────────
  const openBookingModal = (service) => {
    // 1. Mandatory Login Check (Bina login ke booking allow nahi)
    if (!isUserLoggedIn) {
      showToast('🔒 Salon appointment book karne ke liye pehle login karein.');
      setAuthPromptTitle('Login Required for Salon Booking');
      setAuthPromptMessage('Nash Studio me appointment slot reserve karne ke liye pehle apna ChuruOne account login karein.');
      setAuthPromptRedirectMode('login');
      setAuthPromptRequirePhone(false);
      setIsAuthPromptOpen(true);
      return;
    }

    setSelectedService(service);
    setBookingConfirmed(false);
    setBookingOrderResult(null);
    if (currentUser?.name && !bookingCustomerName) setBookingCustomerName(currentUser.name);
    if (currentUser?.phone && !bookingCustomerPhone) setBookingCustomerPhone(currentUser.phone);
    setIsBookingModalOpen(true);
  };

  const handleConfirmBooking = async (e) => {
    e.preventDefault();

    // 1. Strict Login Check
    if (!isUserLoggedIn) {
      showToast('🔒 Appointment book karne ke liye pehle login karein.');
      setIsBookingModalOpen(false);
      navigateToChuruOneAuth('login');
      return;
    }

    if (!bookingCustomerName.trim() || !bookingCustomerPhone.trim()) {
      showToast('Please enter your name and phone number');
      return;
    }
    const cleanPhone = bookingCustomerPhone.replace(/\D/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      showToast('Please enter a valid 10-digit mobile number');
      return;
    }

    // NOTE: For Salon Booking, phone verification is NOT mandatory! (As instructed: "aur booking wale me no. verification jruri nhi")
    try {
      const res = await fetch('/api/orders?storeId=nash-studio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-store-id': 'nash-studio',
          ...(authToken ? { 'x-auth-token': authToken } : {})
        },
        body: JSON.stringify({
          storeId: 'nash-studio',
          customer: { name: bookingCustomerName.trim(), phone: `+91${cleanPhone}` },
          customerName: bookingCustomerName.trim(),
          customerPhone: `+91${cleanPhone}`,
          phoneVerified: false, // NOT mandatory for bookings
          authenticated: isUserLoggedIn,
          customerToken: authToken || currentUser?.token || '',
          items: [{
            id: selectedService.id,
            name: selectedService.name,
            price: selectedService.price,
            unitPrice: selectedService.price,
            qty: 1,
            durationMinutes: selectedService.durationMinutes || 30
          }],
          deliveryType: 'booking',
          dateISO: new Date().toISOString().split('T')[0],
          timeSlot: `${bookingDate} at ${bookingTime}`,
          total: selectedService.price,
          totalPrice: selectedService.price,
          paymentMethod: 'pay_at_salon'
        })
      });
      const data = await res.json().catch(() => ({}));
      setBookingOrderResult(data.order || { orderNumber: `NASH-${Math.floor(1000 + Math.random() * 9000)}` });
    } catch {
      setBookingOrderResult({ orderNumber: `NASH-${Math.floor(1000 + Math.random() * 9000)}` });
    }

    setBookingConfirmed(true);
  };

  // ─── FILTERING LOGIC (Intelligent Search & Categorization) ────────
  const filteredItems = items.filter(item => {
    // Strictly Skyline items only (hide all Shawarma & Nash Studio items on ChuruOne)
    if (String(item.storeId || '').toLowerCase() !== 'skyline') return false;

    const matchCat = selectedCategory === 'all' 
      ? true 
      : (selectedCategory === 'deals' ? (item.originalPrice > item.price) : item.category === selectedCategory);
    const q = searchQuery.toLowerCase().trim();
    const matchQuery = !q || 
      item.name.toLowerCase().includes(q) || 
      (item.category && item.category.toLowerCase().includes(q)) ||
      item.storeName.toLowerCase().includes(q) ||
      (item.description && item.description.toLowerCase().includes(q));
    return matchCat && matchQuery;
  });

  const filteredStores = stores.filter(s => {
    if (String(s.id || '').toLowerCase() !== 'skyline') return false;
    const q = searchQuery.toLowerCase().trim();
    const matchQuery = !q || 
      s.name.toLowerCase().includes(q) || 
      s.category.toLowerCase().includes(q);
    return matchQuery;
  });

  return (
    <div className="min-h-screen bg-[#FDFCF9] text-stone-900 font-sans antialiased selection:bg-stone-900 selection:text-white">
      
      {/* ─── Ultra-Clean Header (NO Top Search Bar) ───────────────── */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200/80 transition-all">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-18 sm:h-20 flex items-center justify-between">
          
          {/* Logo & City Pill */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2.5 shrink-0" aria-label="ChuruOne Home">
              <div className="w-9 h-9 rounded-xl bg-stone-950 text-white flex items-center justify-center shadow-xs">
                <ShoppingBag className="w-5 h-5 stroke-[2.2]" />
              </div>
              <span className="font-extrabold text-xl sm:text-2xl tracking-tight text-stone-950">
                ChuruOne
              </span>
            </Link>

            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono text-stone-500 bg-stone-100 px-2.5 py-1 rounded-full border border-stone-200/60">
              <MapPin className="w-3 h-3 text-amber-700" />
              Churu City • 331001
            </span>
          </div>

          {/* Right Utilities: Cart Drawer Trigger, User Profile */}
          <div className="flex items-center gap-3 sm:gap-4 shrink-0" ref={accountMenuRef}>
            
            {/* Native ChuruOne Cart Icon Button with Live Counter Badge */}
            <button 
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 rounded-full hover:bg-stone-100 transition-colors text-stone-800 cursor-pointer flex items-center gap-1.5"
              title="Open ChuruOne Cart"
            >
              <div className="relative">
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-amber-600 text-white text-[10px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center shadow-xs">
                    {cartCount}
                  </span>
                )}
              </div>
              {cartTotal > 0 && (
                <span className="hidden md:inline text-xs font-bold font-mono text-stone-900">
                  ₹{finalCartTotal}
                </span>
              )}
            </button>

            {/* SSO Profile Pill */}
            {currentUser ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsAccountMenuOpen(prev => !prev)}
                  className="p-1.5 rounded-full hover:bg-stone-100 transition-colors flex items-center gap-1.5 text-stone-800 cursor-pointer"
                >
                  {currentUser.picture || currentUser.photoURL ? (
                    <img 
                      src={currentUser.picture || currentUser.photoURL} 
                      alt="" 
                      className="w-7 h-7 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-stone-900 text-white flex items-center justify-center text-xs font-bold">
                      {(currentUser.name || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <ChevronDown className={`w-3 h-3 text-stone-400 transition-transform ${isAccountMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {isAccountMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 6, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.98 }}
                      className="absolute right-0 mt-2 w-60 bg-white border border-stone-200 rounded-2xl shadow-xl z-50 p-3.5 text-left"
                    >
                      <div className="pb-3 border-b border-stone-100 space-y-1">
                        <div className="font-bold text-sm text-stone-900 truncate">
                          {currentUser.name || currentUser.displayName || 'Customer'}
                        </div>
                        {currentUser.phone && (
                          <div className="text-xs text-stone-500 font-mono">
                            +91 {currentUser.phone}
                          </div>
                        )}
                        {currentUser.email && (
                          <div className="text-[11px] text-stone-400 truncate">
                            {currentUser.email}
                          </div>
                        )}
                        <div className="pt-1">
                          {currentUser.authMethod === 'both' ? (
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                              Google + Mobile OTP Verified ✓
                            </span>
                          ) : currentUser.isPhoneAuth ? (
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                              Mobile OTP Verified ✓
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold text-stone-600 bg-stone-100 px-2 py-0.5 rounded-full">
                              ChuruOne Unified ID
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="w-full text-left py-2 px-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors flex items-center justify-between cursor-pointer"
                        >
                          <span>Sign Out</span>
                          <LogOut className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link 
                to="/auth" 
                className="p-2 rounded-full hover:bg-stone-100 transition-colors text-stone-800 flex items-center gap-1"
                title="Sign In"
              >
                <User className="w-5 h-5" />
                <span className="hidden sm:inline text-xs font-semibold">Login</span>
              </Link>
            )}

          </div>

        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-10 sm:space-y-12">
        
        {/* ─── HERO BANNER (Seamlessly Blended Churu Lal Ghantaghar + Overlay Search) ── */}
        <section className="relative rounded-[2.5rem] bg-gradient-to-r from-stone-50 via-white to-amber-50/20 border border-stone-200/80 shadow-xs overflow-hidden min-h-[380px] sm:min-h-[420px] md:min-h-[460px] flex items-center">
          
          {/* Beautifully Faded Real Churu Lal Ghantaghar Image (Seamlessly Embedded into UI) */}
          <div className="absolute right-0 top-0 bottom-0 w-full md:w-[64%] lg:w-[60%] h-full pointer-events-none select-none overflow-hidden flex items-center justify-end">
            <motion.img
              animate={{ scale: [1, 1.05, 1], y: [0, -6, 0] }}
              transition={{ repeat: Infinity, duration: 16, ease: "easeInOut" }}
              src="/images/churu-ghantaghar.jpg"
              alt="Real Churu Lal Ghanta Ghar Dharm Stup"
              className="w-full h-full object-cover object-center"
              style={{
                maskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.1) 10%, rgba(0,0,0,0.85) 35%, black 65%)',
                WebkitMaskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.1) 10%, rgba(0,0,0,0.85) 35%, black 65%)'
              }}
            />
            {/* Ambient Blend Gradient Layers */}
            <div className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-white via-white/40 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-white/80 via-white/30 to-transparent" />
            <div className="absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-white/60 to-transparent" />
          </div>

          {/* Left Content Area + Search Bar Overlaid Direct Onto Photo */}
          <div className="relative z-20 w-full p-6 sm:p-10 lg:p-14 space-y-6 max-w-2xl">
            
            <div className="space-y-2">
              <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-stone-900 text-stone-200 text-xs font-mono font-bold tracking-wider uppercase border border-stone-800 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Station Road, Churu • Flagship Store
              </span>
              <motion.h1 
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-stone-950 leading-[1.02]"
              >
                Skyline<br />Premium
              </motion.h1>
              <p className="text-xs sm:text-sm font-semibold tracking-wide text-stone-600 max-w-md">
                Architectural Menswear, Italian Linen Shirts, Gurkha Trousers, Japanese Selvedge Denim & Bespoke Outfits.
              </p>
            </div>

            {/* OVERLAPPING FLOATING SEARCH BAR (Physically sits across the photo) */}
            <div className="relative z-30 max-w-xl w-full pt-2">
              <div className="flex items-center bg-white/95 backdrop-blur-md border border-stone-200/90 shadow-xl hover:shadow-2xl rounded-full p-2.5 pl-6 focus-within:border-stone-900 focus-within:ring-2 focus-within:ring-stone-900/10 transition-all">
                <Search className="w-5 h-5 text-stone-400 shrink-0 mr-3" />
                <input
                  type="text"
                  placeholder="Kya chahiye? Shirts, Pants, Jeans, Kurta, Jackets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent text-sm sm:text-base text-stone-900 placeholder:text-stone-400 outline-none font-medium"
                />
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('catalog-grid');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-stone-950 hover:bg-black text-white flex items-center justify-center shrink-0 shadow-md cursor-pointer transition-transform active:scale-95"
                  aria-label="Search"
                >
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>

          </div>

        </section>

        {/* ─── LIVE KINETIC MARQUEE STREAM (Thick Black Slow Ribbon) ── */}
        <div className="py-5 sm:py-6 border-y border-stone-800 bg-black text-white overflow-hidden whitespace-nowrap select-none rounded-2xl shadow-xl">
          <div 
            className="flex gap-10 items-center animate-marquee w-max text-xs sm:text-sm font-mono font-bold uppercase tracking-widest text-stone-300"
            style={{ animationDuration: '65s' }}
          >
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center gap-10">
                <span className="flex items-center gap-2 text-amber-400 font-sans font-black tracking-wider text-sm sm:text-base">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                  SKYLINE PREMIUM OUTFITS
                </span>
                <span className="text-stone-700">✦</span>
                <span className="text-white font-sans font-bold">LUXURY BESPOKE MENSWEAR</span>
                <span className="text-stone-700">✦</span>
                <span className="text-stone-300">BESPOKE LINEN & CRISP OXFORD SHIRTS</span>
                <span className="text-stone-700">✦</span>
                <span className="text-amber-300 font-sans font-bold">ITALIAN GURKHA TROUSERS & PLEATED CHINOS</span>
                <span className="text-stone-700">✦</span>
                <span className="text-stone-300">JAPANESE RAW SELVEDGE DENIM</span>
                <span className="text-stone-700">✦</span>
                <span className="text-white font-sans font-bold">SKYLINE ITALIAN LINEN SHIRTS & DENIM</span>
                <span className="text-stone-700">✦</span>
                <span className="text-emerald-400 font-sans font-bold">SAME-DAY EXPRESS CHURU DISPATCH</span>
                <span className="text-stone-700">✦</span>
                <span className="text-stone-400">100% FACTORY FINISHED CURATED APPAREL</span>
                <span className="text-stone-700">✦</span>
              </div>
            ))}
          </div>
        </div>

        {/* ─── CATEGORY SQUIRCLE ROW (Clean Large Line Icons) ─────────── */}
        <section className="overflow-x-auto no-scrollbar py-2">
          <div className="flex items-center gap-3 sm:gap-4 w-max min-w-full">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex flex-col items-center justify-center gap-2.5 p-3.5 sm:p-4 rounded-2xl transition-all cursor-pointer min-w-[88px] sm:min-w-[106px] group ${
                    isSelected 
                    ? 'bg-stone-950 text-white shadow-xl ring-2 ring-stone-950 ring-offset-2' 
                    : 'bg-white hover:bg-stone-50 text-stone-700 hover:text-stone-950 border border-stone-200/90 shadow-2xs'
                  }`}
                >
                  <div className={`transition-transform duration-200 group-hover:scale-110 ${
                    isSelected ? 'text-white' : 'text-stone-700 group-hover:text-stone-950'
                  }`}>
                    <CategoryLineIcon categoryId={cat.id} className="w-7 h-7 sm:w-8 sm:h-8" />
                  </div>
                  <span className="text-xs sm:text-xs font-bold tracking-tight whitespace-nowrap">
                    {cat.name}
                  </span>
                  {cat.count !== undefined && (
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-600'
                    }`}>
                      {cat.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* ─── VERIFIED CHURU OUTLETS ROW ──────────────────────────── */}
        <section id="stores-grid" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-950">
                Churu Premier Fashion Outlets
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Direct in-store collection • Verified fashion partner in Churu
              </p>
            </div>
            <a 
              href="#catalog-grid" 
              className="text-xs sm:text-sm font-semibold text-stone-600 hover:text-stone-950 flex items-center gap-1 transition-colors"
            >
              <span>Explore All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {filteredStores.map((store) => (
              <a
                key={store.id}
                href={getStoreUrl(store.id)}
                className="group bg-white rounded-2xl overflow-hidden border border-stone-200/80 shadow-2xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="h-40 sm:h-44 w-full overflow-hidden bg-stone-100 relative">
                    <img
                      src={store.image || FALLBACK_STORE_IMAGE}
                      alt={store.name}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = FALLBACK_STORE_IMAGE;
                      }}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                    />
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                      <span className="bg-stone-950/85 backdrop-blur-xs text-white text-[9px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                        {store.tag}
                      </span>
                      {store.isOpen && (
                        <span className="bg-emerald-700 text-white text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                          Open
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-4 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <h3 className="font-extrabold text-base text-stone-950 group-hover:text-amber-800 transition-colors truncate">
                        {store.name}
                      </h3>
                      <span className="flex items-center gap-1 text-xs font-bold text-amber-600">
                        <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                        {store.rating}
                      </span>
                    </div>
                    <p className="text-xs text-stone-500 truncate">
                      {store.category} • {store.address}
                    </p>
                    <div className="flex items-center justify-between text-[11px] text-stone-500 pt-1 border-t border-stone-100">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-stone-400" />
                        {store.timing}
                      </span>
                      <span className="text-stone-800 font-semibold group-hover:underline flex items-center gap-0.5">
                        Visit Store <ExternalLink className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* ─── LIVE PRODUCT & SERVICES CATALOG ─────────────────────── */}
        <section id="catalog-grid" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-950">
                Skyline Outfits & Premium Apparel
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Shirts, Trousers, Jeans & Jackets delivered express across Churu
              </p>
            </div>
            <div className="text-xs font-mono text-stone-500">
              Showing {filteredItems.length} items
            </div>
          </div>

          {filteredItems.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-stone-200 space-y-3">
              <ShoppingBag className="w-10 h-10 text-stone-300 mx-auto" />
              <h4 className="font-bold text-stone-800">No items match your filter</h4>
              <p className="text-xs text-stone-500">Try changing your search term or category filter</p>
              <button
                type="button"
                onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
                className="text-xs font-bold text-stone-950 underline cursor-pointer"
              >
                Reset filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="group bg-white rounded-2xl overflow-hidden border border-stone-200/80 shadow-2xs hover:shadow-md transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    {/* Item Image */}
                    <div className="relative h-36 sm:h-44 w-full overflow-hidden bg-stone-100">
                      <img
                        src={item.image || FALLBACK_PRODUCT_IMAGE}
                        alt={item.name}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = FALLBACK_PRODUCT_IMAGE;
                        }}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                      />

                      {/* Discount Pill */}
                      {item.originalPrice > item.price && (
                        <span className="absolute top-2 left-2 bg-stone-950 text-white text-[10px] font-black px-2 py-0.5 rounded-md">
                          {Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)}% OFF
                        </span>
                      )}

                      {/* Service vs Delivery Tag */}
                      <span className={`absolute top-2 right-2 text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        item.type === 'service' 
                          ? 'bg-amber-100 text-amber-900 border border-amber-200' 
                          : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                      }`}>
                        {item.type === 'service' ? 'Salon Slot' : 'Express Delivery'}
                      </span>
                    </div>

                    {/* Item Info */}
                    <div className="p-3 sm:p-3.5 space-y-1">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-amber-800 truncate">
                        {item.storeName}
                      </div>
                      <h4 className="font-bold text-xs sm:text-sm text-stone-950 line-clamp-1 group-hover:text-stone-700">
                        {item.name}
                      </h4>
                      {item.description && (
                        <p className="text-[11px] text-stone-500 line-clamp-2 leading-relaxed">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Pricing & Intelligent Action Button */}
                  <div className="p-3 sm:p-3.5 pt-0 flex items-center justify-between">
                    <div>
                      <div className="font-black text-sm sm:text-base text-stone-950">
                        ₹{item.price}
                      </div>
                      {item.originalPrice && item.originalPrice > item.price && (
                        <div className="text-[10px] sm:text-xs text-stone-400 line-through">
                          ₹{item.originalPrice}
                        </div>
                      )}
                    </div>

                    {item.type === 'service' ? (
                      /* Salon Service: Book Appointment Button */
                      <button
                        type="button"
                        onClick={() => openBookingModal(item)}
                        className="bg-stone-950 hover:bg-black text-white text-[10px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1 transition-colors cursor-pointer shadow-xs active:scale-95"
                        title="Book Salon Slot"
                      >
                        <Scissors className="w-3 h-3" />
                        <span>Book Slot</span>
                      </button>
                    ) : (
                      /* Deliverable Product: Add to Cart Button */
                      <button
                        type="button"
                        onClick={() => addToCart(item)}
                        className="h-8 px-3 rounded-full bg-stone-950 hover:bg-stone-800 text-white text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-xs active:scale-95"
                        title="Add to ChuruOne Bag"
                      >
                        <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Add</span>
                      </button>
                    )}
                  </div>

                </div>
              ))}
            </div>
          )}
        </section>

        {/* ─── ABOUT CHURUONE MARKETPLACE ───────────────────────────── */}
        <section id="about" className="pt-8 pb-4 border-t border-stone-200/80">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start bg-white rounded-3xl p-6 sm:p-9 border border-stone-200/80 shadow-2xs">
            
            <div className="md:col-span-7 space-y-3">
              <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-stone-400 block">
                ABOUT CHURUONE MARKETPLACE
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-stone-950 tracking-tight">
                Churu ki Apni Digital Market. Direct Store Pricing.
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed font-normal">
                ChuruOne connects citizens directly with verified local businesses — featuring Skyline Outfits for premium menswear, luxury shirts, trousers, denim and bespoke outfits.
              </p>
              <p className="text-xs text-stone-500 leading-relaxed font-normal">
                Zero middleman commissions. Direct merchant payments with express 20–30 minute local city delivery.
              </p>
            </div>

            <div className="md:col-span-5 grid grid-cols-2 gap-3 sm:gap-4 font-mono text-xs">
              <div className="bg-stone-50 rounded-2xl p-4 border border-stone-100 space-y-1">
                <span className="text-2xl font-black text-stone-950 block">0%</span>
                <span className="text-stone-500 text-[11px] leading-tight block">Platform Commission Markup</span>
              </div>
              <div className="bg-stone-50 rounded-2xl p-4 border border-stone-100 space-y-1">
                <span className="text-2xl font-black text-stone-950 block">25m</span>
                <span className="text-stone-500 text-[11px] leading-tight block">Avg. City Delivery Time</span>
              </div>
              <div className="bg-stone-50 rounded-2xl p-4 border border-stone-100 space-y-1">
                <span className="text-2xl font-black text-stone-950 block">UPI</span>
                <span className="text-stone-500 text-[11px] leading-tight block">Direct Dukandar SmartPay</span>
              </div>
              <div className="bg-stone-50 rounded-2xl p-4 border border-stone-100 space-y-1">
                <span className="text-2xl font-black text-stone-950 block">SSO</span>
                <span className="text-stone-500 text-[11px] leading-tight block">Unified Account Across All Stores</span>
              </div>
            </div>

          </div>
        </section>

      </main>

      {/* ─── CHURUONE SLIDE-OVER BAG / CART DRAWER ────────────────── */}
      <AnimatePresence>
        {isCartOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-xs"
            />

            {/* Slide-out Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative w-full max-w-md bg-white h-full shadow-2xl z-10 flex flex-col justify-between"
            >
              {/* Drawer Header */}
              <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-stone-950" />
                  <h3 className="font-extrabold text-base text-stone-950">
                    Your ChuruOne Bag
                  </h3>
                  <span className="bg-stone-950 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                    {cartCount}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {cartItems.length > 0 && (
                    <button
                      type="button"
                      onClick={clearCart}
                      className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 px-2 py-1"
                    >
                      Clear
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsCartOpen(false)}
                    className="p-1.5 rounded-full hover:bg-stone-200 text-stone-600 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {cartItems.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-3 py-16">
                    <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center text-stone-400">
                      <ShoppingBag className="w-8 h-8" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-extrabold text-stone-900 text-base">Your Bag is Empty</h4>
                      <p className="text-xs text-stone-500 max-w-xs">
                        Browse shirts, pants, jeans and jackets from Skyline Outfits and tap Add to place items in your bag.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsCartOpen(false)}
                      className="bg-stone-950 text-white text-xs font-bold py-2.5 px-5 rounded-xl cursor-pointer"
                    >
                      Start Shopping
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Free City Delivery Progress Indicator */}
                    <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs flex items-center gap-2 text-emerald-900 font-semibold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span>Free Express Delivery across Churu City unlocked!</span>
                    </div>

                    {/* Cart Items List */}
                    <div className="space-y-3">
                      {cartItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-3.5 p-3 rounded-2xl border border-stone-200 bg-stone-50/50 hover:bg-stone-50 transition-colors"
                        >
                          <img
                            src={item.image || FALLBACK_PRODUCT_IMAGE}
                            alt=""
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = FALLBACK_PRODUCT_IMAGE;
                            }}
                            className="w-14 h-14 rounded-xl object-cover bg-stone-200 shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-amber-800 block truncate">
                              {item.storeName}
                            </span>
                            <h4 className="font-bold text-xs text-stone-950 truncate">
                              {item.name}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="font-black text-xs text-stone-950">
                                ₹{item.price}
                              </span>
                              {item.mrp && item.mrp > item.price && (
                                <span className="text-[10px] text-stone-400 line-through">
                                  ₹{item.mrp}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Stepper (+ / -) */}
                          <div className="flex items-center gap-1.5 bg-white border border-stone-200 rounded-xl p-1 shadow-2xs">
                            <button
                              type="button"
                              onClick={() => updateCartQty(item.id, -1)}
                              className="w-6 h-6 rounded-lg flex items-center justify-center hover:bg-stone-100 text-stone-600 transition-colors cursor-pointer"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="font-black text-xs text-stone-950 px-1 font-mono">
                              {item.qty}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateCartQty(item.id, 1)}
                              className="w-6 h-6 rounded-lg flex items-center justify-center hover:bg-stone-100 text-stone-600 transition-colors cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeFromCart(item.id)}
                            className="text-stone-400 hover:text-rose-600 p-1 transition-colors cursor-pointer"
                            title="Remove"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Promo Coupon Section */}
                    <div className="pt-2">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1.5 flex items-center gap-1">
                        <Tag className="w-3.5 h-3.5 text-stone-600" />
                        Apply Coupon Voucher
                      </div>
                      {appliedCoupon ? (
                        <div className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-xl">
                          <div>
                            <div className="font-bold text-xs text-amber-900 flex items-center gap-1.5">
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              {appliedCoupon.code} applied!
                            </div>
                            <span className="text-[10px] text-amber-700">
                              {appliedCoupon.desc} (-₹{appliedCoupon.discount})
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={handleRemoveCoupon}
                            className="text-xs font-bold text-rose-600 hover:underline"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <form onSubmit={handleApplyCoupon} className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Try NIGHT50 or CHURU50"
                            value={couponInput}
                            onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                            className="flex-1 bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-mono uppercase text-stone-900 outline-none focus:border-stone-950"
                          />
                          <button
                            type="submit"
                            className="bg-stone-950 hover:bg-black text-white px-4 py-2 rounded-xl text-xs font-bold uppercase cursor-pointer"
                          >
                            Apply
                          </button>
                        </form>
                      )}
                      {couponError && (
                        <p className="text-[11px] text-rose-600 font-medium mt-1">
                          {couponError}
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Cart Footer & Checkout Button */}
              {cartItems.length > 0 && (
                <div className="p-5 border-t border-stone-200 bg-stone-50 space-y-3">
                  <div className="space-y-1.5 text-xs text-stone-600 font-medium">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span className="font-semibold text-stone-900 font-mono">₹{cartSubtotal}</span>
                    </div>
                    {couponDiscount > 0 && (
                      <div className="flex justify-between text-emerald-700">
                        <span>Coupon Discount</span>
                        <span className="font-semibold font-mono">-₹{couponDiscount}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Delivery Fee</span>
                      <span className="text-emerald-700 font-semibold">FREE (Churu City)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Platform Commission</span>
                      <span className="text-stone-900 font-semibold font-mono">₹0 (Zero Markup)</span>
                    </div>
                    {totalSavings > 0 && (
                      <div className="flex justify-between text-amber-800 text-[11px] font-bold">
                        <span>Total City Savings</span>
                        <span className="font-mono">₹{totalSavings}</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-2 border-t border-stone-200 font-black text-base text-stone-950">
                      <span>Total Payable</span>
                      <span className="font-mono">₹{finalCartTotal}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleProceedToCheckout}
                    className="w-full bg-stone-950 hover:bg-black text-white py-3.5 px-5 rounded-2xl text-xs sm:text-sm uppercase font-bold flex items-center justify-between transition-colors shadow-sm cursor-pointer active:scale-98"
                  >
                    <span>Proceed to Checkout</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono">₹{finalCartTotal}</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── FULL CHECKOUT MODAL (Customer Details, GPS & Payment) ─── */}
      <AnimatePresence>
        {isCheckoutModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCheckoutModalOpen(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-xs"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl z-10 overflow-hidden border border-stone-200 max-h-[90vh] flex flex-col justify-between"
            >
              {/* Checkout Header */}
              <div className="p-5 border-b border-stone-100 flex items-center justify-between bg-stone-50">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-700" />
                  <div>
                    <h3 className="font-extrabold text-base text-stone-950">
                      Churu Express Checkout
                    </h3>
                    <span className="text-[11px] font-mono text-stone-500 uppercase">
                      Direct Dispatch • 20–30 Mins in Churu
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCheckoutModalOpen(false)}
                  className="p-1.5 rounded-full hover:bg-stone-200 text-stone-600 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Checkout Form */}
              <form onSubmit={handlePlaceOrder} className="p-6 space-y-4 overflow-y-auto flex-1">
                
                {/* 1. Customer Contact Details */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
                      1. Contact Information
                    </span>
                    {isUserPhoneVerified ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        OTP Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        <AlertCircle className="w-3 h-3 text-amber-600" />
                        Verification Required
                      </span>
                    )}
                  </div>

                  {/* Verification Notice Banner */}
                  {!isUserPhoneVerified && (
                    <div className="p-3 bg-amber-50/90 border border-amber-200 rounded-2xl flex items-start justify-between gap-3 text-left">
                      <div className="space-y-0.5">
                        <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                          <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                          <span>Mobile Number Not Verified</span>
                        </div>
                        <p className="text-[11px] text-amber-800 leading-normal">
                          Home delivery rider dispatch aur safety ke liye mobile number OTP verify hona mandatory hai.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => navigateToChuruOneAuth('verify_phone', true)}
                        className="shrink-0 bg-amber-900 hover:bg-black text-white text-[11px] font-bold px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
                      >
                        Verify OTP
                      </button>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold uppercase text-stone-600 block mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Rahul Sharma"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs text-stone-900 outline-none focus:border-stone-950 font-medium"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold uppercase text-stone-600 block mb-1">
                        Phone (for rider call & OTP) *
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="10-digit mobile"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs text-stone-900 outline-none focus:border-stone-950 font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Popular Landmark Picker Chips */}
                <div className="space-y-2 pt-2 border-t border-stone-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
                      2. Select Nearest Churu Landmark *
                    </span>
                    <span className="text-[10px] text-amber-800 font-semibold">
                      Churu City
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {CHURU_POPULAR_LANDMARKS.map(lm => (
                      <button
                        key={lm}
                        type="button"
                        onClick={() => setSelectedLandmark(lm)}
                        className={`text-xs px-2.5 py-1.5 rounded-xl border transition-all cursor-pointer font-medium ${
                          selectedLandmark === lm
                            ? 'bg-stone-950 text-white border-stone-950 shadow-xs'
                            : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                        }`}
                      >
                        {lm}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Address & Live GPS */}
                <div className="space-y-3 pt-2 border-t border-stone-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
                      3. House / Flat & Street
                    </span>
                    <button
                      type="button"
                      onClick={handleCaptureGPS}
                      disabled={isCapturingGps}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-lg border border-amber-200 cursor-pointer transition-colors"
                    >
                      <Navigation className="w-3 h-3" />
                      <span>{isCapturingGps ? 'Locating...' : 'Detect Live GPS'}</span>
                    </button>
                  </div>

                  <input
                    type="text"
                    placeholder="Ghar / Shop No, Gali ya Mohalla (e.g. Ward No. 12)"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs text-stone-900 outline-none focus:border-stone-950 font-medium"
                  />

                  {gpsStatusText && (
                    <div className="text-[11px] text-stone-500 font-mono bg-stone-50 p-2 rounded-xl border border-stone-200 flex items-center gap-1.5">
                      <MapPin className="w-3 h-3 text-emerald-700 shrink-0" />
                      <span className="truncate">{gpsStatusText}</span>
                    </div>
                  )}

                  <input
                    type="text"
                    placeholder="Special delivery notes (e.g. Call when reaching gate)"
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2 text-xs text-stone-900 outline-none focus:border-stone-950 font-medium"
                  />
                </div>

                {/* 4. Payment Selection */}
                <div className="space-y-2 pt-2 border-t border-stone-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-stone-400 block mb-1">
                      4. Payment Method
                    </span>
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 font-mono">
                      Unified Payment System
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('upi')}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                        paymentMethod === 'upi'
                          ? 'bg-amber-900 text-white border-amber-900 shadow-md ring-2 ring-amber-700/50'
                          : 'bg-stone-50 text-stone-800 border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      <div className="font-bold text-xs flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <QrCode className="w-3.5 h-3.5" />
                          <span>Instant UPI QR</span>
                        </div>
                        <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded-full ${
                          paymentMethod === 'upi' ? 'bg-amber-700 text-amber-100' : 'bg-stone-200 text-stone-600'
                        }`}>
                          Fastest
                        </span>
                      </div>
                      <span className={`text-[10px] block mt-0.5 ${paymentMethod === 'upi' ? 'text-amber-200' : 'text-stone-500'}`}>
                        PhonePe, GPay, Paytm, QR
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('cod')}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                        paymentMethod === 'cod'
                          ? 'bg-stone-950 text-white border-stone-950 shadow-md ring-2 ring-stone-800/50'
                          : 'bg-stone-50 text-stone-800 border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      <div className="font-bold text-xs flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Cash on Delivery</span>
                      </div>
                      <span className={`text-[10px] block mt-0.5 ${paymentMethod === 'cod' ? 'text-stone-300' : 'text-stone-500'}`}>
                        Pay cash to rider at doorstep
                      </span>
                    </button>
                  </div>
                </div>

                {/* Submit Order Button */}
                <div className="pt-3">
                  <button
                    type="submit"
                    disabled={isSubmittingOrder}
                    className="w-full bg-stone-950 hover:bg-black text-white text-xs uppercase font-bold tracking-wider py-4 px-5 rounded-2xl flex items-center justify-between shadow-md transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <span>
                      {isSubmittingOrder 
                        ? 'Processing...' 
                        : (paymentMethod === 'upi' ? `Proceed to Pay via UPI (₹${finalCartTotal})` : `Confirm Order via COD (₹${finalCartTotal})`)}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── REAL ORDER CONFIRMATION SCREEN ─────────────────────────── */}
      <AnimatePresence>
        {orderSuccessData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOrderSuccessData(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl z-10 overflow-hidden border border-stone-200 p-7 text-center space-y-4"
            >
              <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div>
                <span className="text-[11px] font-mono font-bold tracking-widest text-emerald-700 uppercase">
                  ORDER DISPATCH CONFIRMED
                </span>
                <h4 className="text-2xl font-black text-stone-950 mt-1">
                  ChuruOne Order Placed!
                </h4>
                <p className="text-xs text-stone-600 mt-1">
                  Aapka order receive ho gaya hai aur dukan se dispatch process shuru ho gaya hai.
                </p>
              </div>

              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 text-left text-xs space-y-2 font-mono">
                <div className="flex justify-between">
                  <span className="text-stone-500">Order ID:</span>
                  <span className="font-bold text-stone-900">{orderSuccessData.orderNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Amount:</span>
                  <span className="font-bold text-stone-900">₹{orderSuccessData.totalAmount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Payment:</span>
                  <span className="font-bold text-emerald-800">{orderSuccessData.paymentMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Estimated Delivery:</span>
                  <span className="font-bold text-amber-800">{orderSuccessData.estimatedTime}</span>
                </div>
                <div className="pt-2 border-t border-stone-200 text-[11px] text-stone-600">
                  <strong>Delivery To:</strong> {orderSuccessData.customerName} • {orderSuccessData.address}
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setOrderSuccessData(null)}
                  className="w-full bg-stone-950 text-white text-xs font-bold py-3.5 px-4 rounded-xl text-center uppercase tracking-wider hover:bg-black transition-colors cursor-pointer shadow-xs"
                >
                  Done & Continue Shopping
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── DEDICATED SALON APPOINTMENT BOOKING MODAL (Nash Studio) ─── */}
      <AnimatePresence>
        {isBookingModalOpen && selectedService && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsBookingModalOpen(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-xs"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl z-10 overflow-hidden border border-stone-200"
            >
              {/* Modal Header */}
              <div className="p-5 border-b border-stone-100 flex items-center justify-between bg-stone-50">
                <div className="flex items-center gap-2">
                  <Scissors className="w-5 h-5 text-amber-800" />
                  <div>
                    <h3 className="font-extrabold text-base text-stone-950">
                      Book Salon Appointment
                    </h3>
                    <span className="text-[11px] font-mono text-stone-500 uppercase">
                      Nash Studio • Main Market, Churu
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsBookingModalOpen(false)}
                  className="p-1.5 rounded-full hover:bg-stone-200 text-stone-600 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {bookingConfirmed ? (
                /* Booking Success Screen */
                <div className="p-8 text-center space-y-4">
                  <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h4 className="text-xl font-black text-stone-950">
                    Appointment Slot Reserved!
                  </h4>
                  <p className="text-xs sm:text-sm text-stone-600 max-w-sm mx-auto">
                    Aapka slot <strong>{selectedService.name}</strong> ke liye <strong>{bookingDate} at {bookingTime}</strong> book ho gaya hai.
                  </p>
                  <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 text-left text-xs space-y-1.5 font-mono">
                    <div><strong>Customer:</strong> {bookingCustomerName} ({bookingCustomerPhone})</div>
                    <div><strong>Studio:</strong> Nash Studio Gentlemen Lounge</div>
                    <div><strong>Amount:</strong> ₹{selectedService.price} (Pay at Studio)</div>
                    <div><strong>Status:</strong> Slot Confirmed ✓</div>
                  </div>
                  <div className="pt-2 flex gap-3">
                    <a
                      href={getStoreUrl('nash-studio')}
                      className="flex-1 bg-stone-950 text-white text-xs font-bold py-3 px-4 rounded-xl text-center uppercase tracking-wider"
                    >
                      Open Nash Studio
                    </a>
                    <button
                      type="button"
                      onClick={() => setIsBookingModalOpen(false)}
                      className="flex-1 bg-stone-100 text-stone-800 text-xs font-bold py-3 px-4 rounded-xl text-center uppercase tracking-wider"
                    >
                      Done
                    </button>
                  </div>
                </div>
              ) : (
                /* Booking Form */
                <form onSubmit={handleConfirmBooking} className="p-6 space-y-5">
                  {/* Selected Service Card */}
                  <div className="flex items-center gap-3.5 p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-2xl">
                    <img 
                      src={selectedService.image || FALLBACK_PRODUCT_IMAGE} 
                      alt="" 
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = FALLBACK_PRODUCT_IMAGE;
                      }}
                      className="w-14 h-14 rounded-xl object-cover bg-amber-100" 
                    />
                    <div className="flex-1">
                      <span className="text-[10px] font-bold uppercase text-amber-800">
                        Selected Service
                      </span>
                      <h4 className="font-bold text-sm text-stone-950">
                        {selectedService.name}
                      </h4>
                      <div className="text-sm font-black text-stone-900 mt-0.5">
                        ₹{selectedService.price} <span className="text-xs text-stone-400 line-through font-normal">₹{selectedService.originalPrice || selectedService.mrp}</span>
                      </div>
                    </div>
                  </div>

                  {/* Select Date */}
                  <div>
                    <label className="text-xs font-bold uppercase text-stone-500 block mb-2">
                      Choose Day
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {['Today', 'Tomorrow', 'Day After'].map(day => (
                        <button
                          key={day}
                          type="button"
                          onClick={() => setBookingDate(day)}
                          className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                            bookingDate === day 
                              ? 'bg-stone-950 text-white border-stone-950 shadow-xs' 
                              : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                          }`}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Select Time Slot */}
                  <div>
                    <label className="text-xs font-bold uppercase text-stone-500 block mb-2">
                      Available Slot
                    </label>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {['11:30 AM', '1:00 PM', '2:30 PM', '4:00 PM', '5:30 PM', '7:00 PM', '8:30 PM'].map(time => (
                        <button
                          key={time}
                          type="button"
                          onClick={() => setBookingTime(time)}
                          className={`py-2 px-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                            bookingTime === time 
                              ? 'bg-amber-900 text-white border-amber-900 shadow-xs' 
                              : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                          }`}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Customer Details */}
                  <div className="space-y-3 pt-1">
                    <div>
                      <label className="text-[11px] font-bold uppercase text-stone-500 block mb-1">
                        Your Full Name
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Rahul Sharma"
                        value={bookingCustomerName}
                        onChange={(e) => setBookingCustomerName(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs text-stone-900 outline-none focus:border-stone-950"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold uppercase text-stone-500 block mb-1">
                        Phone Number (for confirmation SMS)
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="e.g. 9876543210"
                        value={bookingCustomerPhone}
                        onChange={(e) => setBookingCustomerPhone(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs text-stone-900 outline-none focus:border-stone-950 font-mono"
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full bg-stone-950 hover:bg-black text-white text-xs uppercase font-bold tracking-wider py-3.5 px-4 rounded-xl flex items-center justify-between shadow-xs transition-colors cursor-pointer"
                    >
                      <span>Confirm Slot (₹{selectedService.price} - Pay at Salon)</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── FOOTER & LEGAL LINKS ─────────────────────────────────── */}
      <footer className="border-t border-stone-200/80 bg-white py-10 mt-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-6">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-stone-600">
            <div>
              <div className="font-black text-lg tracking-tight uppercase text-stone-950">
                ChuruOne
              </div>
              <p className="text-xs text-stone-500 mt-0.5 font-mono">
                Churu ki har dukaan ab online • Rajasthan 331001
              </p>
            </div>

            <div className="flex items-center flex-wrap gap-5 text-stone-600 text-xs font-semibold">
              <a href="#stores-grid" className="hover:text-stone-950 transition-colors">
                Popular Stores
              </a>
              <a href={getStoreUrl('shawarma')} className="hover:text-stone-950 transition-colors">
                Shawarma Nights
              </a>
              <a href={getStoreUrl('skyline')} className="hover:text-stone-950 transition-colors">
                Skyline Outfits
              </a>
              <a href={getStoreUrl('nash-studio')} className="hover:text-stone-950 transition-colors">
                Nash Studio
              </a>
              <Link to="/admin" className="hover:text-stone-950 transition-colors">
                Merchant OS
              </Link>
            </div>
          </div>

          {/* All 5 Mandatory Legal Policy Links for Payment Gateway Compliance */}
          <div className="pt-4 border-t border-stone-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs text-stone-500">
            <div className="flex items-center flex-wrap gap-4 sm:gap-5 font-medium">
              <a href="/contact-us" className="hover:text-stone-900 transition-colors">
                Contact Us
              </a>
              <a href="/terms-and-conditions" className="hover:text-stone-900 transition-colors">
                Terms & Conditions
              </a>
              <a href="/privacy-policy" className="hover:text-stone-900 transition-colors">
                Privacy Policy
              </a>
              <a href="/refund-policy" className="hover:text-stone-900 transition-colors">
                Refund & Cancellation
              </a>
              <a href="/shipping-policy" className="hover:text-stone-900 transition-colors">
                Shipping Policy
              </a>
            </div>

            <div className="text-stone-400 text-[11px] font-mono">
              Delivery in 20–35 mins • Direct In-Store Pricing
            </div>
          </div>

          <div className="pt-3 border-t border-stone-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-stone-400">
            <span>© 2026 ChuruOne. A unit of Vasudhaiva Kutumbakam Robotics. All rights reserved.</span>
            <span>50, Churu bhaiji chowk, Churu, Rajasthan 331001</span>
          </div>

        </div>
      </footer>

      {/* Floating Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 right-6 z-50 bg-stone-950 text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-2"
          >
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── FLOATING BOTTOM BAG BAR (Appears when items added, doesn't interrupt shopping) ─── */}
      <AnimatePresence>
        {cartCount > 0 && !isCartOpen && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-md pointer-events-auto"
          >
            <div 
              onClick={() => setIsCartOpen(true)}
              className="bg-stone-950 text-white rounded-full px-5 py-3.5 shadow-2xl border border-stone-800 flex items-center justify-between cursor-pointer hover:bg-black transition-all active:scale-98"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-400 text-stone-950 flex items-center justify-center font-black text-xs">
                  {cartCount}
                </div>
                <div>
                  <div className="text-xs font-bold tracking-tight">
                    {cartCount} {cartCount === 1 ? 'item' : 'items'} in bag
                  </div>
                  <div className="text-[11px] text-stone-400 font-mono">
                    Subtotal: ₹{finalCartTotal}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                <span>View Bag</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── UNIFIED PAYMENT SYSTEM MODAL (ChuruOne Unified Engine) ─── */}
      {isUpiModalOpen && pendingPaymentData && (
        <UpiPaymentModal
          isOpen={isUpiModalOpen}
          onClose={() => {
            setIsUpiModalOpen(false);
            setPendingPaymentData(null);
            setPendingOrder(null);
            showToast('Payment poora nahi hua. Items bag me surakshit hain.');
          }}
          orderData={pendingPaymentData}
          paymentData={pendingPaymentData}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}

      {/* ─── MANDATORY AUTH & PHONE OTP PROMPT MODAL ─── */}
      <AnimatePresence>
        {isAuthPromptOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAuthPromptOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl z-10 overflow-hidden border border-stone-200 p-6 sm:p-7 text-center space-y-4"
            >
              <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto shadow-inner ${
                authPromptRequirePhone ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-700'
              }`}>
                {authPromptRequirePhone ? <Phone className="w-7 h-7" /> : <Lock className="w-7 h-7" />}
              </div>

              <div>
                <span className="text-[10px] font-mono font-bold tracking-widest text-amber-800 uppercase">
                  {authPromptRequirePhone ? 'HOME DELIVERY VERIFICATION' : 'CHURUONE AUTHENTICATION'}
                </span>
                <h4 className="text-xl font-black text-stone-950 mt-1">
                  {authPromptTitle}
                </h4>
                <p className="text-xs text-stone-600 mt-2 leading-relaxed">
                  {authPromptMessage}
                </p>
              </div>

              <div className="pt-2 space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAuthPromptOpen(false);
                    navigateToChuruOneAuth(authPromptRedirectMode, authPromptRequirePhone);
                  }}
                  className="w-full bg-stone-950 hover:bg-black text-white text-xs uppercase font-bold tracking-wider py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
                >
                  <span>{authPromptRequirePhone ? 'Verify Mobile via SMS OTP' : 'Continue with 1-Click Login'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsAuthPromptOpen(false)}
                  className="w-full bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold py-2.5 px-4 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Legal Policies Modal */}
      <LegalPoliciesModal
        isOpen={legalModalOpen}
        onClose={() => setLegalModalOpen(false)}
        initialTab={legalTab}
        entity="churuone"
      />

    </div>
  );
}
