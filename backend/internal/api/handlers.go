package api

import (
	"net/http"

	"github.com/cryptk/williams/internal/models"
	"github.com/cryptk/williams/pkg/utils"
	"github.com/gin-gonic/gin"
)

// Bill handlers

func (s *Server) listBills(c *gin.Context) {
	// Get authenticated user ID
	userID, _ := c.Get("user_id")

	bills, err := s.billService.ListBillsByUser(userID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"bills": bills,
		"total": len(bills),
	})
}

func (s *Server) getBill(c *gin.Context) {
	id := c.Param("id")

	bill, err := s.billService.GetBill(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Bill not found",
			"id":    id,
		})
		return
	}

	c.JSON(http.StatusOK, bill)
}

func (s *Server) createBill(c *gin.Context) {
	// Get authenticated user ID
	userID, _ := c.Get("user_id")

	var bill models.Bill
	if err := c.ShouldBindJSON(&bill); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Set the user ID for the bill
	bill.UserID = userID.(string)

	if err := s.billService.CreateBill(&bill); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, bill)
}

func (s *Server) updateBill(c *gin.Context) {
	id := c.Param("id")

	var bill models.Bill
	if err := c.ShouldBindJSON(&bill); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	bill.ID = id
	if err := s.billService.UpdateBill(&bill); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, bill)
}

func (s *Server) deleteBill(c *gin.Context) {
	id := c.Param("id")

	if err := s.billService.DeleteBill(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Bill deleted successfully",
		"id":      id,
	})
}

// Category handlers

func (s *Server) listCategories(c *gin.Context) {
	categories, err := s.categoryService.ListCategories()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"categories": categories,
	})
}

func (s *Server) createCategory(c *gin.Context) {
	var category models.Category
	if err := c.ShouldBindJSON(&category); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := s.categoryService.CreateCategory(&category); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, category)
}

func (s *Server) deleteCategory(c *gin.Context) {
	id := c.Param("id")

	if err := s.categoryService.DeleteCategory(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Category deleted successfully",
		"id":      id,
	})
}

// Statistics handlers

func (s *Server) getStatsSummary(c *gin.Context) {
	// Get authenticated user ID
	userID, _ := c.Get("user_id")

	stats, err := s.billService.GetStatsByUser(userID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, stats)
}

// Payment handlers

func (s *Server) createPayment(c *gin.Context) {
	billID := c.Param("id")

	var payment models.Payment
	if err := c.ShouldBindJSON(&payment); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	payment.BillID = billID

	// Convert payment date to application timezone
	payment.PaymentDate = utils.ConvertToAppTimezone(payment.PaymentDate)

	if err := s.billService.CreatePayment(&payment); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, payment)
}

func (s *Server) listPayments(c *gin.Context) {
	billID := c.Param("id")

	payments, err := s.billService.GetPaymentsByBill(billID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"payments": payments,
		"total":    len(payments),
	})
}

func (s *Server) deletePayment(c *gin.Context) {
	paymentID := c.Param("payment_id")

	if err := s.billService.DeletePayment(paymentID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Payment deleted successfully",
		"id":      paymentID,
	})
}
