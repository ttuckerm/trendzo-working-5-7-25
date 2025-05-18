"use client"

import * as React from "react"
import { useState, useEffect, useRef } from "react"

interface CosmicDashboardCardProps {
  title?: string
  icon?: React.ReactNode
  viewDetailsLink?: string
  subtitle?: string
  className?: string
  theme?: {
    primaryColor?: string
    secondaryColor?: string
    glowColor?: string
  }
  height?: string | number
  width?: string | number
  children?: React.ReactNode
}

const CosmicDashboardCard: React.FC<CosmicDashboardCardProps> = ({
  title,
  icon,
  viewDetailsLink,
  subtitle,
  className = "",
  theme = {
    primaryColor: "#0FA0CE", // Enhanced bright blue
    secondaryColor: "#0056b3", // Deep space blue
    glowColor: "rgba(15, 160, 206, 0.8)", // Enhanced bright blue glow
  },
  height = "auto",
  width = "100%",
  children,
}) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const [isHovered, setIsHovered] = useState(false)
  const [time, setTime] = useState(0)
  const cardRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number>(0)
  const timeAnimationRef = useRef<number>(0)
  const rotationRef = useRef({ x: 0, y: 0, z: 0 })
  const rotationSpeedRef = useRef({ x: 0.05, y: 0.08, z: 0.02 })

  // Animation loop for continuous subtle rotation when not hovered
  const animate = () => {
    if (!cardRef.current || isHovered) return

    rotationRef.current.x += rotationSpeedRef.current.x
    rotationRef.current.y += rotationSpeedRef.current.y
    rotationRef.current.z += rotationSpeedRef.current.z

    // Limit rotation angles to create a nice subtle swaying effect
    if (Math.abs(rotationRef.current.x) > 2) rotationSpeedRef.current.x *= -1
    if (Math.abs(rotationRef.current.y) > 2) rotationSpeedRef.current.y *= -1
    if (Math.abs(rotationRef.current.z) > 1) rotationSpeedRef.current.z *= -1

    cardRef.current.style.transform = `
      rotateX(${rotationRef.current.x}deg) 
      rotateY(${rotationRef.current.y}deg) 
      rotateZ(${rotationRef.current.z}deg)
    `

    animationRef.current = requestAnimationFrame(animate)
  }

  // Animation for time-based effects
  const animateTime = () => {
    setTime((prev) => prev + 0.01)
    timeAnimationRef.current = requestAnimationFrame(animateTime)
  }

  useEffect(() => {
    const card = cardRef.current
    if (!card) return

    const handleMouseMove = (e: MouseEvent) => {
      const rect = card.getBoundingClientRect()

      // Calculate mouse position relative to the center of the card
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2

      // Calculate the angle between mouse and card center (reduced for subtler effect)
      const angleX = ((e.clientY - centerY) / (rect.height / 2)) * 10
      const angleY = (-(e.clientX - centerX) / (rect.width / 2)) * 10

      setMousePosition({ x: e.clientX - rect.left, y: e.clientY - rect.top })

      // Apply the rotation directly for smoother movement
      if (card) {
        card.style.transform = `rotateX(${angleX}deg) rotateY(${angleY}deg) rotateZ(${Math.min(Math.abs(angleX) + Math.abs(angleY), 5) / 10}deg)`
      }
    }

    const handleMouseEnter = () => {
      setIsHovered(true)
      cancelAnimationFrame(animationRef.current)
    }

    const handleMouseLeave = () => {
      // Reset the card position and restart the animation
      setIsHovered(false)
      animationRef.current = requestAnimationFrame(animate)
    }

    const handleResize = () => {
      if (card) {
        setDimensions({
          width: card.offsetWidth,
          height: card.offsetHeight,
        })
      }
    }

    handleResize()
    animationRef.current = requestAnimationFrame(animate)
    timeAnimationRef.current = requestAnimationFrame(animateTime)

    // Using document for tracking mouse movement for a more fluid experience
    card.addEventListener("mouseenter", handleMouseEnter)
    card.addEventListener("mousemove", handleMouseMove)
    card.addEventListener("mouseleave", handleMouseLeave)
    window.addEventListener("resize", handleResize)

    return () => {
      cancelAnimationFrame(animationRef.current)
      cancelAnimationFrame(timeAnimationRef.current)
      card.removeEventListener("mouseenter", handleMouseEnter)
      card.removeEventListener("mousemove", handleMouseMove)
      card.removeEventListener("mouseleave", handleMouseLeave)
      window.removeEventListener("resize", handleResize)
    }
  }, [isHovered])

  return (
    <div 
      ref={containerRef} 
      className={`perspective-container ${className}`} 
      style={{ 
        perspective: "1500px", 
        width, 
        height,
        display: "block",
        position: "relative"
      }}
    >
      <div
        ref={cardRef}
        className="cosmic-card-container"
        style={{
          transition: "transform 0.1s ease-out",
          transformStyle: "preserve-3d",
          position: "relative",
          width: "100%",
          height: "100%",
          minHeight: "300px"
        }}
      >
        {/* Card with cosmic design */}
        <div
          className="cosmic-card-background"
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            borderRadius: "0.75rem",
            overflow: "hidden",
            boxShadow: `0 10px 25px -5px ${theme.glowColor}`,
            background: "linear-gradient(135deg, #001a33 0%, #003366 50%, #0056b3 100%)",
          }}
        >
          {/* Cosmic background */}
          <div
            className="cosmic-background"
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              background: `
                radial-gradient(circle at ${50 + Math.sin(time * 0.5) * 20}% ${50 + Math.cos(time * 0.7) * 20}%, ${theme.glowColor} 0%, transparent 50%),
                radial-gradient(circle at ${50 + Math.cos(time * 0.3) * 30}% ${50 + Math.sin(time * 0.4) * 30}%, rgba(128, 0, 255, 0.3) 0%, transparent 40%),
                radial-gradient(circle at ${50 + Math.sin(time * 0.6) * 25}% ${50 + Math.cos(time * 0.5) * 25}%, rgba(255, 128, 240, 0.2) 0%, transparent 35%)
              `,
              opacity: 0.4,
            }}
          />

          {/* Dynamic aurora effect */}
          <div
            className="cosmic-aurora"
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              background: `
                radial-gradient(ellipse at ${80 + Math.sin(time * 0.4) * 20}% ${20 + Math.cos(time * 0.3) * 20}%, rgba(15, 160, 206, 0.5) 0%, transparent 40%),
                radial-gradient(ellipse at ${20 + Math.cos(time * 0.5) * 20}% ${70 + Math.sin(time * 0.6) * 20}%, rgba(51, 153, 255, 0.4) 0%, transparent 50%),
                radial-gradient(ellipse at ${60 + Math.sin(time * 0.7) * 20}% ${40 + Math.cos(time * 0.8) * 20}%, rgba(0, 195, 255, 0.3) 0%, transparent 45%)
              `,
              mixBlendMode: "screen",
            }}
          />

          {/* Subtle holographic effect */}
          <div
            className="holographic-effect"
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              background:
                "linear-gradient(45deg, transparent 40%, rgba(51, 195, 240, 0.15) 45%, rgba(51, 195, 240, 0.2) 50%, rgba(51, 195, 240, 0.15) 55%, transparent 60%)",
              backgroundSize: "200% 200%",
              animation: "holographicShift 5s ease infinite",
            }}
          />

          {/* Actual card content with proper padding */}
          <div className="card-content" style={{ position: "relative", zIndex: 10, padding: "1.5rem", height: "100%", width: "100%" }}>
            {/* Card header with title, icon, and view details link */}
            {(title || icon || viewDetailsLink) && (
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                {icon && <span style={{ color: "rgba(255, 255, 255, 0.9)" }}>{icon}</span>}
                {title && <h3 style={{ fontSize: "1rem", fontWeight: 500, color: "rgba(255, 255, 255, 0.9)" }}>{title}</h3>}
                {viewDetailsLink && (
                  <div style={{ marginLeft: "auto" }}>
                    <a 
                      href={viewDetailsLink} 
                      style={{ 
                        fontSize: "0.875rem", 
                        color: "rgb(165, 180, 252)", 
                        textDecoration: "none"
                      }}
                      onMouseOver={(e) => e.currentTarget.style.textDecoration = "underline"}
                      onMouseOut={(e) => e.currentTarget.style.textDecoration = "none"}
                    >
                      View Details
                    </a>
                  </div>
                )}
              </div>
            )}
            
            {/* Card subtitle */}
            {subtitle && <p style={{ fontSize: "0.875rem", color: "rgba(255, 255, 255, 0.6)", marginBottom: "1rem" }}>{subtitle}</p>}
            
            {/* Main card content - rendered with improved contrast for readability */}
            <div style={{ color: "rgba(255, 255, 255, 0.9)" }}>{children}</div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes holographicShift {
          0% { background-position: 0% 0%; }
          50% { background-position: 100% 100%; }
          100% { background-position: 0% 0%; }
        }
      `}</style>
    </div>
  )
}

export default CosmicDashboardCard 