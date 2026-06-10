import React, { useState } from 'react';
import { ShoppingBag, ChevronLeft, ChevronRight, Check } from 'lucide-react';

export default function ProductCard({ product, branchInventory, onAddToBag }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [sizeError, setSizeError] = useState(false);

  // Extract branch-specific inventory details
  const inventoryItem = branchInventory.find(inv => inv.product_id === product.id);
  const stockQty = inventoryItem ? inventoryItem.quantity : 0;
  const isOutOfStock = stockQty <= 0;

  // Branch pricing override or global price
  const activePrice = (inventoryItem && inventoryItem.price_override !== null && inventoryItem.price_override !== undefined)
    ? inventoryItem.price_override 
    : product.price;

  const originalPrice = product.price * 1.3; // Decorative original price for marketing aesthetics

  const nextImage = (e) => {
    e.stopPropagation();
    if (product.image_urls && product.image_urls.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % product.image_urls.length);
    }
  };

  const prevImage = (e) => {
    e.stopPropagation();
    if (product.image_urls && product.image_urls.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + product.image_urls.length) % product.image_urls.length);
    }
  };

  const handleAddClick = (e) => {
    e.preventDefault();
    if (!selectedSize) {
      setSizeError(true);
      return;
    }
    setSizeError(false);
    onAddToBag(product, selectedSize, activePrice);
  };

  return (
    <article className="product-card">
      <div className="product-image-container">
        {/* Carousel Images */}
        {product.image_urls && product.image_urls.length > 0 ? (
          <img 
            src={product.image_urls[currentImageIndex]} 
            alt={`${product.name} - View ${currentImageIndex + 1}`} 
            loading="lazy" 
          />
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#666' }}>
            No Image
          </div>
        )}

        {/* Carousel Nav Arrows */}
        {product.image_urls && product.image_urls.length > 1 && (
          <>
            <button 
              className="wishlist-btn" 
              style={{ left: 12, right: 'auto' }}
              onClick={prevImage}
              aria-label="Previous image"
            >
              <ChevronLeft size={16} />
            </button>
            <button 
              className="wishlist-btn" 
              onClick={nextImage}
              aria-label="Next image"
            >
              <ChevronRight size={16} />
            </button>
          </>
        )}

        {/* Image Dots */}
        {product.image_urls && product.image_urls.length > 1 && (
          <div className="image-nav-indicator">
            {product.image_urls.map((_, idx) => (
              <span 
                key={idx} 
                className={`image-dot ${idx === currentImageIndex ? 'active' : ''}`}
              />
            ))}
          </div>
        )}

        {/* Essential/Bestseller badge */}
        {product.price > 1500 ? (
          <span className="badge-tag">Luxury</span>
        ) : (
          <span className="badge-tag">Essential</span>
        )}

        {/* Cart Overlay */}
        <div className="add-to-bag-btn-overlay">
          <button 
            className="quick-add-btn"
            onClick={handleAddClick}
            disabled={isOutOfStock}
          >
            <ShoppingBag size={12} />
            {isOutOfStock ? 'Out of stock' : 'Add to Bag'}
          </button>
        </div>
      </div>

      <div className="product-info">
        <div className="product-meta">
          <span>{product.category}</span>
          <span>Qty: {stockQty}</span>
        </div>
        <h3 className="product-title">{product.name}</h3>

        <div className="product-pricing">
          <span className="product-price">₹{activePrice.toLocaleString('en-IN')}</span>
          <span className="product-price-orig">₹{Math.round(originalPrice).toLocaleString('en-IN')}</span>
        </div>

        {/* Size Picker */}
        <div style={{ marginTop: 12 }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 10, textTransform: 'uppercase', color: '#62626a', marginRight: 4 }}>Size:</span>
            {product.sizes && product.sizes.map(size => (
              <button
                key={size}
                type="button"
                className={`size-btn ${selectedSize === size ? 'active' : ''}`}
                style={{ width: 28, height: 28, fontSize: 9 }}
                onClick={() => {
                  setSelectedSize(size);
                  setSizeError(false);
                }}
                disabled={isOutOfStock}
              >
                {size}
              </button>
            ))}
          </div>
          {sizeError && (
            <p style={{ color: '#ef4444', fontSize: 10, marginTop: 4 }}>Please select a size first</p>
          )}
        </div>

        {/* Stock status indicator */}
        <div className="product-stock-status">
          {isOutOfStock ? (
            <span className="status-outofstock">● Out of Stock</span>
          ) : (
            <span className="status-instock">● In Stock</span>
          )}
        </div>
      </div>
    </article>
  );
}
