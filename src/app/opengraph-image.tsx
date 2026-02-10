import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "マイプロンプト — バイブコーダーのためのプロンプト簡単メモサイト";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image(): ImageResponse {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #fef9c3 0%, #fde68a 30%, #facc15 70%, #eab308 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* Subtle pattern overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(circle at 20% 30%, rgba(255,255,255,0.3) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(255,255,255,0.2) 0%, transparent 50%)",
            display: "flex",
          }}
        />

        {/* Main content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "16px",
            zIndex: 1,
          }}
        >
          {/* Emoji icon */}
          <div
            style={{
              fontSize: "72px",
              marginBottom: "8px",
              display: "flex",
            }}
          >
            ✏️
          </div>

          {/* Title */}
          <div
            style={{
              fontSize: "56px",
              fontWeight: 800,
              color: "#1e293b",
              letterSpacing: "-0.02em",
              display: "flex",
            }}
          >
            マイプロンプト
          </div>

          {/* Tagline */}
          <div
            style={{
              fontSize: "24px",
              fontWeight: 500,
              color: "#475569",
              display: "flex",
            }}
          >
            バイブコーダーのためのプロンプト簡単メモサイト
          </div>

          {/* Feature badges */}
          <div
            style={{
              display: "flex",
              gap: "12px",
              marginTop: "24px",
            }}
          >
            {["保存", "整理", "共有", "派生"].map((label) => (
              <div
                key={label}
                style={{
                  background: "rgba(255,255,255,0.7)",
                  borderRadius: "24px",
                  padding: "8px 20px",
                  fontSize: "18px",
                  fontWeight: 600,
                  color: "#854d0e",
                  display: "flex",
                }}
              >
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div
          style={{
            position: "absolute",
            bottom: "24px",
            fontSize: "16px",
            color: "#92400e",
            fontWeight: 500,
            display: "flex",
          }}
        >
          myprompt-one.vercel.app
        </div>
      </div>
    ),
    { ...size }
  );
}
