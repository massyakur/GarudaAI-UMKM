
# Prompt for Codex Agent – Frontend (English)

## Background and Goal

You will be working on the **frontend** of a project called **Smart Financial Assistant** (Asisten Keuangan Cerdas) for Indonesian SMEs. The goal is to provide a simple web interface that allows SMEs to automatically digitise their bookkeeping via OCR, view financial summaries, manage core business data (products, customers, transactions) and check their credit eligibility. Research indicates that SMEs struggle with manual bookkeeping and difficult access to fundingfile:///home/oai/share/Laporan%20Riset_%20Inovasi%20Proyek%20AI%20untuk%20Mendukung%20UMKM%20Indonesia%202025.pdf#:~:text=4. The assistant solves these issues by allowing users to upload photos of receipts, converting them into structured data, generating simple profit/loss reports, and offering a quick pre‑qualification for KUR loansfile:///home/oai/share/Laporan%20Riset_%20Inovasi%20Proyek%20AI%20untuk%20Mendukung%20UMKM%20Indonesia%202025.pdf.

### Key Features to Support

1. **Authentication & Session Management** – The frontend must support user sign‑in, sending credentials to the backend and storing the returned JWT. Authentication data should be managed client‑side (e.g., using React context and localStorage). A separate registration flow may be added later if the API exposes one.
2. **Business Data Management** – Provide UI for managing **products**, **customers**, and **transactions** using the backend’s CRUD endpoints. This includes creating new records, listing existing ones with pagination/filters, editing and deleting them.
3. **Receipt OCR Upload** – Users must be able to upload images of receipts/notes; the app sends the image to the backend and displays extracted text so the user can confirm and categorise the transactionfile:///home/oai/share/Laporan%20Riset_%20Inovasi%20Proyek%20AI%20untuk%20Mendukung%20UMKM%20Indonesia%202025.pdf#:~:text=,catatan%20digital%20yang%20%20terstruktur.
4. **Financial Summaries & Analytics** – Users should view dashboards and reports summarising revenue, profit, top products, payment method stats, etc. Use the analytics endpoints providedfile:///home/oai/share/Laporan%20Riset_%20Inovasi%20Proyek%20AI%20untuk%20Mendukung%20UMKM%20Indonesia%202025.pdf#:~:text=digital%20yang%20%20terstruktur%20%28pembukuan%29,ingin%20%20mengajukan%20%20modal.
5. **Credit Eligibility Check** – Provide a simple button to call the backend’s credit‑prequalification logic (if exposed) and display the returned score/suggestionfile:///home/oai/share/Laporan%20Riset_%20Inovasi%20Proyek%20AI%20untuk%20Mendukung%20UMKM%20Indonesia%202025.pdf#:~:text=asisten%20%20ini%20%20bertindak,membantu%20mengisi%20formulir%20aplikasi%20pinjaman.

## Codebase and Constraints

