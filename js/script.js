const cliente = document.getElementById("cliente");
const transportadora = document.getElementById("transportadora");
const menuClientes = document.getElementById("menuClientes");
const menuTransportadoras = document.getElementById("menuTransportadoras");
const nf = document.getElementById("nf");
const pedido = document.getElementById("pedido");
const volumes = document.getElementById("volumes");
const valor = document.getElementById("valor");

const btnAdicionar = document.getElementById("btnAdicionar");
const btnLimpar = document.getElementById("btnLimpar");
const btnPDF = document.getElementById("btnPDF");
const btnSair = document.getElementById("btnSair");
const btnToggleFormulario = document.getElementById("btnToggleFormulario");
const btnToggleSidebar = document.getElementById("btnToggleSidebar");
const btnToggleSidebarFloating = document.getElementById("btnToggleSidebarFloating");
const btnSalvarCliente = document.getElementById("btnSalvarCliente");
const btnSalvarTransportadora = document.getElementById("btnSalvarTransportadora");
const btnSalvarMotorista = document.getElementById("btnSalvarMotorista");
const btnToggleClientes = document.getElementById("btnToggleClientes");
const btnToggleTransportadoras = document.getElementById("btnToggleTransportadoras");
const btnToggleMotoristas = document.getElementById("btnToggleMotoristas");

const nomeClienteCadastro = document.getElementById("nomeClienteCadastro");
const nomeTransportadoraCadastro = document.getElementById("nomeTransportadoraCadastro");
const nomeMotorista = document.getElementById("nomeMotorista");

const buscaNotas = document.getElementById("buscaNotas");
const filtroStatus = document.getElementById("filtroStatus");
const listaNotas = document.getElementById("listaNotas");
const contadorFiltrado = document.getElementById("contadorFiltrado");
const listaClientes = document.getElementById("listaClientes");
const listaTransportadoras = document.getElementById("listaTransportadoras");
const listaMotoristas = document.getElementById("listaMotoristas");
const contadorClientes = document.getElementById("contadorClientes");
const contadorTransportadoras = document.getElementById("contadorTransportadoras");
const contadorMotoristas = document.getElementById("contadorMotoristas");

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
const CLIENTES_STORAGE_KEY = "expedicao.clientes";
const TRANSPORTADORAS_STORAGE_KEY = "expedicao.transportadoras";
const MOTORISTAS_STORAGE_KEY = "expedicao.motoristas";
const SIDEBAR_STATE_KEY = "expedicao.sidebarCollapsed";
const FORM_STATE_KEY = "expedicao.formularioRetraido";
const VIEW_STATE_KEY = "expedicao.viewAtual";
const CLIENTES_VISIBLE_KEY = "expedicao.clientesVisible";
const TRANSPORTADORAS_VISIBLE_KEY = "expedicao.transportadorasVisible";
const MOTORISTAS_VISIBLE_KEY = "expedicao.motoristasVisible";

const supabaseConfig = window.SUPABASE_CONFIG || {};
const supabaseUrl = String(supabaseConfig.url || "").trim();
const supabaseAnonKey = String(supabaseConfig.anonKey || "").trim();
const bancoSupabaseAtivo = Boolean(window.supabase && supabaseUrl && supabaseAnonKey);
const banco = bancoSupabaseAtivo ? window.supabase.createClient(supabaseUrl, supabaseAnonKey) : null;

let notas = [];
let clientes = [];
let transportadoras = [];
let motoristas = [];
let editId = null;
let chipCaixaAtivo = null;
let comboAberto = null;

function gerarId() {
  return Date.now() + Math.floor(Math.random() * 1000);
}

function lerListaStorage(chave) {
  const valorSalvo = localStorage.getItem(chave);
  if (!valorSalvo) return [];

  try {
    const dados = JSON.parse(valorSalvo);
    return Array.isArray(dados) ? dados : [];
  } catch (error) {
    console.error(`Erro ao ler ${chave}:`, error);
    return [];
  }
}

function salvarListaStorage(chave, lista) {
  localStorage.setItem(chave, JSON.stringify(lista));
}

