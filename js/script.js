const cliente = document.getElementById("cliente");
const transportadora = document.getElementById("transportadora");
const menuClientes = document.getElementById("menuClientes");
const menuTransportadoras = document.getElementById("menuTransportadoras");
const nf = document.getElementById("nf");
const pedido = document.getElementById("pedido");
const volumes = document.getElementById("volumes");
const valor = document.getElementById("valor");
const endereco = document.getElementById("endereco");

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
const authLoading = document.getElementById("authLoading");
const loginScreen = document.getElementById("loginScreen");
const loginForm = document.getElementById("loginForm");
const loginEmail = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");
const loginError = document.getElementById("loginError");
const loginHelp = document.getElementById("loginHelp");
const btnEntrar = document.getElementById("btnEntrar");
const appShell = document.getElementById("appShell");
const usuarioLogado = document.getElementById("usuarioLogado");
const nomeFilial = document.getElementById("nomeFilial");
const filialLogada = document.getElementById("filialLogada");

const nomeClienteCadastro = document.getElementById("nomeClienteCadastro");
const nomeTransportadoraCadastro = document.getElementById("nomeTransportadoraCadastro");
const nomeMotorista = document.getElementById("nomeMotorista");

const buscaNotas = document.getElementById("buscaNotas");
const filtroStatus = document.getElementById("filtroStatus");
const listaNotas = document.getElementById("listaNotas");
const contadorFiltrado = document.getElementById("contadorFiltrado");
const btnAtivarSom = document.getElementById("btnAtivarSom");
const tabelaNotasWrap = document.querySelector(".panel-table .table-wrap");
const listaClientes = document.getElementById("listaClientes");
const listaTransportadoras = document.getElementById("listaTransportadoras");
const listaMotoristas = document.getElementById("listaMotoristas");
const gridExpedicao = document.getElementById("gridExpedicao");
const buscaExpedicao = document.getElementById("buscaExpedicao");
const filtroExpedicao = document.getElementById("filtroExpedicao");
const contadorClientes = document.getElementById("contadorClientes");
const contadorTransportadoras = document.getElementById("contadorTransportadoras");
const contadorMotoristas = document.getElementById("contadorMotoristas");
const contadorExpedicaoGrid = document.getElementById("contadorExpedicaoGrid");

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
const TABELA_NOTAS = "notas";
const MODELO_ROMANEIO_PATH = "assets/Modelo.docx";

const supabaseConfig = window.SUPABASE_CONFIG || {};
const supabaseUrl = String(supabaseConfig.url || "").trim();
const supabaseAnonKey = String(supabaseConfig.anonKey || "").trim();
const googleMapsApiKey = String(supabaseConfig.googleMapsApiKey || "").trim();
const bancoSupabaseAtivo = Boolean(window.supabase && supabaseUrl && supabaseAnonKey);
const banco = bancoSupabaseAtivo ? window.supabase.createClient(supabaseUrl, supabaseAnonKey) : null;

let perfilAtual = null;
let notas = [];
let clientes = [];
let transportadoras = [];
let motoristas = [];
let editId = null;
let chipCaixaAtivo = null;
let comboAberto = null;
let canalExpedicaoRealtime = null;
let contextoAudioExpedido = null;
let bufferAudioExpedido = null;
let preparacaoSomExpedidoPromise = null;
let somExpedidoAtivo = false;
let temporizadorCliqueSino = null;
const atualizacoesExpedicaoLocais = new Map();
let sincronizacaoRealtimeEmAndamento = false;
let sincronizacaoRealtimeSolicitada = false;
const eventosRealtimePendentes = [];

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

function mostrarTelaLogin(mensagem = "") {
  perfilAtual = null;
  authLoading.hidden = true;
  appShell.hidden = true;
  loginScreen.hidden = false;
  loginError.textContent = mensagem;
}

async function carregarPerfilUsuario(usuario) {
  const { data, error } = await banco
    .from("perfis")
    .select("id, filial_id, som_ativado, filiais(nome)")
    .eq("id", usuario.id)
    .maybeSingle();

  if (error) throw error;
  if (!data?.filial_id || !data.filiais?.nome) {
    throw new Error("Sua conta ainda não está vinculada a uma filial. Solicite acesso ao administrador.");
  }

  perfilAtual = data;
  somExpedidoAtivo = Boolean(data.som_ativado);
  atualizarBotaoSomExpedido();
  usuarioLogado.textContent = usuario.email || "Usuário";
  nomeFilial.textContent = data.filiais.nome;
  filialLogada.textContent = data.filiais.nome;
}

