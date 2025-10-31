Module 3 — Checkout & Payment Integration System (Zone-Based Shipping + Razorpay Integration)
■ Overview

This module implements a dynamic checkout and payment management system using Next.js, Tailwind CSS, Node.js, Express, and MongoDB.
It enables users to review their product details, calculate shipping based on pincode zones, and securely complete payments via Razorpay (UPI, Card, COD).

Admins can customize shipping policies, payment methods, and advance COD percentages, providing a flexible, real-world e-commerce payment flow.

The system also includes mock JSON data for pincode-based zone mapping and supports free shipping rules, advance COD logic, and realtime checkout updates.

■ Architecture Overview

Frontend: Next.js + Tailwind CSS
Backend: Node.js + Express
Database: MongoDB + Mongoose
Payments: Razorpay Integration (UPI, Card, COD)
Storage: LocalStorage for Admin Config (shipping + advance settings)
Security: JWT Authentication (Optional)

■ System Flow

User adds products to cart → proceeds to Checkout.

Checkout page shows product details, price, and weight.

User enters pincode → system determines zone (Kerala / Outside / International).

Based on zone + weight + order value, shipping charge and delivery timeframe are calculated.

If order value > ₹500 and zone is Kerala, free shipping is applied.

If Cash on Delivery (COD) is chosen, 10% advance payment is required.

Razorpay is used for both UPI and Card payments.

On payment success/failure, user and admin are updated instantly.

Admin panel allows customization of:

Base and per-kg shipping rates

Free shipping threshold

Zone-specific free shipping rules

COD advance percentage

Enable/disable payment methods (UPI, Card, COD)

■ Completed Features

✅ Checkout Page — with full product details and dynamic rate calculation
✅ Razorpay Integration — for Card, UPI, and COD advance payment
✅ Zone-based Shipping — Kerala / Outside / International
✅ Free Shipping Logic — for orders above ₹500 in Kerala zone
✅ Weight-based Charge Calculation
✅ Admin Panel — for managing payment modes and shipping configuration
✅ LocalStorage-based Config Persistence
✅ Real-time Checkout Update — reflects admin config instantly
✅ Error Handling — invalid pincode, failed payments, etc.
✅ Mock JSON for Zone Mapping (Kerala, Outside, International)
✅ Documentation + Test Cases