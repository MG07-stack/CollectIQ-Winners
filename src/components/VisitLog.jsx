import React from "react";
import { CheckCircle2, Clock, User, FileText } from "lucide-react";
import { PANEL, BORDER, TEXT, SUBTLE, MONO, money } from "../theme.js";

export default function VisitLog({ visits }) {
  if (!visits || visits.length === 0) {
    return (
      <div className="rounded-xl p-6 text-center text-xs sm:text-sm" style={{ backgroundColor: PANEL, border: `1px solid ${BORDER}`, color: SUBTLE }}>
        No field visits recorded yet today.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      {visits.map((v) => {
        const isCollected = v.outcome === "Collected Cash";
        return (
          <div
            key={v.id}
            className="rounded-xl p-3.5 flex flex-col gap-2"
            style={{ backgroundColor: PANEL, border: `1px solid ${BORDER}` }}
          >
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-xs sm:text-sm" style={{ color: TEXT }}>{v.customer}</span>
                <span
                  className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                  style={{
                    backgroundColor: isCollected ? "#EBF5F0" : "#F4F3EF",
                    color: isCollected ? "#2D6A4F" : TEXT,
                  }}
                >
                  {v.outcome}
                </span>
              </div>
              <span className="text-[11px] font-mono" style={{ color: SUBTLE }}>{v.date}</span>
            </div>

            {v.notes && (
              <p className="text-xs italic leading-relaxed" style={{ color: SUBTLE }}>
                "{v.notes}"
              </p>
            )}

            <div className="flex justify-between items-center text-xs pt-1" style={{ borderTop: `1px border ${BORDER}` }}>
              <div className="flex items-center gap-1.5" style={{ color: SUBTLE }}>
                <User size={12} />
                <span>{v.agent || "Agent"}</span>
              </div>
              {v.amount > 0 && (
                <span className="font-semibold tabular-nums text-xs sm:text-sm" style={{ color: TEXT, fontFamily: MONO }}>
                  {money(v.amount)}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
