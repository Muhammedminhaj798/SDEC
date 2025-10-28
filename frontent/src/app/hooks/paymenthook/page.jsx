'use client'
import { useState, useEffect } from 'react';

const defaultMethods = {
  upi: true,
  card: true,
  netBanking: true,
};

export const usePaymentMethods = () => {
  const [methods, setMethods] = useState(() => {
    const saved = localStorage.getItem('paymentMethods');
    return saved ? JSON.parse(saved) : defaultMethods;
  });

  useEffect(() => {
    localStorage.setItem('paymentMethods', JSON.stringify(methods));
    window.dispatchEvent(new Event('paymentMethodsUpdated')); // trigger sync
  }, [methods]);

  const toggleMethod = (method) => {
    setMethods((prev) => ({ ...prev, [method]: !prev[method] }));
  };

  return { methods, toggleMethod };
};
