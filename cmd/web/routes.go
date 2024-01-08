package main

import (
	"net/http"

	"github.com/julienschmidt/httprouter"
	"github.com/justinas/alice"
)

func (app *application) routes() http.Handler {
	// Initialize our router
	router := httprouter.New()

	// Set up our custom 404 handler
	router.NotFound = http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		app.notFound(w)
	})

	// Configure static asset serving
	fileServer := http.FileServer(http.Dir("./ui/static/"))
	router.Handler(http.MethodGet, "/static/*filepath", http.StripPrefix("/static", fileServer))

	// Create a new middleware chain for dynamic requests
	dynamic := alice.New(app.sessionManager.LoadAndSave)

	// Declare our routes
	router.Handler(http.MethodGet, "/", dynamic.ThenFunc(app.home))
	router.Handler(http.MethodGet, "/bill/view/:id", dynamic.ThenFunc(app.billView))
	router.Handler(http.MethodGet, "/bill/create", dynamic.ThenFunc(app.billCreate))
	router.Handler(http.MethodPost, "/bill/create", dynamic.ThenFunc(app.billCreatePost))
	router.Handler(http.MethodPost, "/bill/archive/:id", dynamic.ThenFunc(app.billArchive))

	router.Handler(http.MethodGet, "/user/signup", dynamic.ThenFunc(app.userSignup))
	router.Handler(http.MethodPost, "/user/signup", dynamic.ThenFunc(app.userSignupPost))
	router.Handler(http.MethodGet, "/user/login", dynamic.ThenFunc(app.userLogin))
	router.Handler(http.MethodPost, "/user/login", dynamic.ThenFunc(app.userLoginPost))
	router.Handler(http.MethodPost, "/user/logout", dynamic.ThenFunc(app.userLogoutPost))

	// Configure a standard middleware chain used for every request
	standard := alice.New(app.recoverPanic, app.logRequest, secureHeaders)

	return standard.Then(router)
}
