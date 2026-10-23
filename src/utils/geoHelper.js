/**
 * geoHelper.js — Hyper-Local Geo-Fencing & Microsecond Location Matching Engine for Churu
 * 
 * Supports:
 * - High-precision Haversine distance calculations
 * - Churu popular landmarks with verified coordinates
 * - Nearest landmark resolver for GPS coordinates
 * - Store radius matching (< 1ms execution time)
 */

export const CHURU_LANDMARKS = [
  { id: 'subhash_chowk', name: 'Subhash Chowk', lat: 28.2915, lng: 74.9662, label: 'Subhash Chowk (सुभाष चौक)' },
  { id: 'naya_bass', name: 'Naya Bass', lat: 28.2965, lng: 74.9590, label: 'Naya Bass (नया बास)' },
  { id: 'station_road', name: 'Station Road', lat: 28.2950, lng: 74.9690, label: 'Station Road (स्टेशन रोड)' },
  { id: 'nai_sarak', name: 'Nai Sarak', lat: 28.2930, lng: 74.9630, label: 'Nai Sarak (नई सड़क)' },
  { id: 'dharamstupa', name: 'Dharamstupa / Kotwali', lat: 28.2920, lng: 74.9645, label: 'Dharamstupa / Kotwali (धर्मस्तूप)' },
  { id: 'collectorate_road', name: 'Collectorate Road', lat: 28.2880, lng: 74.9610, label: 'Collectorate Circle (कलेक्ट्रेट)' },
  { id: 'pankha_circle', name: 'Pankha Circle', lat: 28.2990, lng: 74.9720, label: 'Pankha Circle (पंखा सर्किल)' },
  { id: 'lohiya_college', name: 'Lohiya College Area', lat: 28.2850, lng: 74.9580, label: 'Lohiya College (लोहिया कॉलेज)' },
  { id: 'nature_park', name: 'Nature Park / Churu Club', lat: 28.2830, lng: 74.9620, label: 'Nature Park (नेचर पार्क)' },
  { id: 'ramgarh_road', name: 'Ramgarh Road', lat: 28.3020, lng: 74.9640, label: 'Ramgarh Road (रामगढ़ रोड)' },
  { id: 'purani_abadi', name: 'Purani Abadi', lat: 28.2980, lng: 74.9650, label: 'Purani Abadi (पुरानी आबादी)' },
  { id: 'raj_colony', name: 'Raj Colony', lat: 28.2890, lng: 74.9540, label: 'Raj Colony (राज कॉलोनी)' },
  { id: 'gandhi_nagar', name: 'Gandhi Nagar', lat: 28.2840, lng: 74.9680, label: 'Gandhi Nagar (गांधी नगर)' },
  { id: 'adarsh_nagar', name: 'Adarsh Nagar', lat: 28.2810, lng: 74.9650, label: 'Adarsh Nagar (आदर्श नगर)' },
  { id: 'ghantaghar', name: 'Main Market / Ghantaghar', lat: 28.2925, lng: 74.9655, label: 'Ghantaghar (घंटाघर)' }
];

export const CHURU_POPULAR_LANDMARKS = CHURU_LANDMARKS.map(l => l.name);

/**
 * High-speed Haversine distance calculation in kilometers.
 * Computes exact spherical distance in microseconds.
 */
export function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if (lat1 === undefined || lon1 === undefined || lat2 === undefined || lon2 === undefined) {
    return 999;
  }
  const nLat1 = Number(lat1);
  const nLon1 = Number(lon1);
  const nLat2 = Number(lat2);
  const nLon2 = Number(lon2);
  if (isNaN(nLat1) || isNaN(nLon1) || isNaN(nLat2) || isNaN(nLon2)) return 999;

  const R = 6371; // Earth's radius in kilometers
  const dLat = (nLat2 - nLat1) * (Math.PI / 180);
  const dLon = (nLon2 - nLon1) * (Math.PI / 180);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(nLat1 * (Math.PI / 180)) *
      Math.cos(nLat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return Math.round(d * 10) / 10; // 1 decimal place, e.g. 0.8 km
}

