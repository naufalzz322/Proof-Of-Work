"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface PhotoComparisonProps {
  beforeUrl: string;
  afterUrl: string;
  beforeLabel?: string;
  afterLabel?: string;
}

export default function PhotoComparison({
  beforeUrl,
  afterUrl,
  beforeLabel = "Sebelum",
  afterLabel = "Sesudah",
}: PhotoComparisonProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  // Update container width on resize
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };
    updateWidth();
    window.addEventListener("resize", updateWidth);
    window.addEventListener("orientationchange", () => setTimeout(updateWidth, 100));
    return () => {
      window.removeEventListener("resize", updateWidth);
      window.removeEventListener("orientationchange", () => setTimeout(updateWidth, 100));
    };
  }, []);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current || !isDragging) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  }, [isDragging]);

  // Only handle move when isDragging is true
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      handleMove(e.clientX);
    }
  }, [isDragging, handleMove]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (isDragging && e.touches.length === 1) {
      handleMove(e.touches[0].clientX);
    }
  }, [isDragging, handleMove]);

  // Start dragging
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    handleMove(e.clientX);
  }, [handleMove]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setIsDragging(true);
    if (e.touches.length === 1) {
      handleMove(e.touches[0].clientX);
    }
  }, [handleMove]);

  // Stop dragging
  useEffect(() => {
    const handleMouseUp = () => setIsDragging(false);
    const handleTouchEnd = () => setIsDragging(false);

    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("touchend", handleTouchEnd);
    window.addEventListener("touchcancel", handleTouchEnd);

    return () => {
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("touchcancel", handleTouchEnd);
    };
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("touchmove", handleTouchMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchmove", handleTouchMove);
    };
  }, [handleMouseMove, handleTouchMove]);

  return (
    <div className="mt-4">
      <p className="text-xs font-semibold text-slate-500 mb-2 uppercase text-center">
        {isDragging ? "Lepaskan untuk berhenti" : "Geser untuk membandingkan"}
      </p>
      <div
        ref={containerRef}
        className="relative w-full aspect-video rounded-xl overflow-hidden cursor-ew-resize select-none touch-none bg-slate-100"
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        {/* After image (full container - static) */}
        <img
          src={afterUrl}
          alt={afterLabel}
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Before image (clipped by slider) */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ width: `${sliderPosition}%` }}
        >
          <img
            src={beforeUrl}
            alt={beforeLabel}
            className="h-full object-cover"
            style={{
              width: containerWidth > 0 ? `${containerWidth}px` : "100%",
              maxWidth: "none"
            }}
          />
        </div>

        {/* Slider line - centered at slider position */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg z-10"
          style={{
            left: `${sliderPosition}%`,
            transform: "translateX(-50%)",
          }}
        >
          {/* Slider handle - centered on the line */}
          <div
            className="absolute top-1/2 left-1/2 bg-white rounded-full shadow-xl flex items-center justify-center transition-transform"
            style={{
              width: "40px",
              height: "40px",
              transform: `translate(-50%, -50%) scale(${isDragging ? 1.2 : 1})`,
            }}
          >
            <svg className="w-6 h-6 text-slate-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
            </svg>
          </div>
        </div>

        {/* Labels */}
        <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 text-white text-xs rounded font-medium">
          {beforeLabel}
        </div>
        <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/60 text-white text-xs rounded font-medium">
          {afterLabel}
        </div>
      </div>
    </div>
  );
}
