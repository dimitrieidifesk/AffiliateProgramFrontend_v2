import React from 'react';
import * as LucideIcons from 'lucide-react';
import { HelpCircle } from 'lucide-react';

// Custom Avito Logo Component (raster asset)
const AvitoLogo = ({ size = 24, color = "currentColor", className = "", ...props }) => (
    <img
        src="/assets/images/avito_logo.png"
        alt="Avito Logo"
        width={size}
        height={size}
        className={`object-contain ${className}`}
        style={{ maxWidth: size, maxHeight: size }}
        {...props}
    />
);

// Leadmaker brand mark (simple monogram L inside rounded gradient-like placeholder via currentColor fill)
// Using SVG so we can scale crisply; color controls stroke/fill outlines, internal yellow uses CSS variable if available.
const LeadmakerLogo = ({ size = 24, className = '', color = 'currentColor', ...props }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        {...props}
    >
        <rect x="1.5" y="1.5" width="29" height="29" rx="8" stroke={color} strokeWidth="2" />
        <path
            d="M10 8h4v14h8v4H10V8Z"
            fill="var(--color-yellow-400, #FACC15)"
            stroke={color}
            strokeWidth="1.2"
            strokeLinejoin="round"
        />
    </svg>
);

function Icon({
    name,
    size = 24,
    color = "currentColor",
    className = "",
    strokeWidth = 2,
    ...props
}) {
    // Check for custom icons first
    if (name === 'AvitoLogo') {
        return <AvitoLogo size={size} color={color} className={className} {...props} />;
    }
    if (name === 'LeadmakerLogo') {
        return <LeadmakerLogo size={size} color={color} className={className} {...props} />;
    }

    const IconComponent = LucideIcons[name];

    if (!IconComponent) {
        return <HelpCircle size={size} color="gray" strokeWidth={strokeWidth} className={className} {...props} />;
    }

    return <IconComponent
        size={size}
        color={color}
        strokeWidth={strokeWidth}
        className={className}
        {...props}
    />;
}
export default Icon;