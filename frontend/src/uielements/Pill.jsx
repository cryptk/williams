export default function Pill({
  children,
  variant = "primary",
  size = "md",
  extraClasses = "",
  ...props
}) {
  const variantMap = {
    primary: "bg-primary-light text-primary-dark",
    secondary: "bg-secondary-light text-secondary-dark",
    danger: "bg-danger-light text-danger-dark",
    warning: "bg-warning-light text-warning-dark",
    success: "bg-success-light text-success-dark",
  };
  const variantClasses = variantMap[variant] || variantMap.primary;

  const sizeMap = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-3 py-1 text-xs",
    lg: "px-4 py-2 text-sm",
  };
  const sizeClasses = sizeMap[size] || sizeMap.md;

  return (
    <>
      <span
        class={`${variantClasses} ${sizeClasses} inline-block rounded-full font-semibold ${extraClasses}`}
        {...props}
      >
        {children}
      </span>
    </>
  );
}
