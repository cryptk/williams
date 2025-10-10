export default function Button({ children, variant = 'primary', extraClasses = '', ...props }) {
    const variantMap = {
        primary: 'bg-primary hover:bg-primary-dark text-white',
        primaryHollow: 'bg-transparent border-2 border-primary text-primary hover:bg-primary hover:text-white',
        secondary: 'bg-secondary-light border-2 border-secondary hover:bg-secondary text-gray',
        secondaryHollow:
            'bg-transparent border-2 border-secondary text-secondary-dark hover:bg-secondary hover:text-white',
        danger: 'bg-danger hover:bg-danger-dark text-white',
        dangerHollow: 'bg-transparent border-2 border-danger text-danger hover:bg-danger hover:text-white',
        warning: 'bg-warning hover:bg-warning-dark text-white',
        warningHollow: 'bg-transparent border-2 border-warning text-warning hover:bg-warning hover:text-white',
        success: 'bg-success hover:bg-success-dark text-white',
        successHollow: 'bg-transparent border-2 border-success text-success hover:bg-success hover:text-white',
    }

    const variantClasses = variantMap[variant] || variantMap.primary

    return (
        <>
            <button
                type="button"
                class={`${variantClasses} inline-block rounded-md px-4 py-2 text-base font-semibold drop-shadow-md drop-shadow-secondary transition-all hover:scale-103 hover:drop-shadow-lg hover:drop-shadow-secondary ${extraClasses}`}
                {...props}
            >
                {children}
            </button>
        </>
    )
}
