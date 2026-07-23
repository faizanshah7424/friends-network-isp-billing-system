'use client';

export interface RecentCustomerItem {
  id: string;
  customerId: string;
  name: string;
  phone: string;
  area: string;
  openedAt: string;
}

const RECENT_KEY = 'fn_recent_customers';
const FAVORITES_KEY = 'fn_favorite_customer_ids';

// Recent Customers Helpers
export function getRecentCustomers(): RecentCustomerItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(RECENT_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function addRecentCustomer(item: Omit<RecentCustomerItem, 'openedAt'>) {
  if (typeof window === 'undefined') return;
  try {
    const list = getRecentCustomers();
    const filtered = list.filter((c) => c.id !== item.id);
    const updated = [
      {
        ...item,
        openedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
      ...filtered,
    ].slice(0, 10);
    localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to update recent customers:', e);
  }
}

// Favorite Customers Helpers
export function getFavoriteCustomerIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(FAVORITES_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function isCustomerFavorite(id: string): boolean {
  return getFavoriteCustomerIds().includes(id);
}

export function toggleFavoriteCustomer(id: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const favs = getFavoriteCustomerIds();
    let updated: string[];
    let isFav = false;
    if (favs.includes(id)) {
      updated = favs.filter((fId) => fId !== id);
      isFav = false;
    } else {
      updated = [...favs, id];
      isFav = true;
    }
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
    return isFav;
  } catch {
    return false;
  }
}
