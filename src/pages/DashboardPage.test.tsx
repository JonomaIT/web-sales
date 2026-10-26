import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderApp } from "../test/render";

describe("overview", () => {
  it("shows which region answers and its state", async () => {
    renderApp("/");
    expect(await screen.findByText("mock-task")).toBeInTheDocument();
    expect(screen.getAllByText("Ativa").length).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { name: "Visão geral" })).toBeInTheDocument();
  });

  it("lands unknown addresses on a friendly page", async () => {
    renderApp("/nao-existe");
    expect(await screen.findByText("Página não encontrada")).toBeInTheDocument();
  });
});
