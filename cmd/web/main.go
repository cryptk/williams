package main

import (
	"crypto/tls"
	"database/sql"
	"flag"
	"log/slog"
	"net/http"
	"os"
	"text/template"
	"time"

	"github.com/alexedwards/scs/sqlite3store"
	"github.com/alexedwards/scs/v2"
	"github.com/cryptk/williams/internal/models"
	"github.com/go-playground/form/v4"
	_ "github.com/mattn/go-sqlite3"
)

type application struct {
	logger         *slog.Logger
	bills          *models.BillModel
	templateCache  map[string]*template.Template
	formDecoder    *form.Decoder
	sessionManager *scs.SessionManager
}

func main() {

	// Process command line flags for configuration
	addr := flag.String("addr", ":4000", "HTTP Listen Address")
	dbengine := flag.String("dbengine", "sqlite3", "What DB engine to use")
	dsn := flag.String("dsn", "./db.sqlite", "Database DSN")
	usetls := flag.Bool("usetls", true, "Should the interface be served over TLS/HTTPS")
	tlscert := flag.String("tlscert", "tls/cert.pem", "TLS Certificate pem file for HTTPS")
	tlskey := flag.String("tlskey", "tls/key.pem", "TLS Key pem file for HTTPS")

	flag.Parse()

	// Configure our structured logger
	// Hardcoded to log at DEBUG during development
	logger := slog.New(slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelDebug}))

	// Initiate our database connection
	db, err := openDB(*dbengine, *dsn)
	if err != nil {
		logger.Error(err.Error())
		os.Exit(1)
	}
	// Defer the call to db.Close now so that the connection will close cleanly before we terminate
	defer db.Close()

	// Initialize a new template cache...
	templateCache, err := newTemplateCache()
	if err != nil {
		logger.Error(err.Error())
		os.Exit(1)
	}

	// Set up go-playground/form decoder
	formDecoder := form.NewDecoder()

	sessionManager := scs.New()
	sessionManager.Store = sqlite3store.New(db)
	sessionManager.Lifetime = 12 * time.Hour

	// Create our application struct for dependency injection
	app := &application{
		logger:         logger,
		bills:          &models.BillModel{DB: db},
		templateCache:  templateCache,
		formDecoder:    formDecoder,
		sessionManager: sessionManager,
	}

	// Configure our TLS settings based on Mozilla Intermediate compatibility recommendations
	// https://wiki.mozilla.org/Security/Server_Side_TLS#Intermediate_compatibility_.28recommended.29
	tlsConfig := &tls.Config{
		// Only these two TLS curves have assembly implementations (fast)
		// all others are implemented on the CPU (slow)
		CurvePreferences: []tls.CurveID{tls.X25519, tls.CurveP256},
		// TLS versions below 1.2 have known vulnerabilities
		MinVersion: tls.VersionTLS12,
		// Only support ECDHE (forward secrecy) cipher suites
		CipherSuites: []uint16{
			// Go ignores this setting for TLS 1.3 as all currently implemented cipher suites are considered "safe",
			// as such, this is only a list for TLS1.2
			tls.TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256,
			tls.TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256,
			tls.TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384,
			tls.TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384,
			tls.TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305,
			tls.TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305,
			tls.TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256,
		},
	}

	// Configure our http server
	srv := &http.Server{
		Addr:      *addr,
		Handler:   app.routes(),
		ErrorLog:  slog.NewLogLogger(logger.Handler(), slog.LevelError),
		TLSConfig: tlsConfig,
		// Add some timeouts to prevent slow attacks
		IdleTimeout:  time.Minute,
		ReadTimeout:  5 * time.Second,
		WriteTimeout: 10 * time.Second,
	}

	// Serve the application
	logger.Info("starting server", "addr", *addr)

	if *usetls {
		err = srv.ListenAndServeTLS(*tlscert, *tlskey)
	} else {
		err = srv.ListenAndServe()
	}
	if err != nil {
		logger.Error(err.Error())
		os.Exit(1)
	}
}

// The openDB() function wraps sql.Open() and returns a sql.DB connection pool
// for a given DSN.
func openDB(dbengine string, dsn string) (*sql.DB, error) {
	db, err := sql.Open(dbengine, dsn)
	if err != nil {
		return nil, err
	}
	if err = db.Ping(); err != nil {
		return nil, err
	}
	return db, nil
}
