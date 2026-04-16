const cliente = document.getElementById("cliente");
const nf = document.getElementById("nf");
const pedido = document.getElementById("pedido");
const volumes = document.getElementById("volumes");
const valor = document.getElementById("valor");
const caixa = document.getElementById("caixa");

const btnAdicionar = document.getElementById("btnAdicionar");
const btnAdicionarTopo = document.getElementById("btnAdicionarTopo");
const btnLimpar = document.getElementById("btnLimpar");
const btnPDF = document.getElementById("btnPDF");
const btnPDFTopo = document.getElementById("btnPDFTopo");

const buscaNotas = document.getElementById("buscaNotas");
const filtroStatus = document.getElementById("filtroStatus");
const listaNotas = document.getElementById("listaNotas");
const contadorFiltrado = document.getElementById("contadorFiltrado");

const totalNotas = document.getElementById("totalNotas");
const totalPendentes = document.getElementById("totalPendentes");
const totalExpedidos = document.getElementById("totalExpedidos");
const valorTotal = document.getElementById("valorTotal");

const toast = document.getElementById("toast");

const STORAGE_KEY = "expedicao.notas";

let notas = [];
let editId = null;

function gerarId() {
  return Date.now() + Math.floor(Math.random() * 1000);
}

function formatarMoeda(valorMonetario) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(Number(valorMonetario) || 0);
}

function formatarData(data) {
  return new Date(data).toLocaleDateString("pt-BR");
}

function calcularDiasNaExpedicao(dataCriacao) {
  const hoje = new Date();
  const dataNota = new Date(dataCriacao);

  const hojeZerado = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  const dataNotaZerada = new Date(dataNota.getFullYear(), dataNota.getMonth(), dataNota.getDate());
  const diferencaMs = hojeZerado - dataNotaZerada;
  const dias = Math.max(0, Math.floor(diferencaMs / 86400000));

  if (dias === 0) return "Hoje";
  if (dias === 1) return "1 dia";
  return `${dias} dias`;
}

function mostrarToast(msg, tipo) {
  toast.textContent = msg;
  toast.className = "";
  toast.classList.add("show", tipo);
  setTimeout(() => toast.classList.remove("show"), 3000);
}

function salvarNotas() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notas));
}

function carregarNotasSalvas() {
  const notasSalvas = localStorage.getItem(STORAGE_KEY);
  if (!notasSalvas) return [];

  try {
    const dados = JSON.parse(notasSalvas);
    return Array.isArray(dados) ? dados : [];
  } catch (error) {
    console.error("Erro ao ler notas salvas:", error);
    return [];
  }
}

function obterDadosFormulario() {
  return {
    cliente: cliente.value.trim(),
    nf: nf.value.trim(),
    pedido: pedido.value.trim(),
    volumes: Number(volumes.value),
    valor: Number(valor.value),
    caixa: caixa.value
  };
}

function limparFormulario() {
  cliente.value = "";
  nf.value = "";
  pedido.value = "";
  volumes.value = "";
  valor.value = "";
  caixa.value = "";
  editId = null;
}

function obterStatus(nota) {
  return nota.expedido ? "expedido" : "pendente";
}

function filtrarNotas() {
  const termo = buscaNotas.value.trim().toLowerCase();
  const statusSelecionado = filtroStatus.value;

  return notas.filter((nota) => {
    const atendeBusca = !termo || [nota.cliente, nota.nf, nota.pedido].some((campo) => {
      return String(campo).toLowerCase().includes(termo);
    });

    const statusNota = obterStatus(nota);
    const atendeStatus = statusSelecionado === "todos" || statusNota === statusSelecionado;

    return atendeBusca && atendeStatus;
  });
}

function atualizarResumo() {
  const pendentes = notas.filter((nota) => !nota.expedido).length;
  const expedidos = notas.filter((nota) => nota.expedido).length;
  const somaValores = notas.reduce((acumulador, nota) => acumulador + (Number(nota.valor) || 0), 0);

  totalNotas.textContent = notas.length;
  totalPendentes.textContent = pendentes;
  totalExpedidos.textContent = expedidos;
  valorTotal.textContent = formatarMoeda(somaValores);
}

