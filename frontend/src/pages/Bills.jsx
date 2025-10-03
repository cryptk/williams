import { useState, useEffect } from "preact/hooks";
import { route } from "preact-router";
import {
  getBills,
  createBill,
  updateBill,
  deleteBill,
  getCategories,
  createPayment,
  getPayments,
  deletePayment,
} from "../services/api";
import { getBillStatus, getDaySuffix } from "../utils/helpers";
import { toast } from "../components/Toast";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

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
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    amount: "",
    recurrence_days: "",
    category_id: "",
    is_paid: false,
    recurrence_type: "fixed_date",
    start_date: null,
    notes: "",
  });

  useEffect(() => {
    loadBills();
    loadCategories();
  }, []);

  const loadBills = async () => {
    console.log("Loading bills...");
    try {
      const data = await getBills();
      setBills(data.bills || []);
    } catch (error) {
      console.error("Failed to load bills:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await getCategories();
      setCategories(data.categories || []);
    } catch (error) {
      console.error("Failed to load categories:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleDateChange = (date) => {
    setFormData((prev) => ({
      ...prev,
      start_date: date,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      // Validate form
      if (!formData.name || !formData.amount || !formData.recurrence_days) {
        setError("Please fill in all required fields");
        setSubmitting(false);
        return;
      }

      // Prepare data for API
      const billData = {
        name: formData.name,
        amount: parseFloat(formData.amount),
        recurrence_days: parseInt(formData.recurrence_days),
        category_id: formData.category_id || null,
        recurrence_type: formData.recurrence_type,
        start_date: formData.start_date
          ? formData.start_date.toISOString()
          : null,
        notes: formData.notes,
      };

      if (editingBill) {
        // Update existing bill - preserve user_id
        billData.user_id = editingBill.user_id;
        await updateBill(editingBill.id, billData);
        toast.success("Bill updated successfully!");
      } else {
        // Create new bill
        await createBill(billData);
        toast.success("Bill created successfully!");
      }

      // Reset form and close modal
      setFormData({
        name: "",
        amount: "",
        recurrence_days: "",
        category_id: "",
        is_paid: false,
        recurrence_type: "fixed_date",
        start_date: null,
        notes: "",
      });
      setEditingBill(null);
      setShowModal(false);

      // Reload bills
      await loadBills();
    } catch (error) {
      setError(
        error.message || `Failed to ${editingBill ? "update" : "create"} bill`
      );
      toast.error(
        error.message || `Failed to ${editingBill ? "update" : "create"} bill`
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    setShowModal(false);
    setEditingBill(null);
    setError("");
    setFormData({
      name: "",
      amount: "",
      recurrence_days: "",
      category_id: "",
      is_paid: false,
      recurrence_type: "fixed_date",
      start_date: null,
      notes: "",
    });
  };

  const handleEditClick = (bill) => {
    setEditingBill(bill);
    setFormData({
      name: bill.name,
      amount: bill.amount.toString(),
      recurrence_days: bill.recurrence_days.toString(),
      category_id: bill.category_id || "",
      is_paid: bill.is_paid,
      recurrence_type: bill.recurrence_type || "none",
      start_date: bill.start_date ? new Date(bill.start_date) : null,
      notes: bill.notes || "",
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
        notes: "Payment recorded from UI",
      };
      await createPayment(bill.id, paymentData);
      await loadBills();
      toast.success("Payment recorded successfully!");
    } catch (error) {
      console.error("Failed to record payment:", error);
      toast.error("Failed to record payment. Please try again.");
    }
  };

  const handleRecordNextPayment = async () => {
    if (!selectedBillForPayment) return;

    setSubmitting(true);
    try {
      const paymentData = {
        amount: selectedBillForPayment.amount,
        // Use the bill's next_due_date as the payment date (we're paying for that due date)
        payment_date:
          selectedBillForPayment.next_due_date || new Date().toISOString(),
        notes: "Next payment recorded from UI",
      };
      await createPayment(selectedBillForPayment.id, paymentData);
      setShowPaymentActions(false);
      setSelectedBillForPayment(null);
      await loadBills();
      toast.success("Next payment recorded successfully!");
    } catch (error) {
      console.error("Failed to record payment:", error);
      toast.error("Failed to record payment. Please try again.");
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
        toast.info("No payments found to delete");
        return;
      }

      // Get the most recent payment (they're ordered DESC by payment_date)
      const latestPayment = payments[0];

      // Delete it
      await deletePayment(selectedBillForPayment.id, latestPayment.id);
      setShowPaymentActions(false);
      setSelectedBillForPayment(null);
      await loadBills();
      toast.success("Last payment deleted successfully!");
    } catch (error) {
      console.error("Failed to delete payment:", error);
      toast.error("Failed to delete payment. Please try again.");
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
      toast.success("Bill deleted successfully!");
    } catch (error) {
      console.error("Failed to delete bill:", error);
      toast.error("Failed to delete bill. Please try again.");
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
        <button class="btn btn-primary" onClick={() => setShowModal(true)}>
          Add Bill
        </button>
      </div>

      {bills.length === 0 ? (
        <div class="empty-state">
          <p>No bills yet. Add your first bill to get started!</p>
        </div>
      ) : (
        <div class="bills-list">
          {bills.map((bill) => (
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
              {bill.recurrence_type === "fixed_date" && (
                <p class="due-date">
                  Due Day: {bill.recurrence_days}
                  {getDaySuffix(bill.recurrence_days)} of each month
                </p>
              )}
              {bill.recurrence_type === "interval" && (
                <p class="due-date">
                  Due every: {bill.recurrence_days} day
                  {bill.recurrence_days !== 1 ? "s" : ""}
                </p>
              )}
              {bill.recurrence_type === "none" && (
                <p class="due-date">One-time bill</p>
              )}
              {bill.next_due_date && (
                <p class="due-date">
                  Next Due: {new Date(bill.next_due_date).toLocaleDateString()}
                </p>
              )}
              {bill.last_paid_date && (
                <p class="due-date">
                  Last Paid:{" "}
                  {new Date(bill.last_paid_date).toLocaleDateString()}
                </p>
              )}
              {bill.category_id && (
                <p class="category">
                  {categories.find((cat) => cat.id === bill.category_id)
                    ?.name || "Unknown Category"}
                </p>
              )}
              {bill.notes && <p class="notes">{bill.notes}</p>}
              <div class="bill-footer">
                <span class={`status ${bill.is_paid ? "paid" : "unpaid"}`}>
                  {bill.is_paid ? "Paid" : "Unpaid"}
                </span>
                {bill.recurrence_type === "fixed_date" && (
                  <span class="badge">Monthly</span>
                )}
                {bill.recurrence_type === "interval" && (
                  <span class="badge">Interval</span>
                )}
                <button
                  class={`btn-mark-paid ${bill.is_paid ? "paid" : ""}`}
                  onClick={() => handleMarkAsPaid(bill)}
                  title="Record payment"
                >
                  {bill.is_paid ? "✓ Paid" : "Record Payment"}
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
              <h3>{editingBill ? "Edit Bill" : "Add New Bill"}</h3>
              <button class="close-btn" onClick={handleCancel}>
                &times;
              </button>
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
                <label for="recurrence_type">Recurrence *</label>
                <div
                  class="recurrence-sentence"
                  role="group"
                  aria-labelledby="recurrence-label"
                >
                  <span id="recurrence-label" class="sentence-text">
                    Due
                  </span>
                  <select
                    id="recurrence_type"
                    name="recurrence_type"
                    value={formData.recurrence_type}
                    onChange={handleInputChange}
                    class="inline-select"
                    aria-label="Recurrence type"
                    required
                  >
                    <option value="none">once</option>
                    <option value="fixed_date">monthly</option>
                    <option value="interval">every</option>
                  </select>

                  {formData.recurrence_type === "fixed_date" && (
                    <>
                      <span class="sentence-text">on the</span>
                      <input
                        type="number"
                        id="recurrence_days_fixed"
                        name="recurrence_days"
                        value={formData.recurrence_days}
                        onChange={handleInputChange}
                        class="inline-number-input"
                        aria-label="Day of month (1-31)"
                        aria-describedby="day-suffix-fixed"
                        required
                        min="1"
                        max="31"
                        placeholder="15"
                      />
                      <span id="day-suffix-fixed" class="sentence-text">
                        {formData.recurrence_days
                          ? getDaySuffix(parseInt(formData.recurrence_days))
                          : "th"}{" "}
                        of the month
                      </span>
                    </>
                  )}

                  {formData.recurrence_type === "interval" && (
                    <>
                      <input
                        type="number"
                        id="recurrence_days_interval"
                        name="recurrence_days"
                        value={formData.recurrence_days}
                        onChange={handleInputChange}
                        class="inline-number-input"
                        aria-label="Recurrence interval in days (1-365)"
                        aria-describedby="interval-suffix"
                        required
                        min="1"
                        max="365"
                        placeholder="14"
                      />
                      <span id="interval-suffix" class="sentence-text">
                        day{formData.recurrence_days !== "1" ? "s" : ""}{" "}
                        starting on
                      </span>
                      <DatePicker
                        selected={formData.start_date}
                        onChange={handleDateChange}
                        dateFormat="MM/dd/yyyy"
                        placeholderText="Select date"
                        className="inline-date-picker"
                        ariaLabelledBy="interval-start-label"
                        id="start_date_interval"
                        required
                      />
                      <span id="interval-start-label" class="visually-hidden">
                        Start date for interval recurrence
                      </span>
                    </>
                  )}

                  {formData.recurrence_type === "none" && (
                    <>
                      <span class="sentence-text">on</span>
                      <DatePicker
                        selected={formData.start_date}
                        onChange={handleDateChange}
                        dateFormat="MM/dd/yyyy"
                        placeholderText="Select date"
                        className="inline-date-picker"
                        ariaLabelledBy="due-date-label"
                        id="start_date_once"
                        required
                      />
                      <span id="due-date-label" class="visually-hidden">
                        Due date for one-time bill
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div class="form-group">
                <label htmlFor="category_id">Category</label>
                <select
                  id="category_id"
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleInputChange}
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
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

              {error && <div class="error-message">{error}</div>}

              <div class="modal-actions">
                <button
                  type="button"
                  class="btn btn-secondary"
                  onClick={handleCancel}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  class="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting
                    ? editingBill
                      ? "Updating..."
                      : "Adding..."
                    : editingBill
                    ? "Update Bill"
                    : "Add Bill"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && billToDelete && (
        <div class="modal-overlay" onClick={handleDeleteCancel}>
          <div
            class="modal modal-small confirm-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div class="modal-header">
              <h3>Delete Bill</h3>
              <button class="close-btn" onClick={handleDeleteCancel}>
                &times;
              </button>
            </div>

            <div class="confirm-content">
              <p>
                Are you sure you want to delete{" "}
                <strong>{billToDelete.name}</strong>?
              </p>
              <p class="warning-text">This action cannot be undone.</p>
            </div>

            <div class="modal-actions">
              <button
                type="button"
                class="btn btn-secondary"
                onClick={handleDeleteCancel}
              >
                Cancel
              </button>
              <button
                type="button"
                class="btn btn-danger"
                onClick={handleDeleteConfirm}
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Actions Modal */}
      {showPaymentActions && selectedBillForPayment && (
        <div class="modal-overlay" onClick={handleCancelPaymentActions}>
          <div
            class="modal modal-small confirm-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div class="modal-header">
              <h3>Payment Actions</h3>
              <button class="close-btn" onClick={handleCancelPaymentActions}>
                &times;
              </button>
            </div>

            <div class="confirm-content">
              <p>
                What would you like to do for{" "}
                <strong>{selectedBillForPayment.name}</strong>?
              </p>
              <div class="payment-actions-buttons">
                <button
                  class="btn btn-primary"
                  onClick={handleRecordNextPayment}
                  disabled={submitting || deleting}
                >
                  {submitting ? "Recording..." : "Record Next Payment"}
                </button>
                <button
                  class="btn btn-danger"
                  onClick={handleDeleteLastPayment}
                  disabled={submitting || deleting}
                >
                  {deleting ? "Deleting..." : "Delete Last Payment"}
                </button>
              </div>
            </div>

            <div class="modal-actions">
              <button
                type="button"
                class="btn btn-secondary"
                onClick={handleCancelPaymentActions}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
