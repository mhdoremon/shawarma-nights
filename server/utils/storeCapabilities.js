/**
 * storeCapabilities.js — Centralized, Schema-Driven Store Capabilities Engine
 * 
 * Defines canonical blueprints and runtime resolution for store capabilities:
 * - restaurant / food (e.g. shawarma)
 * - fashion / apparel / footwear / clothing (e.g. skyline)
 * - salon / services / appointments (e.g. nash-studio)
 * - grocery / retail / general (for any new store / generic retail)
 */

export const CAPABILITY_PROFILES = {
  restaurant: {
    storeType: 'restaurant',
    catalog: {
      hasVegNonVeg: true,
      hasFoodAddons: true,
      hasSizes: false,
      hasColors: false,
      hasLookbook: false,
      hasServiceDuration: false,
      hasUnitWeights: false
    },
    orders: {
      hasKotPrinting: true,
      hasRiderDispatch: true,
      hasAppointments: false,
      hasAdvanceToken: false,
      hasDeliveryOtp: true
    },
    settings: {
      hasDeliveryRadius: true,
      hasFreeDeliveryThreshold: true,
      hasAdvanceTokenFee: false,
      hasTableBooking: false
    }
  },

  fashion: {
    storeType: 'fashion',
    catalog: {
      hasVegNonVeg: false,
      hasFoodAddons: false,
      hasSizes: true,
      hasColors: true,
      hasLookbook: true,
      hasServiceDuration: false,
      hasUnitWeights: false
    },
    orders: {
      hasKotPrinting: false,
      hasRiderDispatch: true,
      hasAppointments: false,
      hasAdvanceToken: false,
      hasDeliveryOtp: true
    },
    settings: {
      hasDeliveryRadius: true,
      hasFreeDeliveryThreshold: true,
      hasAdvanceTokenFee: false,
      hasTableBooking: false
    }
  },

  salon: {
    storeType: 'salon',
    catalog: {
      hasVegNonVeg: false,
      hasFoodAddons: false,
      hasSizes: false,
      hasColors: false,
      hasLookbook: false,
      hasServiceDuration: true,
      hasUnitWeights: false
    },
    orders: {
      hasKotPrinting: false,
      hasRiderDispatch: false,
      hasAppointments: true,
      hasAdvanceToken: true,
      hasDeliveryOtp: false
    },
    settings: {
      hasDeliveryRadius: false,
      hasFreeDeliveryThreshold: false,
      hasAdvanceTokenFee: true,
      hasTableBooking: false
    }
  },

  grocery: {
    storeType: 'grocery',
    catalog: {
      hasVegNonVeg: true,
      hasFoodAddons: false,
      hasSizes: true,
      hasColors: false,
      hasLookbook: true,
      hasServiceDuration: false,
      hasUnitWeights: true
    },
    orders: {
      hasKotPrinting: false,
      hasRiderDispatch: true,
      hasAppointments: false,
      hasAdvanceToken: false,
      hasDeliveryOtp: true
    },
    settings: {
      hasDeliveryRadius: true,
      hasFreeDeliveryThreshold: true,
      hasAdvanceTokenFee: false,
      hasTableBooking: false
    }
  },

  marketplace: {
    storeType: 'marketplace',
    catalog: {
      hasVegNonVeg: false,
      hasFoodAddons: false,
      hasSizes: false,
      hasColors: false,
      hasLookbook: false,
      hasServiceDuration: false,
      hasUnitWeights: false,
      isAggregator: true
    },
    orders: {
      hasKotPrinting: false,
      hasRiderDispatch: true,
      hasAppointments: false,
      hasAdvanceToken: false,
      hasDeliveryOtp: true,
      isCrossStore: true
    },
    settings: {
      hasDeliveryRadius: true,
      hasFreeDeliveryThreshold: true,
      hasAdvanceTokenFee: false,
      hasTableBooking: false,
      hasPartnerStores: true,
      hasPlatformMarquee: true
    }
  }
};

/**
 * Infer business type from explicit config fields or known store ID.
 */
export function inferStoreType(storeId, storeConfig = {}) {
  const config = storeConfig || {};
  const explicitType = String(config.type || config.vertical || config.category || '').toLowerCase().trim();
  const normalizedStoreId = String(storeId || config.storeId || config.slug || config.id || '').toLowerCase().trim();

  // 1. Explicit type/vertical/category mapping
  if (explicitType) {
    if (['restaurant', 'food', 'dining', 'cafe', 'eatery', 'bakery'].includes(explicitType)) {
      return 'restaurant';
    }
    if (['fashion', 'clothing', 'apparel', 'footwear', 'boutique', 'attire'].includes(explicitType)) {
      return 'fashion';
    }
    if (['salon', 'spa', 'services', 'service', 'appointments', 'barber', 'parlour', 'parlor'].includes(explicitType)) {
      return 'salon';
    }
    if (['grocery', 'retail', 'supermarket', 'kirana', 'general', 'store'].includes(explicitType)) {
      return 'grocery';
    }
    if (['marketplace', 'platform', 'churuone', 'aggregator', 'mall'].includes(explicitType)) {
      return 'marketplace';
    }
  }

  // 2. Known storeId inference
  if (normalizedStoreId === 'churuone' || normalizedStoreId === 'platform') {
    return 'marketplace';
  }
  if (normalizedStoreId === 'shawarma' || normalizedStoreId.includes('shawarma')) {
    return 'restaurant';
  }
  if (normalizedStoreId === 'skyline' || normalizedStoreId.includes('skyline')) {
    return 'fashion';
  }
  if (normalizedStoreId === 'nash-studio' || normalizedStoreId === 'nash' || normalizedStoreId.includes('nash')) {
    return 'salon';
  }

  // 3. Fallback for new / generic stores
  return 'grocery';
}

/**
 * Resolve store capabilities object with full schema defaults.
 * 1. If storeConfig.capabilities exists, deep-merges with defaults.
 * 2. If not, infers from storeConfig.type, storeConfig.category, storeConfig.vertical, or storeId.
 *
 * @param {string} storeId - Identifier of store
 * @param {object} [storeConfig] - Store configuration object
 * @returns {object} Full reactive capabilities schema
 */
export function resolveStoreCapabilities(storeId, storeConfig = {}) {
  const config = storeConfig || {};

  // Determine base profile type
  let baseType = 'grocery';
  if (config.capabilities?.storeType && CAPABILITY_PROFILES[config.capabilities.storeType]) {
    baseType = config.capabilities.storeType;
  } else {
    baseType = inferStoreType(storeId, config);
  }

  const baseProfile = JSON.parse(JSON.stringify(CAPABILITY_PROFILES[baseType] || CAPABILITY_PROFILES.grocery));

  // If no custom capabilities defined, return full default profile
  if (!config.capabilities || typeof config.capabilities !== 'object') {
    return baseProfile;
  }

  // Deep merge custom overrides onto schema defaults
  return {
    ...baseProfile,
    ...config.capabilities,
    storeType: config.capabilities.storeType || baseProfile.storeType,
    catalog: {
      ...baseProfile.catalog,
      ...(config.capabilities.catalog || {})
    },
    orders: {
      ...baseProfile.orders,
      ...(config.capabilities.orders || {})
    },
    settings: {
      ...baseProfile.settings,
      ...(config.capabilities.settings || {})
    }
  };
}

export default {
  CAPABILITY_PROFILES,
  inferStoreType,
  resolveStoreCapabilities
};
