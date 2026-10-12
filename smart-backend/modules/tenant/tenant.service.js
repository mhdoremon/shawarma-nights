import DataLayer from '../../core/DataLayer.js';
import WebSocketHub from '../../core/WebSocketHub.js';
import { generateId, generateUUID, now } from '../../utils/helpers.js';

export const registerStore = (req, res) => {
    try {
        const { name, slug, vertical, ownerName, ownerPhone, ownerEmail, ownerPassword, subdomain } = req.body;
        if (!slug || !subdomain) return res.status(400).json({ success: false, message: 'Slug and subdomain required' });

        const reserved = ['www', 'api', 'admin', 'platform'];
        if (reserved.includes(slug) || reserved.includes(subdomain)) {
            return res.status(400).json({ success: false, message: 'Reserved name' });
        }

        const storesData = DataLayer.readPlatform('stores') || { stores: [] };
        if (storesData.stores.find(s => s.slug === slug || s.subdomain === subdomain)) {
            return res.status(400).json({ success: false, message: 'Store already exists' });
        }

        const config = {
            storeId: slug,
            name,
            vertical,
            subdomain,
            owner: { name: ownerName, phone: ownerPhone, email: ownerEmail },
            settings: { isOpen: false },
            createdAt: now()
        };
        DataLayer.initStore(slug, config);

        const token = generateUUID();
        
        storesData.stores.push({
            id: slug,
            slug,
            name,
            vertical,
            subdomain,
            status: 'active',
            createdAt: now(),
            ownerEmail
        });
        DataLayer.writePlatform('stores', storesData);

        return res.json({ success: true, storeId: slug, token, adminUrl: `https://${subdomain}.churu.one/admin` });
    } catch (e) {
        return res.status(500).json({ success: false, message: e.message });
    }
};

export const listStores = (req, res) => {
    try {
        const storesData = DataLayer.readPlatform('stores') || { stores: [] };
        return res.json({ success: true, stores: storesData.stores.map(s => ({
            id: s.id, name: s.name, vertical: s.vertical, status: s.status, createdAt: s.createdAt
        })) });
    } catch (e) {
        return res.status(500).json({ success: false, message: e.message });
    }
};

export const getStoreInfo = (req, res) => {
    try {
        const config = DataLayer.getStoreConfig(req.params.storeId);
        if (!config) return res.status(404).json({ success: false, message: 'Store not found' });
        return res.json({ success: true, store: config });
    } catch (e) {
        return res.status(500).json({ success: false, message: e.message });
    }
};

export const updateStoreConfig = (req, res) => {
    try {
        DataLayer.updateStoreConfig(req.params.storeId, req.body);
        return res.json({ success: true, message: 'Updated' });
    } catch (e) {
        return res.status(500).json({ success: false, message: e.message });
    }
};

export const deleteStore = (req, res) => {
    try {
        const storesData = DataLayer.readPlatform('stores') || { stores: [] };
        storesData.stores = storesData.stores.filter(s => s.id !== req.params.storeId);
        DataLayer.writePlatform('stores', storesData);
        return res.json({ success: true, message: 'Deleted' });
    } catch (e) {
        return res.status(500).json({ success: false, message: e.message });
    }
};

export const getStats = (req, res) => {
    try {
        const storesData = DataLayer.readPlatform('stores') || { stores: [] };
        const totalStores = storesData.stores.length;
        const activeStores = storesData.stores.filter(s => s.status === 'active').length;
        
        const storesByVertical = {};
        storesData.stores.forEach(s => {
            storesByVertical[s.vertical] = (storesByVertical[s.vertical] || 0) + 1;
        });

        return res.json({
            success: true,
            totalStores,
            activeStores,
            totalOrders: 150,
            storesByVertical,
            wsConnections: {}
        });
    } catch (e) {
        return res.status(500).json({ success: false, message: e.message });
    }
};

// --- Store Scoped Info (backward compat) ---
export const getStoreSettings = (req, res) => {
    try {
        const config = DataLayer.getStoreConfig(req.storeId) || {};
        return res.json({ 
            success: true, 
            settings: config.settings, 
            payment: config.payment, 
            socials: config.socials, 
            taxesAndCharges: config.taxesAndCharges,
            capabilities: config.capabilities
        });
    } catch (e) {
        return res.status(500).json({ success: false, message: e.message });
    }
};

export const updateStoreSettings = (req, res) => {
    try {
        DataLayer.updateStoreConfig(req.storeId, req.body);
        WebSocketHub.broadcastToGateway(req.storeId, { action: 'STORE_INFO_UPDATED', payload: req.body });
        return res.json({ success: true, message: 'Updated' });
    } catch (e) {
        return res.status(500).json({ success: false, message: e.message });
    }
};

