import type { NewSale } from "./types";

// The same rules as svc-sales-api, checked before calling it: the person sees what to fix next to
// the field instead of a 400.

export interface SaleFormErrors {
  product?: string;
  amount?: string;
}

/** "12,50", "1.234,56" (pt-BR) and "12.50" are all read as numbers; anything else is NaN. */
export function parseAmount(text: string): number {
  const value = text.trim().replace(/\s/g, "");
  const normalized = value.includes(",") ? value.replace(/\./g, "").replace(",", ".") : value;
  return /^\d+(\.\d{1,2})?$/.test(normalized) ? Number(normalized) : Number.NaN;
}

export function validateNewSale(
  product: string,
  amountText: string,
): { value?: NewSale; errors: SaleFormErrors } {
  const errors: SaleFormErrors = {};
  const name = product.trim();
  if (!name) errors.product = "Informe o produto.";
  else if (name.length > 100) errors.product = "Use no máximo 100 caracteres.";

  const amount = parseAmount(amountText);
  if (!amountText.trim()) errors.amount = "Informe o valor.";
  else if (!(amount > 0 && amount <= 1_000_000))
    errors.amount = "Use um valor maior que zero e até 1.000.000, com até 2 casas decimais.";

  return errors.product || errors.amount ? { errors } : { value: { product: name, amount }, errors };
}
