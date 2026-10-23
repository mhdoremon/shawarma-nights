import fs from 'fs';
import path from 'path';
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
        const { storeId } = req.params;
        if (!storeId) {
            return res.status(400).json({ success: false, message: 'Store ID required' });
        }
        const cleanId = String(storeId).toLowerCase().trim();
        const PROTECTED = ['churuone', 'shawarma', 'skyline', 'nash-studio'];
        if (PROTECTED.includes(cleanId)) {
            return res.status(403).json({ success: false, message: `System flagship store '${cleanId}' cannot be deleted!` });
        }

        // 1. Delete from stores.json / _platform
        const storesData = DataLayer.readPlatform('stores') || { stores: [] };
        let removedStoreSlug = null;
        let removedDukanId = null;
        storesData.stores = (storesData.stores || []).filter(s => {
            const matches = String(s.id || '').toLowerCase() === cleanId ||
                            String(s.slug || '').toLowerCase() === cleanId ||
                            String(s.dukanId || '').toLowerCase() === cleanId;
            if (matches) {
                removedStoreSlug = s.slug || s.id;
                removedDukanId = s.dukanId;
                return false;
            }
            return true;
        });
        DataLayer.writePlatform('stores', storesData);

        // Also update server/data/stores.json directly
        try {
            const rawStoresPath = path.join(process.cwd(), 'server', 'data', 'stores.json');
            if (fs.existsSync(rawStoresPath)) {
                const rawData = JSON.parse(fs.readFileSync(rawStoresPath, 'utf8'));
                if (Array.isArray(rawData.stores)) {
                    rawData.stores = rawData.stores.filter(s => 
                        String(s.id || '').toLowerCase() !== cleanId &&
                        String(s.slug || '').toLowerCase() !== cleanId &&
                        String(s.dukanId || '').toLowerCase() !== cleanId
                    );
                    fs.writeFileSync(rawStoresPath, JSON.stringify(rawData, null, 2));
                }
            }
        } catch (e) {
            console.warn('Error syncing raw stores.json deletion:', e);
        }

        // Also sync smart-backend/data/stores.json
        try {
            const smartStoresPath = path.join(process.cwd(), 'smart-backend', 'data', 'stores.json');
            if (fs.existsSync(smartStoresPath)) {
                const smartData = JSON.parse(fs.readFileSync(smartStoresPath, 'utf8'));
                if (Array.isArray(smartData.stores)) {
                    smartData.stores = smartData.stores.filter(s => 
                        String(s.id || '').toLowerCase() !== cleanId &&
                        String(s.slug || '').toLowerCase() !== cleanId &&
                        String(s.dukanId || '').toLowerCase() !== cleanId
                    );
                    fs.writeFileSync(smartStoresPath, JSON.stringify(smartData, null, 2));
                }
            }
        } catch (e) {
            console.warn('Error syncing smart-backend stores.json deletion:', e);
        }

        // 2. Delete from dukandars.json
        try {
            const dukandarsData = DataLayer.readJson('dukandars.json') || { dukandars: [] };
            dukandarsData.dukandars = (dukandarsData.dukandars || []).filter(d => 
                String(d.dukanId || '').toLowerCase() !== cleanId &&
                String(d.storeSlug || '').toLowerCase() !== cleanId &&
                (removedDukanId ? String(d.dukanId || '').toLowerCase() !== String(removedDukanId).toLowerCase() : true) &&
                (removedStoreSlug ? String(d.storeSlug || '').toLowerCase() !== String(removedStoreSlug).toLowerCase() : true)
            );
            DataLayer.writeJson('dukandars.json', dukandarsData);

            const smartDukandarsPath = path.join(process.cwd(), 'smart-backend', 'data', 'dukandars.json');
            if (fs.existsSync(smartDukandarsPath)) {
                fs.writeFileSync(smartDukandarsPath, JSON.stringify(dukandarsData, null, 2));
            }
        } catch (e) {
            console.warn('Error deleting from dukandars.json:', e);
        }

        // 3. Remove store folder on disk
        const targetsToDelete = new Set([cleanId, removedStoreSlug, removedDukanId].filter(Boolean));
        targetsToDelete.forEach(slug => {
            const serverDir = path.join(process.cwd(), 'server', 'data', 'stores', slug);
            if (fs.existsSync(serverDir)) {
                try { fs.rmSync(serverDir, { recursive: true, force: true }); } catch {}
            }
            const smartDir = path.join(process.cwd(), 'smart-backend', 'data', 'stores', slug);
            if (fs.existsSync(smartDir)) {
                try { fs.rmSync(smartDir, { recursive: true, force: true }); } catch {}
            }
        });

        return res.json({ success: true, message: `Store '${cleanId}' has been completely deleted.` });
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
        const config = DataLayer.getStoreConfig(req.storeId) || {};
        const updates = req.body || {};
        config.settings = { ...(config.settings || {}), ...updates };
        
        const storeNameVal = updates.name || updates.studioName || updates.storeName;
        if (storeNameVal) {
            config.name = storeNameVal;
            config.storeName = storeNameVal;
            config.studioName = storeNameVal;
            config.settings.name = storeNameVal;
            config.settings.storeName = storeNameVal;
            config.settings.studioName = storeNameVal;
        }

        const phoneVal = updates.phoneDisplay || updates.phone;
        if (phoneVal) {
            config.settings.phoneDisplay = phoneVal;
            config.settings.phone = phoneVal;
        }

        if (updates.isOpen !== undefined) {
            const openBool = Boolean(updates.isOpen);
            config.isOpen = openBool;
            config.settings.isOpen = openBool;
        }

        if (updates.weeklySchedule !== undefined) {
            config.weeklySchedule = updates.weeklySchedule;
            config.settings.weeklySchedule = updates.weeklySchedule;
        }

        if (updates.timing !== undefined) {
            config.timing = updates.timing;
            config.settings.timing = updates.timing;
        }

        if (updates.marketplaceVisible !== undefined) {
            const mvBool = Boolean(updates.marketplaceVisible);
            config.marketplaceVisible = mvBool;
            config.settings.marketplaceVisible = mvBool;
            try {
                const storesData = DataLayer.readPlatform('stores') || { stores: [] };
                const stores = storesData.stores || [];
                const targetStore = stores.find(s => 
                    (s.id || s.slug) === req.storeId || 
                    s.slug === req.storeId || 
                    (s.dukanId && s.dukanId.toLowerCase() === req.storeId.toLowerCase())
                );
                if (targetStore) {
                    targetStore.marketplaceVisible = mvBool;
                    if (config.mohalla && !targetStore.mohalla) targetStore.mohalla = config.mohalla;
                    if (config.nearestLandmark && !targetStore.nearestLandmark) targetStore.nearestLandmark = config.nearestLandmark;
                } else {
                    stores.push({
                        id: req.storeId,
                        slug: req.storeId,
                        name: config.name || req.storeId,
                        status: 'active',
                        marketplaceVisible: mvBool,
                        mohalla: config.mohalla || config.settings?.mohalla || '',
                        nearestLandmark: config.nearestLandmark || config.settings?.nearestLandmark || ''
                    });
                }
                DataLayer.writePlatform('stores', { stores });
            } catch (err) {
                console.warn('Could not sync stores.json:', err);
            }
        }

        if (updates.isSetupComplete !== undefined) {
            const scBool = Boolean(updates.isSetupComplete);
            config.isSetupComplete = scBool;
            config.settings.isSetupComplete = scBool;
            try {
                const storesData = DataLayer.readPlatform('stores') || { stores: [] };
                const stores = storesData.stores || [];
                const targetStore = stores.find(s => 
                    (s.id || s.slug) === req.storeId || 
                    s.slug === req.storeId || 
                    (s.dukanId && s.dukanId.toLowerCase() === req.storeId.toLowerCase())
                );
                if (targetStore) {
                    targetStore.isSetupComplete = scBool;
                    DataLayer.writePlatform('stores', { stores });
                }
            } catch (err) {
                console.warn('Could not sync stores.json setupComplete:', err);
            }
        }

        if (updates.payment) config.payment = { ...(config.payment || {}), ...updates.payment };
        if (updates.socials) config.socials = { ...(config.socials || {}), ...updates.socials };
        if (updates.taxesAndCharges) config.taxesAndCharges = { ...(config.taxesAndCharges || {}), ...updates.taxesAndCharges };
        DataLayer.updateStoreConfig(req.storeId, config);

        const activeName = config.name || config.settings?.name || config.settings?.studioName;
        const combined = {
            ...(config.settings || {}),
            isOpen: config.settings.isOpen !== false,
            weeklySchedule: config.settings.weeklySchedule || config.weeklySchedule || {},
            marketplaceVisible: config.settings.marketplaceVisible !== false,
            isSetupComplete: Boolean(config.settings.isSetupComplete ?? config.isSetupComplete),
            status: config.status || 'active',
            name: activeName,
            studioName: activeName,
            storeName: activeName,
            phoneDisplay: config.settings?.phoneDisplay || config.settings?.phone || '',
            phone: config.settings?.phone || config.settings?.phoneDisplay || '',
            payment: config.payment || {},
            socials: config.socials || {},
            taxesAndCharges: config.taxesAndCharges || {}
        };
        try {
            DataLayer.write(req.storeId, 'store_info', combined);
        } catch (e) {}

        WebSocketHub.broadcastToAll(req.storeId, { action: 'STORE_INFO_UPDATED', payload: combined });
        return res.json({ success: true, message: 'Updated', storeInfo: combined });
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
        WebSocketHub.broadcastToAll(req.storeId, { action: 'HERO_UPDATED', payload: req.body });
        return res.json({ success: true, message: 'Updated' });
    } catch (e) {
        return res.status(500).json({ success: false, message: e.message });
    }
};

