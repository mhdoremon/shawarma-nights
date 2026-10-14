/**
 * DataLayer — Abstracted JSON file storage per store
 * 
 * Provides read/write operations isolated by storeId.
 * Each store gets its own folder: data/stores/{storeId}/
 * 
 * In-memory cache ensures fast reads.
 * Dirty-write batching prevents excessive disk I/O.
 */

import fs from 'fs';
import path from 'path';
import { MongoClient } from 'mongodb';
import config from '../config/index.js';
import { resolveStoreCapabilities } from '../utils/storeCapabilities.js';

// In-memory cache: { "shawarma": { "menu.json": {...}, "orders.json": [...] } }
const cache = {};

// Dirty flags for write batching: { "shawarma/menu.json": true }
const dirtyFlags = {};

// Write batch interval (ms) — flush dirty data every 2 seconds
const FLUSH_INTERVAL = 2000;

// ─── MongoDB Atlas Engine References ──────────────────────────
let mongoClient = null;
let mongoDb = null;
let isMongoConnected = false;
let lastMongoError = null;

// ─── Helpers ──────────────────────────────────────────────────

function getStorePath(storeId) {
  return path.join(config.STORES_DIR, storeId);
}

function getFilePath(storeId, collection) {
  const fileName = collection.endsWith('.json') ? collection : `${collection}.json`;
  return path.join(getStorePath(storeId), fileName);
}

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// ─── Core Read/Write ──────────────────────────────────────────

/**
 * Read data for a store's collection.
 * Returns from cache if available, otherwise reads from disk.
 */
function read(storeId, collection) {
  const fileName = collection.endsWith('.json') ? collection : `${collection}.json`;

  // Check cache first
  if (cache[storeId] && cache[storeId][fileName] !== undefined) {
    return cache[storeId][fileName];
  }

  // Read from disk
  const filePath = getFilePath(storeId, fileName);
  try {
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(raw);

      // Cache it
      if (!cache[storeId]) cache[storeId] = {};
      cache[storeId][fileName] = data;

      return data;
    }
  } catch (err) {
    console.error(`❌ [DataLayer] Read error: ${storeId}/${fileName}:`, err.message);
  }

  // Return default if exists in template
  const defaultData = config.DEFAULT_STORE_DATA[fileName];
  if (defaultData !== undefined) {
    const cloned = JSON.parse(JSON.stringify(defaultData));
    if (!cache[storeId]) cache[storeId] = {};
    cache[storeId][fileName] = cloned;
    return cloned;
  }

  return null;
}

/**
 * Write data for a store's collection.
 * Updates cache immediately, marks dirty for batched disk write.
 */
function write(storeId, collection, data) {
  const fileName = collection.endsWith('.json') ? collection : `${collection}.json`;

  // Update cache
  if (!cache[storeId]) cache[storeId] = {};
  cache[storeId][fileName] = data;

  // Persist to MongoDB Atlas if connected
  persistToMongo(storeId, fileName, data);

  // Mark dirty for batch flush
  dirtyFlags[`${storeId}/${fileName}`] = true;
}

/**
 * Write data immediately to disk (bypasses batch).
 * Use for critical operations like order placement.
 */
function writeSync(storeId, collection, data) {
  const fileName = collection.endsWith('.json') ? collection : `${collection}.json`;
  const filePath = getFilePath(storeId, fileName);

  // Ensure directory exists
  ensureDir(getStorePath(storeId));

  // Update cache
  if (!cache[storeId]) cache[storeId] = {};
  cache[storeId][fileName] = data;

  // Persist to MongoDB Atlas if connected
  persistToMongo(storeId, fileName, data);

  // Write to disk immediately
  try {
    const tmpPath = filePath + '.tmp';
    fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tmpPath, filePath);
    delete dirtyFlags[`${storeId}/${fileName}`];
  } catch (err) {
    console.error(`❌ [DataLayer] WriteSync error: ${storeId}/${fileName}:`, err.message);
  }
}

/**
 * Flush all dirty data to disk.
 * Called periodically by the flush interval.
 */
function flushDirty() {
  const keys = Object.keys(dirtyFlags);
  if (keys.length === 0) return;

  for (const key of keys) {
    const [storeId, fileName] = key.split('/');
    const data = cache[storeId]?.[fileName];
    if (data === undefined) {
      delete dirtyFlags[key];
      continue;
    }

    const filePath = getFilePath(storeId, fileName);
    try {
      ensureDir(getStorePath(storeId));
      const tmpPath = filePath + '.tmp';
    fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tmpPath, filePath);
      delete dirtyFlags[key];
    } catch (err) {
      console.error(`❌ [DataLayer] Flush error: ${key}:`, err.message);
    }
  }

  if (keys.length > 0) {
    console.log(`💾 [DataLayer] Flushed ${keys.length} file(s) to disk`);
  }
}

