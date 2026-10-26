import { useCollection } from "@cloudscape-design/collection-hooks";
import Button from "@cloudscape-design/components/button";
import CollectionPreferences, {
  type CollectionPreferencesProps,
} from "@cloudscape-design/components/collection-preferences";
import Header from "@cloudscape-design/components/header";
import Link from "@cloudscape-design/components/link";
import Pagination from "@cloudscape-design/components/pagination";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Table, { type TableProps } from "@cloudscape-design/components/table";
import TextFilter from "@cloudscape-design/components/text-filter";
import { useMemo, useState } from "react";
import { useFollow } from "../app/navigation";
import { useNotify } from "../app/notify";
import { usePersistentState } from "../app/storage";
import { ConfirmDelete, EmptyState, SaleStatus } from "../features/sales/components";
import {
  formatDateTime,
  formatDuration,
  formatMoney,
  processingSeconds,
  shortId,
} from "../features/sales/format";
import { useCreateSale, useDeleteSales, useTrackedSales } from "../features/sales/hooks";
import type { Sale } from "../features/sales/types";

const TEST_PRODUCTS = ["Café especial", "Caderno", "Fone de ouvido", "Mochila", "Teclado"];

// Which columns show and how many rows per page: the person's choice, remembered per browser.
const DEFAULT_PREFERENCES: CollectionPreferencesProps.Preferences = {
  pageSize: 10,
  contentDisplay: [
    { id: "id", visible: true },
    { id: "product", visible: true },
    { id: "amount", visible: true },
    { id: "status", visible: true },
    { id: "created_region", visible: true },
    { id: "processed_region", visible: true },
    { id: "duration", visible: true },
    { id: "created_at", visible: false },
  ],
};

