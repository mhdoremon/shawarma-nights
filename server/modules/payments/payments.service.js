import DataLayer from '../../core/DataLayer.js';
import WebSocketHub from '../../core/WebSocketHub.js';
import { safeNum } from '../../utils/helpers.js';

export const getPaymentConfig = (req, res) => {
    try {
        const config = DataLayer.getStoreConfig(req.storeId);
        const paymentConfig = config?.payment || { upiId: '', payeeName: '', codEnabled: true };
        res.json({ success: true, data: paymentConfig });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const initiatePayment = (req, res) => {
    try {
        const { orderId, amount, method } = req.body;
        const config = DataLayer.getStoreConfig(req.storeId);
        const paymentConfig = config?.payment || {};
        
        if (method === 'UPI') {
            const upiId = paymentConfig.upiId || 'test@upi';
            const payeeName = paymentConfig.payeeName || 'Store';
            const upiLink = `upi://pay?pa=${upiId}&pn=${payeeName}&am=${amount}&tn=Order${orderId}`;
            
            res.json({ 
                success: true, 
                paymentId: `pay_${Date.now()}`, 
                upiLink 
            });
        } else {
            res.json({ success: true, paymentId: `pay_${Date.now()}` });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const verifySms = (req, res) => {
    try {
        const { smsText, smsFrom } = req.body;
        
        // Extract amount from SMS text
        const amountMatch = smsText.match(/(?:Rs\.?|INR)\s*(\d+(?:\.\d+)?)/i);
        if (!amountMatch) {
            return res.json({ success: false, message: 'Could not extract amount from SMS' });
        }
        
        const amount = safeNum(amountMatch[1]);
        const orders = DataLayer.read(req.storeId, 'orders') || [];
        
        // Find matching pending order with similar amount
        const match = orders.find(o => 
            o.paymentStatus !== 'paid' && 
            Math.abs(safeNum(o.total) - amount) < 1
        );
        
        if (match) {
            match.paymentStatus = 'paid';
            DataLayer.writeSync(req.storeId, 'orders', orders);
            WebSocketHub.broadcastToAll(req.storeId, { 
                action: 'PAYMENT_VERIFIED', 
                payload: match 
            });
            return res.json({ success: true, orderId: match.id });
        }
        
        res.json({ success: false, message: 'No matching pending order found' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const submitUtr = (req, res) => {
    res.json({ 
        success: false, 
        message: 'Manual UTR entry is disabled. Payments are verified automatically.' 
    });
};

export const getPaymentStatus = (req, res) => {
    try {
        const { orderId } = req.params;
        const orders = DataLayer.read(req.storeId, 'orders') || [];
        const order = orders.find(o => o.id === orderId);
        
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }
        
        res.json({ success: true, status: order.paymentStatus || 'pending' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
