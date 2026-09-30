export function firstInvalidField(
  visualOrder: readonly string[],
  errors: Record<string, string[]>,
): string | null {
  for (const name of visualOrder) {
    if (errors[name]?.length) return name;
  }
  return null;
}

export function focusFirstFieldWithError(errors: Record<string, string[]>): void {
  if (typeof document === "undefined") return;
  const nodes = Array.from(document.querySelectorAll<HTMLElement>("[data-field]"));
  const order = nodes
    .map((node) => node.getAttribute("data-field"))
    .filter((name): name is string => Boolean(name));
  const name = firstInvalidField(order, errors);
  if (!name) return;
  const target = nodes.find((node) => node.getAttribute("data-field") === name);
  target?.scrollIntoView({ behavior: "smooth", block: "center" });
  target?.focus();
}
