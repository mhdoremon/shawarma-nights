import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

function extractVal(content, key) {
  if (!content) return '';
  // Try quoted: key: "value" or key = "value" or 'value'
  const quoted = new RegExp(`(?:VITE_FIREBASE_)?${key}\\s*[:=]\\s*["'\`]([^"'\`]+)["'\`]`, 'i');
  const m1 = content.match(quoted);
  if (m1) return m1[1].trim();

  // Try unquoted: VITE_FIREBASE_KEY=value
  const unquoted = new RegExp(`(?:VITE_FIREBASE_)?${key}\\s*[:=]\\s*([^\\s,;]+)`, 'i');
  const m2 = content.match(unquoted);
  if (m2) return m2[1].trim();

  return '';
}

function getFirebaseConfig() {
  const candidateFiles = [
    path.resolve(__dirname, '.env.local'),
    path.resolve(__dirname, '.env'),
    path.resolve(__dirname, 'firebaseConfig.js'),
    path.resolve(__dirname, 'src/firebaseConfig.js'),
  ];

  let rawContent = '';
  for (const file of candidateFiles) {
    if (fs.existsSync(file)) {
      rawContent += '\n' + fs.readFileSync(file, 'utf8');
    }
  }

  const config = {
    apiKey: extractVal(rawContent, 'apiKey') || extractVal(rawContent, 'API_KEY'),
    authDomain: extractVal(rawContent, 'authDomain') || extractVal(rawContent, 'AUTH_DOMAIN'),
    projectId: extractVal(rawContent, 'projectId') || extractVal(rawContent, 'PROJECT_ID'),
    storageBucket: extractVal(rawContent, 'storageBucket') || extractVal(rawContent, 'STORAGE_BUCKET'),
    messagingSenderId: extractVal(rawContent, 'messagingSenderId') || extractVal(rawContent, 'MESSAGING_SENDER_ID'),
    appId: extractVal(rawContent, 'appId') || extractVal(rawContent, 'APP_ID'),
    databaseURL: extractVal(rawContent, 'databaseURL') || extractVal(rawContent, 'DATABASE_URL'),
  };

  return config;
}

const fbConfig = getFirebaseConfig();

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    '__RAW_FIREBASE_CONFIG__': JSON.stringify(fbConfig),
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
    allowedHosts: true,
    open: false,
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
      '/download': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
      '/app.apk': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://localhost:5001',
        ws: true,
      },
      '/gateway': {
        target: 'ws://localhost:5001',
        ws: true,
      },
    },
  },
});