// ─── Store Lifecycle ──────────────────────────────────────────

/**
 * Initialize a new store's data directory with default files.
 */
function initStore(storeId, storeConfig = {}) {
  const storeDir = getStorePath(storeId);
  ensureDir(storeDir);
  ensureDir(path.join(storeDir, 'uploads'));

  // Write config
  const configData = { ...JSON.parse(JSON.stringify(config.DEFAULT_STORE_CONFIG)), ...storeConfig, storeId };
  writeSync(storeId, 'config.json', configData);

  // Write default data files
  for (const [fileName, defaultData] of Object.entries(config.DEFAULT_STORE_DATA)) {
    const filePath = path.join(storeDir, fileName);
    if (!fs.existsSync(filePath)) {
      writeSync(storeId, fileName, JSON.parse(JSON.stringify(defaultData)));
    }
  }

  console.log(`🏪 [DataLayer] Store "${storeId}" initialized at ${storeDir}`);
  return configData;
}

/**
 * Check if a store exists (has data directory).
 */
function storeExists(storeId) {
  return fs.existsSync(getStorePath(storeId));
}

/**
 * Get store config with resolved capabilities injected.
 */
function getStoreConfig(storeId) {
  let cfg = read(storeId, 'config.json');
  if (!cfg && storeId) {
    try {
      const dukandarsPath = path.join(config.DATA_DIR, 'dukandars.json');
      if (fs.existsSync(dukandarsPath)) {
        const raw = fs.readFileSync(dukandarsPath, 'utf-8');
        const dData = JSON.parse(raw);
        const list = Array.isArray(dData) ? dData : (dData.dukandars || []);
        const sClean = String(storeId).toLowerCase().trim();
        const d = list.find(item => 
          String(item.dukanId || '').toLowerCase() === sClean ||
          String(item.storeSlug || '').toLowerCase() === sClean
        );
        if (d) {
          cfg = {
            id: String(d.dukanId).toLowerCase(),
            slug: d.storeSlug || String(d.dukanId).toLowerCase(),
            name: d.dukanName,
            status: d.status || 'pending_review',
            type: d.businessType || 'retail',
            vertical: d.businessType === 'restaurant' ? 'food' : (d.businessType || 'retail'),
            owner: {
              name: d.ownerName,
              fatherName: d.fatherName,
              dob: d.dob,
              gender: d.gender,
              phone: d.phone,
              username: d.username,
              password: d.password,
              token: d.token
            },
            settings: {
              storeName: d.dukanName,
              name: d.dukanName,
              phone: d.phone,
              isOpen: false,
              timing: 'Setup in progress',
              freeDeliveryThreshold: 350
            }
          };
        }
      }
    } catch {}
  }

  if (!cfg) return null;
  return {
    ...cfg,
    capabilities: resolveStoreCapabilities(storeId, cfg)
  };
}

/**
 * Get full store data package with resolved capabilities injected.
 */
function getStoreData(storeId) {
  const cfg = getStoreConfig(storeId);
  if (!cfg) return null;
  return {
    ...cfg,
    capabilities: resolveStoreCapabilities(storeId, cfg)
  };
}

/**
 * Update store config (merge).
 */
function updateStoreConfig(storeId, updates) {
  const current = getStoreConfig(storeId) || {};
  const merged = deepMerge(current, updates);
  merged.updatedAt = new Date().toISOString();
  writeSync(storeId, 'config.json', merged);
  return merged;
}

/**
 * List all store IDs.
 */
function listStoreIds() {
  ensureDir(config.STORES_DIR);
  try {
    return fs.readdirSync(config.STORES_DIR, { withFileTypes: true })
      .filter(d => d.isDirectory() && !d.name.startsWith('_'))
      .map(d => d.name);
  } catch {
    return [];
  }
}

/**
 * Delete a store and all its data.
 */
function deleteStore(storeId) {
  const storeDir = getStorePath(storeId);
  if (fs.existsSync(storeDir)) {
    fs.rmSync(storeDir, { recursive: true, force: true });
  }
  delete cache[storeId];
  // Clean dirty flags
  for (const key of Object.keys(dirtyFlags)) {
    if (key.startsWith(`${storeId}/`)) delete dirtyFlags[key];
  }
  console.log(`🗑️ [DataLayer] Store "${storeId}" deleted`);
}

