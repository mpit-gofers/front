import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { QueryResult } from "../store";

interface VisualizationPoint {
  name: string;
  value: number;
}

interface QueryVisualizationProps {
  result: QueryResult;
}

function toVisualizationData(result: QueryResult): VisualizationPoint[] {
  const spec = result.visualization;
  if (!spec.x_field || !spec.y_field) {
    return [];
  }

  const points = result.table
    .map((row) => {
      const rawValue = row[spec.y_field!];
      if (typeof rawValue !== "number" || Number.isNaN(rawValue)) {
        return null;
      }

      return {
        name: String(row[spec.x_field!] ?? "N/A"),
        value: rawValue,
      };
    })
    .filter((point): point is VisualizationPoint => point !== null);

  if (spec.type === "line") {
    return points.sort((a, b) => a.name.localeCompare(b.name)).slice(0, 60);
  }

  return points.slice(0, 20);
}

export function QueryVisualization({ result }: QueryVisualizationProps) {
  const spec = result.visualization;
  const chartData = toVisualizationData(result);

  if (spec.type === "table_only") {
    return (
      <p className="text-sm text-slate-600">
        {spec.reason}
      </p>
    );
  }

  if (chartData.length === 0) {
    return (
      <p className="text-sm text-slate-600">
        Недостаточно данных для построения графика. {spec.reason}
      </p>
    );
  }

  if (spec.type === "line") {
    return (
      <ResponsiveContainer width="100%" height={360}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 12 }} />
          <YAxis tick={{ fill: "#64748b", fontSize: 12 }} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              fontSize: "14px",
            }}
          />
          <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={360}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 12 }} />
        <YAxis tick={{ fill: "#64748b", fontSize: 12 }} />
        <Tooltip
          contentStyle={{
            backgroundColor: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            fontSize: "14px",
          }}
        />
        <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
