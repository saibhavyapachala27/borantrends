import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if credentials are valid
export const isMockMode = 
  !supabaseUrl || 
  !supabaseAnonKey || 
  supabaseUrl.includes('your-supabase-project') || 
  supabaseAnonKey.includes('your-supabase-anon-key');

// Create the real Supabase client (only if not in mock mode)
export const supabase = !isMockMode ? createClient(supabaseUrl, supabaseAnonKey) : null;

// ==========================================
// MOCK DATABASE FALLBACK (FOR DEMO/OFFLINE)
// ==========================================
const INITIAL_BRANCHES = [
  { id: 'b1', name: 'Bhongir', whatsapp_number: '+919876543210', is_active: true },
  { id: 'b2', name: 'Mothkur', whatsapp_number: '+918765432109', is_active: true },
  { id: 'b3', name: 'Jangaon', whatsapp_number: '+917654321098', is_active: true },
  { id: 'b4', name: 'Uppal', whatsapp_number: '+919876543210', is_active: true }
];

const INITIAL_PRODUCTS = [
  {
    id: 'p1',
    name: 'Essential Crew — Onyx',
    description: 'Premium heavy-knit cotton t-shirt with flatlock seams and standard boxy fit.',
    price: 799,
    category: 'T-Shirts',
    sizes: ['S', 'M', 'L', 'XL'],
    image_urls: [
      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&auto=format&fit=crop'
    ],
    is_enabled: true
  },
  {
    id: 'p2',
    name: 'Pearl White Formal Shirt',
    description: 'Crisp, single-needle stitched formal button-up crafted from premium long-staple cotton.',
    price: 1499,
    category: 'Formal Shirts',
    sizes: ['M', 'L', 'XL', 'XXL'],
    image_urls: [
      'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1621072156002-e2fcc40d1759?w=800&auto=format&fit=crop'
    ],
    is_enabled: true
  },
  {
    id: 'p3',
    name: 'Premium Cotton — Bone',
    description: 'Soft organic cotton crewneck tee in a sophisticated muted off-white tone.',
    price: 899,
    category: 'T-Shirts',
    sizes: ['S', 'M', 'L', 'XL'],
    image_urls: [
      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop'
    ],
    is_enabled: true
  },
  {
    id: 'p4',
    name: 'Down Shoulder Noir Tee',
    description: 'Cinematic streetwear aesthetics with an oversized drape and drop-shoulder sleeve tailoring.',
    price: 999,
    category: 'Down Shoulder',
    sizes: ['M', 'L', 'XL'],
    image_urls: [
      'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=800&auto=format&fit=crop'
    ],
    is_enabled: true
  },
  {
    id: 'p5',
    name: 'Bhagy Relaxed Jeans — Vintage Blue',
    description: 'Thick Japanese selvedge denim in a relaxed fit with fading detail along the seams.',
    price: 1899,
    category: 'Bhagy Jeans',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    image_urls: [
      'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&auto=format&fit=crop'
    ],
    is_enabled: true
  },
  {
    id: 'p6',
    name: 'Classic Slim Fit Khakis',
    description: 'Flat-front formal trousers tailored from stretch cotton twill for comfort and crisp look.',
    price: 1299,
    category: 'Formal Pants',
    sizes: ['M', 'L', 'XL'],
    image_urls: [
      'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800&auto=format&fit=crop'
    ],
    is_enabled: true
  },
  {
    id: 'p7',
    name: 'Linen Breeze Shirt — Pastel Pink',
    description: 'Relaxed luxury shirt woven in pure French linen, highly breathable for Indian summers.',
    price: 1599,
    category: 'Linen Edit',
    sizes: ['S', 'M', 'L', 'XL'],
    image_urls: [
      'https://images.unsplash.com/photo-1603252109303-2751441dd157?w=800&auto=format&fit=crop'
    ],
    is_enabled: true
  },
  {
    id: 'p8',
    name: 'Formal Bhagys Pleated',
    description: 'Luxurious high-waisted pleated trousers styled for sharp, retro-modern silhouettes.',
    price: 2199,
    category: 'Formal Bhagys',
    sizes: ['M', 'L', 'XL', 'XXL'],
    image_urls: [
      'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800&auto=format&fit=crop'
    ],
    is_enabled: true
  }
];

