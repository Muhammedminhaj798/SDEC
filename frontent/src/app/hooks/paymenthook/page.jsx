/* eslint-disable react-hooks/set-state-in-effect */
'use client'
import { useState, useEffect } from 'react';

const defaultMethods = {
  upi: true,
  card: true,
  netBanking: true,
};

export const usePaymentMethods = () => {
  const [methods, setMethods] = useState(defaultMethods);

  useEffect(() => {
    // Only run this in browser
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('paymentMethods');
      if (saved) {
        setMethods(JSON.parse(saved));
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('paymentMethods', JSON.stringify(methods));
      window.dispatchEvent(new Event('paymentMethodsUpdated'));
    }
  }, [methods]);

  const toggleMethod = (method) => {
    setMethods((prev) => ({ ...prev, [method]: !prev[method] }));
  };

  return { methods, toggleMethod };
};