function tratarErroBanco(error) {
  console.error("Erro no Supabase:", error);
  mostrarToast("Nao foi possivel sincronizar com o banco de dados.", "erro");
}

async function carregarNomesTabela(tabela) {
  const { data, error } = await banco
    .from(tabela)
    .select("nome")
    .order("nome", { ascending: true });

  if (error) throw error;
  return (data || []).map((item) => item.nome);
}

async function inserirNomeTabela(tabela, nome) {
  const { error } = await banco.from(tabela).insert({ nome });
  if (error) throw error;
}

async function removerNomeTabela(tabela, nome) {
  const { error } = await banco.from(tabela).delete().eq("nome", nome);
  if (error) throw error;
}

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
  return normalizarCaixas(caixasSelecionadas).reduce((total, item) => total + item.quantidade, 0);
}

function ajustarCaixasParaVolumes(caixasSelecionadas, totalVolumes) {
  const caixasNormalizadas = normalizarCaixas(caixasSelecionadas);

  if (caixasNormalizadas.length === 1) {
    return [{
      tipo: caixasNormalizadas[0].tipo,
      quantidade: totalVolumes
    }];
  }

  return caixasNormalizadas;
}

function mostrarToast(msg, tipo) {
  toast.textContent = msg;
  toast.className = "";
  toast.classList.add("show", tipo);
  setTimeout(() => toast.classList.remove("show"), 3000);
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

function aplicarEstadoSidebar(colapsado) {
  document.body.classList.toggle("sidebar-collapsed", colapsado);

  [btnToggleSidebar, btnToggleSidebarFloating].forEach((botao) => {
    if (!botao) return;
    botao.setAttribute("aria-expanded", String(!colapsado));
    botao.setAttribute("aria-label", colapsado ? "Exibir menu lateral" : "Ocultar menu lateral");
  });
}

function aplicarEstadoFormulario(retraido) {
  document.body.classList.toggle("formulario-retraido", retraido);

  if (!btnToggleFormulario) return;
  btnToggleFormulario.setAttribute("aria-expanded", String(!retraido));
  btnToggleFormulario.setAttribute("aria-label", retraido ? "Expandir formulário" : "Recolher formulário");
}

function aplicarView(view) {
  const viewFinal = ["painel", "cadastros", "expedicao"].includes(view) ? view : "painel";

  document.querySelectorAll(".view-section").forEach((section) => {
    section.classList.toggle("is-active", section.id === `view-${viewFinal}`);
  });

  document.querySelectorAll(".nav-item").forEach((button) => {
    button.classList.toggle("active", button.dataset.view === viewFinal);
  });
}

function alternarSidebar() {
  const colapsado = !document.body.classList.contains("sidebar-collapsed");
  aplicarEstadoSidebar(colapsado);
  localStorage.setItem(SIDEBAR_STATE_KEY, JSON.stringify(colapsado));
}

function alternarFormulario() {
  const retraido = !document.body.classList.contains("formulario-retraido");
  aplicarEstadoFormulario(retraido);
  localStorage.setItem(FORM_STATE_KEY, JSON.stringify(retraido));
}

function carregarEstadoSidebar() {
  aplicarEstadoSidebar(JSON.parse(localStorage.getItem(SIDEBAR_STATE_KEY) || "false"));
}

function carregarEstadoFormulario() {
  aplicarEstadoFormulario(JSON.parse(localStorage.getItem(FORM_STATE_KEY) || "false"));
}

function carregarView() {
  aplicarView(localStorage.getItem(VIEW_STATE_KEY) || "painel");
}

function navegarPara(view) {
  aplicarView(view);
  localStorage.setItem(VIEW_STATE_KEY, view);
}

function toggleListaCadastros(tipo) {
  const mapeamento = {
    clientes: { lista: listaClientes, botao: btnToggleClientes, chave: CLIENTES_VISIBLE_KEY },
    transportadoras: { lista: listaTransportadoras, botao: btnToggleTransportadoras, chave: TRANSPORTADORAS_VISIBLE_KEY },
    motoristas: { lista: listaMotoristas, botao: btnToggleMotoristas, chave: MOTORISTAS_VISIBLE_KEY }
  };

  const config = mapeamento[tipo];
  if (!config) return;

  const visivel = !config.lista.classList.contains("is-hidden");
  const novoEstado = !visivel;

  config.lista.classList.toggle("is-hidden", !novoEstado);
  config.botao.setAttribute("aria-expanded", String(novoEstado));
  localStorage.setItem(config.chave, JSON.stringify(novoEstado));
}

function carregarEstadoListas() {
  const estados = [
    { lista: listaClientes, botao: btnToggleClientes, chave: CLIENTES_VISIBLE_KEY },
    { lista: listaTransportadoras, botao: btnToggleTransportadoras, chave: TRANSPORTADORAS_VISIBLE_KEY },
    { lista: listaMotoristas, botao: btnToggleMotoristas, chave: MOTORISTAS_VISIBLE_KEY }
  ];

  estados.forEach(({ lista, botao, chave }) => {
    const visivel = JSON.parse(localStorage.getItem(chave) || "false");
    lista.classList.toggle("is-hidden", !visivel);
    botao.setAttribute("aria-expanded", String(visivel));
  });
}

function fecharMenuQuantidade() {
  chipCaixaAtivo = null;
  quantidadeMenu.hidden = true;
}

function posicionarMenuQuantidade(evento) {
  const margem = 12;
  quantidadeMenu.hidden = false;

  const largura = quantidadeMenu.offsetWidth;
  const altura = quantidadeMenu.offsetHeight;
  const leftPreferido = evento?.clientX || window.innerWidth / 2;
  const topPreferido = evento?.clientY || window.innerHeight / 2;

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
  posicionarMenuQuantidade(evento);
}

function abrirCombo(tipo) {
  comboAberto = tipo;
  document.querySelectorAll(".combo-field").forEach((field) => {
    field.classList.toggle("is-open", field.dataset.combo === tipo);
  });
  menuClientes.hidden = tipo !== "cliente";
  menuTransportadoras.hidden = tipo !== "transportadora";
}

function fecharCombos() {
  comboAberto = null;
  document.querySelectorAll(".combo-field").forEach((field) => {
    field.classList.remove("is-open");
  });
  menuClientes.hidden = true;
  menuTransportadoras.hidden = true;
}

function filtrarItensCombo(items, termo) {
  const busca = termo.trim().toLowerCase();
  if (!busca) return items;
  return items.filter((item) => item.toLowerCase().includes(busca));
}

function renderCombo(menu, items, tipo) {
  const termo = tipo === "cliente" ? cliente.value : transportadora.value;
  const itensFiltrados = filtrarItensCombo(items, termo);

  menu.innerHTML = "";

  if (!itensFiltrados.length) {
    menu.innerHTML = `<div class="combo-empty">Nenhuma opção cadastrada encontrada.</div>`;
    return;
  }

  itensFiltrados.forEach((item) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "combo-option";
    button.textContent = item;
    button.addEventListener("click", () => {
      if (tipo === "cliente") {
        cliente.value = item;
      } else {
        transportadora.value = item;
      }
      fecharCombos();
    });
    menu.appendChild(button);
  });
}

