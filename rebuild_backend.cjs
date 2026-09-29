const fs = require('fs');
const path = require('path');

const serverFile = path.join(__dirname, 'server/realtimeServer.js');
let code = fs.readFileSync(serverFile, 'utf8');

// We are going to replace the database loading/saving logic completely.
// Look for `const DB_PATH` and replace it up to the `loadDb();` call.

const newDbLogic = `
const CUSTOMERS_DB_PATH = path.join(__dirname, 'data', 'customers.json');
const DUKANDAR_DB_PATH = path.join(__dirname, 'data', 'dukandar.json');

let customersDb = [];
let dukandarDb = {
  adminAccount: { isRegistered: false },
  menu: [],
  orders: [],
  deals: [],
  reviews: []
};

function loadDb() {
  try {
    if (fs.existsSync(CUSTOMERS_DB_PATH)) {
      customersDb = JSON.parse(fs.readFileSync(CUSTOMERS_DB_PATH, 'utf-8'));
    }
    if (fs.existsSync(DUKANDAR_DB_PATH)) {
      const saved = JSON.parse(fs.readFileSync(DUKANDAR_DB_PATH, 'utf-8'));
      dukandarDb = { ...dukandarDb, ...saved };
    }
    console.log('✅ Databases loaded. Customers:', customersDb.length, 'Orders:', dukandarDb.orders.length);
  } catch (err) {
    console.error('❌ Error loading databases:', err);
  }
}

function saveCustomers() {
  fs.writeFileSync(CUSTOMERS_DB_PATH, JSON.stringify(customersDb, null, 2), 'utf-8');
}

function saveDukandar() {
  fs.writeFileSync(DUKANDAR_DB_PATH, JSON.stringify(dukandarDb, null, 2), 'utf-8');
}

loadDb();
`;

// String replace the old DB initialization blocks.
code = code.replace(/const DB_PATH =[\s\S]*?loadDb\(\);/m, newDbLogic.trim());

// Also remove `const USERS_DB_PATH = ... \n let usersDb = [];` if they exist in the replaced code.
code = code.replace(/const USERS_DB_PATH =[\s\S]*?let usersDb = \[\];/g, '');


// Rewrite references from `db.orders` to `dukandarDb.orders`, `db.menu` to `dukandarDb.menu`, `saveDb()` to `saveDukandar()`.
code = code.replace(/db\.orders/g, 'dukandarDb.orders');
code = code.replace(/db\.menu/g, 'dukandarDb.menu');
code = code.replace(/db\.deals/g, 'dukandarDb.deals');
code = code.replace(/db\.reviews/g, 'dukandarDb.reviews');
code = code.replace(/saveDb\(\)/g, 'saveDukandar()');

// Now rewrite the endpoints we added in the previous session (Auth/Register/Admin).
const newAuthEndpoints = `
// ============================================================
// SECURE USER & ADMIN AUTHENTICATION API
// ============================================================

// Customer: Verify OTP
app.post('/api/auth/verify-otp', (req, res) => {
  const { phone, otp } = req.body;
  const cleanPhone = (phone || '').replace(/\\D/g, '').slice(-10);
  
  if (!cleanPhone || !otp) return res.status(400).json({ success: false, message: 'Invalid Input' });

  const record = otpStore.get(cleanPhone);
  if (!record || record.expiresAt < Date.now() || record.otp !== otp.trim()) {
    return res.status(400).json({ success: false, message: 'OTP expired or incorrect.' });
  }

  // OTP is correct!
  otpStore.delete(cleanPhone);

  const existingCustomer = customersDb.find(u => u.phone === cleanPhone);
  if (existingCustomer) {
    const token = require('crypto').randomUUID();
    return res.json({ success: true, isNewUser: false, token, user: existingCustomer });
  } else {
    const tempToken = require('crypto').randomUUID();
    return res.json({ success: true, isNewUser: true, tempToken, message: 'Please complete registration.' });
  }
});

// Customer: Register
app.post('/api/auth/register', (req, res) => {
  const { phone, name, email, address, tempToken } = req.body;
  if (!phone || !name || !tempToken) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }
  
  const newCustomer = {
    id: 'cust-' + Date.now(),
    name, phone, email, address,
    registeredAt: new Date().toISOString()
  };
  
  customersDb.push(newCustomer);
  saveCustomers();
  
  const token = require('crypto').randomUUID();
  res.json({ success: true, token, user: newCustomer });
});

// Admin: Check Registration Status
app.get('/api/admin/status', (req, res) => {
  res.json({ isRegistered: !!dukandarDb.adminAccount.isRegistered });
});

// Admin: First-Time Setup
app.post('/api/admin/setup', (req, res) => {
  if (dukandarDb.adminAccount.isRegistered) {
    return res.status(403).json({ success: false, message: 'Admin is already registered.' });
  }
  
  const { username, password, ownerPhone } = req.body;
  if (!username || !password || !ownerPhone) {
    return res.status(400).json({ success: false, message: 'All fields required.' });
  }
  
  dukandarDb.adminAccount = {
    isRegistered: true,
    username,
    password, // In a real prod environment, this should be hashed (bcrypt)
    ownerPhone,
    setupAt: new Date().toISOString()
  };
  saveDukandar();
  
  res.json({ success: true, message: 'Master Admin Account created permanently.' });
});

// Admin: Login (Step 1)
app.post('/api/admin/login', (req, res) => {
  if (!dukandarDb.adminAccount.isRegistered) {
    return res.status(400).json({ success: false, message: 'Admin not registered yet.' });
  }

  const { username, password } = req.body;
  const admin = dukandarDb.adminAccount;
  
  if (username === admin.username && password === admin.password) {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore.set(admin.ownerPhone, {
      otp,
      expiresAt: Date.now() + 5 * 60000,
      attempts: 0,
      createdAt: Date.now()
    });
    
    console.log('🔒 Admin 2FA. Sending OTP to Owner:', otp); // Mock sending SMS
    
    res.json({ 
      success: true, 
      requireOtp: true,
      ownerPhonePreview: '******' + admin.ownerPhone.slice(-4),
      message: 'Credentials valid. Check owner mobile for 2FA OTP.'
    });
  } else {
    res.status(401).json({ success: false, message: 'Invalid Admin Credentials' });
  }
});

// Admin: Login Verify (Step 2)
app.post('/api/admin/verify', (req, res) => {
  const { otp } = req.body;
  const admin = dukandarDb.adminAccount;
  const record = otpStore.get(admin.ownerPhone);
  
  if (!record || record.expiresAt < Date.now() || record.otp !== otp) {
    return res.status(401).json({ success: false, message: 'Invalid or Expired 2FA OTP' });
  }
  
  otpStore.delete(admin.ownerPhone);
  const token = require('crypto').randomUUID();
  
  res.json({ 
    success: true, 
    token, 
    user: { id: 'admin-1', role: 'dukandar', name: 'Master Admin' } 
  });
});
`;

// Replace old endpoints we previously injected
code = code.replace(/\/\/ ==*?\n\/\/ SECURE USER & ADMIN AUTHENTICATION API[\s\S]*?\/\/ Gateway health status endpoint/m, newAuthEndpoints + "\n// Gateway health status endpoint");
// Clean up any stray verify-otp that was replaced badly earlier
code = code.replace(/app\.post\('\/api\/auth\/verify-otp'[\s\S]*?\}\);/m, ""); // Let's not double-delete.

fs.writeFileSync(serverFile, code, 'utf8');
console.log('Backend rebuilt successfully!');
