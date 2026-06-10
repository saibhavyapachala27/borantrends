import React, { useState, useEffect } from 'react';
import { 
  BarChart3, Package, Layers, MapPin, ShoppingBag, 
  Plus, Edit, Trash2, CheckCircle2, AlertTriangle, LogOut, Check
} from 'lucide-react';
import { isMockMode, supabase, mockDb, mockAuth } from '../supabaseClient';

export default function Admin({ 
  products, onRefreshProducts,
  branches, onRefreshBranches,
  inventory, onRefreshInventory
}) {
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [activeTab, setActiveTab] = useState('analytics');

  // Dashboard Data States
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);

  // Form Modals states
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    name: '', description: '', price: '', category: '', sizes: 'S, M, L, XL', image_urls: '', is_enabled: true
  });
  const [isUploadingImages, setIsUploadingImages] = useState(false);

  const [branchModalOpen, setBranchModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [branchForm, setBranchForm] = useState({
    name: '', whatsapp_number: '', is_active: true
  });

  const [stockModalOpen, setStockModalOpen] = useState(false);
  const [selectedStockBranch, setSelectedStockBranch] = useState('');
  const [selectedStockProduct, setSelectedStockProduct] = useState('');
  const [stockForm, setStockForm] = useState({
    quantity: 0, price_override: ''
  });

  // Fetch initial auth session
  useEffect(() => {
    const checkAuth = async () => {
      if (isMockMode) {
        setSession(mockDb.getSession());
      } else {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
          setSession(session);
        });
        return () => subscription.unsubscribe();
      }
    };
    checkAuth();
  }, []);

  // Fetch Orders and Customers when session exists
  const fetchAdminData = async () => {
    if (!session) return;
    try {
      if (isMockMode) {
        setOrders(mockDb.getOrders());
        setCustomers(mockDb.getCustomers());
      } else {
        const { data: ordersData, error: ordersErr } = await supabase
          .from('orders')
          .select('*, customers(*), branches(*)')
          .order('created_at', { ascending: false });

        if (ordersErr) throw ordersErr;
        setOrders(ordersData || []);

        const { data: custData, error: custErr } = await supabase
          .from('customers')
          .select('*');
        if (custErr) throw custErr;
        setCustomers(custData || []);
      }
    } catch (err) {
      console.error('Failed to load admin data:', err);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [session]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    try {
      if (isMockMode) {
        const { data, error } = await mockAuth.signInWithPassword({ email, password });
        if (error) {
          setLoginError(error.message);
        } else {
          setSession(data);
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          setLoginError(error.message);
        } else {
          setSession(data.session);
        }
      }
    } catch (err) {
      setLoginError('An unexpected login error occurred.');
    }
  };

  const handleLogout = async () => {
    if (isMockMode) {
      await mockAuth.signOut();
    } else {
      await supabase.auth.signOut();
    }
    setSession(null);
  };

  // ==========================================
  // PRODUCTS CRUD FLOW
  // ==========================================
  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setProductForm({
      name: '', description: '', price: '', category: 'T-Shirts', sizes: 'S, M, L, XL', image_urls: '', is_enabled: true
    });
    setProductModalOpen(true);
  };

  const handleOpenEditProduct = (prod) => {
    setEditingProduct(prod);
    setProductForm({
      name: prod.name,
      description: prod.description || '',
      price: prod.price,
      category: prod.category,
      sizes: prod.sizes.join(', '),
      image_urls: prod.image_urls.join(', '),
      is_enabled: prod.is_enabled
    });
    setProductModalOpen(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    const sizesArr = productForm.sizes.split(',').map(s => s.trim()).filter(Boolean);
    const imagesArr = productForm.image_urls.split(',').map(img => img.trim()).filter(Boolean);
    const prodPayload = {
      name: productForm.name,
      description: productForm.description,
      price: parseFloat(productForm.price),
      category: productForm.category,
      sizes: sizesArr,
      image_urls: imagesArr,
      is_enabled: productForm.is_enabled
    };

    try {
      if (isMockMode) {
        const dbProducts = mockDb.getProducts();
        if (editingProduct) {
          const updated = dbProducts.map(p => p.id === editingProduct.id ? { ...p, ...prodPayload } : p);
          mockDb.saveProducts(updated);
        } else {
          const newProduct = {
            id: `p_${Date.now()}`,
            ...prodPayload
          };
          dbProducts.push(newProduct);
          mockDb.saveProducts(dbProducts);

          // Seed default inventory quantity = 0 for this new product across all branches
          const dbInventory = mockDb.getInventory();
          branches.forEach(b => {
            dbInventory.push({
              id: `i_${Date.now()}_${b.id}`,
              branch_id: b.id,
              product_id: newProduct.id,
              quantity: 0,
              price_override: null
            });
          });
          mockDb.saveInventory(dbInventory);
        }
      } else {
        if (editingProduct) {
          const { error } = await supabase
            .from('products')
            .update(prodPayload)
            .eq('id', editingProduct.id);
          if (error) throw error;
        } else {
          const { data: newProd, error } = await supabase
            .from('products')
            .insert(prodPayload)
            .select()
            .single();
          if (error) throw error;

          // Initialize inventory records for new product
          const invPayloads = branches.map(b => ({
            branch_id: b.id,
            product_id: newProd.id,
            quantity: 0,
            price_override: null
          }));
          await supabase.from('inventory').insert(invPayloads);
        }
      }

      setProductModalOpen(false);
      onRefreshProducts();
      onRefreshInventory();
    } catch (err) {
      alert('Failed to save product: ' + err.message);
    }
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setIsUploadingImages(true);
    const uploadedUrls = [];

    try {
      for (const file of files) {
        if (isMockMode) {
          // Mock mode: read file as Base64 to demo preview uploader locally
          const base64Url = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = (error) => reject(error);
            reader.readAsDataURL(file);
          });
          uploadedUrls.push(base64Url);
        } else {
          // Real Supabase storage flow:
          // bucket is 'product-images'
          const fileExt = file.name.split('.').pop();
          const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
          const filePath = `${fileName}`;

          const { data, error } = await supabase.storage
            .from('product-images')
            .upload(filePath, file, { cacheControl: '3600', upsert: false });

          if (error) throw error;

          const { data: { publicUrl } } = supabase.storage
            .from('product-images')
            .getPublicUrl(filePath);

          uploadedUrls.push(publicUrl);
        }
      }

      // Append new URLs to the current form state
      const currentUrls = productForm.image_urls 
        ? productForm.image_urls.split(',').map(u => u.trim()).filter(Boolean)
        : [];
      
      const newUrls = [...currentUrls, ...uploadedUrls].join(', ');
      setProductForm(prev => ({ ...prev, image_urls: newUrls }));

    } catch (err) {
      console.error('Image upload failed:', err);
      alert('Failed to upload image(s): ' + err.message);
    } finally {
      setIsUploadingImages(false);
      // Clear file input value
      e.target.value = '';
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product? All corresponding branch inventory will also be deleted.')) return;
    try {
      if (isMockMode) {
        const dbProducts = mockDb.getProducts().filter(p => p.id !== id);
        mockDb.saveProducts(dbProducts);
        const dbInventory = mockDb.getInventory().filter(i => i.product_id !== id);
        mockDb.saveInventory(dbInventory);
      } else {
        const { error } = await supabase.from('products').delete().eq('id', id);
        if (error) throw error;
      }
      onRefreshProducts();
      onRefreshInventory();
    } catch (err) {
      alert('Delete failed: ' + err.message);
    }
  };

  const handleToggleProductEnabled = async (prod) => {
    const updatedStatus = !prod.is_enabled;
    try {
      if (isMockMode) {
        const updated = mockDb.getProducts().map(p => p.id === prod.id ? { ...p, is_enabled: updatedStatus } : p);
        mockDb.saveProducts(updated);
      } else {
        const { error } = await supabase
          .from('products')
          .update({ is_enabled: updatedStatus })
          .eq('id', prod.id);
        if (error) throw error;
      }
      onRefreshProducts();
    } catch (err) {
      alert('Update status failed: ' + err.message);
    }
  };

  // ==========================================
  // BRANCH MANAGEMENT
  // ==========================================
  const handleOpenAddBranch = () => {
    setEditingBranch(null);
    setBranchForm({ name: '', whatsapp_number: '', is_active: true });
    setBranchModalOpen(true);
  };

  const handleOpenEditBranch = (b) => {
    setEditingBranch(b);
    setBranchForm({ name: b.name, whatsapp_number: b.whatsapp_number, is_active: b.is_active });
    setBranchModalOpen(true);
  };

  const handleSaveBranch = async (e) => {
    e.preventDefault();
    const branchPayload = {
      name: branchForm.name,
      whatsapp_number: branchForm.whatsapp_number,
      is_active: branchForm.is_active
    };

    try {
      if (isMockMode) {
        const dbBranches = mockDb.getBranches();
        if (editingBranch) {
          const updated = dbBranches.map(b => b.id === editingBranch.id ? { ...b, ...branchPayload } : b);
          mockDb.saveBranches(updated);
        } else {
          const newBranch = {
            id: `b_${Date.now()}`,
            ...branchPayload
          };
          dbBranches.push(newBranch);
          mockDb.saveBranches(dbBranches);

          // Seed default inventory values for all existing products in this new branch
          const dbInventory = mockDb.getInventory();
          products.forEach(p => {
            dbInventory.push({
              id: `i_${Date.now()}_${p.id}`,
              branch_id: newBranch.id,
              product_id: p.id,
              quantity: 0,
              price_override: null
            });
          });
          mockDb.saveInventory(dbInventory);
        }
      } else {
        if (editingBranch) {
          const { error } = await supabase
            .from('branches')
            .update(branchPayload)
            .eq('id', editingBranch.id);
          if (error) throw error;
        } else {
          const { data: newB, error } = await supabase
            .from('branches')
            .insert(branchPayload)
            .select()
            .single();
          if (error) throw error;

          // Initialize inventory entries
          const invPayloads = products.map(p => ({
            branch_id: newB.id,
            product_id: p.id,
            quantity: 0,
            price_override: null
          }));
          await supabase.from('inventory').insert(invPayloads);
        }
      }

      setBranchModalOpen(false);
      onRefreshBranches();
      onRefreshInventory();
    } catch (err) {
      alert('Failed to save branch: ' + err.message);
    }
  };

  const handleDeleteBranch = async (id) => {
    if (!window.confirm('Delete this branch? Active stock tables linked to it will also be wiped out.')) return;
    try {
      if (isMockMode) {
        const dbBranches = mockDb.getBranches().filter(b => b.id !== id);
        mockDb.saveBranches(dbBranches);
        const dbInventory = mockDb.getInventory().filter(i => i.branch_id !== id);
        mockDb.saveInventory(dbInventory);
      } else {
        const { error } = await supabase.from('branches').delete().eq('id', id);
        if (error) throw error;
      }
      onRefreshBranches();
      onRefreshInventory();
    } catch (err) {
      alert('Delete branch failed: ' + err.message);
    }
  };

  // ==========================================
  // STOCK INVENTORY ACTIONS
  // ==========================================
  const handleOpenStockEdit = (branchId, prodId) => {
    setSelectedStockBranch(branchId);
    setSelectedStockProduct(prodId);
    const item = inventory.find(i => i.branch_id === branchId && i.product_id === prodId);
    setStockForm({
      quantity: item ? item.quantity : 0,
      price_override: item && item.price_override ? String(item.price_override) : ''
    });
    setStockModalOpen(true);
  };

  const handleSaveStock = async (e) => {
    e.preventDefault();
    const qty = parseInt(stockForm.quantity);
    const override = stockForm.price_override ? parseFloat(stockForm.price_override) : null;

    try {
      if (isMockMode) {
        const dbInv = mockDb.getInventory();
        const existing = dbInv.find(i => i.branch_id === selectedStockBranch && i.product_id === selectedStockProduct);
        if (existing) {
          existing.quantity = qty;
          existing.price_override = override;
        } else {
          dbInv.push({
            id: `i_${Date.now()}`,
            branch_id: selectedStockBranch,
            product_id: selectedStockProduct,
            quantity: qty,
            price_override: override
          });
        }
        mockDb.saveInventory(dbInv);
      } else {
        const existing = inventory.find(i => i.branch_id === selectedStockBranch && i.product_id === selectedStockProduct);
        if (existing) {
          const { error } = await supabase
            .from('inventory')
            .update({ quantity: qty, price_override: override })
            .eq('id', existing.id);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('inventory')
            .insert({
              branch_id: selectedStockBranch,
              product_id: selectedStockProduct,
              quantity: qty,
              price_override: override
            });
          if (error) throw error;
        }
      }

      setStockModalOpen(false);
      onRefreshInventory();
    } catch (err) {
      alert('Failed to update inventory: ' + err.message);
    }
  };

  // ==========================================
  // ORDER ACTIONS (INVENTORY SUBTRACTION ON CONFIRMATION)
  // ==========================================
  const handleUpdateOrderStatus = async (order, newStatus) => {
    const oldStatus = order.status;
    if (oldStatus === newStatus) return;

    try {
      if (isMockMode) {
        const dbOrders = mockDb.getOrders();
        const match = dbOrders.find(o => o.id === order.id);

        if (match) {
          // Check Stock Depletion Condition
          // Status changes from anything -> confirmed: subtract stock
          if (newStatus === 'confirmed' && oldStatus !== 'confirmed') {
            const success = adjustStockQuantities(order.branch_id, order.items, 'subtract');
            if (!success) return; // Terminate if stock is insufficient
          }
          // Status changes from confirmed -> cancelled/pending: restock items
          else if (oldStatus === 'confirmed' && (newStatus === 'cancelled' || newStatus === 'pending')) {
            adjustStockQuantities(order.branch_id, order.items, 'add');
          }

          match.status = newStatus;
          mockDb.saveOrders(dbOrders);
        }
      } else {
        // Real database transaction sequence
        if (newStatus === 'confirmed' && oldStatus !== 'confirmed') {
          // Subtract stock in Supabase first
          const success = await adjustStockQuantitiesSupabase(order.branch_id, order.items, 'subtract');
          if (!success) return;
        }
        else if (oldStatus === 'confirmed' && (newStatus === 'cancelled' || newStatus === 'pending')) {
          // Restock in Supabase
          await adjustStockQuantitiesSupabase(order.branch_id, order.items, 'add');
        }

        const { error } = await supabase
          .from('orders')
          .update({ status: newStatus })
          .eq('id', order.id);

        if (error) throw error;
      }

      await fetchAdminData();
      onRefreshInventory();
      alert(`Order status updated from ${oldStatus} to ${newStatus}.`);

    } catch (err) {
      alert('Failed to transition order status: ' + err.message);
    }
  };

  // Mock Stock Adjustment Helper
  const adjustStockQuantities = (branchId, items, action) => {
    const dbInventory = mockDb.getInventory();
    const tempInv = JSON.parse(JSON.stringify(dbInventory)); // Deep copy to validate

    for (let item of items) {
      const match = tempInv.find(inv => inv.branch_id === branchId && inv.product_id === item.product_id);
      if (!match) {
        alert(`Inventory record missing for ${item.name} in selected branch!`);
        return false;
      }

      if (action === 'subtract') {
        if (match.quantity < item.quantity) {
          alert(`Insufficient inventory! ${item.name} has only ${match.quantity} items remaining but ${item.quantity} are ordered.`);
          return false;
        }
        match.quantity -= item.quantity;
      } else if (action === 'add') {
        match.quantity += item.quantity;
      }
    }

    mockDb.saveInventory(tempInv);
    return true;
  };

  // Supabase Stock Adjustment Helper
  const adjustStockQuantitiesSupabase = async (branchId, items, action) => {
    // 1. Fetch current quantities
    const { data: invRecords, error: fetchErr } = await supabase
      .from('inventory')
      .select('*')
      .eq('branch_id', branchId);

    if (fetchErr) throw fetchErr;

    const updates = [];

    for (let item of items) {
      const match = invRecords.find(i => i.product_id === item.product_id);
      if (!match) {
        alert(`No inventory found for ${item.name} in branch!`);
        return false;
      }

      let newQty = match.quantity;
      if (action === 'subtract') {
        if (match.quantity < item.quantity) {
          alert(`Insufficient inventory for ${item.name}! Only ${match.quantity} in stock.`);
          return false;
        }
        newQty -= item.quantity;
      } else {
        newQty += item.quantity;
      }

      updates.push({
        id: match.id,
        branch_id: branchId,
        product_id: item.product_id,
        quantity: newQty,
        price_override: match.price_override
      });
    }

    // Write all updates
    for (let update of updates) {
      const { error } = await supabase
        .from('inventory')
        .update({ quantity: update.quantity })
        .eq('id', update.id);
      if (error) throw error;
    }

    return true;
  };

  // ==========================================
  // ANALYTICS CALCULATIONS
  // ==========================================
  const totalProducts = products.length;
  const totalOrdersCount = orders.length;

  // Revenue calculation from confirmed / delivered orders
  const totalEarnings = orders
    .filter(o => o.status !== 'cancelled' && o.status !== 'pending')
    .reduce((sum, o) => sum + Number(o.total_amount), 0);

  // Low Stock Items (quantity <= 5)
  const lowStockAlerts = inventory.filter(inv => {
    // Only check active branches and enabled products
    const branch = branches.find(b => b.id === inv.branch_id);
    const prod = products.find(p => p.id === inv.product_id);
    return branch?.is_active && prod?.is_enabled && inv.quantity <= 5;
  });

  // Sales per Branch
  const getBranchSalesSum = (branchId) => {
    return orders
      .filter(o => o.branch_id === branchId && o.status !== 'cancelled' && o.status !== 'pending')
      .reduce((sum, o) => sum + Number(o.total_amount), 0);
  };

  if (!session) {
    return (
      <div className="admin-layout">
        <div className="admin-login-card animate-fade-up">
          <h2 className="admin-login-title text-gradient-gold">Boran Admin</h2>
          <p style={{ color: '#9e9ea7', fontSize: 13, textAlign: 'center', marginBottom: 24 }}>
            Access control terminal. Enter credentials below.
          </p>
          {loginError && (
            <div style={{ color: '#ef4444', background: 'rgba(239,68,68,0.08)', padding: 12, borderRadius: 4, fontSize: 12, marginBottom: 16 }}>
              {loginError}
            </div>
          )}
          {isMockMode && (
            <div style={{ color: '#f59e0b', background: 'rgba(245,158,11,0.08)', padding: 10, borderRadius: 4, fontSize: 11, marginBottom: 16, lineHeight: 1.4 }}>
              <strong>Demo Auth Activated:</strong><br />
              User: <code>admin@borantrends.com</code><br />
              Pass: <code>admin123</code>
            </div>
          )}
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
              <label>Email Address</label>
              <input 
                type="email" 
                className="form-input" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@borantrends.com"
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input 
                type="password" 
                className="form-input" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <button type="submit" className="btn-gold" style={{ marginTop: 8, width: '100%', justifyContent: 'center' }}>
              Sign In
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      <div className="container" style={{ paddingY: 40, paddingBottom: 100 }}>
        {/* Admin Header Title */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <span className="category-tag">Management Control</span>
            <h2 className="font-display text-4xl" style={{ marginTop: 6 }}>Boran Dashboard</h2>
          </div>
          <button onClick={handleLogout} className="admin-btn secondary">
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Tab Controls */}
        <div className="admin-tabs">
          <button 
            className={`admin-tab ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            <BarChart3 size={12} style={{ marginRight: 6, display: 'inline' }} />
            Analytics
          </button>
          <button 
            className={`admin-tab ${activeTab === 'products' ? 'active' : ''}`}
            onClick={() => setActiveTab('products')}
          >
            <Package size={12} style={{ marginRight: 6, display: 'inline' }} />
            Products
          </button>
          <button 
            className={`admin-tab ${activeTab === 'branches' ? 'active' : ''}`}
            onClick={() => setActiveTab('branches')}
          >
            <MapPin size={12} style={{ marginRight: 6, display: 'inline' }} />
            Branches
          </button>
          <button 
            className={`admin-tab ${activeTab === 'stock' ? 'active' : ''}`}
            onClick={() => setActiveTab('stock')}
          >
            <Layers size={12} style={{ marginRight: 6, display: 'inline' }} />
            Stock Room
          </button>
          <button 
            className={`admin-tab ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            <ShoppingBag size={12} style={{ marginRight: 6, display: 'inline' }} />
            Orders ({orders.filter(o => o.status === 'pending').length} New)
          </button>
        </div>

        {/* ANALYTICS SECTION */}
        {activeTab === 'analytics' && (
          <div className="animate-fade-up">
            <div className="kpi-grid">
              <div className="kpi-card">
                <div className="kpi-icon"><Package size={20} /></div>
                <div className="kpi-info">
                  <span className="kpi-label">Total Products</span>
                  <span className="kpi-value">{totalProducts}</span>
                </div>
              </div>
              <div className="kpi-card">
                <div className="kpi-icon"><ShoppingBag size={20} /></div>
                <div className="kpi-info">
                  <span className="kpi-label">Total Orders</span>
                  <span className="kpi-value">{totalOrdersCount}</span>
                </div>
              </div>
              <div className="kpi-card">
                <div className="kpi-icon" style={{ color: '#10b981', background: 'rgba(16,185,129,0.08)' }}><CheckCircle2 size={20} /></div>
                <div className="kpi-info">
                  <span className="kpi-label">Sales Revenue</span>
                  <span className="kpi-value" style={{ color: '#10b981' }}>₹{totalEarnings.toLocaleString('en-IN')}</span>
                </div>
              </div>
              <div className="kpi-card" style={{ border: lowStockAlerts.length > 0 ? '1px solid rgba(239,68,68,0.2)' : '' }}>
                <div className="kpi-icon" style={{ color: lowStockAlerts.length > 0 ? '#ef4444' : '#62626a', background: lowStockAlerts.length > 0 ? 'rgba(239,68,68,0.08)' : '' }}><AlertTriangle size={20} /></div>
                <div className="kpi-info">
                  <span className="kpi-label">Low Stock Alerts</span>
                  <span className="kpi-value" style={{ color: lowStockAlerts.length > 0 ? '#ef4444' : 'inherit' }}>{lowStockAlerts.length}</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 24 }}>
              {/* Branch Sales Performance */}
              <div className="admin-card-section">
                <h3 className="font-display text-2xl" style={{ marginBottom: 20 }}>Branch-wise Sales</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {branches.map(b => {
                    const sales = getBranchSalesSum(b.id);
                    const percent = totalEarnings > 0 ? (sales / totalEarnings) * 100 : 0;
                    return (
                      <div key={b.id}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                          <span>{b.name}</span>
                          <span style={{ fontWeight: 600 }}>₹{sales.toLocaleString('en-IN')}</span>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.04)', height: 8, borderRadius: 4, overflow: 'hidden' }}>
                          <div style={{ background: 'var(--gold)', height: '100%', width: `${percent}%`, transition: 'width 1s ease' }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Low Stock Alerts log */}
              <div className="admin-card-section">
                <h3 className="font-display text-2xl" style={{ marginBottom: 20 }}>Low Stock Alert Monitor</h3>
                {lowStockAlerts.length === 0 ? (
                  <p style={{ color: '#62626a', fontSize: 13, textAlign: 'center', padding: '40px 0' }}>All branches have healthy stock levels.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 300, overflowY: 'auto' }}>
                    {lowStockAlerts.map(inv => {
                      const prod = products.find(p => p.id === inv.product_id);
                      const branch = branches.find(b => b.id === inv.branch_id);
                      return (
                        <div 
                          key={inv.id} 
                          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12, background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.08)', borderRadius: 6 }}
                        >
                          <div>
                            <p style={{ fontSize: 13, fontWeight: 500 }}>{prod?.name}</p>
                            <p style={{ fontSize: 10, color: '#9e9ea7', marginTop: 2 }}>Branch: {branch?.name}</p>
                          </div>
                          <span style={{ color: '#ef4444', fontWeight: 600, fontSize: 13 }}>{inv.quantity} left</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* PRODUCTS MANAGEMENT */}
        {activeTab === 'products' && (
          <div className="admin-card-section animate-fade-up">
            <div className="table-header-row">
              <h3 className="font-display text-2xl">Products Catalogue</h3>
              <button onClick={handleOpenAddProduct} className="admin-btn">
                <Plus size={14} />
                <span>Add Product</span>
              </button>
            </div>

            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Sizes</th>
                    <th>Standard Price</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(p => (
                    <tr key={p.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          {p.image_urls?.[0] ? (
                            <img src={p.image_urls[0]} alt={p.name} style={{ width: 40, height: 50, objectFit: 'cover', borderRadius: 4 }} />
                          ) : (
                            <div style={{ width: 40, height: 50, background: '#000', borderRadius: 4 }} />
                          )}
                          <div>
                            <span style={{ fontWeight: 600 }}>{p.name}</span>
                            <p style={{ fontSize: 11, color: '#62626a', marginTop: 2, display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.description}</p>
                          </div>
                        </div>
                      </td>
                      <td>{p.category}</td>
                      <td>{p.sizes.join(', ')}</td>
                      <td>₹{p.price.toLocaleString('en-IN')}</td>
                      <td>
                        <label className="toggle-switch">
                          <input 
                            type="checkbox" 
                            checked={p.is_enabled}
                            onChange={() => handleToggleProductEnabled(p)}
                          />
                          <span className="toggle-slider"></span>
                        </label>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 10 }}>
                          <button onClick={() => handleOpenEditProduct(p)} style={{ color: 'var(--gold)' }} title="Edit"><Edit size={16} /></button>
                          <button onClick={() => handleDeleteProduct(p.id)} style={{ color: '#ef4444' }} title="Delete"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* BRANCHES MANAGEMENT */}
        {activeTab === 'branches' && (
          <div className="admin-card-section animate-fade-up">
            <div className="table-header-row">
              <h3 className="font-display text-2xl">Boran Store Branches</h3>
              <button onClick={handleOpenAddBranch} className="admin-btn">
                <Plus size={14} />
                <span>Add Branch</span>
              </button>
            </div>

            <table className="data-table">
              <thead>
                <tr>
                  <th>Branch Name</th>
                  <th>WhatsApp Hotline Number</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {branches.map(b => (
                  <tr key={b.id}>
                    <td style={{ fontWeight: 600 }}>{b.name}</td>
                    <td>{b.whatsapp_number}</td>
                    <td>
                      <span style={{ 
                        padding: '4px 8px', borderRadius: 12, fontSize: 10, fontWeight: 600, 
                        background: b.is_active ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                        color: b.is_active ? '#10b981' : '#ef4444'
                      }}>
                        {b.is_active ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 10 }}>
                        <button onClick={() => handleOpenEditBranch(b)} style={{ color: 'var(--gold)' }} title="Edit"><Edit size={16} /></button>
                        <button onClick={() => handleDeleteBranch(b.id)} style={{ color: '#ef4444' }} title="Delete"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* INVENTORY / STOCK ROOM MANAGEMENT */}
        {activeTab === 'stock' && (
          <div className="admin-card-section animate-fade-up">
            <h3 className="font-display text-2xl" style={{ marginBottom: 20 }}>Branch-wise Stock Room</h3>
            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    {branches.map(b => (
                      <th key={b.id}>{b.name} Qty / Price</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {products.map(p => (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 600 }}>{p.name}</td>
                      {branches.map(b => {
                        const invRecord = inventory.find(i => i.branch_id === b.id && i.product_id === p.id);
                        const qty = invRecord ? invRecord.quantity : 0;
                        const price = invRecord && invRecord.price_override ? invRecord.price_override : p.price;
                        return (
                          <td key={b.id}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                              <span style={{ color: qty <= 5 ? '#ef4444' : '#10b981', fontWeight: 600 }}>
                                {qty} in stock
                              </span>
                              <span style={{ fontSize: 11, color: '#9e9ea7' }}>
                                ₹{price.toLocaleString('en-IN')}
                                {invRecord?.price_override && <span style={{ color: 'var(--gold)', marginLeft: 4 }}>*</span>}
                              </span>
                              <button 
                                onClick={() => handleOpenStockEdit(b.id, p.id)}
                                style={{ display: 'inline-block', fontSize: 10, color: 'var(--gold)', textDecoration: 'underline', width: 'fit-content' }}
                              >
                                Edit Stock
                              </button>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p style={{ fontSize: 11, color: '#62626a', marginTop: 16 }}>* Indicates branch-specific price override exists for this product.</p>
          </div>
        )}

        {/* ORDERS WORKFLOW */}
        {activeTab === 'orders' && (
          <div className="admin-card-section animate-fade-up">
            <h3 className="font-display text-2xl" style={{ marginBottom: 20 }}>Archived Orders Log</h3>
            {orders.length === 0 ? (
              <p style={{ color: '#62626a', padding: '60px 0', textAlign: 'center' }}>No orders registered in the system yet.</p>
            ) : (
              <div className="data-table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Customer Details</th>
                      <th>Branch & Items</th>
                      <th>Order Total</th>
                      <th>Status Workflow</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map(order => {
                      const cust = isMockMode ? customers.find(c => c.id === order.customer_id) : order.customers;
                      const branch = isMockMode ? branches.find(b => b.id === order.branch_id) : order.branches;
                      return (
                        <tr key={order.id}>
                          <td>
                            <span style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: 12, color: 'var(--gold)' }}>
                              {order.order_number}
                            </span>
                            <p style={{ fontSize: 10, color: '#62626a', marginTop: 4 }}>{new Date(order.created_at).toLocaleString('en-IN')}</p>
                          </td>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                              <span style={{ fontWeight: 600 }}>{cust?.name}</span>
                              <span style={{ fontSize: 11, color: '#9e9ea7' }}>Phone: {cust?.phone}</span>
                              <span style={{ fontSize: 11, color: '#62626a', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                Addr: {cust?.address}
                              </span>
                            </div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                              <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', textTransform: 'uppercase' }}>
                                Branch: {branch?.name}
                              </span>
                              <ul style={{ paddingLeft: 14, margin: 0, fontSize: 11, color: '#9e9ea7' }}>
                                {order.items.map((it, idx) => (
                                  <li key={idx}>
                                    {it.name} x {it.quantity} (Size: {it.size})
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </td>
                          <td style={{ fontWeight: 600, color: 'var(--gold)' }}>
                            ₹{Number(order.total_amount).toLocaleString('en-IN')}
                          </td>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                              <select 
                                className="form-input" 
                                style={{ padding: '4px 8px', fontSize: 11, width: 130 }}
                                value={order.status}
                                onChange={(e) => handleUpdateOrderStatus(order, e.target.value)}
                              >
                                <option value="pending">Pending</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="packed">Packed</option>
                                <option value="shipped">Shipped</option>
                                <option value="delivered">Delivered</option>
                                <option value="cancelled">Cancelled</option>
                              </select>
                              {order.status === 'confirmed' && (
                                <span style={{ color: '#10b981', fontSize: 10, display: 'flex', alignItems: 'center', gap: 2 }}>
                                  <Check size={10} /> Stock Subtracted
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ==========================================
         PRODUCT FORM MODAL
         ========================================== */}
      {productModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
              <button onClick={() => setProductModalOpen(false)}><Plus style={{ transform: 'rotate(45deg)' }} /></button>
            </div>
            <form onSubmit={handleSaveProduct}>
              <div className="modal-body">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div className="form-group">
                    <label>Product Name</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      required 
                      value={productForm.name}
                      onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                      placeholder="e.g. Essential Crew — Onyx"
                    />
                  </div>
                  <div className="form-group">
                    <label>Description</label>
                    <textarea 
                      className="form-input" 
                      style={{ minHeight: 60 }}
                      value={productForm.description}
                      onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                      placeholder="Brief details about fit, composition, etc."
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div className="form-group">
                      <label>Price (₹)</label>
                      <input 
                        type="number" 
                        className="form-input" 
                        required 
                        value={productForm.price}
                        onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                        placeholder="799"
                      />
                    </div>
                    <div className="form-group">
                      <label>Category</label>
                      <select 
                        className="form-input"
                        value={productForm.category}
                        onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                      >
                        <option value="T-Shirts">T-Shirts</option>
                        <option value="Formal Shirts">Formal Shirts</option>
                        <option value="Down Shoulder">Down Shoulder</option>
                        <option value="Bhagy Jeans">Bhagy Jeans</option>
                        <option value="Formal Pants">Formal Pants</option>
                        <option value="Linen Edit">Linen Edit</option>
                        <option value="Formal Bhagys">Formal Bhagys</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Sizes (Comma separated)</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={productForm.sizes}
                      onChange={(e) => setProductForm({ ...productForm, sizes: e.target.value })}
                      placeholder="S, M, L, XL"
                    />
                  </div>
                  <div className="form-group">
                    <label>Image URLs (Comma separated)</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={productForm.image_urls}
                      onChange={(e) => setProductForm({ ...productForm, image_urls: e.target.value })}
                      placeholder="https://image1.com, https://image2.com"
                    />
                  </div>
                  <div className="form-group">
                    <label>Upload Product Images</label>
                    <input 
                      type="file" 
                      multiple 
                      accept="image/*"
                      className="form-input" 
                      onChange={handleImageUpload}
                      disabled={isUploadingImages}
                    />
                    {isUploadingImages && <span style={{ fontSize: 11, color: 'var(--gold)', marginTop: 4 }}>Uploading images to storage...</span>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input 
                      type="checkbox" 
                      id="is-enabled" 
                      checked={productForm.is_enabled}
                      onChange={(e) => setProductForm({ ...productForm, is_enabled: e.target.checked })}
                    />
                    <label htmlFor="is-enabled" style={{ fontSize: 12 }}>Enable Product (Show in Storefront)</label>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="admin-btn secondary" onClick={() => setProductModalOpen(false)}>Cancel</button>
                <button type="submit" className="admin-btn">Save Product</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
         BRANCH FORM MODAL
         ========================================== */}
      {branchModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ width: 450 }}>
            <div className="modal-header">
              <h3 className="modal-title">{editingBranch ? 'Edit Branch' : 'Add New Branch'}</h3>
              <button onClick={() => setBranchModalOpen(false)}><Plus style={{ transform: 'rotate(45deg)' }} /></button>
            </div>
            <form onSubmit={handleSaveBranch}>
              <div className="modal-body">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div className="form-group">
                    <label>Branch Name</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      required 
                      value={branchForm.name}
                      onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })}
                      placeholder="e.g. Uppal"
                    />
                  </div>
                  <div className="form-group">
                    <label>WhatsApp Hotline Phone Number</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      required 
                      value={branchForm.whatsapp_number}
                      onChange={(e) => setBranchForm({ ...branchForm, whatsapp_number: e.target.value })}
                      placeholder="+919876543210"
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input 
                      type="checkbox" 
                      id="branch-active" 
                      checked={branchForm.is_active}
                      onChange={(e) => setBranchForm({ ...branchForm, is_active: e.target.checked })}
                    />
                    <label htmlFor="branch-active" style={{ fontSize: 12 }}>Active Branch (Enable selection)</label>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="admin-btn secondary" onClick={() => setBranchModalOpen(false)}>Cancel</button>
                <button type="submit" className="admin-btn">Save Branch</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
         STOCK EDIT MODAL
         ========================================== */}
      {stockModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ width: 400 }}>
            <div className="modal-header">
              <h3 className="modal-title">Edit Branch Stock</h3>
              <button onClick={() => setStockModalOpen(false)}><Plus style={{ transform: 'rotate(45deg)' }} /></button>
            </div>
            <form onSubmit={handleSaveStock}>
              <div className="modal-body">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ fontSize: 12, background: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 6, lineHeight: 1.5 }}>
                    <strong>Branch:</strong> {branches.find(b => b.id === selectedStockBranch)?.name}<br />
                    <strong>Product:</strong> {products.find(p => p.id === selectedStockProduct)?.name}
                  </div>
                  <div className="form-group">
                    <label>Stock Quantity</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      required 
                      min="0"
                      value={stockForm.quantity}
                      onChange={(e) => setStockForm({ ...stockForm, quantity: e.target.value })}
                      placeholder="10"
                    />
                  </div>
                  <div className="form-group">
                    <label>Branch Price Override (Optional)</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      value={stockForm.price_override}
                      onChange={(e) => setStockForm({ ...stockForm, price_override: e.target.value })}
                      placeholder="Leave blank to use default price"
                    />
                    <span style={{ fontSize: 10, color: '#62626a', marginTop: 4 }}>
                      Standard Product Price: ₹{products.find(p => p.id === selectedStockProduct)?.price.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="admin-btn secondary" onClick={() => setStockModalOpen(false)}>Cancel</button>
                <button type="submit" className="admin-btn">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
