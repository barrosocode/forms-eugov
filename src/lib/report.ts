import type { ReportOption } from "@/types/domain";

export const CHART_COLORS = [
  "#465fff",
  "#039855",
  "#d92d20",
  "#b54708",
  "#7c3aed",
  "#0891b2",
  "#db2777",
  "#ca8a04",
  "#0f766e",
  "#4f46e5",
] as const;

const PIE_CENTER = 100;
const PIE_RADIUS = 78;

export interface PieSlice {
  optionId: string;
  value: string;
  abs: number;
  percent: number;
  color: string;
  path: string;
  labelX: number;
  labelY: number;
  showLabel: boolean;
}

export function chartColor(index: number): string {
  return CHART_COLORS[index % CHART_COLORS.length];
}

export function formatPercent(value: number): string {
  const formatted = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 }).format(value);
  return `${formatted}%`;
}

export function formatCount(value: number): string {
  const formatted = new Intl.NumberFormat("pt-BR").format(value);
  return value === 1 ? `${formatted} resposta` : `${formatted} respostas`;
}

export function optionTotal(options: readonly { abs: number }[]): number {
  return options.reduce((sum, option) => sum + option.abs, 0);
}

export function barWidth(percent: number): number {
  if (!Number.isFinite(percent) || percent <= 0) return 0;
  return Math.min(percent, 100);
}

export function polar(cx: number, cy: number, radius: number, angle: number): { x: number; y: number } {
  return {
    x: round(cx + radius * Math.cos(angle)),
    y: round(cy + radius * Math.sin(angle)),
  };
}

export function arcPath(cx: number, cy: number, radius: number, start: number, end: number): string {
  const sweep = end - start;
  if (sweep >= Math.PI * 2 - 1e-6) {
    const left = round(cx - radius);
    const right = round(cx + radius);
    return `M ${left} ${round(cy)} A ${radius} ${radius} 0 1 1 ${right} ${round(cy)} A ${radius} ${radius} 0 1 1 ${left} ${round(cy)} Z`;
  }
  const startPt = polar(cx, cy, radius, start);
  const endPt = polar(cx, cy, radius, end);
  const large = sweep > Math.PI ? 1 : 0;
  return `M ${cx} ${cy} L ${startPt.x} ${startPt.y} A ${radius} ${radius} 0 ${large} 1 ${endPt.x} ${endPt.y} Z`;
}

export function pieSlices(options: readonly ReportOption[]): PieSlice[] {
  const total = optionTotal(options);
  if (total <= 0) return [];
  let angle = -Math.PI / 2;
  const slices: PieSlice[] = [];
  options.forEach((option, index) => {
    const sweep = (option.abs / total) * Math.PI * 2;
    const start = angle;
    const end = angle + sweep;
    angle = end;
    if (option.abs <= 0) return;
    const label = polar(PIE_CENTER, PIE_CENTER, PIE_RADIUS * 0.62, start + sweep / 2);
    slices.push({
      optionId: option.option_id,
      value: option.value,
      abs: option.abs,
      percent: option.percent,
      color: chartColor(index),
      path: arcPath(PIE_CENTER, PIE_CENTER, PIE_RADIUS, start, end),
      labelX: label.x,
      labelY: label.y,
      showLabel: sweep >= Math.PI / 5,
    });
  });
  return slices;
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
