import { useState, useEffect } from 'react';
import { getProducts, createProduct, updateProduct, updateProductStock, deleteProduct, getLowStockProducts } from '../utils/api';
import toast from 'react-hot-toast';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', price: '', stock: '', reorderLevel: '' });
  const [stockData, setStockData] = useState({ quantity: '', operation: 'add' });
  const [editId, setEditId] = useState(null);
  const [stockProductId, setStockProductId] = useState(null);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await updateProduct(editId, formData);
      } else {
        await createProduct(formData);
      }
      setShowModal(false);
      setFormData({ name: '', description: '', price: '', stock: '', reorderLevel: '' });
      setEditId(null);
      fetchProducts();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error saving product');
    }
  };

  const handleEdit = (product) => {
    setFormData({ name: product.name, description: product.description || '', price: product.price, stock: product.stock, reorderLevel: product.reorderLevel });
    setEditId(product.productID);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure?')) {
      await deleteProduct(id);
      fetchProducts();
    }
  };

  const handleStockUpdate = async (e) => {
    e.preventDefault();
    try {
      await updateProductStock(stockProductId, stockData);
      setShowStockModal(false);
      setStockData({ quantity: '', operation: 'add' });
      setStockProductId(null);
      fetchProducts();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error updating stock');
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-secondary">Products</h1>
        <button onClick={() => { setEditId(null); setFormData({ name: '', description: '', price: '', stock: '', reorderLevel: '' }); setShowModal(true); }} className="btn btn-primary">Add Product</button>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Description</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Reorder Level</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map(product => (
              <tr key={product.productID}>
                <td>{product.productID}</td>
                <td>{product.name}</td>
                <td>{product.description || '-'}</td>
                <td>${product.price}</td>
                <td className={product.stock <= product.reorderLevel ? 'text-danger font-semibold' : ''}>{product.stock}</td>
                <td>{product.reorderLevel}</td>
                <td>
                  <button onClick={() => { setStockProductId(product.productID); setShowStockModal(true); }} className="text-accent hover:underline mr-3">Stock</button>
                  <button onClick={() => handleEdit(product)} className="text-blue-600 hover:underline mr-3">Edit</button>
                  <button onClick={() => handleDelete(product.productID)} className="text-danger hover:underline">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{editId ? 'Edit Product' : 'Add Product'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="space-y-3">
                <input type="text" placeholder="Product Name" className="input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                <textarea placeholder="Description" className="input" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                <input type="number" placeholder="Price" className="input" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} required />
                <input type="number" placeholder="Stock" className="input" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} />
                <input type="number" placeholder="Reorder Level" className="input" value={formData.reorderLevel} onChange={e => setFormData({...formData, reorderLevel: e.target.value})} />
              </div>
              <div className="flex justify-end space-x-3 mt-4">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">{editId ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showStockModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Update Stock</h2>
            <form onSubmit={handleStockUpdate}>
              <div className="space-y-3">
                <select className="input" value={stockData.operation} onChange={e => setStockData({...stockData, operation: e.target.value})}>
                  <option value="add">Add Stock</option>
                  <option value="remove">Remove Stock</option>
                </select>
                <input type="number" placeholder="Quantity" className="input" value={stockData.quantity} onChange={e => setStockData({...stockData, quantity: e.target.value})} required />
              </div>
              <div className="flex justify-end space-x-3 mt-4">
                <button type="button" onClick={() => setShowStockModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Update</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;