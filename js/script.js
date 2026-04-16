const cliente = document.getElementById("cliente");
const nf = document.getElementById("nf");
const pedido = document.getElementById("pedido");
const volumes = document.getElementById("volumes");
const valor = document.getElementById("valor");
const caixa = document.getElementById("caixa");

const btnAdicionar = document.getElementById("btnAdicionar");
const btnLimpar = document.getElementById("btnLimpar");
const btnPDF = document.getElementById("btnPDF");

const listaNotas = document.getElementById("listaNotas");
const toast = document.getElementById("toast");

const STORAGE_KEY = "expedicao.notas";

let notas = [];
let editId = null;

function gerarId() {
  return Date.now() + Math.floor(Math.random() * 1000);
}

function calcularDiasNaExpedicao(dataCriacao) {
  const hoje = new Date();
  const dataNota = new Date(dataCriacao);

  const hojeZerado = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  const dataNotaZerada = new Date(dataNota.getFullYear(), dataNota.getMonth(), dataNota.getDate());
  const diferencaMs = hojeZerado - dataNotaZerada;
  const dias = Math.max(0, Math.floor(diferencaMs / 86400000));

  if (dias === 0) return "Hoje na expedição";
  if (dias === 1) return "1 dia na expedição";
  return `${dias} dias na expedição`;
}

function formatarMoeda(valorMonetario) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(valorMonetario);
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

function render() {
  listaNotas.innerHTML = "";

  if (!notas.length) {
    listaNotas.innerHTML = `
      <div class="estado-vazio">
        Nenhuma nota cadastrada ainda. Use o formulário acima para montar o novo fluxo do frontend.
      </div>
    `;
    return;
  }

  notas.forEach((nota) => {
    const card = document.createElement("div");
    card.className = "nota-card";

    if (nota.expedido) {
      card.classList.add("expedido");
    }

    const dataFormatada = new Date(nota.created_at).toLocaleDateString("pt-BR");
    const diasNaExpedicao = calcularDiasNaExpedicao(nota.created_at);

    card.innerHTML = `
      <strong>${nota.cliente}</strong>
      <div class="data-nota">${dataFormatada}</div>
      <div><strong>NF:</strong> ${nota.nf}</div>
      <div><strong>Pedido:</strong> ${nota.pedido}</div>
      <div><strong>Volumes:</strong> ${nota.volumes}</div>
      <div><strong>Caixa:</strong> ${nota.caixa}</div>
      <div class="valor">${formatarMoeda(nota.valor)}</div>
      <div class="tempo-expedicao">${diasNaExpedicao}</div>

      <div class="nota-acoes">
        ${
          !nota.expedido
            ? `
              <button onclick="editar(${nota.id})" aria-label="Editar nota">Editar</button>
              <button onclick="excluir(${nota.id})" aria-label="Excluir nota">Excluir</button>
            `
            : ""
        }
        <button class="btn-expedir" onclick="alternarExpedido(${nota.id}, ${nota.expedido})">
          ${nota.expedido ? "Expedido" : "Expedir"}
        </button>
      </div>
    `;

    listaNotas.appendChild(card);
  });
}

function carregarNotas() {
  notas = carregarNotasSalvas().sort((a, b) => {
    return new Date(b.created_at) - new Date(a.created_at);
  });

  render();
}

btnLimpar.onclick = () => {
  limparFormulario();
};

btnAdicionar.onclick = () => {
  const dados = obterDadosFormulario();

  if (!dados.cliente || !dados.nf || !dados.pedido || !dados.volumes || !dados.valor || !dados.caixa) {
    mostrarToast("Preencha todos os campos", "aviso");
    return;
  }

  const duplicado = notas.some((nota) => {
    return (nota.nf === dados.nf || nota.pedido === dados.pedido) && nota.id !== editId;
  });

  if (duplicado) {
    mostrarToast("Nota Fiscal ou Pedido já existente", "erro");
    return;
  }

  if (editId) {
    notas = notas.map((nota) => {
      return nota.id === editId ? { ...nota, ...dados } : nota;
    });

    mostrarToast("Nota atualizada", "sucesso");
  } else {
    notas.unshift({
      id: gerarId(),
      ...dados,
      expedido: false,
      created_at: new Date().toISOString()
    });

    mostrarToast("Nota salva com sucesso", "sucesso");
  }

  salvarNotas();
  limparFormulario();
  carregarNotas();
};

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
};

window.excluir = (id) => {
  const confirmar = window.confirm("Deseja realmente excluir esta nota?");
  if (!confirmar) return;

  notas = notas.filter((nota) => nota.id !== id);
  salvarNotas();
  mostrarToast("Nota excluída", "aviso");
  carregarNotas();
};

window.alternarExpedido = (id, estadoAtual) => {
  notas = notas.map((nota) => {
    return nota.id === id ? { ...nota, expedido: !estadoAtual } : nota;
  });

  salvarNotas();
  mostrarToast(!estadoAtual ? "Nota expedida" : "Expedição desfeita", "sucesso");
  carregarNotas();
};

btnPDF.onclick = () => {
  if (!notas.length) {
    mostrarToast("Nenhuma nota para gerar PDF", "aviso");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.text("Relatorio de Expedicao", 14, 16);
  doc.text(`Data de emissao: ${new Date().toLocaleDateString("pt-BR")}`, 14, 22);

  doc.autoTable({
    startY: 30,
    head: [["Cliente", "Data", "NF", "Pedido", "Volumes", "Caixa", "Valor"]],
    body: notas.map((nota) => [
      nota.cliente,
      new Date(nota.created_at).toLocaleDateString("pt-BR"),
      nota.nf,
      nota.pedido,
      nota.volumes,
      nota.caixa,
      formatarMoeda(nota.valor)
    ])
  });

  doc.save("relatorio-expedicao.pdf");
};

carregarNotas();