export function handleStoreWsMessage(data, ws, storeId, source) {
    if (data.action === 'UPDATE_STORE_INFO') {
        const updates = data.payload || data.storeInfo || {};
        const config = DataLayer.getStoreConfig(storeId) || {};
        config.settings = { ...(config.settings || {}), ...updates };
        if (updates.isOpen !== undefined) {
            config.isOpen = Boolean(updates.isOpen);
            config.settings.isOpen = Boolean(updates.isOpen);
        }
        if (updates.weeklySchedule !== undefined) {
            config.weeklySchedule = updates.weeklySchedule;
            config.settings.weeklySchedule = updates.weeklySchedule;
        }
        if (updates.marketplaceVisible !== undefined) {
            const mvBool = Boolean(updates.marketplaceVisible);
            config.marketplaceVisible = mvBool;
            config.settings.marketplaceVisible = mvBool;
            try {
                const storesData = DataLayer.readPlatform('stores') || { stores: [] };
                const stores = storesData.stores || [];
                const targetStore = stores.find(s => (s.id || s.slug) === storeId);
                if (targetStore) targetStore.marketplaceVisible = mvBool;
                DataLayer.writePlatform('stores', { stores });
            } catch (e) {}
        }
        if (updates.payment) config.payment = { ...(config.payment || {}), ...updates.payment };
        if (updates.socials) config.socials = { ...(config.socials || {}), ...updates.socials };
        if (updates.taxesAndCharges) config.taxesAndCharges = { ...(config.taxesAndCharges || {}), ...updates.taxesAndCharges };
        DataLayer.updateStoreConfig(storeId, config);
        const combined = {
            ...(config.settings || {}),
            isOpen: config.settings.isOpen !== false,
            weeklySchedule: config.settings.weeklySchedule || config.weeklySchedule || {},
            marketplaceVisible: config.settings.marketplaceVisible !== false,
            payment: config.payment || {},
            socials: config.socials || {},
            taxesAndCharges: config.taxesAndCharges || {}
        };
        try {
            DataLayer.write(storeId, 'store_info', combined);
        } catch (e) {}
        WebSocketHub.broadcastToAll(storeId, { action: 'STORE_INFO_UPDATED', payload: combined });
    }
    if (data.action === 'UPDATE_HERO_BANNER') {
        const hero = data.payload || data.heroBanner || {};
        DataLayer.updateStoreConfig(storeId, { heroBanner: hero });
        WebSocketHub.broadcastToAll(storeId, { action: 'HERO_UPDATED', payload: hero });
    }
}

