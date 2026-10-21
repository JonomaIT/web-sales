// Calls the sales API from the browser (CORS allows only this site) and follows each sale until
// the worker of the ACTIVE region processes it. Everything stays in memory: reload = empty list.
const API = "https://sales.joshuel.com.br";
const POLL_MS = 1000;
const POLL_LIMIT = 90; // ~1.5 min: longer means nobody is processing (e.g. during a game day)

const $ = (id) => document.getElementById(id);
const sales = []; // { id, product, amount, created_region, status, processed_region, startedAt, doneMs }

const money = (v) => Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const escape = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

async function api(path, options = {}) {
  const res = await fetch(API + path, { cache: "no-store", ...options });
  const body = res.status === 204 ? null : await res.json();
  return { res, body, region: res.headers.get("X-Region") };
}

async function showRegion() {
  try {
    const { body } = await api("/info");
    $("region").innerHTML = `Atendido por <b>${escape(body.region)}</b> <span class="state ${escape(body.region_state).toLowerCase()}">${escape(body.region_state)}</span>`;
  } catch {
    $("region").textContent = "API indisponível";
  }
}

function render() {
  if (!sales.length) {
    $("sales").innerHTML = '<tr class="empty"><td colspan="7">Nenhuma venda ainda.</td></tr>';
    return;
  }
  $("sales").innerHTML = sales.map((s) => `
    <tr>
      <td>${escape(s.product)}</td>
      <td>${money(s.amount)}</td>
      <td>${escape(s.created_region)}</td>
      <td><span class="badge ${s.status.toLowerCase()}">${escape(s.status)}</span></td>
      <td>${escape(s.processed_region || "—")}</td>
      <td>${s.doneMs != null ? (s.doneMs / 1000).toFixed(1) + " s" : s.status === "PENDING" ? "…" : "—"}</td>
      <td><button class="link" data-delete="${escape(s.id)}" title="Apagar ${escape(s.id)}">apagar</button></td>
    </tr>`).join("");
}

async function follow(sale) {
  for (let i = 0; i < POLL_LIMIT && sale.status === "PENDING"; i++) {
    await new Promise((r) => setTimeout(r, POLL_MS));
    try {
      const { res, body } = await api(`/sales/${sale.id}`);
      if (res.status === 404) { sale.status = "DELETED"; break; }
      if (body.status !== "PENDING") {
        Object.assign(sale, { status: body.status, processed_region: body.processed_region, doneMs: performance.now() - sale.startedAt });
      }
    } catch { /* keep polling: the next region may answer */ }
    render();
  }
  if (sale.status === "PENDING") sale.status = "STUCK"; // nobody processed it in time
  render();
}

async function createSale(product, amount) {
  const startedAt = performance.now();
  const { res, body, region } = await api("/sales", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ product, amount }),
  });
  if (!res.ok) throw new Error(body?.error || `HTTP ${res.status}`);
  const sale = { ...body, created_region: body.created_region || region, startedAt, doneMs: null };
  sales.unshift(sale);
  render();
  follow(sale);
  return sale;
}

async function submit(count) {
  const product = $("product").value.trim();
  const amount = Number($("amount").value);
  $("message").className = "message";
  $("message").textContent = count > 1 ? `Criando ${count} vendas…` : "Criando venda…";
  try {
    const created = await Promise.all(Array.from({ length: count }, (_, i) => createSale(count > 1 ? `${product} #${i + 1}` : product, amount)));
    $("message").textContent = `${created.length} venda(s) criada(s) em ${created[0].created_region}. Acompanhe o processamento abaixo.`;
  } catch (err) {
    $("message").className = "message error";
    $("message").textContent = `Não foi possível criar: ${err.message}`;
  }
  showRegion();
}

$("form").addEventListener("submit", (e) => { e.preventDefault(); submit(1); });
$("burst").addEventListener("click", () => { if ($("form").reportValidity()) submit(5); });
$("clear").addEventListener("click", () => { sales.length = 0; render(); });
$("sales").addEventListener("click", async (e) => {
  const id = e.target.dataset.delete;
  if (!id) return;
  await api(`/sales/${id}`, { method: "DELETE" }).catch(() => {});
  const i = sales.findIndex((s) => s.id === id);
  if (i >= 0) sales.splice(i, 1);
  render();
});

showRegion();
setInterval(showRegion, 15000); // shows a failover while the page is open
