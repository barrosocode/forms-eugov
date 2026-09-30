"use client";

import { Button } from "@/components/ui/button";
import { barWidth, chartColor, formatCount, formatPercent, optionTotal, pieSlices } from "@/lib/report";
import { cn } from "@/lib/text";
import type { ReportOption, StarredResponse } from "@/types/domain";
import { useState } from "react";

function useActiveOption(options: readonly ReportOption[]) {
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [focusId, setFocusId] = useState<string | null>(null);
  const activeId = hoverId ?? focusId;
  const active = options.find((option) => option.option_id === activeId) ?? null;

  function bind(optionId: string) {
    return {
      onMouseEnter: () => setHoverId(optionId),
      onMouseLeave: () => setHoverId((current) => (current === optionId ? null : current)),
      onFocus: () => setFocusId(optionId),
      onBlur: () => setFocusId((current) => (current === optionId ? null : current)),
    };
  }

  return { activeId, active, bind };
}

function ChartTooltip({ option }: { option: ReportOption | null }) {
  if (!option) {
    return <p className="min-h-5 text-sm text-muted">Passe o cursor ou foque uma opção para ver os valores.</p>;
  }
  return (
    <p className="min-h-5 text-sm" role="status">
      <span className="font-medium">{option.value}</span>
      {` · ${formatCount(option.abs)} · ${formatPercent(option.percent)}`}
    </p>
  );
}

function ChartLegend({
  options,
  activeId,
  onActive,
}: {
  options: readonly ReportOption[];
  activeId: string | null;
  onActive: (optionId: string) => {
    onMouseEnter: () => void;
    onMouseLeave: () => void;
    onFocus: () => void;
    onBlur: () => void;
  };
}) {
  if (options.length === 0) return null;
  return (
    <ul className="flex flex-wrap gap-2">
      {options.map((option, index) => {
        const active = activeId === option.option_id;
        return (
          <li key={option.option_id}>
            <button
              type="button"
              className={cn(
                "flex max-w-full items-start gap-2 rounded-lg border px-2.5 py-1.5 text-left text-sm",
                active ? "border-foreground" : "border-border",
              )}
              aria-pressed={active}
              {...onActive(option.option_id)}
            >
              <span className="mt-1 h-3 w-3 shrink-0 rounded-sm" style={{ backgroundColor: chartColor(index) }} aria-hidden="true" />
              <span className="min-w-0">
                <span className="font-medium break-words">{option.value}</span>
                <span className="text-muted">{` · ${formatPercent(option.percent)}`}</span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export function PieChart({ options }: { options: readonly ReportOption[] }) {
  const { activeId, active, bind } = useActiveOption(options);
  const slices = pieSlices(options);

  return (
    <div className="space-y-4">
      {optionTotal(options) <= 0 ? (
        <p className="text-sm text-muted">Ninguém escolheu uma opção nesta pergunta.</p>
      ) : (
        <div className="mx-auto w-full max-w-xs">
          <svg viewBox="0 0 200 200" role="img" aria-label="Gráfico de pizza das opções" className="h-auto w-full">
            {slices.map((slice) => {
              const selected = !activeId || activeId === slice.optionId;
              return (
                <g key={slice.optionId}>
                  <path
                    d={slice.path}
                    fill={slice.color}
                    opacity={selected ? 1 : 0.4}
                    tabIndex={0}
                    aria-label={`${slice.value}: ${formatCount(slice.abs)}, ${formatPercent(slice.percent)}`}
                    className="cursor-pointer outline-none"
                    stroke="var(--card)"
                    strokeWidth={activeId === slice.optionId ? 3 : 1}
                    {...bind(slice.optionId)}
                  >
                    <title>{`${formatCount(slice.abs)} · ${formatPercent(slice.percent)}`}</title>
                  </path>
                  {slice.showLabel ? (
                    <text
                      x={slice.labelX}
                      y={slice.labelY}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill="#ffffff"
                      fontSize="9"
                      className="pointer-events-none"
                    >
                      {formatPercent(slice.percent)}
                    </text>
                  ) : null}
                </g>
              );
            })}
          </svg>
        </div>
      )}
      <ChartTooltip option={active} />
      <ChartLegend options={options} activeId={activeId} onActive={bind} />
    </div>
  );
}

export function BarChart({ options }: { options: readonly ReportOption[] }) {
  const { activeId, active, bind } = useActiveOption(options);

  return (
    <div className="space-y-4">
      {optionTotal(options) <= 0 ? <p className="text-sm text-muted">Ninguém marcou uma opção nesta pergunta.</p> : null}
      <ul className="space-y-3">
        {options.map((option, index) => {
          const selected = activeId === option.option_id;
          return (
            <li key={option.option_id}>
              <button
                type="button"
                className={cn("w-full rounded-lg px-1 py-1 text-left", selected && "bg-background")}
                aria-label={`${option.value}: ${formatCount(option.abs)}, ${formatPercent(option.percent)}`}
                {...bind(option.option_id)}
              >
                <span className="mb-1 block text-sm break-words">{option.value}</span>
                <span className="flex items-center gap-3">
                  <span className="h-3 flex-1 overflow-hidden rounded-full bg-background">
                    <span
                      className="block h-full rounded-full"
                      style={{ width: `${barWidth(option.percent)}%`, backgroundColor: chartColor(index) }}
                    />
                  </span>
                  <span className="w-16 shrink-0 text-right text-sm tabular-nums">{formatPercent(option.percent)}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <ChartTooltip option={active} />
      <ChartLegend options={options} activeId={activeId} onActive={bind} />
    </div>
  );
}

export function StarredReport({ percent, responses }: { percent: number; responses: readonly StarredResponse[] }) {
  const [index, setIndex] = useState(0);
  const current = responses[index];
  const atStart = index === 0;
  const atEnd = index >= responses.length - 1;

  return (
    <div className="space-y-4">
      <p className="text-2xl font-semibold tracking-tight">
        {formatPercent(percent)}
        <span className="ml-2 text-base font-normal text-muted">das respostas foram favoritadas</span>
      </p>
      {responses.length === 0 || !current ? (
        <p className="text-sm text-muted">Nenhuma resposta favoritada.</p>
      ) : (
        <div className="space-y-3 rounded-xl border border-border bg-background p-4">
          <div className="flex items-center justify-between gap-3">
            <Button variant="secondary" aria-label="Resposta anterior" disabled={atStart} onClick={() => setIndex((value) => value - 1)}>
              <span aria-hidden="true">←</span>
              Anterior
            </Button>
            <p className="text-sm text-muted">{`${index + 1} de ${responses.length}`}</p>
            <Button variant="secondary" aria-label="Próxima resposta" disabled={atEnd} onClick={() => setIndex((value) => value + 1)}>
              Próxima
              <span aria-hidden="true">→</span>
            </Button>
          </div>
          <div aria-live="polite">
            <p className="whitespace-pre-wrap">{current.value}</p>
            <p className="mt-2 text-sm text-muted">{current.respondent_name || "Visitante"}</p>
          </div>
        </div>
      )}
    </div>
  );
}
