const cliente = document.getElementById("cliente");
const nf = document.getElementById("nf");
const pedido = document.getElementById("pedido");
const volumes = document.getElementById("volumes");
const valor = document.getElementById("valor");
const caixa = document.getElementById("caixa");

const btnAdicionar = document.getElementById("btnAdicionar");
const btnLimpar = document.getElementById("btnLimpar");
const btnPDF = document.getElementById("btnPDF");
const btnSair = document.getElementById("btnSair");
const btnToggleFormulario = document.getElementById("btnToggleFormulario");
const btnToggleSidebar = document.getElementById("btnToggleSidebar");
const btnToggleSidebarFloating = document.getElementById("btnToggleSidebarFloating");

const buscaNotas = document.getElementById("buscaNotas");
const filtroStatus = document.getElementById("filtroStatus");
const listaNotas = document.getElementById("listaNotas");
const contadorFiltrado = document.getElementById("contadorFiltrado");

const totalNotas = document.getElementById("totalNotas");
const totalPendentes = document.getElementById("totalPendentes");
const totalExpedidos = document.getElementById("totalExpedidos");
const valorTotal = document.getElementById("valorTotal");

const toast = document.getElementById("toast");
const quantidadeMenu = document.getElementById("quantidadeMenu");
const quantidadeMenuTitulo = document.getElementById("quantidadeMenuTitulo");
const quantidadeCustomizada = document.getElementById("quantidadeCustomizada");
const btnAplicarQuantidade = document.getElementById("btnAplicarQuantidade");

const STORAGE_KEY = "expedicao.notas";
const SIDEBAR_STATE_KEY = "expedicao.sidebarCollapsed";
const FORM_STATE_KEY = "expedicao.formularioRetraido";

let notas = [];
let editId = null;
let chipCaixaAtivo = null;

function obterCaixasSelecionadas() {
  return Array.from(document.querySelectorAll('input[name="caixa"]:checked')).map((input) => {
    const quantidadeInput = input.parentElement.querySelector(".caixa-quantidade");
    const quantidade = Math.max(1, Number(quantidadeInput?.value) || 1);

    return {
      tipo: input.value,
      quantidade
    };
  });
}

function definirCaixasSelecionadas(caixasSelecionadas) {
  const caixasNormalizadas = normalizarCaixas(caixasSelecionadas);

  document.querySelectorAll('input[name="caixa"]').forEach((input) => {
    const quantidadeInput = input.parentElement.querySelector(".caixa-quantidade");
    const caixaEncontrada = caixasNormalizadas.find((item) => item.tipo === input.value);

    input.checked = Boolean(caixaEncontrada);

    if (quantidadeInput) {
      quantidadeInput.value = caixaEncontrada ? caixaEncontrada.quantidade : 1;
    }
  });
}

function formatarCaixas(caixasSelecionadas) {
  return normalizarCaixas(caixasSelecionadas)
    .map((item) => `${item.quantidade}x ${item.tipo}`)
    .join(", ");
}

function somarQuantidadeCaixas(caixasSelecionadas) {
  return normalizarCaixas(caixasSelecionadas).reduce((total, item) => {
    return total + item.quantidade;
  }, 0);
}

function ajustarCaixasParaVolumes(caixasSelecionadas, volumes) {
  const caixasNormalizadas = normalizarCaixas(caixasSelecionadas);

  if (caixasNormalizadas.length === 1) {
    return [{
      tipo: caixasNormalizadas[0].tipo,
      quantidade: volumes
    }];
  }

  return caixasNormalizadas;
}

function fecharMenuQuantidade() {
  chipCaixaAtivo = null;
  quantidadeMenu.hidden = true;
}

