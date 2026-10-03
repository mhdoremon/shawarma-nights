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
            taxesAndCharges: config.taxesAndCharges 
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
        if (updates.payment) config.payment = { ...(config.payment || {}), ...updates.payment };
        if (updates.socials) config.socials = { ...(config.socials || {}), ...updates.socials };
        if (updates.taxesAndCharges) config.taxesAndCharges = { ...(config.taxesAndCharges || {}), ...updates.taxesAndCharges };
        DataLayer.updateStoreConfig(req.storeId, config);

        const combined = {
            ...(config.settings || {}),
            payment: config.payment || {},
            socials: config.socials || {},
            taxesAndCharges: config.taxesAndCharges || {}
        };
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
        if (updates.payment) config.payment = { ...(config.payment || {}), ...updates.payment };
        if (updates.socials) config.socials = { ...(config.socials || {}), ...updates.socials };
        if (updates.taxesAndCharges) config.taxesAndCharges = { ...(config.taxesAndCharges || {}), ...updates.taxesAndCharges };
        DataLayer.updateStoreConfig(storeId, config);
        const combined = {
            ...(config.settings || {}),
            payment: config.payment || {},
            socials: config.socials || {},
            taxesAndCharges: config.taxesAndCharges || {}
        };
        WebSocketHub.broadcastToAll(storeId, { action: 'STORE_INFO_UPDATED', payload: combined });
    }
    if (data.action === 'UPDATE_HERO_BANNER') {
        const hero = data.payload || data.heroBanner || {};
        DataLayer.updateStoreConfig(storeId, { heroBanner: hero });
        WebSocketHub.broadcastToAll(storeId, { action: 'HERO_UPDATED', payload: hero });
    }
}
