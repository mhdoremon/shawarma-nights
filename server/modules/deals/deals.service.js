import DataLayer from '../../core/DataLayer.js';
import WebSocketHub from '../../core/WebSocketHub.js';
import { generateId, safeNum } from '../../utils/helpers.js';

export const getDeals = (req, res) => {
    try {
        const deals = DataLayer.read(req.storeId, 'deals') || [];
        res.json({ success: true, data: deals });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const upsertDeal = (req, res) => {
    try {
        const body = req.body;
        const deals = DataLayer.read(req.storeId, 'deals') || [];
        
        let deal = deals.find(d => d.id === body.id);
        if (deal) {
            Object.assign(deal, body);
        } else {
            deal = {
                ...body,
                id: body.id || generateId('deal')
            };
            deals.push(deal);
        }

        DataLayer.writeSync(req.storeId, 'deals', deals);
        WebSocketHub.broadcastToAll(req.storeId, { action: 'DEALS_UPDATED', payload: deals });

        res.json({ success: true, data: deal });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteDeal = (req, res) => {
    try {
        const { id } = req.params;
        let deals = DataLayer.read(req.storeId, 'deals') || [];
        deals = deals.filter(d => d.id !== id);
        
        DataLayer.writeSync(req.storeId, 'deals', deals);
        WebSocketHub.broadcastToAll(req.storeId, { action: 'DEALS_UPDATED', payload: deals });
        
        res.json({ success: true, message: 'Deal deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const _validateSingleCoupon = (deal, subtotal, phone, itemCategories, storeId) => {
    const isActiveDeal = deal.isActive !== undefined ? deal.isActive : (deal.active !== undefined ? deal.active : true);
    if (!isActiveDeal) return { valid: false, reason: 'Coupon is not active' };
    
    if (deal.minOrder && safeNum(subtotal) < safeNum(deal.minOrder)) {
        return { valid: false, reason: `Minimum order amount is ${deal.minOrder}` };
    }
    
    if (deal.usageLimit && deal.usageCount >= deal.usageLimit) {
        return { valid: false, reason: 'Coupon usage limit reached' };
    }
    
    if (deal.perUserLimit && phone) {
        const couponUsage = DataLayer.read(storeId, 'coupon_usage') || {};
        const userUsage = couponUsage[phone]?.[deal.code] || 0;
        if (userUsage >= deal.perUserLimit) {
            return { valid: false, reason: 'Per user usage limit reached' };
        }
    }
    
    const currentDate = new Date();
    if (deal.startDate && new Date(deal.startDate) > currentDate) return { valid: false, reason: 'Coupon not yet valid' };
    if (deal.endDate && new Date(deal.endDate) < currentDate) return { valid: false, reason: 'Coupon expired' };
    
    if (deal.startTime && deal.endTime) {
        const currentHour = currentDate.getHours();
        const currentMin = currentDate.getMinutes();
        const currentMins = currentHour * 60 + currentMin;
        
        const [startH, startM] = deal.startTime.split(':').map(Number);
        const [endH, endM] = deal.endTime.split(':').map(Number);
        const startMins = startH * 60 + startM;
        const endMins = endH * 60 + endM;
        
        if (currentMins < startMins || currentMins > endMins) {
            return { valid: false, reason: 'Coupon not valid at this time' };
        }
    }
    
    if (deal.activeDays && deal.activeDays.length > 0) {
        const dayMap = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const currentDay = dayMap[currentDate.getDay()];
        if (!deal.activeDays.includes(currentDay)) {
            return { valid: false, reason: 'Coupon not valid today' };
        }
    }
    
    if (deal.applicableCategories && deal.applicableCategories.length > 0) {
        if (!itemCategories || !itemCategories.some(c => deal.applicableCategories.includes(c))) {
            return { valid: false, reason: 'Coupon not applicable to items in cart' };
        }
    }
    
    if (deal.firstOrderOnly && phone) {
        const orders = DataLayer.read(storeId, 'orders') || [];
        const hasOrdered = orders.some(o => o.customer?.phone === phone || o.customerPhone === phone);
        if (hasOrdered) {
            return { valid: false, reason: 'Coupon valid for first order only' };
        }
    }
    
    return { valid: true, deal };
};

export const validateCoupon = (req, res) => {
    try {
        const { code, subtotal, phone, itemCategories } = req.body;
        const deals = DataLayer.read(req.storeId, 'deals') || [];
        
        const deal = deals.find(d => (d.code || '').toLowerCase() === (code || '').toLowerCase());
        if (!deal) {
            return res.json({ success: false, valid: false, reason: 'Invalid coupon code', message: 'Invalid promo code. Kripya valid offer code dalein!' });
        }
        
        const result = _validateSingleCoupon(deal, subtotal, phone, itemCategories, req.storeId);
        const isValid = Boolean(result.valid);
        res.json({
            success: isValid,
            valid: isValid,
            coupon: isValid ? deal : null,
            deal: isValid ? deal : null,
            message: result.reason || (isValid ? `Coupon "${deal.code}" applied!` : 'Invalid coupon'),
            reason: result.reason || ''
        });
    } catch (error) {
        res.status(500).json({ success: false, valid: false, message: error.message });
    }
};

export const getBestCoupon = (req, res) => {
    try {
        const { subtotal, phone } = req.query;
        let itemCategories = [];
        try { itemCategories = req.query.itemCategories ? JSON.parse(req.query.itemCategories) : []; } catch(e){}
        const deals = DataLayer.read(req.storeId, 'deals') || [];
        
        const validAutoApplyDeals = deals.filter(d => d.autoApply)
            .map(d => _validateSingleCoupon(d, subtotal, phone, itemCategories, req.storeId))
            .filter(r => r.valid)
            .map(r => r.deal);
            
        if (validAutoApplyDeals.length === 0) {
            return res.json({ success: true, deal: null, coupon: null });
        }
        
        let bestDeal = null;
        let maxDiscountValue = -1;
        
        validAutoApplyDeals.forEach(deal => {
            let discountValue = 0;
            if (deal.discountType === 'percentage') {
                discountValue = safeNum(subtotal) * (safeNum(deal.discountPercent) / 100);
                if (deal.maxDiscount) {
                    discountValue = Math.min(discountValue, safeNum(deal.maxDiscount));
                }
            } else if (deal.discountType === 'flat') {
                discountValue = safeNum(deal.flatDiscount);
            }
            
            if (discountValue > maxDiscountValue) {
                maxDiscountValue = discountValue;
                bestDeal = deal;
            }
        });
        
        res.json({ success: true, deal: bestDeal, coupon: bestDeal });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const handleDealsWsMessage = (data, ws, storeId, source) => {
    const deals = DataLayer.read(storeId, 'deals') || [];
    let updated = false;
    
    if (data.action === 'ADD_DEAL' || data.action === 'UPDATE_DEAL') {
        const deal = data.payload;
        const index = deals.findIndex(d => d.id === deal.id);
        if (index !== -1) {
            deals[index] = { ...deals[index], ...deal };
        } else {
            deal.id = deal.id || generateId('deal');
            deals.push(deal);
        }
        updated = true;
    } else if (data.action === 'DELETE_DEAL') {
        const id = data.payload?.id;
        const index = deals.findIndex(d => d.id === id);
        if (index !== -1) {
            deals.splice(index, 1);
            updated = true;
        }
    }
    
    if (updated) {
        DataLayer.writeSync(storeId, 'deals', deals);
        WebSocketHub.broadcastToAll(storeId, { action: 'DEALS_UPDATED', payload: deals });
    }
};
