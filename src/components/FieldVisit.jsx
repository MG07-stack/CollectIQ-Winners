import React, { useState, useEffect } from "react";
import { MapPin, CheckCircle, Wifi, IndianRupee, Radio } from "lucide-react";
import { PANEL, BORDER, CANVAS, TEXT, SUBTLE, PRIMARY, money } from "../theme.js";

const OUTCOMES = [
  "Promised Payment",
  "Collected Cash",
  "Contacted Customer",
  "Customer Unavailable",
];

export default function FieldVisit({ invoices, onRecordVisit }) {
  const openInvoices = invoices.filter((i) => i.status !== "Paid");

  const [selectedInvoiceId, setSelectedInvoiceId] = useState(openInvoices[0]?.id || "");
  const [outcome, setOutcome] = useState("Promised Payment");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [nfcScanning, setNfcScanning] = useState(false);
  const [nfcStatusMsg, setNfcStatusMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const selectedInv = openInvoices.find((i) => i.id === selectedInvoiceId) || openInvoices[0];

  useEffect(() => {
    if (selectedInv) {
      setAmount(selectedInv.amount.toString());
    }
  }, [selectedInvoiceId]);

  async function handleNfcScan() {
    setNfcScanning(true);
    setNfcStatusMsg("Scanning... Hold phone near NFC tag.");

    if ("NDEFReader" in window) {
      try {
        const ndef = new window.NDEFReader();
        await ndef.scan();
        setNfcStatusMsg("NFC hardware active. Tap physical tag now...");

        ndef.addEventListener("reading", ({ serialNumber, message }) => {
          let text = serialNumber || "";
          for (const record of message.records) {
            if (record.recordType === "text") {
              const textDecoder = new TextDecoder(record.encoding);
              text = textDecoder.decode(record.data);
            }
          }
          processNfcData(text);
          setNfcScanning(false);
        });

        ndef.addEventListener("readingerror", () => {
          setNfcStatusMsg("Error reading NFC tag. Try again.");
          setNfcScanning(false);
        });
        return;
      } catch (err) {
        console.warn("Native NFC hardware initialization fallback:", err);
      }
    }

    // Interactive Simulation Fallback (Desktop / non-NFC browsers)
    setTimeout(() => {
      if (openInvoices.length > 0) {
        const randomInv = openInvoices[Math.floor(Math.random() * openInvoices.length)];
        setSelectedInvoiceId(randomInv.id);
        setAmount(randomInv.amount.toString());
        setNfcStatusMsg(`NFC Tag Read! Matched Customer: ${randomInv.customer} (${randomInv.id})`);
      } else {
        setNfcStatusMsg("NFC Tag Read! No open invoice found.");
      }
      setNfcScanning(false);
      setTimeout(() => setNfcStatusMsg(""), 4000);
    }, 800);
  }

  function processNfcData(payloadText) {
    const matchedInv = openInvoices.find((i) =>
      i.customer.toLowerCase().includes(payloadText.toLowerCase()) || payloadText.toLowerCase().includes(i.customer.toLowerCase())
    ) || openInvoices[0];

    if (matchedInv) {
      setSelectedInvoiceId(matchedInv.id);
      setAmount(matchedInv.amount.toString());
      setNfcStatusMsg(`Hardware NFC Tag Matched: ${matchedInv.customer}`);
    } else {
      setNfcStatusMsg(`NFC Tag Payload: ${payloadText}`);
    }
    setTimeout(() => setNfcStatusMsg(""), 4000);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!selectedInv) return;

    await onRecordVisit({
      customer: selectedInv.customer,
      invoiceId: selectedInv.id,
      outcome,
      amount: Number(amount) || 0,
      notes,
    });

    setSuccessMsg(`Field visit for ${selectedInv.customer} (${selectedInv.id}) logged successfully!`);
    setNotes("");
    setTimeout(() => setSuccessMsg(""), 4500);
  }

  return (
    <div className="rounded-xl p-4 sm:p-5 flex flex-col gap-4" style={{ backgroundColor: PANEL, border: `1px solid ${BORDER}` }}>
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white" style={{ backgroundColor: PRIMARY }}>
            <MapPin size={16} />
          </div>
          <div>
            <h3 className="text-sm font-semibold" style={{ color: TEXT }}>Record Field Visit</h3>
            <p className="text-xs" style={{ color: SUBTLE }}>Log audit outcome & update invoice status</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleNfcScan}
          disabled={nfcScanning}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all active:scale-95 shadow-sm cursor-pointer"
          style={{ borderColor: PRIMARY, color: PRIMARY, backgroundColor: nfcScanning ? "rgba(47,111,94,0.1)" : "transparent" }}
        >
          {nfcScanning ? <Radio size={14} className="animate-spin" /> : <Wifi size={14} />}
          {nfcScanning ? "Scanning NFC..." : "Scan NFC Tag"}
        </button>
      </div>

      {nfcStatusMsg && (
        <div className="flex items-center gap-2 text-xs rounded-lg px-3 py-2 animate-in fade-in" style={{ backgroundColor: "#EBF3FA", color: "#1D5C96" }}>
          <Radio size={14} className="animate-pulse" /> {nfcStatusMsg}
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-2 text-xs rounded-lg px-3 py-2 animate-in fade-in" style={{ backgroundColor: "#EBF5F0", color: "#2D6A4F" }}>
          <CheckCircle size={14} /> {successMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium" style={{ color: SUBTLE }}>Select Customer & Open Invoice</label>
          <select
            value={selectedInvoiceId}
            onChange={(e) => setSelectedInvoiceId(e.target.value)}
            className="w-full text-xs sm:text-sm rounded-lg px-3 py-2 outline-none cursor-pointer"
            style={{ border: `1px solid ${BORDER}`, backgroundColor: CANVAS, color: TEXT }}
          >
            {openInvoices.map((inv) => (
              <option key={inv.id} value={inv.id}>
                {inv.customer} — [{inv.id}] ({money(inv.amount)} open)
              </option>
            ))}
          </select>
        </div>

        {selectedInv && (
          <div className="text-xs p-2.5 rounded-lg flex justify-between items-center" style={{ backgroundColor: CANVAS }}>
            <div className="flex flex-col">
              <span className="font-semibold text-xs" style={{ color: TEXT }}>{selectedInv.customer}</span>
              <span className="text-[11px]" style={{ color: SUBTLE }}>{selectedInv.daysOverdue > 0 ? `${selectedInv.daysOverdue} days overdue` : "Current balance"}</span>
            </div>
            <span className="font-semibold font-mono text-sm" style={{ color: TEXT }}>{money(selectedInv.amount)}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium" style={{ color: SUBTLE }}>Outcome</label>
            <select
              value={outcome}
              onChange={(e) => setOutcome(e.target.value)}
              className="w-full text-xs sm:text-sm rounded-lg px-2.5 py-2 outline-none cursor-pointer"
              style={{ border: `1px solid ${BORDER}`, backgroundColor: CANVAS, color: TEXT }}
            >
              {OUTCOMES.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium" style={{ color: SUBTLE }}>Collected / Promised (₹)</label>
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-semibold text-xs" style={{ color: SUBTLE }}>₹</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="w-full text-xs sm:text-sm rounded-lg pl-6 pr-2 py-2 outline-none"
                style={{ border: `1px solid ${BORDER}`, backgroundColor: CANVAS, color: TEXT }}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium" style={{ color: SUBTLE }}>Visit Notes</label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Key discussion points, cheque/payment details..."
            className="w-full text-xs sm:text-sm rounded-lg p-2.5 outline-none resize-none"
            style={{ border: `1px solid ${BORDER}`, backgroundColor: CANVAS, color: TEXT }}
          />
        </div>

        <button
          type="submit"
          className="w-full mt-1 py-2.5 rounded-lg text-xs sm:text-sm font-semibold text-white transition-opacity active:opacity-90 shadow-sm cursor-pointer"
          style={{ backgroundColor: PRIMARY }}
        >
          Submit Field Visit & Update Invoice
        </button>
      </form>
    </div>
  );
}
