import React from 'react';

interface CardProps {
    children: React.ReactNode;
    variant?: 'basic' | 'hover' | 'law';
    className?: string;
}

const Card: React.FC<CardProps> = ({
    children,
    variant = 'basic',
    className = ''
}) => {
    const baseStyles = 'bg-white overflow-hidden relative';

    const variants = {
        basic: 'card',
        hover: 'card-hover',
        law: 'card-law'
    };

    return (
        <div className={`${baseStyles} ${variants[variant]} ${className}`}>
            {children}
        </div>
    );
};

export default Card;