function alternarCombo(tipo) {
  if (comboAberto === tipo) {
    fecharCombos();
    return;
  }

  if (tipo === "cliente") {
    renderCombo(menuClientes, clientes, "cliente");
  } else {
    renderCombo(menuTransportadoras, transportadoras, "transportadora");
  }

  abrirCombo(tipo);
}

function renderCadastros() {
  contadorClientes.textContent = `${clientes.length} cliente${clientes.length === 1 ? "" : "s"}`;
  contadorTransportadoras.textContent = `${transportadoras.length} transportadora${transportadoras.length === 1 ? "" : "s"}`;
  contadorMotoristas.textContent = `${motoristas.length} motorista${motoristas.length === 1 ? "" : "s"}`;

  listaClientes.innerHTML = clientes.length
    ? clientes.map((item) => `
        <div class="cadastro-item">
          <strong>${item}</strong>
          <button type="button" onclick="removerCliente('${item.replace(/'/g, "\\'")}')">Excluir</button>
        </div>
      `).join("")
    : `<div class="cadastro-vazio">Nenhum cliente cadastrado ainda.</div>`;

  listaTransportadoras.innerHTML = transportadoras.length
    ? transportadoras.map((item) => `
        <div class="cadastro-item">
          <strong>${item}</strong>
          <button type="button" onclick="removerTransportadora('${item.replace(/'/g, "\\'")}')">Excluir</button>
        </div>
      `).join("")
    : `<div class="cadastro-vazio">Nenhuma transportadora cadastrada ainda.</div>`;

  listaMotoristas.innerHTML = motoristas.length
    ? motoristas.map((item) => `
        <div class="cadastro-item">
          <strong>${item}</strong>
          <button type="button" onclick="removerMotorista('${item.replace(/'/g, "\\'")}')">Excluir</button>
        </div>
      `).join("")
    : `<div class="cadastro-vazio">Nenhum motorista cadastrado ainda.</div>`;

  renderCombo(menuClientes, clientes, "cliente");
  renderCombo(menuTransportadoras, transportadoras, "transportadora");
}

