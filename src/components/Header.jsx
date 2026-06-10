import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingBag, MapPin, Search, User, Shield } from 'lucide-react';

export default function Header({ branches, selectedBranch, onSelectBranch, cartCount, onCartOpen }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const location = useLocation();

  const handleBranchSelect = (branch) => {
    onSelectBranch(branch);
    setDropdownOpen(false);
  };

  const isAdminPath = location.pathname.startsWith('/admin');

  return (
    <header className="main-header">
      <div className="promo-bar">
        Free Shipping on Orders Above ₹1999 · COD Available · Premium Menswear
      </div>
      <div className="container header-container">
        {/* Left Side: Brand Name & Subtext */}
        <Link to="/" className="brand-logo">
          <h1>
            <span className="text-gradient-gold">BORAN</span>{' '}
            <span style={{ color: '#fff' }}>TRENDS</span>
          </h1>
          <span>Menswear</span>
        </Link>

        {/* Center: Navigation Links */}
        <nav className="nav-links">
          <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
            New Arrivals
          </Link>
          <a href="#jeans" className="nav-link">Bhagy Jeans</a>
          <a href="#formal" className="nav-link">Formal</a>
          <a href="#linen" className="nav-link">Linen</a>
        </nav>

        {/* Right Side: Branch Selector, Cart, User Links */}
        <div className="header-actions">
          {/* Branch Selection Dropdown */}
          <div className="branch-selector">
            <button 
              className="branch-select-btn"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              <MapPin size={14} className="text-gradient-gold" />
              <span>{selectedBranch ? selectedBranch.name : 'Select Store'}</span>
            </button>
            {dropdownOpen && (
              <div className="branch-dropdown open">
                {branches.map((b) => (
                  <button
                    key={b.id}
                    className={`branch-option ${selectedBranch?.id === b.id ? 'selected' : ''}`}
                    onClick={() => handleBranchSelect(b)}
                  >
                    {b.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Admin link */}
          <Link 
            to="/admin" 
            className="icon-btn" 
            title="Admin Dashboard"
            style={{ color: isAdminPath ? '#d4af37' : 'inherit' }}
          >
            <Shield size={18} />
          </Link>

          {/* Cart Trigger */}
          <button 
            className="icon-btn" 
            onClick={onCartOpen}
            aria-label="Open Cart"
          >
            <ShoppingBag size={18} />
            {cartCount > 0 && <span className="badge">{cartCount}</span>}
          </button>
        </div>
      </div>
    </header>
  );
}
