// src/app/confirm/page.jsx
"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

const ConfirmPayment = () => {
  const searchParams = useSearchParams();
  const clientSecret = searchParams.get("payment_intent_client_secret");

  useEffect(() => {
    if (clientSecret) {
      const paymentIntentId = clientSecret.split("_secret_")[0];
      fetch(`/api/verify-payment?paymentIntentId=${paymentIntentId}`, {
        headers: {
          Authorization: `Bearer your_jwt_token`, // Replace with actual token
        },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            window.location.href = "/success";
          } else {
            console.error("Payment verification failed:", data.message);
            window.location.href = "/error";
          }
        })
        .catch((err) => console.error("Error verifying payment:", err));
    }
  }, [clientSecret]);

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <h2>Processing Payment...</h2>
      <p>Please wait while we verify your payment.</p>
    </div>
  );
};

export default ConfirmPayment;