export const getHero = (req, res) => {
    try {
        const config = DataLayer.getStoreConfig(req.storeId) || {};
        return res.json({ success: true, heroBanner: config.heroBanner || {} });
    } catch (e) {
        return res.status(500).json({ success: false, message: e.message });
    }
};

export const updateHero = (req, res) => {
    try {
        DataLayer.updateStoreConfig(req.storeId, { heroBanner: req.body });
        WebSocketHub.broadcastToGateway(req.storeId, { action: 'HERO_UPDATED', payload: req.body });
        return res.json({ success: true, message: 'Updated' });
    } catch (e) {
        return res.status(500).json({ success: false, message: e.message });
    }
};

export function handleStoreWsMessage(data, ws, storeId, source) {
    if (data.action === 'UPDATE_STORE_INFO') {
        DataLayer.updateStoreConfig(storeId, data.payload);
        WebSocketHub.broadcastToGateway(storeId, { action: 'STORE_INFO_UPDATED', payload: data.payload });
    }
    if (data.action === 'UPDATE_HERO_BANNER') {
        DataLayer.updateStoreConfig(storeId, { heroBanner: data.payload });
        WebSocketHub.broadcastToGateway(storeId, { action: 'HERO_UPDATED', payload: data.payload });
    }
}

/**
 * ─── CHURUONE MARKETPLACE FEED & CITY DISCOVERY ALGORITHM (CDRA-v1) ───
 * Aggregates real items across ALL connected stores, calculates city rankings,
 * and delivers real-time marketplace feed to ChuruOne.
 */
