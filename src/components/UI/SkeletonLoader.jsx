import React from 'react';

export default function SkeletonLoader({
    width = '100%',
    height = '20px',
    variant = 'rect', // rect, circle, text
    style = {}
}) {
    const baseStyle = {
        width,
        height,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: variant === 'circle' ? '50%' : (variant === 'text' ? '4px' : '8px'),
        ...style
    };

    return (
        <div className="skeleton-loader" style={baseStyle}>
            <style jsx>{`
                .skeleton-loader {
                    position: relative;
                    overflow: hidden;
                    display: inline-block;
                }
                .skeleton-loader::after {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: linear-gradient(
                        90deg,
                        transparent,
                        rgba(255, 255, 255, 0.1),
                        transparent
                    );
                    animation: shimmer 1.5s infinite;
                }
                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
            `}</style>
        </div>
    );
}
