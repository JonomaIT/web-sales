import Alert from "@cloudscape-design/components/alert";
import Button from "@cloudscape-design/components/button";
import Container from "@cloudscape-design/components/container";
import ContentLayout from "@cloudscape-design/components/content-layout";
import CopyToClipboard from "@cloudscape-design/components/copy-to-clipboard";
import Header from "@cloudscape-design/components/header";
import KeyValuePairs from "@cloudscape-design/components/key-value-pairs";
import SpaceBetween from "@cloudscape-design/components/space-between";
import StatusIndicator from "@cloudscape-design/components/status-indicator";
import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ApiError } from "../api/client";
import { useFollow } from "../app/navigation";
import { useNotify } from "../app/notify";
import { ConfirmDelete, SaleStatus } from "../features/sales/components";
import {
  formatDateTime,
  formatDuration,
  formatMoney,
  processingSeconds,
  shortId,
} from "../features/sales/format";
import { isStuck, useDeleteSales, useSale } from "../features/sales/hooks";

export default function SaleDetailPage() {
  const { saleId = "" } = useParams();
  const follow = useFollow();
  const navigate = useNavigate();
  const notify = useNotify();
  const sale = useSale(saleId);
  const remove = useDeleteSales();
  const [confirming, setConfirming] = useState(false);

  if (sale.isPending) return <StatusIndicator type="loading">Carregando a venda</StatusIndicator>;

  if (sale.isError) {
    const missing = sale.error instanceof ApiError && sale.error.status === 404;
    return (
      <Alert
        type={missing ? "warning" : "error"}
        header={missing ? "Venda não encontrada" : "Não foi possível carregar a venda"}
        action={
          <Button href="/vendas" onFollow={follow}>
            Voltar às vendas
          </Button>
        }
      >
        {missing ? "Ela pode ter sido apagada." : sale.error.message}
      </Alert>
    );
  }

  const data = sale.data;

  function confirmDelete() {
    remove.mutate([data.id], {
      onSuccess: () => {
        notify({ type: "success", content: `Venda ${shortId(data.id)} apagada.` });
        void navigate("/vendas");
      },
      onError: (err) => notify({ type: "error", header: "Não foi possível apagar", content: err.message }),
      onSettled: () => setConfirming(false),
    });
  }

  return (
    <ContentLayout
      header={
        <Header
          variant="h1"
          description={data.product}
          actions={<Button onClick={() => setConfirming(true)}>Apagar</Button>}
        >
          Venda {shortId(data.id)}
        </Header>
      }
    >
      <SpaceBetween size="l">
        {isStuck(data) && (
          <Alert type="warning" header="Ninguém processou esta venda ainda">
            O worker da região ativa pode estar parado. Depois do failover, a outra região processa o acúmulo
            da fila sem perder a venda (ADR-012).
          </Alert>
        )}
        <Container header={<Header variant="h2">Detalhes</Header>}>
          <KeyValuePairs
            columns={3}
            items={[
              {
                label: "ID",
                value: (
                  <CopyToClipboard
                    variant="inline"
                    textToCopy={data.id}
                    copyButtonAriaLabel="Copiar o ID"
                    copySuccessText="ID copiado"
                    copyErrorText="Não foi possível copiar"
                  />
                ),
              },
              { label: "Produto", value: data.product },
              { label: "Valor", value: formatMoney(data.amount) },
              { label: "Status", value: <SaleStatus sale={data} /> },
              { label: "Criada em", value: `${data.created_region} · ${formatDateTime(data.created_at)}` },
              {
                label: "Processada em",
                value: data.processed_region
                  ? `${data.processed_region} · ${formatDateTime(data.processed_at)}`
                  : "—",
              },
              { label: "Tempo até processar", value: formatDuration(processingSeconds(data)) },
              { label: "Recibo (S3)", value: data.receipt_key ?? "—" },
            ]}
          />
        </Container>
      </SpaceBetween>
      <ConfirmDelete
        count={1}
        visible={confirming}
        loading={remove.isPending}
        onCancel={() => setConfirming(false)}
        onConfirm={confirmDelete}
      />
    </ContentLayout>
  );
}
