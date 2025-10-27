// src/app/error/page.jsx
export default function ErrorPage() {
  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <h1>Payment Failed</h1>
      <p>There was an issue processing your payment. Please try again.</p>
      <a href="/CheckoutPage" style={{ color: "#5469d4", textDecoration: "none" }}>
        Try Again
      </a>
    </div>
  );
}