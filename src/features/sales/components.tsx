import Box from "@cloudscape-design/components/box";
import Button from "@cloudscape-design/components/button";
import Modal from "@cloudscape-design/components/modal";
import SpaceBetween from "@cloudscape-design/components/space-between";
import StatusIndicator from "@cloudscape-design/components/status-indicator";
import type { ReactNode } from "react";
import { isStuck } from "./hooks";
import type { RegionState, Sale } from "./types";

export function SaleStatus({ sale }: { sale: Sale }) {
  if (sale.status === "PROCESSED") return <StatusIndicator type="success">Processada</StatusIndicator>;
  if (isStuck(sale)) return <StatusIndicator type="warning">Parada</StatusIndicator>;
  return <StatusIndicator type="in-progress">Pendente</StatusIndicator>;
}

export function RegionStateIndicator({ state }: { state: RegionState }) {
  if (state === "ACTIVE") return <StatusIndicator type="success">Ativa</StatusIndicator>;
  if (state === "PASSIVE") return <StatusIndicator type="stopped">Passiva</StatusIndicator>;
  return <StatusIndicator type="pending">Desconhecido</StatusIndicator>;
}

export function EmptyState({
  title,
  children,
  action,
}: {
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <Box textAlign="center" color="inherit" padding={{ vertical: "l" }}>
      <SpaceBetween size="xs">
        <Box variant="strong" color="inherit">
          {title}
        </Box>
        {children && <Box color="inherit">{children}</Box>}
        {action}
      </SpaceBetween>
    </Box>
  );
}

export function ConfirmDelete({
  count,
  visible,
  loading,
  onCancel,
  onConfirm,
}: {
  count: number;
  visible: boolean;
  loading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const title = count === 1 ? "Apagar a venda?" : `Apagar ${count} vendas?`;
  return (
    <Modal
      visible={visible}
      onDismiss={onCancel}
      header={title}
      footer={
        <Box float="right">
          <SpaceBetween direction="horizontal" size="xs">
            <Button variant="link" onClick={onCancel}>
              Cancelar
            </Button>
            <Button variant="primary" loading={loading} onClick={onConfirm}>
              Apagar
            </Button>
          </SpaceBetween>
        </Box>
      }
    >
      A venda sai da tabela global nas duas regiões. Um recibo já gerado continua no bucket.
    </Modal>
  );
}
