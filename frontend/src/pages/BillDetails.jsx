import { useState, useEffect } from 'preact/hooks';
import { route } from 'preact-router';
import { getBill, getPayments, createPayment, deletePayment } from '../services/api';

export function BillDetails({ id }) {
  const [bill, setBill] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [paymentFormData, setPaymentFormData] = useState({
    amount: '',
    payment_date: '',
    notes: ''
  });

  useEffect(() => {
    if (id) {
      loadBillDetails();
    }
  }, [id]);

  const loadBillDetails = async () => {
    setLoading(true);
    try {
      const [billData, paymentsData] = await Promise.all([
        getBill(id),
        getPayments(id)
      ]);
      
      setBill(billData);
      setPayments(paymentsData.payments || []);
    } catch (error) {
      console.error('Failed to load bill details:', error);
      setError('Failed to load bill details');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentInputChange = (e) => {
    const { name, value } = e.target;
    setPaymentFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddPayment = () => {
    // Pre-fill with bill amount and today's date
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    setPaymentFormData({
      amount: bill ? bill.amount.toString() : '',
      payment_date: todayStr,
      notes: ''
    });
    setShowPaymentModal(true);
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      if (!paymentFormData.amount || !paymentFormData.payment_date) {
        setError('Please fill in amount and payment date');
        setSubmitting(false);
        return;
      }

      const paymentData = {
        amount: parseFloat(paymentFormData.amount),
        payment_date: new Date(paymentFormData.payment_date).toISOString(),
        notes: paymentFormData.notes
      };

      await createPayment(id, paymentData);
      
      // Reset form and close modal
      setPaymentFormData({
        amount: '',
        payment_date: '',
        notes: ''
      });
      setShowPaymentModal(false);
      
      // Reload data
      await loadBillDetails();
    } catch (error) {
      setError(error.message || 'Failed to create payment');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePaymentCancel = () => {
    setShowPaymentModal(false);
    setError('');
    setPaymentFormData({
      amount: '',
      payment_date: '',
      notes: ''
    });
  };

  const handleDeletePayment = (payment) => {
    setPaymentToDelete(payment);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!paymentToDelete) return;
    
    setDeleting(true);
    try {
      await deletePayment(id, paymentToDelete.id);
      setShowDeleteConfirm(false);
      setPaymentToDelete(null);
      await loadBillDetails();
    } catch (error) {
      console.error('Failed to delete payment:', error);
      alert('Failed to delete payment');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
    setPaymentToDelete(null);
  };

  const handleBack = () => {
    route('/bills');
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getDaySuffix = (day) => {
    if (day >= 11 && day <= 13) return 'th';
    switch (day % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };

  const getBillStatus = (bill) => {
    if (!bill) return 'normal';
    if (bill.is_paid) return 'normal';
    if (!bill.next_due_date) return 'normal';
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(bill.next_due_date);
    dueDate.setHours(0, 0, 0, 0);
    
    if (dueDate < today) return 'overdue';
    if (dueDate.getTime() === today.getTime()) return 'due-today';
    return 'normal';
  };

  if (loading) {
    return <div class="loading">Loading bill details...</div>;
  }

  if (!bill) {
    return (
      <div class="bill-details">
        <div class="page-header">
          <button class="btn btn-secondary back-btn" onClick={handleBack}>
            ← Back to Bills
          </button>
          <h2>Bill Not Found</h2>
        </div>
        <div class="error-message">The requested bill could not be found.</div>
      </div>
    );
  }

  return (
    <div class="bill-details">
      <div class="page-header">
        <button class="btn btn-secondary back-btn" onClick={handleBack}>
          ← Back to Bills
        </button>
        <h2>Bill Details</h2>
      </div>

      {error && <div class="error-message">{error}</div>}

      {/* Bill Information Card */}
      <div class={`bill-info-card ${getBillStatus(bill)}`}>
        <div class="bill-info-header">
          <h3>{bill.name}</h3>
          <span class={`status-badge ${bill.is_paid ? 'paid' : 'unpaid'}`}>
            {bill.is_paid ? 'Paid' : 'Unpaid'}
          </span>
        </div>

        <div class="bill-info-grid">
          <div class="info-item">
            <label>Amount</label>
            <div class="amount-display">${bill.amount.toFixed(2)}</div>
          </div>

          <div class="info-item">
            <label>Due Day</label>
            <div>{bill.due_day}{getDaySuffix(bill.due_day)} of each month</div>
          </div>

          <div class="info-item">
            <label>Next Due Date</label>
            <div class={getBillStatus(bill) === 'overdue' ? 'overdue-text' : getBillStatus(bill) === 'due-today' ? 'due-today-text' : ''}>
              {bill.next_due_date ? formatDate(bill.next_due_date) : 'Not calculated'}
            </div>
          </div>

          <div class="info-item">
            <label>Last Paid</label>
            <div>{bill.last_paid_date ? formatDate(bill.last_paid_date) : 'Never'}</div>
          </div>

          <div class="info-item">
            <label>Category</label>
            <div>{bill.category || 'None'}</div>
          </div>

          <div class="info-item">
            <label>Recurring</label>
            <div>{bill.is_recurring ? 'Yes' : 'No'}</div>
          </div>

          {bill.notes && (
            <div class="info-item notes-item">
              <label>Notes</label>
              <div>{bill.notes}</div>
            </div>
          )}

          <div class="info-item">
            <label>Created</label>
            <div>{formatDateTime(bill.created_at)}</div>
          </div>

          <div class="info-item">
            <label>Last Updated</label>
            <div>{formatDateTime(bill.updated_at)}</div>
          </div>
        </div>
      </div>

      {/* Payments Section */}
      <div class="payments-section">
        <div class="section-header">
          <h3>Payment History</h3>
          <button class="btn btn-primary" onClick={handleAddPayment}>
            Add Payment
          </button>
        </div>

        {payments.length === 0 ? (
          <div class="empty-state">
            <p>No payments recorded for this bill yet.</p>
          </div>
        ) : (
          <div class="payments-table-container">
            <table class="payments-table">
              <thead>
                <tr>
                  <th>Payment Date</th>
                  <th>Amount</th>
                  <th>Notes</th>
                  <th>Recorded On</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {payments.map(payment => (
                  <tr key={payment.id}>
                    <td>{formatDate(payment.payment_date)}</td>
                    <td class="amount-cell">${payment.amount.toFixed(2)}</td>
                    <td class="notes-cell">{payment.notes || '-'}</td>
                    <td>{formatDateTime(payment.created_at)}</td>
                    <td>
                      <button 
                        class="action-btn delete-btn"
                        onClick={() => handleDeletePayment(payment)}
                        title="Delete payment"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {payments.length > 0 && (
          <div class="payments-summary">
            <div class="summary-item">
              <strong>Total Payments: </strong>
              ${payments.reduce((sum, p) => sum + p.amount, 0).toFixed(2)}
            </div>
            <div class="summary-item">
              <strong>Number of Payments: </strong>
              {payments.length}
            </div>
          </div>
        )}
      </div>

      {/* Add Payment Modal */}
      {showPaymentModal && (
        <div class="modal-overlay" onClick={handlePaymentCancel}>
          <div class="modal" onClick={(e) => e.stopPropagation()}>
            <div class="modal-header">
              <h3>Add Payment</h3>
              <button class="close-btn" onClick={handlePaymentCancel}>&times;</button>
            </div>
            
            <form onSubmit={handlePaymentSubmit}>
              <div class="form-group">
                <label for="payment-amount">Amount *</label>
                <input
                  type="number"
                  id="payment-amount"
                  name="amount"
                  value={paymentFormData.amount}
                  onChange={handlePaymentInputChange}
                  required
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                />
              </div>

              <div class="form-group">
                <label for="payment-date">Payment Date *</label>
                <input
                  type="date"
                  id="payment-date"
                  name="payment_date"
                  value={paymentFormData.payment_date}
                  onChange={handlePaymentInputChange}
                  required
                />
              </div>

              <div class="form-group">
                <label for="payment-notes">Notes</label>
                <textarea
                  id="payment-notes"
                  name="notes"
                  value={paymentFormData.notes}
                  onChange={handlePaymentInputChange}
                  rows="3"
                  placeholder="Add any notes about this payment..."
                />
              </div>

              {error && <div class="error-message">{error}</div>}

              <div class="modal-actions">
                <button type="button" class="btn btn-secondary" onClick={handlePaymentCancel}>
                  Cancel
                </button>
                <button type="submit" class="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Adding...' : 'Add Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Payment Confirmation Modal */}
      {showDeleteConfirm && paymentToDelete && (
        <div class="modal-overlay" onClick={handleDeleteCancel}>
          <div class="modal modal-small confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div class="modal-header">
              <h3>Delete Payment</h3>
              <button class="close-btn" onClick={handleDeleteCancel}>&times;</button>
            </div>
            
            <div class="confirm-content">
              <p>Are you sure you want to delete this payment?</p>
              <div class="payment-details">
                <strong>Amount:</strong> ${paymentToDelete.amount.toFixed(2)}<br />
                <strong>Date:</strong> {formatDate(paymentToDelete.payment_date)}
              </div>
              <p class="warning-text">This action cannot be undone.</p>
            </div>

            <div class="modal-actions">
              <button type="button" class="btn btn-secondary" onClick={handleDeleteCancel}>
                Cancel
              </button>
              <button 
                type="button" 
                class="btn btn-danger" 
                onClick={handleDeleteConfirm}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}