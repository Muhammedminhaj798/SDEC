'use client'
import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  PaymentRequestButtonElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';

// Initialize Stripe with your publishable key
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_51RCvmuPRjPoi48DF9n9eiEZqfOB0Hmxdf8ECOnjt2XuH1HqOvZnYXaqAd5tvt8xSsvfG0QLQdUrjPQmwlEhXACxd004adUqSFd');

// Card Element custom styling
const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      color: '#32325d',
      fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
      fontSmoothing: 'antialiased',
      fontSize: '16px',
      '::placeholder': {
        color: '#aab7c4',
      },
    },
    invalid: {
      color: '#fa755a',
      iconColor: '#fa755a',
    },
  },
};

const CheckoutForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const [paymentRequest, setPaymentRequest] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState('');

  // Initialize Google Pay / Apple Pay
  useEffect(() => {
    if (!stripe) return;

    const pr = stripe.paymentRequest({
      country: 'US',
      currency: 'usd',
      total: {
        label: 'Total',
        amount: 1000, // Amount in cents ($10.00)
      },
      requestPayerName: true,
      requestPayerEmail: true,
    });

    // Check if Google Pay / Apple Pay is available
    pr.canMakePayment().then((result) => {
      
      if (result) {
        setPaymentRequest(pr);
        console.log('Payment Request available:', result);
      } else {
        console.log('Google Pay / Apple Pay not available');
      }
    });

    // Handle payment method from Google Pay / Apple Pay
    pr.on('paymentmethod', async (ev) => {
      setLoading(true);
      setError(null);

      try {
        // Get JWT token (using in-memory storage instead of localStorage)
        const token = localStorage.getItem('token'); // Consider using sessionStorage
        console.log('tokenrtyuwerty',token);
        if (!token) {
          throw new Error('Authentication token not found. Please log in.');
        }

        // Call backend to create payment intent
        const response = await fetch('http://localhost:9090/api/payments/stripePayment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            amount: 1000, // Send amount to backend
            currency: 'usd',
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Payment failed');
        }

        // Confirm the payment with the payment method from Google/Apple Pay
        const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
          data.clientSecret,
          { payment_method: ev.paymentMethod.id },
          { handleActions: false }
        );

        if (confirmError) {
          ev.complete('fail');
          throw new Error(confirmError.message);
        }

        // Handle additional actions if needed (e.g., 3D Secure)
        if (paymentIntent.status === 'requires_action') {
          const { error: actionError } = await stripe.confirmCardPayment(data.clientSecret);
          if (actionError) {
            ev.complete('fail');
            throw new Error(actionError.message);
          }
        }

        ev.complete('success');
        setSuccess(true);
        setMessage('Payment successful! 🎉');
      } catch (err) {
        setError(err.message);
        if (ev.complete) {
          ev.complete('fail');
        }
      } finally {
        setLoading(false);
      }
    });

    // Cleanup
    return () => {
      pr.off('paymentmethod');
    };
  }, [stripe]);

  const handleCardPayment = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Get JWT token
      const token = sessionStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found. Please log in.');
      }

      // Call backend to create payment intent
      const response = await fetch('http://localhost:9090/api/payments/stripePayment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: 1000,
          currency: 'usd',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Payment failed');
      }

      // Get card element
      const cardElement = elements.getElement(CardElement);

      // Confirm payment with card details
      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
        data.clientSecret,
        {
          payment_method: {
            card: cardElement,
          },
        }
      );

      if (confirmError) {
        throw new Error(confirmError.message);
      }

      if (paymentIntent.status === 'succeeded') {
        setSuccess(true);
        setMessage('Payment successful! 🎉');
        cardElement.clear();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-lg">
        <div className="text-center">
          <div className="mb-4 text-green-500">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Payment Successful!</h2>
          <p className="text-gray-600 mb-6">{message}</p>
          <button
            onClick={() => {
              setSuccess(false);
              setMessage('');
            }}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Make Another Payment
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Complete Your Payment</h2>

      <form onSubmit={handleCardPayment}>
        {/* Google Pay / Apple Pay Button */}
        {paymentRequest && (
          <div className="mb-6">
            <PaymentRequestButtonElement 
              options={{ 
                paymentRequest,
                style: {
                  paymentRequestButton: {
                    type: 'default', // 'default', 'buy', 'donate'
                    theme: 'dark', // 'dark', 'light', 'light-outline'
                    height: '48px',
                  },
                },
              }} 
            />
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or pay with card</span>
              </div>
            </div>
          </div>
        )}

        {/* Card Element */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Card Details
          </label>
          <div className="p-3 border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
            <CardElement options={CARD_ELEMENT_OPTIONS} />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!stripe || loading}
          className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-colors ${
            loading || !stripe
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </span>
          ) : (
            'Pay $10.00'
          )}
        </button>
      </form>

      <div className="mt-4 text-center text-xs text-gray-500">
        <p>Secured by Stripe • Google Pay available on supported devices</p>
      </div>
    </div>
  );
};

// Main Payment Component wrapped with Elements provider
const PaymentComponent = () => {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm />
    </Elements>
  );
};

export default PaymentComponent;