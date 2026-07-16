"use client";

import { useState, useEffect } from "react";

interface BatteryStatus {
  level: number; // 0-100
  charging: boolean;
  supported: boolean;
}

export default function BatteryIndicator() {
  const [battery, setBattery] = useState<BatteryStatus>({
    level: 100,
    charging: false,
    supported: false,
  });

  useEffect(() => {
    // Check if Battery API is supported
    if ("getBattery" in navigator) {
      const updateBattery = async () => {
        try {
          // @ts-ignore - Battery API not in TypeScript types
          const batteryManager = await navigator.getBattery();

          const updateStatus = () => {
            setBattery({
              level: Math.round(batteryManager.level * 100),
              charging: batteryManager.charging,
              supported: true,
            });
          };

          updateStatus();

          batteryManager.addEventListener("levelchange", updateStatus);
          batteryManager.addEventListener("chargingchange", updateStatus);

          return () => {
            batteryManager.removeEventListener("levelchange", updateStatus);
            batteryManager.removeEventListener("chargingchange", updateStatus);
          };
        } catch {
          // Battery API failed
          setBattery({ level: 100, charging: false, supported: false });
        }
      };

      updateBattery();
    }
  }, []);

  // Don't show if not supported
  if (!battery.supported) {
    return null;
  }

  const getColor = () => {
    if (battery.charging) return "text-green-500";
    if (battery.level <= 20) return "text-red-500";
    if (battery.level <= 50) return "text-amber-500";
    return "text-slate-500";
  };

  const getIcon = () => {
    if (battery.charging) {
      return (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M14.45 6H9.55v12l4.9.05V6zM5 9V5h14v4H5z" />
          <path d="M14.45 6H9.55v12l4.9.05V6z" />
        </svg>
      );
    }

    if (battery.level <= 20) {
      return (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M15.67 4H14V2h-4v2H8.33C7.6 4 7 4.6 7 5.33v15.33C7 21.4 7.6 22 8.33 22h7.33c.74 0 1.34-.6 1.34-1.33V5.33C17 4.6 16.4 4 15.67 4z" />
        </svg>
      );
    }

    return (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M15.67 4H14V2h-4v2H8.33C7.6 4 7 4.6 7 5.33v15.33C7 21.4 7.6 22 8.33 22h7.33c.74 0 1.34-.6 1.34-1.33V5.33C17 4.6 16.4 4 15.67 4z" />
      </svg>
    );
  };

  return (
    <div className={`flex items-center gap-1 ${getColor()}`} title={`Baterai: ${battery.level}%${battery.charging ? " (mengisi)" : ""}`}>
      {getIcon()}
      <span className="text-xs font-medium">{battery.level}%</span>
    </div>
  );
}
