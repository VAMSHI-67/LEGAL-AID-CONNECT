import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'gold';
    size?: 'sm' | 'md' | 'lg';
    children: React.ReactNode;
    className?: string;
}

const Button: React.FC<ButtonProps> = ({
    variant = 'primary',
    size = 'md',
    children,
    className = '',
    ...props
}) => {
    const baseStyles = 'inline-flex items-center justify-center font-heading font-semibold transition-all duration-300 transform active:scale-95 focus:outline-none';

    const variants = {
        primary: 'bg-[var(--primary)] hover:shadow-gold text-white',
        secondary: 'bg-[var(--card)] hover:bg-[var(--ivory)] text-[var(--primary)] border-2 border-[var(--primary)]',
        gold: 'bg-[var(--accent)] hover:bg-[var(--accent)] text-white shadow-gold'
    };

    const sizes = {
        sm: 'px-4 py-2 text-sm rounded-lg',
        md: 'px-6 py-3 text-base rounded-xl',
        lg: 'px-8 py-4 text-lg rounded-xl'
    };

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
};

export default Button;