const INITIAL_INVENTORY = [
  // Bhongir (b1)
  { id: 'i1', branch_id: 'b1', product_id: 'p1', quantity: 30, price_override: null },
  { id: 'i2', branch_id: 'b1', product_id: 'p2', quantity: 15, price_override: null },
  { id: 'i3', branch_id: 'b1', product_id: 'p3', quantity: 25, price_override: null },
  { id: 'i4', branch_id: 'b1', product_id: 'p4', quantity: 0, price_override: null },
  { id: 'i5', branch_id: 'b1', product_id: 'p5', quantity: 40, price_override: null },
  { id: 'i6', branch_id: 'b1', product_id: 'p6', quantity: 20, price_override: 1199 },
  { id: 'i7', branch_id: 'b1', product_id: 'p7', quantity: 12, price_override: null },
  { id: 'i8', branch_id: 'b1', product_id: 'p8', quantity: 5, price_override: null },

  // Mothkur (b2)
  { id: 'i9', branch_id: 'b2', product_id: 'p1', quantity: 20, price_override: null },
  { id: 'i10', branch_id: 'b2', product_id: 'p2', quantity: 10, price_override: null },
  { id: 'i11', branch_id: 'b2', product_id: 'p3', quantity: 15, price_override: null },
  { id: 'i12', branch_id: 'b2', product_id: 'p4', quantity: 8, price_override: null },
  { id: 'i13', branch_id: 'b2', product_id: 'p5', quantity: 0, price_override: null },
  { id: 'i14', branch_id: 'b2', product_id: 'p6', quantity: 15, price_override: null },
  { id: 'i15', branch_id: 'b2', product_id: 'p7', quantity: 8, price_override: null },
  { id: 'i16', branch_id: 'b2', product_id: 'p8', quantity: 3, price_override: null },

  // Jangaon (b3)
  { id: 'i17', branch_id: 'b3', product_id: 'p1', quantity: 5, price_override: null },
  { id: 'i18', branch_id: 'b3', product_id: 'p2', quantity: 30, price_override: null },
  { id: 'i19', branch_id: 'b3', product_id: 'p3', quantity: 10, price_override: null },
  { id: 'i20', branch_id: 'b3', product_id: 'p4', quantity: 12, price_override: null },
  { id: 'i21', branch_id: 'b3', product_id: 'p5', quantity: 20, price_override: null },
  { id: 'i22', branch_id: 'b3', product_id: 'p6', quantity: 0, price_override: null },
  { id: 'i23', branch_id: 'b3', product_id: 'p7', quantity: 5, price_override: null },
  { id: 'i24', branch_id: 'b3', product_id: 'p8', quantity: 15, price_override: null },

  // Uppal (b4)
  { id: 'i25', branch_id: 'b4', product_id: 'p1', quantity: 25, price_override: null },
  { id: 'i26', branch_id: 'b4', product_id: 'p2', quantity: 12, price_override: null },
  { id: 'i27', branch_id: 'b4', product_id: 'p3', quantity: 20, price_override: null },
  { id: 'i28', branch_id: 'b4', product_id: 'p4', quantity: 15, price_override: null },
  { id: 'i29', branch_id: 'b4', product_id: 'p5', quantity: 18, price_override: null },
  { id: 'i30', branch_id: 'b4', product_id: 'p6', quantity: 8, price_override: null },
  { id: 'i31', branch_id: 'b4', product_id: 'p7', quantity: 22, price_override: null },
  { id: 'i32', branch_id: 'b4', product_id: 'p8', quantity: 10, price_override: null }
];

const getLocalStorageItem = (key, initialValue) => {
  const stored = localStorage.getItem(key);
  if (!stored) {
    localStorage.setItem(key, JSON.stringify(initialValue));
    return initialValue;
  }
  return JSON.parse(stored);
};

const setLocalStorageItem = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

// Initialize Mock Databases in LocalStorage
export const mockDb = {
  getBranches: () => getLocalStorageItem('bt_branches', INITIAL_BRANCHES),
  saveBranches: (branches) => setLocalStorageItem('bt_branches', branches),

  getProducts: () => getLocalStorageItem('bt_products', INITIAL_PRODUCTS),
  saveProducts: (products) => setLocalStorageItem('bt_products', products),

  getInventory: () => getLocalStorageItem('bt_inventory', INITIAL_INVENTORY),
  saveInventory: (inventory) => setLocalStorageItem('bt_inventory', inventory),

  getOrders: () => getLocalStorageItem('bt_orders', []),
  saveOrders: (orders) => setLocalStorageItem('bt_orders', orders),

  getCustomers: () => getLocalStorageItem('bt_customers', []),
  saveCustomers: (customers) => setLocalStorageItem('bt_customers', customers),

  getSession: () => getLocalStorageItem('bt_session', null),
  saveSession: (session) => setLocalStorageItem('bt_session', session)
};

// Mock Auth Client Interface
export const mockAuth = {
  signInWithPassword: async ({ email, password }) => {
    if (email === 'admin@borantrends.com' && password === 'admin123') {
      const session = { user: { email, id: 'admin-user-id' } };
      mockDb.saveSession(session);
      return { data: session, error: null };
    }
    return { data: null, error: { message: 'Invalid admin credentials. Use admin@borantrends.com / admin123' } };
  },
  signOut: async () => {
    mockDb.saveSession(null);
    return { error: null };
  },
  getSession: async () => {
    const session = mockDb.getSession();
    return { data: { session }, error: null };
  }
};
