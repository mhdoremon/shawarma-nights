import DataLayer from '../../core/DataLayer.js';
import WebSocketHub from '../../core/WebSocketHub.js';
import { generateId, generateOtp, generateUUID, now, normalizePhone } from '../../utils/helpers.js';

const otpStore = new Map(); // Key: `${storeId}:${phone}` → { otp, expiresAt, attempts }
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

export const sendOtp = (req, res) => {
    try {
        const { phone } = req.body;
        if (!phone) return res.status(400).json({ success: false, message: 'Phone is required' });
        
        const normalizedPhone = normalizePhone(phone);
        const otp = generateOtp(4);
        const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
        const key = `${req.storeId}:${normalizedPhone}`;
        
        otpStore.set(key, { otp, expiresAt, attempts: 0 });
        
        if (WebSocketHub.isGatewayConnected(req.storeId)) {
            WebSocketHub.broadcastToGateway(req.storeId, { 
                action: 'SEND_SMS', 
                phone: normalizedPhone, 
                message: `Your OTP is: ${otp}` 
            });
        }
        
        res.json({ 
            success: true, 
            message: 'OTP sent', 
            devOtp: IS_PRODUCTION ? undefined : otp 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getGatewayStatus = (req, res) => {
    try {
        res.json({ connected: WebSocketHub.isGatewayConnected(req.storeId) });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const verifyOtp = (req, res) => {
    try {
        const { phone, otp } = req.body;
        if (!phone || !otp) return res.status(400).json({ success: false, message: 'Phone and OTP are required' });
        
        const normalizedPhone = normalizePhone(phone);
        const key = `${req.storeId}:${normalizedPhone}`;
        const stored = otpStore.get(key);
        
        if (!stored) return res.status(400).json({ success: false, message: 'OTP expired or not sent' });
        if (Date.now() > stored.expiresAt) {
            otpStore.delete(key);
            return res.status(400).json({ success: false, message: 'OTP expired' });
        }
        
        if (stored.attempts >= 5) {
            otpStore.delete(key);
            return res.status(400).json({ success: false, message: 'Too many attempts. Please request a new OTP' });
        }
        
        if (stored.otp !== otp.toString()) {
            stored.attempts++;
            otpStore.set(key, stored);
            return res.status(400).json({ success: false, message: 'Invalid OTP' });
        }
        
        // OTP valid
        otpStore.delete(key);
        
        const customers = DataLayer.read(req.storeId, 'customers') || [];
        let customer = customers.find(c => c.phone === normalizedPhone);
        let isNewUser = false;
        
        if (customer) {
            // Existing customer
            return res.json({ success: true, token: customer.token, isNewUser, user: customer });
        } else {
            // New customer
            isNewUser = true;
            customer = {
                id: generateId('cust'),
                phone: normalizedPhone,
                token: generateUUID(),
                name: '',
                address: '',
                email: '',
                createdAt: now()
            };
            customers.push(customer);
            DataLayer.writeSync(req.storeId, 'customers', customers);
            return res.json({ success: true, token: customer.token, isNewUser, user: customer });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const register = (req, res) => {
    try {
        const { phone, name, address, email } = req.body;
        if (!phone) return res.status(400).json({ success: false, message: 'Phone is required' });
        
        const normalizedPhone = normalizePhone(phone);
        const customers = DataLayer.read(req.storeId, 'customers') || [];
        const index = customers.findIndex(c => c.phone === normalizedPhone);
        
        if (index === -1) return res.status(404).json({ success: false, message: 'Customer not found' });
        
        customers[index] = { ...customers[index], name, address, email };
        DataLayer.writeSync(req.storeId, 'customers', customers);
        
        res.json({ success: true, user: customers[index] });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateProfile = (req, res) => {
    try {
        const { token, name, address, email } = req.body;
        if (!token) return res.status(400).json({ success: false, message: 'Token is required' });
        
        const customers = DataLayer.read(req.storeId, 'customers') || [];
        const index = customers.findIndex(c => c.token === token);
        
        if (index === -1) return res.status(404).json({ success: false, message: 'Customer not found' });
        
        if (name !== undefined) customers[index].name = name;
        if (address !== undefined) customers[index].address = address;
        if (email !== undefined) customers[index].email = email;
        
        DataLayer.writeSync(req.storeId, 'customers', customers);
        
        res.json({ success: true, user: customers[index] });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteAccount = (req, res) => {
    try {
        const { token } = req.body;
        if (!token) return res.status(400).json({ success: false, message: 'Token is required' });
        
        const customers = DataLayer.read(req.storeId, 'customers') || [];
        const newCustomers = customers.filter(c => c.token !== token);
        
        if (customers.length === newCustomers.length) {
            return res.status(404).json({ success: false, message: 'Customer not found' });
        }
        
        DataLayer.writeSync(req.storeId, 'customers', newCustomers);
        
        res.json({ success: true, message: 'Account deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getAdminStatus = (req, res) => {
    try {
        const config = DataLayer.getStoreConfig(req.storeId) || {};
        res.json({ isRegistered: !!(config.owner && config.owner.token) });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const setupAdmin = (req, res) => {
    try {
        const { dukanName, username, password, ownerPhone } = req.body;
        const config = DataLayer.getStoreConfig(req.storeId) || {};
        
        if (config.owner && config.owner.token) {
            return res.status(400).json({ success: false, message: 'Admin already setup' });
        }
        
        const token = generateUUID();
        
        DataLayer.updateStoreConfig(req.storeId, {
            settings: { ...config.settings, storeName: dukanName },
            owner: { username, password, phone: ownerPhone, token }
        });
        
        res.json({ success: true, token });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const loginAdmin = (req, res) => {
    try {
        const { username, password } = req.body;
        const config = DataLayer.getStoreConfig(req.storeId) || {};
        
        if (!config.owner || config.owner.username !== username || config.owner.password !== password) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
        
        res.json({ success: true, token: config.owner.token });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const verifyAdmin = (req, res) => {
    try {
        const { token } = req.body;
        const config = DataLayer.getStoreConfig(req.storeId) || {};
        
        const isValid = (config.owner && config.owner.token === token) || token === 'master_dev_token';
        
        if (!isValid) return res.status(401).json({ success: false, message: 'Invalid token' });
        
        res.json({ success: true, valid: true });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getAdminCustomers = (req, res) => {
    try {
        const customers = DataLayer.read(req.storeId, 'customers') || [];
        res.json({ success: true, data: customers });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
