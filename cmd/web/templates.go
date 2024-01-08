package main

import (
	"fmt"
	"path/filepath"
	"text/template"

	"github.com/cryptk/williams/internal/models"
	"github.com/dustin/go-humanize"
)

// Define a templateData type to act as the holding structure for
// any dynamic data that we want to pass to our HTML templates.
// At the moment it only contains one field, but we'll add more
// to it as the build progresses.
type templateData struct {
	CurrentYear int
	Bill        models.Bill
	Bills       []models.Bill
	Form        any
	Flash       string
}

func humanizeOrdinal(i int) string {
	return humanize.Ordinal(i)
}

// We handle the currency formatting here rather than in the template to make future localization easier
func currency(f float64) string {
	return fmt.Sprintf("$%.2f", f)
}

var functions = template.FuncMap{
	"humanizeOrdinal": humanizeOrdinal,
	"currency":        currency,
}

func newTemplateCache() (map[string]*template.Template, error) {
	// Initialize a new map to act as the cache.
	cache := map[string]*template.Template{}

	// Use the filepath.Glob() function to get a slice of all filepaths that
	// match the pattern "./ui/html/pages/*.tmpl". This will essentially gives
	// us a slice of all the filepaths for our application 'page' templates
	// like: [ui/html/pages/home.tmpl ui/html/pages/view.tmpl]
	pages, err := filepath.Glob("./ui/html/pages/*.tmpl.html")
	if err != nil {
		return nil, err
	}

	// Loop through the page filepaths one-by-one.
	for _, page := range pages {
		name := filepath.Base(page)

		// Parse the base template file into a template set.
		ts, err := template.New(name).Funcs(functions).ParseFiles("./ui/html/base.tmpl.html")
		if err != nil {
			return nil, err
		}

		// Call ParseGlob() *on this template set* to add any partials.
		ts, err = ts.ParseGlob("./ui/html/partials/*.tmpl.html")
		if err != nil {
			return nil, err
		}

		// Call ParseFiles() *on this template set* to add the  page template.
		ts, err = ts.ParseFiles(page)
		if err != nil {
			return nil, err
		}

		// Add the template set to the map, using the name of the page
		// (like 'home.tmpl.html') as the key.
		cache[name] = ts
	}

	// Return the map.
	return cache, nil
}