export default function SalesPage() {
  const follow = useFollow();
  const notify = useNotify();
  const { sales, loading } = useTrackedSales();
  const create = useCreateSale();
  const remove = useDeleteSales();
  const [confirming, setConfirming] = useState(false);
  const [burstRunning, setBurstRunning] = useState(false);
  const [preferences, setPreferences] = usePersistentState("web-sales:sales-table", DEFAULT_PREFERENCES);

  const columns = useMemo<TableProps.ColumnDefinition<Sale>[]>(
    () => [
      {
        id: "id",
        header: "ID",
        isRowHeader: true,
        sortingField: "id",
        cell: (sale) => (
          <Link href={`/vendas/${sale.id}`} onFollow={follow}>
            {shortId(sale.id)}
          </Link>
        ),
      },
      {
        id: "product",
        header: "Produto",
        minWidth: 160,
        sortingField: "product",
        cell: (sale) => sale.product,
      },
      {
        id: "amount",
        header: "Valor",
        sortingComparator: (a, b) => Number(a.amount) - Number(b.amount),
        cell: (sale) => formatMoney(sale.amount),
      },
      {
        id: "status",
        header: "Status",
        minWidth: 150,
        sortingField: "status",
        cell: (sale) => <SaleStatus sale={sale} />,
      },
      {
        id: "created_region",
        header: "Criada em",
        minWidth: 140,
        sortingField: "created_region",
        cell: (sale) => sale.created_region,
      },
      {
        id: "processed_region",
        header: "Processada em",
        minWidth: 160,
        sortingField: "processed_region",
        cell: (sale) => sale.processed_region ?? "—",
      },
      {
        id: "duration",
        header: "Tempo",
        sortingComparator: (a, b) => (processingSeconds(a) ?? Infinity) - (processingSeconds(b) ?? Infinity),
        cell: (sale) => formatDuration(processingSeconds(sale)),
      },
      {
        id: "created_at",
        header: "Criada às",
        sortingField: "created_at",
        cell: (sale) => formatDateTime(sale.created_at),
      },
    ],
    [follow],
  );

  const { items, actions, collectionProps, filterProps, filteredItemsCount, paginationProps } = useCollection(
    sales,
    {
      filtering: {
        fields: ["id", "product", "status", "created_region", "processed_region"],
        empty: (
          <EmptyState
            title="Nenhuma venda ainda"
            action={
              <Button href="/vendas/nova" onFollow={follow}>
                Criar venda
              </Button>
            }
          >
            As vendas criadas neste navegador aparecem aqui.
          </EmptyState>
        ),
        noMatch: <EmptyState title="Nenhuma venda encontrada">Ajuste ou limpe a busca.</EmptyState>,
      },
      sorting: { defaultState: { sortingColumn: { sortingField: "created_at" }, isDescending: true } },
      pagination: { pageSize: preferences.pageSize },
      selection: { trackBy: "id" },
    },
  );

  const selected = collectionProps.selectedItems ?? [];

  async function createTestBurst() {
    setBurstRunning(true);
    const results = await Promise.allSettled(
      TEST_PRODUCTS.map((product) =>
        create.mutateAsync({ product, amount: Math.round((10 + Math.random() * 90) * 100) / 100 }),
      ),
    );
    setBurstRunning(false);
    const created = results.filter((result) => result.status === "fulfilled").length;
    notify(
      created === results.length
        ? {
            type: "success",
            content: `${created} vendas de teste criadas. Acompanhe o processamento na tabela.`,
          }
        : {
            type: "error",
            content: `${created} de ${results.length} vendas criadas. A API recusou as outras.`,
          },
    );
  }

  function deleteSelected() {
    const ids = selected.map((sale) => sale.id);
    remove.mutate(ids, {
      onSuccess: () => notify({ type: "success", content: `${ids.length} venda(s) apagada(s).` }),
      onError: (err) => notify({ type: "error", header: "Não foi possível apagar", content: err.message }),
      onSettled: () => {
        setConfirming(false);
        actions.setSelectedItems([]);
      },
    });
  }

  return (
    <>
      <Table
        {...collectionProps}
        items={items}
        columnDefinitions={columns}
        selectionType="multi"
        trackBy="id"
        variant="full-page"
        stickyHeader
        loading={loading && sales.length === 0}
        loadingText="Carregando vendas"
        ariaLabels={{
          selectionGroupLabel: "Seleção de vendas",
          allItemsSelectionLabel: () => "Selecionar todas",
          itemSelectionLabel: (_, sale) => `Selecionar ${sale.product}`,
        }}
        header={
          <Header
            variant="awsui-h1-sticky"
            counter={selected.length ? `(${selected.length}/${sales.length})` : `(${sales.length})`}
            description="As vendas criadas neste navegador, atualizadas a cada segundo enquanto estão pendentes."
            actions={
              <SpaceBetween direction="horizontal" size="xs">
                <Button
                  disabled={!selected.length}
                  ariaLabel="Apagar as vendas selecionadas"
                  onClick={() => setConfirming(true)}
                >
                  Apagar
                </Button>
                <Button loading={burstRunning} onClick={() => void createTestBurst()}>
                  Criar 5 de teste
                </Button>
                <Button variant="primary" href="/vendas/nova" onFollow={follow}>
                  Criar venda
                </Button>
              </SpaceBetween>
            }
          >
            Vendas
          </Header>
        }
        filter={
          <TextFilter
            {...filterProps}
            filteringPlaceholder="Buscar por produto, ID, status ou região"
            filteringAriaLabel="Buscar vendas"
            countText={`${filteredItemsCount ?? 0} resultado(s)`}
          />
        }
        pagination={<Pagination {...paginationProps} />}
        columnDisplay={preferences.contentDisplay}
        preferences={
          <CollectionPreferences
            title="Preferências"
            confirmLabel="Confirmar"
            cancelLabel="Cancelar"
            preferences={preferences}
            onConfirm={({ detail }) => setPreferences(detail)}
            pageSizePreference={{
              title: "Vendas por página",
              options: [10, 25, 50].map((value) => ({ value, label: `${value} vendas` })),
            }}
            contentDisplayPreference={{
              title: "Colunas",
              options: columns.map((column) => ({
                id: column.id ?? "",
                label: String(column.header),
                alwaysVisible: column.id === "id",
              })),
            }}
          />
        }
      />
      <ConfirmDelete
        count={selected.length}
        visible={confirming}
        loading={remove.isPending}
        onCancel={() => setConfirming(false)}
        onConfirm={deleteSelected}
      />
    </>
  );
}