const CHURU_COORDS = {
    subhash_chowk: { lat: 28.2915, lng: 74.9662 },
    naya_bass: { lat: 28.2965, lng: 74.9590 },
    station_road: { lat: 28.2950, lng: 74.9690 },
    nai_sarak: { lat: 28.2930, lng: 74.9630 },
    dharamstupa: { lat: 28.2920, lng: 74.9645 },
    kotwali: { lat: 28.2920, lng: 74.9645 },
    collectorate_road: { lat: 28.2880, lng: 74.9610 },
    collectorate: { lat: 28.2880, lng: 74.9610 },
    pankha_circle: { lat: 28.2990, lng: 74.9720 },
    lohiya_college: { lat: 28.2850, lng: 74.9580 },
    nature_park: { lat: 28.2830, lng: 74.9620 },
    ramgarh_road: { lat: 28.3020, lng: 74.9640 },
    purani_abadi: { lat: 28.2980, lng: 74.9650 },
    raj_colony: { lat: 28.2890, lng: 74.9540 },
    gandhi_nagar: { lat: 28.2840, lng: 74.9680 },
    adarsh_nagar: { lat: 28.2810, lng: 74.9650 },
    ghantaghar: { lat: 28.2925, lng: 74.9655 }
};

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
            'churuone', 'admin', 'platform', 'api', 'www', 'hub', '10', 'sawarma'
        ]);

        const DEFAULT_STORE_IMAGES = {
            food: 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?auto=format&fit=crop&w=600&q=80',
            fashion: 'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?auto=format&fit=crop&w=600&q=80',
            salon: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80',
            mohalla_kirana: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80',
            grocery: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80',
            general: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=600&q=80'
        };

        const allStoreIds = Array.from(new Set([
            ...registeredStores.map(s => s.id || s.slug),
            ...storeDirIds
        ])).filter(Boolean);

        const showAll = req?.query?.all === 'true' || req?.query?.admin === 'true';
        const validStoreIds = allStoreIds.filter(id => {
            const clean = String(id).toLowerCase().trim();
            if (RESERVED_NON_MERCHANTS.has(clean)) return false;
            if (clean.length < 3 || /^\d+$/.test(clean)) return false;
            
            // Check dynamic store visibility: most recent user setting takes precedence
            const reg = registeredStores.find(s => (s.id || s.slug) === clean);
            const cfg = DataLayer.getStoreConfig(clean) || {};
            const sInfo = DataLayer.read(clean, 'store_info') || {};
            const storeMv = reg?.marketplaceVisible !== undefined ? reg.marketplaceVisible :
                            (cfg?.settings?.marketplaceVisible !== undefined ? cfg.settings.marketplaceVisible :
                            (sInfo?.marketplaceVisible !== undefined ? sInfo.marketplaceVisible :
                            (cfg?.marketplaceVisible !== undefined ? cfg.marketplaceVisible : true)));
            if (!showAll && storeMv === false) {
                return false;
            }
            return true;
        });

        // ─── DEDUPLICATE STORES BY CANONICAL IDENTITY & SLUG ───
        const processedCanonicalKeys = new Set();
        const deduplicatedStoreBatches = [];

        for (const rawId of validStoreIds) {
            const clean = String(rawId).toLowerCase().trim();
            const regStore = registeredStores.find(s => 
                String(s.id || '').toLowerCase() === clean || 
                String(s.slug || '').toLowerCase() === clean
            ) || {};
            const config = DataLayer.getStoreConfig(clean) || {};
            const storeInfo = DataLayer.read(clean, 'store_info') || {};

            let canonicalSlug = (regStore.slug || config.slug || '').toLowerCase().trim();
            if (!canonicalSlug) {
                const match = registeredStores.find(s => String(s.id || '').toLowerCase() === clean || String(s.slug || '').toLowerCase() === clean);
                if (match) canonicalSlug = String(match.slug || match.id).toLowerCase().trim();
            }
            if (!canonicalSlug) canonicalSlug = clean;

            const storeNameClean = String(regStore.name || config.name || storeInfo.name || '').toLowerCase().trim();
            const storePhoneClean = String(regStore.phone || config.phone || storeInfo.phone || '').trim();
            const identityKey = (storeNameClean && storePhoneClean) ? `np_${storeNameClean}_${storePhoneClean}` : canonicalSlug;

            const rawMenu = DataLayer.read(clean, 'menu') || [];
            const menuItems = Array.isArray(rawMenu)
                ? rawMenu
                : (Array.isArray(rawMenu?.menu) ? rawMenu.menu : (Array.isArray(rawMenu?.items) ? rawMenu.items : []));

            if (processedCanonicalKeys.has(canonicalSlug) || (identityKey && processedCanonicalKeys.has(identityKey))) {
                // If duplicate, merge items to whichever directory had the actual inventory
                const existingBatch = deduplicatedStoreBatches.find(b => b.canonicalSlug === canonicalSlug || b.identityKey === identityKey);
                if (existingBatch && menuItems.length > existingBatch.menuItems.length) {
                    existingBatch.sId = clean;
                    existingBatch.menuItems = menuItems;
                    existingBatch.config = { ...existingBatch.config, ...config };
                    existingBatch.regStore = { ...existingBatch.regStore, ...regStore };
                    existingBatch.storeInfo = { ...existingBatch.storeInfo, ...storeInfo };
                }
                continue;
            }

            processedCanonicalKeys.add(canonicalSlug);
            if (identityKey) processedCanonicalKeys.add(identityKey);

            deduplicatedStoreBatches.push({
                sId: clean,
                canonicalSlug,
                identityKey,
                config,
                regStore,
                storeInfo,
                menuItems
            });
        }

        const marketplaceStores = [];
        const allItems = [];
        const allDeals = [];

        for (const batch of deduplicatedStoreBatches) {
            const { sId, config, regStore, storeInfo, menuItems } = batch;

            const storeStatus = regStore.status || config.status || storeInfo.status || 'active';

            // Customer feed completely hides closed/deactivated/suspended stores
            if (!showAll && (storeStatus === 'deactivated' || storeStatus === 'suspended')) {
                continue;
            }

            const rawDeals = DataLayer.read(sId, 'deals') || [];
            const dealsList = Array.isArray(rawDeals)
                ? rawDeals
                : (Array.isArray(rawDeals?.deals) ? rawDeals.deals : []);
            const heroBanner = DataLayer.read(sId, 'hero_banner') || {};

            // Skip any non-core store with 0 items for public customer feed; Admin sees all stores!
            if (!showAll && menuItems.length === 0 && !['shawarma', 'skyline', 'nash-studio'].includes(sId)) {
                continue;
            }
            const rawVert = (regStore.vertical || config.vertical || storeInfo.vertical || (
                sId.includes('nash') ? 'salon' :
                sId.includes('skyline') ? 'fashion' : 'food'
            )).toLowerCase();
            const vertical = (rawVert === 'clothing' || rawVert === 'apparel') ? 'fashion' : rawVert;

            const storeName = storeInfo.name || storeInfo.studioName || regStore.name || config.name || sId;
            const storeTiming = vertical === 'salon' ? '15 min slot' : (storeInfo.timing || '20-30 min');
            const storeRating = storeInfo.rating || '4.8';
            const storeImg = storeInfo.image || heroBanner.circleImage || (menuItems[0]?.image || menuItems[0]?.img) || DEFAULT_STORE_IMAGES[vertical] || DEFAULT_STORE_IMAGES.general;
            const destination = vertical === 'salon' ? '/nash' : (vertical === 'fashion' ? '/skyline' : '/shawarma');

            const isFlagship = Boolean(
                regStore.isFlagship || 
                config.isFlagship || 
                ['shawarma', 'skyline', 'nash-studio'].includes(sId)
            );
            const isMohallaStore = Boolean(
                regStore.isMohallaStore || 
                config.isMohallaStore || 
                vertical === 'mohalla_kirana' || 
                sId.includes('kirana') || 
                sId.includes('gupta')
            );

            const isStoreOpen = storeInfo.isOpen !== undefined 
                ? Boolean(storeInfo.isOpen)
                : (config.settings?.isOpen !== undefined ? Boolean(config.settings.isOpen) : isFlagship);
            const isStoreMarketplaceVisible = regStore.marketplaceVisible ?? config.marketplaceVisible ?? isFlagship;
            const isSetupComplete = Boolean(config.isSetupComplete ?? regStore.isSetupComplete ?? (isFlagship || menuItems.length > 0));

            const storeSummary = {
                id: sId,
                name: storeName,
                vertical,
                category: isMohallaStore ? 'Mohalla Kirana & Daily Needs' : (vertical === 'food' ? 'Charcoal Kitchen & Dining' : (vertical === 'salon' ? 'Salon & Luxury Grooming' : 'Luxury Menswear & Outfits')),
                rating: String(storeRating),
                timing: isMohallaStore ? '15 min express' : storeTiming,
                image: storeImg,
                destination: isMohallaStore ? `/churuone?store=${sId}` : destination,
                tag: isMohallaStore ? '15 Min Express' : (vertical === 'food' ? 'Food Delivery' : (vertical === 'salon' ? 'Salon Booking' : 'Fashion & Outfits')),
                isOpen: isStoreOpen,
                status: regStore.status || config.status || storeInfo.status || 'active',
                isApproved: Boolean(regStore.isApproved ?? config.isApproved ?? (regStore.status === 'active' || config.status === 'active')),
                isSetupComplete,
                address: storeInfo.address || 'Churu, Rajasthan',
                phone: storeInfo.phone || storeInfo.whatsapp || '7023963189',
                freeDeliveryThreshold: storeInfo.freeDeliveryThreshold ?? (isMohallaStore ? 199 : 499),
                upiId: storeInfo.upiId || '7023963189@fam',
                payeeName: storeInfo.payeeName || storeName,
                itemCount: menuItems.length,
                dealsCount: dealsList.length,
                marketplaceVisible: isStoreMarketplaceVisible,
                isMohallaStore,
                isFlagshipBrand: isFlagship,
                isCityWide: isFlagship,
                const resolvedLandmark = regStore.nearestLandmark || config.nearestLandmark || config.settings?.nearestLandmark || storeInfo.nearestLandmark || 'subhash_chowk';
                const cleanLmKey = String(resolvedLandmark).toLowerCase().trim();
                const lmCoords = CHURU_COORDS[cleanLmKey] || { lat: 28.2915, lng: 74.9662 };
                const finalLat = Number(regStore.lat || config.lat || config.settings?.coordinates?.lat || lmCoords.lat);
                const finalLng = Number(regStore.lng || config.lng || config.settings?.coordinates?.lng || lmCoords.lng);

                const storeSummary = {
                    id: sId,
                    name: storeName,
                    vertical,
                    category: isMohallaStore ? 'Mohalla Kirana & Daily Needs' : (vertical === 'food' ? 'Charcoal Kitchen & Dining' : (vertical === 'salon' ? 'Salon & Luxury Grooming' : 'Luxury Menswear & Outfits')),
                    rating: String(storeRating),
                    timing: isMohallaStore ? '15 min express' : storeTiming,
                    image: storeImg,
                    destination: isMohallaStore ? `/churuone?store=${sId}` : destination,
                    tag: isMohallaStore ? '15 Min Express' : (vertical === 'food' ? 'Food Delivery' : (vertical === 'salon' ? 'Salon Booking' : 'Fashion & Outfits')),
                    isOpen: isStoreOpen,
                    status: regStore.status || config.status || storeInfo.status || 'active',
                    isApproved: Boolean(regStore.isApproved ?? config.isApproved ?? (regStore.status === 'active' || config.status === 'active')),
                    isSetupComplete,
                    address: storeInfo.address || 'Churu, Rajasthan',
                    phone: storeInfo.phone || storeInfo.whatsapp || '7023963189',
                    freeDeliveryThreshold: storeInfo.freeDeliveryThreshold ?? (isMohallaStore ? 199 : 499),
                    upiId: storeInfo.upiId || '7023963189@fam',
                    payeeName: storeInfo.payeeName || storeName,
                    itemCount: menuItems.length,
                    dealsCount: dealsList.length,
                    marketplaceVisible: isStoreMarketplaceVisible,
                    isMohallaStore,
                    isFlagshipBrand: isFlagship,
                    isCityWide: isFlagship,
                    mohalla: regStore.mohalla || config.mohalla || config.settings?.mohalla || storeInfo.mohalla || 'Churu Area',
                    nearestLandmark: resolvedLandmark,
                    lat: finalLat,
                    lng: finalLng,
                    radiusKm: Number(regStore.radiusKm || config.radiusKm || config.settings?.deliveryRadius || 1.5),
                    expressDeliveryMins: Number(regStore.expressDeliveryMins || config.expressDeliveryMins || 15)
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
                if (item.available !== false && item.visibleOnChuruOne !== false && item.marketplaceVisible !== false) {
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
                        category: item.category === 'combos' ? 'combos' : (isMohallaStore ? 'grocery' : (item.category || vertical)),
                        subCategory: item.subCategory || item.category || (isMohallaStore ? 'dairy' : ''),
                        unit: item.unit || '',
                        isMohallaProduct: isMohallaStore,
                        isCombo: Boolean(item.isCombo || item.category === 'combos'),
                        comboItems: item.comboItems || [],
                        badge: item.badge || item.discountBadge || '',
                        price: itemPrice,
                        originalPrice: itemMrp,
                        discount: itemMrp > itemPrice ? `-${Math.round(((itemMrp - itemPrice) / itemMrp) * 100)}%` : null,
                        image: item.image || item.img || storeImg,
                        description: item.description || '',
                        rating: Number(item.rating || storeRating),
                        reviews: Number(item.reviews || 24),
                        isVeg: item.isVeg,
                        durationMinutes: item.durationMinutes || item.time || 30,
                        sizes: item.sizes || (vertical === 'fashion' ? ['UK 7', 'UK 8', 'UK 9', 'UK 10'] : null),
                        colors: item.colors || null,
                        destination: isMohallaStore ? `/churuone?store=${sId}` : destination,
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

        // Dynamic categories for UI
        const countFor = (catId) => {
            if (catId === 'all') return allItems.length;
            if (catId === 'deals') return topDeals.length;
            return allItems.filter(i => (i.category || '').toLowerCase() === catId).length;
        };

        const hasFood = allItems.some(i => i.storeVertical === 'food');
        const hasSalon = allItems.some(i => i.storeVertical === 'salon');
        const hasFashion = allItems.some(i => i.storeVertical === 'fashion');
        const hasMohalla = marketplaceStores.some(s => s.isMohallaStore || s.vertical === 'mohalla_kirana' || s.vertical === 'grocery');
        const hasCombos = allItems.some(i => i.isCombo || i.category === 'combos');

        let categories = [
            { id: 'all', name: 'All Collection', count: allItems.length },
            ...(hasCombos ? [{ id: 'combos', name: 'Combos & Savers', count: allItems.filter(i => i.isCombo || i.category === 'combos').length }] : []),
            ...(hasMohalla ? [{ id: 'grocery', name: 'Daily & Kirana', count: allItems.filter(i => i.isMohallaProduct || i.category === 'grocery' || i.category === 'dairy' || i.category === 'staples' || i.category === 'snacks').length }] : []),
            ...(hasFood ? [{ id: 'food', name: 'Shawarma & Food', count: allItems.filter(i => i.storeVertical === 'food').length }] : []),
            ...(hasFashion ? [{ id: 'fashion', name: 'Fashion & Outfits', count: allItems.filter(i => i.storeVertical === 'fashion').length }] : []),
            ...(hasSalon ? [{ id: 'salon', name: 'Salon Grooming', count: allItems.filter(i => i.storeVertical === 'salon').length }] : []),
            { id: 'deals', name: 'Deals & Coupons', count: allDeals.length }
        ];

        const platformConfig = DataLayer.getStoreConfig('churuone') || {};
        const platformBranding = platformConfig.branding || {};
        const platformSettings = platformConfig.settings || {};

        return res.json({
            success: true,
            platform: {
                name: platformConfig.name || 'ChuruOne Marketplace',
                branding: {
                    tagline: platformBranding.tagline || 'Churu Ki Apni Digital Market • Social Commerce Hub',
                    heroTitle: platformBranding.heroTitle || 'Social Commerce Churu',
                    heroSubtitle: platformBranding.heroSubtitle || 'Churu ke verified dukandar, khana, fashion aur services — ab ek hi social commerce platform par.',
                    marqueeText: platformBranding.marqueeText || '★ LIVE ORDERS DISPATCHING ACROSS CHURU • SHAWARMA NIGHTS 25 MIN EXPRESS • SKYLINE BESPOKE APPAREL • NASH STUDIO PRIVATE SALON • 0% COMMISSION DIRECT PRICING ★',
                    cityTag: platformBranding.cityTag || 'Churu, Rajasthan'
                },
                settings: platformSettings
            },
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

/**
 * ─── 1-SECOND STORE MARKETPLACE VISIBILITY TOGGLE ───
 * Toggles or sets a store's live status on the ChuruOne Marketplace
 */
export const toggleStoreMarketplaceVisibility = (req, res) => {
    try {
        const { storeId } = req.params;
        const { visible } = req.body || {};
        const cleanId = String(storeId).toLowerCase().trim();

        const storesData = DataLayer.readPlatform('stores') || { stores: [] };
        const stores = storesData.stores || [];
        const targetStore = stores.find(s => (s.id || s.slug) === cleanId);

        let newStatus;
        if (targetStore) {
            newStatus = typeof visible === 'boolean' ? visible : !(targetStore.marketplaceVisible ?? true);
            targetStore.marketplaceVisible = newStatus;
        } else {
            newStatus = typeof visible === 'boolean' ? visible : true;
            stores.push({
                id: cleanId,
                slug: cleanId,
                name: cleanId,
                status: 'active',
                marketplaceVisible: newStatus
            });
        }

        const cfg = DataLayer.getStoreConfig(cleanId) || {};
        cfg.marketplaceVisible = newStatus;
        if (!cfg.settings) cfg.settings = {};
        cfg.settings.marketplaceVisible = newStatus;
        DataLayer.updateStoreConfig(cleanId, cfg);

        try {
            const existingInfo = DataLayer.read(cleanId, 'store_info') || {};
            DataLayer.write(cleanId, 'store_info', { ...existingInfo, marketplaceVisible: newStatus });
        } catch (e) {}

        DataLayer.writePlatform('stores', { stores });

        WebSocketHub.broadcastToAll(cleanId, {
            action: 'STORE_INFO_UPDATED',
            payload: { ...(cfg.settings || {}), marketplaceVisible: newStatus }
        });
        WebSocketHub.broadcastToAll('platform', {
            action: 'MARKETPLACE_STATUS_UPDATED',
            storeId: cleanId,
            marketplaceVisible: newStatus
        });

        return res.json({
            success: true,
            storeId: cleanId,
            marketplaceVisible: newStatus,
            message: `Store ${cleanId} is now ${newStatus ? 'visible' : 'hidden'} on ChuruOne marketplace.`
        });
    } catch (err) {
        console.error('Error toggling store marketplace visibility:', err);
        return res.status(500).json({ success: false, error: err.message });
    }
};

export const getStoreMarketplaceStatuses = (req, res) => {
    try {
        const storesData = DataLayer.readPlatform('stores') || { stores: [] };
        const stores = (storesData.stores || []).map(s => ({
            id: s.id || s.slug,
            name: s.name,
            vertical: s.vertical || s.type,
            marketplaceVisible: s.marketplaceVisible ?? true
        }));
        return res.json({ success: true, stores });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
};

/**
 * ─── SUPER ADMIN: GET ALL PRODUCTS ACROSS ALL PARTNER STORES ───
 */
export const getCityProducts = (req, res) => {
    try {
        const merchantStores = ['shawarma', 'skyline', 'nash-studio'];
        const allProducts = [];

        merchantStores.forEach(sId => {
            const config = DataLayer.getStoreConfig(sId) || {};
            const storeName = config.settings?.name || config.name || sId;
            const vertical = config.vertical || config.type || 'food';
            const menuData = DataLayer.read(sId, 'menu') || { menu: [] };
            const items = menuData.menu || [];

            items.forEach(item => {
                allProducts.push({
                    ...item,
                    storeId: sId,
                    storeName,
                    storeVertical: vertical,
                    visibleOnChuruOne: item.visibleOnChuruOne !== false && item.marketplaceVisible !== false,
                    marketplaceVisible: item.visibleOnChuruOne !== false && item.marketplaceVisible !== false
                });
            });
        });

        return res.json({ success: true, products: allProducts, total: allProducts.length });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
};

/**
 * ─── SUPER ADMIN: TOGGLE PRODUCT VISIBILITY ON CHURUONE ───
 */
export const toggleProductMarketplaceVisibility = (req, res) => {
    try {
        const { storeId, itemId } = req.params;
        const { visible } = req.body;
        const cleanStoreId = (storeId || '').trim().toLowerCase();

        const menuData = DataLayer.read(cleanStoreId, 'menu') || { menu: [], categories: [] };
        const items = menuData.menu || [];
        const item = items.find(i => String(i.id) === String(itemId));

        if (!item) {
            return res.status(404).json({ success: false, message: `Product #${itemId} not found in store ${cleanStoreId}` });
        }

        const newVisible = typeof visible === 'boolean' ? visible : !(item.visibleOnChuruOne !== false && item.marketplaceVisible !== false);
        item.visibleOnChuruOne = newVisible;
        item.marketplaceVisible = newVisible;

        DataLayer.writeSync(cleanStoreId, 'menu', menuData);

        // Broadcast to merchants and marketplace
        WebSocketHub.broadcastToAll(cleanStoreId, {
            action: 'MENU_UPDATED',
            payload: menuData
        });
        WebSocketHub.broadcastToAll('platform', {
            action: 'MARKETPLACE_PRODUCT_VISIBILITY_CHANGED',
            storeId: cleanStoreId,
            itemId,
            visible: newVisible
        });

        return res.json({
            success: true,
            storeId: cleanStoreId,
            itemId,
            visible: newVisible,
            message: `Product "${item.name}" is now ${newVisible ? 'VISIBLE' : 'HIDDEN'} on ChuruOne.`
        });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
};

/**
 * ─── SUPER ADMIN: TOGGLE DUKANDAR REVIEW MODERATION PERMISSIONS ───
 */
export const toggleStoreReviewPermission = (req, res) => {
    try {
        const { storeId } = req.params;
        const { canEditReviews } = req.body;
        const cleanStoreId = (storeId || '').trim().toLowerCase();

        const cfg = DataLayer.getStoreConfig(cleanStoreId) || {};
        if (!cfg.settings) cfg.settings = {};
        const newStatus = typeof canEditReviews === 'boolean' ? canEditReviews : !(cfg.settings.canEditReviews ?? true);
        cfg.settings.canEditReviews = newStatus;
        DataLayer.updateStoreConfig(cleanStoreId, cfg);

        return res.json({
            success: true,
            storeId: cleanStoreId,
            canEditReviews: newStatus,
            message: `Dukandar review edit rights for ${cleanStoreId} are now ${newStatus ? 'ALLOWED' : 'LOCKED'}.`
        });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
};

/**
 * ─── SUPER ADMIN: GET ALL CITY REVIEWS & PERMISSIONS ───
 */
export const getCityReviews = (req, res) => {
    try {
        const merchantStores = ['shawarma', 'skyline', 'nash-studio'];
        const platformReviews = DataLayer.read('churuone', 'reviews') || [];
        const storeReviews = [];
        const permissions = {};

        merchantStores.forEach(sId => {
            const cfg = DataLayer.getStoreConfig(sId) || {};
            permissions[sId] = cfg.settings?.canEditReviews ?? true;
            const revs = DataLayer.read(sId, 'reviews') || [];
            revs.forEach(r => {
                storeReviews.push({
                    ...r,
                    storeId: sId,
                    storeName: cfg.settings?.name || cfg.name || sId
                });
            });
        });

        return res.json({
            success: true,
            platformReviews,
            storeReviews,
            permissions
        });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
};

/**
 * ─── STORE OPERATIONAL STATUS (Deactivate / Suspend / Restore) ───
 */
export const updateStoreOperationalStatus = (req, res) => {
    try {
        const { storeId } = req.params;
        const { status, note } = req.body; // 'active', 'deactivated', 'suspended'
        if (!storeId || !status) {
            return res.status(400).json({ success: false, message: 'storeId and status are required' });
        }
        if (!['active', 'deactivated', 'suspended'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status. Must be active, deactivated, or suspended.' });
        }

        const cleanId = String(storeId).toLowerCase().trim();
        const isOpen = status === 'active';
        const marketplaceVisible = status === 'active';

        // 1. Update stores.json
        const storesData = DataLayer.readPlatform('stores') || { stores: [] };
        const stores = storesData.stores || [];
        const targetStore = stores.find(s => 
            String(s.id || '').toLowerCase() === cleanId || 
            String(s.slug || '').toLowerCase() === cleanId
        );
        if (targetStore) {
            targetStore.status = status;
            targetStore.isOpen = isOpen;
            targetStore.marketplaceVisible = marketplaceVisible;
            if (status !== 'active') targetStore.deactivatedAt = new Date().toISOString();
            if (note) targetStore.statusNote = note;
            DataLayer.writePlatform('stores', { stores });
        }

        // 2. Update dukandars.json
        const dukandarsData = DataLayer.readJson('dukandars.json') || { dukandars: [] };
        const dukandars = dukandarsData.dukandars || [];
        const targetDukandar = dukandars.find(d => 
            String(d.dukanId || '').toLowerCase() === cleanId || 
            String(d.storeSlug || '').toLowerCase() === cleanId
        );
        if (targetDukandar) {
            targetDukandar.status = status;
            if (status !== 'active') targetDukandar.deactivatedAt = new Date().toISOString();
            if (note) targetDukandar.statusNote = note;
            DataLayer.writeJson('dukandars.json', { dukandars });
        }

        // 3. Update store config
        const config = DataLayer.getStoreConfig(cleanId) || {};
        config.status = status;
        config.isOpen = isOpen;
        config.marketplaceVisible = marketplaceVisible;
        if (!config.settings) config.settings = {};
        config.settings.isOpen = isOpen;
        config.settings.marketplaceVisible = marketplaceVisible;
        if (note) config.statusNote = note;
        DataLayer.updateStoreConfig(cleanId, config);

        if (targetStore && targetStore.id && targetStore.id.toLowerCase() !== cleanId) {
            DataLayer.updateStoreConfig(targetStore.id.toLowerCase(), config);
        }

        return res.json({
            success: true,
            status,
            message: status === 'active' 
                ? `Store ${cleanId} has been successfully reactivated.` 
                : (status === 'suspended' ? `Store ${cleanId} access has been blocked / terminated by Super Admin.` : `Store ${cleanId} is now deactivated.`)
        });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
};
