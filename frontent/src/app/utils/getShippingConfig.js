// src/utils/getShippingConfig.js
/**
 * Returns current shipping config from localStorage
 * Falls back to defaults if missing or invalid
 */
export function getShippingConfig() {
  const defaults = {
    baseRate: 50,
    perKgRate: 20,
    freeShippingThreshold: 500,
    freeShippingAppliesTo: "kerala", // "kerala" | "all"
    zoneOverrides: {
      kerala: { baseRate: 50 },
      outside: { baseRate: 100 },
      international: { baseRate: 300 },
    },
  };

  try {
    const saved = localStorage.getItem("myApp_shipping_config");
    if (!saved) return defaults;

    const parsed = JSON.parse(saved);
    if (
      typeof parsed.baseRate === "number" &&
      typeof parsed.perKgRate === "number" &&
      typeof parsed.freeShippingThreshold === "number" &&
      ["kerala", "all"].includes(parsed.freeShippingAppliesTo)
    ) {
      return { ...defaults, ...parsed };
    }
  } catch (e) {
    console.warn("Invalid shipping config in localStorage:", e);
  }

  return defaults;
}