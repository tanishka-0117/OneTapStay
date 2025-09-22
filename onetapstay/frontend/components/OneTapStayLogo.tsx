import React from 'react'

interface OneTapStayLogoProps {
  width?: number
  height?: number
  className?: string
  variant?: 'default' | 'white'
}

export default function OneTapStayLogo({ width = 32, height = 32, className = "", variant = 'default' }: OneTapStayLogoProps) {
  const gradientId = `gradient-${Math.random().toString(36).substr(2, 9)}`
  const traceId = `trace-${Math.random().toString(36).substr(2, 9)}`
  
  const isWhite = variant === 'white'
  
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          {isWhite ? (
            <>
              <stop offset="0%" style={{ stopColor: '#ffffff', stopOpacity: 1 }} />
              <stop offset="50%" style={{ stopColor: '#f0fdfa', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: '#ecfeff', stopOpacity: 1 }} />
            </>
          ) : (
            <>
              <stop offset="0%" style={{ stopColor: '#0891b2', stopOpacity: 1 }} />
              <stop offset="50%" style={{ stopColor: '#06b6d4', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: '#22d3ee', stopOpacity: 1 }} />
            </>
          )}
        </linearGradient>
        <linearGradient id={traceId} x1="0%" y1="0%" x2="100%" y2="100%">
          {isWhite ? (
            <>
              <stop offset="0%" style={{ stopColor: '#ffffff', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: '#f0fdfa', stopOpacity: 1 }} />
            </>
          ) : (
            <>
              <stop offset="0%" style={{ stopColor: '#22d3ee', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: '#0891b2', stopOpacity: 1 }} />
            </>
          )}
        </linearGradient>
      </defs>
      
      {/* House structure */}
      <path 
        d="M60 70 L100 40 L140 70 L140 145 C140 150 136 154 131 154 L69 154 C64 154 60 150 60 145 Z" 
        fill="none" 
        stroke={`url(#${gradientId})`} 
        strokeWidth="4" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      
      {/* Door */}
      <rect 
        x="85" 
        y="125" 
        width="30" 
        height="29" 
        fill="none" 
        stroke={`url(#${gradientId})`} 
        strokeWidth="3" 
        rx="2"
      />
      
      {/* WiFi waves */}
      <g fill="none" stroke={`url(#${traceId})`} strokeWidth="2.5" strokeLinecap="round">
        <path d="M30 180 Q50 160 70 170 T110 160 T150 170 Q170 180 190 160" opacity="0.8" />
        <path d="M25 170 Q45 150 65 160 T105 150 T145 160 Q165 170 185 150" opacity="0.6" />
        <path d="M35 160 Q55 140 75 150 T115 140 T155 150 Q175 160 195 140" opacity="0.4" />
      </g>
      
      {/* Central connection point */}
      <circle cx="100" cy="90" r="12" fill="none" stroke={`url(#${gradientId})`} strokeWidth="3" />
      <circle cx="100" cy="90" r="6" fill={`url(#${traceId})`} opacity="0.8" />
      
      {/* Signal rings */}
      <circle cx="100" cy="90" r="18" fill="none" stroke={`url(#${traceId})`} strokeWidth="1.5" opacity="0.5" />
      <circle cx="100" cy="90" r="24" fill="none" stroke={`url(#${traceId})`} strokeWidth="1" opacity="0.3" />
      
      {/* Connection points */}
      <circle cx="70" cy="105" r="2.5" fill={`url(#${traceId})`} opacity="0.7" />
      <circle cx="130" cy="105" r="2.5" fill={`url(#${traceId})`} opacity="0.7" />
      <circle cx="100" cy="115" r="2" fill={`url(#${gradientId})`} opacity="0.6" />
      
      {/* Corner decorative dots */}
      <circle cx="45" cy="45" r="1.5" fill={`url(#${traceId})`} opacity="0.5" />
      <circle cx="155" cy="45" r="1.5" fill={`url(#${traceId})`} opacity="0.5" />
    </svg>
  )
}