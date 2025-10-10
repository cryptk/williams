export default function IconButton({ children, variant = 'primary', extraClasses = '', ...props }) {
    const variantMap = {
        primary: 'bg-primary-light hover:bg-primary text-white',
        primaryHollow: 'bg-transparent border-2 border-primary text-primary hover:bg-primary hover:text-white',
        secondary: 'bg-secondary-light hover:bg-secondary text-white',
        secondaryHollow: 'bg-transparent border-2 border-secondary text-gray hover:bg-secondary hover:text-white',
        danger: 'bg-danger-light hover:bg-danger text-white',
        dangerHollow: 'bg-transparent border-2 border-danger text-danger hover:bg-danger hover:text-white',
        warning: 'bg-warning-light hover:bg-warning text-white',
        warningHollow: 'bg-transparent border-2 border-warning text-warning hover:bg-warning hover:text-white',
        success: 'bg-success-light hover:bg-success text-white',
        successHollow: 'bg-transparent border-2 border-success text-success hover:bg-success hover:text-white',
    }

    const variantClasses = variantMap[variant] || variantMap.primary

    return (
        <>
            <button
                class={`${variantClasses} cursor-pointer rounded border-none p-1 text-xl leading-none transition-all hover:scale-110 ${extraClasses}`}
                {...props}
            >
                {children}
            </button>
        </>
    )
}
