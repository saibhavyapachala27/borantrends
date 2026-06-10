import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { isMockMode, supabase, mockDb } from './supabaseClient';
import Header from './components/Header';
import CartDrawer from './components/CartDrawer';
import WhatsAppSupport from './components/WhatsAppSupport';
import Home from './pages/Home';
import Admin from './pages/Admin';

export default function App() {
  const [branches, setBranches] = useState([]);
  const [products, setProducts] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch branches, products, and inventory on mount
  const fetchData = async () => {
    setIsLoading(true);
    try {
      if (isMockMode) {
        const dbBranches = mockDb.getBranches().filter(b => b.is_active);
        const dbProducts = mockDb.getProducts();
        const dbInventory = mockDb.getInventory();

        setBranches(dbBranches);
        setProducts(dbProducts);
        setInventory(dbInventory);

        // Set default selected branch
        initializeSelectedBranch(dbBranches);
      } else {
        const { data: dbBranches, error: bErr } = await supabase
          .from('branches')
          .select('*')
          .eq('is_active', true);
        if (bErr) throw bErr;

        const { data: dbProducts, error: pErr } = await supabase
          .from('products')
          .select('*');
        if (pErr) throw pErr;

        const { data: dbInventory, error: iErr } = await supabase
          .from('inventory')
          .select('*');
        if (iErr) throw iErr;

        setBranches(dbBranches || []);
        setProducts(dbProducts || []);
        setInventory(dbInventory || []);

        initializeSelectedBranch(dbBranches || []);
      }
    } catch (err) {
      console.error('Failed to load database content:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Load Cart from localStorage if exists
    const savedCart = localStorage.getItem('bt_cart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error('Failed to parse saved cart');
      }
    }
  }, []);

  // Sync Cart with LocalStorage on change
  useEffect(() => {
    localStorage.setItem('bt_cart', JSON.stringify(cart));
  }, [cart]);

  const initializeSelectedBranch = (activeBranches) => {
    if (activeBranches.length === 0) return;
    const savedBranchId = localStorage.getItem('bt_selected_branch_id');
    const matched = activeBranches.find(b => b.id === savedBranchId);
    if (matched) {
      setSelectedBranch(matched);
    } else {
      setSelectedBranch(activeBranches[0]);
      localStorage.setItem('bt_selected_branch_id', activeBranches[0].id);
    }
  };

  const handleSelectBranch = (branch) => {
    setSelectedBranch(branch);
    localStorage.setItem('bt_selected_branch_id', branch.id);
  };

  // --- CART MANAGEMENT ---
  const handleAddToBag = (product, size, price) => {
    setCart((prevCart) => {
      const existingItemIdx = prevCart.findIndex(
        (item) => item.product_id === product.id && item.size === size
      );

      if (existingItemIdx > -1) {
        const updated = [...prevCart];
        updated[existingItemIdx].quantity += 1;
        return updated;
      } else {
        return [
          ...prevCart,
          {
            product_id: product.id,
            name: product.name,
            size: size,
            price: price,
            quantity: 1,
            image_url: product.image_urls?.[0] || ''
          }
        ];
      }
    });
    setCartOpen(true); // Open drawer on addition
  };

  const handleUpdateQty = (productId, size, newQty) => {
    if (newQty <= 0) {
      handleRemoveItem(productId, size);
      return;
    }
    setCart((prevCart) => 
      prevCart.map((item) => 
        item.product_id === productId && item.size === size 
          ? { ...item, quantity: newQty } 
          : item
      )
    );
  };

  const handleRemoveItem = (productId, size) => {
    setCart((prevCart) => 
      prevCart.filter((item) => !(item.product_id === productId && item.size === size))
    );
  };

  const handleClearCart = () => {
    setCart([]);
  };

  // Refresh functions for Admin Dashboard CRUD syncing
  const handleRefreshProducts = async () => {
    try {
      if (isMockMode) {
        setProducts(mockDb.getProducts());
      } else {
        const { data } = await supabase.from('products').select('*');
        setProducts(data || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRefreshBranches = async () => {
    try {
      if (isMockMode) {
        const active = mockDb.getBranches().filter(b => b.is_active);
        setBranches(active);
        // Validate if selected branch was deleted or set inactive
        const savedBranchId = localStorage.getItem('bt_selected_branch_id');
        const matched = active.find(b => b.id === savedBranchId);
        if (!matched && active.length > 0) {
          setSelectedBranch(active[0]);
          localStorage.setItem('bt_selected_branch_id', active[0].id);
        }
      } else {
        const { data } = await supabase.from('branches').select('*').eq('is_active', true);
        setBranches(data || []);
        const savedBranchId = localStorage.getItem('bt_selected_branch_id');
        const matched = (data || []).find(b => b.id === savedBranchId);
        if (!matched && (data || []).length > 0) {
          setSelectedBranch(data[0]);
          localStorage.setItem('bt_selected_branch_id', data[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRefreshInventory = async () => {
    try {
      if (isMockMode) {
        setInventory(mockDb.getInventory());
      } else {
        const { data } = await supabase.from('inventory').select('*');
        setInventory(data || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const totalCartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0a0a0c', color: '#d4af37' }}>
        <h2 className="font-display text-4xl" style={{ marginBottom: 12 }}>BORAN LUXE</h2>
        <div style={{ width: 40, height: 40, border: '2px solid rgba(212,175,55,0.2)', borderTopColor: '#d4af37', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <style>{`
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  return (
    <Router>
      <Header 
        branches={branches}
        selectedBranch={selectedBranch}
        onSelectBranch={handleSelectBranch}
        cartCount={totalCartCount}
        onCartOpen={() => setCartOpen(true)}
      />

      <Routes>
        <Route 
          path="/" 
          element={
            <Home 
              products={products}
              branches={branches}
              selectedBranch={selectedBranch}
              onSelectBranch={handleSelectBranch}
              inventory={inventory}
              onAddToBag={handleAddToBag}
            />
          } 
        />
        <Route 
          path="/admin" 
          element={
            <Admin 
              products={products}
              onRefreshProducts={handleRefreshProducts}
              branches={branches}
              onRefreshBranches={handleRefreshBranches}
              inventory={inventory}
              onRefreshInventory={handleRefreshInventory}
            />
          } 
        />
      </Routes>

      <WhatsAppSupport />

      <CartDrawer 
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        cartItems={cart}
        onUpdateQty={handleUpdateQty}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
        selectedBranch={selectedBranch}
        branchInventory={inventory.filter(i => i.branch_id === selectedBranch?.id)}
      />
    </Router>
  );
}
