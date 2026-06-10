"use client";

import { useEffect, useRef } from "react";

const EVENTS = [
  { type: "appointment", text: "Appointment booked · Dr. Mehta · Ward B", time: "just now" },
  { type: "invoice",     text: "Invoice #1042 issued · ₹4,800",           time: "1 min ago" },
  { type: "checkin",     text: "Dr. Priya Sharma checked in",              time: "2 min ago" },
  { type: "appointment", text: "Token #14 called · OPD Room 3",           time: "3 min ago" },
  { type: "patient",     text: "Patient record created · Arjun Mehta",    time: "4 min ago" },
  { type: "invoice",     text: "Payment received · ₹12,500 · UPI",        time: "5 min ago" },
  { type: "appointment", text: "Appointment cancelled · Rescheduled",      time: "6 min ago" },
  { type: "checkin",     text: "Dr. Ramesh Gupta schedule updated",        time: "7 min ago" },
  { type: "invoice",     text: "Invoice #1039 marked paid · ₹7,200",      time: "8 min ago" },
  { type: "patient",     text: "Lab results attached · Patient #2841",     time: "9 min ago" },
];

const dotColor: Record<string, string> = {
  appointment: "bg-[var(--accent)]",
  invoice:     "bg-[var(--success)]",
  checkin:     "bg-amber-500",
  patient:     "bg-purple-500",
};

export default function LiveTicker() {
  const trackRef = useRef<HTMLDivElement>(null);

  // Duplicate events so the scroll loops seamlessly
  const items = [...EVENTS, ...EVENTS];

  return (
    <div className="w-full overflow-hidden border-y border-[var(--border)] bg-[var(--gray-50)] py-2.5">
      {/* Screen-reader label */}
      <p className="sr-only">Live hospital activity feed</p>

      <div
        ref={trackRef}
        className="flex gap-0 ticker-track"
        style={{ width: "max-content" }}
      >
        {items.map((event, i) => (
          <div
            key={i}
            className="flex items-center gap-2.5 px-6 shrink-0"
            aria-hidden={i >= EVENTS.length}
          >
            {/* Separator dot between items */}
            {i !== 0 && (
              <span className="w-1 h-1 rounded-full bg-[var(--gray-300)] shrink-0 mx-2" />
            )}

            {/* Status dot */}
            <span
              className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor[event.type] ?? "bg-gray-400"}`}
            />

            {/* Event text */}
            <span className="text-xs text-[var(--text-secondary)] whitespace-nowrap font-mono tracking-tight">
              {event.text}
            </span>

            {/* Timestamp */}
            <span className="text-xs text-[var(--text-muted)] whitespace-nowrap ml-1">
              {event.time}
            </span>
          </div>
        ))}
      </div>

      <style jsx>{`
        .ticker-track {
          animation: ticker-scroll 40s linear infinite;
        }
        .ticker-track:hover {
          animation-play-state: paused;
        }
        @keyframes ticker-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}