/**
 * Get store's upload directory path.
 */
function getUploadsDir(storeId) {
  const dir = path.join(getStorePath(storeId), 'uploads');
  ensureDir(dir);
  return dir;
}

/**
 * Clear in-memory cache for a store (force re-read from disk).
 */
function invalidateCache(storeId) {
  if (storeId) {
    delete cache[storeId];
  } else {
    Object.keys(cache).forEach(k => delete cache[k]);
  }
}

// ─── Deep Merge Utility ──────────────────────────────────────

function deepMerge(target, source) {
  const result = { ...target };
  if (!source) return result;
  for (const key of Object.keys(source)) {
    if (
      source[key] && typeof source[key] === 'object' && !Array.isArray(source[key]) &&
      target[key] && typeof target[key] === 'object' && !Array.isArray(target[key])
    ) {
      result[key] = deepMerge(target[key], source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}

// ─── Platform Data ───────────────────────────────────────────

/**
 * Read platform-level data (not store-specific).
 */
function readPlatform(fileName) {
  ensureDir(config.PLATFORM_DIR);
  const filePath = path.join(config.PLATFORM_DIR, fileName.endsWith('.json') ? fileName : `${fileName}.json`);
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }
  } catch (err) {
    console.error(`❌ [DataLayer] Platform read error: ${fileName}:`, err.message);
  }
  return null;
}

/**
 * Write platform-level data.
 */
function writePlatform(fileName, data) {
  ensureDir(config.PLATFORM_DIR);
  const cleanName = fileName.endsWith('.json') ? fileName.replace('.json', '') : fileName;
  const filePath = path.join(config.PLATFORM_DIR, `${cleanName}.json`);
  try {
    const tmpPath = filePath + '.tmp';
    fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tmpPath, filePath);
  } catch (err) {
    console.error(`❌ [DataLayer] Platform write error: ${fileName}:`, err.message);
  }
  // Persist to MongoDB Atlas platform collection
  persistToMongo('platform', cleanName, data);
}

// ─── MongoDB Atlas Cloud Integration ──────────────────────────

/**
 * Persist collection change to MongoDB Atlas in background.
 */
function persistToMongo(storeId, fileName, data) {
  if (!isMongoConnected || !mongoDb) return;
  mongoDb.collection('store_data').updateOne(
    { _id: `${storeId}_${fileName}` },
    { $set: { storeId, collection: fileName, data, updatedAt: new Date().toISOString() } },
    { upsert: true }
  ).catch(err => {
    console.error(`❌ [MongoDB Atlas] Write error (${storeId}/${fileName}):`, err.message);
  });
}

/**
 * Persist unified customer directly to MongoDB cloud collection.
 */
async function persistDirectCustomer(customer) {
  if (!isMongoConnected || !mongoDb) return;
  try {
    const filter = customer.phone 
      ? { phone: customer.phone } 
      : (customer.email ? { email: customer.email.toLowerCase() } : { id: customer.id });
    await mongoDb.collection('unified_customers').updateOne(
      filter,
      { $set: { ...customer, updatedAt: new Date().toISOString() } },
      { upsert: true }
    );
    console.log(`☁️ [MongoDB Atlas] Successfully synced customer (${customer.phone || customer.email}) to cloud.`);
  } catch (err) {
    console.error('❌ [MongoDB Atlas] Customer save error:', err.message);
  }
}

/**
 * Persist dukandar directly to MongoDB cloud collection.
 */
async function persistDirectDukandar(dukandar) {
  if (!isMongoConnected || !mongoDb) return;
  try {
    const filter = dukandar.dukanId 
      ? { dukanId: dukandar.dukanId } 
      : { phone: dukandar.phone };
    await mongoDb.collection('dukandars').updateOne(
      filter,
      { $set: { ...dukandar, updatedAt: new Date().toISOString() } },
      { upsert: true }
    );
    console.log(`☁️ [MongoDB Atlas] Successfully synced dukandar (${dukandar.dukanId}) to cloud.`);
  } catch (err) {
    console.error('❌ [MongoDB Atlas] Dukandar save error:', err.message);
  }
}

/**
 * Sync MongoDB data with local cache & seed if empty.
 */