async function entrarNaAplicacao(session) {
  try {
    await carregarPerfilUsuario(session.user);
    await iniciarSistema(session);
    authLoading.hidden = true;
    loginScreen.hidden = true;
    appShell.hidden = false;
    loginError.textContent = "";
  } catch (error) {
    console.error("Erro ao carregar o perfil da filial:", error);
    try {
      const { error: signOutError } = await banco.auth.signOut();
      if (signOutError) console.error("Erro ao encerrar a sessão sem filial:", signOutError);
    } catch (signOutError) {
      console.error("Erro ao encerrar a sessão sem filial:", signOutError);
    }
    mostrarTelaLogin(error.message || "Não foi possível carregar o acesso da filial.");
  }
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

function inicializarAutocompleteEndereco() {
  if (!endereco || !window.google?.maps?.places) return;

  const autocomplete = new google.maps.places.Autocomplete(endereco, {
    componentRestrictions: { country: "br" },
    fields: ["formatted_address", "name"],
    types: ["address"]
  });

  autocomplete.addListener("place_changed", () => {
    const place = autocomplete.getPlace();
    endereco.value = place.formatted_address || place.name || endereco.value;
  });
}

function carregarGooglePlaces() {
  if (!endereco || !googleMapsApiKey) return;
  if (window.google?.maps?.places) {
    inicializarAutocompleteEndereco();
    return;
  }

  window.inicializarAutocompleteEndereco = inicializarAutocompleteEndereco;

  const script = document.createElement("script");
  script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(googleMapsApiKey)}&libraries=places&callback=inicializarAutocompleteEndereco`;
  script.async = true;
  script.defer = true;
  script.onerror = () => mostrarToast("Nao foi possivel carregar os enderecos do Google.", "erro");
  document.head.appendChild(script);
}

function formatarNomeCurto(nome) {
  const texto = String(nome || "").trim();
  if (!texto) return "-";

  const palavras = texto.split(/\s+/);
  return palavras.length > 2 ? palavras.slice(0, 2).join(" ") : texto;
}

function escaparHtml(valor) {
  return String(valor ?? "").replace(/[&<>"']/g, (caractere) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;"
  }[caractere]));
}

function formatarNomeArquivo(valor) {
  const nome = String(valor || "").trim().replace(/[\\/:*?"<>|]+/g, "-");
  return nome || "romaneio";
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
  const campos = {
    cliente,
    transportadora
  };
  const campo = campos[tipo];
  const termo = campo ? campo.value : "";
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
      if (campo) {
        campo.value = item;
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
  } else if (tipo === "transportadora") {
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
    [clientes, transportadoras, motoristas] = await Promise.all([
      carregarNomesTabela("clientes"),
      carregarNomesTabela("transportadoras"),
      carregarNomesTabela("motoristas")
    ]);
    renderCadastros();
    return;
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
    const { data, error } = await banco
      .from(TABELA_NOTAS)
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    notas = (data || []).map((nota) => ({
      ...nota,
      caixa: normalizarCaixas(nota.caixa),
      expedicao_confirmada: Boolean(nota.expedicao_confirmada)
    }));
    renderNotas();
    return;
  }

  notas = lerListaStorage(STORAGE_KEY)
    .map((nota) => ({ ...nota, expedicao_confirmada: Boolean(nota.expedicao_confirmada) }))
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  renderNotas();
}

function carregarSomExpedido() {
  if (bufferAudioExpedido) return Promise.resolve();
  if (preparacaoSomExpedidoPromise) return preparacaoSomExpedidoPromise;

  const AudioContextExpedicao = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextExpedicao) {
    return Promise.reject(new Error("Este navegador não oferece suporte à reprodução de áudio."));
  }

  contextoAudioExpedido = new AudioContextExpedicao();
  contextoAudioExpedido.addEventListener("statechange", atualizarBotaoSomExpedido);
  preparacaoSomExpedidoPromise = (async () => {
    const resposta = await fetch("./assets/expedido.wav");
    if (!resposta.ok) {
      throw new Error(`Não foi possível carregar o som de expedição (${resposta.status}).`);
    }

    bufferAudioExpedido = await contextoAudioExpedido.decodeAudioData(await resposta.arrayBuffer());
    atualizarBotaoSomExpedido();
  })().catch((error) => {
    preparacaoSomExpedidoPromise = null;
    throw error;
  });

  return preparacaoSomExpedidoPromise;
}

function prepararSomExpedido() {
  return carregarSomExpedido().then(() => (
    contextoAudioExpedido.state === "running"
      ? undefined
      : contextoAudioExpedido.resume()
  ));
}

function atualizarBotaoSomExpedido() {
  btnAtivarSom.textContent = somExpedidoAtivo ? "🔔" : "🔕";
  btnAtivarSom.setAttribute(
    "aria-label",
    somExpedidoAtivo
      ? "Clique para enviar um alerta. Clique duas vezes para desativar os avisos sonoros."
      : "Clique para enviar um alerta. Clique duas vezes para ativar os avisos sonoros."
  );
  btnAtivarSom.title = somExpedidoAtivo
    ? "Clique: enviar alerta. Duplo clique: desativar avisos sonoros."
    : "Clique: enviar alerta. Duplo clique: ativar avisos sonoros.";
  btnAtivarSom.setAttribute("aria-pressed", String(somExpedidoAtivo));
}

function tocarSomExpedido(forcar = false) {
  reproduzirSomExpedido(forcar);
}

function reproduzirSomExpedido(forcar = false) {
  if ((!somExpedidoAtivo && !forcar) || !bufferAudioExpedido || !contextoAudioExpedido) return false;

  if (contextoAudioExpedido.state === "suspended") {
    void contextoAudioExpedido.resume().catch((error) => {
      console.error("O navegador bloqueou a reprodução do áudio:", error);
    });
  }
  if (contextoAudioExpedido.state === "closed") return false;

  try {
    const fonte = contextoAudioExpedido.createBufferSource();
    fonte.buffer = bufferAudioExpedido;
    fonte.connect(contextoAudioExpedido.destination);
    fonte.start();
    return true;
  } catch (error) {
    console.error("O navegador não conseguiu iniciar o áudio:", error);
    return false;
  }
}

async function enviarBroadcastExpedicao(evento, payload) {
  if (!canalExpedicaoRealtime) {
    throw new Error("O canal de atualizações em tempo real não está conectado.");
  }

  const status = await canalExpedicaoRealtime.send({
    type: "broadcast",
    event: evento,
    payload
  });
  if (status !== "ok") {
    throw new Error(`O Realtime recusou o evento (${status}).`);
  }
}

async function alternarPreferenciaSomExpedido() {
  const somAtivo = !somExpedidoAtivo;
  try {
    const { error } = await banco
      .from("perfis")
      .update({ som_ativado: somAtivo })
      .eq("id", perfilAtual.id);
    if (error) throw error;

    perfilAtual.som_ativado = somAtivo;
    somExpedidoAtivo = somAtivo;
    atualizarBotaoSomExpedido();

    try {
      await enviarBroadcastExpedicao("preferencia-som", {
        tipo: "preferencia-som",
        usuarioId: perfilAtual.id,
        ativo: somAtivo
      });
    } catch (error) {
      console.error("A preferência foi salva, mas não sincronizou com os outros dispositivos:", error);
      mostrarToast("Preferência salva, mas não foi possível atualizar os outros dispositivos.", "erro");
      return;
    }

    if (somAtivo) {
      try {
        await prepararSomExpedido();
      } catch (error) {
        console.error("Preferência salva, mas o áudio não pôde ser preparado neste dispositivo:", error);
        mostrarToast("Som ativado; interaja com a página para permitir a reprodução.", "aviso");
        return;
      }
    }

    mostrarToast(
      somAtivo ? "Avisos sonoros ativados em seus dispositivos." : "Avisos sonoros desativados em seus dispositivos.",
      "sucesso"
    );
  } catch (error) {
    console.error("Não foi possível salvar a preferência de som:", error);
    mostrarToast("Não foi possível salvar a preferência de som.", "erro");
  }
}

async function dispararAlertaSonoro(tocouLocalmente, preparacaoAudio) {
  if (!tocouLocalmente) {
    try {
      await preparacaoAudio;
      tocouLocalmente = tocarSomExpedido(true);
    } catch (error) {
      console.error("O alerta não pôde tocar neste dispositivo:", error);
    }
  }

  try {
    await enviarBroadcastExpedicao("alerta-sonoro", { tipo: "alerta-sonoro" });
  } catch (error) {
    console.error("Não foi possível enviar o alerta sonoro:", error);
    mostrarToast("Não foi possível enviar o alerta. Verifique a conexão em tempo real.", "erro");
    return;
  }

  mostrarToast(
    !tocouLocalmente
      ? "Alerta enviado; o navegador não permitiu tocar o som neste dispositivo."
      : "Alerta sonoro enviado aos usuários conectados da filial.",
    !tocouLocalmente ? "aviso" : "sucesso"
  );
}

btnAtivarSom.addEventListener("click", () => {
  if (temporizadorCliqueSino !== null) return;
  const tocouLocalmente = tocarSomExpedido(true);
  const preparacaoAudio = carregarSomExpedido();
  preparacaoAudio.catch((error) => {
    console.error("Não foi possível preparar o som do alerta:", error);
  });
  temporizadorCliqueSino = window.setTimeout(() => {
    temporizadorCliqueSino = null;
    void dispararAlertaSonoro(tocouLocalmente, preparacaoAudio);
  }, 500);
});

btnAtivarSom.addEventListener("dblclick", (evento) => {
  evento.preventDefault();
  if (temporizadorCliqueSino !== null) {
    window.clearTimeout(temporizadorCliqueSino);
    temporizadorCliqueSino = null;
  }
  void alternarPreferenciaSomExpedido();
});

document.addEventListener("pointerdown", () => {
  if (!somExpedidoAtivo || contextoAudioExpedido?.state === "running") return;
  void prepararSomExpedido().catch((error) => {
    console.error("Não foi possível preparar o áudio neste dispositivo:", error);
  });
});

function obterPayloadRealtime(payload) {
  if (payload?.payload && typeof payload.payload === "object") {
    return payload.payload;
  }
  return payload;
}

async function aplicarAlteracaoRealtime(alteracao) {
  if (alteracao?.tipo === "alerta-sonoro") {
    tocarSomExpedido();
    return;
  }

  if (
    alteracao?.tipo === "preferencia-som" &&
    alteracao.usuarioId === perfilAtual?.id
  ) {
    somExpedidoAtivo = Boolean(alteracao.ativo);
    perfilAtual.som_ativado = somExpedidoAtivo;
    atualizarBotaoSomExpedido();
    return;
  }

  const { table, operation } = alteracao;

  if (table === TABELA_NOTAS) {
    const notaRecebida = operation === "DELETE" ? alteracao.old_record : alteracao.record;
    if (!notaRecebida?.id) {
      console.error("Evento Realtime de nota sem registro identificável:", alteracao);
      return;
    }

    const notaId = String(notaRecebida.id);
    const indiceNota = notas.findIndex((nota) => String(nota.id) === notaId);
    const notaAnterior = indiceNota >= 0 ? notas[indiceNota] : alteracao.old_record;
    const expiracaoLocal = atualizacoesExpedicaoLocais.get(notaId);
    const transicaoParaExpedido =
      operation === "UPDATE" &&
      notaAnterior?.expedido === false &&
      notaRecebida.expedido === true;
    const alteracaoLocal = transicaoParaExpedido && expiracaoLocal > Date.now();

    if (
      operation === "DELETE" ||
      (expiracaoLocal && expiracaoLocal <= Date.now()) ||
      transicaoParaExpedido
    ) {
      atualizacoesExpedicaoLocais.delete(notaId);
    }

    if (operation === "DELETE") {
      if (indiceNota >= 0) notas.splice(indiceNota, 1);
      renderNotas();
      return;
    }

    const notaAtualizada = {
      ...(indiceNota >= 0 ? notas[indiceNota] : {}),
      ...notaRecebida,
      caixa: normalizarCaixas(notaRecebida.caixa)
    };

    if (indiceNota >= 0) {
      notas.splice(indiceNota, 1, notaAtualizada);
    } else {
      notas.push(notaAtualizada);
    }

    notas.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    renderNotas();

    if (transicaoParaExpedido && !alteracaoLocal) {
      tocarSomExpedido();
    }
    return;
  }

  if (["clientes", "transportadoras", "motoristas"].includes(table)) {
    await carregarCadastros();
    return;
  }

  console.warn("Evento Realtime recebido para tabela não reconhecida:", table);
}

async function sincronizarDadosRealtime() {
  sincronizacaoRealtimeSolicitada = true;
  if (sincronizacaoRealtimeEmAndamento) return;

  sincronizacaoRealtimeEmAndamento = true;
  try {
    while (sincronizacaoRealtimeSolicitada) {
      sincronizacaoRealtimeSolicitada = false;
      await Promise.all([carregarCadastros(), carregarNotas()]);

      while (eventosRealtimePendentes.length) {
        const eventos = eventosRealtimePendentes.splice(0);
        for (const evento of eventos) {
          await aplicarAlteracaoRealtime(evento);
        }
      }
    }
  } catch (error) {
    eventosRealtimePendentes.length = 0;
    tratarErroBanco(error);
  } finally {
    sincronizacaoRealtimeEmAndamento = false;
  }
}

function iniciarCanalExpedicaoRealtime() {
  if (canalExpedicaoRealtime) {
    void banco.removeChannel(canalExpedicaoRealtime);
  }

  canalExpedicaoRealtime = banco
    .channel(`filial:${perfilAtual.filial_id}`, { config: { private: true } })
    .on("broadcast", { event: "*" }, (payload) => {
      const alteracao = obterPayloadRealtime(payload);
      if (sincronizacaoRealtimeEmAndamento) {
        eventosRealtimePendentes.push(alteracao);
        sincronizacaoRealtimeSolicitada = true;
        return;
      }
      void aplicarAlteracaoRealtime(alteracao).catch(tratarErroBanco);
    })
    .subscribe((status, error) => {
      if (status === "SUBSCRIBED") {
        console.info(`Atualizações em tempo real conectadas para a filial ${perfilAtual.filial_id}.`);
        void sincronizarDadosRealtime();
      } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        console.error("Erro no canal de expedição em tempo real:", error);
        mostrarToast(
          "Não foi possível conectar às atualizações em tempo real. Verifique as políticas de Broadcast do Supabase.",
          "erro"
        );
      }
    });
}

function obterDadosFormulario() {
  return {
    cliente: cliente.value.trim(),
    transportadora: transportadora.value.trim(),
    nf: nf.value.trim(),
    pedido: pedido.value.trim(),
    volumes: Number(volumes.value),
    valor: Number(valor.value),
    endereco: endereco.value.trim(),
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
  endereco.value = "";
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
    const atendeBusca = !termo || [nota.cliente, nota.transportadora, nota.endereco, nota.nf, nota.pedido].some((campo) => {
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

function renderExpedicaoGrid() {
  if (!gridExpedicao || !contadorExpedicaoGrid) return;

  const notasExpedidas = notas.filter((nota) => nota.expedido);
  const termo = buscaExpedicao ? buscaExpedicao.value.trim().toLowerCase() : "";
  const filtro = filtroExpedicao ? filtroExpedicao.value : "todos";
  const notasFiltradas = notasExpedidas.filter((nota) => {
    const expedicaoConfirmada = nota.expedicao_confirmada;
    const atendeBusca = !termo || [nota.cliente, nota.transportadora, nota.endereco, nota.nf, nota.pedido].some((campo) => {
      return String(campo).toLowerCase().includes(termo);
    });
    const atendeFiltro =
      filtro === "todos" ||
      (filtro === "pendente" && !expedicaoConfirmada) ||
      (filtro === "expedido" && expedicaoConfirmada);

    return atendeBusca && atendeFiltro;
  });

  contadorExpedicaoGrid.textContent = `${notasFiltradas.length} registro${notasFiltradas.length === 1 ? "" : "s"}`;

  if (!notasFiltradas.length) {
    gridExpedicao.innerHTML = `
      <tr>
        <td colspan="11" class="empty-state">
          Nenhum registro expedido encontrado.
        </td>
      </tr>
    `;
    return;
  }

  gridExpedicao.innerHTML = notasFiltradas.map((nota) => {
    const expedicaoConfirmada = nota.expedicao_confirmada;
    const statusTexto = expedicaoConfirmada ? "Expedido" : "A expedir";
    const clienteCompleto = escaparHtml(nota.cliente || "-");
    const clienteCurto = escaparHtml(formatarNomeCurto(nota.cliente));
    const transportadoraCompleta = escaparHtml(nota.transportadora || "-");
    const transportadoraCurta = escaparHtml(formatarNomeCurto(nota.transportadora));
    const enderecoCompleto = escaparHtml(nota.endereco || "-");

    return `
      <tr class="${expedicaoConfirmada ? "is-expedido" : ""}">
        <td data-label="Cliente">
          <div class="cliente-cell">
            <strong title="${clienteCompleto}">${clienteCurto}</strong>
            <span>${formatarData(nota.created_at)}</span>
          </div>
        </td>
        <td data-label="Transportadora" title="${transportadoraCompleta}">${transportadoraCurta}</td>
        <td data-label="Endereço" title="${enderecoCompleto}">
          <span class="endereco-cell endereco-cell-curto">${escaparHtml(formatarNomeCurto(nota.endereco))}</span>
        </td>
        <td data-label="NF">${nota.nf}</td>
        <td data-label="Pedido">${nota.pedido}</td>
        <td data-label="Volumes">${nota.volumes}</td>
        <td data-label="Caixa">${formatarCaixas(nota.caixa) || "-"}</td>
        <td data-label="Valor">${formatarMoeda(nota.valor)}</td>
        <td data-label="Status">
          <span class="status-badge ${expedicaoConfirmada ? "status-expedido" : "status-pendente"}">${statusTexto}</span>
        </td>
        <td data-label="Dias">
          <span class="tempo-pill">${calcularDiasNaExpedicao(nota.created_at)}</span>
        </td>
        <td data-label="Expedir">
          <button class="expedicao-btn" onclick="confirmarExpedicao(${nota.id})" type="button">
              ${expedicaoConfirmada ? "Reabrir" : "Liberar"}
          </button>
        </td>
      </tr>
    `;
  }).join("");
}

function renderNotas() {
  const notasFiltradas = filtrarNotas();
  listaNotas.innerHTML = "";
  contadorFiltrado.textContent = `${notasFiltradas.length} registro${notasFiltradas.length === 1 ? "" : "s"}`;

  if (!notasFiltradas.length) {
    listaNotas.innerHTML = `
      <tr>
        <td colspan="11" class="empty-state">
          Nenhum registro encontrado com os filtros atuais.
        </td>
      </tr>
    `;
    atualizarResumo();
    renderExpedicaoGrid();
    return;
  }

  notasFiltradas.forEach((nota) => {
    const tr = document.createElement("tr");
    const status = obterStatus(nota);
    const statusTexto = status === "expedido" ? "Expedido" : "Pendente";
    const clienteCompleto = escaparHtml(nota.cliente || "-");
    const clienteCurto = escaparHtml(formatarNomeCurto(nota.cliente));
    const transportadoraCompleta = escaparHtml(nota.transportadora || "-");
    const transportadoraCurta = escaparHtml(formatarNomeCurto(nota.transportadora));
    const enderecoCompleto = escaparHtml(nota.endereco || "-");

    tr.innerHTML = `
      <td data-label="Cliente">
        <div class="cliente-cell">
          <strong title="${clienteCompleto}">${clienteCurto}</strong>
          <span>${formatarData(nota.created_at)}</span>
        </div>
      </td>
      <td data-label="Transportadora" title="${transportadoraCompleta}">${transportadoraCurta}</td>
      <td data-label="Endereço" title="${enderecoCompleto}">
        <span class="endereco-cell endereco-cell-curto">${escaparHtml(formatarNomeCurto(nota.endereco))}</span>
      </td>
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
          <button class="table-action table-action-danger" onclick="excluir(${nota.id})" type="button">Excluir</button>
          <button class="table-action table-action-highlight" onclick="alternarExpedido(${nota.id}, ${nota.expedido})" type="button">
            ${nota.expedido ? "Expedido" : "Expedir"}
          </button>
          <button class="table-action table-action-secondary" onclick="gerarRomaneio(${nota.id})" type="button">Romaneio</button>
        </div>
      </td>
    `;

    if (status === "expedido") {
      tr.classList.add("is-expedido");
    }

    listaNotas.appendChild(tr);
  });

  atualizarResumo();
  renderExpedicaoGrid();
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
      const dadosBanco = { ...dados };
      if (!dadosBanco.endereco) {
        delete dadosBanco.endereco;
      }

      if (editId) {
        const { error } = await banco
          .from(TABELA_NOTAS)
          .update(dadosBanco)
          .eq("id", editId);

        if (error) throw error;
        mostrarToast("Registro atualizado com sucesso.", "sucesso");
      } else {
        const { error } = await banco
          .from(TABELA_NOTAS)
          .insert({
            ...dadosBanco,
            expedido: false,
            expedicao_confirmada: false
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
      expedicao_confirmada: false,
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
  endereco.value = nota.endereco || "";
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
      const { error } = await banco.from(TABELA_NOTAS).delete().eq("id", id);
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
    const notaId = String(id);
    if (!estadoAtual) {
      atualizacoesExpedicaoLocais.set(notaId, Date.now() + 30000);
      setTimeout(() => {
        if (atualizacoesExpedicaoLocais.get(notaId) <= Date.now()) {
          atualizacoesExpedicaoLocais.delete(notaId);
        }
      }, 30000);
    }

    try {
      const { error } = await banco
        .from(TABELA_NOTAS)
        .update({
          expedido: !estadoAtual,
          ...(estadoAtual ? { expedicao_confirmada: false } : {})
        })
        .eq("id", id);

      if (error) throw error;
      if (!estadoAtual) {
        tocarSomExpedido();
      }
      mostrarToast(!estadoAtual ? "Registro marcado como expedido." : "Registro reaberto.", "sucesso");
      await carregarNotas();
    } catch (error) {
      atualizacoesExpedicaoLocais.delete(notaId);
      tratarErroBanco(error);
    }
    return;
  }

  notas = notas.map((nota) => (nota.id === id ? {
    ...nota,
    expedido: !estadoAtual,
    ...(estadoAtual ? { expedicao_confirmada: false } : {})
  } : nota));
  salvarNotas();
  mostrarToast(!estadoAtual ? "Registro marcado como expedido." : "Registro reaberto.", "sucesso");
  carregarNotas();
};

window.confirmarExpedicao = async (id) => {
  const nota = notas.find((item) => String(item.id) === String(id));
  if (!nota) return;

  const expedicaoConfirmada = !nota.expedicao_confirmada;
  if (bancoSupabaseAtivo) {
    try {
      const { error } = await banco
        .from(TABELA_NOTAS)
        .update({ expedicao_confirmada: expedicaoConfirmada })
        .eq("id", id);
      if (error) throw error;
      await carregarNotas();
      mostrarToast(
        expedicaoConfirmada ? "Card marcado como expedido." : "Card desmarcado como expedido.",
        "sucesso"
      );
    } catch (error) {
      tratarErroBanco(error);
    }
    return;
  }

  notas = notas.map((item) => (
    String(item.id) === String(id) ? { ...item, expedicao_confirmada: expedicaoConfirmada } : item
  ));
  salvarNotas();
  renderNotas();
  mostrarToast(
    expedicaoConfirmada ? "Card marcado como expedido." : "Card desmarcado como expedido.",
    "sucesso"
  );
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

window.gerarRomaneio = async (id) => {
  const nota = notas.find((item) => String(item.id) === String(id));
  if (!nota) {
    mostrarToast("Registro nao encontrado para gerar romaneio.", "erro");
    return;
  }

  if (!window.JSZip) {
    mostrarToast("Biblioteca para gerar DOCX nao carregada.", "erro");
    return;
  }

  try {
    const resposta = await fetch(MODELO_ROMANEIO_PATH);
    if (!resposta.ok) throw new Error("Modelo nao encontrado.");

    const zip = await JSZip.loadAsync(await resposta.arrayBuffer());
    const documento = zip.file("word/document.xml");
    if (!documento) throw new Error("Documento invalido.");

    const parser = new DOMParser();
    const xmlDocumento = parser.parseFromString(await documento.async("string"), "application/xml");
    if (xmlDocumento.getElementsByTagName("parsererror").length) {
      throw new Error("XML do modelo invalido.");
    }

    const namespaceWord = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
    const corpo = xmlDocumento.getElementsByTagNameNS(namespaceWord, "body")[0];
    if (!corpo) throw new Error("Corpo do documento nao encontrado.");

    const propriedadesSecao = Array.from(corpo.children)
      .find((elemento) => elemento.namespaceURI === namespaceWord && elemento.localName === "sectPr");
    const elementosModelo = Array.from(corpo.children)
      .filter((elemento) => elemento !== propriedadesSecao)
      .map((elemento) => elemento.cloneNode(true));

    if (!elementosModelo.length) throw new Error("Modelo sem conteudo.");

    const substituicoes = [
      nota.nf,
      nota.pedido,
      nota.cliente,
      nota.endereco || "-",
      nota.transportadora || "-"
    ];
    const totalVolumes = Math.max(1, Number(nota.volumes) || 1);
    const formatarNumeroVolume = (numero) =>
      `${String(numero).padStart(2, "0")}/${String(totalVolumes).padStart(2, "0")}`;
    const ordemPropriedades = {
      pPr: ["pageBreakBefore", "shd", "spacing", "ind", "jc", "rPr"],
      rPr: ["rFonts", "b", "bCs", "color", "sz", "szCs", "lang"]
    };
    const obterPropriedade = (pai, nome) => {
      let propriedade = Array.from(pai.children)
        .find((filho) => filho.namespaceURI === namespaceWord && filho.localName === nome);
      if (!propriedade) {
        propriedade = xmlDocumento.createElementNS(namespaceWord, `w:${nome}`);
        const ordem = ordemPropriedades[pai.localName];
        const indiceNovaPropriedade = ordem ? ordem.indexOf(nome) : -1;
        const propriedadeSeguinte = ordem && indiceNovaPropriedade >= 0
          ? Array.from(pai.children).find((filho) => {
            const indiceExistente = ordem.indexOf(filho.localName);
            return indiceExistente >= 0 && indiceExistente > indiceNovaPropriedade;
          })
          : ["pPr", "rPr"].includes(nome) ? pai.firstChild : null;
        pai.insertBefore(propriedade, propriedadeSeguinte || null);
      }
      return propriedade;
    };
    const definirAtributoWord = (elemento, nome, valor) => {
      elemento.setAttributeNS(namespaceWord, `w:${nome}`, valor);
    };
    const estilizarParagrafo = (paragrafo, estilo) => {
      const propriedades = obterPropriedade(paragrafo, "pPr");
      const sombreado = obterPropriedade(propriedades, "shd");
      definirAtributoWord(sombreado, "fill", estilo.fundo);

      const alinhamento = obterPropriedade(propriedades, "jc");
      definirAtributoWord(alinhamento, "val", estilo.alinhamento || "left");

      const espacamento = obterPropriedade(propriedades, "spacing");
      definirAtributoWord(espacamento, "before", estilo.antes || "100");
      definirAtributoWord(espacamento, "after", estilo.depois || "100");

      if (estilo.recuo) {
        const recuo = obterPropriedade(propriedades, "ind");
        definirAtributoWord(recuo, "left", estilo.recuo);
        definirAtributoWord(recuo, "right", estilo.recuo);
        recuo.removeAttributeNS(namespaceWord, "firstLine");
        recuo.removeAttributeNS(namespaceWord, "firstLineChars");
      }

      Array.from(paragrafo.getElementsByTagNameNS(namespaceWord, "r")).forEach((trecho) => {
        const propriedadesTrecho = obterPropriedade(trecho, "rPr");
        const fontes = obterPropriedade(propriedadesTrecho, "rFonts");
        ["ascii", "hAnsi", "cs", "eastAsia"].forEach((atributo) => {
          definirAtributoWord(fontes, atributo, "Arial");
        });

        const cor = obterPropriedade(propriedadesTrecho, "color");
        definirAtributoWord(cor, "val", estilo.cor);

        const tamanho = obterPropriedade(propriedadesTrecho, "sz");
        definirAtributoWord(tamanho, "val", estilo.tamanho);

        const negrito = obterPropriedade(propriedadesTrecho, "b");
        if (estilo.negrito) {
          negrito.removeAttributeNS(namespaceWord, "val");
        } else {
          definirAtributoWord(negrito, "val", "0");
        }

        const negritoComplexo = obterPropriedade(propriedadesTrecho, "bCs");
        if (estilo.negrito) {
          negritoComplexo.removeAttributeNS(namespaceWord, "val");
        } else {
          definirAtributoWord(negritoComplexo, "val", "0");
        }
      });
    };
    const estilizarPagina = (elementosPagina) => {
      let aguardaValor = false;

      elementosPagina.forEach((elemento) => {
        if (elemento.namespaceURI !== namespaceWord || elemento.localName !== "p") return;

        const trechos = Array.from(elemento.getElementsByTagNameNS(namespaceWord, "t"));
        let texto = trechos.map((trecho) => trecho.textContent).join("");
        if (!texto.trim()) return;

        if (texto.startsWith("REMENTENTE:")) {
          trechos.forEach((trecho) => {
            trecho.textContent = trecho.textContent.replace("REMENTENTE:", "REMETENTE:");
          });
          texto = texto.replace("REMENTENTE:", "REMETENTE:");
        }

        if (texto.startsWith("NOTA:")) {
          estilizarParagrafo(elemento, {
            fundo: "29413B",
            cor: "FFFFFF",
            tamanho: "28",
            negrito: true,
            alinhamento: "left",
            recuo: "140",
            antes: "160",
            depois: "160"
          });
          aguardaValor = false;
          return;
        }

        if (texto.startsWith("N° VOLUME:")) {
          estilizarParagrafo(elemento, {
            fundo: "D9FF63",
            cor: "293C36",
            tamanho: "40",
            negrito: true,
            alinhamento: "center",
            antes: "180",
            depois: "180"
          });
          aguardaValor = false;
          return;
        }

        if (/^(REMETENTE|DESTINATÁRIO|ENDEREÇO|TRANSPORTADORA):/.test(texto)) {
          estilizarParagrafo(elemento, {
            fundo: "E8F0EC",
            cor: "426D67",
            tamanho: "22",
            negrito: true,
            recuo: "140",
            antes: "100",
            depois: "40"
          });
          aguardaValor = true;
          return;
        }

        if (aguardaValor) {
          estilizarParagrafo(elemento, {
            fundo: "F7F8F4",
            cor: "29231C",
            tamanho: "24",
            negrito: false,
            recuo: "140",
            antes: "40",
            depois: "100"
          });
          aguardaValor = false;
        }
      });
    };

    while (corpo.firstChild) corpo.removeChild(corpo.firstChild);
    for (let indiceVolume = 1; indiceVolume <= totalVolumes; indiceVolume += 1) {
      const elementosPagina = elementosModelo.map((elemento) => elemento.cloneNode(true));
      const textos = elementosPagina.flatMap((elemento) =>
        Array.from(elemento.getElementsByTagNameNS(namespaceWord, "t"))
      );
      let indiceSubstituicao = 0;

      textos.forEach((texto) => {
        texto.textContent = texto.textContent.replace(/\*{3,}/g, () => {
          if (indiceSubstituicao >= substituicoes.length) {
            throw new Error("Modelo possui marcadores inesperados.");
          }
          return String(substituicoes[indiceSubstituicao++]);
        });

        if (texto.textContent.includes("01/01")) {
          texto.textContent = texto.textContent.replace("01/01", formatarNumeroVolume(indiceVolume));
        }
      });

      if (indiceSubstituicao !== substituicoes.length) {
        throw new Error("Modelo nao possui todos os marcadores esperados.");
      }

      estilizarPagina(elementosPagina);
      if (indiceVolume > 1) {
        const primeiroParagrafo = elementosPagina.find((elemento) =>
          elemento.namespaceURI === namespaceWord && elemento.localName === "p"
        );
        if (!primeiroParagrafo) throw new Error("Inicio da pagina do modelo nao encontrado.");
        const propriedades = obterPropriedade(primeiroParagrafo, "pPr");
        obterPropriedade(propriedades, "pageBreakBefore");
      }

      elementosPagina.forEach((elemento) => corpo.appendChild(elemento));
    }
    if (propriedadesSecao) corpo.appendChild(propriedadesSecao.cloneNode(true));

    zip.file("word/document.xml", new XMLSerializer().serializeToString(xmlDocumento));

    const blob = await zip.generateAsync({
      type: "blob",
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    });

    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = `${formatarNomeArquivo(`romaneio-${nota.nf || nota.pedido}`)}.docx`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    mostrarToast(
      totalVolumes === 1
        ? "Romaneio gerado com sucesso."
        : `${totalVolumes} romaneios gerados em um arquivo Word.`,
      "sucesso"
    );
  } catch (error) {
    console.error("Erro ao gerar romaneio:", error);
    mostrarToast("Nao foi possivel gerar o romaneio.", "erro");
  }
};

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
buscaExpedicao.addEventListener("input", renderExpedicaoGrid);
filtroExpedicao.addEventListener("change", renderExpedicaoGrid);

let arrasteTabela = null;
let suprimirCliqueTabela = false;

tabelaNotasWrap.addEventListener("mousedown", (evento) => {
  if (evento.button !== 0 || evento.target.closest("button, a, input, select, textarea, [contenteditable='true']")) return;

  arrasteTabela = {
    inicioX: evento.clientX,
    scrollInicial: tabelaNotasWrap.scrollLeft,
    iniciou: false
  };
});

document.addEventListener("mousemove", (evento) => {
  if (!arrasteTabela) return;

  const deslocamento = evento.clientX - arrasteTabela.inicioX;
  if (!arrasteTabela.iniciou && Math.abs(deslocamento) < 5) return;

  arrasteTabela.iniciou = true;
  tabelaNotasWrap.classList.add("is-dragging");
  tabelaNotasWrap.scrollLeft = arrasteTabela.scrollInicial - deslocamento;
  evento.preventDefault();
});

document.addEventListener("mouseup", () => {
  if (!arrasteTabela) return;

  if (arrasteTabela.iniciou) {
    suprimirCliqueTabela = true;
    setTimeout(() => {
      suprimirCliqueTabela = false;
    }, 0);
  }

  arrasteTabela = null;
  tabelaNotasWrap.classList.remove("is-dragging");
});

tabelaNotasWrap.addEventListener("click", (evento) => {
  if (!suprimirCliqueTabela) return;

  evento.preventDefault();
  evento.stopPropagation();
}, true);

btnSair.addEventListener("click", async () => {
  try {
    const { error } = await banco.auth.signOut();
    if (error) throw error;
  } catch (error) {
    console.error("Erro ao encerrar a sessão:", error);
    mostrarToast("Não foi possível encerrar a sessão.", "erro");
  }
});
loginForm.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  if (!bancoSupabaseAtivo) return;

  btnEntrar.disabled = true;
  btnEntrar.textContent = "Entrando...";
  loginError.textContent = "";

  try {
    const { data, error } = await banco.auth.signInWithPassword({
      email: loginEmail.value.trim(),
      password: loginPassword.value
    });

    if (error) {
      loginError.textContent = error.message.toLowerCase().includes("invalid login")
        ? "E-mail ou senha inválidos."
        : "Não foi possível entrar. Verifique sua conexão e tente novamente.";
      return;
    }

    loginPassword.value = "";
    await entrarNaAplicacao(data.session);
  } catch (error) {
    console.error("Erro durante a autenticação:", error);
    loginError.textContent = "Não foi possível conectar ao serviço de autenticação.";
  } finally {
    btnEntrar.disabled = false;
    btnEntrar.textContent = "Entrar";
  }
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

async function iniciarSistema(session) {
  carregarEstadoSidebar();
  carregarEstadoFormulario();
  carregarEstadoListas();
  carregarView();
  void carregarSomExpedido().catch((error) => {
    console.error("Não foi possível carregar o som de expedição:", error);
  });
  await banco.realtime.setAuth(session.access_token);
  await carregarCadastros();
  await carregarNotas();
  iniciarCanalExpedicaoRealtime();
  carregarGooglePlaces();
}

async function iniciarAutenticacao() {
  if (!bancoSupabaseAtivo) {
    authLoading.hidden = true;
    loginScreen.hidden = false;
    loginError.textContent = "Configure a conexão do Supabase para habilitar o acesso.";
    loginHelp.textContent = "O acesso está bloqueado até que a autenticação e as políticas de filial estejam configuradas.";
    btnEntrar.disabled = true;
    return;
  }

  banco.auth.onAuthStateChange((evento) => {
    if (evento === "SIGNED_OUT") {
      if (canalExpedicaoRealtime) {
        void banco.removeChannel(canalExpedicaoRealtime);
        canalExpedicaoRealtime = null;
      }
      atualizacoesExpedicaoLocais.clear();
      somExpedidoAtivo = false;
      atualizarBotaoSomExpedido();
      notas = [];
      clientes = [];
      transportadoras = [];
      motoristas = [];
      mostrarTelaLogin();
    }
  });

  try {
    const { data, error } = await banco.auth.getSession();
    if (error) throw error;
    if (data.session) {
      await entrarNaAplicacao(data.session);
    } else {
      mostrarTelaLogin();
    }
  } catch (error) {
    console.error("Erro ao restaurar a sessão:", error);
    mostrarTelaLogin("Não foi possível verificar sua sessão. Atualize a página e tente novamente.");
  }
}

iniciarAutenticacao();

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
