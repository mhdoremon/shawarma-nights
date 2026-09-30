/**
 * WebSocketHub — Multi-tenant WebSocket broadcasting
 * 
 * Manages two WebSocket servers:
 *   /ws       — Customer frontends (per store)
 *   /gateway  — Android Dukandar apps (per store)
 * 
 * Each connection is tagged with storeId for isolated broadcasting.
 */

import { WebSocketServer, WebSocket } from 'ws';
import config from '../config/index.js';

// Track connections by store: { "shawarma": Set([ws1, ws2]) }
const customerConnections = {};   // /ws clients
const gatewayConnections = {};    // /gateway clients (Android apps)

let customerWss = null;
let gatewayWss = null;

/**
 * Extract storeId from WebSocket upgrade request.
 * Checks: query param ?storeId=, header X-Store-Id, or uses default.
 */
function extractStoreId(req) {
  // Query param
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const queryStoreId = url.searchParams.get('storeId');
  if (queryStoreId) return queryStoreId;

  // Header
  const headerStoreId = req.headers['x-store-id'];
  if (headerStoreId) return headerStoreId;

  // Subdomain
  const host = req.headers.host || '';
  const parts = host.split('.');
  if (parts.length >= 3 && parts[0] !== 'www' && parts[0] !== 'api') {
    return parts[0];
  }

  // Default
  return config.DEFAULT_STORE_ID;
}

/**
 * Initialize WebSocket servers on the HTTP server.
 */
function init(httpServer, messageHandler) {
  // Customer WebSocket server (/ws)
  customerWss = new WebSocketServer({ noServer: true });
  customerWss.on('connection', (ws, req) => {
    const storeId = ws._storeId;
    if (!customerConnections[storeId]) customerConnections[storeId] = new Set();
    customerConnections[storeId].add(ws);

    console.log(`🌐 [WS] Customer connected to store "${storeId}" (total: ${customerConnections[storeId].size})`);

    ws.on('message', (rawMsg) => {
      try {
        const data = JSON.parse(rawMsg.toString());
        data._storeId = storeId;
        data._source = 'customer';
        if (messageHandler) messageHandler(data, ws, storeId, 'customer');
      } catch (e) {
        console.error('❌ [WS] Customer message parse error:', e.message);
      }
    });

    ws.on('close', () => {
      customerConnections[storeId]?.delete(ws);
      if (customerConnections[storeId]?.size === 0) delete customerConnections[storeId];
    });

    ws.on('error', (err) => {
      console.error(`❌ [WS] Customer error (${storeId}):`, err.message);
    });
  });

  // Gateway WebSocket server (/gateway) — Android Dukandar apps
  gatewayWss = new WebSocketServer({ noServer: true });
  gatewayWss.on('connection', (ws, req) => {
    const storeId = ws._storeId;
    if (!gatewayConnections[storeId]) gatewayConnections[storeId] = new Set();
    gatewayConnections[storeId].add(ws);

    console.log(`📱 [WS] Gateway connected to store "${storeId}" (total: ${gatewayConnections[storeId].size})`);

    ws.on('message', (rawMsg) => {
      try {
        const data = JSON.parse(rawMsg.toString());
        data._storeId = storeId;
        data._source = 'gateway';
        if (messageHandler) messageHandler(data, ws, storeId, 'gateway');
      } catch (e) {
        console.error('❌ [WS] Gateway message parse error:', e.message);
      }
    });

    ws.on('close', () => {
      gatewayConnections[storeId]?.delete(ws);
      if (gatewayConnections[storeId]?.size === 0) delete gatewayConnections[storeId];
    });

    ws.on('error', (err) => {
      console.error(`❌ [WS] Gateway error (${storeId}):`, err.message);
    });
  });

  // Handle HTTP upgrade requests — route to correct WSS
  httpServer.on('upgrade', (request, socket, head) => {
    const pathname = new URL(request.url, `http://${request.headers.host || 'localhost'}`).pathname;
    const storeId = extractStoreId(request);

    if (pathname === config.WS_PATHS.customer || pathname === '/ws') {
      customerWss.handleUpgrade(request, socket, head, (ws) => {
        ws._storeId = storeId;
        customerWss.emit('connection', ws, request);
      });
    } else if (pathname === config.WS_PATHS.gateway || pathname === '/gateway') {
      gatewayWss.handleUpgrade(request, socket, head, (ws) => {
        ws._storeId = storeId;
        gatewayWss.emit('connection', ws, request);
      });
    } else {
      socket.destroy();
    }
  });

  console.log('🔌 [WebSocketHub] Initialized — /ws (customers) + /gateway (dukandar apps)');
}

/**
 * Broadcast a message to all customer frontends of a specific store.
 */
function broadcastToCustomers(storeId, message) {
  const clients = customerConnections[storeId];
  if (!clients || clients.size === 0) return 0;

  const payload = typeof message === 'string' ? message : JSON.stringify(message);
  let sent = 0;

  for (const ws of clients) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(payload);
      sent++;
    }
  }

  return sent;
}

/**
 * Broadcast a message to all gateway (Android app) connections of a specific store.
 */
function broadcastToGateway(storeId, message) {
  const clients = gatewayConnections[storeId];
  if (!clients || clients.size === 0) return 0;

  const payload = typeof message === 'string' ? message : JSON.stringify(message);
  let sent = 0;

  for (const ws of clients) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(payload);
      sent++;
    }
  }

  return sent;
}

/**
 * Broadcast to ALL clients (customers + gateway) of a store.
 */
function broadcastToAll(storeId, message) {
  const c = broadcastToCustomers(storeId, message);
  const g = broadcastToGateway(storeId, message);
  return c + g;
}

/**
 * Send a message to a specific WebSocket client.
 */
function sendTo(ws, message) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    const payload = typeof message === 'string' ? message : JSON.stringify(message);
    ws.send(payload);
    return true;
  }
  return false;
}

/**
 * Get connection stats for a store.
 */
function getStats(storeId) {
  if (storeId) {
    return {
      customers: customerConnections[storeId]?.size || 0,
      gateways: gatewayConnections[storeId]?.size || 0
    };
  }

  // All stores
  const stats = {};
  const allStores = new Set([
    ...Object.keys(customerConnections),
    ...Object.keys(gatewayConnections)
  ]);

  for (const sid of allStores) {
    stats[sid] = {
      customers: customerConnections[sid]?.size || 0,
      gateways: gatewayConnections[sid]?.size || 0
    };
  }
  return stats;
}

/**
 * Check if a store's gateway (Android app) is connected.
 */
function isGatewayConnected(storeId) {
  return (gatewayConnections[storeId]?.size || 0) > 0;
}

const WebSocketHub = {
  init,
  broadcastToCustomers,
  broadcastToGateway,
  broadcastToAll,
  sendTo,
  getStats,
  isGatewayConnected,
  extractStoreId
};

export default WebSocketHub;
