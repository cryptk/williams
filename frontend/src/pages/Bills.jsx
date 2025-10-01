import { useState, useEffect } from 'preact/hooks';
import { route } from 'preact-router';
import { getBills, createBill, updateBill, deleteBill, getCategories, createPayment, getPayments, deletePayment } from '../services/api';

export function Bills() {
  const [bills, setBills] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPaymentActions, setShowPaymentActions] = useState(false);
  const [editingBill, setEditingBill] = useState(null);
  const [billToDelete, setBillToDelete] = useState(null);
  const [selectedBillForPayment, setSelectedBillForPayment] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    due_day: '',
    category: '',
    is_paid: false,
    is_recurring: true,
    notes: ''
  });

  // Helper function to add ordinal suffix to day numbers
  const getDaySuffix = (day) => {
    if (day >= 11 && day <= 13) return 'th';
    switch (day % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };

  // Helper function to determine bill status for styling
  const getBillStatus = (bill) => {
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

  useEffect(() => {
    loadBills();
    loadCategories();
  }, []);

  const loadBills = async () => {
    console.log('Loading bills...');
    try {
      const data = await getBills();
      setBills(data.bills || []);
    } catch (error) {
      console.error('Failed to load bills:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await getCategories();
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      // Validate form
      if (!formData.name || !formData.amount || !formData.due_day) {
        setError('Please fill in all required fields');
        setSubmitting(false);
        return;
      }

      // Prepare data for API
      const billData = {
        name: formData.name,
        amount: parseFloat(formData.amount),
        due_day: parseInt(formData.due_day),
        category: formData.category,
        is_recurring: formData.is_recurring,
        notes: formData.notes
      };

      if (editingBill) {
        // Update existing bill - preserve user_id
        billData.user_id = editingBill.user_id;
        await updateBill(editingBill.id, billData);
      } else {
        // Create new bill
        await createBill(billData);
      }
      
      // Reset form and close modal
      setFormData({
        name: '',
        amount: '',
        due_day: '',
        category: '',
        is_paid: false,
        is_recurring: true,
        notes: ''
      });
      setEditingBill(null);
      setShowModal(false);
      
      // Reload bills
      await loadBills();
    } catch (error) {
      setError(error.message || `Failed to ${editingBill ? 'update' : 'create'} bill`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    setShowModal(false);
    setEditingBill(null);
    setError('');
    setFormData({
      name: '',
      amount: '',
      due_day: '',
      category: '',
      is_paid: false,
      is_recurring: true,
      notes: ''
    });
  };

  const handleEditClick = (bill) => {
    setEditingBill(bill);
    setFormData({
      name: bill.name,
      amount: bill.amount.toString(),
      due_day: bill.due_day.toString(),
      category: bill.category || '',
      is_paid: bill.is_paid,
      is_recurring: bill.is_recurring,
      notes: bill.notes || ''
    });
    setShowModal(true);
  };

  const handleMarkAsPaid = async (bill) => {
    // If bill is already paid, show action options
    if (bill.is_paid) {
      setSelectedBillForPayment(bill);
      setShowPaymentActions(true);
      return;
    }
    
    // If not paid, record payment directly
    try {
      const paymentData = {
        amount: bill.amount,
        // Use the bill's next_due_date as the payment date (we're paying for that due date)
        payment_date: bill.next_due_date || new Date().toISOString(),
        notes: 'Payment recorded from UI'
      };
      await createPayment(bill.id, paymentData);
      await loadBills();
    } catch (error) {
      console.error('Failed to record payment:', error);
      alert('Failed to record payment');
    }
  };

  const handleRecordNextPayment = async () => {
    if (!selectedBillForPayment) return;
    
    setSubmitting(true);
    try {
      const paymentData = {
        amount: selectedBillForPayment.amount,
        // Use the bill's next_due_date as the payment date (we're paying for that due date)
        payment_date: selectedBillForPayment.next_due_date || new Date().toISOString(),
        notes: 'Next payment recorded from UI'
      };
      await createPayment(selectedBillForPayment.id, paymentData);
      setShowPaymentActions(false);
      setSelectedBillForPayment(null);
      await loadBills();
    } catch (error) {
      console.error('Failed to record payment:', error);
      alert('Failed to record payment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteLastPayment = async () => {
    if (!selectedBillForPayment) return;
    
    setDeleting(true);
    try {
      // Get the payments for this bill
      const paymentsData = await getPayments(selectedBillForPayment.id);
      const payments = paymentsData.payments || [];
      
      if (payments.length === 0) {
        alert('No payments found to delete');
        return;
      }
      
      // Get the most recent payment (they're ordered DESC by payment_date)
      const latestPayment = payments[0];
      
      // Delete it
      await deletePayment(selectedBillForPayment.id, latestPayment.id);
      setShowPaymentActions(false);
      setSelectedBillForPayment(null);
      await loadBills();
    } catch (error) {
      console.error('Failed to delete payment:', error);
      alert('Failed to delete payment');
    } finally {
      setDeleting(false);
    }
  };

  const handleCancelPaymentActions = () => {
    setShowPaymentActions(false);
    setSelectedBillForPayment(null);
  };

  const handleDeleteClick = (bill) => {
    setBillToDelete(bill);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!billToDelete) return;
    
    setDeleting(true);
    try {
      await deleteBill(billToDelete.id);
      setShowDeleteConfirm(false);
      setBillToDelete(null);
      await loadBills();
    } catch (error) {
      console.error('Failed to delete bill:', error);
      alert('Failed to delete bill');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
    setBillToDelete(null);
  };

  if (loading) {
    return <div class="loading">Loading...</div>;
  }

  return (
    <div class="bills">
      <div class="page-header">
        <h2>Bills</h2>
        <button class="btn btn-primary" onClick={() => setShowModal(true)}>Add Bill</button>
      </div>
      
      {bills.length === 0 ? (
        <div class="empty-state">
          <p>No bills yet. Add your first bill to get started!</p>
        </div>
      ) : (
        <div class="bills-list">
          {bills.map(bill => (
            <div key={bill.id} class={`bill-card ${getBillStatus(bill)}`}>
              <div class="bill-header">
                <h3>{bill.name}</h3>
                <div class="bill-actions">
                  <button 
                    class="action-btn view-btn" 
                    onClick={() => route(`/bills/${bill.id}`)}
                    title="View details"
                  >
                    👁️
                  </button>
                  <button 
                    class="action-btn edit-btn" 
                    onClick={() => handleEditClick(bill)}
                    title="Edit bill"
                  >
                    ✏️
                  </button>
                  <button 
                    class="action-btn delete-btn" 
                    onClick={() => handleDeleteClick(bill)}
                    title="Delete bill"
                  >
                    🗑️
                  </button>
                </div>
              </div>
              <p class="amount">${bill.amount.toFixed(2)}</p>
              <p class="due-date">Due Day: {bill.due_day}{getDaySuffix(bill.due_day)} of each month</p>
              {bill.next_due_date && (
                <p class="due-date">Next Due: {new Date(bill.next_due_date).toLocaleDateString()}</p>
              )}
              {bill.last_paid_date && (
                <p class="due-date">Last Paid: {new Date(bill.last_paid_date).toLocaleDateString()}</p>
              )}
              {bill.category && <p class="category">{bill.category}</p>}
              {bill.notes && <p class="notes">{bill.notes}</p>}
              <div class="bill-footer">
                <span class={`status ${bill.is_paid ? 'paid' : 'unpaid'}`}>
                  {bill.is_paid ? 'Paid' : 'Unpaid'}
                </span>
                {bill.is_recurring && <span class="badge">Recurring</span>}
                <button 
                  class={`btn-mark-paid ${bill.is_paid ? 'paid' : ''}`}
                  onClick={() => handleMarkAsPaid(bill)}
                  title="Record payment"
                >
                  {bill.is_paid ? '✓ Paid' : 'Record Payment'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div class="modal-overlay" onClick={handleCancel}>
          <div class="modal" onClick={(e) => e.stopPropagation()}>
            <div class="modal-header">
              <h3>{editingBill ? 'Edit Bill' : 'Add New Bill'}</h3>
              <button class="close-btn" onClick={handleCancel}>&times;</button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div class="form-group">
                <label for="name">Bill Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., Electric Bill"
                />
              </div>

              <div class="form-group">
                <label for="amount">Amount *</label>
                <input
                  type="number"
                  id="amount"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  required
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                />
              </div>

              <div class="form-group">
                <label for="due_day">Due Day of Month *</label>
                <input
                  type="number"
                  id="due_day"
                  name="due_day"
                  value={formData.due_day}
                  onChange={handleInputChange}
                  required
                  min="1"
                  max="31"
                  placeholder="e.g., 15 (for 15th of each month)"
                />
                <small class="form-help">Enter the day of the month (1-31) when this bill is due</small>
              </div>

              <div class="form-group">
                <label for="category">Category</label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                >
                  <option value="">Select a category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div class="form-group">
                <label for="notes">Notes</label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows="3"
                  placeholder="Add any notes about this bill..."
                />
              </div>

              <div class="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="is_paid"
                    checked={formData.is_paid}
                    onChange={handleInputChange}
                  />
                  <span>Mark as paid</span>
                </label>
              </div>

              <div class="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="is_recurring"
                    checked={formData.is_recurring}
                    onChange={handleInputChange}
                  />
                  <span>Recurring bill</span>
                </label>
              </div>

              {error && <div class="error-message">{error}</div>}

              <div class="modal-actions">
                <button type="button" class="btn btn-secondary" onClick={handleCancel}>
                  Cancel
                </button>
                <button type="submit" class="btn btn-primary" disabled={submitting}>
                  {submitting ? (editingBill ? 'Updating...' : 'Adding...') : (editingBill ? 'Update Bill' : 'Add Bill')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && billToDelete && (
        <div class="modal-overlay" onClick={handleDeleteCancel}>
          <div class="modal modal-small confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div class="modal-header">
              <h3>Delete Bill</h3>
              <button class="close-btn" onClick={handleDeleteCancel}>&times;</button>
            </div>
            
            <div class="confirm-content">
              <p>Are you sure you want to delete <strong>{billToDelete.name}</strong>?</p>
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

      {/* Payment Actions Modal */}
      {showPaymentActions && selectedBillForPayment && (
        <div class="modal-overlay" onClick={handleCancelPaymentActions}>
          <div class="modal modal-small confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div class="modal-header">
              <h3>Payment Actions</h3>
              <button class="close-btn" onClick={handleCancelPaymentActions}>&times;</button>
            </div>
            
            <div class="confirm-content">
              <p>What would you like to do for <strong>{selectedBillForPayment.name}</strong>?</p>
              <div class="payment-actions-buttons">
                <button 
                  class="btn btn-primary" 
                  onClick={handleRecordNextPayment}
                  disabled={submitting || deleting}
                >
                  {submitting ? 'Recording...' : 'Record Next Payment'}
                </button>
                <button 
                  class="btn btn-danger" 
                  onClick={handleDeleteLastPayment}
                  disabled={submitting || deleting}
                >
                  {deleting ? 'Deleting...' : 'Delete Last Payment'}
                </button>
              </div>
            </div>

            <div class="modal-actions">
              <button type="button" class="btn btn-secondary" onClick={handleCancelPaymentActions}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
