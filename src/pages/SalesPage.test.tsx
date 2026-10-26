import { screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { trackedSales } from "../features/sales/tracked";
import { mockApi } from "../mocks/handlers";
import { renderApp } from "../test/render";

describe("sales list", () => {
  it("invites to create the first sale", async () => {
    renderApp("/vendas");
    expect(await screen.findByText("Nenhuma venda ainda")).toBeInTheDocument();
  });

  it("creates five test sales and shows them processed", async () => {
    mockApi.processAfterMs = 50;
    const { user } = renderApp("/vendas");

    await user.click(await screen.findByRole("button", { name: "Criar 5 de teste" }));

    expect(await screen.findByText(/5 vendas de teste criadas/)).toBeInTheDocument();
    await waitFor(() => expect(screen.getAllByText("Processada")).toHaveLength(5), { timeout: 3_000 });
    expect(screen.getByText("(5)")).toBeInTheDocument();
  });

  it("deletes the selected sales after confirming", async () => {
    mockApi.processAfterMs = 60_000;
    const { user } = renderApp("/vendas");
    await user.click(await screen.findByRole("button", { name: "Criar 5 de teste" }));
    await screen.findByText(/5 vendas de teste criadas/);

    await user.click(screen.getByRole("checkbox", { name: "Selecionar Mochila" }));
    await user.click(screen.getByRole("button", { name: "Apagar as vendas selecionadas" }));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Apagar" }));

    expect(await screen.findByText("1 venda(s) apagada(s).")).toBeInTheDocument();
    await waitFor(() => expect(trackedSales.snapshot()).toHaveLength(4));
    expect(mockApi.sales.size).toBe(4);
  });
});
