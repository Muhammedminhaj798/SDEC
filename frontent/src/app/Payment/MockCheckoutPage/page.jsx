'use client';

import React, { useState, useEffect } from 'react';

const RAZORPAY_SCRIPT = 'https://checkout.razorpay.com/v1/checkout.js';
const RAZORPAY_TEST_KEY = 'rzp_test_1DP5mmOlF5G5ag'; // Test key

// Mock Products
const MOCK_PRODUCTS = [
  { id: 1, name: 'Wireless Headphones', price: 1299, quantity: 1 },
  { id: 2, name: 'Phone Case', price: 499, quantity: 2 },
  { id: 3, name: 'USB Cable', price: 299, quantity: 1 },
];

export default function CODCheckout() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('online'); // 'online' | 'cod'
  const [order, setOrder] = useState(null);
  const [products] = useState(MOCK_PRODUCTS);

  // Calculate total
  const total = products.reduce((sum, p) => sum + p.price * p.quantity, 0);

  // COD Advance: max(50, 10% of total)
  const codAdvance = total * 0.1 > 50 ? total * 0.1 : 50;
  const amountToPay = paymentMethod === 'cod' ? codAdvance : total;

  // Load saved order
  useEffect(() => {
    const saved = localStorage.getItem('codOrder');
    if (saved) {
      setOrder(JSON.parse(saved));
    }
  }, []);

  // Load Razorpay
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

  // Generate mock order ID
  const generateOrderId = () => `order_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

  // Handle Payment (Advance or Full)
  const handlePayment = async () => {
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
        // order_id removed to avoid 400 error
        handler: (response) => {
          const newOrder = {
            id: orderId,
            products,
            totalAmount: total,
            advanceAmount: paymentMethod === 'cod' ? amountToPay : total,
            remainingAmount: paymentMethod === 'cod' ? total - amountToPay : 0,
            paymentMethod,
            advancePaymentId: response.razorpay_payment_id,
            advancePaid: true,
            fullPaid: paymentMethod === 'online',
            status: paymentMethod === 'cod' ? 'COD Confirmed' : 'Paid & Delivered',
            timestamp: new Date().toISOString(),
          };

          localStorage.setItem('codOrder', JSON.stringify(newOrder));
          setOrder(newOrder);
          setSuccess(true);
          setLoading(false);
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
      setLoading(false);
    }
  };

  // Simulate Delivery Payment
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

        {/* Error */}
        {error && (
          <div className="p-4 bg-red-50 border-2 border-red-200 rounded-lg flex items-center">
            <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Order Summary */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
          {products.map(p => (
            <div key={p.id} className="flex justify-between py-2 border-b">
              <div>
                <p className="font-medium">{p.name}</p>
                <p className="text-sm text-gray-500">Qty: {p.quantity}</p>
              </div>
              <p>₹{(p.price * p.quantity).toFixed(2)}</p>
            </div>
          ))}
          <div className="flex justify-between mt-4 pt-4 border-t-2 font-bold text-lg">
            <span>Total</span>
            <span>₹{total.toFixed(2)}</span>
          </div>
        </div>

        {/* Payment Method */}
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
              <p className="text-sm text-gray-600">Pay full ₹{total.toFixed(2)} now</p>
            </div>
            <span className="font-bold text-green-600">₹{total.toFixed(2)}</span>
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
                ₹{(total - amountToPay).toFixed(2)} payable on delivery
              </p>
            )}
          </div>
        </div>

        {/* Pay Button */}
        {!order && (
          <button
            onClick={handlePayment}
            disabled={loading}
            className={`w-full py-4 rounded-lg font-bold text-white flex items-center justify-center transition ${
              loading ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'
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
                {paymentMethod === 'cod' ? `Pay ₹${amountToPay.toFixed(2)} Advance` : `Pay ₹${total.toFixed(2)} Now`}
              </>
            )}
          </button>
        )}

        {/* Simulate Delivery Payment */}
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

        {/* Order Status */}
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

        {/* Test Instructions */}
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