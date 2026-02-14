import React, { useEffect, useRef } from 'react';

/**
 * AdBanner — Non-intrusive Google AdSense ad unit.
 * Only renders on non-gameplay screens (Lobby, Store, Victory).
 * 
 * Props:
 *   slot   — AdSense ad slot ID (from your AdSense dashboard)
 *   format — 'auto' | 'horizontal' | 'vertical' | 'rectangle'
 *   style  — optional CSS overrides
 */
export default function AdBanner({ slot = '', format = 'auto', style = {} }) {
    const adRef = useRef(null);
    const pushed = useRef(false);

    useEffect(() => {
        // Only push once per mount
        if (pushed.current) return;
        try {
            if (window.adsbygoogle && adRef.current) {
                window.adsbygoogle.push({});
                pushed.current = true;
            }
        } catch (e) {
            // AdSense not loaded (dev mode, ad blocker, etc.)
            console.log('AdSense not available:', e.message);
        }
    }, []);

    return (
        <div className="ad-banner-wrapper" style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            padding: '0.5rem 0',
            ...style
        }}>
            <ins
                ref={adRef}
                className="adsbygoogle"
                style={{
                    display: 'block',
                    width: '100%',
                    maxWidth: '728px',
                    height: format === 'horizontal' ? '90px' : 'auto',
                    minHeight: '50px'
                }}
                data-ad-client="ca-pub-1001608230189465"
                data-ad-slot={slot}
                data-ad-format={format}
                data-full-width-responsive="true"
            />
        </div>
    );
}
