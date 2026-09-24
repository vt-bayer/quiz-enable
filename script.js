(function () {
  "use strict";

  var STORAGE_KEY = "quizEnableRanking";
  var LETRAS = ["A", "B", "C", "D"];
  var db = typeof obterClienteSupabase === "function" ? obterClienteSupabase() : null;
  var PREMIOS = [
    "Copo ENABLE",
    "Ecobag",
    "Caderno",
    "Caneta",
    "Botton",
    "Vale-brinde",
    "Tente novamente"
  ];
  var CORES_ROLETA = [
    "#E4005A",
    "#42B8E8",
    "#73D700",
    "#003B5C",
    "#E4005A",
    "#42B8E8",
    "#73D700"
  ];

  var BANCO_PERGUNTAS = [
    {
      id: 1,
      nivel: "Fácil",
      pontos: 10,
      enunciado: "O que significa inclusão no ambiente de trabalho?",
      alternativas: [
        { texto: "Criar condições para que todas as pessoas participem, contribuam e tenham oportunidades.", correta: true },
        { texto: "Tratar todas as pessoas do mesmo modo, sem considerar necessidades diferentes.", correta: false },
        { texto: "Contratar pessoas com deficiência apenas para cumprir uma exigência.", correta: false },
        { texto: "Oferecer ajuda sem perguntar se ela é desejada.", correta: false }
      ],
      explicacao: "Inclusão no trabalho é criar condições para que todas as pessoas participem, contribuam e tenham oportunidades."
    },
    {
      id: 2,
      nivel: "Fácil",
      pontos: 10,
      enunciado: "Qual atitude ajuda uma pessoa com deficiência durante uma conversa?",
      alternativas: [
        { texto: "Falar apenas com quem a acompanha.", correta: false },
        { texto: "Falar diretamente com a pessoa, com respeito e atenção ao que ela comunica.", correta: true },
        { texto: "Elevar o tom de voz automaticamente.", correta: false },
        { texto: "Evitar fazer perguntas para não errar.", correta: false }
      ],
      explicacao: "A atitude adequada é falar diretamente com a pessoa, com respeito e atenção ao que ela comunica."
    },
    {
      id: 3,
      nivel: "Fácil",
      pontos: 10,
      enunciado: "A acessibilidade beneficia apenas pessoas com deficiência?",
      alternativas: [
        { texto: "Sim, somente pessoas com deficiência visual.", correta: false },
        { texto: "Sim, mas apenas em prédios públicos.", correta: false },
        { texto: "Não; beneficia pessoas com deficiência e também diferentes situações de uso.", correta: true },
        { texto: "Não, porque acessibilidade é apenas uma escolha estética.", correta: false }
      ],
      explicacao: "A acessibilidade não beneficia apenas pessoas com deficiência; também ajuda em diferentes situações de uso."
    },
    {
      id: 4,
      nivel: "Fácil",
      pontos: 10,
      enunciado: "O que é uma barreira atitudinal?",
      alternativas: [
        { texto: "Um degrau na entrada de um edifício.", correta: false },
        { texto: "Uma falha temporária de conexão.", correta: false },
        { texto: "Uma sinalização ausente.", correta: false },
        { texto: "Um preconceito, estereótipo ou comportamento que limita a participação.", correta: true }
      ],
      explicacao: "Barreira atitudinal é um preconceito, estereótipo ou comportamento que limita a participação."
    },
    {
      id: 5,
      nivel: "Intermediário",
      pontos: 20,
      enunciado: "Qual é a diferença entre igualdade e equidade?",
      alternativas: [
        { texto: "Igualdade oferece o mesmo recurso; equidade considera necessidades e barreiras para permitir participação justa.", correta: true },
        { texto: "Igualdade e equidade são exatamente a mesma coisa.", correta: false },
        { texto: "Equidade significa dar benefícios sem critério.", correta: false },
        { texto: "Igualdade significa retirar adaptações para todos receberem o mesmo tratamento.", correta: false }
      ],
      explicacao: "Igualdade oferece o mesmo recurso; equidade considera necessidades e barreiras para permitir participação justa."
    },
    {
      id: 6,
      nivel: "Intermediário",
      pontos: 20,
      enunciado: "Por que uma legenda em vídeo melhora a acessibilidade?",
      alternativas: [
        { texto: "Porque deixa o vídeo mais curto.", correta: false },
        { texto: "Porque oferece uma alternativa textual para falas e sons relevantes.", correta: true },
        { texto: "Porque elimina a necessidade de informações visuais acessíveis.", correta: false },
        { texto: "Porque substitui todos os outros recursos de acessibilidade.", correta: false }
      ],
      explicacao: "A legenda melhora a acessibilidade ao oferecer alternativa textual para falas e sons relevantes."
    },
    {
      id: 7,
      nivel: "Intermediário",
      pontos: 20,
      enunciado: "Qual cuidado é necessário ao descrever imagens em uma apresentação?",
      alternativas: [
        { texto: "Dizer apenas “imagem ilustrativa”.", correta: false },
        { texto: "Ler o nome do arquivo da imagem.", correta: false },
        { texto: "Explicar a informação ou mensagem relevante que a imagem transmite.", correta: true },
        { texto: "Omitir a descrição para não prolongar a apresentação.", correta: false }
      ],
      explicacao: "Ao descrever imagens, explique a informação ou mensagem relevante que a imagem transmite."
    },
    {
      id: 8,
      nivel: "Difícil",
      pontos: 30,
      enunciado: "Como uma reunião on-line pode ser mais acessível a pessoas cegas?",
      alternativas: [
        { texto: "Compartilhando os slides sem leitura ou explicação.", correta: false },
        { texto: "Usando gráficos sem qualquer descrição verbal.", correta: false },
        { texto: "Pedindo que outra pessoa acompanhe a reunião no lugar dela.", correta: false },
        { texto: "Descrevendo informações visuais relevantes, identificando quem fala e enviando materiais estruturados.", correta: true }
      ],
      explicacao: "Descreva informações visuais relevantes, identifique quem fala e envie materiais estruturados."
    },
    {
      id: 9,
      nivel: "Difícil",
      pontos: 30,
      enunciado: "Por que documentos digitais devem ter títulos estruturados e texto alternativo?",
      alternativas: [
        { texto: "Porque facilitam a navegação e tornam informações visuais acessíveis a tecnologias assistivas.", correta: true },
        { texto: "Porque tornam os arquivos maiores e mais coloridos.", correta: false },
        { texto: "Porque substituem a necessidade de linguagem simples.", correta: false },
        { texto: "Porque eliminam a necessidade de revisar o conteúdo.", correta: false }
      ],
      explicacao: "Títulos estruturados e texto alternativo facilitam a navegação e tornam informações visuais acessíveis a tecnologias assistivas."
    },
    {
      id: 10,
      nivel: "Difícil",
      pontos: 30,
      enunciado: "Por que o contraste de cores importa para pessoas com baixa visão?",
      alternativas: [
        { texto: "Porque obriga todos os materiais a usar fundo escuro.", correta: false },
        { texto: "Porque melhora a legibilidade entre texto e fundo; além disso, cor não deve ser a única forma de comunicar uma informação.", correta: true },
        { texto: "Porque elimina a necessidade de aumentar o tamanho do texto.", correta: false },
        { texto: "Porque substitui o uso de títulos e descrições.", correta: false }
      ],
      explicacao: "O contraste melhora a legibilidade entre texto e fundo; a cor não deve ser a única forma de comunicar uma informação."
    }
  ];

  var TOTAL_PERGUNTAS = BANCO_PERGUNTAS.length;
  var PONTUACAO_MAXIMA = BANCO_PERGUNTAS.reduce(function (soma, item) {
    return soma + item.pontos;
  }, 0);
  var els = {
    form: document.getElementById("form-inicio"),
    abaColaborador: document.getElementById("aba-colaborador"),
    abaTerceiro: document.getElementById("aba-terceiro"),
    painelColaborador: document.getElementById("painel-colaborador"),
    painelTerceiro: document.getElementById("painel-terceiro"),
    nomeColaborador: document.getElementById("nome-colaborador"),
    matriculaColaborador: document.getElementById("matricula-colaborador"),
    nomeColaboradorErro: document.getElementById("nome-colaborador-erro"),
    matriculaErro: document.getElementById("matricula-erro"),
    nomeTerceiro: document.getElementById("nome-terceiro"),
    empresaTerceiro: document.getElementById("empresa-terceiro"),
    nomeTerceiroErro: document.getElementById("nome-terceiro-erro"),
    empresaErro: document.getElementById("empresa-erro"),
    btnComecar: document.getElementById("btn-comecar"),
    btnVoz: document.getElementById("btn-voz"),
    btnVozGlobal: document.getElementById("btn-voz-global"),
    avisos: document.getElementById("avisos"),
    telaInicio: document.getElementById("tela-inicio"),
    telaQuiz: document.getElementById("tela-quiz"),
    telaResultado: document.getElementById("tela-resultado"),
    progresso: document.getElementById("progresso-quiz"),
    meta: document.getElementById("meta-pergunta"),
    tituloPergunta: document.getElementById("titulo-pergunta"),
    listaAlternativas: document.getElementById("lista-alternativas"),
    feedback: document.getElementById("feedback"),
    feedbackStatus: document.getElementById("feedback-status"),
    feedbackTexto: document.getElementById("feedback-texto"),
    btnConfirmar: document.getElementById("btn-confirmar"),
    btnProxima: document.getElementById("btn-proxima"),
    btnOuvir: document.getElementById("btn-ouvir"),
    tituloResultado: document.getElementById("titulo-resultado"),
    resumoResultado: document.getElementById("resumo-resultado"),
    msgRanking: document.getElementById("msg-ranking"),
    listaRanking: document.getElementById("lista-ranking"),
    btnRoleta: document.getElementById("btn-roleta"),
    btnJogarNovamente: document.getElementById("btn-jogar-novamente"),
    areaRoleta: document.getElementById("area-roleta"),
    canvasRoleta: document.getElementById("canvas-roleta"),
    resultadoRoleta: document.getElementById("resultado-roleta")
  };

  var estado = {
    nome: "",
    tipoParticipante: "colaborador",
    matricula: "",
    empresa: "",
    sessaoId: "",
    perguntas: [],
    indice: 0,
    selecionada: null,
    respondida: false,
    pontos: 0,
    acertos: 0,
    inicioMs: 0,
    fimMs: 0,
    tempoSegundos: 0,
    entrouTop10: false,
    posicaoRanking: null,
    vozAtiva: false,
    reconhecimento: null,
    reconhecimentoIniciando: false,
    vozSolicitadaPelaPessoa: false,
    roletaGirada: false,
    anguloRoleta: 0,
    animacaoRoleta: null,
    registroId: null
  };

  function anunciar(mensagem) {
    if (!els.avisos) return;
    els.avisos.textContent = "";
    window.requestAnimationFrame(function () {
      els.avisos.textContent = mensagem;
    });
  }

  function gerarSessaoId() {
    return "sessao-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
  }

  function embaralhar(lista) {
    var copia = lista.slice();
    for (var i = copia.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = copia[i];
      copia[i] = copia[j];
      copia[j] = tmp;
    }
    return copia;
  }

  function preferenciaMenosMovimento() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function formatarTempo(totalSegundos) {
    var s = Math.max(0, Math.floor(totalSegundos));
    var min = Math.floor(s / 60);
    var seg = s % 60;
    return min + "min " + (seg < 10 ? "0" : "") + seg + "s";
  }

  function obterAbas() {
    return [els.abaColaborador, els.abaTerceiro].filter(Boolean);
  }

  function tipoAbaAtiva() {
    if (els.abaTerceiro && els.abaTerceiro.getAttribute("aria-selected") === "true") {
      return "terceiro";
    }
    return "colaborador";
  }

  function limparErroCampo(input, erroEl) {
    if (input) {
      input.classList.remove("campo-invalido");
      input.removeAttribute("aria-invalid");
    }
    if (erroEl) {
      erroEl.hidden = true;
      erroEl.textContent = "";
    }
  }

  function marcarErroCampo(input, erroEl, mensagem) {
    if (input) {
      input.classList.add("campo-invalido");
      input.setAttribute("aria-invalid", "true");
    }
    if (erroEl) {
      erroEl.hidden = false;
      erroEl.textContent = mensagem;
    }
  }

  function limparErrosFormulario() {
    limparErroCampo(els.nomeColaborador, els.nomeColaboradorErro);
    limparErroCampo(els.matriculaColaborador, els.matriculaErro);
    limparErroCampo(els.nomeTerceiro, els.nomeTerceiroErro);
    limparErroCampo(els.empresaTerceiro, els.empresaErro);
  }

  function ativarAba(tipo, moverFoco) {
    var eColaborador = tipo === "colaborador";
    var abas = obterAbas();

    if (els.abaColaborador) {
      els.abaColaborador.setAttribute("aria-selected", eColaborador ? "true" : "false");
      els.abaColaborador.tabIndex = eColaborador ? 0 : -1;
      els.abaColaborador.classList.toggle("aba-ativa", eColaborador);
      var estadoColab = els.abaColaborador.querySelector(".aba-estado");
      if (estadoColab) estadoColab.textContent = eColaborador ? "(selecionada)" : "";
    }
    if (els.abaTerceiro) {
      els.abaTerceiro.setAttribute("aria-selected", eColaborador ? "false" : "true");
      els.abaTerceiro.tabIndex = eColaborador ? -1 : 0;
      els.abaTerceiro.classList.toggle("aba-ativa", !eColaborador);
      var estadoTerc = els.abaTerceiro.querySelector(".aba-estado");
      if (estadoTerc) estadoTerc.textContent = eColaborador ? "" : "(selecionada)";
    }
    if (els.painelColaborador) els.painelColaborador.hidden = !eColaborador;
    if (els.painelTerceiro) els.painelTerceiro.hidden = eColaborador;

    if (els.nomeColaborador) els.nomeColaborador.disabled = !eColaborador;
    if (els.matriculaColaborador) els.matriculaColaborador.disabled = !eColaborador;
    if (els.nomeTerceiro) els.nomeTerceiro.disabled = eColaborador;
    if (els.empresaTerceiro) els.empresaTerceiro.disabled = eColaborador;

    limparErrosFormulario();

    if (moverFoco) {
      window.requestAnimationFrame(function () {
        if (eColaborador && els.nomeColaborador) {
          els.nomeColaborador.focus();
        } else if (!eColaborador && els.nomeTerceiro) {
          els.nomeTerceiro.focus();
        }
      });
      anunciar(
        eColaborador
          ? "Aba Colaboradores Bayer selecionada."
          : "Aba Terceiros selecionada."
      );
    }

    return abas;
  }

  function navegarAbasPorTeclado(evento, abaAtual) {
    var abas = obterAbas();
    if (!abas.length) return;
    var indice = abas.indexOf(abaAtual);
    if (indice < 0) return;

    var proximo = indice;
    if (evento.key === "ArrowRight" || evento.key === "ArrowDown") {
      evento.preventDefault();
      proximo = (indice + 1) % abas.length;
    } else if (evento.key === "ArrowLeft" || evento.key === "ArrowUp") {
      evento.preventDefault();
      proximo = (indice - 1 + abas.length) % abas.length;
    } else if (evento.key === "Home") {
      evento.preventDefault();
      proximo = 0;
    } else if (evento.key === "End") {
      evento.preventDefault();
      proximo = abas.length - 1;
    } else {
      return;
    }

    var tipo = abas[proximo] === els.abaTerceiro ? "terceiro" : "colaborador";
    ativarAba(tipo, true);
  }

  function validarMatricula(valor) {
    // Texto livre; preserva zeros à esquerda; exige ao menos 1 caractere não espaço
    return typeof valor === "string" && valor.trim().length > 0;
  }

  function coletarCadastro() {
    limparErrosFormulario();
    var tipo = tipoAbaAtiva();

    if (tipo === "colaborador") {
      var nomeC = els.nomeColaborador ? els.nomeColaborador.value.trim() : "";
      // Mantém zeros à esquerda: não converter para número
      var matricula = els.matriculaColaborador ? els.matriculaColaborador.value : "";
      matricula = matricula.replace(/^\s+|\s+$/g, "");
      var ok = true;

      if (!nomeC) {
        marcarErroCampo(els.nomeColaborador, els.nomeColaboradorErro, "Informe o nome completo.");
        ok = false;
      }
      if (!validarMatricula(matricula)) {
        marcarErroCampo(
          els.matriculaColaborador,
          els.matriculaErro,
          "Informe a matrícula. Zeros à esquerda são aceitos."
        );
        ok = false;
      }

      if (!ok) {
        if (!nomeC && els.nomeColaborador) els.nomeColaborador.focus();
        else if (els.matriculaColaborador) els.matriculaColaborador.focus();
        anunciar("Corrija os campos obrigatórios da aba Colaboradores Bayer.");
        return null;
      }

      return {
        nome: nomeC,
        tipo_participante: "colaborador",
        matricula: matricula,
        empresa: ""
      };
    }

    var nomeT = els.nomeTerceiro ? els.nomeTerceiro.value.trim() : "";
    var empresa = els.empresaTerceiro ? els.empresaTerceiro.value.trim() : "";
    var okT = true;

    if (!nomeT) {
      marcarErroCampo(els.nomeTerceiro, els.nomeTerceiroErro, "Informe o nome completo.");
      okT = false;
    }
    if (!empresa) {
      marcarErroCampo(els.empresaTerceiro, els.empresaErro, "Informe a empresa.");
      okT = false;
    }

    if (!okT) {
      if (!nomeT && els.nomeTerceiro) els.nomeTerceiro.focus();
      else if (els.empresaTerceiro) els.empresaTerceiro.focus();
      anunciar("Corrija os campos obrigatórios da aba Terceiros.");
      return null;
    }

    return {
      nome: nomeT,
      tipo_participante: "terceiro",
      matricula: "",
      empresa: empresa
    };
  }

  function mostrarTela(tela) {
    var telas = [els.telaInicio, els.telaQuiz, els.telaResultado];
    for (var i = 0; i < telas.length; i++) {
      if (!telas[i]) continue;
      var ativa = telas[i] === tela;
      telas[i].hidden = !ativa;
      if (ativa) {
        telas[i].classList.add("tela-ativa");
      } else {
        telas[i].classList.remove("tela-ativa");
      }
    }
    if (els.btnVozGlobal) {
      els.btnVozGlobal.hidden = tela === els.telaInicio;
    }
  }

  function sincronizarBotoesVoz() {
    var texto = estado.vozAtiva ? "Ouvindo comando..." : "Ativar comando por voz";
    var pressed = estado.vozAtiva ? "true" : "false";
    if (els.btnVoz) {
      els.btnVoz.setAttribute("aria-pressed", pressed);
      els.btnVoz.textContent = texto;
    }
    if (els.btnVozGlobal) {
      els.btnVozGlobal.setAttribute("aria-pressed", pressed);
      els.btnVozGlobal.textContent = texto;
    }
  }

  function encerrarEscutaVoz() {
    estado.vozAtiva = false;
    estado.reconhecimentoIniciando = false;
    sincronizarBotoesVoz();
  }

  function prepararPerguntas() {
    var base = embaralhar(BANCO_PERGUNTAS);
    return base.map(function (p) {
      return {
        id: p.id,
        nivel: p.nivel,
        pontos: p.pontos,
        enunciado: p.enunciado,
        explicacao: p.explicacao,
        alternativas: embaralhar(
          p.alternativas.map(function (alt) {
            return { texto: alt.texto, correta: !!alt.correta };
          })
        )
      };
    });
  }

  function perguntaAtual() {
    return estado.perguntas[estado.indice];
  }

  function renderizarPergunta() {
    var p = perguntaAtual();
    if (!p) return;

    estado.selecionada = null;
    estado.respondida = false;

    var numero = estado.indice + 1;
    els.progresso.textContent = "Pergunta " + numero + " de " + estado.perguntas.length;
    els.meta.textContent = "Nível: " + p.nivel + " · Vale " + p.pontos + " pontos";
    els.tituloPergunta.textContent = p.enunciado;

    els.feedback.hidden = true;
    els.feedback.classList.remove("ok", "erro");
    els.feedbackStatus.textContent = "";
    els.feedbackTexto.textContent = "";

    els.btnConfirmar.hidden = false;
    els.btnConfirmar.disabled = true;
    els.btnProxima.hidden = true;
    els.btnProxima.disabled = true;
    els.btnProxima.textContent =
      numero === estado.perguntas.length ? "Ver resultado" : "Próxima pergunta";

    // Limpa avisos anteriores (ex.: erros de voz) para não parecerem ligados à nova pergunta
    if (els.avisos) {
      els.avisos.textContent = "";
    }

    els.listaAlternativas.innerHTML = "";

    for (var i = 0; i < p.alternativas.length; i++) {
      (function (indice) {
        var alt = p.alternativas[indice];
        var letra = LETRAS[indice];
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "alternativa";
        btn.setAttribute("role", "radio");
        btn.setAttribute("aria-checked", "false");
        btn.setAttribute("data-indice", String(indice));
        btn.id = "alt-" + indice;
        btn.innerHTML =
          '<span class="letra-alternativa" aria-hidden="true">' +
          letra +
          '</span><span class="texto-alternativa">' +
          alt.texto +
          "</span>";
        btn.setAttribute("aria-label", "Alternativa " + letra + ": " + alt.texto);
        btn.tabIndex = indice === 0 ? 0 : -1;
        btn.addEventListener("click", function () {
          selecionarAlternativa(indice);
        });
        btn.addEventListener("keydown", function (ev) {
          navegarAlternativas(ev, indice);
        });
        els.listaAlternativas.appendChild(btn);
      })(i);
    }

    window.requestAnimationFrame(function () {
      els.tituloPergunta.focus();
    });

    anunciar(
      "Pergunta " +
        numero +
        " de " +
        estado.perguntas.length +
        ". Nível " +
        p.nivel +
        ", vale " +
        p.pontos +
        " pontos. " +
        p.enunciado
    );
  }

  function obterBotoesAlternativa() {
    return Array.prototype.slice.call(
      els.listaAlternativas.querySelectorAll(".alternativa")
    );
  }

  function selecionarAlternativa(indice) {
    if (estado.respondida) return;
    estado.selecionada = indice;
    var botoes = obterBotoesAlternativa();
    for (var i = 0; i < botoes.length; i++) {
      var marcado = i === indice;
      botoes[i].setAttribute("aria-checked", marcado ? "true" : "false");
      if (marcado) {
        botoes[i].tabIndex = 0;
      } else {
        botoes[i].tabIndex = -1;
      }
    }
    els.btnConfirmar.disabled = false;
    anunciar("Selecionada alternativa " + LETRAS[indice]);
  }

  function navegarAlternativas(ev, indiceAtual) {
    var total = 4;
    var proximo = indiceAtual;
    if (ev.key === "ArrowDown" || ev.key === "ArrowRight") {
      ev.preventDefault();
      proximo = (indiceAtual + 1) % total;
    } else if (ev.key === "ArrowUp" || ev.key === "ArrowLeft") {
      ev.preventDefault();
      proximo = (indiceAtual - 1 + total) % total;
    } else if (ev.key === "Home") {
      ev.preventDefault();
      proximo = 0;
    } else if (ev.key === "End") {
      ev.preventDefault();
      proximo = total - 1;
    } else if (ev.key === " " || ev.key === "Enter") {
      ev.preventDefault();
      selecionarAlternativa(indiceAtual);
      return;
    } else {
      return;
    }
    selecionarAlternativa(proximo);
    var botoes = obterBotoesAlternativa();
    if (botoes[proximo]) botoes[proximo].focus();
  }

  function confirmarResposta() {
    if (estado.respondida || estado.selecionada === null) return;
    var p = perguntaAtual();
    var escolhida = p.alternativas[estado.selecionada];
    estado.respondida = true;

    var botoes = obterBotoesAlternativa();
    var indiceCorreta = -1;
    for (var i = 0; i < p.alternativas.length; i++) {
      if (p.alternativas[i].correta) indiceCorreta = i;
    }

    for (var j = 0; j < botoes.length; j++) {
      botoes[j].disabled = true;
      botoes[j].tabIndex = -1;
      if (p.alternativas[j].correta) {
        botoes[j].classList.add("correta");
        var seloOk = document.createElement("span");
        seloOk.className = "selo selo-correta";
        seloOk.textContent = "Correta";
        botoes[j].querySelector(".texto-alternativa").appendChild(document.createElement("br"));
        botoes[j].querySelector(".texto-alternativa").appendChild(seloOk);
      } else if (j === estado.selecionada) {
        botoes[j].classList.add("incorreta");
        var seloErro = document.createElement("span");
        seloErro.className = "selo selo-incorreta";
        seloErro.textContent = "Incorreta";
        botoes[j].querySelector(".texto-alternativa").appendChild(document.createElement("br"));
        botoes[j].querySelector(".texto-alternativa").appendChild(seloErro);
      }
    }

    els.feedback.hidden = false;
    els.btnConfirmar.disabled = true;
    els.btnConfirmar.hidden = false;
    els.btnProxima.hidden = false;
    els.btnProxima.disabled = false;

    if (escolhida.correta) {
      estado.pontos += p.pontos;
      estado.acertos += 1;
      els.feedback.classList.add("ok");
      els.feedback.classList.remove("erro");
      els.feedbackStatus.textContent = "Resposta correta";
      els.feedbackTexto.textContent =
        p.explicacao +
        " Alternativa correta: " +
        LETRAS[indiceCorreta] +
        " — " +
        p.alternativas[indiceCorreta].texto +
        " Pontuação atual: " +
        estado.pontos +
        " de " +
        PONTUACAO_MAXIMA +
        ".";
      anunciar(
        "Resposta correta. " +
          p.explicacao +
          " Alternativa correta: " +
          LETRAS[indiceCorreta] +
          ". Pontuação atual: " +
          estado.pontos +
          " pontos."
      );
    } else {
      els.feedback.classList.add("erro");
      els.feedback.classList.remove("ok");
      els.feedbackStatus.textContent = "Resposta incorreta";
      els.feedbackTexto.textContent =
        "A alternativa correta é " +
        LETRAS[indiceCorreta] +
        ": " +
        p.alternativas[indiceCorreta].texto +
        " " +
        p.explicacao +
        " Pontuação atual: " +
        estado.pontos +
        " de " +
        PONTUACAO_MAXIMA +
        ".";
      anunciar(
        "Resposta incorreta. A alternativa correta é " +
          LETRAS[indiceCorreta] +
          ": " +
          p.alternativas[indiceCorreta].texto +
          ". " +
          p.explicacao +
          " Pontuação atual: " +
          estado.pontos +
          " pontos."
      );
    }

    window.requestAnimationFrame(function () {
      els.btnProxima.focus();
    });
  }

  function proximaPergunta() {
    if (!estado.respondida || !els.btnProxima || els.btnProxima.disabled || els.btnProxima.hidden) {
      anunciar("Confirme uma resposta antes de avançar para a próxima pergunta.");
      return;
    }
    if (estado.indice < estado.perguntas.length - 1) {
      estado.indice += 1;
      renderizarPergunta();
      return;
    }
    finalizarQuiz();
  }

  function lerRankingLocal() {
    try {
      var bruto = localStorage.getItem(STORAGE_KEY);
      if (!bruto) return [];
      var dados = JSON.parse(bruto);
      return Array.isArray(dados) ? dados : [];
    } catch (e) {
      return [];
    }
  }

  function salvarRankingLocal(lista) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
    } catch (e) {
      /* ignore */
    }
  }

  function ordenarRanking(lista) {
    return lista.slice().sort(function (a, b) {
      if (b.pontos !== a.pontos) return b.pontos - a.pontos;
      var tempoA = a.tempo_segundos != null ? a.tempo_segundos : a.tempoSegundos || 0;
      var tempoB = b.tempo_segundos != null ? b.tempo_segundos : b.tempoSegundos || 0;
      if (tempoA !== tempoB) return tempoA - tempoB;
      var tA = a.timestamp || Date.parse(a.criado_em || "") || 0;
      var tB = b.timestamp || Date.parse(b.criado_em || "") || 0;
      return tA - tB;
    });
  }

  function matriculaJaParticipou(matricula) {
    if (!db) {
      return Promise.resolve(false);
    }
    return db
      .from("participantes")
      .select("id")
      .eq("matricula", matricula)
      .limit(1)
      .then(function (resultado) {
        if (resultado.error) {
          throw resultado.error;
        }
        return !!(resultado.data && resultado.data.length);
      });
  }

  function carregarTop10Global() {
    if (!db) {
      return Promise.resolve(ordenarRanking(lerRankingLocal()).slice(0, 10));
    }
    return db
      .from("participantes")
      .select("id, nome, pontos, tempo_segundos, criado_em")
      .order("pontos", { ascending: false })
      .order("tempo_segundos", { ascending: true })
      .order("criado_em", { ascending: true })
      .limit(10)
      .then(function (resultado) {
        if (resultado.error) {
          throw resultado.error;
        }
        return resultado.data || [];
      });
  }

  function salvarPremioNoRanking(premio) {
    if (db && estado.registroId) {
      db.from("participantes")
        .update({ premio: premio })
        .eq("id", estado.registroId)
        .then(function (resultado) {
          if (resultado.error) {
            anunciar("Não foi possível salvar o prêmio no servidor. O quiz continua normalmente.");
          }
        });
      return;
    }

    if (!estado.sessaoId) return;
    var ranking = lerRankingLocal();
    var atualizado = false;
    for (var i = 0; i < ranking.length; i++) {
      if (ranking[i].id === estado.sessaoId || ranking[i].id === estado.registroId) {
        ranking[i].premio = premio;
        atualizado = true;
        break;
      }
    }
    if (atualizado) {
      salvarRankingLocal(ranking);
    }
  }

  function registrarResultado() {
    var criadoEm = new Date().toISOString();
    var registro = {
      nome: estado.nome,
      tipo_participante: estado.tipoParticipante,
      matricula: estado.tipoParticipante === "colaborador" ? estado.matricula : null,
      empresa: estado.tipoParticipante === "terceiro" ? estado.empresa : null,
      pontos: estado.pontos,
      acertos: estado.acertos,
      tempo_segundos: estado.tempoSegundos,
      premio: null,
      criado_em: criadoEm
    };

    if (!db) {
      var local = Object.assign({}, registro, {
        id: estado.sessaoId,
        tempoSegundos: estado.tempoSegundos,
        timestamp: Date.now(),
        matricula: registro.matricula || "",
        empresa: registro.empresa || "",
        premio: ""
      });
      var ranking = lerRankingLocal();
      ranking.push(local);
      var ordenadoLocal = ordenarRanking(ranking).slice(0, 10);
      salvarRankingLocal(ordenadoLocal);
      estado.registroId = estado.sessaoId;
      estado.entrouTop10 = ordenadoLocal.some(function (item) {
        return item.id === estado.sessaoId;
      });
      estado.posicaoRanking = null;
      for (var i = 0; i < ordenadoLocal.length; i++) {
        if (ordenadoLocal[i].id === estado.sessaoId) {
          estado.posicaoRanking = i + 1;
          break;
        }
      }
      return Promise.resolve(ordenadoLocal);
    }

    return db
      .from("participantes")
      .insert(registro)
      .select("id, nome, pontos, tempo_segundos, criado_em")
      .single()
      .then(function (inserido) {
        if (inserido.error) {
          throw inserido.error;
        }
        estado.registroId = inserido.data && inserido.data.id ? inserido.data.id : null;
        return carregarTop10Global();
      })
      .then(function (top10) {
        estado.entrouTop10 = false;
        estado.posicaoRanking = null;
        for (var j = 0; j < top10.length; j++) {
          if (estado.registroId && top10[j].id === estado.registroId) {
            estado.entrouTop10 = true;
            estado.posicaoRanking = j + 1;
            break;
          }
        }
        return top10;
      });
  }

  function renderizarRanking(top10) {
    els.listaRanking.innerHTML = "";
    if (!top10.length) {
      var vazio = document.createElement("p");
      vazio.className = "ranking-vazio";
      vazio.textContent = "Ainda não há resultados no ranking.";
      els.listaRanking.appendChild(vazio);
      return;
    }

    for (var i = 0; i < top10.length; i++) {
      var item = top10[i];
      var artigo = document.createElement("article");
      artigo.className = "item-ranking";
      artigo.setAttribute("role", "listitem");
      if (estado.registroId && item.id === estado.registroId) {
        artigo.classList.add("destaque");
        artigo.setAttribute("aria-current", "true");
      }
      // Ranking público: somente posição, nome e pontos
      artigo.innerHTML =
        '<div class="posicao-ranking" aria-label="Posição ' +
        (i + 1) +
        '">' +
        (i + 1) +
        'º</div><div class="dados-ranking"><strong>' +
        item.nome +
        "</strong><span>" +
        item.pontos +
        " pontos</span></div>";
      els.listaRanking.appendChild(artigo);
    }
  }

  function finalizarQuiz() {
    estado.fimMs = Date.now();
    estado.tempoSegundos = Math.max(1, Math.round((estado.fimMs - estado.inicioMs) / 1000));

    mostrarTela(els.telaResultado);
    els.resumoResultado.textContent =
      estado.nome +
      ", você acertou " +
      estado.acertos +
      " de " +
      TOTAL_PERGUNTAS +
      " perguntas, somou " +
      estado.pontos +
      " de " +
      PONTUACAO_MAXIMA +
      " pontos e concluiu em " +
      formatarTempo(estado.tempoSegundos) +
      ".";
    els.msgRanking.textContent = "Salvando resultado e carregando o Top 10 global…";
    els.msgRanking.classList.remove("entrou", "fora");
    anunciar(els.resumoResultado.textContent + " Salvando resultado.");

    registrarResultado()
      .then(function (top10) {
        els.msgRanking.classList.remove("entrou", "fora");
        if (estado.entrouTop10) {
          els.msgRanking.classList.add("entrou");
          els.msgRanking.textContent =
            "Parabéns! Você entrou no Top 10 global na posição " + estado.posicaoRanking + "ª.";
        } else {
          els.msgRanking.classList.add("fora");
          els.msgRanking.textContent =
            "Você não entrou no Top 10 global desta vez. O tempo é usado como critério de desempate.";
        }
        renderizarRanking(top10);
        anunciar(els.msgRanking.textContent);
      })
      .catch(function (erro) {
        var codigo = erro && (erro.code || erro.message) ? String(erro.code || erro.message) : "";
        if (codigo.indexOf("23505") !== -1 || /duplicate|unique/i.test(codigo)) {
          els.msgRanking.classList.add("fora");
          els.msgRanking.textContent =
            "Esta matrícula já possui uma participação registrada. O ranking não foi atualizado.";
          anunciar(els.msgRanking.textContent);
        } else {
          els.msgRanking.classList.add("fora");
          els.msgRanking.textContent =
            "Não foi possível salvar no servidor agora. Verifique a conexão e tente novamente mais tarde.";
          anunciar(els.msgRanking.textContent);
        }
        carregarTop10Global()
          .then(renderizarRanking)
          .catch(function () {
            renderizarRanking([]);
          });
      });

    estado.roletaGirada = false;
    els.btnRoleta.disabled = false;
    els.areaRoleta.hidden = true;
    els.resultadoRoleta.textContent = "";
    desenharRoleta(estado.anguloRoleta);

    window.requestAnimationFrame(function () {
      els.tituloResultado.focus();
    });
  }

  function iniciarQuiz(cadastro) {
    estado.nome = cadastro.nome;
    estado.tipoParticipante = cadastro.tipo_participante;
    estado.matricula = cadastro.matricula || "";
    estado.empresa = cadastro.empresa || "";
    estado.sessaoId = gerarSessaoId();
    estado.registroId = null;
    estado.perguntas = prepararPerguntas();
    estado.indice = 0;
    estado.selecionada = null;
    estado.respondida = false;
    estado.pontos = 0;
    estado.acertos = 0;
    estado.inicioMs = Date.now();
    estado.fimMs = 0;
    estado.tempoSegundos = 0;
    estado.entrouTop10 = false;
    estado.posicaoRanking = null;
    estado.roletaGirada = false;
    estado.anguloRoleta = 0;

    try {
      sessionStorage.setItem("quizEnableNome", cadastro.nome);
      sessionStorage.setItem("quizEnableSessao", estado.sessaoId);
      sessionStorage.setItem("quizEnableTipo", cadastro.tipo_participante);
    } catch (e) {
      /* ignore */
    }

    mostrarTela(els.telaQuiz);
    renderizarPergunta();
  }

  function iniciarQuizComValidacao(cadastro) {
    if (cadastro.tipo_participante !== "colaborador") {
      iniciarQuiz(cadastro);
      return;
    }

    anunciar("Verificando matrícula…");
    if (els.btnComecar) els.btnComecar.disabled = true;

    matriculaJaParticipou(cadastro.matricula)
      .then(function (jaExiste) {
        if (els.btnComecar) els.btnComecar.disabled = false;
        if (jaExiste) {
          marcarErroCampo(
            els.matriculaColaborador,
            els.matriculaErro,
            "Esta matrícula já possui uma participação registrada."
          );
          if (els.matriculaColaborador) els.matriculaColaborador.focus();
          anunciar(
            "Não é possível iniciar: esta matrícula já possui uma participação. Use teclado para corrigir ou escolha outra aba."
          );
          return;
        }
        iniciarQuiz(cadastro);
      })
      .catch(function () {
        if (els.btnComecar) els.btnComecar.disabled = false;
        anunciar(
          "Não foi possível verificar a matrícula no servidor. Tente novamente em instantes."
        );
      });
  }

  function textoPerguntaParaVoz() {
    var p = perguntaAtual();
    if (!p) return "";
    var partes = [
      "Pergunta " + (estado.indice + 1) + " de " + estado.perguntas.length + ".",
      "Nível " + p.nivel + ", vale " + p.pontos + " pontos.",
      p.enunciado
    ];
    for (var i = 0; i < p.alternativas.length; i++) {
      partes.push("Alternativa " + LETRAS[i] + ": " + p.alternativas[i].texto);
    }
    return partes.join(" ");
  }

  function falar(texto) {
    if (!("speechSynthesis" in window)) {
      anunciar("Seu navegador não oferece síntese de voz. Continue pelo teclado ou toque.");
      return;
    }
    window.speechSynthesis.cancel();
    var utter = new SpeechSynthesisUtterance(texto);
    utter.lang = "pt-BR";
    utter.rate = 1;
    window.speechSynthesis.speak(utter);
  }

  function ouvirPergunta() {
    var texto = textoPerguntaParaVoz();
    if (!texto) return;
    falar(texto);
    anunciar("Lendo a pergunta em voz alta.");
  }

  function repetirOpcoes() {
    var p = perguntaAtual();
    if (!p) return;
    var partes = [];
    for (var i = 0; i < p.alternativas.length; i++) {
      partes.push("Alternativa " + LETRAS[i] + ": " + p.alternativas[i].texto);
    }
    falar(partes.join(" "));
    anunciar("Repetindo as opções.");
  }

  function suporteVozDisponivel() {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  function mensagemErroVoz(codigo) {
    if (codigo === "not-allowed") {
      return "Microfone bloqueado. Permita o acesso ao microfone no navegador. O quiz continua funcionando por teclado, mouse, toque e pelo botão Ouvir pergunta.";
    }
    if (codigo === "no-speech") {
      return "Nenhum som reconhecido. Tente de novo pelo comando por voz. O quiz continua funcionando por teclado, mouse, toque e pelo botão Ouvir pergunta.";
    }
    if (codigo === "network" || codigo === "service-not-allowed") {
      return "Serviço de reconhecimento indisponível. Verifique a conexão e tente mais tarde. O quiz continua funcionando por teclado, mouse, toque e pelo botão Ouvir pergunta.";
    }
    if (codigo === "audio-capture") {
      return "Microfone bloqueado ou indisponível. Verifique o dispositivo de áudio. O quiz continua funcionando por teclado, mouse, toque e pelo botão Ouvir pergunta.";
    }
    return "";
  }

  function mensagemContinuidadeSemVoz() {
    return "O quiz continua funcionando por teclado, mouse, toque e pelo botão Ouvir pergunta.";
  }

  function normalizarComando(texto) {
    return texto
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function processarComandoVoz(textoBruto) {
    var cmd = normalizarComando(textoBruto);
    if (!cmd) {
      anunciar("Não foi possível entender o comando de voz. Tente novamente.");
      return;
    }

    if (!els.telaInicio.hidden) {
      if (cmd.indexOf("colaborador") !== -1 || cmd.indexOf("bayer") !== -1) {
        ativarAba("colaborador", true);
        return;
      }
      if (cmd.indexOf("terceiro") !== -1) {
        ativarAba("terceiro", true);
        return;
      }
      if (cmd.indexOf("comecar") !== -1 || cmd.indexOf("iniciar") !== -1) {
        if (els.form) els.form.requestSubmit();
        return;
      }

      var tipo = tipoAbaAtiva();
      if (tipo === "colaborador") {
        if (!els.nomeColaborador.value.trim()) {
          els.nomeColaborador.value = textoBruto.trim();
          anunciar('Nome preenchido por voz. Informe a matrícula ou diga "começar".');
          return;
        }
        if (!els.matriculaColaborador.value.trim()) {
          els.matriculaColaborador.value = textoBruto.trim();
          anunciar('Matrícula preenchida por voz. Diga "começar" para iniciar.');
          return;
        }
      } else {
        if (!els.nomeTerceiro.value.trim()) {
          els.nomeTerceiro.value = textoBruto.trim();
          anunciar('Nome preenchido por voz. Informe a empresa ou diga "começar".');
          return;
        }
        if (!els.empresaTerceiro.value.trim()) {
          els.empresaTerceiro.value = textoBruto.trim();
          anunciar('Empresa preenchida por voz. Diga "começar" para iniciar.');
          return;
        }
      }
      anunciar('Comando ouvido. Diga "começar" para iniciar o quiz.');
      return;
    }

    if (!els.telaQuiz.hidden) {
      if (cmd.indexOf("ler pergunta") !== -1 || cmd.indexOf("ouvir pergunta") !== -1) {
        ouvirPergunta();
        return;
      }
      if (cmd.indexOf("repetir opcoes") !== -1 || cmd.indexOf("repetir alternativas") !== -1) {
        repetirOpcoes();
        return;
      }
      if (
        cmd.indexOf("alternativa um") !== -1 ||
        cmd.indexOf("alternativa 1") !== -1 ||
        cmd.indexOf("alternativa a") !== -1
      ) {
        selecionarAlternativa(0);
        return;
      }
      if (
        cmd.indexOf("alternativa dois") !== -1 ||
        cmd.indexOf("alternativa 2") !== -1 ||
        cmd.indexOf("alternativa b") !== -1
      ) {
        selecionarAlternativa(1);
        return;
      }
      if (
        cmd.indexOf("alternativa tres") !== -1 ||
        cmd.indexOf("alternativa 3") !== -1 ||
        cmd.indexOf("alternativa c") !== -1
      ) {
        selecionarAlternativa(2);
        return;
      }
      if (
        cmd.indexOf("alternativa quatro") !== -1 ||
        cmd.indexOf("alternativa 4") !== -1 ||
        cmd.indexOf("alternativa d") !== -1
      ) {
        selecionarAlternativa(3);
        return;
      }
      if (cmd.indexOf("confirmar resposta") !== -1 || cmd === "confirmar") {
        confirmarResposta();
        return;
      }
      if (cmd.indexOf("proxima pergunta") !== -1 || cmd.indexOf("ver resultado") !== -1) {
        proximaPergunta();
        return;
      }
      anunciar(
        'Comando não reconhecido. Tente: ler pergunta, alternativa um a quatro, confirmar resposta, próxima pergunta ou repetir opções.'
      );
      return;
    }

    if (!els.telaResultado.hidden) {
      if (cmd.indexOf("girar roleta") !== -1 || cmd.indexOf("roleta") !== -1) {
        girarRoleta();
        return;
      }
      if (cmd.indexOf("jogar novamente") !== -1 || cmd.indexOf("recomecar") !== -1) {
        jogarNovamente();
        return;
      }
    }
  }

  function criarReconhecimento() {
    var SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    var recognition = new SpeechRecognitionAPI();
    recognition.lang = "pt-BR";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = function () {
      estado.vozAtiva = true;
      estado.reconhecimentoIniciando = false;
      sincronizarBotoesVoz();
      anunciar(
        'Ouvindo comando. Exemplos: ler pergunta, alternativa um, confirmar resposta, próxima pergunta, repetir opções.'
      );
    };

    recognition.onresult = function (evento) {
      var texto =
        evento.results &&
        evento.results[0] &&
        evento.results[0][0] &&
        evento.results[0][0].transcript
          ? evento.results[0][0].transcript.trim()
          : "";
      if (texto) {
        processarComandoVoz(texto);
      } else if (estado.vozSolicitadaPelaPessoa) {
        anunciar(
          "Nenhum som reconhecido. Tente de novo pelo comando por voz. " +
            mensagemContinuidadeSemVoz()
        );
      }
    };

    recognition.onerror = function (evento) {
      var codigo = evento && evento.error ? evento.error : "";
      var solicitado = estado.vozSolicitadaPelaPessoa;
      estado.reconhecimentoIniciando = false;

      if (codigo === "aborted") {
        estado.vozSolicitadaPelaPessoa = false;
        encerrarEscutaVoz();
        return;
      }

      var mensagem = mensagemErroVoz(codigo);
      estado.vozSolicitadaPelaPessoa = false;
      encerrarEscutaVoz();

      // Mensagens de falha só após clique em "Ativar comando por voz"
      if (!solicitado) {
        return;
      }

      if (mensagem) {
        anunciar(mensagem);
      } else {
        anunciar(
          "Não foi possível usar o comando por voz agora. " + mensagemContinuidadeSemVoz()
        );
      }
    };

    recognition.onend = function () {
      estado.reconhecimentoIniciando = false;
      estado.vozSolicitadaPelaPessoa = false;
      encerrarEscutaVoz();
    };

    return recognition;
  }

  function pararReconhecimento() {
    estado.vozSolicitadaPelaPessoa = false;
    if (!estado.reconhecimento) {
      encerrarEscutaVoz();
      return;
    }
    try {
      estado.reconhecimento.abort();
    } catch (e1) {
      try {
        estado.reconhecimento.stop();
      } catch (e2) {
        encerrarEscutaVoz();
      }
    }
  }

  function iniciarReconhecimento() {
    if (!suporteVozDisponivel()) {
      anunciar(
        "Navegador incompatível com comando por voz. " + mensagemContinuidadeSemVoz()
      );
      return;
    }

    if (estado.vozAtiva || estado.reconhecimentoIniciando) {
      return;
    }

    // Marcado somente após clique explícito em "Ativar comando por voz"
    estado.vozSolicitadaPelaPessoa = true;
    estado.reconhecimento = criarReconhecimento();
    estado.reconhecimentoIniciando = true;

    try {
      estado.reconhecimento.start();
    } catch (e) {
      estado.reconhecimentoIniciando = false;
      estado.vozSolicitadaPelaPessoa = false;
      encerrarEscutaVoz();
      anunciar(
        "Serviço de reconhecimento indisponível. Verifique a conexão e tente mais tarde. " +
          mensagemContinuidadeSemVoz()
      );
    }
  }

  function alternarVoz() {
    if (!suporteVozDisponivel()) {
      anunciar(
        "Navegador incompatível com comando por voz. " + mensagemContinuidadeSemVoz()
      );
      return;
    }

    if (estado.vozAtiva || estado.reconhecimentoIniciando) {
      pararReconhecimento();
      anunciar("Comando por voz encerrado. " + mensagemContinuidadeSemVoz());
      return;
    }

    iniciarReconhecimento();
  }

  function desenharRoleta(anguloGraus) {
    var canvas = els.canvasRoleta;
    if (!canvas) return;
    var ctx = canvas.getContext("2d");
    var tamanho = canvas.width;
    var centro = tamanho / 2;
    var raio = centro - 4;
    var fatias = PREMIOS.length;
    var arco = (2 * Math.PI) / fatias;
    var angulo = (anguloGraus * Math.PI) / 180;

    ctx.clearRect(0, 0, tamanho, tamanho);

    for (var i = 0; i < fatias; i++) {
      var inicio = angulo + i * arco;
      var fim = inicio + arco;
      ctx.beginPath();
      ctx.moveTo(centro, centro);
      ctx.arc(centro, centro, raio, inicio, fim);
      ctx.closePath();
      ctx.fillStyle = CORES_ROLETA[i % CORES_ROLETA.length];
      ctx.fill();
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.save();
      ctx.translate(centro, centro);
      ctx.rotate(inicio + arco / 2);
      ctx.textAlign = "right";
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 13px Segoe UI, Arial, sans-serif";
      ctx.fillText(PREMIOS[i], raio - 12, 5);
      ctx.restore();
    }

    ctx.beginPath();
    ctx.arc(centro, centro, 28, 0, 2 * Math.PI);
    ctx.fillStyle = "#FFFFFF";
    ctx.fill();
    ctx.fillStyle = "#003B5C";
    ctx.font = "bold 11px Segoe UI, Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("ENABLE", centro, centro);
  }

  function anguloParaIndice(indice) {
    var arco = 360 / PREMIOS.length;
    // Centro da fatia i em angulo=0: i*arco + arco/2. Queremos esse centro em 270° (topo).
    var centroFatia = indice * arco + arco / 2;
    return (270 - centroFatia + 360) % 360;
  }

  function girarRoleta() {
    if (estado.roletaGirada) {
      anunciar("A roleta já foi girada nesta sessão.");
      return;
    }

    els.areaRoleta.hidden = false;
    var indiceSorteado = Math.floor(Math.random() * PREMIOS.length);
    var alvoBase = anguloParaIndice(indiceSorteado);
    var voltas = preferenciaMenosMovimento() ? 0 : 4 + Math.floor(Math.random() * 3);
    var destino = voltas * 360 + alvoBase;
    // Garante rotação contínua a partir do ângulo atual
    while (destino <= estado.anguloRoleta) {
      destino += 360;
    }

    estado.roletaGirada = true;
    els.btnRoleta.disabled = true;

    function concluirRoleta() {
      estado.anguloRoleta = destino;
      desenharRoleta(estado.anguloRoleta);
      var premio = PREMIOS[indiceSorteado];
      els.resultadoRoleta.textContent = "Prêmio: " + premio;
      anunciar("Resultado da roleta: " + premio);
      salvarPremioNoRanking(premio);
    }

    if (preferenciaMenosMovimento()) {
      concluirRoleta();
      return;
    }

    var inicio = null;
    var anguloInicial = estado.anguloRoleta;
    var duracao = 4200;

    function animar(timestamp) {
      if (inicio === null) inicio = timestamp;
      var t = Math.min(1, (timestamp - inicio) / duracao);
      var ease = 1 - Math.pow(1 - t, 3);
      estado.anguloRoleta = anguloInicial + (destino - anguloInicial) * ease;
      desenharRoleta(estado.anguloRoleta);
      if (t < 1) {
        estado.animacaoRoleta = window.requestAnimationFrame(animar);
      } else {
        concluirRoleta();
      }
    }

    if (estado.animacaoRoleta) {
      window.cancelAnimationFrame(estado.animacaoRoleta);
    }
    anunciar("Girando a roleta de brindes.");
    estado.animacaoRoleta = window.requestAnimationFrame(animar);
  }

  function jogarNovamente() {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    mostrarTela(els.telaInicio);
    ativarAba(estado.tipoParticipante === "terceiro" ? "terceiro" : "colaborador", false);
    if (estado.tipoParticipante === "terceiro") {
      if (els.nomeTerceiro) els.nomeTerceiro.value = estado.nome || "";
      if (els.empresaTerceiro) els.empresaTerceiro.value = estado.empresa || "";
      if (els.nomeTerceiro) els.nomeTerceiro.focus();
    } else {
      if (els.nomeColaborador) els.nomeColaborador.value = estado.nome || "";
      if (els.matriculaColaborador) els.matriculaColaborador.value = estado.matricula || "";
      if (els.nomeColaborador) els.nomeColaborador.focus();
    }
    anunciar("Pronto para jogar novamente. Confirme os dados e comece o quiz.");
  }

  if (els.abaColaborador) {
    els.abaColaborador.addEventListener("click", function () {
      ativarAba("colaborador", true);
    });
    els.abaColaborador.addEventListener("keydown", function (ev) {
      navegarAbasPorTeclado(ev, els.abaColaborador);
    });
  }
  if (els.abaTerceiro) {
    els.abaTerceiro.addEventListener("click", function () {
      ativarAba("terceiro", true);
    });
    els.abaTerceiro.addEventListener("keydown", function (ev) {
      navegarAbasPorTeclado(ev, els.abaTerceiro);
    });
  }

  if (els.form) {
    els.form.addEventListener("submit", function (evento) {
      evento.preventDefault();
      var cadastro = coletarCadastro();
      if (!cadastro) return;
      iniciarQuizComValidacao(cadastro);
    });
  }

  if (els.btnConfirmar) {
    els.btnConfirmar.addEventListener("click", confirmarResposta);
  }
  if (els.btnProxima) {
    els.btnProxima.addEventListener("click", proximaPergunta);
  }
  if (els.btnOuvir) {
    els.btnOuvir.addEventListener("click", ouvirPergunta);
  }
  if (els.btnRoleta) {
    els.btnRoleta.addEventListener("click", girarRoleta);
  }
  if (els.btnJogarNovamente) {
    els.btnJogarNovamente.addEventListener("click", jogarNovamente);
  }
  if (els.btnVoz) {
    els.btnVoz.addEventListener("click", alternarVoz);
  }
  if (els.btnVozGlobal) {
    els.btnVozGlobal.addEventListener("click", alternarVoz);
  }

  desenharRoleta(0);
  ativarAba("colaborador", false);
  mostrarTela(els.telaInicio);
})();
