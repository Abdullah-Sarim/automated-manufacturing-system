import { useState, useEffect } from 'react';
import { getQuotations, respondQuotation, generateSupplierBill } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const SupplierQuotations = () => {
  const { user } = useAuth();
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showBillModal, setShowBillModal] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [formData, setFormData] = useState({ price: '', deliveryDate: '' });
  const [dueDate, setDueDate] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const quotesRes = await getQuotations();
      setQuotations(quotesRes.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = (quote) => {
    setSelectedQuote(quote);
    setFormData({ price: quote.expectedPrice || '', deliveryDate: quote.expectedDeliveryDate || '', quantity: quote.quantity || '' });
    setShowModal(true);
  };

  const handleSubmitResponse = async (e) => {
    e.preventDefault();
    try {
      await respondQuotation(selectedQuote.quoteID, formData);
      setShowModal(false);
      setSelectedQuote(null);
      setFormData({ price: '', deliveryDate: '' });
      fetchData();
      toast.success('Response submitted successfully');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error submitting response');
    }
  };

  const handleGenerateBill = async () => {
    try {
      await generateSupplierBill(selectedQuote.quoteID, { dueDate, deliveryDate });
      setShowBillModal(false);
      setDueDate('');
      setDeliveryDate('');
      setSelectedQuote(null);
      fetchData();
      toast.success('Bill generated successfully. WAMS has been notified.');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error generating bill');
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
      <h1 className="text-2xl font-bold text-secondary">Quotation Requests</h1>
      <p className="text-gray-600">Review quotation requests and submit your response with price and delivery date.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
          <p className="text-sm opacity-80">Awaiting Your Response</p>
          <p className="text-3xl font-bold">{waitingQuotes.length}</p>
        </div>
        <div className="card bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <p className="text-sm opacity-80">Responded</p>
          <p className="text-3xl font-bold">{respondedQuotes.length}</p>
        </div>
        <div className="card bg-gradient-to-r from-green-500 to-green-600 text-white">
          <p className="text-sm opacity-80">Approved</p>
          <p className="text-3xl font-bold">{quotations.filter(q => q.status === 'approved').length}</p>
        </div>
      </div>

      {waitingQuotes.length > 0 && (
        <div className="card border-l-4 border-yellow-400">
          <h2 className="text-xl font-semibold mb-4 text-yellow-700">Action Required - Respond to These Requests</h2>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Request ID</th>
                  <th>Material</th>
                  <th>Quantity</th>
                  <th>Expected Price</th>
                  <th>Expected Delivery</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {waitingQuotes.map(quote => (
                  <tr key={quote.quoteID}>
                    <td>#{quote.quoteID}</td>
                    <td>{quote.materialName || 'Raw Material'}</td>
                    <td>{quote.quantity || '-'}</td>
                    <td className="font-semibold">${quote.expectedPrice}</td>
                    <td>{quote.expectedDeliveryDate}</td>
                    <td>
                      <span className={`badge ${getResponseStatusColor(quote.responseStatus)}`}>Waiting</span>
                    </td>
                    <td>
                      <button 
                        onClick={() => handleRespond(quote)}
                        className="px-4 py-2 bg-primary text-white rounded hover:bg-blue-700 transition-colors"
                      >
                        Respond Now
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Your Quotation History</h2>
        {quotations.length === 0 ? (
          <div className="text-center py-8">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-500">No quotation requests yet.</p>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Material</th>
                <th>Qty</th>
                <th>Expected Price</th>
                <th>Expected Delivery</th>
                <th>Your Price</th>
                <th>Your Delivery</th>
                <th>Response Status</th>
                <th>Final Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {quotations.map(quote => (
                <tr key={quote.quoteID}>
                  <td>#{quote.quoteID}</td>
                  <td>{quote.materialName || 'Raw Material'}</td>
                  <td>{quote.quantity || '-'}</td>
                  <td className="text-gray-500">${quote.expectedPrice}</td>
                  <td className="text-gray-500">{quote.expectedDeliveryDate}</td>
                  <td>
                    {quote.responseStatus === 'waiting' ? (
                      <span className="text-gray-400">-</span>
                    ) : (
                      <span className="font-bold text-green-600">${quote.price}</span>
                    )}
                  </td>
                  <td>
                    {quote.responseStatus === 'waiting' ? (
                      <span className="text-gray-400">-</span>
                    ) : (
                      <span className="font-bold text-green-600">{quote.deliveryDate}</span>
                    )}
                  </td>
                  <td>
                    <span className={`badge ${getResponseStatusColor(quote.responseStatus)}`}>
                      {quote.responseStatus === 'responded' ? 'Responded' : 'Waiting'}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${getStatusColor(quote.status)}`}>
                      {quote.status}
                    </span>
                  </td>
                  <td>
                    {quote.status === 'approved' && (
                      <button 
                        onClick={() => { setSelectedQuote(quote); setShowBillModal(true); }}
                        className="text-accent hover:underline text-sm"
                      >
                        Generate Bill
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && selectedQuote && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Respond to Quotation #{selectedQuote.quoteID}</h2>
            
            <div className="bg-blue-50 p-4 rounded-lg mb-4">
              <h3 className="font-semibold text-blue-800 mb-2">Request Details</h3>
              <p className="text-sm"><strong>Material:</strong> {selectedQuote.materialName || 'Raw Material'}</p>
              <p className="text-sm"><strong>Quantity:</strong> {selectedQuote.quantity || '-'}</p>
              <p className="text-sm"><strong>Expected Price:</strong> ${selectedQuote.expectedPrice}</p>
              <p className="text-sm"><strong>Expected Delivery:</strong> {selectedQuote.expectedDeliveryDate}</p>
            </div>

            <form onSubmit={handleSubmitResponse}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                  <input 
                    type="number" 
                    className="input bg-gray-100" 
                    value={selectedQuote.quantity || ''} 
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Your Price ($)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    className="input" 
                    placeholder="Enter your price"
                    value={formData.price} 
                    onChange={e => setFormData({...formData, price: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Your Delivery Date</label>
                  <input 
                    type="date" 
                    className="input" 
                    value={formData.deliveryDate} 
                    onChange={e => setFormData({...formData, deliveryDate: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Submit Response</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showBillModal && selectedQuote && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Generate Bill</h2>
            <div className="space-y-3 mb-4">
              <div className="p-3 bg-gray-50 rounded">
                <p className="text-sm text-gray-600">Quotation #{selectedQuote.quoteID}</p>
                <p className="font-semibold">{selectedQuote.materialName || 'Raw Material'}</p>
                <p className="text-lg font-bold text-primary">${selectedQuote.price}</p>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Due Date (optional)</label>
                <input 
                  type="date" 
                  className="input" 
                  value={dueDate} 
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Delivery Date (optional)</label>
                <input 
                  type="date" 
                  className="input" 
                  value={deliveryDate} 
                  onChange={(e) => setDeliveryDate(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button type="button" onClick={() => { setShowBillModal(false); setDueDate(''); setDeliveryDate(''); setSelectedQuote(null); }} className="btn btn-secondary">Cancel</button>
              <button type="button" onClick={handleGenerateBill} className="btn btn-primary">Generate Bill</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplierQuotations;