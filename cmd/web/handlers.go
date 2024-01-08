package main

import (
	"errors"
	"fmt"
	"net/http"
	"strconv"

	"github.com/cryptk/williams/internal/models"
	"github.com/cryptk/williams/internal/validator"
	"github.com/julienschmidt/httprouter"
)

func (app *application) home(w http.ResponseWriter, r *http.Request) {
	bills, err := app.bills.List()
	if err != nil {
		app.serverError(w, r, err)
		return
	}

	data := app.newTemplateData(r)
	data.Bills = bills

	app.render(w, r, http.StatusOK, "home.tmpl.html", data)
}

//#region Bill Handlers

func (app *application) billView(w http.ResponseWriter, r *http.Request) {
	// Fetch matched parameters from httprouter
	params := httprouter.ParamsFromContext(r.Context())

	// Input validation, "id" should be a positive integer
	id, err := strconv.Atoi(params.ByName("id"))
	if err != nil || id < 1 {
		app.notFound(w)
		return
	}

	// Fetch requested bill
	bill, err := app.bills.Get(id)
	if err != nil {
		if errors.Is(err, models.ErrNoRecord) {
			app.notFound(w)
		} else {
			app.serverError(w, r, err)
		}
		return
	}

	data := app.newTemplateData(r)
	data.Bill = bill

	app.render(w, r, http.StatusOK, "billRead.tmpl.html", data)
}

type billCreateForm struct {
	Name                string  `form:"name"`
	Description         string  `form:"description"`
	Amount              float64 `form:"amount"`
	Due                 int     `form:"due"`
	validator.Validator `form:"-"`
}

func (app *application) billCreate(w http.ResponseWriter, r *http.Request) {
	data := app.newTemplateData(r)

	data.Form = billCreateForm{}

	app.render(w, r, http.StatusOK, "billCreate.tmpl.html", data)
}

func (app *application) billCreatePost(w http.ResponseWriter, r *http.Request) {
	var form billCreateForm
	err := app.decodePostForm(r, &form)
	if err != nil {
		app.clientError(w, http.StatusBadRequest)
		return
	}

	// TODO: Evaluate using github.com/go-playground/validator instead
	form.CheckField(validator.NotBlank(form.Name), "name", "This Field cannot be blank")
	form.CheckField(validator.MaxChars(form.Name, 100), "name", "This field cannot be more than 100 characters long")
	form.CheckField(validator.MaxChars(form.Description, 1000), "description", "This field cannot be more than 1000 characters long")
	form.CheckField(validator.GreaterThan(form.Amount, 0.0), "amount", "This field must be greater than zero")
	form.CheckField(validator.Between(form.Due, 1, 31), "due", "This field must have a value of 1-31")

	if !form.Valid() {
		data := app.newTemplateData(r)
		data.Form = form
		app.render(w, r, http.StatusUnprocessableEntity, "billCreate.tmpl.html", data)
		return
	}

	id, err := app.bills.Insert(form.Name, form.Description, form.Amount, form.Due)
	if err != nil {
		app.serverError(w, r, err)
		return
	}

	app.sessionManager.Put(r.Context(), "flash", "Bill successfully created!")

	http.Redirect(w, r, fmt.Sprintf("/bill/view/%d", id), http.StatusSeeOther)
}

func (app *application) billArchive(w http.ResponseWriter, r *http.Request) {
	// Fetch matched parameters from httprouter
	params := httprouter.ParamsFromContext(r.Context())

	// Input validation, "id" should be a positive integer
	id, err := strconv.Atoi(params.ByName("id"))
	if err != nil || id < 1 {
		app.notFound(w)
		return
	}

	err = app.bills.Archive(id)
	if err != nil {
		if errors.Is(err, models.ErrNoRecord) {
			app.notFound(w)
		} else {
			app.serverError(w, r, err)
		}
		return
	}

	http.Redirect(w, r, "/", http.StatusSeeOther)
}

//#endregion

// #region User Handlers
func (app *application) userSignup(w http.ResponseWriter, r *http.Request) {
	fmt.Fprintln(w, "Display a HTML form for signing up a new user...")
}

func (app *application) userSignupPost(w http.ResponseWriter, r *http.Request) {
	fmt.Fprintln(w, "Create a new user...")
}

func (app *application) userLogin(w http.ResponseWriter, r *http.Request) {
	fmt.Fprintln(w, "Display a HTML form for logging in a user...")
}

func (app *application) userLoginPost(w http.ResponseWriter, r *http.Request) {
	fmt.Fprintln(w, "Authenticate and login the user...")
}

func (app *application) userLogoutPost(w http.ResponseWriter, r *http.Request) {
	fmt.Fprintln(w, "Logout the user...")
}

//#endregion
