"use client";

import { useState } from "react";
import ForecastTab from "./ForecastTab";
import ControlRoomTab from "./ControlRoomTab";

const TABS = [
  { id: "forecast", label: "Forecast" },
  { id: "control-room", label: "Control Room" },
  { id: "recipes", label: "Recipes" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function AdminEcomPage() {
  const [tab, setTab] = useState<TabId>("forecast");

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Ecom Forecast</h1>
        <p className="text-sm text-muted-foreground">
          Products, live sessions, and recipe generation.
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-0 border-b border-white/10">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium transition-colors relative ${
              tab === t.id
                ? "text-white"
                : "text-white/40 hover:text-white/70"
            }`}
          >
            {t.label}
            {tab === t.id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#e50914]" />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "forecast" && <ForecastTab />}
      {tab === "control-room" && <ControlRoomTab />}
      {tab === "recipes" && (
        <div className="rounded-lg border p-8 text-center space-y-2">
          <div className="text-3xl">🧪</div>
          <div className="font-medium">Recipes — Coming Soon</div>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Browse and manage all generated Live Recipes across products.
            For now, generate recipes from each product&apos;s detail page.
          </p>
        </div>
      )}
    </div>
  );
}