async function carregarCadastros() {
  if (bancoSupabaseAtivo) {
    try {
      [clientes, transportadoras, motoristas] = await Promise.all([
        carregarNomesTabela("clientes"),
        carregarNomesTabela("transportadoras"),
        carregarNomesTabela("motoristas")
      ]);
      renderCadastros();
      return;
    } catch (error) {
      tratarErroBanco(error);
    }
  }

  clientes = lerListaStorage(CLIENTES_STORAGE_KEY).sort((a, b) => a.localeCompare(b));
  transportadoras = lerListaStorage(TRANSPORTADORAS_STORAGE_KEY).sort((a, b) => a.localeCompare(b));
  motoristas = lerListaStorage(MOTORISTAS_STORAGE_KEY).sort((a, b) => a.localeCompare(b));
  renderCadastros();
}

async function salvarCliente() {
  const nome = nomeClienteCadastro.value.trim();
  if (!nome) {
    mostrarToast("Informe o nome do cliente.", "aviso");
    return;
  }

  if (clientes.some((item) => item.toLowerCase() === nome.toLowerCase())) {
    mostrarToast("Este cliente já foi cadastrado.", "erro");
    return;
  }

  if (bancoSupabaseAtivo) {
    try {
      await inserirNomeTabela("clientes", nome);
      nomeClienteCadastro.value = "";
      await carregarCadastros();
      mostrarToast("Cliente cadastrado com sucesso.", "sucesso");
    } catch (error) {
      tratarErroBanco(error);
    }
    return;
  }

  clientes.push(nome);
  clientes.sort((a, b) => a.localeCompare(b));
  salvarListaStorage(CLIENTES_STORAGE_KEY, clientes);
  nomeClienteCadastro.value = "";
  renderCadastros();
  mostrarToast("Cliente cadastrado com sucesso.", "sucesso");
}

async function salvarTransportadora() {
  const nome = nomeTransportadoraCadastro.value.trim();
  if (!nome) {
    mostrarToast("Informe o nome da transportadora.", "aviso");
    return;
  }

  if (transportadoras.some((item) => item.toLowerCase() === nome.toLowerCase())) {
    mostrarToast("Esta transportadora já foi cadastrada.", "erro");
    return;
  }

  if (bancoSupabaseAtivo) {
    try {
      await inserirNomeTabela("transportadoras", nome);
      nomeTransportadoraCadastro.value = "";
      await carregarCadastros();
      mostrarToast("Transportadora cadastrada com sucesso.", "sucesso");
    } catch (error) {
      tratarErroBanco(error);
    }
    return;
  }

  transportadoras.push(nome);
  transportadoras.sort((a, b) => a.localeCompare(b));
  salvarListaStorage(TRANSPORTADORAS_STORAGE_KEY, transportadoras);
  nomeTransportadoraCadastro.value = "";
  renderCadastros();
  mostrarToast("Transportadora cadastrada com sucesso.", "sucesso");
}