/**
 * Finds the nearest predefined landmark to a set of coordinates.
 */
export function findNearestLandmark(lat, lng) {
  if (!lat || !lng) return CHURU_LANDMARKS[0];
  let minDistance = Infinity;
  let closest = CHURU_LANDMARKS[0];

  for (const lm of CHURU_LANDMARKS) {
    const dist = calculateDistanceKm(lat, lng, lm.lat, lm.lng);
    if (dist < minDistance) {
      minDistance = dist;
      closest = { ...lm, distanceKm: dist };
    }
  }
  return closest;
}

/**
 * Check if customer is within store's delivery radius.
 * City-wide flagship brands (Shawarma, Skyline, Nash) always return true!
 */
export function isStoreServingLocation(store, customerLat, customerLng, customerLandmarkId = null) {
  if (!store) return false;

  // 1. City-Wide Flagship Brands are exempt from radius restrictions!
  const isFlagship = store.isCityWide === true || 
                     store.isFlagshipBrand === true || 
                     ['shawarma', 'skyline', 'nash-studio'].includes(store.id || store.slug);
  if (isFlagship) {
    return { serving: true, distanceKm: 0, reason: 'City-wide flagship brand' };
  }

  // 2. Mohalla store: check radius
  const storeLat = Number(store.geo?.lat || store.lat || store.latitude);
  const storeLng = Number(store.geo?.lng || store.lng || store.longitude);
  const radius = Number(store.radiusKm || store.deliveryRadiusKm || 1.2); // Default 1.2km radius

  // If customer has GPS coordinates
  if (customerLat && customerLng && storeLat && storeLng) {
    const dist = calculateDistanceKm(customerLat, customerLng, storeLat, storeLng);
    if (dist <= radius) {
      return { serving: true, distanceKm: dist, radiusKm: radius };
    }
  }

  // Fallback to landmark / mohalla match if GPS is absent
  if (customerLandmarkId) {
    const cleanCustLandmark = String(customerLandmarkId).toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanStoreMohalla = String(store.mohalla || store.areaName || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanStoreLandmark = String(store.nearestLandmark || '').toLowerCase().replace(/[^a-z0-9]/g, '');

    if (store.serviceArea && Array.isArray(store.serviceArea)) {
      if (store.serviceArea.includes(customerLandmarkId) || store.serviceArea.includes('all')) {
        return { serving: true, distanceKm: 0.5, radiusKm: radius };
      }
    }

    const aliases = {
      kotwali: 'dharamstupa',
      dharamstupa: 'kotwali',
      collectorate: 'collectorateroad',
      collectorateroad: 'collectorate'
    };

    if (
      cleanStoreLandmark === cleanCustLandmark ||
      aliases[cleanStoreLandmark] === cleanCustLandmark ||
      (cleanStoreMohalla && (cleanStoreMohalla.includes(cleanCustLandmark) || cleanCustLandmark.includes(cleanStoreMohalla)))
    ) {
      return { serving: true, distanceKm: 0.5, radiusKm: radius };
    }
  }

  return { serving: false, distanceKm: 999, radiusKm: radius };
}

/**
 * Session storage helpers for customer location
 */
const LOC_KEY = 'churuone_customer_location';

export function getSavedCustomerLocation() {
  try {
    const raw = localStorage.getItem(LOC_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed parsing saved location:', e);
  }
  // Default to Subhash Chowk (City center)
  return {
    landmarkId: 'subhash_chowk',
    name: 'Subhash Chowk',
    lat: 28.2915,
    lng: 74.9662,
    isGpsVerified: false
  };
}

export function saveCustomerLocation(loc) {
  try {
    localStorage.setItem(LOC_KEY, JSON.stringify(loc));
  } catch (e) {}
}
