/* eslint-disable react-hooks/set-state-in-effect */
'use client'
import { useState, useEffect } from 'react';

const STORAGE_KEY = 'cod_settings';
const UPDATE_EVENT = 'cod-settings-update';

export const useCodSettings = () => {
  const [settings, setSettings] = useState({
    advancePercent: 10,
    allowedZones: ['Urban', 'Semi-Urban'],
    enabled: true,
  });

  // Load from localStorage only on client
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setSettings(JSON.parse(saved));
      }
    }
  }, []);

  // Save to localStorage and emit event when settings change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      window.dispatchEvent(new CustomEvent(UPDATE_EVENT, { detail: settings }));
    }
  }, [settings]);

  const updateSettings = (newSettings) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  return { settings, updateSettings };
};
