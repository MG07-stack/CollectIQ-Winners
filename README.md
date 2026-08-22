# CollectIQ — Collections Dashboard (MVP)

## Structure
```
collectiq/
├── index.html              ← HTML entry point (loads fonts, mounts React)
├── src/
│   ├── main.jsx             ← React entry point
│   ├── App.jsx               ← Main app shell (tabs, layout)
│   ├── index.css             ← Global CSS / Tailwind
│   ├── theme.js               ← Colors & shared constants
│   ├── mockData.js             ← Mock invoices, customers, trend data
│   └── components/
│       ├── Sidebar.jsx
│       ├── KpiCard.jsx
│       ├── TrendChart.jsx
│       ├── PriorityDonut.jsx
│       ├── AgingMeter.jsx
│       ├── InvoiceTable.jsx
│       ├── InvoiceDrawer.jsx
│       ├── PriorityBadge.jsx
│       ├── StatusPill.jsx
│       └── CustomerDashboard.jsx
```

## Run it

```bash
npm install
npm run dev
```

Open the localhost URL it prints (usually http://localhost:5173).

## Connect to a real backend
Replace the contents of `src/mockData.js`'s `invoices` array with a fetch
call to your API. Keep the same shape per invoice:
```js
{ id, customer, amount, status, priority, daysOverdue, issued, due }
```
Everything else (charts, filters, tables) reads from that array and needs
no changes.