- **Base Template**: Use the [codeguide‑starter‑lite](https://github.com/CodeGuide-dev/codeguide-starter-lite) repository. This Next.js 15 project uses TypeScript, Tailwind, and shadcn/ui.
- **No Supabase or Clerk**: Remove or ignore all Supabase and Clerk authentication/database code; the project must communicate only with our custom FastAPI backend.
- **API Base URL**: The backend is hosted at **`https://9812afe22a53.ngrok-free.app/`**. All API calls should be prefixed with this base. Store it in `NEXT_PUBLIC_API_URL`.
- **Language**: All code and documentation should be in English. UI can remain in Indonesian if needed.

## Available API Endpoints

The backend exposes RESTful endpoints under `/api/v1`. You must integrate the following:

### Authentication
- `POST /api/v1/login` – Log the user in. Request body: `{ "email": string, "password": string }`. Response includes `access_token` and `user`. Store the token for subsequent requests. (There is no registration endpoint at present; assume user accounts are managed elsewhere.)

### Products
- `POST /api/v1/products/` – Create a new product (request body uses `ProductCreate`).
- `GET /api/v1/products/` – Retrieve a list of products. Supports query parameters `skip`, `limit`, `umkm_id`, `category`, `is_active` for filtering.
- `GET /api/v1/products/{product_id}` – Retrieve a single product by ID.
- `PUT /api/v1/products/{product_id}` – Update a product.
- `DELETE /api/v1/products/{product_id}` – Delete a product.

### Customers
- `POST /api/v1/customers/` – Create a new customer (request body uses `CustomerCreate`).
- `GET /api/v1/customers/` – Retrieve a list of customers. Supports `skip`, `limit`, `umkm_id`, `search` queries.
- `GET /api/v1/customers/{customer_id}` – Retrieve a customer.
- `PUT /api/v1/customers/{customer_id}` – Update a customer.
- `DELETE /api/v1/customers/{customer_id}` – Delete a customer.

### Transactions
- `POST /api/v1/transactions/` – Create a transaction. Query parameter `user_id` is required, and body uses `TransactionCreate` schema.
- `GET /api/v1/transactions/` – List transactions with optional filters (`skip`, `limit`, `umkm_id`, `payment_status`, `start_date`, `end_date`).
- `GET /api/v1/transactions/{transaction_id}` – Retrieve a specific transaction.
- `PUT /api/v1/transactions/{transaction_id}` – Update a transaction.
- `DELETE /api/v1/transactions/{transaction_id}` – Delete a transaction.

### Analytics & Reports
- `GET /api/v1/analytics/dashboard` – Returns a dashboard summary with metrics like total revenue, total transactions, total customers/products, revenue growth, pending transactions, top products, payment method stats, and daily sales. Requires `umkm_id` and optional `days` (defaults to 30).
- `GET /api/v1/analytics/sales-report` – Generates a sales report summarising revenue, profit, transaction count and more. Requires `umkm_id` and optional `start_date`/`end_date`.
- `GET /api/v1/analytics/top-products` – Returns the best‑selling products. Requires `umkm_id`; optional `limit` and `days`.
- `GET /api/v1/analytics/monthly-report` – Returns monthly summaries for the past N months. Requires `umkm_id`; optional `months` (defaults to 6).
- `GET /api/v1/analytics/payment-methods` – Returns statistics for payment methods used. Requires `umkm_id` and optional `days`.

### Content Agent
- `POST /api/v1/content-agent/chat` – Chat with the AI content agent. Request body includes a `message` and optionally an image. The response includes the agent’s reply and a `thread_id`. Requires bearer token.
- `GET /api/v1/content-agent/history` – Retrieve conversation history. Accepts optional `limit` parameter. Requires bearer token.
- `DELETE /api/v1/content-agent/history` – Clear the conversation history. Requires bearer token.
- `DELETE /api/v1/content-agent/thread` – Delete the thread completely. Requires bearer token.

### Additional
- The root endpoint `/` simply returns a 200 OK and can be used as a health check.

## Tasks to Implement (Frontend Only)

### 1. Set Up API Helpers

- Create a module `src/lib/api.ts` that exports functions for each endpoint. Use `fetch` with `NEXT_PUBLIC_API_URL` as the base. Each function should attach the `Authorization: Bearer <token>` header when a token is available.
- For endpoints with query parameters, accept optional arguments in the helper functions and construct the query string accordingly.
- Handle JSON serialization/deserialization and HTTP error handling inside these helpers.

### 2. Clean Up Third‑Party Integrations

- Remove Supabase/Clerk code: delete or ignore files like `src/lib/supabase.ts`, `src/lib/user.ts`, `src/lib/env-check.ts`, and Clerk-related middleware.
- Implement `AuthContext` (`src/context/AuthContext.tsx`) to store the JWT token and user info. Provide methods `login(email, password)`, `logout()`, and `isAuthenticated`. Use `login()` to call `POST /api/v1/login`.
- Wrap your app with `AuthProvider` in `src/app/layout.tsx` and guard protected routes by checking `isAuthenticated`.

### 3. Build Management Pages

- **Login Page** (`src/app/login/page.tsx`): Create a form that posts the user’s email and password to the `login` API helper. On success, store the token via `AuthContext` and redirect to the dashboard.
- **Products Page** (`src/app/products/page.tsx`): Display a table of products using `GET /api/v1/products/`. Implement forms/modal dialogs to create (`POST /api/v1/products/`), update (`PUT /api/v1/products/{id}`) and delete (`DELETE /api/v1/products/{id}`) products. Include filters (category, is_active) and pagination.
- **Customers Page** (`src/app/customers/page.tsx`): Similar to Products page but for managing customers (`/api/v1/customers/`). Include search functionality.
- **Transactions Page** (`src/app/transactions/page.tsx`): List transactions and provide a form to create new ones via `POST /api/v1/transactions/`. Allow editing and deletion. If your OCR workflow saves transactions directly, ensure this page reflects those changes.
- **Dashboard Page** (`src/app/dashboard/page.tsx`): Fetch data from `/api/v1/analytics/dashboard` and display metrics (total revenue, transactions, customers, etc.) in cards. Provide charts/graphs for daily sales and revenue growth. Include a section for top products and payment method statistics.
- **Reports Page** (optional) (`src/app/reports/page.tsx`): Use `/api/v1/analytics/sales-report`, `/api/v1/analytics/monthly-report`, and `/api/v1/analytics/top-products` to display reports with date pickers for selecting periods.
- **Content Chat Page** (optional) (`src/app/content-agent/page.tsx`): Build a chat interface that sends user messages to `POST /api/v1/content-agent/chat` and displays the agent’s response. Provide a history tab using `GET /api/v1/content-agent/history` and buttons to reset or delete the thread.

### 4. Receipt OCR Workflow

- Provide a button or link in the Transactions page or elsewhere labelled “Upload Receipt”. When clicked, open a modal with a file input.
- On file selection, send the image to your custom OCR endpoint (if available) or the backend (if integrated). Since the given API spec does not include an OCR endpoint, assume the backend exposes it separately (e.g., `/api/v1/ocr/upload`). After receiving the OCR result (raw text), present a form to the user to confirm fields (date, items, amounts) and then call the `createTransaction` helper.

### 5. UI/UX Considerations

- Use shadcn/ui components (Button, Input, Dialog, Table, Card) and Tailwind for styling. Ensure mobile‑friendly design.
- Provide loading states while API calls are in progress and handle API validation errors gracefully.
- Persist the JWT token in localStorage or secure cookies and attach it automatically via `AuthContext`.

### 6. Documentation and Maintenance

- **Update `CLAUDE.md`**: Describe the new frontend architecture, removal of Supabase/Clerk, introduction of `api.ts` helpers, `AuthContext`, and all new pages. Document environment variables like `NEXT_PUBLIC_API_URL`. Provide examples of calling the product/customer/transaction APIs.
- Test all flows end‑to‑end: login, manage products/customers/transactions, view dashboard and reports, and chat with content agent.
- Keep code modular, follow the repository’s conventions, and write clear comments.

## Expected Outcome

By the end of this task, the frontend should provide a comprehensive management interface for products, customers, transactions, and analytics, all backed by the FastAPI endpoints above. Users will be able to log in, manage their data, upload receipts for OCR, view financial summaries, and interact with the AI content agent – all within a modern, responsive Next.js application.