async function salvarMotorista() {
  const nome = nomeMotorista.value.trim();
  if (!nome) {
    mostrarToast("Informe o nome do motorista.", "aviso");
    return;
  }

  if (motoristas.some((item) => item.toLowerCase() === nome.toLowerCase())) {
    mostrarToast("Este motorista já foi cadastrado.", "erro");
    return;
  }

  if (bancoSupabaseAtivo) {
    try {
      await inserirNomeTabela("motoristas", nome);
      nomeMotorista.value = "";
      await carregarCadastros();
      mostrarToast("Motorista cadastrado com sucesso.", "sucesso");
    } catch (error) {
      tratarErroBanco(error);
    }
    return;
  }

  motoristas.push(nome);
  motoristas.sort((a, b) => a.localeCompare(b));
  salvarListaStorage(MOTORISTAS_STORAGE_KEY, motoristas);
  nomeMotorista.value = "";
  renderCadastros();
  mostrarToast("Motorista cadastrado com sucesso.", "sucesso");
}

window.removerCliente = async (nome) => {
  if (bancoSupabaseAtivo) {
    try {
      await removerNomeTabela("clientes", nome);
      await carregarCadastros();
      mostrarToast("Cliente removido.", "aviso");
    } catch (error) {
      tratarErroBanco(error);
    }
    return;
  }

  clientes = clientes.filter((item) => item !== nome);
  salvarListaStorage(CLIENTES_STORAGE_KEY, clientes);
  renderCadastros();
  mostrarToast("Cliente removido.", "aviso");
};

window.removerTransportadora = async (nome) => {
  if (bancoSupabaseAtivo) {
    try {
      await removerNomeTabela("transportadoras", nome);
      await carregarCadastros();
      mostrarToast("Transportadora removida.", "aviso");
    } catch (error) {
      tratarErroBanco(error);
    }
    return;
  }

  transportadoras = transportadoras.filter((item) => item !== nome);
  salvarListaStorage(TRANSPORTADORAS_STORAGE_KEY, transportadoras);
  renderCadastros();
  mostrarToast("Transportadora removida.", "aviso");
};

window.removerMotorista = async (nome) => {
  if (bancoSupabaseAtivo) {
    try {
      await removerNomeTabela("motoristas", nome);
      await carregarCadastros();
      mostrarToast("Motorista removido.", "aviso");
    } catch (error) {
      tratarErroBanco(error);
    }
    return;
  }

  motoristas = motoristas.filter((item) => item !== nome);
  salvarListaStorage(MOTORISTAS_STORAGE_KEY, motoristas);
  renderCadastros();
  mostrarToast("Motorista removido.", "aviso");
};

function salvarNotas() {
  if (bancoSupabaseAtivo) return;
  salvarListaStorage(STORAGE_KEY, notas);
}

async function carregarNotas() {
  if (bancoSupabaseAtivo) {
    try {
      const { data, error } = await banco
        .from("notas")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      notas = (data || []).map((nota) => ({
        ...nota,
        caixa: normalizarCaixas(nota.caixa)
      }));
      renderNotas();
      return;
    } catch (error) {
      tratarErroBanco(error);
    }
  }

  notas = lerListaStorage(STORAGE_KEY).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  renderNotas();
}

function obterDadosFormulario() {
  return {
    cliente: cliente.value.trim(),
    transportadora: transportadora.value.trim(),
    nf: nf.value.trim(),
    pedido: pedido.value.trim(),
    volumes: Number(volumes.value),
    valor: Number(valor.value),
    caixa: obterCaixasSelecionadas()
  };
}