function posicionarMenuQuantidade() {
  const margem = 12;
  quantidadeMenu.hidden = false;

  const largura = quantidadeMenu.offsetWidth;
  const altura = quantidadeMenu.offsetHeight;
  const leftPreferido = 395;
  const topPreferido = 395;

  const left = Math.max(margem, Math.min(leftPreferido, window.innerWidth - largura - margem));
  const top = Math.max(margem, Math.min(topPreferido, window.innerHeight - altura - margem));

  quantidadeMenu.style.left = `${left}px`;
  quantidadeMenu.style.top = `${top}px`;
}

function aplicarQuantidadeAoChip(quantidade) {
  if (!chipCaixaAtivo) return;

  const checkbox = chipCaixaAtivo.querySelector('input[type="checkbox"]');
  const campoQuantidade = chipCaixaAtivo.querySelector(".caixa-quantidade");
  const quantidadeFinal = Math.max(1, Number(quantidade) || 1);

  checkbox.checked = true;
  campoQuantidade.value = quantidadeFinal;
  fecharMenuQuantidade();
}

function abrirMenuQuantidade(evento, chip) {
  evento.preventDefault();

  chipCaixaAtivo = chip;
  const checkbox = chip.querySelector('input[type="checkbox"]');
  const campoQuantidade = chip.querySelector(".caixa-quantidade");
  const tipo = checkbox.value;
  const quantidadeAtual = Math.max(1, Number(campoQuantidade.value) || 1);

  quantidadeMenuTitulo.textContent = `Quantidade de caixas ${tipo}`;
  quantidadeCustomizada.value = quantidadeAtual;
  posicionarMenuQuantidade();
}

function normalizarCaixas(caixasSelecionadas) {
  if (!Array.isArray(caixasSelecionadas)) {
    return String(caixasSelecionadas || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .map((tipo) => ({ tipo, quantidade: 1 }));
  }

  return caixasSelecionadas
    .map((item) => {
      if (typeof item === "string") {
        return { tipo: item, quantidade: 1 };
      }

      return {
        tipo: String(item.tipo || "").trim(),
        quantidade: Math.max(1, Number(item.quantidade) || 1)
      };
    })
    .filter((item) => item.tipo);
}

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

function aplicarEstadoSidebar(colapsado) {
  document.body.classList.toggle("sidebar-collapsed", colapsado);

  [btnToggleSidebar, btnToggleSidebarFloating].forEach((botao) => {
    if (!botao) return;

    botao.setAttribute("aria-expanded", String(!colapsado));
    botao.setAttribute(
      "aria-label",
      colapsado ? "Exibir menu lateral" : "Ocultar menu lateral"
    );
  });
}

function aplicarEstadoFormulario(retraido) {
  document.body.classList.toggle("formulario-retraido", retraido);

  if (!btnToggleFormulario) return;

  btnToggleFormulario.setAttribute("aria-expanded", String(!retraido));
  btnToggleFormulario.setAttribute(
    "aria-label",
    retraido ? "Expandir formulário" : "Recolher formulário"
  );
}

function alternarSidebar() {
  const colapsado = !document.body.classList.contains("sidebar-collapsed");
  aplicarEstadoSidebar(colapsado);
  localStorage.setItem(SIDEBAR_STATE_KEY, JSON.stringify(colapsado));
}

function carregarEstadoSidebar() {
  const estadoSalvo = localStorage.getItem(SIDEBAR_STATE_KEY);
  aplicarEstadoSidebar(estadoSalvo ? JSON.parse(estadoSalvo) : false);
}

function alternarFormulario() {
  const retraido = !document.body.classList.contains("formulario-retraido");
  aplicarEstadoFormulario(retraido);
  localStorage.setItem(FORM_STATE_KEY, JSON.stringify(retraido));
}

function carregarEstadoFormulario() {
  const estadoSalvo = localStorage.getItem(FORM_STATE_KEY);
  aplicarEstadoFormulario(estadoSalvo ? JSON.parse(estadoSalvo) : false);
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
    caixa: obterCaixasSelecionadas()
  };
}

