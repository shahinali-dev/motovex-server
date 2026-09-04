# Motovex — Lube & Care Dealership Management API

Backend API for **Motovex**, a lube & spare-parts dealership business management
system: authentication, product & inventory management (Box/Pieces units),
shops, orders, and a full suite of sales/inventory/profit reports.

Built with **Express + TypeScript + Mongoose**, following the same modular
architecture (`controller / service / model / interface / validation` per
feature) as the reference repo
[`express-mongoose-app-structure`](https://github.com/shahinali-dev/express-mongoose-app-structure).

---

## 1. Setup

```bash
npm install
cp .env.example .env    # then edit values (DB_URL, JWT secrets, etc.)
```

Start MongoDB locally (or use Atlas), then:

```bash
npm run dev        # ts-node-dev, hot reload
```

### Create the first Admin user

User creation is admin-only via the API, so there's a one-time seed script to
bootstrap the very first admin (reads `SEED_ADMIN_*` from `.env`):

```bash
npm run seed:admin
```

Then sign in with that email/password via `POST /api/v1/auth/signin`.

### Build for production

```bash
npm run build
npm run prod
```

---

## 2. Roles

| Role      | Can do |
|-----------|--------|
| `admin`   | Everything — manage users, shops, products, stock, orders, all reports |
| `manager` | Manage shops/products/stock/orders, view all reports |
| `staff`   | View shops/products, create orders & update order status — **cannot** see cost/profit reports or manage users |

---

## 3. Core concept: Box vs Pieces

Every product has a `piecesPerBox` (e.g. 1 box of engine oil = 12 pieces).
**All stock is stored internally in Pieces** — the base unit — so numbers
never drift no matter which unit someone uses at the counter.

- Adding stock, placing an order, or doing a manual adjustment: you send
  `{ quantity, unit: "box" | "pieces" }` and the backend converts it.
- Every product response also includes computed `stockInBoxes` +
  `stockRemainderPieces` so the UI can show "3 boxes, 4 pcs" directly.
- Every stock change (opening stock, manual in/out, order sold, order
  cancelled/returned) is written to an immutable `StockLog` ledger — this is
  what the Inventory report and low-stock alert are built from, and it gives
  you a full audit trail per product (`GET /api/v1/stock/:productId/logs`).

## 4. Order → Stock → Profit flow

1. Order is created against a Shop, with line items `{ product, quantity, unit }`.
2. At creation time, Motovex snapshots each product's current
   `costPricePerPiece` / `sellingPricePerPiece` onto the order line (so later
   price changes never retroactively change historical order profit), and
   **immediately deducts stock** (order = reserved/sold stock).
3. `totalAmount`, `totalCost`, `totalProfit` are computed and stored on the
   order (and per line item).
4. Status flow: `pending → processing → delivered`, or `→ cancelled`
   (from pending/processing), or `delivered → returned`. Cancelling or
   returning an order **automatically restocks** the pieces it had reserved.
5. All reports are simply aggregations over the `Order` collection (excluding
   `cancelled` orders), so they always match what's actually in the ledger.

## 5.1 Due / payment tracking

Every order carries `totalAmount`, `paidAmount` (default `0`) and a computed
`dueAmount` virtual (`totalAmount - paidAmount`), plus a `paymentStatus`
(`unpaid → partial → paid`) that's derived automatically whenever a payment
is recorded — no manual bookkeeping needed.

- A shop doesn't have to pay in full at once. `POST /payments/orders/:orderId`
  records **one payment event** (full or partial) against an order, and each
  payment is written to an immutable `Payment` ledger (amount, method,
  who received it, and a snapshot of paid/due right after that payment) —
  so you get a full partial-payment history per order, not just a single number.
- **Total due** and the **due shop list** (`GET /payments/due-shops`) are
  aggregated live from all orders with `unpaid`/`partial` status — always
  in sync, nothing to recompute by hand.
- Cancelling/returning an order that already has a payment against it is
  blocked (`400`) until the payment is resolved first — this stops due
  numbers from silently going wrong.
- Due is tracked independent of delivery status (a `pending` order can also
  carry an advance payment) but naturally most due tracking happens once an
  order is `delivered` and the shop still owes money for it.

> Order creation uses a MongoDB transaction when available (replica set /
> Atlas) so multi-item orders deduct stock atomically. On a standalone
> single-node MongoDB (no replica set) it automatically falls back to a
> sequential best-effort execution, so local dev works out of the box too.

---

## 5. API Reference

All routes are prefixed with `/api/v1`. Send the JWT either as an
`access-token` cookie (set automatically on sign-in) or `Authorization: Bearer <token>`.

### Auth
| Method | Route | Access | Description |
|---|---|---|---|
| POST | `/auth/signin` | Public | `{ email, password }` → sets cookies + returns token |
| GET  | `/auth/me` | Authenticated | Current user info |
| POST | `/auth/signout` | Authenticated | Clears cookies |

### Users
| Method | Route | Access | Description |
|---|---|---|---|
| POST | `/users` | Admin | Create a user (admin/manager/staff) |
| GET  | `/users` | Admin, Manager | List users (`?search=&role=&page=&limit=`) |
| GET  | `/users/:id` | Admin, Manager | Get one user |
| PATCH| `/users/:id` | Admin | Update name/role/phone/isActive |
| DELETE | `/users/:id` | Admin | Delete a user |

### Shops
| Method | Route | Access | Description |
|---|---|---|---|
| POST | `/shops` | Admin, Manager | `{ shopName, ownerName, contactInfo: { phone, email?, address? } }` |
| GET  | `/shops` | Authenticated | List (`?search=&isActive=&page=&limit=`) |
| GET  | `/shops/:id` | Authenticated | Get one shop |
| PATCH| `/shops/:id` | Admin, Manager | Update shop |
| DELETE | `/shops/:id` | Admin | Delete shop |

### Products
| Method | Route | Access | Description |
|---|---|---|---|
| POST | `/products` | Admin, Manager | Create product (see body below) |
| GET  | `/products` | Authenticated | List (`?search=&category=&brand=&lowStock=true&isActive=&page=&limit=`) |
| GET  | `/products/:id` | Authenticated | Get one product |
| PATCH| `/products/:id` | Admin, Manager | Update product |
| DELETE | `/products/:id` | Admin | Delete product |

Create product body:
```json
{
  "name": "Castrol GTX 20W-50 1L",
  "sku": "CAS-GTX-20W50-1L",
  "category": "Engine Oil",
  "brand": "Castrol",
  "piecesPerBox": 12,
  "costPricePerPiece": 450,
  "sellingPricePerPiece": 550,
  "lowStockThresholdPieces": 24,
  "openingStock": { "quantity": 5, "unit": "box" }
}
```

### Stock (inventory adjustments & audit log)
| Method | Route | Access | Description |
|---|---|---|---|
| POST | `/stock/:productId/adjust` | Admin, Manager | `{ quantity, unit: "box"|"pieces", direction: "in"|"out", note? }` |
| GET  | `/stock/:productId/logs` | Authenticated | Paginated movement history for a product |

### Orders
| Method | Route | Access | Description |
|---|---|---|---|
| POST | `/orders` | Admin, Manager, Staff | Create order (body below) |
| GET  | `/orders` | Authenticated | List (`?shop=&status=&startDate=&endDate=&page=&limit=`) |
| GET  | `/orders/:id` | Authenticated | Get one order |
| PATCH| `/orders/:id/status` | Admin, Manager, Staff | `{ status, note? }` — see allowed transitions above |

Create order body:
```json
{
  "shop": "<shopId>",
  "notes": "Urgent restock",
  "items": [
    { "product": "<productId>", "quantity": 2, "unit": "box" },
    { "product": "<productId2>", "quantity": 15, "unit": "pieces" }
  ]
}
```

### Payments / Due tracking
| Method | Route | Access | Description |
|---|---|---|---|
| POST | `/payments/orders/:orderId` | Authenticated | Record a payment: `{ amount, method, note?, paymentDate? }`. Send `amount` = current due for a full settlement, or less for a partial payment. Rejects if `amount` > due, or if order is `cancelled`/`returned`. |
| GET  | `/payments/orders/:orderId` | Authenticated | Paginated payment history for one order (every partial payment logged) |
| GET  | `/payments/due-orders` | Authenticated | Every order with an outstanding due (`?shop=&paymentStatus=unpaid|partial&page=&limit=`) |
| GET  | `/payments/due-shops` | Authenticated | **Due shop list** — every shop with an outstanding balance, sorted most-due-first, with `totalDue/totalBilled/totalPaid/dueOrderCount` |
| GET  | `/payments/due-shops/:shopId` | Authenticated | Due summary + the actual list of unpaid/partial orders for one shop |
| GET  | `/payments/summary` | Authenticated | Dashboard totals: overall outstanding due + amount collected in a date range (`?startDate=&endDate=`) |

`PaymentMethod`: `cash \| bkash \| nagad \| rocket \| bank_transfer \| cheque \| other`

### Reports
| Method | Route | Access | Description |
|---|---|---|---|
| GET | `/reports/inventory` | Authenticated | Current stock + stock valuation (`?category=&isActive=`) |
| GET | `/reports/low-stock` | Authenticated | Products at/below their threshold |
| GET | `/reports/sales` | Admin, Manager | Sales totals + by-product + by-shop (`?startDate=&endDate=&shop=&product=`) |
| GET | `/reports/daily` | Admin, Manager | Single day sales & profit (`?date=YYYY-MM-DD`, default today) |
| GET | `/reports/monthly` | Admin, Manager | Month totals + day-by-day breakdown (`?month=1-12&year=`) |
| GET | `/reports/yearly` | Admin, Manager | Year totals + month-by-month breakdown (`?year=`) |
| GET | `/reports/lifetime` | Admin, Manager | All-time totals, best sellers, top shops |

---

## 6. Project structure

```
src/
  app.ts, server.ts, config/
  errors/, interface/, middleware/, utils/, types/express/
  router/router.ts              # mounts every module
  seed/seed_admin.ts            # bootstrap first admin
  modules/
    user/     auth/     shop/
    product/  stock/    order/  report/
```

Each module follows: `*.model.ts` (Mongoose schema) → `*.interface.ts` (TS
types) → `*.validation.ts` (Zod) → `*.service.ts` (business logic) →
`*.controller.ts` (Express routes).
