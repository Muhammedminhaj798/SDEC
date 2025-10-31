/* eslint-disable react-hooks/set-state-in-effect */
// app/admin/shipping/page.jsx
"use client";

import { getShippingConfig } from "@/app/utils/getShippingConfig";
import { useState, useEffect } from "react";
// import { getShippingConfig } from "@/utils/getShippingConfig";

const DEFAULT_CONFIG = {
  baseRate: 50,
  perKgRate: 20,
  freeShippingThreshold: 500,
  freeShippingAppliesTo: "kerala",
  zoneOverrides: {
    kerala: { baseRate: 50 },
    outside: { baseRate: 100 },
    international: { baseRate: 300 },
  },
};

export default function AdminShippingPage() {
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [errors, setErrors] = useState({});
  const [preview, setPreview] = useState({ orderValue: 600, weight: 1.5, zone: "kerala" });
  const [savedMessage, setSavedMessage] = useState("");

  // Load from localStorage on mount
  useEffect(() => {
    setConfig(getShippingConfig());
  }, []);

  const validate = () => {
    const newErrors = {};
    if (config.baseRate < 0) newErrors.baseRate = "Base rate cannot be negative";
    if (config.perKgRate < 0) newErrors.perKgRate = "Per-kg rate cannot be negative";
    if (config.freeShippingThreshold < 0)
      newErrors.freeShippingThreshold = "Threshold cannot be negative";
    if (preview.orderValue < 0) newErrors.orderValue = "Order value cannot be negative";
    if (preview.weight <= 0) newErrors.weight = "Weight must be > 0";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;

    const configToSave = {
      ...config,
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem("myApp_shipping_config", JSON.stringify(configToSave));

    // Broadcast to all open checkout tabs
    window.dispatchEvent(
      new CustomEvent("shippingConfigUpdated", { detail: configToSave })
    );

    setSavedMessage("Saved & updated live!");
    setTimeout(() => setSavedMessage(""), 3000);
  };

  const handleReset = () => {
    localStorage.removeItem("myApp_shipping_config");
    setConfig(DEFAULT_CONFIG);
    window.dispatchEvent(
      new CustomEvent("shippingConfigUpdated", { detail: DEFAULT_CONFIG })
    );
    setSavedMessage("Reset to defaults");
    setTimeout(() => setSavedMessage(""), 3000);
  };

  const calculateShipping = (orderValue, weight, zone) => {
    const zoneConfig = config.zoneOverrides[zone] || config.zoneOverrides.outside;
    const base = zoneConfig.baseRate ?? config.baseRate;
    const perKg = config.perKgRate;

    let shipping = base + perKg * Math.max(0, weight - 1); // first kg in base
    if (shipping < 0) shipping = 0;

    const freeApplies =
      config.freeShippingAppliesTo === "all" ||
      (config.freeShippingAppliesTo === "kerala" && zone === "kerala");

    if (freeApplies && orderValue >= config.freeShippingThreshold) {
      shipping = 0;
    }

    return Math.round(shipping);
  };

  const previewShipping = calculateShipping(
    preview.orderValue,
    preview.weight,
    preview.zone
  );

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md mt-8">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Admin: Shipping Configuration</h1>

      {savedMessage && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">{savedMessage}</div>
      )}

      {/* Primary Inputs */}
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Base Rate (₹)</label>
          <input
            type="number"
            min="0"
            value={config.baseRate}
            onChange={(e) => setConfig({ ...config, baseRate: +e.target.value })}
            className={`mt-1 block w-full rounded-md border p-2 text-sm ${errors.baseRate ? "border-red-500" : "border-gray-300"}`}
          />
          {errors.baseRate && <p className="text-red-500 text-xs mt-1">{errors.baseRate}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Per-kg Rate (₹)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={config.perKgRate}
            onChange={(e) => setConfig({ ...config, perKgRate: +e.target.value })}
            className={`mt-1 block w-full rounded-md border p-2 text-sm ${errors.perKgRate ? "border-red-500" : "border-gray-300"}`}
          />
          {errors.perKgRate && <p className="text-red-500 text-xs mt-1">{errors.perKgRate}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Free Shipping Threshold (₹)</label>
          <input
            type="number"
            min="0"
            value={config.freeShippingThreshold}
            onChange={(e) => setConfig({ ...config, freeShippingThreshold: +e.target.value })}
            className={`mt-1 block w-full rounded-md border p-2 text-sm ${errors.freeShippingThreshold ? "border-red-500" : "border-gray-300"}`}
          />
          {errors.freeShippingThreshold && (
            <p className="text-red-500 text-xs mt-1">{errors.freeShippingThreshold}</p>
          )}
        </div>
      </div>

      {/* Free Shipping Scope */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Free Shipping Applies To
        </label>
        <div className="flex gap-6">
          <label className="flex items-center">
            <input
              type="radio"
              name="freeShippingScope"
              value="kerala"
              checked={config.freeShippingAppliesTo === "kerala"}
              onChange={(e) => setConfig({ ...config, freeShippingAppliesTo: e.target.value })}
              className="mr-2"
            />
            <span>Kerala Only</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="freeShippingScope"
              value="all"
              checked={config.freeShippingAppliesTo === "all"}
              onChange={(e) => setConfig({ ...config, freeShippingAppliesTo: e.target.value })}
              className="mr-2"
            />
            <span>All Zones</span>
          </label>
        </div>
      </div>

      {/* Zone Overrides */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">Zone Base Rate Overrides</h3>
        <div className="grid md:grid-cols-3 gap-4">
          {Object.entries(config.zoneOverrides).map(([zone, rates]) => (
            <div key={zone}>
              <label className="block text-sm font-medium text-gray-700 capitalize">
                {zone === "outside" ? "Outside Kerala" : zone.charAt(0).toUpperCase() + zone.slice(1)}
              </label>
              <input
                type="number"
                min="0"
                value={rates.baseRate}
                onChange={(e) => {
                  const newOverrides = {
                    ...config.zoneOverrides,
                    [zone]: { baseRate: +e.target.value },
                  };
                  setConfig({ ...config, zoneOverrides: newOverrides });
                }}
                className="mt-1 block w-full rounded-md border-gray-300 p-2 text-sm"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-3 mb-8">
        <button
          onClick={handleSave}
          className="px-5 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
        >
          Save Configuration
        </button>
        <button
          onClick={handleReset}
          className="px-5 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition"
        >
          Reset to Defaults
        </button>
      </div>

      {/* Preview */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold mb-4">Live Preview</h3>
        <div className="grid md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Order Value (₹)</label>
            <input
              type="number"
              min="0"
              value={preview.orderValue}
              onChange={(e) => setPreview({ ...preview, orderValue: +e.target.value })}
              className="mt-1 block w-full rounded-md border p-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Weight (kg)</label>
            <input
              type="number"
              min="0.1"
              step="0.1"
              value={preview.weight}
              onChange={(e) => setPreview({ ...preview, weight: +e.target.value })}
              className="mt-1 block w-full rounded-md border p-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Zone</label>
            <select
              value={preview.zone}
              onChange={(e) => setPreview({ ...preview, zone: e.target.value })}
              className="mt-1 block w-full rounded-md border p-2 text-sm"
            >
              <option value="kerala">Kerala</option>
              <option value="outside">Outside Kerala</option>
              <option value="international">International</option>
            </select>
          </div>
        </div>

        <div className="p-4 bg-blue-50 rounded-lg text-lg font-medium">
          Shipping: <span className="text-blue-700">₹{previewShipping}</span>
          {previewShipping === 0 && (
            <span className="text-green-600 ml-2 text-sm">(Free!)</span>
          )}
        </div>
      </div>
    </div>
  );
}