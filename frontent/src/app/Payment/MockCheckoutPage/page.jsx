'use client';

import { getShippingConfig } from '@/app/utils/getShippingConfig';
import { useState, useEffect, useCallback } from 'react';
// import { getShippingConfig } from '@/utils/getShippingConfig';

const RAZORPAY_SCRIPT = 'https://checkout.razorpay.com/v1/checkout.js';
const RAZORPAY_KEY = 'rzp_test_1DP5mmOlF5G5ag';

const MOCK_PRODUCTS = [
  { id: 1, name: 'Wireless Headphones', price: 1299, quantity: 1, weight: 0.4, image: '/headphones.jpg' },
  { id: 2, name: 'Phone Case', price: 499, quantity: 2, weight: 0.1, image: '/case.jpg' },
  { id: 3, name: 'USB Cable', price: 299, quantity: 1, weight: 0.05, image: '/cable.jpg' },
];

export default function CODCheckout() {
  const [pincode, setPincode] = useState('');
  const [shipping, setShipping] = useState(null);
  const [shipLoad, setShipLoad] = useState(false);
  const [shipErr, setShipErr] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('online');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // === NEW: Shipping Config from Admin ===
  const [shippingConfig, setShippingConfig] = useState(getShippingConfig());

  const products = MOCK_PRODUCTS;

  // Calculations
  const subTotal = products.reduce((s, p) => s + p.price * p.quantity, 0);
  const totalWeightKg = products.reduce((s, p) => s + p.weight * p.quantity, 0);
  const shippingCost = shipping?.totalShipping ?? 0;
  const grandTotal = subTotal + shippingCost;
  const codAdvance = Math.max(50, Math.round(grandTotal * 0.1));
  const amountToPay = paymentMethod === 'cod' ? codAdvance : grandTotal;

  // Load saved order
  useEffect(() => {
    const saved = localStorage.getItem('codOrder');
    if (saved) setOrder(JSON.parse(saved));
  }, []);

  // === LISTEN FOR ADMIN CONFIG UPDATES ===
  useEffect(() => {
    const handler = (e) => {
      setShippingConfig(e.detail);
      if (pincode.length === 6) {
        fetchShipping(); // Recalculate instantly
      }
    };
    window.addEventListener('shippingConfigUpdated', handler);
    return () => window.removeEventListener('shippingConfigUpdated', handler);
  }, [pincode]);

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

  const generateOrderId = () => `order_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

  // === UPDATED: Real-time Shipping using Admin Config ===
  const fetchShipping = useCallback(() => {
    if (!pincode || pincode.length !== 6 || isNaN(pincode)) {
      setShipErr('Enter a valid 6-digit pincode.');
      setShipping(null);
      return;
    }

    setShipLoad(true);
    setShipErr('');

    try {
      // Determine zone
      const zoneKey = pincode.startsWith("68") || pincode.startsWith("69")
        ? "kerala"
        : pincode.startsWith("9")
        ? "international"
        : "outside";

      const zoneConfig = shippingConfig.zoneOverrides[zoneKey] || shippingConfig.zoneOverrides.outside;
      const baseRate = zoneConfig.baseRate ?? shippingConfig.baseRate;

      // Weight charge (first kg free)
      const weightCharge = totalWeightKg > 1
        ? shippingConfig.perKgRate * (totalWeightKg - 1)
        : 0;

      let totalShipping = baseRate + weightCharge;

      // Free shipping logic
      const freeApplies =
        shippingConfig.freeShippingAppliesTo === "all" ||
        (shippingConfig.freeShippingAppliesTo === "kerala" && zoneKey === "kerala");

      const freeShipping = freeApplies && subTotal >= shippingConfig.freeShippingThreshold;

      if (freeShipping) {
        totalShipping = 0;
      }

      const estimatedDays = zoneKey === "kerala" ? 2 : zoneKey === "outside" ? 4 : 10;

      setShipping({
        zone: zoneKey === "kerala" ? "Kerala" : zoneKey === "outside" ? "Outside Kerala" : "International",
        baseRate,
        originalBase: baseRate,
        weightCharge: Math.round(weightCharge),
        totalShipping: Math.round(totalShipping),
        freeShipping,
        estimatedDays,
      });
    } catch (err) {
      setShipErr(err.message);
      setShipping(null);
    } finally {
      setShipLoad(false);
    }
  }, [pincode, subTotal, totalWeightKg, shippingConfig]);

  // Debounced pincode check
  useEffect(() => {
    const timer = setTimeout(() => {
      if (pincode.length === 6) fetchShipping();
    }, 600);
    return () => clearTimeout(timer);
  }, [pincode, fetchShipping]);

  // Payment Handler
  const handlePayment = async () => {
    if (!shipping) return setError('Calculate shipping first.');

    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const loaded = await loadRazorpay();
      if (!loaded) throw new Error('Razorpay failed to load');

      const orderId = generateOrderId();

      const options = {
        key: RAZORPAY_KEY,
        amount: Math.round(amountToPay * 100),
        currency: 'INR',
        name: 'MyStore',
        description: paymentMethod === 'cod' ? 'COD Advance' : 'Full Payment',
        handler: (res) => {
          const newOrder = {
            id: orderId,
            products,
            subTotal,
            totalWeightKg,
            shippingCost,
            grandTotal,
            advanceAmount: paymentMethod === 'cod' ? amountToPay : grandTotal,
            remainingAmount: paymentMethod === 'cod' ? grandTotal - amountToPay : 0,
            paymentMethod,
            pincode,
            shipping,
            advancePaymentId: res.razorpay_payment_id,
            advancePaid: true,
            fullPaid: paymentMethod === 'online',
            status: paymentMethod === 'cod' ? 'COD - Advance Paid' : 'Paid & Delivered',
            timestamp: new Date().toISOString(),
          };
          localStorage.setItem('codOrder', JSON.stringify(newOrder));
          setOrder(newOrder);
          setSuccess(true);
        },
        prefill: { name: 'Test User', email: 'test@example.com', contact: '9999999999' },
        theme: { color: '#10b981' },
        modal: { ondismiss: () => setLoading(false) },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', () => setError('Payment failed'));
      rzp.open();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const simulateDeliveryPayment = () => {
    if (!order || order.paymentMethod !== 'cod' || order.fullPaid) return;
    const updated = {
      ...order,
      fullPaid: true,
      remainingAmount: 0,
      status: 'Delivered & Fully Paid',
      deliveryPaymentTimestamp: new Date().toISOString(),
    };
    localStorage.setItem('codOrder', JSON.stringify(updated));
    setOrder(updated);
  };

  const clearOrder = () => {
    localStorage.removeItem('codOrder');
    setOrder(null);
    setSuccess(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
          <p className="text-gray-600">Your items, shipping, and payment</p>
        </div>

        {/* Success */}
        {success && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 font-medium">
            {paymentMethod === 'cod' ? 'Advance Paid! Remaining on delivery.' : 'Payment Complete!'}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* PRODUCT LIST */}
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h2 className="text-xl font-bold mb-4">Your Items</h2>
          <div className="space-y-4">
            {products.map((p) => (
              <div key={p.id} className="flex items-center gap-4 p-4 border rounded-lg bg-gray-50">
                <div className="w-16 h-16 bg-gray-200 border-2 border-dashed rounded-lg flex items-center justify-center">
                  <span className="text-xs text-gray-500">IMG</span>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{p.name}</p>
                  <div className="text-xs text-gray-600 space-y-1 mt-1">
                    <p>Quantity: <strong>{p.quantity}</strong></p>
                    <p>Weight: <strong>{p.weight}kg each</strong> → <strong>{(p.weight * p.quantity).toFixed(2)}kg total</strong></p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">₹{p.price} × {p.quantity}</p>
                  <p className="font-bold text-lg">₹{(p.price * p.quantity).toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 pt-4 border-t flex justify-between font-bold text-lg">
            <span>Subtotal</span>
            <span>₹{subTotal.toFixed(2)}</span>
          </div>
        </div>

        {/* PINCODE & SHIPPING */}
        <div className="bg-white p-6 rounded-xl shadow-md">
          <label className="block font-medium mb-2 text-gray-700">Delivery Pincode</label>
          <input
            type="text"
            value={pincode}
            onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="e.g. 682001"
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />

          {shipLoad && (
            <p className="mt-3 text-sm text-blue-600 flex items-center">
              Calculating shipping...
            </p>
          )}

          {shipErr && (
            <p className="mt-3 text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
              {shipErr}
            </p>
          )}

          {/* SHIPPING RESULT */}
          {shipping && !shipLoad && (
            <div className="mt-5 p-5 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-indigo-200 rounded-xl">
              <div className="flex justify-between items-center mb-3">
                <span className="font-semibold text-gray-700">Delivery Zone</span>
                <span className={`px-4 py-1.5 rounded-full text-xs font-bold text-white ${
                  shipping.zone === 'Kerala' ? 'bg-green-600' :
                  shipping.zone === 'Outside Kerala' ? 'bg-orange-600' : 'bg-red-600'
                }`}>
                  {shipping.zone}
                </span>
              </div>

              <div className="flex justify-between text-sm py-1">
                <span>Base Shipping Rate</span>
                <span className={shipping.freeShipping ? 'line-through text-gray-500' : 'font-medium'}>
                  ₹{shipping.originalBase}
                </span>
              </div>

              {shipping.freeShipping && (
                <div className="flex items-center justify-between text-sm py-1 text-green-600 font-medium">
                  <span>Free Shipping Applied</span>
                  <span>-₹{shipping.originalBase}</span>
                </div>
              )}

              {shipping.weightCharge > 0 && (
                <div className="flex justify-between text-sm py-1 text-orange-600 font-medium">
                  <span>Weight Surcharge ({totalWeightKg.toFixed(2)}kg)</span>
                  <span>+₹{shipping.weightCharge}</span>
                </div>
              )}

              <div className="flex justify-between font-bold text-lg pt-3 border-t border-gray-300 mt-2">
                <span>Total Shipping Cost</span>
                <span className={shipping.totalShipping === 0 ? 'text-green-600' : 'text-indigo-700'}>
                  ₹{shipping.totalShipping}
                </span>
              </div>

              <div className="text-center text-xs text-gray-600 mt-3">
                Estimated Delivery: <strong>{shipping.estimatedDays} {shipping.estimatedDays === 1 ? 'day' : 'days'}</strong>
              </div>

              {shipping.zone === 'International' && (
                <p className="text-center text-xs text-red-600 mt-2 font-medium">
                  International delivery – higher rates apply.
                </p>
              )}
            </div>
          )}
        </div>

        {/* ORDER SUMMARY */}
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h2 className="font-bold mb-3">Order Summary</h2>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between"><span>Items Total</span> <span>₹{subTotal}</span></div>
            <div className="flex justify-between"><span>Shipping</span> <span>₹{shippingCost}</span></div>
            <div className="flex justify-between font-bold text-xl border-t pt-3">
              <span>Grand Total</span>
              <span>₹{grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* PAYMENT METHOD */}
        <div className="bg-white p-6 rounded-xl shadow-md space-y-4">
          <h2 className="font-bold">Payment Method</h2>

          <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
            <input type="radio" name="pay" value="online" checked={paymentMethod === 'online'} onChange={(e) => setPaymentMethod(e.target.value)} className="mr-3 h-5 w-5 text-green-600" />
            <div className="flex-1">
              <p className="font-medium">Pay Online</p>
              <p className="text-sm text-gray-600">Pay ₹{grandTotal.toFixed(2)} now</p>
            </div>
            <span className="font-bold text-green-600">₹{grandTotal.toFixed(2)}</span>
          </label>

          <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
            <input type="radio" name="pay" value="cod" checked={paymentMethod === 'cod'} onChange={(e) => setPaymentMethod(e.target.value)} className="mr-3 h-5 w-5 text-orange-600" />
            <div className="flex-1">
              <p className="font-medium">Cash on Delivery</p>
              <p className="text-sm text-gray-600">Pay ₹{codAdvance.toFixed(2)} advance</p>
            </div>
            <span className="font-bold text-orange-600">₹{codAdvance.toFixed(2)}</span>
          </label>

          <div className="p-4 bg-blue-50 rounded-lg text-center">
            <p className="font-medium text-blue-900">Pay Now:</p>
            <p className="text-2xl font-bold text-blue-600">₹{amountToPay.toFixed(2)}</p>
            {paymentMethod === 'cod' && (
              <p className="text-sm text-blue-700 mt-1">
                ₹{(grandTotal - amountToPay).toFixed(2)} on delivery
              </p>
            )}
          </div>
        </div>

        {/* PAY BUTTON */}
        {!order && (
          <button
            onClick={handlePayment}
            disabled={loading || shipLoad || !shipping}
            className={`w-full py-4 rounded-lg font-bold text-white transition flex items-center justify-center ${
              loading || !shipping ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {loading ? 'Processing...' : paymentMethod === 'cod' ? `Pay ₹${amountToPay.toFixed(2)} Advance` : `Pay ₹${grandTotal.toFixed(2)} Now`}
          </button>
        )}

        {/* SIMULATE DELIVERY */}
        {order?.paymentMethod === 'cod' && !order.fullPaid && (
          <button onClick={simulateDeliveryPayment} className="w-full py-4 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg">
            Simulate Delivery Payment (₹{order.remainingAmount.toFixed(2)})
          </button>
        )}

        {/* ORDER STATUS */}
        {order && (
          <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold">Order Status</h2>
              <button onClick={clearOrder} className="text-sm text-red-600 hover:underline">Clear</button>
            </div>
            <div className="text-sm space-y-2">
              <div className="flex justify-between"><span>ID</span> <code>{order.id}</code></div>
              <div className="flex justify-between"><span>Status</span> <span className="font-bold text-green-600">{order.status}</span></div>
              <div className="flex justify-between"><span>Advance</span> ₹{order.advanceAmount.toFixed(2)}</div>
              <div className="flex justify-between"><span>Remaining</span> <span className={order.remainingAmount > 0 ? 'text-orange-600' : 'text-green-600'}>₹{order.remainingAmount.toFixed(2)}</span></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}