async function syncMongoData() {
  if (!isMongoConnected || !mongoDb) return;
  try {
    const col = mongoDb.collection('store_data');
    const docs = await col.find({}).toArray();

    if (docs.length > 0) {
      // Populate cache from MongoDB Atlas
      for (const doc of docs) {
        const { storeId, collection: colName, data } = doc;
        if (storeId && colName && data !== undefined) {
          // Handle platform-level collections (customers, dukandars)
          if (storeId === 'platform') {
            if (colName === 'customers' || colName === 'customers.json') {
              const custArr = Array.isArray(data) ? data : (data?.customers || []);
              if (custArr.length > 0) {
                try {
                  const custFile = path.join(process.cwd(), 'server', 'data', 'customers.json');
                  fs.writeFileSync(custFile, JSON.stringify(custArr, null, 2), 'utf-8');
                  const smartCust = path.join(process.cwd(), 'smart-backend', 'data', 'customers.json');
                  fs.writeFileSync(smartCust, JSON.stringify(custArr, null, 2), 'utf-8');
                } catch {}
              }
            } else if (colName === 'dukandars' || colName === 'dukandars.json') {
              const dukanArr = Array.isArray(data) ? data : (data?.dukandars || []);
              if (dukanArr.length > 0) {
                try {
                  const dukanFile = path.join(process.cwd(), 'server', 'data', 'dukandars.json');
                  fs.writeFileSync(dukanFile, JSON.stringify({ dukandars: dukanArr }, null, 2), 'utf-8');
                  const smartDukan = path.join(process.cwd(), 'smart-backend', 'data', 'dukandars.json');
                  fs.writeFileSync(smartDukan, JSON.stringify({ dukandars: dukanArr }, null, 2), 'utf-8');
                } catch {}
              }
            }
            continue;
          }

          // Store-specific files
          const filePath = getFilePath(storeId, colName);
          let localData = null;
          try {
            if (fs.existsSync(filePath)) {
              localData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
            }
          } catch {}

          const localItems = Array.isArray(localData) ? localData : (Array.isArray(localData?.menu) ? localData.menu : []);
          const mongoItems = Array.isArray(data) ? data : (Array.isArray(data?.menu) ? data.menu : []);

          if (localItems.length > mongoItems.length && colName !== 'customers' && colName !== 'customers.json') {
            if (!cache[storeId]) cache[storeId] = {};
            cache[storeId][colName] = localData;
            persistToMongo(storeId, colName, localData);
            console.log(`🚀 [MongoDB Atlas] Local file has ${localItems.length} items > Mongo ${mongoItems.length} items. Synced Mongo Atlas with latest local catalog.`);
            continue;
          }

          if (!cache[storeId]) cache[storeId] = {};
          cache[storeId][colName] = data;

          // Also update local file as persistent offline backup
          try {
            ensureDir(getStorePath(storeId));
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
          } catch {}
        }
      }
      console.log(`📦 [MongoDB Atlas] Loaded ${docs.length} collection document(s) into memory cache.`);
    }

    // Also sync from dedicated collections: unified_customers and dukandars
    try {
      const custFile = path.join(process.cwd(), 'server', 'data', 'customers.json');
      const smartCust = path.join(process.cwd(), 'smart-backend', 'data', 'customers.json');
      let existing = [];
      try { if (fs.existsSync(custFile)) existing = JSON.parse(fs.readFileSync(custFile, 'utf-8')); } catch {}
      if (!Array.isArray(existing)) existing = [];

      const uCusts = await mongoDb.collection('unified_customers').find({}).toArray();
      if (uCusts && uCusts.length > 0) {
        for (const uc of uCusts) {
          const { _id, ...clean } = uc;
          const match = existing.findIndex(c => (clean.phone && c.phone === clean.phone) || (clean.email && c.email === clean.email));
          if (match !== -1) existing[match] = { ...existing[match], ...clean };
          else existing.push(clean);
        }
      }

      // Upsert full merged list into MongoDB Atlas
      for (const ec of existing) {
        const filter = ec.phone ? { phone: ec.phone } : (ec.email ? { email: ec.email.toLowerCase() } : { id: ec.id });
        if (filter) {
          await mongoDb.collection('unified_customers').updateOne(
            filter,
            { $set: { ...ec, updatedAt: new Date().toISOString() } },
            { upsert: true }
          );
        }
      }

      fs.writeFileSync(custFile, JSON.stringify(existing, null, 2), 'utf-8');
      try { fs.writeFileSync(smartCust, JSON.stringify(existing, null, 2), 'utf-8'); } catch {}
      console.log(`📦 [MongoDB Atlas] 2-way synced ${existing.length} customer(s) with unified_customers collection.`);
    } catch (err) {
      console.error('Mongo unified_customers sync error:', err.message);
    }

    try {
      const dukanFile = path.join(process.cwd(), 'server', 'data', 'dukandars.json');
      const smartDukan = path.join(process.cwd(), 'smart-backend', 'data', 'dukandars.json');
      let existingD = [];
      try { if (fs.existsSync(dukanFile)) existingD = JSON.parse(fs.readFileSync(dukanFile, 'utf-8'))?.dukandars || []; } catch {}
      if (!Array.isArray(existingD)) existingD = [];

      const uDukans = await mongoDb.collection('dukandars').find({}).toArray();
      if (uDukans && uDukans.length > 0) {
        for (const ud of uDukans) {
          const { _id, ...clean } = ud;
          const match = existingD.findIndex(d => clean.dukanId && d.dukanId === clean.dukanId);
          if (match !== -1) existingD[match] = { ...existingD[match], ...clean };
          else existingD.push(clean);
        }
      }

      // Upsert full merged list into MongoDB Atlas
      for (const ed of existingD) {
        const filter = ed.dukanId ? { dukanId: ed.dukanId } : { phone: ed.phone };
        if (filter) {
          await mongoDb.collection('dukandars').updateOne(
            filter,
            { $set: { ...ed, updatedAt: new Date().toISOString() } },
            { upsert: true }
          );
        }
      }

      fs.writeFileSync(dukanFile, JSON.stringify({ dukandars: existingD }, null, 2), 'utf-8');
      try { fs.writeFileSync(smartDukan, JSON.stringify({ dukandars: existingD }, null, 2), 'utf-8'); } catch {}
      console.log(`📦 [MongoDB Atlas] 2-way synced ${existingD.length} dukandar(s) with dukandars collection.`);
    } catch (err) {
      console.error('Mongo dukandars sync error:', err.message);
    }

    if (docs.length === 0) {
      // MongoDB is completely fresh — seed all local stores into MongoDB Atlas!
      console.log('🌱 [MongoDB Atlas] Empty database detected. Seeding local files into MongoDB Atlas...');
      const localStoreIds = listStoreIds();
      let seeded = 0;

      for (const storeId of localStoreIds) {
        const storeDir = getStorePath(storeId);
        if (!fs.existsSync(storeDir)) continue;

        const files = fs.readdirSync(storeDir).filter(f => f.endsWith('.json'));
        for (const f of files) {
          try {
            const content = JSON.parse(fs.readFileSync(path.join(storeDir, f), 'utf-8'));
            await col.updateOne(
              { _id: `${storeId}_${f}` },
              { $set: { storeId, collection: f, data: content, updatedAt: new Date().toISOString() } },
              { upsert: true }
            );
            if (!cache[storeId]) cache[storeId] = {};
            cache[storeId][f] = content;
            seeded++;
          } catch {}
        }
      }
      console.log(`✨ [MongoDB Atlas] Successfully seeded ${seeded} collection(s) to MongoDB Atlas.`);
    }
  } catch (err) {
    console.error('⚠️ [MongoDB Atlas] Sync error:', err.message);
  }
}

