import { describe, expect, it } from "vitest";
import { parseAmount, validateNewSale } from "./validation";

describe("parseAmount", () => {
  it.each([
    ["12,50", 12.5],
    ["12.50", 12.5],
    ["1.234,56", 1234.56],
    [" 7 ", 7],
  ])("reads %s as %s", (text, value) => expect(parseAmount(text)).toBe(value));

  it.each(["12,505", "abc", "-3", "1,2,3", ""])("refuses %j", (text) => expect(parseAmount(text)).toBeNaN());
});

describe("validateNewSale", () => {
  it("accepts a valid sale, trimmed", () => {
    expect(validateNewSale("  café  ", "12,50")).toEqual({
      value: { product: "café", amount: 12.5 },
      errors: {},
    });
  });

  it("explains every invalid field", () => {
    const { value, errors } = validateNewSale(" ", "0");
    expect(value).toBeUndefined();
    expect(errors.product).toBe("Informe o produto.");
    expect(errors.amount).toMatch(/maior que zero/);
  });

  it("refuses more than 100 characters and more than 1,000,000", () => {
    const { errors } = validateNewSale("x".repeat(101), "1000000,01");
    expect(errors.product).toBe("Use no máximo 100 caracteres.");
    expect(errors.amount).toBeDefined();
  });
});
