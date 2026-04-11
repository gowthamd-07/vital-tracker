import { ImageResponse } from "next/og";
import { type NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const name = searchParams.get("name") || "User";
  const days = searchParams.get("days") || "0";
  const cw = searchParams.get("cw");
  const bmi = searchParams.get("bmi");
  const wc = searchParams.get("wc");
  const dir = searchParams.get("dir") || "lost";
  const streak = searchParams.get("streak");
  const goal = searchParams.get("goal");

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "60px",
          background: "linear-gradient(135deg, #059669, #0d9488, #0f766e)",
          color: "white",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "10px",
              background: "rgba(255,255,255,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "22px",
              fontWeight: 700,
            }}
          >
            V
          </div>
          <span
            style={{
              fontSize: "20px",
              fontWeight: 600,
              opacity: 0.8,
            }}
          >
            VitalTrack
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <h1
            style={{
              fontSize: "48px",
              fontWeight: 800,
              margin: 0,
              lineHeight: 1.1,
            }}
          >
            {name}&apos;s Health Progress
          </h1>

          <div
            style={{
              display: "flex",
              gap: "16px",
              flexWrap: "wrap",
            }}
          >
            {Number(days) > 0 && (
              <Stat label="Days Tracking" value={days} />
            )}
            {wc && (
              <Stat
                label={dir === "lost" ? "Weight Lost" : "Weight Gained"}
                value={`${wc} kg`}
              />
            )}
            {bmi && <Stat label="BMI" value={bmi} />}
            {streak && Number(streak) > 0 && (
              <Stat label="Best Streak" value={`${streak} days`} />
            )}
            {goal && cw && (
              <Stat
                label="Goal"
                value={`${cw} → ${goal} kg`}
              />
            )}
          </div>
        </div>

        <p style={{ fontSize: "16px", opacity: 0.6, margin: 0 }}>
          Track your weight, BMI, and habits at vitaltrack.app
        </p>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        background: "rgba(255,255,255,0.12)",
        borderRadius: "16px",
        padding: "16px 24px",
        minWidth: "140px",
      }}
    >
      <span
        style={{
          fontSize: "12px",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          opacity: 0.6,
        }}
      >
        {label}
      </span>
      <span style={{ fontSize: "32px", fontWeight: 800, marginTop: "4px" }}>
        {value}
      </span>
    </div>
  );
}
