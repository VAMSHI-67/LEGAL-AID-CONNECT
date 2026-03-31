import React from 'react';

interface ScaleWatermarkProps {
    children: React.ReactNode;
    opacity?: string;
    className?: string;
}

const ScaleWatermark: React.FC<ScaleWatermarkProps> = ({
    children,
    opacity = 'opacity-100',
    className = ''
}) => {
    return (
        <div className={`scales-watermark ${opacity} ${className}`}>
            {children}
        </div>
    );
};

export default ScaleWatermark;
