# CollectIQ — Collections Dashboard with NFC Customer Identification

CollectIQ is a field collections dashboard featuring NFC-based customer identification and automatic visit recording.

## NFC Customer Identification Flow

```text
NFC CARD (NTAG213/215/216)
       ↓
Tap with mobile phone
       ↓
Phone opens CollectIQ customer URL (/customer/CUST001)
       ↓
Customer identified (Sharma Traders)
       ↓
Profile loads & backend records audit visit automatically
       ↓
"✓ Visit Recorded" notification appears
       ↓
Dashboard live activity feed updates
```

---

## NFC Card Programming Instructions

The physical NFC card should **only store the customer-specific URL**. It does not store raw customer data.

### Example Configuration:
* **Customer**: Sharma Traders
* **Customer ID**: `CUST001`
* **NFC URL**: `http://localhost:5173/customer/CUST001` (or your production domain e.g., `https://your-collectiq-domain.com/customer/CUST001`)

### Steps to write to any NFC card (using phone):
1. Install **NFC Tools** (available on iOS and Android).
2. Tap **Write** → **Add a record** → **Custom URL / URI**.
3. Enter your customer URL (e.g. `http://YOUR-DOMAIN/customer/CUST001`).
4. Tap **Write** and touch the physical NFC card/sticker to your phone's NFC reader antenna.
5. Ready! When field agents tap this card, the customer profile opens and the visit is recorded.

---

## Available Customer IDs for Testing

| Customer ID | Customer Name | Outstanding | Overdue |
|---|---|---|---|
| `CUST001` | Sharma Traders | ₹45,000 | ₹12,000 |
| `CUST002` | Tata Consultancy Services | ₹380,000 | ₹0 |
| `CUST003` | Reliance Digital | ₹240,000 | ₹240,000 |
| `CUST004` | Infosys Technologies | — | — |
| `INVALID999` | *(Invalid Test)* | *Shows Customer Not Found* | — |

---

## Quick Start & Running Locally

### 1. Start Frontend (Vite)
```bash
npm run dev
```
Open `http://localhost:5173`.

### 2. Start Backend Server (Optional / Full Stack)
```bash
npm run server
```
Runs on `http://localhost:5000`.

---

## Testing the NFC Flow

1. Open `http://localhost:5173/customer/CUST001` directly in your browser.
2. Observe the **✓ Visit Recorded** banner appear automatically.
3. Check the customer metrics:
   - Outstanding: **₹45,000**
   - Overdue: **₹12,000**
4. Click **[ View Invoices ]** to inspect open invoices or **[ Record Payment ]** to collect money on site.
5. Click **[ Back to Dashboard ]** and observe the **Recent Collection & NFC Activity** feed updated with Sharma Traders.
6. Test error handling by navigating to `http://localhost:5173/customer/INVALID999`.

