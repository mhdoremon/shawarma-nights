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
import config from '../config/index.js';

// In-memory cache: { "shawarma": { "menu.json": {...}, "orders.json": [...] } }
const cache = {};

// Dirty flags for write batching: { "shawarma/menu.json": true }
const dirtyFlags = {};

// Write batch interval (ms) — flush dirty data every 2 seconds
const FLUSH_INTERVAL = 2000;

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

  // Write to disk immediately
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
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
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
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
 * Get store config.
 */
function getStoreConfig(storeId) {
  return read(storeId, 'config.json');
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
  const filePath = path.join(config.PLATFORM_DIR, fileName.endsWith('.json') ? fileName : `${fileName}.json`);
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error(`❌ [DataLayer] Platform write error: ${fileName}:`, err.message);
  }
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
  updateStoreConfig,
  listStoreIds,
  deleteStore,
  getUploadsDir,
  getStorePath,
  invalidateCache,
  readPlatform,
  writePlatform,
  startFlushTimer,
  stopFlushTimer
};

export default DataLayer;
