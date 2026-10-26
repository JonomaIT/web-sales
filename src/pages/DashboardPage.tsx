import Alert from "@cloudscape-design/components/alert";
import Box from "@cloudscape-design/components/box";
import Button from "@cloudscape-design/components/button";
import Container from "@cloudscape-design/components/container";
import ContentLayout from "@cloudscape-design/components/content-layout";
import ExpandableSection from "@cloudscape-design/components/expandable-section";
import Header from "@cloudscape-design/components/header";
import KeyValuePairs from "@cloudscape-design/components/key-value-pairs";
import SpaceBetween from "@cloudscape-design/components/space-between";
import StatusIndicator from "@cloudscape-design/components/status-indicator";
import { useFollow } from "../app/navigation";
import { RegionStateIndicator } from "../features/sales/components";
import { average, formatDuration, formatTime, processingSeconds } from "../features/sales/format";
import { useApiInfo, useTrackedSales } from "../features/sales/hooks";

export default function DashboardPage() {
  const follow = useFollow();
  const info = useApiInfo();
  const { sales } = useTrackedSales();

  const pending = sales.filter((sale) => sale.status === "PENDING").length;
  const processed = sales.filter((sale) => sale.status === "PROCESSED");
  const avg = average(processed.flatMap((sale) => processingSeconds(sale) ?? []));

  return (
    <ContentLayout
      header={
        <Header
          variant="h1"
          description="Crie vendas e acompanhe cada uma até o worker da região ativa processar."
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              <Button href="/vendas" onFollow={follow}>
                Ver vendas
              </Button>
              <Button variant="primary" href="/vendas/nova" onFollow={follow}>
                Criar venda
              </Button>
            </SpaceBetween>
          }
        >
          Visão geral
        </Header>
      }
    >
      <SpaceBetween size="l">
        <Container
          header={
            <Header
              variant="h2"
              description="Quem respondeu a última consulta à API. Atualiza a cada 15 segundos."
            >
              Região que está atendendo
            </Header>
          }
        >
          {info.isPending ? (
            <StatusIndicator type="loading">Consultando a API</StatusIndicator>
          ) : info.isError ? (
            <Alert type="error" header="A API não respondeu">
              {info.error.message}. As vendas não podem ser criadas agora.
            </Alert>
          ) : (
            <KeyValuePairs
              columns={4}
              items={[
                { label: "Região", value: info.data.region },
                { label: "Estado", value: <RegionStateIndicator state={info.data.region_state} /> },
                { label: "Task", value: info.data.task },
                { label: "Última verificação", value: formatTime(info.data.checkedAt) },
              ]}
            />
          )}
        </Container>

        <Container header={<Header variant="h2">Vendas deste navegador</Header>}>
          <KeyValuePairs
            columns={4}
            items={[
              { label: "Acompanhadas", value: <Box variant="awsui-value-large">{sales.length}</Box> },
              { label: "Pendentes", value: <Box variant="awsui-value-large">{pending}</Box> },
              { label: "Processadas", value: <Box variant="awsui-value-large">{processed.length}</Box> },
              {
                label: "Tempo médio até processar",
                value: <Box variant="awsui-value-large">{formatDuration(avg)}</Box>,
              },
            ]}
          />
        </Container>

        <ExpandableSection variant="container" headerText="Como funciona">
          <SpaceBetween size="s">
            <Box>
              1. A API (svc-sales-api), na região que o Cloudflare escolher, grava a venda como pendente na
              tabela global e publica o evento.
            </Box>
            <Box>
              2. O evento chega à fila das duas regiões. Só o worker da região ativa consome; a passiva guarda
              a cópia para um failover.
            </Box>
            <Box>
              3. O worker gera o recibo no S3, replicado para a outra região, e marca a venda como processada.
            </Box>
          </SpaceBetween>
        </ExpandableSection>
      </SpaceBetween>
    </ContentLayout>
  );
}
