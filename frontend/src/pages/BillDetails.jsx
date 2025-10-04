import { useState, useEffect } from "preact/hooks";
import { route } from "preact-router";
import {
  getBill,
  getPayments,
  createPayment,
  deletePayment,
} from "../services/api";
import { getBillStatus, getDaySuffix, dateInputToISO } from "../utils/helpers";
import ConfirmationModal from "../components/ConfirmationModal";
import EmptyState from "../components/EmptyState";
import PaymentFormModal from "../components/PaymentFormModal";
import PaymentsTable from "../components/PaymentsTable";
import { toast } from "../components/Toast";

export function BillDetails({ id }) {
  // useToast removed, use react-toastify's toast directly
  const [bill, setBill] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [paymentFormData, setPaymentFormData] = useState({
    amount: "",
    payment_date: "",
    notes: "",
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
        getPayments(id),
      ]);

      setBill(billData);
      setPayments(paymentsData.payments || []);
    } catch (error) {
      console.error("Failed to load bill details:", error);
      setError("Failed to load bill details");
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentInputChange = (e) => {
    const { name, value } = e.target;
    setPaymentFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddPayment = () => {
    // Pre-fill with bill amount and next due date
    const nextDueDate = bill?.next_due_date
      ? new Date(bill.next_due_date)
      : new Date();
    const dateStr = nextDueDate.toISOString().split("T")[0]; // YYYY-MM-DD format

    setPaymentFormData({
      amount: bill ? bill.amount.toString() : "",
      payment_date: dateStr,
      notes: "",
    });
    setShowPaymentModal(true);
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      if (!paymentFormData.amount || !paymentFormData.payment_date) {
        setError("Please fill in amount and payment date");
        setSubmitting(false);
        return;
      }

      const paymentData = {
        amount: parseFloat(paymentFormData.amount),
        payment_date: dateInputToISO(paymentFormData.payment_date),
        notes: paymentFormData.notes,
      };

      await createPayment(id, paymentData);

      // Reset form and close modal
      setPaymentFormData({
        amount: "",
        payment_date: "",
        notes: "",
      });
      setShowPaymentModal(false);

      // Reload data
      await loadBillDetails();
      toast.success("Payment recorded successfully!");
    } catch (error) {
      setError(error.message || "Failed to create payment");
      toast.error(error.message || "Failed to create payment");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePaymentCancel = () => {
    setShowPaymentModal(false);
    setError("");
    setPaymentFormData({
      amount: "",
      payment_date: "",
      notes: "",
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
      toast.success("Payment deleted successfully!");
    } catch (error) {
      console.error("Failed to delete payment:", error);
      toast.error("Failed to delete payment. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
    setPaymentToDelete(null);
  };

  const handleBack = () => {
    route("/bills");
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString();
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
      <div
        class={`card p-8 mb-8 relative transition-all ${
          getBillStatus(bill) === "due-today"
            ? "bg-gradient-to-br from-yellow-50 to-white border-l-4 border-warning"
            : getBillStatus(bill) === "overdue"
            ? "bg-gradient-to-br from-red-50 to-white border-l-4 border-danger"
            : ""
        }`}
      >
        <div class="flex justify-between items-center mb-8 pb-4 border-b border-border">
          <h3 class="m-0 text-3xl text-text-primary font-bold">{bill.name}</h3>
          <span
            class={`px-4 py-2 rounded-full text-sm font-semibold uppercase tracking-wide ${
              bill.is_paid
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {bill.is_paid ? "Paid" : "Unpaid"}
          </span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div class="flex flex-col gap-2">
            <label class="text-xs text-text-secondary uppercase tracking-wide font-semibold">
              Amount
            </label>
            <div class="text-3xl font-bold text-primary">
              ${bill.amount.toFixed(2)}
            </div>
          </div>

          <div class="flex flex-col gap-2">
            <label class="text-xs text-text-secondary uppercase tracking-wide font-semibold">
              Recurrence Type
            </label>
            <div class="text-lg text-text-primary font-medium">
              {bill.recurrence_type === "fixed_date" && "Monthly (Fixed Date)"}
              {bill.recurrence_type === "interval" && "Every X Days (Interval)"}
              {bill.recurrence_type === "none" && "One-time"}
            </div>
          </div>

          <div class="flex flex-col gap-2">
            <label class="text-xs text-text-secondary uppercase tracking-wide font-semibold">
              {bill.recurrence_type === "fixed_date"
                ? "Due Day"
                : bill.recurrence_type === "interval"
                ? "Interval"
                : "Day Value"}
            </label>
            <div class="text-lg text-text-primary font-medium">
              {bill.recurrence_type === "fixed_date" &&
                `${bill.recurrence_days}${getDaySuffix(
                  bill.recurrence_days
                )} of each month`}
              {bill.recurrence_type === "interval" &&
                `Every ${bill.recurrence_days} day${
                  bill.recurrence_days !== 1 ? "s" : ""
                }`}
              {bill.recurrence_type === "none" && bill.recurrence_days}
            </div>
          </div>

          {(bill.recurrence_type === "interval" ||
            bill.recurrence_type === "none") &&
            bill.start_date && (
              <div class="flex flex-col gap-2">
                <label class="text-xs text-text-secondary uppercase tracking-wide font-semibold">
                  {bill.recurrence_type === "interval"
                    ? "Start Date"
                    : "Due Date"}
                </label>
                <div class="text-lg text-text-primary font-medium">
                  {formatDate(bill.start_date)}
                </div>
              </div>
            )}

          <div class="flex flex-col gap-2">
            <label class="text-xs text-text-secondary uppercase tracking-wide font-semibold">
              Next Due Date
            </label>
            <div
              class={`text-lg font-medium ${
                getBillStatus(bill) === "overdue"
                  ? "text-danger font-semibold"
                  : getBillStatus(bill) === "due-today"
                  ? "text-warning font-semibold"
                  : "text-text-primary"
              }`}
            >
              {bill.next_due_date
                ? formatDate(bill.next_due_date)
                : "Not calculated"}
            </div>
          </div>

          <div class="flex flex-col gap-2">
            <label class="text-xs text-text-secondary uppercase tracking-wide font-semibold">
              Last Paid
            </label>
            <div class="text-lg text-text-primary font-medium">
              {bill.last_paid_date ? formatDate(bill.last_paid_date) : "Never"}
            </div>
          </div>

          <div class="flex flex-col gap-2">
            <label class="text-xs text-text-secondary uppercase tracking-wide font-semibold">
              Category
            </label>
            <div class="text-lg text-text-primary font-medium">
              {bill.category || "None"}
            </div>
          </div>

          {bill.notes && (
            <div class="flex flex-col gap-2 col-span-full">
              <label class="text-xs text-text-secondary uppercase tracking-wide font-semibold">
                Notes
              </label>
              <div class="text-base text-text-secondary italic leading-relaxed">
                {bill.notes}
              </div>
            </div>
          )}

          <div class="flex flex-col gap-2">
            <label class="text-xs text-text-secondary uppercase tracking-wide font-semibold">
              Created
            </label>
            <div class="text-lg text-text-primary font-medium">
              {formatDateTime(bill.created_at)}
            </div>
          </div>

          <div class="flex flex-col gap-2">
            <label class="text-xs text-text-secondary uppercase tracking-wide font-semibold">
              Last Updated
            </label>
            <div class="text-lg text-text-primary font-medium">
              {formatDateTime(bill.updated_at)}
            </div>
          </div>
        </div>
      </div>

      {/* Payments Section */}
      <div class="card p-8">
        <div class="flex justify-between items-center mb-8 pb-4 border-b border-border">
          <h3 class="m-0 text-2xl text-text-primary font-bold">
            Payment History
          </h3>
          <button class="btn btn-primary" onClick={handleAddPayment}>
            Add Payment
          </button>
        </div>

        {payments.length === 0 ? (
          <EmptyState message="No payments recorded for this bill yet." />
        ) : (
          <PaymentsTable
            payments={payments}
            formatDate={formatDate}
            formatDateTime={formatDateTime}
            onDeletePayment={handleDeletePayment}
          />
        )}
      </div>

      {/* Add Payment Modal */}
      <PaymentFormModal
        isOpen={showPaymentModal}
        formData={paymentFormData}
        error={error}
        submitting={submitting}
        onSubmit={handlePaymentSubmit}
        onCancel={handlePaymentCancel}
        onInputChange={handlePaymentInputChange}
      />

      {/* Delete Payment Confirmation Modal */}
      {showDeleteConfirm && paymentToDelete && (
        <ConfirmationModal
          title="Delete Payment"
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
          isDeleting={deleting}
        >
          <p class="mb-4">Are you sure you want to delete this payment?</p>
          <div class="bg-bg p-4 rounded-md mb-4 font-mono text-sm">
            <strong>Amount:</strong> ${paymentToDelete.amount.toFixed(2)}
            <br />
            <strong>Date:</strong> {formatDate(paymentToDelete.payment_date)}
          </div>
          <p class="text-danger font-medium">This action cannot be undone.</p>
        </ConfirmationModal>
      )}
    </div>
  );
}
