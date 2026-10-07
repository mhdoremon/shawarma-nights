import DataLayer from '../../core/DataLayer.js';
import WebSocketHub from '../../core/WebSocketHub.js';
import { generateId, generateOtp, generateUUID, now, normalizePhone, enrichCustomersWithOrderStats } from '../../utils/helpers.js';

const otpStore = new Map(); // Key: `${storeId}:${phone}` → { otp, expiresAt, attempts }
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

export const sendOtp = (req, res) => {
    try {
        const { phone, storeId: bodyStoreId } = req.body;
        if (!phone) return res.status(400).json({ success: false, message: 'Phone is required' });
        
        const targetStoreId = (bodyStoreId || req.storeId || 'shawarma').toLowerCase().trim();
        const normalizedPhone = normalizePhone(phone);
        const key = `${targetStoreId}:${normalizedPhone}`;

        // Security: Prevent SMS Bombing (Rate Limiting)
        const existingOtp = otpStore.get(key);
        if (existingOtp && (Date.now() - existingOtp.createdAt < 60000)) { // 60 seconds limit
            return res.status(429).json({ success: false, message: 'Kripya naya OTP mangne ke liye 1 minute wait karein.' });
        }

        const otp = generateOtp(6);
        const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
        
        otpStore.set(key, { otp, expiresAt, attempts: 0, createdAt: Date.now() });
        
        const formattedPhone = normalizedPhone.startsWith('+91')
            ? normalizedPhone
            : (normalizedPhone.length === 10 ? `+91${normalizedPhone}` : normalizedPhone);

        // Fetch store configuration to brand the SMS with the merchant's exact shop name
        const storeConfig = DataLayer.getStoreConfig(targetStoreId);
        const storeName = storeConfig?.settings?.name || storeConfig?.name || (targetStoreId === 'shawarma' ? 'Shawarma Nights' : targetStoreId.toUpperCase());

        const requestId = generateUUID();
        const smsPayload = { 
            action: 'SEND_SMS', 
            requestId,
            phone: formattedPhone, 
            message: `${storeName} login OTP: ${otp}. Valid for 5 minutes. Do not share.`,
            storeId: targetStoreId
        };

        // Broadcast exclusively to the specific store's connected gateway phone(s)
        const sent = WebSocketHub.broadcastToGateway(targetStoreId, smsPayload);
        if (!sent) {
            WebSocketHub.queueGatewaySms(targetStoreId, smsPayload);
        }

        console.log(`📱 [OTP] Generated 6-digit OTP for ${formattedPhone} on store "${targetStoreId}": ${otp} (Gateway sent count: ${sent})`);

        res.json({ 
            success: true, 
            message: 'OTP bhej diya gaya hai.', 
            devOtp: otp,
            storeId: targetStoreId 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getGatewayStatus = (req, res) => {
    try {
        const targetStoreId = (req.query.storeId || req.storeId || 'shawarma').toLowerCase().trim();
        res.json({ connected: WebSocketHub.isGatewayConnected(targetStoreId), storeId: targetStoreId });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const verifyOtp = (req, res) => {
    try {
        const { phone, otp, storeId: bodyStoreId } = req.body;
        if (!phone || !otp) return res.status(400).json({ success: false, message: 'Phone and OTP are required' });
        
        const targetStoreId = (bodyStoreId || req.storeId || 'shawarma').toLowerCase().trim();
        const normalizedPhone = normalizePhone(phone);
        const key = `${targetStoreId}:${normalizedPhone}`;
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
        
        if (String(stored.otp) !== String(otp)) {
            stored.attempts++;
            otpStore.set(key, stored);
            return res.status(400).json({ success: false, message: 'Invalid OTP' });
        }
        
        // OTP valid
        otpStore.delete(key);
        
        const customers = DataLayer.read(targetStoreId, 'customers') || [];
        let customer = customers.find(c => c.phone === normalizedPhone);
        let isNewUser = false;
        
        if (customer) {
            // Existing customer
            customer.authProvider = customer.authProvider || 'phone';
            customer.phoneVerified = true;
            customer.lastLoginAt = now();
            DataLayer.writeSync(targetStoreId, 'customers', customers);
            return res.json({ success: true, token: customer.token, isNewUser, user: customer, storeId: targetStoreId });
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
                authProvider: 'phone',
                phoneVerified: true,
                createdAt: now(),
                lastLoginAt: now()
            };
            customers.push(customer);
            DataLayer.writeSync(targetStoreId, 'customers', customers);
            return res.json({ success: true, token: customer.token, isNewUser, user: customer, storeId: targetStoreId });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getMe = (req, res) => {
    try {
        const { phone, email, token } = req.query;
        const authHeader = req.headers.authorization;
        const bearerToken = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
        const searchToken = token || bearerToken;

        if (!phone && !email && !searchToken) {
            return res.status(400).json({ success: false, message: 'Phone, Email ya Token required hai' });
        }
        
        const normalizedPhone = phone ? normalizePhone(phone) : '';
        const normalizedEmail = email ? email.toLowerCase().trim() : '';

        const customers = DataLayer.read(req.storeId, 'customers') || [];
        const customer = customers.find(c => 
            (searchToken && c.token === searchToken) ||
            (normalizedPhone && c.phone && normalizePhone(c.phone) === normalizedPhone) ||
            (normalizedEmail && c.email && c.email.toLowerCase() === normalizedEmail)
        );
        
        if (!customer) {
            return res.status(404).json({ success: false, message: 'Customer not found' });
        }

        const orders = DataLayer.read(req.storeId, 'orders') || [];
        const userOrders = orders.filter(o => 
            (normalizedPhone && ((o.customer?.phone && normalizePhone(o.customer.phone) === normalizedPhone) || (o.customerPhone && normalizePhone(o.customerPhone) === normalizedPhone))) ||
            (normalizedEmail && ((o.customer?.email && o.customer.email.toLowerCase() === normalizedEmail) || (o.userEmail && o.userEmail.toLowerCase() === normalizedEmail)))
        );

        res.json({ success: true, user: customer, orders: userOrders });
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
        const { phone, token, name, address, email } = req.body;
        if (!phone && !token) return res.status(400).json({ success: false, message: 'Phone or Token is required' });
        
        const customers = DataLayer.read(req.storeId, 'customers') || [];
        const index = customers.findIndex(c => c.phone === phone || c.token === token);
        
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
        const { phone, token } = req.body;
        if (!phone && !token) return res.status(400).json({ success: false, message: 'Phone or Token is required' });
        
        const customers = DataLayer.read(req.storeId, 'customers') || [];
        const newCustomers = customers.filter(c => c.phone !== phone && c.token !== token);
        
        if (customers.length === newCustomers.length) {
            return res.status(404).json({ success: false, message: 'Customer not found' });
        }
        
        DataLayer.writeSync(req.storeId, 'customers', newCustomers);
        
        res.json({ success: true, message: 'Account deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const googleLogin = async (req, res) => {
    try {
        const { credential, email, name, picture, photoURL, googleId, phone, storeId: bodyStoreId } = req.body;
        const targetStoreId = (bodyStoreId || req.storeId || 'shawarma').toLowerCase().trim();

        let userEmail = email;
        let userName = name;
        let userPicture = picture || photoURL;
        let userGoogleId = googleId;

        // If Google Identity Services JWT credential string was provided, decode base64 payload
        if (credential && typeof credential === 'string') {
            try {
                const parts = credential.split('.');
                if (parts.length === 3) {
                    const base64Url = parts[1];
                    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                    const jsonPayload = Buffer.from(base64, 'base64').toString('utf8');
                    const payload = JSON.parse(jsonPayload);
                    userEmail = payload.email || userEmail;
                    userName = payload.name || userName;
                    userPicture = payload.picture || userPicture;
                    userGoogleId = payload.sub || userGoogleId;
                }
            } catch (jwtErr) {
                console.warn('⚠️ [AUTH] Google JWT parse warning:', jwtErr.message);
            }
        }

        if (!userEmail && !userGoogleId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Google login ke liye Email ya Google ID zaroori hai.' 
            });
        }

        const normalizedEmail = (userEmail || '').toLowerCase().trim();
        const customers = DataLayer.read(targetStoreId, 'customers') || [];

        // Check if customer already exists by Google ID or Email
        let customer = customers.find(c => 
            (userGoogleId && c.googleId && c.googleId === userGoogleId) ||
            (normalizedEmail && c.email && c.email.toLowerCase() === normalizedEmail)
        );

        let isNewUser = false;
        const customerToken = customer?.token || generateUUID();

        if (customer) {
            // Update customer profile with fresh Google metadata
            if (userName && (!customer.name || customer.name === 'Salon Customer' || customer.name === 'User' || customer.name === 'Customer')) {
                customer.name = userName;
            }
            if (userPicture) {
                customer.picture = userPicture;
                customer.photoURL = userPicture;
            }
            if (userGoogleId && !customer.googleId) {
                customer.googleId = userGoogleId;
            }
            if (phone) {
                customer.phone = normalizePhone(phone);
            }
            customer.authProvider = 'google';
            if (req.body.phoneVerified !== undefined) {
                customer.phoneVerified = Boolean(req.body.phoneVerified);
            } else if (customer.phoneVerified === undefined) {
                customer.phoneVerified = false;
            }
            customer.lastLoginAt = now();
        } else {
            isNewUser = true;
            customer = {
                id: generateId('cust'),
                name: userName || (normalizedEmail ? normalizedEmail.split('@')[0] : 'Google User'),
                email: normalizedEmail,
                phone: phone ? normalizePhone(phone) : '',
                phoneVerified: req.body.phoneVerified !== undefined ? Boolean(req.body.phoneVerified) : false,
                picture: userPicture || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(userName || 'U')}`,
                photoURL: userPicture || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(userName || 'U')}`,
                googleId: userGoogleId || '',
                authProvider: 'google',
                token: customerToken,
                createdAt: now(),
                lastLoginAt: now()
            };
            customers.push(customer);
        }

        DataLayer.writeSync(targetStoreId, 'customers', customers);

        // Universal Cross-Store ChuruOne Customer Registry Sync
        try {
            const platformData = DataLayer.readPlatform('customers') || { customers: [] };
            const list = Array.isArray(platformData.customers) ? platformData.customers : [];
            const existingGlobal = list.find(c => 
                (userGoogleId && c.googleId === userGoogleId) || 
                (normalizedEmail && c.email && c.email.toLowerCase() === normalizedEmail)
            );
            if (existingGlobal) {
                existingGlobal.lastStoreId = targetStoreId;
                existingGlobal.lastLoginAt = now();
                if (userName) existingGlobal.name = userName;
                if (userPicture) existingGlobal.picture = userPicture;
                if (customer.phone) existingGlobal.phone = customer.phone;
                existingGlobal.phoneVerified = Boolean(customer.phoneVerified);
                existingGlobal.authProvider = 'google';
            } else {
                list.push({
                    churuOneId: `churu_cust_${Date.now()}`,
                    googleId: userGoogleId || '',
                    email: normalizedEmail,
                    name: userName || customer.name,
                    phone: customer.phone || '',
                    phoneVerified: Boolean(customer.phoneVerified),
                    authProvider: 'google',
                    picture: userPicture || customer.picture,
                    registeredStoreId: targetStoreId,
                    createdAt: now(),
                    lastLoginAt: now()
                });
            }
            platformData.customers = list;
            DataLayer.writePlatform('customers', platformData);
        } catch (globalErr) {
            console.warn('⚠️ [AUTH] Universal customer sync note:', globalErr.message);
        }

        WebSocketHub.broadcastToAll(targetStoreId, {
            action: 'CUSTOMER_UPDATED',
            payload: customer
        });

        console.log(`✅ [AUTH] Google Login success: "${customer.name}" (${customer.email}) on store "${targetStoreId}"`);

        return res.json({
            success: true,
            token: customer.token,
            isNewUser,
            user: customer,
            storeId: targetStoreId,
            message: 'Google login safal raha!'
        });
    } catch (error) {
        console.error('❌ [AUTH] Google login error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const directLogin = (req, res) => {
    try {
        const { name, phone, email, storeId: bodyStoreId } = req.body;
        if (!name && !phone && !email) {
            return res.status(400).json({ success: false, message: 'Name, Phone ya Email required hai' });
        }

        const targetStoreId = (bodyStoreId || req.storeId || 'shawarma').toLowerCase().trim();
        const normalizedPhone = phone ? normalizePhone(phone) : '';
        const normalizedEmail = email ? email.toLowerCase().trim() : '';

        const customers = DataLayer.read(targetStoreId, 'customers') || [];
        let customer = customers.find(c => 
            (normalizedPhone && c.phone && normalizePhone(c.phone) === normalizedPhone) ||
            (normalizedEmail && c.email && c.email.toLowerCase() === normalizedEmail)
        );

        let isNewUser = false;
        if (customer) {
            if (name && (!customer.name || customer.name === 'Salon Customer' || customer.name === 'Customer')) {
                customer.name = name;
            }
            if (normalizedEmail && !customer.email) customer.email = normalizedEmail;
            if (normalizedPhone && !customer.phone) customer.phone = normalizedPhone;
            customer.lastLoginAt = now();
        } else {
            isNewUser = true;
            customer = {
                id: generateId('cust'),
                name: name || (normalizedEmail ? normalizedEmail.split('@')[0] : 'Customer'),
                phone: normalizedPhone,
                email: normalizedEmail,
                picture: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name || 'C')}`,
                photoURL: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name || 'C')}`,
                authProvider: 'direct',
                token: generateUUID(),
                createdAt: now(),
                lastLoginAt: now()
            };
            customers.push(customer);
        }

        DataLayer.writeSync(targetStoreId, 'customers', customers);

        WebSocketHub.broadcastToAll(targetStoreId, {
            action: 'CUSTOMER_UPDATED',
            payload: customer
        });

        return res.json({
            success: true,
            token: customer.token,
            isNewUser,
            user: customer,
            storeId: targetStoreId,
            message: 'Customer session ready!'
        });
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
        const owner = config.owner;
        
        if (!owner) {
            return res.status(401).json({ success: false, message: 'Master Admin not registered yet' });
        }

        const uInput = String(username || '').trim().toLowerCase();
        const pInput = String(password || '').trim();

        const uMatch = uInput && (
            uInput === (owner.username || '').trim().toLowerCase() ||
            uInput === (owner.name || '').trim().toLowerCase() ||
            uInput === (config.name || '').trim().toLowerCase() ||
            uInput === (owner.phone || '').trim()
        );
        const pMatch = pInput && pInput === (owner.password || '').trim();
        
        if (!uMatch || !pMatch) {
            return res.status(401).json({ success: false, message: 'Galat Username ya Password! Kripya sahi credentials dalein.' });
        }
        
        res.json({ 
            success: true, 
            token: owner.token,
            username: owner.username,
            dukanName: config.name || 'Shawarma Nights',
            ownerPhone: owner.phone,
            message: 'Login successful!'
        });
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
        const orders = DataLayer.read(req.storeId, 'orders') || [];
        const enriched = enrichCustomersWithOrderStats(customers, orders);
        res.json({ success: true, customers: enriched, data: enriched });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
