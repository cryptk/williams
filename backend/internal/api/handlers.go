package api

import (
	"net/http"

	"errors"

	"github.com/cryptk/williams/internal/models"
	"github.com/cryptk/williams/pkg/utils"
	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog/log"
	"gorm.io/gorm"
)

// fetchTenancyFromContext fetches the user_id and scoped_db from the context with error checking.
func fetchTenancyFromContext(c *gin.Context) (string, *gorm.DB, error) {
	userIDRaw, ok := c.Get("user_id")
	if !ok {
		return "", nil, errors.New("user_id not found in context")
	}
	userID, ok := userIDRaw.(string)
	if !ok {
		return "", nil, errors.New("user_id in context is not a string")
	}
	scopedDBRaw, ok := c.Get("scoped_db")
	if !ok {
		return "", nil, errors.New("scoped_db not found in context")
	}
	scopedDB, ok := scopedDBRaw.(*gorm.DB)
	if !ok {
		return "", nil, errors.New("scoped_db in context is not a *gorm.DB")
	}
	return userID, scopedDB, nil
}

// Bill handlers

func (s *Server) listBills(c *gin.Context) {
	// SECURITY: Always set user_id from JWT, never from request body
	userID, scopedDB, err := fetchTenancyFromContext(c)
	if err != nil {
		log.Error().Err(err).Msg("Failed to fetch tenancy from context")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	bills, err := s.billService.List(scopedDB)
	if err != nil {
		log.Error().Err(err).Str("user_id", userID).Msg("Failed to list bills")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve bills"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"bills": bills,
		"total": len(bills),
	})
}

func (s *Server) getBill(c *gin.Context) {
	id := c.Param("id")
	// SECURITY: Always set user_id from JWT, never from request body
	userID, scopedDB, err := fetchTenancyFromContext(c)
	if err != nil {
		log.Error().Err(err).Str("user_id", userID).Msg("Failed to fetch tenancy from context")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	bill, err := s.billService.Get(scopedDB, id)
	if err != nil {
		log.Error().Err(err).Str("user_id", userID).Str("bill_id", id).Msg("Failed to get bill")
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Bill not found",
			"id":    id,
		})
		return
	}

	c.JSON(http.StatusOK, bill)
}

