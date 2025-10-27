/* eslint-disable @next/next/no-html-link-for-pages */
// src/app/success/page.jsx
export default function SuccessPage() {
  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <h1>Payment Successful</h1>
      <p>Your order has been placed successfully!</p>
      <a href="/" style={{ color: "#5469d4", textDecoration: "none" }}>
        Return to Home
      </a>
    </div>
  );
}