import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, Trash2, ShoppingBag } from 'lucide-react';
import { isMockMode, supabase, mockDb } from '../supabaseClient';

export default function CartDrawer({ 
  isOpen, 
  onClose, 
  cartItems, 
  onUpdateQty, 
  onRemoveItem, 
  onClearCart,
  selectedBranch, 
  branchInventory 
}) {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [checkoutError, setCheckoutError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stockWarnings, setStockWarnings] = useState({});

  // Calculate Subtotal
  const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const totalAmount = subtotal;

  // Validate stock levels
  useEffect(() => {
    const warnings = {};
    cartItems.forEach(item => {
      const invItem = branchInventory.find(inv => inv.product_id === item.product_id);
      const stock = invItem ? invItem.quantity : 0;
      if (item.quantity > stock) {
        warnings[item.product_id] = `Only ${stock} pieces available in this branch.`;
      }
    });
    setStockWarnings(warnings);
  }, [cartItems, branchInventory]);

  const hasStockErrors = Object.keys(stockWarnings).length > 0;

  const generateOrderNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}${month}${day}`;
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `BT-${dateStr}-${rand}`;
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (cartItems.length === 0) return;
    if (!customerName || !customerPhone || !customerAddress) {
      setCheckoutError('Please fill out all delivery details.');
      return;
    }
    if (hasStockErrors) {
      setCheckoutError('Please resolve out-of-stock items before checking out.');
      return;
    }

    setIsSubmitting(true);
    setCheckoutError('');

    try {
      const orderNumber = generateOrderNumber();

      if (isMockMode) {
        // --- LOCAL STORAGE MOCK FLOW ---
        // 1. Save Customer
        const customers = mockDb.getCustomers();
        const newCustomer = {
          id: `c_${Date.now()}`,
          name: customerName,
          phone: customerPhone,
          address: customerAddress,
          created_at: new Date().toISOString()
        };
        customers.push(newCustomer);
        mockDb.saveCustomers(customers);

        // 2. Save Order
        const orders = mockDb.getOrders();
        const newOrder = {
          id: `o_${Date.now()}`,
          order_number: orderNumber,
          customer_id: newCustomer.id,
          branch_id: selectedBranch.id,
          total_amount: totalAmount,
          status: 'pending',
          items: cartItems.map(item => ({
            product_id: item.product_id,
            name: item.name,
            quantity: item.quantity,
            size: item.size,
            price: item.price
          })),
          payment_method: 'whatsapp',
          payment_status: 'unpaid',
          payment_details: {},
          created_at: new Date().toISOString()
        };
        orders.push(newOrder);
        mockDb.saveOrders(orders);

        // Trigger WhatsApp Redirect
        triggerWhatsApp(orderNumber);
      } else {
        // --- REAL SUPABASE DB FLOW ---
        // 1. Insert Customer
        const { data: customerData, error: custError } = await supabase
          .from('customers')
          .insert({
            name: customerName,
            phone: customerPhone,
            address: customerAddress
          })
          .select()
          .single();

        if (custError) throw custError;

        // 2. Insert Order
        const { error: orderError } = await supabase
          .from('orders')
          .insert({
            order_number: orderNumber,
            customer_id: customerData.id,
            branch_id: selectedBranch.id,
            total_amount: totalAmount,
            status: 'pending',
            items: cartItems.map(item => ({
              product_id: item.product_id,
              name: item.name,
              quantity: item.quantity,
              size: item.size,
              price: item.price
            })),
            payment_method: 'whatsapp',
            payment_status: 'unpaid',
            payment_details: {}
          });

        if (orderError) throw orderError;

        // Trigger WhatsApp Redirect
        triggerWhatsApp(orderNumber);
      }

      // Cleanup
      setCustomerName('');
      setCustomerPhone('');
      setCustomerAddress('');
      onClearCart();
      onClose();

    } catch (err) {
      console.error('Checkout failed:', err);
      setCheckoutError(err.message || 'An error occurred during checkout. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const triggerWhatsApp = (orderNumber) => {
    // Compile WhatsApp text message
    let productLines = cartItems.map(item => `* ${item.name} x ${item.quantity} [Size: ${item.size}]`).join('\n');

    const message = `New Order Received

Order ID: ${orderNumber}
Customer Name: ${customerName}
Phone: ${customerPhone}
Branch: ${selectedBranch.name}

Products:
${productLines}

Total Amount: ₹${totalAmount.toLocaleString('en-IN')}