func (s *Server) createBill(c *gin.Context) {
	// SECURITY: Always set user_id from JWT, never from request body
	userID, scopedDB, err := fetchTenancyFromContext(c)
	if err != nil {
		log.Error().Err(err).Str("user_id", userID).Msg("Failed to fetch tenancy from context")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	var bill models.Bill
	if err := c.ShouldBindJSON(&bill); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Set the user ID for the bill

	bill.UserID = userID

	// If CategoryID is present but empty, set to nil so GORM inserts NULL
	if bill.CategoryID != nil && *bill.CategoryID == "" {
		bill.CategoryID = nil
	}

	if err := s.billService.Create(scopedDB, &bill); err != nil {
		log.Error().Err(err).Str("user_id", userID).Msg("Failed to create bill")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create bill"})
		return
	}

	c.JSON(http.StatusCreated, bill)
}

func (s *Server) updateBill(c *gin.Context) {
	// SECURITY: Always set user_id from JWT, never from request body
	id := c.Param("id")
	userID, scopedDB, err := fetchTenancyFromContext(c)
	if err != nil {
		log.Error().Err(err).Str("user_id", userID).Msg("Failed to fetch tenancy from context")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	var bill models.Bill
	if err := c.ShouldBindJSON(&bill); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// SECURITY: Always set user_id from JWT, never from request body
	bill.ID = id
	bill.UserID = userID

	if err := s.billService.Update(scopedDB, &bill); err != nil {
		log.Error().Err(err).Str("user_id", userID).Str("bill_id", id).Msg("Failed to update bill")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update bill"})
		return
	}

	c.JSON(http.StatusOK, bill)
}

func (s *Server) deleteBill(c *gin.Context) {
	id := c.Param("id")
	userID, scopedDB, err := fetchTenancyFromContext(c)
	if err != nil {
		log.Error().Err(err).Str("user_id", userID).Msg("Failed to fetch tenancy from context")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	if err := s.billService.Delete(scopedDB, id); err != nil {
		log.Error().Err(err).Str("user_id", userID).Str("bill_id", id).Msg("Failed to delete bill")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete bill"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Bill deleted successfully",
		"id":      id,
	})
}

// Category handlers

func (s *Server) listCategories(c *gin.Context) {
	userID, scopedDB, err := fetchTenancyFromContext(c)
	if err != nil {
		log.Error().Err(err).Str("user_id", userID).Msg("Failed to fetch tenancy from context")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	categories, err := s.categoryService.List(scopedDB)
	if err != nil {
		log.Error().Err(err).Str("user_id", userID).Msg("Failed to list categories")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve categories"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"categories": categories,
	})
}

func (s *Server) createCategory(c *gin.Context) {
	userID, scopedDB, err := fetchTenancyFromContext(c)
	if err != nil {
		log.Error().Err(err).Str("user_id", userID).Msg("Failed to fetch tenancy from context")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	var category models.Category
	if err := c.ShouldBindJSON(&category); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	category.UserID = userID // Set user ID from authenticated context

	if err := s.categoryService.Create(scopedDB, &category); err != nil {
		log.Error().Err(err).Str("user_id", userID).Msg("Failed to create category")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create category"})
		return
	}

	c.JSON(http.StatusCreated, category)
}

func (s *Server) deleteCategory(c *gin.Context) {
	id := c.Param("id")
	userID, scopedDB, err := fetchTenancyFromContext(c)
	if err != nil {
		log.Error().Err(err).Str("user_id", userID).Msg("Failed to fetch tenancy from context")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	if err := s.categoryService.Delete(scopedDB, id); err != nil {
		log.Error().Err(err).Str("user_id", userID).Str("category_id", id).Msg("Failed to delete category")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete category"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Category deleted successfully",
		"id":      id,
	})
}

// Statistics handlers

func (s *Server) getStatsSummary(c *gin.Context) {
	userID, scopedDB, err := fetchTenancyFromContext(c)
	if err != nil {
		log.Error().Err(err).Str("user_id", userID).Msg("Failed to fetch tenancy from context")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	stats, err := s.billService.GetStats(scopedDB)
	if err != nil {
		log.Error().Err(err).Str("user_id", userID).Msg("Failed to get stats")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch bill statistics"})
		return
	}

	c.JSON(http.StatusOK, stats)
}

// Payment handlers

func (s *Server) createPayment(c *gin.Context) {
	billID := c.Param("id")
	userID, scopedDB, err := fetchTenancyFromContext(c)
	if err != nil {
		log.Error().Err(err).Str("user_id", userID).Msg("Failed to fetch tenancy from context")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	var payment models.Payment
	if err := c.ShouldBindJSON(&payment); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	payment.BillID = billID
	payment.UserID = userID // Set user ID from authenticated context

	// Convert payment date to application timezone
	payment.PaymentDate = utils.ConvertToAppTimezone(payment.PaymentDate)

	if err := s.billService.CreatePayment(scopedDB, &payment); err != nil {
		log.Error().Err(err).Str("user_id", userID).Str("bill_id", billID).Msg("Failed to create payment")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create payment"})
		return
	}

	c.JSON(http.StatusCreated, payment)
}

func (s *Server) listPayments(c *gin.Context) {
	billID := c.Param("id")
	userID, scopedDB, err := fetchTenancyFromContext(c)
	if err != nil {
		log.Error().Err(err).Str("user_id", userID).Msg("Failed to fetch tenancy from context")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	payments, err := s.billService.ListPayments(scopedDB, billID)
	if err != nil {
		log.Error().Err(err).Str("user_id", userID).Str("bill_id", billID).Msg("Failed to list payments")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve payments"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"payments": payments,
		"total":    len(payments),
	})
}

func (s *Server) deletePayment(c *gin.Context) {
	paymentID := c.Param("payment_id")
	userID, scopedDB, err := fetchTenancyFromContext(c)
	if err != nil {
		log.Error().Err(err).Str("user_id", userID).Msg("Failed to fetch tenancy from context")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	if err := s.billService.DeletePayment(scopedDB, paymentID); err != nil {
		log.Error().Err(err).Str("user_id", userID).Str("payment_id", paymentID).Msg("Failed to delete payment")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete payment"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Payment deleted successfully",
		"id":      paymentID,
	})
}
