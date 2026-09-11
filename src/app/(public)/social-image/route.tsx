import { ImageResponse } from "next/og";

export const contentType = "image/png";

export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#f8fafc",
          color: "#111827",
          fontFamily: "sans-serif",
          padding: "64px",
        }}
      >
        <div
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            border: "2px solid #dbe2ea",
            background: "#ffffff",
            padding: "52px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
            <div
              style={{
                width: "64px",
                height: "64px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#1d4ed8",
                color: "#ffffff",
                fontSize: "32px",
                fontWeight: 800,
              }}
            >
              PG
            </div>
            <div style={{ display: "flex", fontSize: "32px", fontWeight: 800 }}>
              PropertyGoJB
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            <div
              style={{
                display: "flex",
                maxWidth: "900px",
                fontSize: "68px",
                lineHeight: 1.05,
                fontWeight: 800,
              }}
            >
              Johor Bahru property, made clearer.
            </div>
            <div style={{ display: "flex", fontSize: "28px", color: "#475569" }}>
              Compare verified projects, layouts, and availability.
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{ width: "96px", height: "8px", display: "flex", background: "#16a34a" }} />
            <div style={{ width: "48px", height: "8px", display: "flex", background: "#e11d48" }} />
            <div style={{ display: "flex", marginLeft: "12px", fontSize: "22px", color: "#64748b" }}>
              propertygojb.com
            </div>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}