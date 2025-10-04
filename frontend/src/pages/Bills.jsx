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
import { getDaySuffix } from "../utils/helpers";
import BillCard from "../components/BillCard";
import ConfirmationModal from "../components/ConfirmationModal";
import EmptyState from "../components/EmptyState";
import BillFormModal from "../components/BillFormModal";
import PaymentActionsModal from "../components/PaymentActionsModal";
import { toast } from "../components/Toast";
import "./Bills.css";

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
        <EmptyState message="No bills yet. Add your first bill to get started!" />
      ) : (
        <div class="bills-list">
          {bills.map((bill) => (
            <BillCard
              key={bill.id}
              bill={bill}
              categories={categories}
              onEdit={handleEditClick}
              onDelete={handleDeleteClick}
              onMarkAsPaid={handleMarkAsPaid}
            />
          ))}
        </div>
      )}

      <BillFormModal
        isOpen={showModal}
        editingBill={editingBill}
        formData={formData}
        categories={categories}
        error={error}
        submitting={submitting}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        onInputChange={handleInputChange}
        onDateChange={handleDateChange}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && billToDelete && (
        <ConfirmationModal
          title="Delete Bill"
          message="Are you sure you want to delete"
          itemName={billToDelete.name}
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
          isDeleting={deleting}
        />
      )}

      {/* Payment Actions Modal */}
      <PaymentActionsModal
        isOpen={showPaymentActions && !!selectedBillForPayment}
        billName={selectedBillForPayment?.name}
        submitting={submitting}
        deleting={deleting}
        onRecordNextPayment={handleRecordNextPayment}
        onDeleteLastPayment={handleDeleteLastPayment}
        onCancel={handleCancelPaymentActions}
      />
    </div>
  );
}
