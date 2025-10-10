import { useState, useEffect } from 'preact/hooks'
import { route } from 'preact-router'
import { getBill, getPayments, createPayment, deletePayment } from '../services/api'
import { getBillStatus, getDaySuffix, dateInputToISO } from '../utils/helpers'
import ConfirmationModal from '../components/ConfirmationModal'
import EmptyState from '../components/EmptyState'
import PaymentFormModal from '../components/PaymentFormModal'
import PaymentsTable from '../components/PaymentsTable'
import { toast } from '../components/Toast'
import { Button, Pill } from '../uielements'
import { useCallback } from 'react'

export function BillDetails({ id }) {
  // useToast removed, use react-toastify's toast directly
  const [bill, setBill] = useState(null)
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [paymentToDelete, setPaymentToDelete] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const [paymentFormData, setPaymentFormData] = useState({
    amount: '',
    payment_date: '',
    notes: '',
  })

  const loadBillDetails = useCallback(async () => {
    setLoading(true)
    try {
      const [billData, paymentsData] = await Promise.all([getBill(id), getPayments(id)])

      setBill(billData)
      setPayments(paymentsData.payments || [])
    } catch (error) {
      console.error('Failed to load bill details:', error) // eslint-disable-line no-console -- We only allow console logging for debugging purposes
      setError('Failed to load bill details')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    if (id) {
      loadBillDetails()
    }
  }, [id, loadBillDetails])

  const handlePaymentInputChange = (e) => {
    const { name, value } = e.target
    setPaymentFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleAddPayment = () => {
    // Pre-fill with bill amount and next due date
    const nextDueDate = bill?.next_due_date ? new Date(bill.next_due_date) : new Date()
    const dateStr = nextDueDate.toISOString().split('T')[0] // YYYY-MM-DD format

    setPaymentFormData({
      amount: bill ? bill.amount.toString() : '',
      payment_date: dateStr,
      notes: '',
    })
    setShowPaymentModal(true)
  }

  const handlePaymentSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      if (!paymentFormData.amount || !paymentFormData.payment_date) {
        setError('Please fill in amount and payment date')
        setSubmitting(false)
        return
      }

      const paymentData = {
        amount: parseFloat(paymentFormData.amount),
        payment_date: dateInputToISO(paymentFormData.payment_date),
        notes: paymentFormData.notes,
      }

      await createPayment(id, paymentData)

      // Reset form and close modal
      setPaymentFormData({
        amount: '',
        payment_date: '',
        notes: '',
      })
      setShowPaymentModal(false)

      // Reload data
      await loadBillDetails()
      toast.success('Payment recorded successfully!')
    } catch (error) {
      setError(error.message || 'Failed to create payment')
      toast.error(error.message || 'Failed to create payment')
    } finally {
      setSubmitting(false)
    }
  }

  const handlePaymentCancel = () => {
    setShowPaymentModal(false)
    setError('')
    setPaymentFormData({
      amount: '',
      payment_date: '',
      notes: '',
    })
  }

  const handleDeletePayment = (payment) => {
    setPaymentToDelete(payment)
    setShowDeleteConfirm(true)
  }

  const handleDeleteConfirm = async () => {
    if (!paymentToDelete) return

    setDeleting(true)
    try {
      await deletePayment(id, paymentToDelete.id)
      setShowDeleteConfirm(false)
      setPaymentToDelete(null)
      await loadBillDetails()
      toast.success('Payment deleted successfully!')
    } catch (error) {
      console.error('Failed to delete payment:', error) // eslint-disable-line no-console -- We only allow console logging for debugging purposes
      toast.error('Failed to delete payment. Please try again.')
    } finally {
      setDeleting(false)
    }
  }

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false)
    setPaymentToDelete(null)
  }

  const handleBack = () => {
    route('/bills')
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString()
  }

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString()
  }

  if (loading) {
    return <div class="text-gray flex min-h-screen items-center justify-center text-xl">Loading...</div>
  }

  if (!bill) {
    return (
      <div>
        <div class="pb-2">
          <Button variant="secondaryHollow" onClick={handleBack}>
            ← Back to Bills
          </Button>
        </div>
        <div class="text-danger-dark text-center">The requested bill could not be found.</div>
      </div>
    )
  }

  return (
    <div>
      <div class="pb-2">
        <Button variant="secondaryHollow" onClick={handleBack}>
          ← Back to Bills
        </Button>
      </div>

      {error && <div class="text-danger-dark text-center">{error}</div>}

      {/* Bill Information Card */}
      <div
        class={`cardstatic relative mb-8 p-8 transition-all ${
          getBillStatus(bill) === 'due-today'
            ? 'card-highlight-warning'
            : getBillStatus(bill) === 'overdue'
              ? 'card-highlight-danger'
              : ''
        }`}
      >
        <div class="mb-8 flex items-center justify-between border-b border-gray-200 pb-4">
          <h3 class="text-primary m-0 text-3xl font-bold">{bill.name}</h3>
          <Pill variant={bill.is_paid ? 'success' : 'danger'} size="lg">
            {bill.is_paid ? 'Paid' : 'Unpaid'}
          </Pill>
        </div>

        <div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div class="flex flex-col gap-2">
            <label class="text-gray text-xs font-semibold tracking-wide uppercase">Amount</label>
            <div class="text-primary text-3xl font-bold">${bill.amount.toFixed(2)}</div>
          </div>

          <div class="flex flex-col gap-2">
            <label class="text-gray text-xs font-semibold tracking-wide uppercase">Recurrence Type</label>
            <div class="text-gray text-lg font-medium">
              {bill.recurrence_type === 'fixed_date' && 'Monthly (Fixed Date)'}
              {bill.recurrence_type === 'interval' && 'Every X Days (Interval)'}
              {bill.recurrence_type === 'none' && 'One-time'}
            </div>
          </div>

          <div class="flex flex-col gap-2">
            <label class="text-gray text-xs font-semibold tracking-wide uppercase">
              {bill.recurrence_type === 'fixed_date'
                ? 'Due Day'
                : bill.recurrence_type === 'interval'
                  ? 'Interval'
                  : 'Day Value'}
            </label>
            <div class="text-gray text-lg font-medium">
              {bill.recurrence_type === 'fixed_date' &&
                `${bill.recurrence_days}${getDaySuffix(bill.recurrence_days)} of each month`}
              {bill.recurrence_type === 'interval' &&
                `Every ${bill.recurrence_days} day${bill.recurrence_days !== 1 ? 's' : ''}`}
              {bill.recurrence_type === 'none' && bill.recurrence_days}
            </div>
          </div>

          {(bill.recurrence_type === 'interval' || bill.recurrence_type === 'none') && bill.start_date && (
            <div class="flex flex-col gap-2">
              <label class="text-gray text-xs font-semibold tracking-wide uppercase">
                {bill.recurrence_type === 'interval' ? 'Start Date' : 'Due Date'}
              </label>
              <div class="text-gray text-lg font-medium">{formatDate(bill.start_date)}</div>
            </div>
          )}

          <div class="flex flex-col gap-2">
            <label class="text-gray text-xs font-semibold tracking-wide uppercase">Next Due Date</label>
            <div
              class={`text-lg font-medium ${
                getBillStatus(bill) === 'overdue'
                  ? 'text-danger-dark font-semibold'
                  : getBillStatus(bill) === 'due-today'
                    ? 'text-warning-dark font-semibold'
                    : 'text-gray'
              }`}
            >
              {bill.next_due_date ? formatDate(bill.next_due_date) : 'Not calculated'}
            </div>
          </div>

          <div class="flex flex-col gap-2">
            <label class="text-gray text-xs font-semibold tracking-wide uppercase">Last Paid</label>
            <div class="text-gray text-lg font-medium">
              {bill.last_paid_date ? formatDate(bill.last_paid_date) : 'Never'}
            </div>
          </div>

          <div class="flex flex-col gap-2">
            <label class="text-gray text-xs font-semibold tracking-wide uppercase">Category</label>
            <div class="text-gray text-lg font-medium">{bill.category || 'None'}</div>
          </div>

          {bill.notes && (
            <div class="col-span-full flex flex-col gap-2">
              <label class="text-gray text-xs font-semibold tracking-wide uppercase">Notes</label>
              <div class="text-gray text-base leading-relaxed italic">{bill.notes}</div>
            </div>
          )}

          <div class="flex flex-col gap-2">
            <label class="text-gray text-xs font-semibold tracking-wide uppercase">Created</label>
            <div class="text-gray text-lg font-medium">{formatDateTime(bill.created_at)}</div>
          </div>

          <div class="flex flex-col gap-2">
            <label class="text-gray text-xs font-semibold tracking-wide uppercase">Last Updated</label>
            <div class="text-gray text-lg font-medium">{formatDateTime(bill.updated_at)}</div>
          </div>
        </div>
      </div>

      {/* Payments Section */}
      <div class="cardstatic p-8">
        <div class="mb-8 flex items-center justify-between border-b border-gray-200 pb-4">
          <h3 class="text-primary m-0 text-2xl font-bold">Payment History</h3>
          <Button variant="primary" onClick={handleAddPayment}>
            Add Payment
          </Button>
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
          <div class="bg-card-bg mb-4 rounded-md p-4 font-mono text-sm">
            <strong>Amount:</strong> ${paymentToDelete.amount.toFixed(2)}
            <br />
            <strong>Date:</strong> {formatDate(paymentToDelete.payment_date)}
          </div>
          <p class="text-danger font-medium">This action cannot be undone.</p>
        </ConfirmationModal>
      )}
    </div>
  )
}
