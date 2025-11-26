# 📱 ScamPhone - E-commerce Platform for Tech Products
Link Project: https://scamphone-fe.vercel.app/

> **ScamPhone** is a comprehensive B2C e-commerce platform specialized in tech products (Smartphones, Laptops, Accessories, etc.). The system provides a seamless online shopping experience from product discovery and ordering to payment and delivery tracking.

---

## 🌟 Key Features

### 🛒 For Customers (User)
* **Smart Search & Filter:** Advanced search by name, category, brand, and price range with `SearchResultsPage`.
* **Interactive Product Details:**
    * High-quality images with zoom capabilities.
    * **Real-time Variant Selection:** Dynamic pricing and stock updates based on selected Color/Storage attributes.
    * **Social Features:** Share products (`ShareDialog`), Favorite products (`FavoriteButton`), and Reviews (`CommentSection`).
* **Shopping Experience:**
    * **Add to Cart Animation:** Visual feedback when adding items.
    * **Cart Management:** Add/Update/Remove items via `CartDropdown` or `CartPage`.
    * **Optimized Checkout:** 3-step process: Cart -> Shipping Info -> Payment.
* **Payment Methods:**
    * **COD (Cash on Delivery)**.
    * **VNPAY** (Integrated Payment Gateway Sandbox).
* **Account & Profile:**
    * Secure Registration/Login (JWT).
    * **Notification Center:** Real-time updates on order status and promotions.
    * **Order History:** Track order progress (Pending -> Shipping -> Completed).
    * **Password Reset:** Secure flow via Email/OTP.

### 🛠 For Administrators (Admin Dashboard)
* **Dashboard Overview:** Visual charts for revenue, new orders, and user growth statistics.
* **Product Management:**
    * Full CRUD operations for products.
    * **Advanced Inventory:** Manage SKU, price, and stock for each specific product variant.
* **Order Management:**
    * Process orders (Confirm/Reject/Ship).
    * Print invoices and update delivery driver details.
* **Promotion System:** Create and manage discount coupons (Percentage, Fixed amount, Free shipping).
* **User Management:** Manage customer accounts and roles.

---

## 🛠 Tech Stack

This project is built using the **MERN Stack** with a Monorepo architecture.

### **Frontend (`/Scamphone-FE`)**
* **Core:** [React](https://reactjs.org/) (Vite), [TypeScript](https://www.typescriptlang.org/).
* **Styling:** [Tailwind CSS](https://tailwindcss.com/), [Shadcn UI](https://ui.shadcn.com/) (Component Library).
* **State Management:** [Zustand](https://github.com/pmndrs/zustand) (Global state for User & Cart).
* **Routing:** React Router DOM.
* **HTTP Client:** Axios.

### **Backend (`/Scamphone-BE`)**
* **Runtime:** [Node.js](https://nodejs.org/).
* **Framework:** [Express.js](https://expressjs.com/).
* **Database:** [MongoDB](https://www.mongodb.com/) (Mongoose ODM).
* **Authentication:** JWT (JSON Web Token), Bcrypt (Password hashing).
* **Payment:** VNPAY Sandbox Integration.

---

## 🚀 Getting Started

### Prerequisites
* Node.js (v14 or higher)
* MongoDB (Local or Atlas Cloud)
* Git
### 1. Clone the repository
```bash
git clone [https://github.com/your-username/full-stack-javascript-scamphoneapp.git](https://github.com/your-username/full-stack-javascript-scamphoneapp.git)
cd full-stack-javascript-scamphoneapp
2. Backend Setup (Server)
Navigate to the backend directory and install dependencies:
cd Scamphone-BE
npm install
Create a .env file in Scamphone-BE (copy from .env.production.example):
cp .env.production.example .env
Update your .env variables:
PORT=5000
MONGO_URI=mongodb://localhost:27017/scamphone
JWT_SECRET=your_super_secret_key
# VNPAY Config (Sandbox)
VNP_TMN_CODE=8DW7N5W5
VNP_HASH_SECRET=Y473FV82V4439K5FP4U9MNONIVJ6PC89
VNP_URL=[https://sandbox.vnpayment.vn/paymentv2/vpcpay.html](https://sandbox.vnpayment.vn/paymentv2/vpcpay.html)
VNP_RETURN_URL=http://localhost:5173/payment-result
Run the server:
npm run dev
# Server will start at http://localhost:5000
Frontend Setup (Client)
Open a new terminal, navigate to the frontend directory:
cd Scamphone-FE
npm install
Create a .env file (optional if using default):
VITE_API_URL=http://localhost:5000/api/v1
Run the application:
npm run dev
# App will run at http://localhost:5173
📂 Project Structure
full-stack-javascript-scamphoneapp/
├── Scamphone-BE/           # Backend Source Code
│   ├── Controllers/        # Business Logic (Order, Product, User, Payment...)
│   ├── Models/             # MongoDB Schemas (Product, Order, Review...)
│   ├── Routes/             # API Endpoint Definitions
│   ├── Middleware/         # Auth, Error handling
│   └── server.js           # Entry point
│
└── Scamphone-FE/           # Frontend Source Code
    ├── src/
    │   ├── components/     # UI Components & Pages
    │   │   ├── admin/      # Admin Dashboard Components
    │   │   ├── pages/      # Main Application Pages
    │   │   └── ui/         # Shadcn UI Base Components
    │   ├── services/       # API Services (Axios calls)
    │   ├── stores/         # Global State (Zustand)
    │   └── types/          # TypeScript Interfaces
    └── vite.config.ts      # Vite Configuration
🤝 Contributing
Contributions are always welcome! Please follow these steps:

Fork the project.

Create your Feature Branch (git checkout -b feature/AmazingFeature).

Commit your changes (git commit -m 'Add some AmazingFeature').

Push to the Branch (git push origin feature/AmazingFeature).

Open a Pull Request.