Delivery Address:
${customerAddress}

Please confirm and pack the order.`;

    const cleanPhone = selectedBranch.whatsapp_number.replace(/[^\d+]/g, '');
    const encodedMessage = encodeURIComponent(message);
    const waUrl = `https://wa.me/${cleanPhone.replace('+', '')}?text=${encodedMessage}`;

    // Redirect to WhatsApp Web/App in a new window
    window.open(waUrl, '_blank');
  };

  return (
    <>
      <div 
        className={`drawer-backdrop ${isOpen ? 'open' : ''}`}
        onClick={onClose}
      >
        <div 
          className="drawer-container"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="drawer-header">
            <h2 className="drawer-title">Shopping Bag</h2>
            <button className="drawer-close-btn" onClick={onClose}>
              <X size={24} />
            </button>
          </div>

          {/* Content */}
          <div className="drawer-content">
            {cartItems.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60%', color: '#62626a' }}>
                <ShoppingBag size={48} style={{ marginBottom: 16 }} />
                <p>Your shopping bag is empty.</p>
                <p style={{ fontSize: 12, marginTop: 8 }}>Select a branch and add item selections.</p>
              </div>
            ) : (
              <>
                <div className="cart-items-list">
                  {cartItems.map((item) => (
                    <div className="cart-item" key={`${item.product_id}-${item.size}`}>
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.name} className="cart-item-img" />
                      ) : (
                        <div className="cart-item-img" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666', background: '#000' }}>No Img</div>
                      )}
                      <div className="cart-item-details">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <h4 className="cart-item-title">{item.name}</h4>
                          <button 
                            style={{ color: '#ef4444' }} 
                            onClick={() => onRemoveItem(item.product_id, item.size)}
                            title="Remove item"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <p className="cart-item-meta">Size: {item.size}</p>
                        
                        {/* Stock warning alert */}
                        {stockWarnings[item.product_id] && (
                          <p style={{ color: '#ef4444', fontSize: 10, marginTop: 4 }}>
                            {stockWarnings[item.product_id]}
                          </p>
                        )}

                        <div className="cart-item-qty-row">
                          <div className="qty-counter">
                            <button 
                              onClick={() => onUpdateQty(item.product_id, item.size, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                            >
                              <Minus size={12} />
                            </button>
                            <span>{item.quantity}</span>
                            <button 
                              onClick={() => onUpdateQty(item.product_id, item.size, item.quantity + 1)}
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                          <span className="cart-item-price">₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Delivery Form */}
                <form className="checkout-form" onSubmit={handleCheckout}>
                  <h3 className="checkout-form-title">Delivery Details</h3>
                  
                  <div className="form-group">
                    <label htmlFor="cust-name">Customer Name</label>
                    <input 
                      type="text" 
                      id="cust-name"
                      className="form-input" 
                      required 
                      value={customerName} 
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="John Doe"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="cust-phone">Phone Number</label>
                    <input 
                      type="tel" 
                      id="cust-phone"
                      className="form-input" 
                      required 
                      value={customerPhone} 
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="9876543210"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="cust-address">Delivery Address</label>
                    <textarea 
                      id="cust-address"
                      className="form-input" 
                      style={{ minHeight: 80, resize: 'vertical' }}
                      required 
                      value={customerAddress} 
                      onChange={(e) => setCustomerAddress(e.target.value)}
                      placeholder="Flat No, Street, Landmark, City, State"
                    />
                  </div>
                </form>
              </>
            )}
          </div>

          {/* Footer summary */}
          {cartItems.length > 0 && (
            <div className="drawer-footer">
              <div className="cart-summary-row">
                <span>Selected Branch</span>
                <span style={{ color: '#d4af37', textTransform: 'uppercase', fontSize: 12, fontWeight: 600 }}>
                  {selectedBranch?.name}
                </span>
              </div>
              <div className="cart-summary-row total">
                <span>Subtotal</span>
                <span>₹{totalAmount.toLocaleString('en-IN')}</span>
              </div>

              {checkoutError && (
                <p style={{ color: '#ef4444', fontSize: 12, marginBottom: 12, textAlign: 'center' }}>
                  {checkoutError}
                </p>
              )}

              <button 
                className="place-order-btn" 
                onClick={handleCheckout}
                disabled={isSubmitting || hasStockErrors}
              >
                {isSubmitting ? 'Processing Order...' : 'Place Order via WhatsApp'}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
