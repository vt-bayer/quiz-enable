(function () {
  "use strict";

  var LETRAS = ["A", "B", "C", "D"];
  var Store = window.QuizStore;


  var els = {
    telaStatus: document.getElementById("tela-status"),
    telaInicio: document.getElementById("tela-inicio"),
    telaQuiz: document.getElementById("tela-quiz"),
    telaResultado: document.getElementById("tela-resultado"),
    tituloStatus: document.getElementById("titulo-status"),
    msgStatus: document.getElementById("msg-status"),
    blocoRankingStatus: document.getElementById("bloco-ranking-status"),
    tituloRankingStatus: document.getElementById("titulo-ranking-status"),
    listaRankingStatus: document.getElementById("lista-ranking-status"),
    form: document.getElementById("form-inicio"),
    nome: document.getElementById("nome-participante"),
    nomeErro: document.getElementById("nome-erro"),
    publicoBayer: document.getElementById("publico-bayer"),
    publicoParceiro: document.getElementById("publico-parceiro"),
    publicoErro: document.getElementById("publico-erro"),
    campoEmpresa: document.getElementById("campo-empresa"),
    empresa: document.getElementById("empresa-parceira"),
    matricula: document.getElementById("matricula-opcional"),
    infoFaseInicio: document.getElementById("info-fase-inicio"),
    opcoesFase: document.getElementById("opcoes-fase"),
    faseErro: document.getElementById("fase-erro"),
    btnComecar: document.getElementById("btn-comecar"),
    btnVoz: document.getElementById("btn-voz"),
    btnVozGlobal: document.getElementById("btn-voz-global"),
    cabecalhoFase: document.getElementById("cabecalho-fase"),
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
    resultadoFase: document.getElementById("resultado-fase"),
    resultadoPontos: document.getElementById("resultado-pontos"),
    resultadoAcertos: document.getElementById("resultado-acertos"),
    resultadoTempo: document.getElementById("resultado-tempo"),
    resultadoPosicao: document.getElementById("resultado-posicao"),
    avisoRankingLive: document.getElementById("aviso-ranking-live"),
    suaPosicaoExtra: document.getElementById("sua-posicao-extra"),
    tituloRanking: document.getElementById("titulo-ranking"),
    corpoRanking: document.getElementById("corpo-ranking"),
    btnJogarNovamente: document.getElementById("btn-jogar-novamente"),
    btnVerRanking: document.getElementById("btn-ver-ranking"),
    avisos: document.getElementById("avisos")
  };

  var estado = {
    nome: "",
    tipoPublico: "",
    empresa: "",
    matricula: "",
    fase: null,
    perguntas: [],
    indice: 0,
    selecionada: null,
    respondida: false,
    pontos: 0,
    acertos: 0,
    inicioMs: 0,
    tempoSegundos: 0,
    participacaoId: null,
    respostas: [],
    ouvindoAudio: false,
    vozAtiva: false,
    reconhecimento: null,
    reconhecimentoIniciando: false,
    vozSolicitadaPelaPessoa: false,
    salvando: false
  };

  function anunciar(msg) {
    if (!els.avisos) return;
    els.avisos.textContent = "";
    requestAnimationFrame(function () {
      els.avisos.textContent = msg;
    });
  }

  function formatarTempo(seg) {
    var s = Math.max(0, Math.floor(seg || 0));
    var m = Math.floor(s / 60);
    var r = s % 60;
    return (m < 10 ? "0" : "") + m + ":" + (r < 10 ? "0" : "") + r;
  }

  function mostrarTela(tela) {
    [els.telaStatus, els.telaInicio, els.telaQuiz, els.telaResultado].forEach(function (t) {
      if (!t) return;
      var ativa = t === tela;
      t.hidden = !ativa;
      t.classList.toggle("tela-ativa", ativa);
    });
    if (els.btnVozGlobal) els.btnVozGlobal.hidden = tela !== els.telaQuiz;
  }

  function lerParticipacoes() {
    return Store ? Store.lerCache() : [];
  }

  function ordenarRanking(lista) {
    return Store ? Store.ordenarRanking(lista) : lista.slice();
  }

  function rankingFaseLocal(faseId, apenasConcluidas) {
    var lista = lerParticipacoes().filter(function (p) {
      if (p.fase_id !== faseId) return false;
      if (apenasConcluidas !== false) return p.status === "concluida";
      return true;
    });
    return ordenarRanking(lista);
  }

  function carregarRankingFase(faseId, callback) {
    if (!Store) {
      callback(rankingFaseLocal(faseId, true));
      return;
    }
    Store.rankingFase(faseId, true).then(function (res) {
      if (!res.ok) {
        anunciar("Usando cache local. Ative a nuvem no Supabase (arquivo ATIVAR-NUVEM.sql) para sincronizar entre dispositivos.");
      }
      callback(res.ranking || rankingFaseLocal(faseId, true));
    });
  }

  function renderizarTabelaRanking(corpoEl, lista, opcoes) {
    opcoes = opcoes || {};
    if (!corpoEl) return;
    corpoEl.innerHTML = "";
    var priv = Store ? Store.privacidadeAtual() : "primeiro_inicial";
    var top = lista.slice(0, opcoes.limite || 10);
    if (!lista.length) {
      var tr = document.createElement("tr");
      tr.innerHTML = '<td colspan="5">Ainda não há resultados nesta fase.</td>';
      corpoEl.appendChild(tr);
      return;
    }
    top.forEach(function (item, i) {
      var pos = item.posicao_ranking || (i + 1);
      var ehVoce = opcoes.meuId && item.id === opcoes.meuId;
      var nome = Store
        ? Store.formatarNomePublico(item.participante_nome, priv)
        : item.participante_nome;
      var tr = document.createElement("tr");
      if (ehVoce) {
        tr.className = "linha-voce";
        tr.setAttribute("aria-current", "true");
      }
      tr.innerHTML =
        "<td>" + pos + "º</td>" +
        "<th scope=\"row\">" + escapar(nome) +
        (ehVoce ? ' <span class="selo-voce">Você</span>' : "") + "</th>" +
        "<td>" + item.pontuacao + "</td>" +
        "<td>" + item.quantidade_acertos + " de 5</td>" +
        "<td>" + formatarTempo(item.tempo_total_segundos) + "</td>";
      corpoEl.appendChild(tr);
    });
  }

  function renderizarListaRanking(container, lista) {
    if (!container) return;
    container.innerHTML = "";
    if (!lista.length) {
      container.innerHTML = '<p class="ranking-vazio">Ainda não há resultados nesta fase.</p>';
      return;
    }
    lista.forEach(function (item, i) {
      var art = document.createElement("article");
      art.className = "item-ranking";
      art.setAttribute("role", "listitem");
      art.innerHTML =
        '<div class="posicao-ranking">' + (i + 1) + "º</div>" +
        '<div class="dados-ranking"><strong>' + escapar(item.participante_nome) +
        "</strong><span>" + item.pontuacao + " pontos · " +
        item.quantidade_acertos + " acertos · " +
        formatarTempo(item.tempo_total_segundos) + "</span></div>";
      container.appendChild(art);
    });
  }

  function escapar(t) {
    return String(t || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function atualizarInterfacePorStatus() {
    var st = QuizStatus.obterEstadoQuiz();
    if (!st.liberado) {
      mostrarTela(els.telaStatus);
      if (els.msgStatus) els.msgStatus.textContent = st.mensagem;
      if (els.blocoRankingStatus) {
        var mostrar = !!st.rankingFaseId;
        els.blocoRankingStatus.hidden = !mostrar;
        if (mostrar) {
          var fases = QuizData.carregarFases();
          var fase = fases.find(function (f) { return f.id === st.rankingFaseId; });
          if (els.tituloRankingStatus) {
            els.tituloRankingStatus.textContent =
              "Ranking — " + (fase ? fase.nome : st.rankingFaseId);
          }
          carregarRankingFase(st.rankingFaseId, function (ranking) {
            renderizarListaRanking(els.listaRankingStatus, ranking);
          });
        }
      }
      return st;
    }

    mostrarTela(els.telaInicio);
    renderizarOpcoesFase(st);
    if (els.infoFaseInicio) {
      els.infoFaseInicio.textContent =
        "Escolha a fase e comece quando quiser. Cada fase tem 5 perguntas e vale até 90 pontos. Os horários servem só para identificar as fases.";
    }
    return st;
  }

  function renderizarOpcoesFase(st) {
    if (!els.opcoesFase) return;
    var selecionadaAntes = faseSelecionadaId();
    var sugerida = st.faseAtiva && st.faseAtiva.id;
    var marcar = selecionadaAntes || sugerida || (st.fasesDisponiveis[0] && st.fasesDisponiveis[0].id);
    els.opcoesFase.innerHTML = "";
    st.fasesDisponiveis.forEach(function (fase, i) {
      var id = "fase-opcao-" + fase.id;
      var label = document.createElement("label");
      label.className = "card-fase-opcao";
      label.setAttribute("for", id);
      var input = document.createElement("input");
      input.type = "radio";
      input.name = "fase_quiz";
      input.id = id;
      input.value = fase.id;
      input.required = true;
      if (fase.id === marcar) input.checked = true;
      var texto = document.createElement("span");
      texto.innerHTML =
        "<strong>" + (fase.nome || ("Fase " + (i + 1))) + "</strong>" +
        '<span class="fase-horario">' +
        QuizStatus.formatarHorario(fase.horarioInicio) +
        " às " +
        QuizStatus.formatarHorario(fase.horarioFim) +
        " · identificação</span>";
      label.appendChild(input);
      label.appendChild(texto);
      els.opcoesFase.appendChild(label);
    });
  }

  function faseSelecionadaId() {
    var el = document.querySelector('input[name="fase_quiz"]:checked');
    return el ? el.value : "";
  }

  function obterFaseSelecionada() {
    var id = faseSelecionadaId();
    if (!id) return null;
    return QuizData.carregarFases().find(function (f) { return f.id === id; }) || null;
  }

  function tipoPublicoSelecionado() {
    if (els.publicoBayer && els.publicoBayer.checked) return "bayer";
    if (els.publicoParceiro && els.publicoParceiro.checked) return "parceiro";
    return "";
  }

  function limparErros() {
    if (els.nome) {
      els.nome.classList.remove("campo-invalido");
      els.nome.removeAttribute("aria-invalid");
    }
    if (els.nomeErro) {
      els.nomeErro.hidden = true;
      els.nomeErro.textContent = "";
    }
    if (els.publicoErro) {
      els.publicoErro.hidden = true;
      els.publicoErro.textContent = "";
    }
    if (els.faseErro) {
      els.faseErro.hidden = true;
      els.faseErro.textContent = "";
    }
  }

  function jaParticipouNaFaseLocal(nome, tipo, faseId) {
    var chave = String(nome).trim().toLowerCase();
    return lerParticipacoes().some(function (p) {
      return (
        p.fase_id === faseId &&
        p.status === "concluida" &&
        String(p.participante_nome || "").trim().toLowerCase() === chave &&
        p.tipo_publico === tipo
      );
    });
  }

  function iniciarParticipacao(cadastro, fase) {
    var valid = QuizData.validarDistribuicaoFase(fase.id);
    if (!valid.ok) {
      anunciar(valid.mensagem);
      return false;
    }

    function seguir() {
      estado.nome = cadastro.nome;
      estado.tipoPublico = cadastro.tipoPublico;
      estado.empresa = cadastro.empresa || "";
      estado.matricula = cadastro.matricula || "";
      estado.fase = fase;
      estado.perguntas = QuizData.perguntasDaFase(fase.id, !!fase.embaralharPerguntas);
      estado.indice = 0;
      estado.selecionada = null;
      estado.respondida = false;
      estado.pontos = 0;
      estado.acertos = 0;
      estado.inicioMs = Date.now();
      estado.tempoSegundos = 0;
      estado.respostas = [];
      estado.participacaoId = Store ? Store.gerarUuid() : (
        "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
          var r = (Math.random() * 16) | 0;
          var v = c === "x" ? r : (r & 0x3) | 0x8;
          return v.toString(16);
        })
      );

      var registro = {
        id: estado.participacaoId,
        participante_nome: estado.nome,
        tipo_publico: estado.tipoPublico,
        empresa_parceira: estado.empresa,
        matricula: estado.matricula,
        fase_id: fase.id,
        fase_nome: fase.nome,
        data_evento: QuizData.dataEvento() || QuizStatus.agoraSP().dateStr,
        horario_inicio_fase: fase.horarioInicio,
        horario_fim_fase: fase.horarioFim,
        iniciado_em: new Date().toISOString(),
        finalizado_em: null,
        status: "em_andamento",
        quantidade_perguntas: 5,
        quantidade_acertos: 0,
        pontuacao: 0,
        tempo_total_segundos: 0
      };

      var salvar = Store
        ? Store.salvarRemoto(registro)
        : Promise.resolve({ ok: false, local: true });

      salvar.then(function (res) {
        if (!res.ok) {
          if (Store) Store.upsertLocal(registro);
          anunciar("Participação salva neste aparelho. Para sincronizar entre celulares, execute ATIVAR-NUVEM.sql no Supabase.");
        }
        mostrarTela(els.telaQuiz);
        renderizarPergunta();
      });
    }

    if (Store) {
      Store.jaParticipou(cadastro.nome, cadastro.tipoPublico, fase.id).then(function (res) {
        if (res.existe) {
          anunciar("Você já concluiu esta fase. Confira o ranking ou escolha outra fase.");
          return;
        }
        seguir();
      });
    } else if (jaParticipouNaFaseLocal(cadastro.nome, cadastro.tipoPublico, fase.id)) {
      anunciar("Você já concluiu esta fase. Confira o ranking ou escolha outra fase.");
      return false;
    } else {
      seguir();
    }
    return true;
  }

  function perguntaAtual() {
    return estado.perguntas[estado.indice];
  }

  function renderizarPergunta() {
    var p = perguntaAtual();
    if (!p || !estado.fase) return;
    if (!QuizStatus.fasePodeSerJogada(estado.fase.id)) {
      expirarParticipacao(
        "Esta fase foi pausada ou encerrada pelo administrador. Sua participação não foi incluída no ranking final."
      );
      return;
    }

    estado.selecionada = null;
    estado.respondida = false;
    estado.salvando = false;

    var n = estado.indice + 1;
    els.cabecalhoFase.textContent =
      estado.fase.nome.replace("Quiz do Almoço — ", "") +
      " — " +
      QuizStatus.formatarHorario(estado.fase.horarioInicio) +
      " às " +
      QuizStatus.formatarHorario(estado.fase.horarioFim);
    els.progresso.textContent = "Pergunta " + n + " de 5";
    els.meta.textContent =
      "Nível: " + QuizData.rotuloDificuldade(p.dificuldade) + " · Vale " + p.pontos + " pontos";
    els.tituloPergunta.textContent = p.enunciado;

    els.feedback.hidden = true;
    els.feedback.classList.remove("ok", "erro");
    els.feedbackStatus.textContent = "";
    els.feedbackTexto.textContent = "";
    els.btnConfirmar.hidden = false;
    els.btnConfirmar.disabled = true;
    els.btnConfirmar.textContent = "Confirmar resposta";
    els.btnProxima.hidden = true;
    els.btnProxima.disabled = true;
    els.btnProxima.textContent = n === 5 ? "Ver resultado" : "Próxima pergunta";

    els.listaAlternativas.innerHTML = "";
    p.alternativas.forEach(function (alt, indice) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "alternativa";
      btn.setAttribute("role", "radio");
      btn.setAttribute("aria-checked", "false");
      btn.tabIndex = indice === 0 ? 0 : -1;
      btn.id = "alt-" + indice;
      btn.setAttribute("data-indice", String(indice));
      btn.innerHTML =
        '<span class="letra-alternativa" aria-hidden="true">' +
        LETRAS[indice] +
        '</span><span class="texto-alternativa">' +
        escapar(alt.texto) +
        "</span>";
      btn.setAttribute("aria-label", "Alternativa " + LETRAS[indice] + ": " + alt.texto);
      btn.addEventListener("click", function () {
        selecionarAlternativa(indice);
      });
      btn.addEventListener("keydown", function (ev) {
        navegarAlternativas(ev, indice);
      });
      els.listaAlternativas.appendChild(btn);
    });

    requestAnimationFrame(function () {
      els.tituloPergunta.focus();
    });
    anunciar(
      "Pergunta " + n + " de 5. Nível " + QuizData.rotuloDificuldade(p.dificuldade) +
      ", vale " + p.pontos + " pontos. " + p.enunciado
    );
  }

  function botoesAlt() {
    return Array.prototype.slice.call(els.listaAlternativas.querySelectorAll(".alternativa"));
  }

  function selecionarAlternativa(indice) {
    if (estado.respondida) return;
    estado.selecionada = indice;
    botoesAlt().forEach(function (b, i) {
      var marcado = i === indice;
      b.setAttribute("aria-checked", marcado ? "true" : "false");
      b.tabIndex = marcado ? 0 : -1;
      b.classList.toggle("selecionada", marcado);
    });
    els.btnConfirmar.disabled = false;
    anunciar("Selecionada alternativa " + LETRAS[indice]);
  }

  function navegarAlternativas(ev, atual) {
    var total = 4;
    var prox = atual;
    if (ev.key === "ArrowDown" || ev.key === "ArrowRight") {
      ev.preventDefault();
      prox = (atual + 1) % total;
    } else if (ev.key === "ArrowUp" || ev.key === "ArrowLeft") {
      ev.preventDefault();
      prox = (atual - 1 + total) % total;
    } else if (ev.key === "Home") {
      ev.preventDefault();
      prox = 0;
    } else if (ev.key === "End") {
      ev.preventDefault();
      prox = total - 1;
    } else if (ev.key === " " || ev.key === "Enter") {
      ev.preventDefault();
      selecionarAlternativa(atual);
      return;
    } else return;
    selecionarAlternativa(prox);
    var b = botoesAlt()[prox];
    if (b) b.focus();
  }

  function confirmarResposta() {
    if (estado.respondida || estado.selecionada === null || estado.salvando) return;
    if (!QuizStatus.fasePodeSerJogada(estado.fase.id)) {
      expirarParticipacao(
        "Esta fase foi pausada ou encerrada pelo administrador. Sua participação não foi incluída no ranking final."
      );
      return;
    }

    var p = perguntaAtual();
    var escolhida = p.alternativas[estado.selecionada];
    estado.respondida = true;
    estado.salvando = true;
    els.btnConfirmar.disabled = true;
    els.btnConfirmar.textContent = "Salvando resposta...";

    var indiceCorreta = p.alternativas.findIndex(function (a) { return a.correta; });
    var correta = !!escolhida.correta;
    var pontos = correta ? p.pontos : 0;
    if (correta) {
      estado.pontos += pontos;
      estado.acertos += 1;
    }

    estado.respostas.push({
      pergunta_id: p.id,
      alternativa: LETRAS[estado.selecionada],
      correta: correta,
      pontos_obtidos: pontos
    });

    var botoes = botoesAlt();
    botoes.forEach(function (b, j) {
      b.disabled = true;
      b.tabIndex = -1;
      if (p.alternativas[j].correta) {
        b.classList.add("correta");
        var ok = document.createElement("span");
        ok.className = "selo selo-correta";
        ok.textContent = "Correta";
        b.querySelector(".texto-alternativa").appendChild(document.createElement("br"));
        b.querySelector(".texto-alternativa").appendChild(ok);
      } else if (j === estado.selecionada) {
        b.classList.add("incorreta");
        var er = document.createElement("span");
        er.className = "selo selo-incorreta";
        er.textContent = "Incorreta";
        b.querySelector(".texto-alternativa").appendChild(document.createElement("br"));
        b.querySelector(".texto-alternativa").appendChild(er);
      }
    });

    els.feedback.hidden = false;
    els.btnConfirmar.hidden = true;
    els.btnProxima.hidden = false;
    els.btnProxima.disabled = false;
    estado.salvando = false;

    if (correta) {
      els.feedback.classList.add("ok");
      els.feedback.classList.remove("erro");
      els.feedbackStatus.textContent = "Resposta correta!";
      els.feedbackTexto.textContent =
        "Você ganhou " + pontos + " pontos. " + p.explicacao +
        " Pontuação atual: " + estado.pontos + " de 90.";
      anunciar("Resposta correta! Você ganhou " + pontos + " pontos. " + p.explicacao);
    } else {
      els.feedback.classList.add("erro");
      els.feedback.classList.remove("ok");
      els.feedbackStatus.textContent = "Resposta incorreta";
      els.feedbackTexto.textContent =
        "A alternativa correta é " + LETRAS[indiceCorreta] + ": " +
        p.alternativas[indiceCorreta].texto + " " + p.explicacao +
        " Pontuação atual: " + estado.pontos + " de 90.";
      anunciar("Resposta incorreta. A correta é a alternativa " + LETRAS[indiceCorreta] + ". " + p.explicacao);
    }

    requestAnimationFrame(function () {
      els.btnProxima.focus();
    });
  }

  function proximaPergunta() {
    if (!estado.respondida) {
      anunciar("Confirme uma resposta antes de avançar.");
      return;
    }
    if (estado.indice < estado.perguntas.length - 1) {
      estado.indice += 1;
      renderizarPergunta();
      return;
    }
    finalizarParticipacao();
  }

  function atualizarParticipacaoLocal(patch) {
    if (!estado.participacaoId) return;
    if (Store) {
      var atual = lerParticipacoes().find(function (p) { return p.id === estado.participacaoId; }) || {
        id: estado.participacaoId
      };
      Store.upsertLocal(Object.assign({}, atual, patch));
      return;
    }
  }

  function finalizarParticipacao() {
    if (!QuizStatus.fasePodeSerJogada(estado.fase.id)) {
      expirarParticipacao(
        "Esta fase foi pausada ou encerrada pelo administrador. Sua participação não foi incluída no ranking final."
      );
      return;
    }

    estado.tempoSegundos = Math.max(1, Math.round((Date.now() - estado.inicioMs) / 1000));
    var finalizado = new Date().toISOString();
    var patch = {
      status: "concluida",
      finalizado_em: finalizado,
      pontuacao: estado.pontos,
      quantidade_acertos: estado.acertos,
      tempo_total_segundos: estado.tempoSegundos
    };
    atualizarParticipacaoLocal(patch);

    var promessa = Store
      ? Store.atualizarRemoto(estado.participacaoId, patch)
      : Promise.resolve({ ok: false });

    promessa.then(function (res) {
      if (!res.ok || !res.oficial) {
        anunciar("Resultado aguardando sincronização. Ele só entra no ranking oficial após confirmação no banco remoto.");
        if (els.msgRanking) {
          els.msgRanking.textContent = "Aguardando sincronização com a nuvem…";
        }
      } else {
        anunciar("Resultado gravado na nuvem. O ranking está sincronizado entre dispositivos.");
      }
      if (els.btnVerRanking && estado.fase) {
        els.btnVerRanking.href = "ranking.html?fase=" + encodeURIComponent(estado.fase.id);
      }
      mostrarResultado();
    });
  }

  function expirarParticipacao(mensagem) {
    var patch = {
      status: "expirada",
      finalizado_em: new Date().toISOString(),
      pontuacao: estado.pontos,
      quantidade_acertos: estado.acertos,
      tempo_total_segundos: Math.max(1, Math.round((Date.now() - estado.inicioMs) / 1000))
    };
    atualizarParticipacaoLocal(patch);
    if (Store && estado.participacaoId) {
      Store.atualizarRemoto(estado.participacaoId, patch);
    }
    mostrarTela(els.telaStatus);
    if (els.msgStatus) els.msgStatus.textContent = mensagem;
    if (els.blocoRankingStatus && estado.fase) {
      els.blocoRankingStatus.hidden = false;
      els.tituloRankingStatus.textContent = "Ranking final — " + estado.fase.nome;
      carregarRankingFase(estado.fase.id, function (ranking) {
        renderizarListaRanking(els.listaRankingStatus, ranking);
      });
    }
    anunciar(mensagem);
  }

  function mostrarResultado() {
    mostrarTela(els.telaResultado);
    var st = QuizStatus.obterEstadoQuiz();
    var parcial = st.liberado && st.faseAtiva && estado.fase && st.faseAtiva.id === estado.fase.id;

    if (els.resultadoFase) els.resultadoFase.textContent = estado.fase.nome;
    if (els.resultadoPontos) els.resultadoPontos.textContent = "Você fez " + estado.pontos + " de 90 pontos";
    if (els.resultadoAcertos) els.resultadoAcertos.textContent = estado.acertos + " de 5 respostas corretas";
    if (els.resultadoTempo) els.resultadoTempo.textContent = "Tempo total: " + formatarTempo(estado.tempoSegundos);
    if (els.resumoResultado) {
      els.resumoResultado.textContent =
        "Obrigado, " + estado.nome + "! Sua participação na " + estado.fase.nome + " foi registrada.";
    }
    if (els.msgRanking) els.msgRanking.textContent = "Atualizando ranking compartilhado...";
    if (els.tituloRanking) {
      els.tituloRanking.textContent = (parcial ? "Ranking parcial — " : "Ranking final — ") + estado.fase.nome;
    }
    if (els.suaPosicaoExtra) els.suaPosicaoExtra.hidden = true;
    if (els.btnVerRanking && estado.fase) {
      els.btnVerRanking.href = "ranking.html?fase=" + encodeURIComponent(estado.fase.id);
    }

    carregarRankingFase(estado.fase.id, function (ranking) {
      var pos = ranking.findIndex(function (r) { return r.id === estado.participacaoId; }) + 1;
      if (els.resultadoPosicao) {
        els.resultadoPosicao.textContent = pos > 0
          ? "Sua posição atual: " + pos + "º lugar"
          : "Posição: aguardando sincronização";
      }
      els.msgRanking.classList.remove("entrou", "fora");
      if (pos > 0 && pos <= 10) {
        els.msgRanking.classList.add("entrou");
        els.msgRanking.textContent = "Você está na posição " + pos + "ª no ranking desta fase.";
      } else if (pos > 10) {
        els.msgRanking.classList.add("fora");
        els.msgRanking.textContent = "Confira o Top 10 e a sua posição abaixo.";
        if (els.suaPosicaoExtra) {
          els.suaPosicaoExtra.hidden = false;
          els.suaPosicaoExtra.textContent =
            "Sua posição: " + pos + "º — " + estado.pontos + " pontos — " +
            estado.acertos + " de 5 acertos.";
        }
      } else {
        els.msgRanking.textContent = "Ranking da " + estado.fase.nome + ".";
      }
      renderizarTabelaRanking(els.corpoRanking, ranking, {
        meuId: estado.participacaoId,
        limite: 10
      });
      anunciar((els.resumoResultado ? els.resumoResultado.textContent + " " : "") + els.msgRanking.textContent);
    });

    if (Store) {
      Store.assinarRealtime({ faseId: estado.fase.id });
      Store.onEvento(function (evento) {
        if (evento !== "realtime" || els.telaResultado.hidden) return;
        if (els.avisoRankingLive) {
          els.avisoRankingLive.hidden = false;
          els.avisoRankingLive.textContent = "Ranking atualizado";
        }
        carregarRankingFase(estado.fase.id, function (ranking) {
          var pos = ranking.findIndex(function (r) { return r.id === estado.participacaoId; }) + 1;
          if (els.resultadoPosicao && pos > 0) {
            els.resultadoPosicao.textContent = "Sua posição atual: " + pos + "º lugar";
          }
          renderizarTabelaRanking(els.corpoRanking, ranking, {
            meuId: estado.participacaoId,
            limite: 10
          });
        });
      });
    }

    requestAnimationFrame(function () {
      if (els.tituloResultado) els.tituloResultado.focus();
    });
  }

  function htmlBotaoOuvir() {
    return (
      '<svg class="icone-audio" width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
      '<path fill="currentColor" d="M3 10v4h4l5 5V5L7 10H3zm13.5 2a3.5 3.5 0 0 0-1.75-3.03v6.06A3.5 3.5 0 0 0 16.5 12zM14 4.17v2.06a6 6 0 0 1 0 11.54v2.06A8 8 0 0 0 14 4.17z"/>' +
      "</svg> Ouvir pergunta"
    );
  }

  function htmlBotaoPararAudio() {
    return (
      '<svg class="icone-audio" width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
      '<rect x="6" y="6" width="12" height="12" rx="1" fill="currentColor"/>' +
      "</svg> Parar áudio"
    );
  }

  function falarPergunta() {
    if (!("speechSynthesis" in window)) {
      anunciar("Seu navegador não oferece síntese de voz.");
      return;
    }
    if (estado.ouvindoAudio) {
      window.speechSynthesis.cancel();
      estado.ouvindoAudio = false;
      els.btnOuvir.innerHTML = htmlBotaoOuvir();
      els.btnOuvir.setAttribute("aria-label", "Ouvir pergunta e alternativas");
      anunciar("Áudio interrompido.");
      return;
    }
    var p = perguntaAtual();
    if (!p) return;
    var partes = [
      "Pergunta " + (estado.indice + 1) + " de 5.",
      "Nível " + QuizData.rotuloDificuldade(p.dificuldade) + ", vale " + p.pontos + " pontos.",
      p.enunciado
    ];
    p.alternativas.forEach(function (a, i) {
      partes.push("Alternativa " + LETRAS[i] + ": " + a.texto);
    });
    window.speechSynthesis.cancel();
    var u = new SpeechSynthesisUtterance(partes.join(" "));
    u.lang = "pt-BR";
    u.onend = function () {
      estado.ouvindoAudio = false;
      els.btnOuvir.innerHTML = htmlBotaoOuvir();
      els.btnOuvir.setAttribute("aria-label", "Ouvir pergunta e alternativas");
    };
    estado.ouvindoAudio = true;
    els.btnOuvir.innerHTML = htmlBotaoPararAudio();
    els.btnOuvir.setAttribute("aria-label", "Parar áudio");
    window.speechSynthesis.speak(u);
    anunciar("Lendo a pergunta em voz alta.");
  }

  // Voz (comandos) — mantido simplificado
  function sincronizarBotoesVoz() {
    var texto = estado.vozAtiva ? "Ouvindo comando..." : "Ativar comando por voz";
    var pressed = estado.vozAtiva ? "true" : "false";
    [els.btnVoz, els.btnVozGlobal].forEach(function (b) {
      if (!b) return;
      b.setAttribute("aria-pressed", pressed);
      b.textContent = texto;
    });
  }

  function encerrarEscutaVoz() {
    estado.vozAtiva = false;
    estado.reconhecimentoIniciando = false;
    sincronizarBotoesVoz();
  }

  function processarComandoVoz(texto) {
    var cmd = String(texto || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    if (!els.telaQuiz.hidden) {
      if (cmd.indexOf("ler pergunta") !== -1 || cmd.indexOf("ouvir") !== -1) {
        falarPergunta();
        return;
      }
      if (cmd.indexOf("alternativa um") !== -1 || cmd.indexOf("alternativa 1") !== -1) return selecionarAlternativa(0);
      if (cmd.indexOf("alternativa dois") !== -1 || cmd.indexOf("alternativa 2") !== -1) return selecionarAlternativa(1);
      if (cmd.indexOf("alternativa tres") !== -1 || cmd.indexOf("alternativa 3") !== -1) return selecionarAlternativa(2);
      if (cmd.indexOf("alternativa quatro") !== -1 || cmd.indexOf("alternativa 4") !== -1) return selecionarAlternativa(3);
      if (cmd.indexOf("confirmar") !== -1) return confirmarResposta();
      if (cmd.indexOf("proxima") !== -1) return proximaPergunta();
    }
    if (!els.telaInicio.hidden && (cmd.indexOf("comecar") !== -1 || cmd.indexOf("iniciar") !== -1)) {
      if (els.form) els.form.requestSubmit();
    }
  }

  function alternarVoz() {
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      anunciar("Navegador incompatível com comando por voz. Use teclado, mouse ou Ouvir pergunta.");
      return;
    }
    if (estado.vozAtiva || estado.reconhecimentoIniciando) {
      estado.vozSolicitadaPelaPessoa = false;
      try { estado.reconhecimento && estado.reconhecimento.abort(); } catch (e) { /* */ }
      encerrarEscutaVoz();
      anunciar("Comando por voz encerrado.");
      return;
    }
    estado.vozSolicitadaPelaPessoa = true;
    estado.reconhecimentoIniciando = true;
    var rec = new SR();
    estado.reconhecimento = rec;
    rec.lang = "pt-BR";
    rec.continuous = false;
    rec.interimResults = false;
    rec.onstart = function () {
      estado.vozAtiva = true;
      estado.reconhecimentoIniciando = false;
      sincronizarBotoesVoz();
      anunciar("Ouvindo comando.");
    };
    rec.onresult = function (ev) {
      var t = ev.results && ev.results[0] && ev.results[0][0] ? ev.results[0][0].transcript : "";
      if (t) processarComandoVoz(t);
    };
    rec.onerror = function () {
      estado.vozSolicitadaPelaPessoa = false;
      encerrarEscutaVoz();
      anunciar("Não foi possível usar o comando por voz agora.");
    };
    rec.onend = function () {
      estado.vozSolicitadaPelaPessoa = false;
      encerrarEscutaVoz();
    };
    try {
      rec.start();
    } catch (e) {
      estado.reconhecimentoIniciando = false;
      encerrarEscutaVoz();
      anunciar("Serviço de reconhecimento indisponível.");
    }
  }

  // Eventos
  if (els.publicoBayer) {
    els.publicoBayer.addEventListener("change", function () {
      if (els.campoEmpresa) els.campoEmpresa.hidden = true;
    });
  }
  if (els.publicoParceiro) {
    els.publicoParceiro.addEventListener("change", function () {
      if (els.campoEmpresa) els.campoEmpresa.hidden = false;
    });
  }

  if (els.form) {
    els.form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      limparErros();
      var st = QuizStatus.obterEstadoQuiz();
      if (!st.liberado) {
        atualizarInterfacePorStatus();
        anunciar(st.mensagem || "Quiz indisponível no momento.");
        return;
      }
      var fase = obterFaseSelecionada();
      var nome = els.nome ? els.nome.value.trim() : "";
      var tipo = tipoPublicoSelecionado();
      var ok = true;
      if (!fase || !QuizStatus.fasePodeSerJogada(fase.id)) {
        if (els.faseErro) {
          els.faseErro.hidden = false;
          els.faseErro.textContent = "Selecione uma fase disponível.";
        }
        ok = false;
      }
      if (!nome) {
        if (els.nome) {
          els.nome.classList.add("campo-invalido");
          els.nome.setAttribute("aria-invalid", "true");
        }
        if (els.nomeErro) {
          els.nomeErro.hidden = false;
          els.nomeErro.textContent = "Informe o nome completo.";
        }
        ok = false;
      }
      if (!tipo) {
        if (els.publicoErro) {
          els.publicoErro.hidden = false;
          els.publicoErro.textContent = "Selecione o tipo de público.";
        }
        ok = false;
      }
      if (!ok) {
        anunciar("Selecione a fase, informe o nome e o tipo de público para começar.");
        return;
      }
      iniciarParticipacao(
        {
          nome: nome,
          tipoPublico: tipo,
          empresa: els.empresa ? els.empresa.value.trim() : "",
          matricula: els.matricula ? els.matricula.value.trim() : ""
        },
        fase
      );
    });
  }

  if (els.btnConfirmar) els.btnConfirmar.addEventListener("click", confirmarResposta);
  if (els.btnProxima) els.btnProxima.addEventListener("click", proximaPergunta);
  if (els.btnOuvir) els.btnOuvir.addEventListener("click", falarPergunta);
  if (els.btnVoz) els.btnVoz.addEventListener("click", alternarVoz);
  if (els.btnVozGlobal) els.btnVozGlobal.addEventListener("click", alternarVoz);
  if (els.btnJogarNovamente) {
    els.btnJogarNovamente.addEventListener("click", function () {
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
      atualizarInterfacePorStatus();
      anunciar("Pronto para uma nova participação, se a fase estiver liberada.");
    });
  }

  // Seed inicial
  if (!localStorage.getItem(QuizData.STORAGE_PERGUNTAS)) {
    QuizData.salvarPerguntas(QuizData.PERGUNTAS_PADRAO);
  }
  if (!localStorage.getItem(QuizData.STORAGE_FASES)) {
    QuizData.salvarFases(QuizData.FASES_PADRAO);
  }
  if (!QuizData.dataEvento()) {
    QuizData.salvarDataEvento(QuizStatus.agoraSP().dateStr);
  }

  atualizarInterfacePorStatus();
  if (Store) {
    Store.statusNuvem().then(function (st) {
      if (!st.ok) {
        console.warn("[Quiz ENABLE] Nuvem offline:", st.motivo);
      } else {
        Store.buscarRemoto({});
      }
    });
  }
  setInterval(function () {
    if (!els.telaQuiz.hidden) {
      if (estado.fase && !QuizStatus.fasePodeSerJogada(estado.fase.id) && estado.participacaoId && estado.indice < 5) {
        expirarParticipacao(
          "Esta fase foi pausada ou encerrada pelo administrador. Sua participação não foi incluída no ranking final."
        );
      }
      return;
    }
    if (!els.telaResultado.hidden) return;
    atualizarInterfacePorStatus();
  }, 15000);
})();
