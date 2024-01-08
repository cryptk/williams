// TODO: Evaluate using github.com/go-playground/validator instead
package validator

import (
	"cmp"
	"slices"
	"strings"
	"unicode/utf8"
)

type Validator struct {
	FieldErrors map[string]string
}

// Valid returns true if the FieldErrors map doesn't contain any entries.
func (v *Validator) Valid() bool {
	return len(v.FieldErrors) == 0
}

// AddFieldError adds an error message to the FieldErrors map (so long as no
// entry already exists for the given key).
func (v *Validator) AddFieldError(key, message string) {
	// Initialize the map if it is not already initialized
	if v.FieldErrors == nil {
		v.FieldErrors = make(map[string]string)
	}

	if _, exists := v.FieldErrors[key]; !exists {
		v.FieldErrors[key] = message
	}
}

// CheckField adds an error message to the FieldErrors map only if a
// validation check is not 'ok'.
func (v *Validator) CheckField(ok bool, key, message string) {
	if !ok {
		v.AddFieldError(key, message)
	}
}

// NotBlank returns true if a value is not an empty string.
func NotBlank(value string) bool {
	return strings.TrimSpace(value) != ""
}

// MaxChars returns true if a value contains no more than n characters.
func MaxChars(value string, n int) bool {
	return utf8.RuneCountInString(value) <= n
}

// GreaterThan returns true if the value is greater than a minimum value
func GreaterThan[T cmp.Ordered](value T, min T) bool {
	return value > min
}

// LessThan returns true if the value is less than a maximum value
func LessThan[T cmp.Ordered](value T, max T) bool {
	return value < max
}

// Between returns true if the value is between min and max (inclusive)
func Between[T cmp.Ordered](value T, min T, max T) bool {
	return min <= value && value <= max
}

// PermittedValue returns true if a value is in a list of specific permitted
// values.
func PermittedValue[T comparable](value T, permittedValues ...T) bool {
	return slices.Contains(permittedValues, value)
}