function render() {
  const notasFiltradas = filtrarNotas();
  listaNotas.innerHTML = "";
  contadorFiltrado.textContent = `${notasFiltradas.length} registro${notasFiltradas.length === 1 ? "" : "s"}`;

  if (!notasFiltradas.length) {
    listaNotas.innerHTML = `
      <tr>
        <td colspan="9" class="empty-state">
          Nenhum registro encontrado com os filtros atuais.
        </td>
      </tr>
    `;
    atualizarResumo();
    return;
  }

  notasFiltradas.forEach((nota) => {
    const tr = document.createElement("tr");
    const status = obterStatus(nota);
    const statusTexto = status === "expedido" ? "Expedido" : "Pendente";

    tr.innerHTML = `
      <td>
        <div class="cliente-cell">
          <strong>${nota.cliente}</strong>
          <span>Lançado em ${formatarData(nota.created_at)}</span>
        </div>
      </td>
      <td>${nota.nf}</td>
      <td>${nota.pedido}</td>
      <td>${nota.volumes}</td>
      <td>${nota.caixa}</td>
      <td>${formatarMoeda(nota.valor)}</td>
      <td><span class="status-badge status-${status}">${statusTexto}</span></td>
      <td><span class="tempo-pill">${calcularDiasNaExpedicao(nota.created_at)}</span></td>
      <td>
        <div class="acoes-cell">
          <button class="table-action" onclick="editar(${nota.id})" type="button">Editar</button>
          <button class="table-action table-action-highlight" onclick="alternarExpedido(${nota.id}, ${nota.expedido})" type="button">
            ${nota.expedido ? "Reabrir" : "Expedir"}
          </button>
          <button class="table-action table-action-danger" onclick="excluir(${nota.id})" type="button">Excluir</button>
        </div>
      </td>
    `;

    listaNotas.appendChild(tr);
  });

  atualizarResumo();
}

function carregarNotas() {
  notas = carregarNotasSalvas().sort((a, b) => {
    return new Date(b.created_at) - new Date(a.created_at);
  });

  render();
}

function salvarRegistro() {
  const dados = obterDadosFormulario();

  if (!dados.cliente || !dados.nf || !dados.pedido || !dados.volumes || !dados.valor || !dados.caixa) {
    mostrarToast("Preencha todos os campos.", "aviso");
    return;
  }

  const duplicado = notas.some((nota) => {
    return (nota.nf === dados.nf || nota.pedido === dados.pedido) && nota.id !== editId;
  });

  if (duplicado) {
    mostrarToast("Nota fiscal ou pedido já existente.", "erro");
    return;
  }

  if (editId) {
    notas = notas.map((nota) => {
      return nota.id === editId ? { ...nota, ...dados } : nota;
    });

    mostrarToast("Registro atualizado com sucesso.", "sucesso");
  } else {
    notas.unshift({
      id: gerarId(),
      ...dados,
      expedido: false,
      created_at: new Date().toISOString()
    });

    mostrarToast("Registro criado com sucesso.", "sucesso");
  }

  salvarNotas();
  limparFormulario();
  carregarNotas();
}

btnAdicionar.addEventListener("click", salvarRegistro);
btnAdicionarTopo.addEventListener("click", () => cliente.focus());
btnLimpar.addEventListener("click", limparFormulario);
btnPDF.addEventListener("click", gerarPDF);
btnPDFTopo.addEventListener("click", gerarPDF);
buscaNotas.addEventListener("input", render);
filtroStatus.addEventListener("change", render);

window.editar = (id) => {
  const nota = notas.find((item) => item.id === id);
  if (!nota) return;

  cliente.value = nota.cliente;
  nf.value = nota.nf;
  pedido.value = nota.pedido;
  volumes.value = nota.volumes;
  valor.value = nota.valor;
  caixa.value = nota.caixa;
  editId = id;
  cliente.focus();
  mostrarToast("Registro carregado para edição.", "sucesso");
};

window.excluir = (id) => {
  const confirmar = window.confirm("Deseja realmente excluir este registro?");
  if (!confirmar) return;

  notas = notas.filter((nota) => nota.id !== id);
  salvarNotas();
  mostrarToast("Registro excluído.", "aviso");
  carregarNotas();
};

window.alternarExpedido = (id, estadoAtual) => {
  notas = notas.map((nota) => {
    return nota.id === id ? { ...nota, expedido: !estadoAtual } : nota;
  });

  salvarNotas();
  mostrarToast(!estadoAtual ? "Registro marcado como expedido." : "Registro reaberto.", "sucesso");
  carregarNotas();
};

function gerarPDF() {
  if (!notas.length) {
    mostrarToast("Nenhum registro para gerar PDF.", "aviso");
    return;
  }

  const notasFiltradas = filtrarNotas();
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.text("Relatorio de Expedicao", 14, 16);
  doc.text(`Data de emissao: ${new Date().toLocaleDateString("pt-BR")}`, 14, 22);

  doc.autoTable({
    startY: 30,
    head: [["Cliente", "NF", "Pedido", "Volumes", "Caixa", "Valor", "Status"]],
    body: notasFiltradas.map((nota) => [
      nota.cliente,
      nota.nf,
      nota.pedido,
      nota.volumes,
      nota.caixa,
      formatarMoeda(nota.valor),
      nota.expedido ? "Expedido" : "Pendente"
    ])
  });

  doc.save("relatorio-expedicao.pdf");
}

carregarNotas();
