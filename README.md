# PrepPal – Smart Meal & Pantry Management System

PrepPal is a smart web application designed to eliminate food waste and automate meal logistics. By combining pantry inventory tracking with dynamic meal planning, the system cross-references available ingredients against recipe requirements to generate real-time, non-redundant grocery shopping lists.

---

## 🚀 Features

*   **Pantry Management:** Add, update, and track ingredient stocks with metrics (quantities, units) and automated status indicators (`OK`, `Low Stock`, `Expired`).
*   **Notifications:** Get notifications when oantry items are in low stock and/or near expiry.
*   **Dynamic Meal Planning:** A 7x3 interactive weekly calendar (Breakfast, Lunch, Dinner) that allows users to schedule meals smoothly.
*   **Smart "Automatic Shopper" Algorithm:** Automatically checks pantry inventory when scheduling a meal. If ingredients are insufficient, the missing items are automatically calculated and pushed to the Grocery List without duplicating existing entries.
*   **Recipe Book:** A localized gallery to manage, search, and store custom culinary recipes with automated fallback placeholder images.

---

## 🛠️ Tech Stack

*   **Frontend:** HTML5, CSS3 (Modern Flexbox, Custom Grid layouts, Glassmorphism design elements), JavaScript (ES6+)
*   **State & Architecture:** Asynchronous programming (`async/await`), Persistent State via Browser Storage API (architected for transition to a Node/Express/MongoDB REST API)

---

## 📦 File Structure

```text
PrepPal/
│
├── css/
│   └── style.css          # Global styles, layout grids, modal effects, and responsive utilities
│
├── js/
│   └── app.js             # Core architecture: Auth logic, rendering engine, and sync algorithms
│
├── images/
│   └── recipe.avif        # Global structural fallback image asset
│
├── recipes.html           # Interface for recipe creation and gallery browsing
├── plan.html              # Interface for the 7-day visual meal scheduler
├── pantry.html            # Real-time ingredient tracking dashboard
└── notification.html      # Notifications for low stock or expiring pantry ingredients
└── grocery.html           # Automatically generated grocery list for all missing ingredients, we can also manually add items