/**
 * Initialize MongoDB connection if MONGODB_URI is provided.
 * Seamlessly syncs between MongoDB Atlas and in-memory cache.
 */
async function initMongo() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.log('🍃 [DataLayer] MONGODB_URI not set — operating in High-Speed Local JSON Storage mode.');
    return false;
  }

  try {
    console.log('🍃 [MongoDB Atlas] Connecting to cluster...');
    mongoClient = new MongoClient(uri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000
    });
    await mongoClient.connect();

    // Extract database name from URI or default to 'churuone'
    let dbName = 'churuone';
    try {
      const parsed = new URL(uri);
      const extracted = parsed.pathname.replace(/^\//, '');
      if (extracted) dbName = extracted;
    } catch {}

    mongoDb = mongoClient.db(dbName);
    isMongoConnected = true;
    console.log(`✅ [MongoDB Atlas] Connected successfully to database: "${dbName}"`);

    // Sync data from MongoDB into cache, or seed local data into MongoDB
    await syncMongoData();
    return true;
  } catch (err) {
    lastMongoError = err.message;
    console.error('❌ [MongoDB Atlas] Connection failed:', err.message);
    console.warn('⚠️ [DataLayer] Operating in fallback local storage mode.');
    isMongoConnected = false;
    return false;
  }
}

