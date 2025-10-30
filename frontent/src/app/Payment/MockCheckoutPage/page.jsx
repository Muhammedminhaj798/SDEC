'use client';

import axios from 'axios';
import React, { useState, useEffect, useCallback } from 'react';

const RAZORPAY_SCRIPT = 'https://checkout.razorpay.com/v1/checkout.js';
const RAZORPAY_TEST_KEY = 'rzp_test_1DP5mmOlF5G5ag'; // Test key

// Mock Products – now with weight (kg)
const MOCK_PRODUCTS = [
  { id: 1, name: 'Wireless Headphones', price: 1299, quantity: 1, weight: 0.4 },
  { id: 2, name: 'Phone Case',        price: 499,  quantity: 2, weight: 0.1 },
  { id: 3, name: 'USB Cable',         price: 299,  quantity: 1, weight: 0.05 },
];

export default function CODCheckout() {
  // ────── Core state ──────
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('online');
  const [order, setOrder] = useState(null);
  const [products] = useState(MOCK_PRODUCTS);

  // ────── Shipping state ──────
  const [pincode, setPincode] = useState('');
  const [shippingInfo, setShippingInfo] = useState(null); // Full shipping object
  const [shippingLoading, setShippingLoading] = useState(false);
  const [shippingError, setShippingError] = useState('');

  // ────── Calculations ──────
  const subTotal = products.reduce((sum, p) => sum + p.price * p.quantity, 0);

  // Total weight in kg – sent to backend
  const totalWeightKg = products.reduce((sum, p) => sum + (p.weight || 0) * p.quantity, 0);

  // Final shipping rate (0 if free)
  const shippingRate = shippingInfo?.isFree ? 0 : (shippingInfo?.rate ?? 0);
  const grandTotal = subTotal + shippingRate;

  // COD Advance: max(50, 10% of grand total)
  const codAdvance = grandTotal * 0.1 > 50 ? grandTotal * 0.1 : 50;
  const amountToPay = paymentMethod === 'cod' ? codAdvance : grandTotal;

  // ────── Load saved order ──────
  useEffect(() => {
    const saved = localStorage.getItem('codOrder');
    if (saved) setOrder(JSON.parse(saved));
  }, []);

  // ────── Load Razorpay ──────
  const loadRazorpay = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) return resolve(true);
      const script = document.createElement('script');
      script.src = RAZORPAY_SCRIPT;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // ────── Generate mock order ID ──────
  const generateOrderId = () => `order_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

  // ────── Shipping check – enhanced with weight & order value ──────
  const checkShipping = useCallback(async (code) => {
    // 1. Client-side validation: must be 6 digits
    if (!code || code.length !== 6 || isNaN(code)) {
      setShippingError('Please enter a valid 6-digit pincode.');
      setShippingInfo(null);
      return;
    }

    setShippingLoading(true);
    setShippingError('');
    setShippingInfo(null);

    try {
      // 2. Call your existing backend endpoint
      //    Send: pincode, orderValue (subtotal), totalWeightKg
      const res = await axios.post('http://localhost:9090/api/user/check', {
        pincode: code.trim(),
        orderValue: subTotal,
        totalWeightKg,
      });

      const data = res.data;

      // 3. Handle backend error response
      if (!data.success) {
        throw new Error(data.message || 'Invalid pincode');
      }

      // 4. Store full shipping info
      setShippingInfo({
        zone: data.zone,
        rate: data.rate,
        estimatedDays: data.estimatedDays,
        isFree: data.isFree,
        weightSurcharge: data.weightSurcharge || 0,
      });
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Failed to check shipping. Please try again.';
      setShippingError(msg);
    } finally {
      setShippingLoading(false);
    }
  }, [subTotal, totalWeightKg]);

  // ────── Debounce pincode input (runs after 600ms of inactivity) ──────
  useEffect(() => {
    const timer = setTimeout(() => {
      if (pincode.length === 6) checkShipping(pincode);
    }, 600);
    return () => clearTimeout(timer);
  }, [pincode, checkShipping]);

  // ────── Handle Payment ──────
  const handlePayment = async () => {
    if (!shippingInfo) {
      setError('Please enter a valid pincode to calculate shipping.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const loaded = await loadRazorpay();
      if (!loaded) throw new Error('Razorpay failed to load');

      const orderId = generateOrderId();

      const options = {
        key: RAZORPAY_TEST_KEY,
        amount: Math.round(amountToPay * 100),
        currency: 'INR',
        name: 'Demo Store',
        description: paymentMethod === 'cod' ? 'COD Advance' : 'Full Payment',
        handler: (response) => {
          const newOrder = {
            id: orderId,
            products,
            subTotal,
            totalWeightKg,
            shippingRate,
            grandTotal,
            advanceAmount: paymentMethod === 'cod' ? amountToPay : grandTotal,
            remainingAmount: paymentMethod === 'cod' ? grandTotal - amountToPay : 0,
            paymentMethod,
            pincode,
            shippingInfo,
            advancePaymentId: response.razorpay_payment_id,
            advancePaid: true,
            fullPaid: paymentMethod === 'online',
            status: paymentMethod === 'cod' ? 'COD Confirmed' : 'Paid & Delivered',
            timestamp: new Date().toISOString(),
          };

          localStorage.setItem('codOrder', JSON.stringify(newOrder));
          setOrder(newOrder);
          setSuccess(true);
        },
        prefill: { name: 'Test User', email: 'test@example.com', contact: '9999999999' },
        theme: { color: '#10b981' },
        modal: { ondismiss: () => { setLoading(false); setError('Payment cancelled'); } },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (res) => {
        setError(res.error.description || 'Payment failed');
        setLoading(false);
      });
      rzp.open();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ────── Simulate Delivery Payment ──────
  const simulateDeliveryPayment = () => {
    if (!order || order.paymentMethod !== 'cod' || order.fullPaid) return;

    const updatedOrder = {
      ...order,
      fullPaid: true,
      remainingAmount: 0,
      status: 'Delivered & Fully Paid',
      deliveryPaymentTimestamp: new Date().toISOString(),
    };

    localStorage.setItem('codOrder', JSON.stringify(updatedOrder));
    setOrder(updatedOrder);
  };

  const clearOrder = () => {
    localStorage.removeItem('codOrder');
    setOrder(null);
    setSuccess(false);
  };

  // ────── UI ──────
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
          <p className="text-gray-600 mt-1">COD with Advance Payment Demo</p>
        </div>

        {/* Success */}
        {success && (
          <div className="p-5 bg-green-50 border-2 border-green-200 rounded-lg flex items-center">
            <svg className="w-6 h-6 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <div>
              <p className="font-semibold text-green-900">
                {paymentMethod === 'cod' ? 'Advance Paid!' : 'Payment Complete!'}
              </p>
              <p className="text-sm text-green-700">
                {paymentMethod === 'cod' ? 'Your COD order is confirmed.' : 'Order delivered.'}
              </p>
            </div>
          </div>
        )}

        {/* Global Error */}
        {error && (
          <div className="p-4 bg-red-50 border-2 border-red-200 rounded-lg flex items-center">
            <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* ────── Pincode & Shipping Info ────── */}
                {/* ────── Pincode & Shipping Info ────── */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Delivery Address</h2>

          {/* ----- Pincode input ----- */}
          <div className="flex flex-col space-y-2">
            <label htmlFor="pincode" className="font-medium">Pincode</label>
            <input
              id="pincode"
              type="text"
              maxLength="6"
              value={pincode}
              onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
              placeholder="Enter 6-digit pincode"
              className="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* ----- 1. Instant zone detection (frontend only) ----- */}
          {pincode.length === 6 && !shippingLoading && !shippingError && (
            <p className="mt-2 text-sm font-medium text-blue-700">
              Your zone:{' '}
              <span className="capitalize">
                {(() => {
                  const n = Number(pincode);
                  // Sample Kerala pincodes (add more if you like)
                  const kerala = [673001, 682001, 695001, 670001, 679121];
                  if (kerala.includes(n)) return 'Kerala';
                  if (String(n).length === 6) return 'Outside Kerala';
                  return 'International';
                })()}
              </span>
            </p>
          )}

          {/* ----- 2. Loading while we ask the backend ----- */}
          {shippingLoading && (
            <p className="mt-2 text-sm text-gray-600 flex items-center">
              <svg className="animate-spin h-4 w-4 mr-1" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" className="opacity-25" />
                <path fill="currentColor" d="M4 12a8 8 0 018-8v4h-4v4H4z" />
              </svg>
              Checking shipping…
            </p>
          )}

          {/* ----- 3. Validation / backend error ----- */}
          {shippingError && (
            <p className="mt-2 text-sm text-red-600">{shippingError}</p>
          )}

          {/* ----- 4. Full shipping result (rate, ETA, free-shipping) ----- */}
          {shippingInfo && (
            <div className="mt-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              {shippingInfo.isFree ? (
                <p className="text-lg font-bold text-green-700 flex items-center">
                  Free shipping applied!
                </p>
              ) : (
                <div className="space-y-1">
                  <p className="font-medium text-green-800">
                    Delivery to <span className="capitalize">{shippingInfo.zone}</span> Zone
                  </p>
                  <p className="text-xl font-bold text-green-700">
                    ₹{shippingInfo.rate}
                    {shippingInfo.weightSurcharge > 0 && (
                      <span className="text-sm font-normal text-gray-600">
                        {' '} (+₹{shippingInfo.weightSurcharge} weight)
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-green-600">
                    ETA: {shippingInfo.estimatedDays}{' '}
                    {shippingInfo.estimatedDays === 1 ? 'day' : 'days'}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ────── Order Summary ────── */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Order Summary</h2>

          {products.map((p) => (
            <div key={p.id} className="flex justify-between py-2 border-b">
              <div>
                <p className="font-medium">{p.name}</p>
                <p className="text-sm text-gray-500">Qty: {p.quantity} × {p.weight}kg</p>
              </div>
              <p>₹{(p.price * p.quantity).toFixed(2)}</p>
            </div>
          ))}

          <div className="mt-4 space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>₹{subTotal.toFixed(2)}</span>
            </div>

            <div className="flex justify-between">
              <span>Shipping</span>
              <span className={shippingInfo?.isFree ? 'text-green-600 font-medium' : ''}>
                {shippingInfo
                  ? shippingInfo.isFree
                    ? 'FREE'
                    : `₹${shippingRate.toFixed(2)}`
                  : '—'}
              </span>
            </div>

            {shippingInfo?.weightSurcharge > 0 && !shippingInfo?.isFree && (
              <div className="flex justify-between text-xs text-gray-600">
                <span className="pl-4">↳ Weight surcharge</span>
                <span>₹{shippingInfo.weightSurcharge}</span>
              </div>
            )}

            <div className="flex justify-between font-bold text-lg border-t pt-2">
              <span>Grand Total</span>
              <span>₹{grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* ────── Payment Method ────── */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Payment Method</h2>

          {/* Online */}
          <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 mb-3">
            <input
              type="radio"
              name="method"
              value="online"
              checked={paymentMethod === 'online'}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="mr-3 h-5 w-5 text-green-600"
            />
            <div className="flex-1">
              <p className="font-medium">Pay Online (Full Payment)</p>
              <p className="text-sm text-gray-600">Pay full ₹{grandTotal.toFixed(2)} now</p>
            </div>
            <span className="font-bold text-green-600">₹{grandTotal.toFixed(2)}</span>
          </label>

          {/* COD */}
          <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              name="method"
              value="cod"
              checked={paymentMethod === 'cod'}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="mr-3 h-5 w-5 text-orange-600"
            />
            <div className="flex-1">
              <p className="font-medium">Cash on Delivery (COD with Advance)</p>
              <p className="text-sm text-gray-600">
                Pay <strong>₹{codAdvance.toFixed(2)}</strong> advance
              </p>
              {paymentMethod === 'cod' && (
                <p className="text-xs text-orange-700 mt-2">
                  Pay advance to confirm your COD order.
                </p>
              )}
            </div>
            <span className="font-bold text-orange-600">₹{codAdvance.toFixed(2)}</span>
          </label>

          {/* Pay Now Amount */}
          <div className="mt-5 p-4 bg-blue-50 rounded-lg">
            <p className="font-medium text-blue-900">Pay Now:</p>
            <p className="text-2xl font-bold text-blue-600">₹{amountToPay.toFixed(2)}</p>
            {paymentMethod === 'cod' && (
              <p className="text-sm text-blue-700">
                ₹{(grandTotal - amountToPay).toFixed(2)} payable on delivery
              </p>
            )}
          </div>
        </div>

        {/* ────── Pay Button ────── */}
        {!order && (
          <button
            onClick={handlePayment}
            disabled={loading || !shippingInfo}
            className={`w-full py-4 rounded-lg font-bold text-white flex items-center justify-center transition ${
              loading || !shippingInfo ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {loading ? (
              <>
                <svg className="animate-spin mr-3 h-5 w-5" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" className="opacity-25" />
                  <path fill="currentColor" d="M4 12a8 8 0 018-8v4h-4v4H4z" />
                </svg>
                Processing...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                {paymentMethod === 'cod'
                  ? `Pay ₹${amountToPay.toFixed(2)} Advance`
                  : `Pay ₹${grandTotal.toFixed(2)} Now`}
              </>
            )}
          </button>
        )}

        {/* ────── Simulate Delivery Payment ────── */}
        {order && order.paymentMethod === 'cod' && !order.fullPaid && (
          <button
            onClick={simulateDeliveryPayment}
            className="w-full py-4 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg flex items-center justify-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            Simulate Delivery Payment (₹{order.remainingAmount.toFixed(2)})
          </button>
        )}

        {/* ────── Order Status ────── */}
        {order && (
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Order Status</h2>
              <button onClick={clearOrder} className="text-sm text-red-600 hover:underline">
                Clear Order
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Order ID</span>
                <code className="font-mono">{order.id}</code>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status</span>
                <span className={`font-bold ${order.status.includes('Delivered') ? 'text-green-600' : 'text-orange-600'}`}>
                  {order.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Advance Paid</span>
                <span className="font-medium">₹{order.advanceAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Remaining</span>
                <span className={order.remainingAmount > 0 ? 'text-orange-600' : 'text-green-600'}>
                  ₹{order.remainingAmount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>Placed</span>
                <span>{new Date(order.timestamp).toLocaleString()}</span>
              </div>
              {order.deliveryPaymentTimestamp && (
                <div className="flex justify-between text-xs text-green-600">
                  <span>Delivered & Paid</span>
                  <span>{new Date(order.deliveryPaymentTimestamp).toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ────── Test Instructions ────── */}
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-xs">
          <strong className="block mb-1 text-amber-900">Test Mode Instructions</strong>
          <ul className="list-disc pl-5 space-y-1 text-amber-800">
            <li>Use card: <code>4111 1111 1111 1111</code> + any future date & CVV</li>
            <li>UPI: <code>success@razorpay</code> (success) | <code>failure@razorpay</code> (fail)</li>
            <li>Order saved in <code>localStorage</code></li>
          </ul>
        </div>

      </div>
    </div>
  );
}