"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from "recharts";

interface Point {
  date: string;
  weight: number;
  bodyFat?: number | null;
}

export function WeightChart({
  data,
  height = 280,
  showBodyFat = false,
}: {
  data: Point[];
  height?: number;
  showBodyFat?: boolean;
}) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-dashed border-zinc-300 py-16 text-zinc-500 dark:border-zinc-700">
        No weight data to chart yet.
      </div>
    );
  }

  const sorted = [...data].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
  const weights = sorted.map((d) => d.weight);
  const minW = Math.floor(Math.min(...weights) - 2);
  const maxW = Math.ceil(Math.max(...weights) + 2);
  const avg = weights.reduce((s, w) => s + w, 0) / weights.length;

  const hasBodyFat = showBodyFat && sorted.some((d) => d.bodyFat != null);

  return (
    <div className="space-y-4">
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={sorted} margin={{ top: 4, right: 12, left: -8, bottom: 0 }}>
          <defs>
            <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#059669" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#059669" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
            tickFormatter={(v: string) => {
              const [, m, d] = v.split("-");
              return `${m}/${d}`;
            }}
            tick={{ fontSize: 11, fill: "#71717a" }}
            axisLine={false}
            tickLine={false}
            dy={6}
          />
          <YAxis
            domain={[minW, maxW]}
            tick={{ fontSize: 11, fill: "#71717a" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => `${v}`}
            width={40}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 12,
              border: "none",
              boxShadow: "0 4px 24px rgba(0,0,0,.12)",
              fontSize: 13,
              padding: "10px 14px",
              backgroundColor: "rgba(255,255,255,0.97)",
            }}
            formatter={(value, name) => {
              const v = typeof value === "number" ? value.toFixed(1) : String(value ?? "");
              return name === "weight"
                ? [`${v} kg`, "Weight"]
                : [`${v}%`, "Body fat"];
            }}
            labelFormatter={(label) => String(label)}
            cursor={{ stroke: "#d4d4d8", strokeDasharray: "4 4" }}
          />
          <ReferenceLine
            y={avg}
            stroke="#a1a1aa"
            strokeDasharray="6 4"
            strokeOpacity={0.5}
          />
          <Area
            type="monotone"
            dataKey="weight"
            stroke="#059669"
            strokeWidth={2.5}
            fill="url(#weightGrad)"
            dot={{ r: 3, fill: "#059669", strokeWidth: 0 }}
            activeDot={{ r: 5, fill: "#059669", stroke: "#fff", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Average label */}
      <div className="flex items-center gap-4 text-xs text-zinc-500">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-4 rounded bg-emerald-600" />
          Weight (kg)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-px w-4 border-t border-dashed border-zinc-400" />
          Avg {avg.toFixed(1)} kg
        </span>
        {hasBodyFat && (
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-4 rounded bg-violet-500" />
            Body fat (%)
          </span>
        )}
      </div>

      {/* Body fat mini chart */}
      {hasBodyFat && (
        <ResponsiveContainer width="100%" height={80}>
          <LineChart data={sorted} margin={{ top: 4, right: 12, left: -8, bottom: 0 }}>
            <XAxis dataKey="date" hide />
            <YAxis
              domain={["dataMin - 1", "dataMax + 1"]}
              tick={{ fontSize: 10, fill: "#71717a" }}
              axisLine={false}
              tickLine={false}
              width={40}
              tickFormatter={(v: number) => `${v}%`}
            />
            <Tooltip
              contentStyle={{
                borderRadius: 12,
                border: "none",
                boxShadow: "0 4px 24px rgba(0,0,0,.12)",
                fontSize: 12,
                padding: "8px 12px",
                backgroundColor: "rgba(255,255,255,0.97)",
              }}
              formatter={(value) => {
                const v = typeof value === "number" ? value.toFixed(1) : String(value ?? "");
                return [`${v}%`, "Body fat"];
              }}
              labelFormatter={(label) => String(label)}
              cursor={{ stroke: "#d4d4d8", strokeDasharray: "4 4" }}
            />
            <Line
              type="monotone"
              dataKey="bodyFat"
              stroke="#8b5cf6"
              strokeWidth={2}
              dot={{ r: 2, fill: "#8b5cf6", strokeWidth: 0 }}
              activeDot={{ r: 4, fill: "#8b5cf6", stroke: "#fff", strokeWidth: 2 }}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
