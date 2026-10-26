import Button from "@cloudscape-design/components/button";
import Container from "@cloudscape-design/components/container";
import Form from "@cloudscape-design/components/form";
import FormField from "@cloudscape-design/components/form-field";
import Header from "@cloudscape-design/components/header";
import Input from "@cloudscape-design/components/input";
import SpaceBetween from "@cloudscape-design/components/space-between";
import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { useNotify } from "../app/notify";
import { shortId } from "../features/sales/format";
import { useCreateSale } from "../features/sales/hooks";
import { validateNewSale, type SaleFormErrors } from "../features/sales/validation";

export default function CreateSalePage() {
  const navigate = useNavigate();
  const notify = useNotify();
  const create = useCreateSale();
  const [product, setProduct] = useState("");
  const [amount, setAmount] = useState("");
  const [errors, setErrors] = useState<SaleFormErrors>({});

  function submit(event: FormEvent) {
    event.preventDefault();
    const { value, errors: found } = validateNewSale(product, amount);
    setErrors(found);
    if (!value) return;
    create.mutate(value, {
      onSuccess: ({ data, region }) => {
        notify({
          type: "success",
          content: `Venda ${shortId(data.id)} criada em ${region ?? data.created_region}.`,
        });
        void navigate(`/vendas/${data.id}`);
      },
    });
  }

  return (
    <form onSubmit={submit} noValidate>
      <Form
        header={
          <Header
            variant="h1"
            description="A venda nasce pendente; o worker da região ativa a processa em segundos."
          >
            Nova venda
          </Header>
        }
        errorText={create.error ? `A API recusou a venda: ${create.error.message}` : undefined}
        errorIconAriaLabel="Erro"
        actions={
          <SpaceBetween direction="horizontal" size="xs">
            <Button formAction="none" variant="link" onClick={() => void navigate("/vendas")}>
              Cancelar
            </Button>
            <Button variant="primary" loading={create.isPending}>
              Criar venda
            </Button>
          </SpaceBetween>
        }
      >
        <Container header={<Header variant="h2">Dados da venda</Header>}>
          <SpaceBetween size="l">
            <FormField label="Produto" constraintText="De 1 a 100 caracteres." errorText={errors.product}>
              <Input
                value={product}
                onChange={({ detail }) => setProduct(detail.value)}
                placeholder="Café especial"
                ariaRequired
              />
            </FormField>
            <FormField
              label="Valor (R$)"
              constraintText="Maior que zero e até 1.000.000, com até 2 casas decimais."
              errorText={errors.amount}
            >
              <Input
                value={amount}
                onChange={({ detail }) => setAmount(detail.value)}
                inputMode="decimal"
                placeholder="12,50"
                ariaRequired
              />
            </FormField>
          </SpaceBetween>
        </Container>
      </Form>
    </form>
  );
}