function limparFormulario() {
  cliente.value = "";
  nf.value = "";
  pedido.value = "";
  volumes.value = "";
  valor.value = "";
  definirCaixasSelecionadas([]);
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
          <span> ${formatarData(nota.created_at)}</span>
        </div>
      </td>
      <td>${nota.nf}</td>
      <td>${nota.pedido}</td>
      <td>${nota.volumes}</td>
      <td>${formatarCaixas(nota.caixa)}</td>
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

  if (!dados.cliente || !dados.nf || !dados.pedido || !dados.volumes || !dados.valor || !dados.caixa.length) {
    mostrarToast("Preencha todos os campos.", "aviso");
    return;
  }

  dados.caixa = ajustarCaixasParaVolumes(dados.caixa, dados.volumes);

  if (somarQuantidadeCaixas(dados.caixa) !== dados.volumes) {
    mostrarToast("A soma das caixas selecionadas precisa ser igual a quantidade informada em Volumes.", "erro");
    return;
  }

  const duplicado = notas.some((nota) => {
    return (nota.nf === dados.nf || nota.pedido === dados.pedido) && nota.id !== editId;
  });

  if (duplicado) {
    mostrarToast("Nota fiscal ou pedido ja existente.", "erro");
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
btnLimpar.addEventListener("click", limparFormulario);
btnPDF.addEventListener("click", gerarPDF);
btnToggleSidebar.addEventListener("click", alternarSidebar);
btnToggleSidebarFloating.addEventListener("click", alternarSidebar);
btnToggleFormulario.addEventListener("click", alternarFormulario);
buscaNotas.addEventListener("input", render);
filtroStatus.addEventListener("change", render);
btnSair.addEventListener("click", () => {
  mostrarToast("Acao de saida reservada para a futura autenticacao.", "aviso");
});

document.querySelectorAll(".checkbox-chip").forEach((chip) => {
  chip.addEventListener("contextmenu", (evento) => abrirMenuQuantidade(evento, chip));
});

document.querySelectorAll(".quantidade-opcao").forEach((botao) => {
  botao.addEventListener("click", () => aplicarQuantidadeAoChip(botao.dataset.quantidade));
});

btnAplicarQuantidade.addEventListener("click", () => {
  aplicarQuantidadeAoChip(quantidadeCustomizada.value);
});

quantidadeCustomizada.addEventListener("keydown", (evento) => {
  if (evento.key === "Enter") {
    evento.preventDefault();
    aplicarQuantidadeAoChip(quantidadeCustomizada.value);
  }
});

document.addEventListener("click", (evento) => {
  if (quantidadeMenu.hidden) return;
  if (quantidadeMenu.contains(evento.target)) return;

  fecharMenuQuantidade();
});

document.addEventListener("keydown", (evento) => {
  if (evento.key === "Escape") {
    fecharMenuQuantidade();
  }
});

window.editar = (id) => {
  const nota = notas.find((item) => item.id === id);
  if (!nota) return;

  cliente.value = nota.cliente;
  nf.value = nota.nf;
  pedido.value = nota.pedido;
  volumes.value = nota.volumes;
  valor.value = nota.valor;
  definirCaixasSelecionadas(nota.caixa);
  editId = id;
  cliente.focus();
  mostrarToast("Registro carregado para edicao.", "sucesso");
};

window.excluir = (id) => {
  const confirmar = window.confirm("Deseja realmente excluir este registro?");
  if (!confirmar) return;

  notas = notas.filter((nota) => nota.id !== id);
  salvarNotas();
  mostrarToast("Registro excluido.", "aviso");
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
      formatarCaixas(nota.caixa),
      formatarMoeda(nota.valor),
      nota.expedido ? "Expedido" : "Pendente"
    ])
  });

  doc.save("relatorio-expedicao.pdf");
}

carregarEstadoSidebar();
carregarEstadoFormulario();
carregarNotas();
