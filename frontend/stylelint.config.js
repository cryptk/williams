/** @type {import("stylelint").Config} */
export default {
  extends: ['stylelint-config-standard', 'stylelint-config-tailwindcss'],
  rules: {
    'custom-property-empty-line-before': null,
    'nesting-selector-no-missing-scoping-root': null,
  },
}
