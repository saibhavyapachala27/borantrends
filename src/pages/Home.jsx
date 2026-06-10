import React, { useState, useEffect } from 'react';
import { Search, SlidersHorizontal, MapPin } from 'lucide-react';
import ProductCard from '../components/ProductCard';

export default function Home({ 
  products, 
  branches, 
  selectedBranch, 
  onSelectBranch, 
  inventory, 
  onAddToBag 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedSize, setSelectedSize] = useState('');
  const [maxPrice, setMaxPrice] = useState(3000);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Categories list derived from seed data
  const categories = ['All', 'Baggy Jeans', 'Formal Baggies', 'Formal Shirts', 'T-Shirts', 'Down Shoulder', 'Formal Pants', 'Linen Edit'];

  // Filter products based on selected branch and filters
  const filteredProducts = products.filter(product => {
    // 1. Category check
    if (selectedCategory !== 'All' && product.category !== selectedCategory) {
      return false;
    }

    // 2. Search search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchName = product.name.toLowerCase().includes(term);
      const matchDesc = product.description?.toLowerCase().includes(term);
      if (!matchName && !matchDesc) return false;
    }

    // 3. Size check
    if (selectedSize && !product.sizes.includes(selectedSize)) {
      return false;
    }

    // Get active price (incorporating branch override if exists)
    const invItem = inventory.find(inv => inv.branch_id === selectedBranch?.id && inv.product_id === product.id);
    const activePrice = (invItem && invItem.price_override !== null && invItem.price_override !== undefined)
      ? invItem.price_override
      : product.price;

    // 4. Price check
    if (activePrice > maxPrice) {
      return false;
    }

    // 5. Check if product is enabled
    return product.is_enabled;
  });

  // Calculate total stock per branch for summary status widgets
  const getBranchStockSum = (branchId) => {
    return inventory
      .filter(inv => inv.branch_id === branchId)
      .reduce((sum, inv) => sum + inv.quantity, 0);
  };

  return (
    <main style={{ minHeight: '100vh', paddingBottom: 80 }}>
      {/* Cinematic Hero Header */}
      <section className="hero-section">
        <div className="hero-bg">
          <img 
            src="https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=1600&auto=format&fit=crop" 
            alt="Boran Trends cinematic menswear showcase" 
          />
        </div>
        <div className="hero-overlay"></div>
        <div className="container" style={{ position: 'relative', zIndex: 10 }}>
          <div className="hero-content">
            <div className="hero-badge">
              <div className="hero-badge-line"></div>
              <span className="hero-badge-text">Autumn / Winter '26 Edit</span>
            </div>
            <h2 className="hero-title">
              Tailored<br />for the<br />
              <span className="text-gradient-gold">modern man.</span>
            </h2>
            <p className="hero-desc">
              Crafted denim, formal essentials, and linen made for India's most discerning gentlemen. Now across Bhongir, Mothkur & Jangaon.
            </p>
            <div className="btn-group">
              <a href="#catalog" className="btn-gold">Shop Collection</a>
              <button 
                className="btn-outline"
                onClick={() => {
                  const element = document.getElementById('branches');
                  element?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Our Stores
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Marquee Banner */}
      <div className="marquee-container">
        <div className="marquee-content">
          <span>Baggy Jeans ✦ Formal Baggies ✦ Baggy Shirts ✦ Formal Pants ✦ Linen Pants ✦ Down Shoulder ✦ T-Shirts ✦ Formal Shirts ✦ &nbsp;</span>
          <span>Baggy Jeans ✦ Formal Baggies ✦ Baggy Shirts ✦ Formal Pants ✦ Linen Pants ✦ Down Shoulder ✦ T-Shirts ✦ Formal Shirts ✦ &nbsp;</span>
        </div>
      </div>

      {/* Branches Status Overview */}
      <section id="branches" style={{ paddingTop: 80, paddingBottom: 40 }}>
        <div className="container">
          <div className="section-title-wrap">
            <div>
              <span className="category-tag">Live Store Status</span>
              <h3 className="section-title">Shop by <span>branch</span></h3>
            </div>
            <p className="section-desc">
              Toggle between our active flagship stores to review real-time product quantities and directly interface with their local stock rooms.
            </p>
          </div>

          <div className="branch-status-grid">
            {branches.map(branch => {
              const isSelected = selectedBranch?.id === branch.id;
              const totalStock = getBranchStockSum(branch.id);
              return (
                <div 
                  key={branch.id} 
                  className={`branch-card ${isSelected ? 'active-branch' : ''}`}
                >
                  <div className="branch-card-header">
                    <MapPin size={18} style={{ color: isSelected ? '#d4af37' : '#62626a' }} />
                    <span>{branch.name}</span>
                  </div>
                  <div className="branch-stock-info">
                    <span className="branch-stock-num">{totalStock}</span>
                    <span className="branch-stock-lbl">pieces in stock</span>
                  </div>
                  <button 
                    className="branch-card-btn"
                    onClick={() => onSelectBranch(branch)}
                  >
                    <span>{isSelected ? 'Currently Viewing' : 'Select Branch'}</span>
                    <span>→</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Catalog & Filter controls */}
      <section id="catalog" style={{ paddingTop: 40 }}>
        <div className="container">
          <div className="section-title-wrap" style={{ marginBottom: 32 }}>
            <div>
              <span className="category-tag">Collections</span>
              <h3 className="section-title">Boran <span>exclusives</span></h3>
            </div>
            <span style={{ fontSize: 13, color: '#9e9ea7' }}>
              Showing {filteredProducts.length} premium designs in {selectedBranch?.name}
            </span>
          </div>

          {/* Filters Dashboard */}
          <div className="filters-bar">
            <div className="filters-row">
              {/* Search Bar */}
              <div className="search-input-wrap">
                <Search size={16} />
                <input 
                  type="text" 
                  className="search-input"
                  placeholder="Search products by name or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Advanced Filter Toggle */}
              <button 
                className="advanced-filters-btn"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              >
                <SlidersHorizontal size={14} />
                <span>Filters</span>
              </button>
            </div>

            {/* Category selection chips */}
            <div className="filter-group-wrap">
              {categories.map(cat => (
                <button
                  key={cat}
                  className={`filter-chip ${selectedCategory === cat ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Advanced Filters Panel */}
            {showAdvancedFilters && (
              <div className="advanced-filters-panel">
                {/* Size Filter */}
                <div>
                  <h4 style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12, color: '#9e9ea7' }}>Filter By Size</h4>
                  <div className="size-selector-grid">
                    <button 
                      className={`size-btn ${selectedSize === '' ? 'active' : ''}`}
                      onClick={() => setSelectedSize('')}
                      style={{ width: 'auto', padding: '0 12px', borderRadius: 16 }}
                    >
                      All Sizes
                    </button>
                    {['S', 'M', 'L', 'XL', 'XXL'].map(size => (
                      <button
                        key={size}
                        className={`size-btn ${selectedSize === size ? 'active' : ''}`}
                        onClick={() => setSelectedSize(size)}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price Slider Filter */}
                <div className="price-range-wrap">
                  <div className="price-range-lbls">
                    <span>Max Price</span>
                    <span style={{ color: '#d4af37', fontWeight: 600 }}>₹{maxPrice.toLocaleString('en-IN')}</span>
                  </div>
                  <input 
                    type="range" 
                    min="500" 
                    max="3000" 
                    step="100"
                    className="price-slider"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(Number(e.target.value))}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#62626a' }}>
                    <span>₹500</span>
                    <span>₹3,000</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Catalog Grid */}
          {filteredProducts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 0', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 8, color: '#62626a' }}>
              <p style={{ fontSize: 16, marginBottom: 8 }}>No items matched your active search filters.</p>
              <button 
                style={{ color: '#d4af37', fontSize: 12, textDecoration: 'underline' }}
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('All');
                  setSelectedSize('');
                  setMaxPrice(3000);
                }}
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="product-grid">
              {filteredProducts.map(product => (
                <ProductCard 
                  key={product.id}
                  product={product}
                  branchInventory={inventory.filter(inv => inv.branch_id === selectedBranch?.id)}
                  onAddToBag={onAddToBag}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
