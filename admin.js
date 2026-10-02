/**
 * Painel administrador — Quiz ENABLE (3 fases)
 */
(function () {
  "use strict";

  var SENHA_PADRAO = "enable2026";
  var STORAGE_AUTH = "quizEnableAdminAuth";
  var STORAGE_AUDIT = "quizEnableAuditoria";
  var STORAGE_EXPORT = "quizEnableHistoricoExport";
  var STORAGE_SENHA = "quizEnableAdminSenha";
  var Store = window.QuizStore;

  var editandoPublicoId = null;
  var editandoExcluirId = null;
  var dadosRemotosOk = false;

  var els = {
    login: document.getElementById("tela-login"),
    painel: document.getElementById("painel"),
    formLogin: document.getElementById("form-login"),
    senha: document.getElementById("senha-admin"),
    erroLogin: document.getElementById("erro-login"),
    btnSair: document.getElementById("btn-sair"),
    btnExportar: document.getElementById("btn-exportar"),
    btnSyncNuvem: document.getElementById("btn-sync-nuvem"),
    statusQuiz: document.getElementById("status-quiz-admin"),
    statusSync: document.getElementById("status-sincronizacao"),
    avisoAcoes: document.getElementById("aviso-acoes-criticas"),
    cards: document.getElementById("cards-indicadores"),
    listaFases: document.getElementById("lista-fases"),
    listaPerguntas: document.getElementById("lista-perguntas"),
    tabelaResultados: document.querySelector("#tabela-resultados tbody"),
    contadorResultados: document.getElementById("contador-resultados"),
    tabelaRanking: document.querySelector("#tabela-ranking-admin tbody"),
    modalExport: document.getElementById("modal-export"),
    resumoExport: document.getElementById("resumo-export"),
    formatoExport: document.getElementById("formato-export"),
    confirmarExport: document.getElementById("confirmar-export"),
    cancelarExport: document.getElementById("cancelar-export"),
    modalAuditoria: document.getElementById("modal-auditoria"),
    resumoAuditoria: document.getElementById("resumo-auditoria"),
    novoPublico: document.getElementById("novo-publico"),
    motivoAuditoria: document.getElementById("motivo-auditoria"),
    confirmarAuditoria: document.getElementById("confirmar-auditoria"),
    cancelarAuditoria: document.getElementById("cancelar-auditoria")
  };

  function setStatusSync(texto, tipo) {
    if (!els.statusSync) return;
    els.statusSync.textContent = texto;
    els.statusSync.className = "status-sync" + (tipo ? " " + tipo : "");
  }

  function atualizarDisponibilidadeAcoes(ok, opcoes) {
    opcoes = opcoes || {};
    if (typeof ok === "boolean") dadosRemotosOk = ok;
    var mostrarAviso = !dadosRemotosOk && !opcoes.reconectando;
    if (els.avisoAcoes) els.avisoAcoes.hidden = !mostrarAviso;
    document.querySelectorAll("[data-excluir], [data-restaurar]").forEach(function (btn) {
      btn.disabled = !dadosRemotosOk;
      if (!dadosRemotosOk) btn.title = "Indisponível sem conexão com os dados";
      else btn.removeAttribute("title");
    });
  }

  function autenticado() {
    return sessionStorage.getItem(STORAGE_AUTH) === "1";
  }

  function senhaEsperada() {
    var salva = localStorage.getItem(STORAGE_SENHA);
    if (salva && salva.trim()) return salva.trim();
    return SENHA_PADRAO;
  }

  function senhaValida(digitada) {
    var valor = String(digitada || "").trim();
    if (!valor) return false;
    if (valor === senhaEsperada()) return true;
    if (valor === SENHA_PADRAO) {
      localStorage.setItem(STORAGE_SENHA, SENHA_PADRAO);
      return true;
    }
    return false;
  }

  function mostrarPainel(ok) {
    els.login.hidden = ok;
    els.painel.hidden = !ok;
    if (ok) {
      if (Store) Store.assinarRealtime({});
      atualizarTudo();
    }
  }

  function normalizarParticipacao(p) {
    if (!p || typeof p !== "object") return p;
    return {
      id: p.id,
      participanteNome: p.participanteNome || p.participante_nome || p.nomeCompleto || p.nome || "",
      nomeCompleto: p.nomeCompleto || p.participante_nome || p.participanteNome || p.nome || "",
      tipoPublico: p.tipoPublico || p.tipo_publico || "",
      empresaParceira: p.empresaParceira || p.empresa_parceira || p.empresa || "",
      email: p.email || "",
      matricula: p.matricula || "",
      faseId: p.faseId || p.fase_id || "",
      faseNome: p.faseNome || p.fase_nome || "",
      dataEvento: p.dataEvento || p.data_evento || "",
      horarioInicioFase: p.horarioInicioFase || p.horario_inicio_fase || "",
      horarioFimFase: p.horarioFimFase || p.horario_fim_fase || "",
      iniciadoEm: p.iniciadoEm || p.iniciado_em || "",
      finalizadoEm: p.finalizadoEm || p.finalizado_em || "",
      status: p.status || "",
      quantidadePerguntas: Number(p.quantidadePerguntas != null ? p.quantidadePerguntas : p.quantidade_perguntas) || 5,
      quantidadeAcertos: Number(p.quantidadeAcertos != null ? p.quantidadeAcertos : p.quantidade_acertos) || 0,
      pontuacao: Number(p.pontuacao != null ? p.pontuacao : p.pontos) || 0,
      tempoTotalSegundos: Number(p.tempoTotalSegundos != null ? p.tempoTotalSegundos : p.tempo_total_segundos) || 0,
      posicaoRanking: p.posicaoRanking || p.posicao_ranking || null,
      excluida: !!(p.excluida || p.status === "excluida"),
      excluidaEm: p.excluidaEm || p.excluida_em || null,
      motivoExclusao: p.motivoExclusao || p.motivo_exclusao || null,
      _raw: p
    };
  }

  function carregarParticipacoes() {
    var lista = Store ? Store.lerCache() : [];
    return lista.map(normalizarParticipacao);
  }

  function salvarParticipacoes(lista) {
    if (Store) {
      localStorage.setItem(Store.STORAGE_CACHE, JSON.stringify((lista || []).map(function (p) {
        return Store.normalizar({
          id: p.id,
          participante_nome: p.participanteNome,
          tipo_publico: p.tipoPublico,
          empresa_parceira: p.empresaParceira,
          matricula: p.matricula,
          fase_id: p.faseId,
          fase_nome: p.faseNome,
          data_evento: p.dataEvento,
          iniciado_em: p.iniciadoEm,
          finalizado_em: p.finalizadoEm,
          status: p.status,
          quantidade_perguntas: p.quantidadePerguntas,
          quantidade_acertos: p.quantidadeAcertos,
          pontuacao: p.pontuacao,
          tempo_total_segundos: p.tempoTotalSegundos,
          posicao_ranking: p.posicaoRanking
        });
      })));
      return;
    }
  }

  function sincronizarNuvem(callback, opcoes) {
    opcoes = opcoes || {};
    if (!Store) {
      setStatusSync("Sem conexão com os dados", "erro");
      atualizarDisponibilidadeAcoes(false);
      if (callback) callback(false);
      return;
    }
    setStatusSync("Reconectando...", "aviso");
    atualizarDisponibilidadeAcoes(dadosRemotosOk, { reconectando: true });
    Store.statusNuvem().then(function (st) {
      if (!st.ok) {
        setStatusSync("Sem conexão com os dados", "erro");
        atualizarDisponibilidadeAcoes(false);
        if (callback) callback(false, st.codigo);
        return;
      }
      // Publicar pendentes só sob demanda (botão Atualizar), para não travar o painel
      var devePublicar = opcoes.publicar === true;
      var publicar = (devePublicar && Store.publicarPendentes)
        ? Store.publicarPendentes()
        : Promise.resolve({ ok: true });
      publicar.then(function () {
        return Store.buscarRemoto({ incluirExcluidas: true });
      }).then(function (res) {
        if (res && res.ok) {
          setStatusSync("Dados sincronizados", "ok");
          atualizarDisponibilidadeAcoes(true);
        } else {
          setStatusSync("Sem conexão com os dados", "erro");
          atualizarDisponibilidadeAcoes(false);
        }
        if (callback) callback(!!(res && res.ok));
      }).catch(function () {
        setStatusSync("Sem conexão com os dados", "erro");
        atualizarDisponibilidadeAcoes(false);
        if (callback) callback(false);
      });
    }).catch(function () {
      setStatusSync("Sem conexão com os dados", "erro");
      atualizarDisponibilidadeAcoes(false);
      if (callback) callback(false);
    });
  }

  function registrarAuditoria(registro) {
    var lista = [];
    try {
      lista = JSON.parse(localStorage.getItem(STORAGE_AUDIT) || "[]");
    } catch (e) { /* ignore */ }
    lista.unshift(Object.assign({
      id: "aud-" + Date.now(),
      administradorId: "admin-local",
      criadoEm: new Date().toISOString()
    }, registro));
    localStorage.setItem(STORAGE_AUDIT, JSON.stringify(lista.slice(0, 500)));
  }

  function registrarExport(registro) {
    var lista = [];
    try {
      lista = JSON.parse(localStorage.getItem(STORAGE_EXPORT) || "[]");
    } catch (e) { /* ignore */ }
    lista.unshift(Object.assign({
      id: "exp-" + Date.now(),
      administradorId: "admin-local",
      criadoEm: new Date().toISOString()
    }, registro));
    localStorage.setItem(STORAGE_EXPORT, JSON.stringify(lista.slice(0, 200)));
  }

  function filtrosAtivos() {
    return {
      data: document.getElementById("filtro-data").value || "",
      fase: document.getElementById("filtro-fase").value,
      publico: document.getElementById("filtro-publico").value,
      status: document.getElementById("filtro-status").value,
      contagem: document.getElementById("filtro-contagem").value
    };
  }

  function filtrarParticipacoes(base) {
    var f = filtrosAtivos();
    var exibirExcluidos = !!(document.getElementById("filtro-exibir-excluidos") &&
      document.getElementById("filtro-exibir-excluidos").checked);
    var lista = (base || carregarParticipacoes()).slice();
    return lista.filter(function (p) {
      if (f.data && p.dataEvento !== f.data) return false;
      if (f.fase !== "todas" && p.faseId !== f.fase) return false;
      if (f.publico !== "todos" && p.tipoPublico !== f.publico) return false;
      if (f.status === "excluida") return p.status === "excluida" || p.excluida;
      if (!exibirExcluidos && (p.status === "excluida" || p.excluida)) return false;
      if (f.status !== "todas" && f.status !== "excluida" && p.status !== f.status) return false;
      return true;
    });
  }

  function chaveUnica(p) {
    return (p.email || p.matricula || p.nomeCompleto || p.participanteNome || "").toLowerCase().trim();
  }

  function unicos(lista) {
    var mapa = {};
    lista.forEach(function (p) {
      var k = chaveUnica(p);
      if (k && !mapa[k]) mapa[k] = p;
    });
    return Object.keys(mapa).map(function (k) { return mapa[k]; });
  }

  function media(lista, campo) {
    if (!lista.length) return 0;
    var soma = lista.reduce(function (acc, p) { return acc + (Number(p[campo]) || 0); }, 0);
    return Math.round((soma / lista.length) * 10) / 10;
  }

  function formatarTempo(seg) {
    seg = Number(seg) || 0;
    var m = Math.floor(seg / 60);
    var s = seg % 60;
    return String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
  }

  function labelPublico(t) {
    return t === "bayer" ? "Bayer" : "Parceiro";
  }

  function labelStatus(s, p) {
    if ((p && (p.excluida || p.status === "excluida")) || s === "excluida") {
      return "Excluída";
    }
    var map = {
      concluida: "Concluída",
      em_andamento: "Em andamento",
      incompleta: "Incompleta",
      expirada: "Expirada",
      cancelada: "Cancelada"
    };
    return map[s] || s;
  }

  function labelDif(d) {
    return { facil: "Fácil", intermediaria: "Intermediária", dificil: "Difícil" }[d] || d;
  }

  function metricas(listaFiltrada) {
    var iniciadas = carregarParticipacoes().filter(function (p) {
      var f = filtrosAtivos();
      if (f.data && p.dataEvento !== f.data) return false;
      if (f.fase !== "todas" && p.faseId !== f.fase) return false;
      if (f.publico !== "todos" && p.tipoPublico !== f.publico) return false;
      return true;
    });
    var concluidas = listaFiltrada.filter(function (p) { return p.status === "concluida"; });
    var base = filtrosAtivos().status === "concluida" || filtrosAtivos().status === "todas"
      ? (filtrosAtivos().status === "concluida" ? concluidas : listaFiltrada)
      : listaFiltrada;
    var bayer = base.filter(function (p) { return p.tipoPublico === "bayer"; });
    var parc = base.filter(function (p) { return p.tipoPublico === "parceiro"; });
    var total = base.length;
    var unicosLista = unicos(base);
    var taxa = iniciadas.length
      ? Math.round((concluidas.length / iniciadas.length) * 1000) / 10
      : 0;

    return {
      total: total,
      bayer: bayer.length,
      parceiros: parc.length,
      pctBayer: total ? Math.round((bayer.length / total) * 1000) / 10 : 0,
      pctParceiros: total ? Math.round((parc.length / total) * 1000) / 10 : 0,
      unicos: unicosLista.length,
      taxa: taxa,
      mediaGeral: media(concluidas.length ? concluidas : base.filter(function (p) { return p.status === "concluida"; }), "pontuacao"),
      mediaBayer: media(concluidas.filter(function (p) { return p.tipoPublico === "bayer"; }), "pontuacao"),
      mediaParceiros: media(concluidas.filter(function (p) { return p.tipoPublico === "parceiro"; }), "pontuacao"),
      base: base,
      concluidas: concluidas,
      iniciadas: iniciadas
    };
  }

  function renderCards() {
    var m = metricas(filtrarParticipacoes());
    var modoUnicos = filtrosAtivos().contagem === "unicos";
    var total = modoUnicos ? m.unicos : m.total;
    var bayer = modoUnicos
      ? unicos(m.base.filter(function (p) { return p.tipoPublico === "bayer"; })).length
      : m.bayer;
    var parc = modoUnicos
      ? unicos(m.base.filter(function (p) { return p.tipoPublico === "parceiro"; })).length
      : m.parceiros;
    var denom = total || 1;

    els.cards.innerHTML =
      card("Total de participações", total, modoUnicos ? "participantes únicos" : "registros filtrados") +
      card("Participantes Bayer", bayer, (Math.round((bayer / denom) * 1000) / 10) + "% do total") +
      card("Participantes parceiros", parc, (Math.round((parc / denom) * 1000) / 10) + "% do total") +
      card("Participantes únicos", m.unicos, "pessoas distintas") +
      card("Taxa de conclusão", m.taxa + "%", "concluídas / iniciadas") +
      card("Pontuação média", m.mediaGeral, "Bayer: " + m.mediaBayer + " · Parceiros: " + m.mediaParceiros);
  }

  function card(titulo, valor, detalhe) {
    return (
      '<article class="card-indicador">' +
      "<h3>" + titulo + "</h3>" +
      '<p class="valor">' + valor + "</p>" +
      "<p class=\"detalhe\">" + detalhe + "</p>" +
      "</article>"
    );
  }

  function barra(label, valor, max, textoExtra) {
    var pct = max ? Math.max(4, Math.round((valor / max) * 100)) : 0;
    return (
      '<div class="barra-item">' +
      "<div class=\"barra-meta\"><span>" + label + "</span><strong>" + valor + (textoExtra || "") + "</strong></div>" +
      '<div class="barra-track" aria-hidden="true"><span style="width:' + pct + '%"></span></div>' +
      "</div>"
    );
  }

  function renderGraficos() {
    var m = metricas(filtrarParticipacoes());
    var maxPub = Math.max(m.bayer, m.parceiros, 1);
    document.getElementById("grafico-publico").innerHTML =
      barra("Bayer", m.bayer, maxPub, " (" + m.pctBayer + "%)") +
      barra("Parceiros", m.parceiros, maxPub, " (" + m.pctParceiros + "%)");

    var fases = ["fase-1", "fase-2", "fase-3"];
    var htmlFases = "";
    var maxF = 1;
    fases.forEach(function (id) {
      var n = m.base.filter(function (p) { return p.faseId === id; }).length;
      if (n > maxF) maxF = n;
    });
    fases.forEach(function (id, i) {
      var b = m.base.filter(function (p) { return p.faseId === id && p.tipoPublico === "bayer"; }).length;
      var pr = m.base.filter(function (p) { return p.faseId === id && p.tipoPublico === "parceiro"; }).length;
      htmlFases += "<p class=\"grafico-titulo\">Fase " + (i + 1) + "</p>";
      htmlFases += barra("Bayer", b, maxF);
      htmlFases += barra("Parceiros", pr, maxF);
    });
    document.getElementById("grafico-fases").innerHTML = htmlFases;

    var maxMedia = Math.max(m.mediaBayer, m.mediaParceiros, 1);
    document.getElementById("grafico-desempenho").innerHTML =
      barra("Média Bayer", m.mediaBayer, maxMedia, " pts") +
      barra("Média parceiros", m.mediaParceiros, maxMedia, " pts");

    var todas = carregarParticipacoes();
    var f = filtrosAtivos();
    var htmlConc = "";
    fases.forEach(function (id, i) {
      var grupo = todas.filter(function (p) {
        if (p.faseId !== id) return false;
        if (f.data && p.dataEvento !== f.data) return false;
        if (f.publico !== "todos" && p.tipoPublico !== f.publico) return false;
        return true;
      });
      var ini = grupo.length;
      var conc = grupo.filter(function (p) { return p.status === "concluida"; }).length;
      var inc = grupo.filter(function (p) { return p.status === "incompleta"; }).length;
      var exp = grupo.filter(function (p) { return p.status === "expirada"; }).length;
      var max = Math.max(ini, 1);
      htmlConc += "<p class=\"grafico-titulo\">Fase " + (i + 1) + "</p>";
      htmlConc += barra("Iniciadas", ini, max);
      htmlConc += barra("Concluídas", conc, max);
      htmlConc += barra("Incompletas", inc, max);
      htmlConc += barra("Expiradas", exp, max);
    });
    document.getElementById("grafico-conclusao").innerHTML = htmlConc;
  }

  function renderFases() {
    var fases = QuizData.carregarFases();
    var perguntas = QuizData.carregarPerguntas();
    var parts = carregarParticipacoes();
    var html = "";

    fases.forEach(function (fase) {
      var val = QuizData.validarDistribuicaoFase(fase.id, perguntas);
      var qtd = perguntas.filter(function (p) { return p.faseId === fase.id && p.status === "ativa"; }).length;
      var participantes = parts.filter(function (p) {
        return p.faseId === fase.id && p.status === "concluida";
      }).length;
      var nomeFaseCurto = fase.ordem === 1 ? "Fase 1" : fase.ordem === 2 ? "Fase 2" : "Fase 3";
      var msgVal = val.ok
        ? "Distribuição válida para liberação."
        : "A " + nomeFaseCurto + " não pode ser liberada: são necessárias exatamente 2 perguntas fáceis, 2 intermediárias e 1 difícil.";

      html +=
        '<article class="card-fase" data-fase="' + fase.id + '">' +
        "<h3>" + fase.nome + "</h3>" +
        "<ul class=\"meta-fase\">" +
        "<li><strong>Horário (identificação):</strong> " + fase.horarioInicio + " – " + fase.horarioFim + "</li>" +
        "<li><strong>Status admin:</strong> " + (fase.status || "agendada") +
        (fase.pausadaManual ? " (pausada)" : "") +
        (fase.ativaManual ? " (destaque manual)" : "") +
        (fase.rankingCongelado ? " · ranking congelado" : "") +
        "</li>" +
        "<li><strong>Disponível para jogar:</strong> " +
        (QuizStatus.faseDisponivel(fase) ? "Sim" : "Não") + "</li>" +
        "<li><strong>Perguntas ativas:</strong> " + qtd + " / 5</li>" +
        "<li><strong>Distribuição:</strong> " +
        (val.faceis || 0) + " fáceis · " +
        (val.intermediarias || 0) + " intermediárias · " +
        (val.dificeis || 0) + " difíceis</li>" +
        "<li><strong>Pontuação máxima:</strong> 90</li>" +
        "<li><strong>Participantes concluídos:</strong> " + participantes + "</li>" +
        "</ul>" +
        '<p class="ajuda-fase">O horário não bloqueia o início do quiz; serve só para identificar a fase.</p>' +
        (val.ok
          ? '<p class="ok-msg">' + msgVal + "</p>"
          : '<p class="erro-msg">' + msgVal + "</p>") +
        '<div class="acoes-fase">' +
        '<button type="button" class="btn btn-secundario" data-acao="editar-horario">Editar identificação de horário</button>' +
        '<button type="button" class="btn btn-primario" data-acao="liberar">Disponibilizar fase</button>' +
        '<button type="button" class="btn btn-secundario" data-acao="pausar">Pausar</button>' +
        '<button type="button" class="btn btn-secundario" data-acao="reabrir">Reabrir</button>' +
        '<button type="button" class="btn btn-secundario" data-acao="encerrar">Encerrar</button>' +
        '<button type="button" class="btn btn-secundario" data-acao="ver-ranking">Ver ranking</button>' +
        '<button type="button" class="btn btn-secundario" data-acao="zerar">Zerar ranking</button>' +
        '<button type="button" class="btn btn-secundario" data-acao="exportar-fase">Exportar ranking</button>' +
        "</div></article>";
    });

    els.listaFases.innerHTML = html;
  }

  function renderPerguntas() {
    var fase = document.getElementById("filtro-perg-fase").value;
    var status = document.getElementById("filtro-perg-status").value;
    var dif = document.getElementById("filtro-perg-dif").value;
    var lista = QuizData.carregarPerguntas().filter(function (p) {
      if (fase === "reserva") {
        if (p.status !== "reserva" && p.faseId) return false;
        if (p.status !== "reserva" && fase === "reserva") {
          if (p.status !== "reserva") return false;
        }
      } else if (fase !== "todas" && p.faseId !== fase) return false;
      if (status !== "todas" && p.status !== status) return false;
      if (dif !== "todas" && p.dificuldade !== dif) return false;
      return true;
    });

    var grupos = {
      "fase-1": "Perguntas da Fase 1",
      "fase-2": "Perguntas da Fase 2",
      "fase-3": "Perguntas da Fase 3",
      reserva: "Banco de perguntas reserva"
    };

    var html = "";
    Object.keys(grupos).forEach(function (chave) {
      var itens = lista.filter(function (p) {
        if (chave === "reserva") return p.status === "reserva" || !p.faseId;
        return p.faseId === chave;
      });
      if (!itens.length && fase !== "todas" && fase !== chave) return;
      html += "<section class=\"grupo-perguntas\"><h3>" + grupos[chave] + "</h3>";
      if (!itens.length) {
        html += "<p class=\"vazio\">Nenhuma pergunta neste grupo com os filtros atuais.</p>";
      } else {
        itens.sort(function (a, b) { return (a.ordemNaFase || 0) - (b.ordemNaFase || 0); });
        itens.forEach(function (p) {
          var correta = (p.alternativas || []).find(function (a) { return a.correta; });
          html +=
            '<article class="card-pergunta-admin" data-id="' + p.id + '">' +
            "<p class=\"meta\">" + labelDif(p.dificuldade) + " · " +
            QuizData.pontosPorDificuldade(p.dificuldade) + " pts · " +
            (p.status || "") + " · ordem " + (p.ordemNaFase || "-") + "</p>" +
            "<p class=\"enunciado\">" + escapeHtml(p.enunciado) + "</p>" +
            "<details><summary>Gabarito e explicação</summary>" +
            "<p><strong>Correta:</strong> " + escapeHtml(correta ? correta.texto : "") + "</p>" +
            "<p>" + escapeHtml(p.explicacao || "") + "</p></details>" +
            '<div class="acoes-fase">' +
            '<button type="button" class="btn btn-secundario" data-acao-perg="inativar">Alternar status</button>' +
            '<button type="button" class="btn btn-secundario" data-acao-perg="duplicar">Duplicar como rascunho</button>' +
            "</div></article>";
        });
      }
      html += "</section>";
    });
    els.listaPerguntas.innerHTML = html;
  }

  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function rankingFase(faseId, publico) {
    var lista = carregarParticipacoes()
      .filter(function (p) {
        if (p.faseId !== faseId || p.status !== "concluida") return false;
        if (publico && publico !== "todos" && p.tipoPublico !== publico) return false;
        return true;
      })
      .sort(function (a, b) {
        if (b.pontuacao !== a.pontuacao) return b.pontuacao - a.pontuacao;
        if (b.quantidadeAcertos !== a.quantidadeAcertos) return b.quantidadeAcertos - a.quantidadeAcertos;
        if (a.tempoTotalSegundos !== b.tempoTotalSegundos) return a.tempoTotalSegundos - b.tempoTotalSegundos;
        return String(a.finalizadoEm || "").localeCompare(String(b.finalizadoEm || ""));
      });
    return lista.map(function (p, i) {
      return Object.assign({}, p, { posicaoRanking: i + 1 });
    });
  }

  function renderResultados() {
    var busca = (document.getElementById("busca-nome").value || "").toLowerCase().trim();
    var lista = filtrarParticipacoes().filter(function (p) {
      if (!busca) return true;
      return String(p.participanteNome || p.nomeCompleto || "").toLowerCase().indexOf(busca) !== -1;
    });
    lista.sort(function (a, b) {
      return (b.pontuacao || 0) - (a.pontuacao || 0);
    });
    els.contadorResultados.textContent = lista.length + " registro(s) filtrado(s)";
    els.tabelaResultados.innerHTML = lista.map(function (p) {
      return (
        "<tr>" +
        "<td>" + escapeHtml(p.participanteNome || p.nomeCompleto) + "</td>" +
        "<td>" + labelPublico(p.tipoPublico) + "</td>" +
        "<td>" + escapeHtml(p.empresaParceira || "—") + "</td>" +
        "<td>" + escapeHtml(p.faseNome || p.faseId) + "</td>" +
        "<td>" + labelStatus(p.status, p) + "</td>" +
        "<td>" + (p.pontuacao || 0) + "</td>" +
        "<td>" + (p.quantidadeAcertos || 0) + " de " + (p.quantidadePerguntas || 5) + "</td>" +
        "<td>" + formatarTempo(p.tempoTotalSegundos) + "</td>" +
        "<td>" + formatarData(p.iniciadoEm) + "</td>" +
        "<td>" + formatarData(p.finalizadoEm) + "</td>" +
        "<td>" + (p.posicaoRanking || "—") + "</td>" +
        '<td><button type="button" class="btn btn-pequeno" data-corrigir="' + p.id + '">Corrigir público</button> ' +
        (p.status === "excluida" || p.excluida
          ? '<button type="button" class="btn btn-pequeno" data-restaurar="' + p.id + '"' + (dadosRemotosOk ? "" : " disabled") + ">Restaurar</button>"
          : '<button type="button" class="btn btn-pequeno" data-excluir="' + p.id + '"' + (dadosRemotosOk ? "" : " disabled") + ">Excluir</button>") +
        "</td>" +
        "</tr>"
      );
    }).join("") || '<tr><td colspan="12">Nenhum registro.</td></tr>';
    atualizarDisponibilidadeAcoes(dadosRemotosOk);
  }

  function formatarData(iso) {
    if (!iso) return "—";
    try {
      return new Date(iso).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
    } catch (e) {
      return iso;
    }
  }

  function renderRankingAdmin() {
    var faseId = document.getElementById("ranking-fase").value;
    var publico = document.getElementById("ranking-publico").value;
    var lista = rankingFase(faseId, publico);
    els.tabelaRanking.innerHTML = lista.map(function (p) {
      return (
        "<tr>" +
        "<td>" + p.posicaoRanking + "º</td>" +
        "<td>" + escapeHtml(p.participanteNome || p.nomeCompleto) + "</td>" +
        "<td>" + labelPublico(p.tipoPublico) + "</td>" +
        "<td>" + p.pontuacao + "</td>" +
        "<td>" + p.quantidadeAcertos + " de 5</td>" +
        "<td>" + formatarTempo(p.tempoTotalSegundos) + "</td>" +
        "</tr>"
      );
    }).join("") || '<tr><td colspan="6">Sem participantes concluídos nesta fase.</td></tr>';
  }

  function atualizarStatusQuiz() {
    var st = QuizStatus.obterEstadoQuiz();
    var n = (st.fasesDisponiveis && st.fasesDisponiveis.length) || 0;
    var txt = st.liberado
      ? "Quiz liberado · " + n + " fase(s) disponível(is)"
      : "Quiz bloqueado";
    if (st.faseAtiva) txt += " · Destaque: " + st.faseAtiva.nome;
    txt += " · Horários são só identificação";
    els.statusQuiz.textContent = txt;
  }

  function atualizarTudo() {
    atualizarStatusQuiz();
    renderCards();
    renderGraficos();
    renderFases();
    renderPerguntas();
    renderResultados();
    renderRankingAdmin();
    sincronizarNuvem(function () {
      renderCards();
      renderGraficos();
      renderFases();
      renderPerguntas();
      renderResultados();
      renderRankingAdmin();
    });
  }

  function ativarAba(id) {
    var tabs = document.querySelectorAll('[role="tab"]');
    var panels = document.querySelectorAll('[role="tabpanel"]');
    tabs.forEach(function (tab) {
      var sel = tab.id === id;
      tab.setAttribute("aria-selected", sel ? "true" : "false");
    });
    panels.forEach(function (panel) {
      panel.hidden = panel.getAttribute("aria-labelledby") !== id;
    });
  }

  /* —— eventos —— */
  els.formLogin.addEventListener("submit", function (e) {
    e.preventDefault();
    if (senhaValida(els.senha.value)) {
      sessionStorage.setItem(STORAGE_AUTH, "1");
      els.erroLogin.hidden = true;
      mostrarPainel(true);
    } else {
      els.erroLogin.hidden = false;
      els.erroLogin.textContent = "Senha incorreta. Tente novamente.";
    }
  });

  els.btnSair.addEventListener("click", function () {
    sessionStorage.removeItem(STORAGE_AUTH);
    mostrarPainel(false);
  });

  if (els.btnSyncNuvem) {
    els.btnSyncNuvem.addEventListener("click", function () {
      sincronizarNuvem(function (ok) {
        renderCards();
        renderGraficos();
        renderFases();
        renderPerguntas();
        renderResultados();
        renderRankingAdmin();
        alert(ok
          ? "Dados atualizados com sucesso."
          : "Não foi possível atualizar os dados neste momento. Verifique sua conexão e tente novamente.");
      }, { publicar: true });
    });
  }

  document.querySelectorAll('[role="tab"]').forEach(function (tab) {
    tab.addEventListener("click", function () {
      ativarAba(tab.id);
    });
  });

  ["filtro-data", "filtro-fase", "filtro-publico", "filtro-status", "filtro-contagem"].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.addEventListener("change", function () {
      renderCards();
      renderGraficos();
      renderResultados();
    });
  });
  var chkExc = document.getElementById("filtro-exibir-excluidos");
  if (chkExc) {
    chkExc.addEventListener("change", function () {
      renderCards();
      renderGraficos();
      renderResultados();
    });
  }

  ["filtro-perg-fase", "filtro-perg-status", "filtro-perg-dif"].forEach(function (id) {
    document.getElementById(id).addEventListener("change", renderPerguntas);
  });

  document.getElementById("busca-nome").addEventListener("input", renderResultados);
  document.getElementById("ranking-fase").addEventListener("change", renderRankingAdmin);
  document.getElementById("ranking-publico").addEventListener("change", renderRankingAdmin);

  var selPriv = document.getElementById("privacidade-nome");
  var btnPriv = document.getElementById("btn-salvar-privacidade");
  if (selPriv && Store) {
    Store.carregarPrivacidade().then(function (modo) {
      selPriv.value = modo || "primeiro_inicial";
    });
  }
  if (btnPriv && selPriv && Store) {
    btnPriv.addEventListener("click", function () {
      Store.salvarPrivacidade(selPriv.value).then(function (res) {
        registrarAuditoria({
          acao: "alterar_privacidade_nome",
          entidade: "config_quiz",
          entidadeId: "padrao",
          novoValor: selPriv.value
        });
        alert(res.ok
          ? "Privacidade salva. O ranking público usará o novo formato de nome."
          : "Não foi possível salvar a privacidade neste momento. Verifique sua conexão e tente novamente.");
      });
    });
  }

  els.listaFases.addEventListener("click", function (e) {
    var btn = e.target.closest("button[data-acao]");
    if (!btn) return;
    var card = btn.closest(".card-fase");
    var faseId = card.getAttribute("data-fase");
    var fases = QuizData.carregarFases();
    var fase = fases.find(function (f) { return f.id === faseId; });
    if (!fase) return;
    var acao = btn.getAttribute("data-acao");

    if (acao === "liberar") {
      var val = QuizData.validarDistribuicaoFase(faseId);
      if (!val.ok) {
        var nomeCurto = fase.ordem === 1 ? "Fase 1" : fase.ordem === 2 ? "Fase 2" : "Fase 3";
        alert("A " + nomeCurto + " não pode ser disponibilizada: são necessárias exatamente 2 perguntas fáceis, 2 intermediárias e 1 difícil.");
        return;
      }
      fase.ativaManual = true;
      fase.pausadaManual = false;
      fase.rankingCongelado = false;
      fase.status = "ativa";
      fases.forEach(function (f) {
        if (f.id !== faseId) f.ativaManual = false;
      });
      registrarAuditoria({ acao: "liberar_fase", entidade: "fase", entidadeId: faseId, novoValor: "ativa" });
    } else if (acao === "pausar") {
      fase.pausadaManual = true;
      fase.ativaManual = false;
      fase.status = "pausada";
      registrarAuditoria({ acao: "pausar_fase", entidade: "fase", entidadeId: faseId });
    } else if (acao === "reabrir") {
      fase.pausadaManual = false;
      fase.ativaManual = true;
      fase.rankingCongelado = false;
      fase.status = "ativa";
      registrarAuditoria({ acao: "reabrir_fase", entidade: "fase", entidadeId: faseId });
    } else if (acao === "encerrar") {
      fase.ativaManual = false;
      fase.pausadaManual = false;
      fase.status = "encerrada";
      fase.rankingCongelado = true;
      registrarAuditoria({ acao: "encerrar_fase", entidade: "fase", entidadeId: faseId });
    } else if (acao === "editar-horario") {
      var ini = prompt("Horário de identificação — início (HH:MM)", fase.horarioInicio);
      var fim = prompt("Horário de identificação — fim (HH:MM)", fase.horarioFim);
      if (ini && fim) {
        var anterior = { inicio: fase.horarioInicio, fim: fase.horarioFim };
        fase.horarioInicio = ini;
        fase.horarioFim = fim;
        registrarAuditoria({
          acao: "editar_horario",
          entidade: "fase",
          entidadeId: faseId,
          valorAnterior: anterior,
          novoValor: { inicio: ini, fim: fim }
        });
      }
    } else if (acao === "ver-ranking") {
      document.getElementById("ranking-fase").value = faseId;
      ativarAba("tab-rankings");
      renderRankingAdmin();
      return;
    } else if (acao === "zerar") {
      if (!confirm("Zerar o ranking da " + fase.nome + "? Esta ação remove participações concluídas desta fase.")) return;
      var antes = carregarParticipacoes();
      var depois = antes.filter(function (p) { return p.faseId !== faseId; });
      salvarParticipacoes(depois);
      fase.rankingCongelado = false;
      registrarAuditoria({
        acao: "zerar_ranking",
        entidade: "fase",
        entidadeId: faseId,
        valorAnterior: { removidos: antes.length - depois.length }
      });
    } else if (acao === "exportar-fase") {
      exportarRankingFase(faseId);
      return;
    }

    QuizData.salvarFases(fases);
    atualizarTudo();
  });

  els.listaPerguntas.addEventListener("click", function (e) {
    var btn = e.target.closest("button[data-acao-perg]");
    if (!btn) return;
    var card = btn.closest(".card-pergunta-admin");
    var id = card.getAttribute("data-id");
    var lista = QuizData.carregarPerguntas();
    var p = lista.find(function (x) { return x.id === id; });
    if (!p) return;
    var acao = btn.getAttribute("data-acao-perg");
    if (acao === "inativar") {
      var mapa = { ativa: "inativa", inativa: "ativa", reserva: "ativa" };
      var ant = p.status;
      p.status = mapa[p.status] || "ativa";
      registrarAuditoria({
        acao: "alterar_status_pergunta",
        entidade: "pergunta",
        entidadeId: id,
        valorAnterior: ant,
        novoValor: p.status
      });
    } else if (acao === "duplicar") {
      var clone = JSON.parse(JSON.stringify(p));
      clone.id = "rascunho-" + Date.now();
      clone.status = "inativa";
      clone.faseId = null;
      clone.ordemNaFase = null;
      clone.enunciado = "[Rascunho] " + clone.enunciado;
      lista.push(clone);
      registrarAuditoria({ acao: "duplicar_pergunta", entidade: "pergunta", entidadeId: clone.id });
    }
    QuizData.salvarPerguntas(lista);
    renderPerguntas();
    renderFases();
  });

  function setErroExcluir(msg) {
    var el = document.getElementById("erro-excluir");
    if (!el) return;
    if (!msg) {
      el.hidden = true;
      el.textContent = "";
      return;
    }
    el.hidden = false;
    el.textContent = msg;
  }

  function setExcluindoUI(ativo) {
    var btnConf = document.getElementById("confirmar-excluir");
    var btnCancel = document.getElementById("cancelar-excluir");
    if (btnConf) {
      btnConf.disabled = !!ativo;
      btnConf.textContent = ativo ? "Excluindo participação..." : "Excluir participação";
    }
    if (btnCancel) btnCancel.disabled = !!ativo;
  }

  els.tabelaResultados.addEventListener("click", function (e) {
    var btnCorrigir = e.target.closest("[data-corrigir]");
    var btnExcluir = e.target.closest("[data-excluir]");
    var btnRestaurar = e.target.closest("[data-restaurar]");

    if (btnCorrigir) {
      editandoPublicoId = btnCorrigir.getAttribute("data-corrigir");
      var p = carregarParticipacoes().find(function (x) { return x.id === editandoPublicoId; });
      if (!p) return;
      els.resumoAuditoria.textContent =
        "Participante: " + (p.participanteNome || p.nomeCompleto) +
        " · Atual: " + labelPublico(p.tipoPublico);
      els.novoPublico.value = p.tipoPublico === "bayer" ? "parceiro" : "bayer";
      els.motivoAuditoria.value = "";
      els.modalAuditoria.hidden = false;
      return;
    }

    if (btnExcluir) {
      if (btnExcluir.disabled || !dadosRemotosOk) {
        alert("Ações administrativas críticas não estão disponíveis porque a conexão segura com os dados não foi configurada.");
        return;
      }
      if (!navigator.onLine) {
        alert("Não foi possível concluir a exclusão neste momento. Verifique sua conexão e tente novamente.");
        return;
      }
      editandoExcluirId = btnExcluir.getAttribute("data-excluir");
      var pe = carregarParticipacoes().find(function (x) { return x.id === editandoExcluirId; });
      if (!pe) return;
      document.getElementById("resumo-excluir").textContent =
        pe.participanteNome + " · " + labelPublico(pe.tipoPublico) + " · " +
        (pe.faseNome || pe.faseId) + " · " + pe.pontuacao + " pts · " +
        pe.quantidadeAcertos + " acertos · " + labelStatus(pe.status, pe);
      document.getElementById("motivo-exclusao").value = "";
      document.getElementById("motivo-exclusao-detalhe").value = "";
      setErroExcluir(null);
      setExcluindoUI(false);
      document.getElementById("modal-excluir").hidden = false;
      return;
    }

    if (btnRestaurar && Store) {
      if (btnRestaurar.disabled || !dadosRemotosOk) {
        alert("Ações administrativas críticas não estão disponíveis porque a conexão segura com os dados não foi configurada.");
        return;
      }
      var idR = btnRestaurar.getAttribute("data-restaurar");
      if (!confirm("Restaurar esta participação ao ranking?")) return;
      btnRestaurar.disabled = true;
      Store.restaurarParticipacao(idR, "admin").then(function (res) {
        if (!res || !res.ok) {
          btnRestaurar.disabled = false;
          alert(Store.mensagemErroAdmin(res && res.codigo));
          return;
        }
        registrarAuditoria({
          acao: "restaurar_participacao",
          entidade: "participacao",
          entidadeId: idR
        });
        sincronizarNuvem(function () {
          renderCards();
          renderGraficos();
          renderResultados();
          renderRankingAdmin();
        });
        alert("Participação restaurada com sucesso. O ranking foi atualizado.");
      });
    }
  });

  var btnCancelEx = document.getElementById("cancelar-excluir");
  var btnConfEx = document.getElementById("confirmar-excluir");
  if (btnCancelEx) {
    btnCancelEx.addEventListener("click", function () {
      if (btnCancelEx.disabled) return;
      document.getElementById("modal-excluir").hidden = true;
      editandoExcluirId = null;
      setErroExcluir(null);
      setExcluindoUI(false);
    });
  }
  if (btnConfEx) {
    btnConfEx.addEventListener("click", function () {
      if (!editandoExcluirId || !Store) return;
      if (!dadosRemotosOk || !navigator.onLine) {
        setErroExcluir("Não foi possível concluir a exclusão neste momento. Verifique sua conexão e tente novamente.");
        return;
      }
      var motivo = document.getElementById("motivo-exclusao").value;
      if (motivo === "Outro") {
        motivo = document.getElementById("motivo-exclusao-detalhe").value.trim() || "";
      }
      if (!motivo || String(motivo).trim().length < 2) {
        setErroExcluir("Informe o motivo da exclusão.");
        return;
      }
      setErroExcluir(null);
      setExcluindoUI(true);
      var idExcluir = editandoExcluirId;
      Store.excluirParticipacao(idExcluir, motivo, "admin").then(function (res) {
        if (!res || !res.ok || !res.oficial) {
          setExcluindoUI(false);
          setErroExcluir(Store.mensagemErroAdmin(res && res.codigo));
          return;
        }
        registrarAuditoria({
          acao: "excluir_participacao",
          entidade: "participacao",
          entidadeId: idExcluir,
          motivo: motivo,
          novoValor: "excluida"
        });
        document.getElementById("modal-excluir").hidden = true;
        editandoExcluirId = null;
        setExcluindoUI(false);
        setErroExcluir(null);
        // Atualiza UI pelo cache oficial local; evita sync imediato que pode reverter exclusão
        renderCards();
        renderGraficos();
        renderResultados();
        renderRankingAdmin();
        setTimeout(function () {
          sincronizarNuvem(function () {
            renderCards();
            renderGraficos();
            renderResultados();
            renderRankingAdmin();
          }, { publicar: false });
        }, 1500);
        alert("Participação excluída com sucesso. O ranking foi atualizado.");
      }).catch(function () {
        setExcluindoUI(false);
        setErroExcluir("Não foi possível concluir a exclusão neste momento. Verifique sua conexão e tente novamente.");
      });
    });
  }

  els.cancelarAuditoria.addEventListener("click", function () {
    els.modalAuditoria.hidden = true;
    editandoPublicoId = null;
  });

  els.confirmarAuditoria.addEventListener("click", function () {
    if (!editandoPublicoId) return;
    var lista = carregarParticipacoes();
    var p = lista.find(function (x) { return x.id === editandoPublicoId; });
    if (!p) return;
    var ant = p.tipoPublico;
    var novo = els.novoPublico.value;
    if (ant === novo) {
      els.modalAuditoria.hidden = true;
      return;
    }
    if (!confirm("Confirmar alteração de público de " + labelPublico(ant) + " para " + labelPublico(novo) + "?")) return;
    p.tipoPublico = novo;
    salvarParticipacoes(lista);
    if (Store) {
      Store.atualizarRemoto(p.id, { tipo_publico: novo });
    }
    registrarAuditoria({
      acao: "corrigir_tipo_publico",
      entidade: "participacao",
      entidadeId: p.id,
      valorAnterior: ant,
      novoValor: novo,
      motivo: els.motivoAuditoria.value || null
    });
    els.modalAuditoria.hidden = true;
    editandoPublicoId = null;
    atualizarTudo();
  });

  els.btnExportar.addEventListener("click", function () {
    var m = metricas(filtrarParticipacoes());
    var f = filtrosAtivos();
    els.resumoExport.textContent =
      "Exportar relatório com dados filtrados: fase=" + f.fase +
      ", público=" + f.publico +
      ", status=" + f.status +
      ", data=" + (f.data || "todas") +
      ". Registros estimados: " + m.base.length +
      ". Nome sugerido: quiz-enable-dashboard-" + (f.data || "geral") + ".";
    els.modalExport.hidden = false;
  });

  els.cancelarExport.addEventListener("click", function () {
    els.modalExport.hidden = true;
  });

  els.confirmarExport.addEventListener("click", function () {
    var formato = els.formatoExport.value;
    var f = filtrosAtivos();
    var m = metricas(filtrarParticipacoes());
    var detalhe = m.base;
    var nome = "quiz-enable-dashboard-" + (f.data || "geral");

    if (formato === "csv") {
      baixarCSV(nome + ".csv", montarCSV(detalhe, m, f));
    } else {
      baixarXLSX(nome + ".xlsx", detalhe, m, f);
    }

    registrarExport({
      formato: formato,
      filtrosAplicados: f,
      quantidadeRegistros: detalhe.length
    });
    els.modalExport.hidden = true;
  });

  function montarCSV(detalhe, m, f) {
    var linhas = [];
    linhas.push("Resumo");
    linhas.push("Periodo;" + (f.data || "todas"));
    linhas.push("Fase;" + f.fase);
    linhas.push("Publico;" + f.publico);
    linhas.push("Status;" + f.status);
    linhas.push("Gerado em;" + new Date().toISOString());
    linhas.push("Total;" + m.total);
    linhas.push("Unicos;" + m.unicos);
    linhas.push("Bayer;" + m.bayer);
    linhas.push("% Bayer;" + m.pctBayer);
    linhas.push("Parceiros;" + m.parceiros);
    linhas.push("% Parceiros;" + m.pctParceiros);
    linhas.push("Taxa conclusao;" + m.taxa);
    linhas.push("Media geral;" + m.mediaGeral);
    linhas.push("Media Bayer;" + m.mediaBayer);
    linhas.push("Media parceiros;" + m.mediaParceiros);
    linhas.push("");
    linhas.push("Participacoes detalhadas");
    linhas.push("Nome;Publico;Empresa;Fase;Status;Pontuacao;Acertos;Tempo;Inicio;Finalizacao;Posicao");
    detalhe.forEach(function (p) {
      linhas.push([
        csvCell(p.participanteNome || p.nomeCompleto),
        p.tipoPublico,
        csvCell(p.empresaParceira || ""),
        csvCell(p.faseNome || p.faseId),
        p.status,
        p.pontuacao || 0,
        (p.quantidadeAcertos || 0) + "/" + (p.quantidadePerguntas || 5),
        formatarTempo(p.tempoTotalSegundos),
        p.iniciadoEm || "",
        p.finalizadoEm || "",
        p.posicaoRanking || ""
      ].join(";"));
    });
    return "\uFEFF" + linhas.join("\n");
  }

  function csvCell(v) {
    return '"' + String(v || "").replace(/"/g, '""') + '"';
  }

  function baixarCSV(nome, conteudo) {
    var blob = new Blob([conteudo], { type: "text/csv;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = nome;
    a.click();
    URL.revokeObjectURL(url);
  }

  function baixarXLSX(nome, detalhe, m, f) {
    if (typeof XLSX === "undefined") {
      baixarCSV(nome.replace(".xlsx", ".csv"), montarCSV(detalhe, m, f));
      return;
    }
    var wb = XLSX.utils.book_new();
    var resumo = [
      ["Período filtrado", f.data || "todas"],
      ["Fases selecionadas", f.fase],
      ["Público", f.publico],
      ["Status", f.status],
      ["Data/hora geração", new Date().toISOString()],
      ["Total participações", m.total],
      ["Participantes únicos", m.unicos],
      ["Total Bayer", m.bayer],
      ["Percentual Bayer", m.pctBayer],
      ["Total parceiros", m.parceiros],
      ["Percentual parceiros", m.pctParceiros],
      ["Taxa de conclusão", m.taxa],
      ["Pontuação média geral", m.mediaGeral],
      ["Pontuação média Bayer", m.mediaBayer],
      ["Pontuação média parceiros", m.mediaParceiros]
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(resumo), "Resumo");

    var detRows = [["Nome", "Tipo de público", "Empresa parceira", "Fase", "Status", "Pontuação", "Acertos", "Tempo total", "Início", "Finalização", "Posição"]];
    detalhe.forEach(function (p) {
      detRows.push([
        p.participanteNome || p.nomeCompleto,
        p.tipoPublico,
        p.empresaParceira || "",
        p.faseNome || p.faseId,
        p.status,
        p.pontuacao || 0,
        (p.quantidadeAcertos || 0) + " de " + (p.quantidadePerguntas || 5),
        formatarTempo(p.tempoTotalSegundos),
        p.iniciadoEm || "",
        p.finalizadoEm || "",
        p.posicaoRanking || ""
      ]);
    });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(detRows), "Participacoes");

    var porFase = [["Fase", "Total", "Bayer", "Parceiros", "Únicos", "Concluídas", "Incompletas", "Expiradas", "Taxa conclusão", "Média"]];
    ["fase-1", "fase-2", "fase-3"].forEach(function (id, i) {
      var g = detalhe.filter(function (p) { return p.faseId === id; });
      var todas = carregarParticipacoes().filter(function (p) {
        if (p.faseId !== id) return false;
        if (f.data && p.dataEvento !== f.data) return false;
        if (f.publico !== "todos" && p.tipoPublico !== f.publico) return false;
        return true;
      });
      var conc = todas.filter(function (p) { return p.status === "concluida"; });
      porFase.push([
        "Fase " + (i + 1),
        g.length,
        g.filter(function (p) { return p.tipoPublico === "bayer"; }).length,
        g.filter(function (p) { return p.tipoPublico === "parceiro"; }).length,
        unicos(g).length,
        conc.length,
        todas.filter(function (p) { return p.status === "incompleta"; }).length,
        todas.filter(function (p) { return p.status === "expirada"; }).length,
        todas.length ? Math.round((conc.length / todas.length) * 1000) / 10 : 0,
        media(conc, "pontuacao")
      ]);
    });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(porFase), "Por fase");

    var rankRows = [["Fase", "Posição", "Nome", "Público", "Pontuação", "Acertos", "Tempo"]];
    ["fase-1", "fase-2", "fase-3"].forEach(function (id) {
      rankingFase(id, "todos").forEach(function (p) {
        rankRows.push([
          id,
          p.posicaoRanking,
          p.participanteNome || p.nomeCompleto,
          p.tipoPublico,
          p.pontuacao,
          p.quantidadeAcertos + " de 5",
          formatarTempo(p.tempoTotalSegundos)
        ]);
      });
    });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rankRows), "Rankings");
    XLSX.writeFile(wb, nome);
  }

  function exportarRankingFase(faseId) {
    var lista = rankingFase(faseId, "todos");
    var rows = "Posicao;Participante;Publico;Pontuacao;Acertos;Tempo\n";
    lista.forEach(function (p) {
      rows += [
        p.posicaoRanking,
        csvCell(p.participanteNome || p.nomeCompleto),
        p.tipoPublico,
        p.pontuacao,
        p.quantidadeAcertos + "/5",
        formatarTempo(p.tempoTotalSegundos)
      ].join(";") + "\n";
    });
    baixarCSV("ranking-" + faseId + ".csv", "\uFEFF" + rows);
  }

  /* init */
  if (!localStorage.getItem(QuizData.STORAGE_PERGUNTAS)) {
    QuizData.salvarPerguntas(QuizData.PERGUNTAS_PADRAO);
  }
  if (!localStorage.getItem(QuizData.STORAGE_FASES)) {
    QuizData.salvarFases(QuizData.FASES_PADRAO);
  }
  if (!QuizData.dataEvento()) {
    QuizData.salvarDataEvento(QuizStatus.agoraSP().dateStr);
  }
  var dataInput = document.getElementById("filtro-data");
  if (dataInput && QuizData.dataEvento()) dataInput.value = QuizData.dataEvento();

  mostrarPainel(autenticado());
  var syncDebounceTimer = null;
  function agendarRefreshAdmin() {
    if (syncDebounceTimer) clearTimeout(syncDebounceTimer);
    syncDebounceTimer = setTimeout(function () {
      sincronizarNuvem(function () {
        renderCards();
        renderGraficos();
        renderResultados();
        renderRankingAdmin();
      }, { publicar: false });
    }, 800);
  }
  if (Store) {
    Store.onEvento(function (evento) {
      if (!autenticado()) return;
      if (evento === "realtime" || evento === "participacao_excluida") {
        agendarRefreshAdmin();
      }
    });
  }
  window.addEventListener("online", function () {
    if (autenticado()) sincronizarNuvem(function () { renderResultados(); }, { publicar: true });
  });
  window.addEventListener("offline", function () {
    if (autenticado()) {
      setStatusSync("Sem conexão com os dados", "erro");
      atualizarDisponibilidadeAcoes(false);
    }
  });
  setInterval(function () {
    if (autenticado()) atualizarStatusQuiz();
  }, 20000);
})();