export const getMarketplaceFeed = (req, res) => {
    try {
        const storesData = DataLayer.readPlatform('stores') || { stores: [] };
        const registeredStores = storesData.stores || [];
        const storeDirIds = DataLayer.listStoreIds ? DataLayer.listStoreIds() : ['shawarma', 'skyline', 'nash-studio'];
        
        // Filter out platform names, typos, and non-merchant IDs
        const RESERVED_NON_MERCHANTS = new Set([
            'churuone', 'admin', 'platform', 'api', 'www', 'hub', 'test', '10', 'sawarma'
        ]);

        const DEFAULT_STORE_IMAGES = {
            food: 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?auto=format&fit=crop&w=600&q=80',
            fashion: 'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?auto=format&fit=crop&w=600&q=80',
            salon: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80',
            general: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=600&q=80'
        };

        const allStoreIds = Array.from(new Set([
            ...registeredStores.map(s => s.id || s.slug),
            ...storeDirIds
        ])).filter(Boolean);

        const validStoreIds = allStoreIds.filter(id => {
            const clean = String(id).toLowerCase().trim();
            if (RESERVED_NON_MERCHANTS.has(clean)) return false;
            if (clean.length < 3 || /^\d+$/.test(clean)) return false;
            return true;
        });

        const marketplaceStores = [];
        const allItems = [];
        const allDeals = [];

        for (const sId of validStoreIds) {
            const config = DataLayer.getStoreConfig(sId) || {};
            const storeInfo = DataLayer.read(sId, 'store_info') || {};
            const rawMenu = DataLayer.read(sId, 'menu') || [];
            const menuItems = Array.isArray(rawMenu)
                ? rawMenu
                : (Array.isArray(rawMenu?.menu) ? rawMenu.menu : (Array.isArray(rawMenu?.items) ? rawMenu.items : []));
            const rawDeals = DataLayer.read(sId, 'deals') || [];
            const dealsList = Array.isArray(rawDeals)
                ? rawDeals
                : (Array.isArray(rawDeals?.deals) ? rawDeals.deals : []);
            const heroBanner = DataLayer.read(sId, 'hero_banner') || {};

            // Skip any non-core store with 0 items
            if (menuItems.length === 0 && !['shawarma', 'skyline', 'nash-studio'].includes(sId)) {
                continue;
            }

            const regStore = registeredStores.find(s => s.id === sId || s.slug === sId) || {};
            const vertical = (regStore.vertical || config.vertical || storeInfo.vertical || (
                sId.includes('nash') ? 'salon' :
                sId.includes('skyline') ? 'fashion' : 'food'
            )).toLowerCase();

            const storeName = storeInfo.name || storeInfo.studioName || regStore.name || config.name || sId;
            const storeTiming = vertical === 'salon' ? '15 min slot' : (storeInfo.timing || '20-30 min');
            const storeRating = storeInfo.rating || '4.8';
            const storeImg = storeInfo.image || heroBanner.circleImage || (menuItems[0]?.image || menuItems[0]?.img) || DEFAULT_STORE_IMAGES[vertical] || DEFAULT_STORE_IMAGES.general;
            const destination = vertical === 'salon' ? '/nash' : (vertical === 'fashion' ? '/skyline' : '/shawarma');

            const storeSummary = {
                id: sId,
                name: storeName,
                vertical,
                category: vertical === 'food' ? 'Charcoal Kitchen & Dining' : (vertical === 'salon' ? 'Salon & Luxury Grooming' : 'Luxury Menswear & Outfits'),
                rating: String(storeRating),
                timing: storeTiming,
                image: storeImg,
                destination,
                tag: vertical === 'food' ? 'Food Delivery' : (vertical === 'salon' ? 'Salon Booking' : 'Fashion & Outfits'),
                isOpen: storeInfo.isOpen !== false,
                address: storeInfo.address || 'Churu, Rajasthan',
                phone: storeInfo.phone || storeInfo.whatsapp || '7023963189',
                freeDeliveryThreshold: storeInfo.freeDeliveryThreshold ?? 499,
                upiId: storeInfo.upiId || '7023963189@fam',
                payeeName: storeInfo.payeeName || storeName,
                itemCount: menuItems.length,
                dealsCount: dealsList.length
            };
            marketplaceStores.push(storeSummary);

            // Add active deals
            dealsList.forEach(d => {
                if (d.isActive !== false && d.active !== false) {
                    allDeals.push({
                        ...d,
                        storeId: sId,
                        storeName
                    });
                }
            });

            // Add catalog items
            menuItems.forEach(item => {
                if (item.available !== false) {
                    const isService = vertical === 'salon';
                    const itemPrice = Number(item.price) || 0;
                    const itemMrp = Number(item.originalPrice || item.mrp) || Math.round(itemPrice * 1.25);
                    allItems.push({
                        id: item.id || `${sId}-${item.name?.toLowerCase().replace(/\s+/g, '-')}`,
                        storeId: sId,
                        storeName,
                        storeVertical: vertical,
                        name: item.name,
                            type: isService ? 'service' : 'product',
                            category: (item.category || item.categoryId || vertical).toLowerCase(),
                            price: itemPrice,
                            originalPrice: itemMrp,
                            image: item.image || item.img || storeImg,
                            description: item.description || item.desc || '',
                            rating: item.rating || 4.8,
                            reviews: item.reviews || 25,
                            isVeg: item.isVeg,
                            durationMinutes: item.durationMinutes || item.time || 30,
                            sizes: item.sizes || (vertical === 'fashion' ? ['UK 7', 'UK 8', 'UK 9', 'UK 10'] : null),
                            colors: item.colors || null,
                            destination,
                            destinationStoreId: sId
                        });
                    }
                });
        }

        // ─── CHURUONE CITY DISCOVERY & RANKING ALGORITHM (CDRA-v1) ────
        // 1. Trending in Churu: High ratings and popular items
        const trendingItems = [...allItems]
            .sort((a, b) => ((b.rating || 4.8) * (b.reviews || 10)) - ((a.rating || 4.8) * (a.reviews || 10)))
            .slice(0, 8);

        // 2. Best Deals: Items with highest discount margin
        const topDeals = [...allItems]
            .map(item => ({
                ...item,
                discountPct: Math.round(((item.originalPrice - item.price) / (item.originalPrice || 1)) * 100)
            }))
            .sort((a, b) => b.discountPct - a.discountPct)
            .slice(0, 6);

        // 3. Category groupings
        const foodItems = allItems.filter(i => i.storeVertical === 'food');
        const fashionItems = allItems.filter(i => i.storeVertical === 'fashion');
        const salonServices = allItems.filter(i => i.storeVertical === 'salon');

        // Dynamic categories for UI
        const categories = [
            { id: 'all', name: 'All City Items', emoji: '🌟', count: allItems.length },
            { id: 'food', name: 'Food & Shawarma', emoji: '🌯', count: foodItems.length },
            { id: 'fashion', name: 'Fashion & Outfits', emoji: '👕', count: fashionItems.length },
            { id: 'salon', name: 'Salon & Grooming', emoji: '✂️', count: salonServices.length },
            { id: 'deals', name: 'Combos & Offers', emoji: '🎁', count: topDeals.length }
        ];

        return res.json({
            success: true,
            stores: marketplaceStores,
            items: allItems,
            trending: trendingItems,
            topDeals,
            deals: allDeals,
            categories,
            stats: {
                totalStores: marketplaceStores.length,
                totalProducts: allItems.length,
                activeDeals: allDeals.length,
                cityStatus: 'Fast Delivery in 20-30 Mins across Churu'
            }
        });
    } catch (e) {
        return res.status(500).json({ success: false, message: e.message });
    }
};
