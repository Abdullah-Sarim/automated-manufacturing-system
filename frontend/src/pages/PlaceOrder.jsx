import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getProducts, createOrder, createBulkOrders } from '../utils/api';
import toast from 'react-hot-toast';

const PlaceOrder = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState({});
  const [quantities, setQuantities] = useState({});
  const [showCart, setShowCart] = useState(false);
  const [ordering, setOrdering] = useState(false);

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async () => {
    try {
      const res = await getProducts();
      setProducts(res.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (product) => {
    const qty = quantities[product.productID] || 1;
    setCart(prev => ({
      ...prev,
      [product.productID]: {
        ...product,
        orderQuantity: qty,
        totalPrice: product.price * qty
      }
    }));
  };

  const handleQuantityChange = (productID, qty) => {
    setQuantities(prev => ({ ...prev, [productID]: parseInt(qty) || 1 }));
  };

  const handleRemoveFromCart = (productID) => {
    const newCart = { ...cart };
    delete newCart[productID];
    setCart(newCart);
  };

  const handleSingleOrder = async (product) => {
    try {
      setOrdering(true);
      const qty = quantities[product.productID] || 1;
      await createOrder({ productID: product.productID, quantity: qty });
      toast.success(`Order placed for ${qty} x ${product.name}`);
      setQuantities(prev => ({ ...prev, [product.productID]: 1 }));
      fetchProducts();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error placing order');
    } finally {
      setOrdering(false);
    }
  };

  const handleBulkOrder = async () => {
    try {
      setOrdering(true);
      const items = Object.entries(cart).map(([productID, item]) => ({
        productID: parseInt(productID),
        quantity: item.orderQuantity
      }));
      await createBulkOrders({ items });
      toast.success(`Successfully placed ${items.length} order(s)`);
      setCart({});
      setQuantities({});
      setShowCart(false);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error placing orders');
    } finally {
      setOrdering(false);
    }
  };

  const cartTotal = Object.values(cart).reduce((sum, item) => sum + item.totalPrice, 0);
  const cartCount = Object.keys(cart).length;

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-secondary">Place Order</h1>
          <p className="text-gray-600">Select products and place your order</p>
        </div>
        <button 
          onClick={() => setShowCart(true)} 
          className="btn btn-primary flex items-center gap-2"
          disabled={cartCount === 0}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 8a2 2 0 100 4 2 2 0 000-4z" />
          </svg>
          Cart ({cartCount})
        </button>
      </div>

      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Available Products</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map(product => (
            <div key={product.productID} className="border rounded-lg p-4 hover:shadow-lg transition-shadow">
              <h3 className="font-semibold text-lg">{product.name}</h3>
              <p className="text-gray-600 text-sm mb-2">{product.description}</p>
              <div className="flex justify-between items-center mb-2">
                <span className="text-2xl font-bold text-primary">${product.price}</span>
                <span className={`badge ${product.stock > 0 ? 'badge-completed' : 'badge-cancelled'}`}>
                  {product.stock > 0 ? `In Stock: ${product.stock}` : 'Out of Stock'}
                </span>
              </div>
              <p className="text-xs text-gray-500 mb-3">Reorder Level: {product.reorderLevel}</p>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  value={quantities[product.productID] || 1}
                  onChange={(e) => handleQuantityChange(product.productID, e.target.value)}
                  className="input w-20"
                  placeholder="Qty"
                />
                <button
                  onClick={() => handleAddToCart(product)}
                  disabled={!product.stock || ordering}
                  className="btn btn-secondary flex-1"
                >
                  Add to Cart
                </button>
                <button
                  onClick={() => handleSingleOrder(product)}
                  disabled={!product.stock || ordering}
                  className="btn btn-primary flex-1"
                >
                  Order Now
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showCart && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Shopping Cart</h2>
              <button onClick={() => setShowCart(false)} className="text-gray-500 hover:text-gray-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {cartCount === 0 ? (
              <p className="text-gray-500 text-center py-8">Your cart is empty</p>
            ) : (
              <>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Unit Price</th>
                      <th>Quantity</th>
                      <th>Total</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(cart).map(([productID, item]) => (
                      <tr key={productID}>
                        <td>{item.name}</td>
                        <td>${item.price}</td>
                        <td>{item.orderQuantity}</td>
                        <td>${item.totalPrice}</td>
                        <td>
                          <button
                            onClick={() => handleRemoveFromCart(productID)}
                            className="text-danger hover:underline"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="font-bold">
                      <td colSpan="3">Grand Total</td>
                      <td>${cartTotal.toFixed(2)}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
                
                <div className="flex justify-end gap-3 mt-4">
                  <button
                    onClick={() => setShowCart(false)}
                    className="btn btn-secondary"
                  >
                    Continue Shopping
                  </button>
                  <button
                    onClick={handleBulkOrder}
                    disabled={ordering}
                    className="btn btn-primary"
                  >
                    {ordering ? 'Placing Order...' : `Place Order (${cartCount} items)`}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PlaceOrder;