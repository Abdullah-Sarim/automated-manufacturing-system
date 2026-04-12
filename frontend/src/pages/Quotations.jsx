import { useState, useEffect } from 'react';
import { getQuotations, getMaterials, getSuppliers, createQuotation, approveQuotation, rejectQuotation } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Quotations = () => {
  const { user } = useAuth();
  const [quotations, setQuotations] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ materialID: '', supplierID: '', expectedPrice: '', expectedDeliveryDate: '', quantity: '' });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [quotesRes, materialsRes, suppliersRes] = await Promise.all([getQuotations(), getMaterials(), getSuppliers()]);
      setQuotations(quotesRes.data);
      setMaterials(materialsRes.data);
      setSuppliers(suppliersRes.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createQuotation(formData);
      setShowModal(false);
      setFormData({ materialID: '', supplierID: '', expectedPrice: '', expectedDeliveryDate: '', quantity: '' });
      fetchData();
      toast.success('Quotation request sent successfully');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error creating quotation');
    }
  };

  const handleApprove = async (id) => {
    try {
      await approveQuotation(id);
      fetchData();
      toast.success('Quotation approved');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error approving quotation');
    }
  };

  const handleReject = async (id) => {
    try {
      await rejectQuotation(id);
      fetchData();
      toast.success('Quotation rejected');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error rejecting quotation');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'approved': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getResponseStatusColor = (status) => {
    const colors = {
      'waiting': 'bg-gray-100 text-gray-800',
      'responded': 'bg-blue-100 text-blue-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) return <div className="p-6">Loading...</div>;

  const waitingQuotes = quotations.filter(q => q.responseStatus === 'waiting');
  const respondedQuotes = quotations.filter(q => q.responseStatus === 'responded');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-secondary">Quotation Management</h1>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">
          Send Quotation Request
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <p className="text-sm opacity-80">Total Requests</p>
          <p className="text-3xl font-bold">{quotations.length}</p>
        </div>
        <div className="card bg-gradient-to-r from-gray-500 to-gray-600 text-white">
          <p className="text-sm opacity-80">Awaiting Response</p>
          <p className="text-3xl font-bold">{waitingQuotes.length}</p>
        </div>
        <div className="card bg-gradient-to-r from-green-500 to-green-600 text-white">
          <p className="text-sm opacity-80">Responded</p>
          <p className="text-3xl font-bold">{respondedQuotes.length}</p>
        </div>
        <div className="card bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
          <p className="text-sm opacity-80">Approved</p>
          <p className="text-3xl font-bold">{quotations.filter(q => q.status === 'approved').length}</p>
        </div>
      </div>

      {respondedQuotes.length > 0 && (
        <div className="card border-l-4 border-green-400">
          <h2 className="text-xl font-semibold mb-4 text-green-700">Supplier Responses - Ready for Review</h2>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Material</th>
                  <th>Supplier</th>
                  <th>Qty</th>
                  <th>Expected Price</th>
                  <th>Expected Delivery</th>
                  <th>Supplier Price</th>
                  <th>Supplier Delivery</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {respondedQuotes.map(quote => (
                  <tr key={quote.quoteID}>
                    <td>#{quote.quoteID}</td>
                    <td>{quote.materialName || '-'}</td>
                    <td>{quote.companyName}</td>
                    <td>{quote.quantity || '-'}</td>
                    <td className="text-gray-500">${quote.expectedPrice || '-'}</td>
                    <td className="text-gray-500">{quote.expectedDeliveryDate || '-'}</td>
                    <td className="font-bold text-green-600">${quote.price}</td>
                    <td className="font-bold text-green-600">{quote.deliveryDate}</td>
                    <td>
                      {quote.status === 'pending' && (
                        <>
                          <button onClick={() => handleApprove(quote.quoteID)} className="text-success hover:underline mr-3">Approve</button>
                          <button onClick={() => handleReject(quote.quoteID)} className="text-danger hover:underline">Reject</button>
                        </>
                      )}
                      {quote.status === 'approved' && <span className="badge badge-completed">Approved</span>}
                      {quote.status === 'rejected' && <span className="badge badge-cancelled">Rejected</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="card">
        <h2 className="text-xl font-semibold mb-4">All Quotation Requests</h2>
        {quotations.length === 0 ? (
          <p className="text-gray-500">No quotation requests yet.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Material</th>
                <th>Supplier</th>
                <th>Qty</th>
                <th>Expected Price</th>
                <th>Expected Delivery</th>
                <th>Supplier Response</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {quotations.map(quote => (
                <tr key={quote.quoteID}>
                  <td>#{quote.quoteID}</td>
                  <td>{quote.materialName || '-'}</td>
                  <td>{quote.companyName}</td>
                  <td>{quote.quantity || '-'}</td>
                  <td>${quote.expectedPrice || '-'}</td>
                  <td>{quote.expectedDeliveryDate || '-'}</td>
                  <td>
                    {quote.responseStatus === 'waiting' ? (
                      <span className="text-gray-400">Waiting...</span>
                    ) : (
                      <div>
                        <div className="font-semibold">${quote.price}</div>
                        <div className="text-xs text-gray-500">{quote.deliveryDate}</div>
                      </div>
                    )}
                  </td>
                  <td>
                    <span className={`badge ${getStatusColor(quote.status)}`}>{quote.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Send Quotation Request</h2>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Supplier</label>
                  <select className="input" value={formData.supplierID} onChange={e => setFormData({...formData, supplierID: e.target.value})} required>
                    <option value="">Select Supplier</option>
                    {suppliers.map(s => <option key={s.supplierID} value={s.supplierID}>{s.companyName}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Material</label>
                  <select className="input" value={formData.materialID} onChange={e => setFormData({...formData, materialID: e.target.value})} required>
                    <option value="">Select Material</option>
                    {materials.map(m => <option key={m.materialID} value={m.materialID}>{m.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                  <input type="number" min="1" className="input" value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expected Price ($)</label>
                  <input type="number" step="0.01" className="input" value={formData.expectedPrice} onChange={e => setFormData({...formData, expectedPrice: e.target.value})} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expected Delivery Date</label>
                  <input type="date" className="input" value={formData.expectedDeliveryDate} onChange={e => setFormData({...formData, expectedDeliveryDate: e.target.value})} required />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Send Request</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Quotations;