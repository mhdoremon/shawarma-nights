import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp 
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './config';
import { MENU_ITEMS } from '../data/menuData';

// 1. Menu Sync
export function subscribeToMenu(callback) {
  if (!isFirebaseConfigured || !db) return () => {};

  const colRef = collection(db, 'menu');
  return onSnapshot(colRef, async (snapshot) => {
    if (snapshot.empty) {
      // First time seed from MENU_ITEMS into Firebase
      console.log('🌱 Seeding initial menu items to Firebase...');
      for (const item of MENU_ITEMS) {
        await setDoc(doc(db, 'menu', item.id), { ...item, available: true });
      }
    } else {
      const items = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
      callback(items);
    }
  }, (err) => console.error('Firestore menu error:', err));
}

// 2. Orders Sync
export function subscribeToOrders(callback) {
  if (!isFirebaseConfigured || !db) return () => {};

  const q = query(collection(db, 'orders'));
  return onSnapshot(q, (snapshot) => {
    const orders = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
    // Sort newest first
    orders.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    callback(orders);
  }, (err) => console.error('Firestore orders error:', err));
}

// 3. Reviews Sync
export function subscribeToReviews(callback) {
  if (!isFirebaseConfigured || !db) return () => {};

  const colRef = collection(db, 'reviews');
  return onSnapshot(colRef, (snapshot) => {
    const reviews = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
    callback(reviews);
  }, (err) => console.error('Firestore reviews error:', err));
}

// 4. Mutations
export async function fbPlaceOrder(orderData) {
  if (!isFirebaseConfigured || !db) return;
  const orderId = orderData.orderId || `SN-${Math.floor(100000 + Math.random() * 900000)}`;
  const ref = doc(db, 'orders', orderId);
  await setDoc(ref, {
    ...orderData,
    id: orderId,
    status: 'new',
    placedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    createdAt: serverTimestamp(),
  });
}

export async function fbUpdateOrderStatus(orderId, status) {
  if (!isFirebaseConfigured || !db) return;
  const ref = doc(db, 'orders', orderId);
  await updateDoc(ref, { status });
}

export async function fbAddMenuItem(item) {
  if (!isFirebaseConfigured || !db) return;
  const id = item.id || `dish-${Date.now()}`;
  const ref = doc(db, 'menu', id);
  await setDoc(ref, { ...item, id, available: true });
}

export async function fbUpdateMenuItem(id, updates) {
  if (!isFirebaseConfigured || !db) return;
  const ref = doc(db, 'menu', id);
  await updateDoc(ref, updates);
}

export async function fbDeleteMenuItem(id) {
  if (!isFirebaseConfigured || !db) return;
  const ref = doc(db, 'menu', id);
  await deleteDoc(ref);
}

export async function fbToggleAvailability(id, currentAvailable) {
  if (!isFirebaseConfigured || !db) return;
  const ref = doc(db, 'menu', id);
  await updateDoc(ref, { available: !currentAvailable });
}

export async function fbAddReview(reviewData) {
  if (!isFirebaseConfigured || !db) return;
  const id = `rev-${Date.now()}`;
  const ref = doc(db, 'reviews', id);
  await setDoc(ref, {
    ...reviewData,
    id,
    date: 'Just now',
    createdAt: serverTimestamp(),
  });
}
