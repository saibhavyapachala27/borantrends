import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingBag, MapPin, Search, User } from 'lucide-react';

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
          <a href="#jeans" className="nav-link">Baggy Jeans</a>
          <a href="#formal" className="nav-link">Formal</a>
          <a href="#linen" className="nav-link">Linen</a>
        </nav>

        {/* Right Side: Store Select, Search, User (Admin), Heart, Cart Drawer */}
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

          {/* Search Icon (Constant) */}
          <button className="icon-btn" aria-label="Search" onClick={() => {
            const el = document.getElementById('catalog');
            el?.scrollIntoView({ behavior: 'smooth' });
          }}>
            <Search size={18} />
          </button>

          {/* User Icon (Constant - routes to Admin Dashboard) */}
          <Link 
            to="/admin" 
            className="icon-btn" 
            aria-label="Account"
            title="Admin Dashboard"
            style={{ color: isAdminPath ? '#d4af37' : 'inherit' }}
          >
            <User size={18} />
          </Link>

          {/* Wishlist Heart Icon (Constant) */}
          <button className="icon-btn" aria-label="Wishlist">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5"></path>
            </svg>
          </button>

          {/* Cart Drawer Trigger */}
          <button 
            className="icon-btn" 
            onClick={onCartOpen}
            aria-label="Cart"
          >
            <ShoppingBag size={18} />
            {cartCount > 0 && <span className="badge">{cartCount}</span>}
          </button>
        </div>
      </div>
    </header>
  );
}
