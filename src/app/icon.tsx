import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/** Favicon: the same crane glyph as the header logo, on the brand ink square. */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#111827",
          borderRadius: 7,
        }}
      >
        <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
          <path d="M8 18V5" stroke="#f97316" strokeWidth="1.9" strokeLinecap="round" />
          <path d="M3 5h14" stroke="#f97316" strokeWidth="1.9" strokeLinecap="round" />
          <path d="M14.5 5v3.5" stroke="#f97316" strokeWidth="1.5" strokeLinecap="round" />
          <rect x="12.8" y="8.5" width="3.4" height="3" rx="0.8" fill="#f97316" />
          <path d="M5 18h6" stroke="#f97316" strokeWidth="1.9" strokeLinecap="round" />
        </svg>
      </div>
    ),
    size
  );
}