/**
 * Purge all customer and dukandar login data from MongoDB Atlas, Cache, and Disk.
 */
async function purgeAllLoginData() {
  console.log('🧹 [DataLayer] Executing complete purge of all login databases...');

  // 1. Wipe in-memory cache for all stores
  for (const sId of Object.keys(cache)) {
    if (cache[sId]) {
      cache[sId]['customers.json'] = [];
      cache[sId]['customers'] = [];
    }
  }

  // 2. Wipe MongoDB Atlas documents if connected
  if (isMongoConnected && mongoDb) {
    try {
      const col = mongoDb.collection('store_data');
      const res1 = await col.deleteMany({
        $or: [
          { collection: 'customers.json' },
          { collection: 'customers' },
          { _id: { $regex: /customer/i } }
        ]
      });
      console.log(`🗑️ [MongoDB Atlas] Deleted ${res1.deletedCount} customer documents from store_data`);
    } catch (e) {
      console.error('Mongo delete error in store_data:', e.message);
    }

    try {
      await mongoDb.collection('customers').deleteMany({});
      console.log('🗑️ [MongoDB Atlas] Emptied "customers" collection');
    } catch (e) {}

    try {
      await mongoDb.collection('unified_customers').deleteMany({});
    } catch (e) {}

    try {
      const col = mongoDb.collection('store_data');
      await col.deleteMany({
        $or: [
          { collection: 'dukandars.json' },
          { collection: 'dukandar' },
          { _id: { $regex: /dukan/i } }
        ]
      });
    } catch (e) {}

    try {
      await mongoDb.collection('dukandars').deleteMany({});
    } catch (e) {}
  }

  // 3. Wipe disk files
  try {
    const custFile = path.join(config.DATA_DIR, 'customers.json');
    fs.writeFileSync(custFile, JSON.stringify([], null, 2), 'utf-8');
  } catch {}

  try {
    const usersFile = path.join(config.DATA_DIR, 'users.json');
    fs.writeFileSync(usersFile, JSON.stringify([], null, 2), 'utf-8');
  } catch {}

  try {
    const dFile = path.join(config.DATA_DIR, 'dukandars.json');
    fs.writeFileSync(dFile, JSON.stringify({ dukandars: [] }, null, 2), 'utf-8');
  } catch {}

  try {
    const platformCust = path.join(config.PLATFORM_DIR, 'customers.json');
    if (fs.existsSync(platformCust)) {
      fs.writeFileSync(platformCust, JSON.stringify({ customers: [] }, null, 2), 'utf-8');
    }
  } catch {}

  const stores = listStoreIds();
  for (const sId of stores) {
    try {
      const sFile = getFilePath(sId, 'customers.json');
      fs.writeFileSync(sFile, JSON.stringify([], null, 2), 'utf-8');
      if (cache[sId]) cache[sId]['customers.json'] = [];
    } catch {}
  }

  return { success: true, message: 'All login data cleanly purged from MongoDB Atlas, Cache, and Disk!' };
}

// ─── Start Flush Timer ────────────────────────────────────────
let flushTimer = null;

function startFlushTimer() {
  if (flushTimer) return;
  flushTimer = setInterval(flushDirty, FLUSH_INTERVAL);
  // Don't prevent process exit
  if (flushTimer.unref) flushTimer.unref();
}

function stopFlushTimer() {
  if (flushTimer) {
    clearInterval(flushTimer);
    flushTimer = null;
  }
  // Final flush
  flushDirty();
}

// Auto-start
startFlushTimer();

// Graceful shutdown
process.on('SIGINT', () => { stopFlushTimer(); process.exit(0); });
process.on('SIGTERM', () => { stopFlushTimer(); process.exit(0); });

// ─── Export ───────────────────────────────────────────────────

const DataLayer = {
  read,
  write,
  writeSync,
  flushDirty,
  initStore,
  storeExists,
  getStoreConfig,
  getStoreData,
  updateStoreConfig,
  listStoreIds,
  deleteStore,
  getUploadsDir,
  getStorePath,
  invalidateCache,
  readPlatform,
  writePlatform,
  persistDirectCustomer,
  persistDirectDukandar,
  purgeAllLoginData,
  startFlushTimer,
  stopFlushTimer,
  initMongo,
  isMongoReady: () => isMongoConnected,
  getMongoError: () => lastMongoError
};

export default DataLayer;