function limparFormulario() {
  cliente.value = "";
  transportadora.value = "";
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
    const atendeBusca = !termo || [nota.cliente, nota.transportadora, nota.nf, nota.pedido].some((campo) => {
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

function renderNotas() {
  const notasFiltradas = filtrarNotas();
  listaNotas.innerHTML = "";
  contadorFiltrado.textContent = `${notasFiltradas.length} registro${notasFiltradas.length === 1 ? "" : "s"}`;

  if (!notasFiltradas.length) {
    listaNotas.innerHTML = `
      <tr>
        <td colspan="10" class="empty-state">
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
      <td data-label="Cliente">
        <div class="cliente-cell">
          <strong>${nota.cliente}</strong>
          <span>${formatarData(nota.created_at)}</span>
        </div>
      </td>
      <td data-label="Transportadora">${nota.transportadora || "-"}</td>
      <td data-label="NF">${nota.nf}</td>
      <td data-label="Pedido">${nota.pedido}</td>
      <td data-label="Volumes">${nota.volumes}</td>
      <td data-label="Caixa">${formatarCaixas(nota.caixa)}</td>
      <td data-label="Valor">${formatarMoeda(nota.valor)}</td>
      <td data-label="Status"><span class="status-badge status-${status}">${statusTexto}</span></td>
      <td data-label="Dias"><span class="tempo-pill">${calcularDiasNaExpedicao(nota.created_at)}</span></td>
      <td data-label="Ações">
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

async function salvarRegistro() {
  const dados = obterDadosFormulario();

  if (!dados.cliente || !dados.transportadora || !dados.nf || !dados.pedido || !dados.volumes || !dados.valor || !dados.caixa.length) {
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
    mostrarToast("Nota fiscal ou pedido já existente.", "erro");
    return;
  }

  if (bancoSupabaseAtivo) {
    try {
      if (editId) {
        const { error } = await banco
          .from("notas")
          .update(dados)
          .eq("id", editId);

        if (error) throw error;
        mostrarToast("Registro atualizado com sucesso.", "sucesso");
      } else {
        const { error } = await banco
          .from("notas")
          .insert({
            ...dados,
            expedido: false
          });

        if (error) throw error;
        mostrarToast("Registro criado com sucesso.", "sucesso");
      }

      limparFormulario();
      await carregarNotas();
    } catch (error) {
      tratarErroBanco(error);
    }
    return;
  }

  if (editId) {
    notas = notas.map((nota) => (nota.id === editId ? { ...nota, ...dados } : nota));
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

window.editar = (id) => {
  const nota = notas.find((item) => item.id === id);
  if (!nota) return;

  cliente.value = nota.cliente;
  transportadora.value = nota.transportadora || "";
  nf.value = nota.nf;
  pedido.value = nota.pedido;
  volumes.value = nota.volumes;
  valor.value = nota.valor;
  definirCaixasSelecionadas(nota.caixa);
  editId = id;
  navegarPara("painel");
  cliente.focus();
  mostrarToast("Registro carregado para edição.", "sucesso");
};

window.excluir = async (id) => {
  const confirmar = window.confirm("Deseja realmente excluir este registro?");
  if (!confirmar) return;

  if (bancoSupabaseAtivo) {
    try {
      const { error } = await banco.from("notas").delete().eq("id", id);
      if (error) throw error;
      mostrarToast("Registro excluido.", "aviso");
      await carregarNotas();
    } catch (error) {
      tratarErroBanco(error);
    }
    return;
  }

  notas = notas.filter((nota) => nota.id !== id);
  salvarNotas();
  mostrarToast("Registro excluído.", "aviso");
  carregarNotas();
};

window.alternarExpedido = async (id, estadoAtual) => {
  if (bancoSupabaseAtivo) {
    try {
      const { error } = await banco
        .from("notas")
        .update({ expedido: !estadoAtual })
        .eq("id", id);

      if (error) throw error;
      mostrarToast(!estadoAtual ? "Registro marcado como expedido." : "Registro reaberto.", "sucesso");
      await carregarNotas();
    } catch (error) {
      tratarErroBanco(error);
    }
    return;
  }

  notas = notas.map((nota) => (nota.id === id ? { ...nota, expedido: !estadoAtual } : nota));
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
    head: [["Cliente", "Transportadora", "NF", "Pedido", "Volumes", "Caixa", "Valor", "Status"]],
    body: notasFiltradas.map((nota) => [
      nota.cliente,
      nota.transportadora || "-",
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

btnAdicionar.addEventListener("click", salvarRegistro);
btnLimpar.addEventListener("click", limparFormulario);
btnPDF.addEventListener("click", gerarPDF);
btnToggleSidebar.addEventListener("click", alternarSidebar);
btnToggleSidebarFloating.addEventListener("click", alternarSidebar);
btnToggleFormulario.addEventListener("click", alternarFormulario);
btnSalvarCliente.addEventListener("click", salvarCliente);
btnSalvarTransportadora.addEventListener("click", salvarTransportadora);
btnSalvarMotorista.addEventListener("click", salvarMotorista);
btnToggleClientes.addEventListener("click", () => toggleListaCadastros("clientes"));
btnToggleTransportadoras.addEventListener("click", () => toggleListaCadastros("transportadoras"));
btnToggleMotoristas.addEventListener("click", () => toggleListaCadastros("motoristas"));
buscaNotas.addEventListener("input", renderNotas);
filtroStatus.addEventListener("change", renderNotas);
btnSair.addEventListener("click", () => {
  mostrarToast("Ação de saída reservada para a futura autenticação.", "aviso");
});

cliente.addEventListener("input", () => {
  if (cliente.value.trim()) {
    renderCombo(menuClientes, clientes, "cliente");
    abrirCombo("cliente");
  } else if (comboAberto === "cliente") {
    fecharCombos();
  }
});

transportadora.addEventListener("input", () => {
  if (transportadora.value.trim()) {
    renderCombo(menuTransportadoras, transportadoras, "transportadora");
    abrirCombo("transportadora");
  } else if (comboAberto === "transportadora") {
    fecharCombos();
  }
});

document.querySelectorAll(".combo-trigger").forEach((button) => {
  button.addEventListener("click", (evento) => {
    evento.stopPropagation();
    alternarCombo(button.dataset.comboTrigger);
  });
});

document.querySelectorAll(".nav-item").forEach((button) => {
  button.addEventListener("click", () => navegarPara(button.dataset.view));
});

document.querySelectorAll(".checkbox-chip").forEach((chip) => {
  chip.addEventListener("contextmenu", (evento) => abrirMenuQuantidade(evento, chip));
});

document.querySelectorAll(".quantidade-opcao").forEach((botao) => {
  botao.addEventListener("click", () => aplicarQuantidadeAoChip(botao.dataset.quantidade));
});

btnAplicarQuantidade.addEventListener("click", () => aplicarQuantidadeAoChip(quantidadeCustomizada.value));

quantidadeCustomizada.addEventListener("keydown", (evento) => {
  if (evento.key === "Enter") {
    evento.preventDefault();
    aplicarQuantidadeAoChip(quantidadeCustomizada.value);
  }
});

document.addEventListener("click", (evento) => {
  const clicouEmCombo = evento.target.closest(".combo-field");
  if (!clicouEmCombo) {
    fecharCombos();
  }

  if (quantidadeMenu.hidden) return;
  if (quantidadeMenu.contains(evento.target)) return;
  fecharMenuQuantidade();
});

document.addEventListener("keydown", (evento) => {
  if (evento.key === "Escape") {
    fecharCombos();
    fecharMenuQuantidade();
  }
});

async function iniciarSistema() {
  carregarEstadoSidebar();
  carregarEstadoFormulario();
  carregarEstadoListas();
  carregarView();
  await carregarCadastros();
  await carregarNotas();
}

iniciarSistema();

// Funcionalidade de Ampliação da Imagem de Perfil
const iniciarZoomAvatar = () => {
    const modal = document.getElementById("modalAvatar");
    const avatar = document.querySelector(".profile-avatar");
    const imgAmpliada = document.getElementById("imgAmpliada");

    if (!modal || !avatar) return;

    // Abrir modal
    avatar.addEventListener("click", () => {
        const imgOriginal = avatar.querySelector("img");
        if (imgOriginal) {
            imgAmpliada.src = imgOriginal.src;
            modal.style.display = "flex";
        }
    });

    // Fechar ao clicar no fundo ou no botão de fechar
    modal.addEventListener("click", () => {
        modal.style.display = "none";
    });

    // Fechar com a tecla ESC para melhor acessibilidade
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && modal.style.display === "flex") {
            modal.style.display = "none";
        }
    });
};

// Inicializa a função
document.addEventListener("DOMContentLoaded", iniciarZoomAvatar);
