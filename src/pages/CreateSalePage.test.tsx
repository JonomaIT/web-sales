import { screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { mockApi } from "../mocks/handlers";
import { renderApp } from "../test/render";

describe("new sale", () => {
  it("says what to fix before calling the API", async () => {
    const { user } = renderApp("/vendas/nova");
    await user.click(await screen.findByRole("button", { name: "Criar venda" }));

    expect(await screen.findByText("Informe o produto.")).toBeInTheDocument();
    expect(screen.getByText("Informe o valor.")).toBeInTheDocument();
    expect(mockApi.sales.size).toBe(0);
  });

  it("creates the sale and follows it until it is processed", async () => {
    mockApi.processAfterMs = 50;
    const { user, router } = renderApp("/vendas/nova");

    await user.type(await screen.findByRole("textbox", { name: "Produto" }), "Café especial");
    await user.type(screen.getByRole("textbox", { name: "Valor (R$)" }), "12,50");
    await user.click(screen.getByRole("button", { name: "Criar venda" }));

    await waitFor(() => expect(router.state.location.pathname).toMatch(/^\/vendas\/[0-9a-f-]{36}$/));
    expect(await screen.findByText(/criada em us-east-1/)).toBeInTheDocument();
    expect(await screen.findByText("Processada", {}, { timeout: 3_000 })).toBeInTheDocument();
    expect(screen.getByText("R$ 12,50")).toBeInTheDocument();
    expect([...mockApi.sales.values()][0]).toMatchObject({ product: "Café especial", amount: "12.50" });
  });

  it("shows the API's refusal", async () => {
    const { user } = renderApp("/vendas/nova");
    await user.type(await screen.findByRole("textbox", { name: "Produto" }), "x");
    await user.type(screen.getByRole("textbox", { name: "Valor (R$)" }), "10");
    mockApi.sales.clear();
    const { http, HttpResponse } = await import("msw");
    const { server, TEST_API_URL } = await import("../mocks/server");
    server.use(
      http.post(`${TEST_API_URL}/sales`, () =>
        HttpResponse.json({ error: "sale not created, try again" }, { status: 503 }),
      ),
    );

    await user.click(screen.getByRole("button", { name: "Criar venda" }));
    // Cloudscape renders form errors twice: on screen and in a live region for screen readers.
    expect(await screen.findAllByText(/A API recusou a venda: sale not created, try again/)).not.toHaveLength(
      0,
    );
  });
});
