/**
 * Ranking público global + modo telão (Supabase Realtime)
 */
(function () {
  "use strict";

  var Store = window.QuizStore;
  var params = new URLSearchParams(window.location.search);
  var modoTelao = params.get("modo") === "telao" || /\/telao$/i.test(location.pathname);
  var faseParam = params.get("fase") || "";
  var unsubRealtime = null;
  var unsubEventos = null;
  var privacidade = "primeiro_inicial";
  var rankingAtual = [];
  var faseAtualId = null;

  var els = {
    app: document.getElementById("app-ranking"),
    titulo: document.getElementById("titulo-ranking-pagina"),
    subtitulo: document.getElementById("subtitulo-fase"),
    status: document.getElementById("status-ranking"),
    ultima: document.getElementById("ultima-atualizacao"),
    conexao: document.getElementById("conexao-status"),
    mensagem: document.getElementById("mensagem-fase"),
    corpo: document.getElementById("corpo-ranking-publico"),
    nav: document.getElementById("nav-fases"),
    blocoQr: document.getElementById("bloco-qr"),
    qr: document.getElementById("qr-code")
  };

  function formatarTempo(seg) {
    seg = Math.max(0, Math.floor(Number(seg) || 0));
    var m = Math.floor(seg / 60);
    var s = seg % 60;
    return (m < 10 ? "0" : "") + m + ":" + (s < 10 ? "0" : "") + s;
  }

  function formatarHora(iso) {
    if (!iso) return "—";
    try {
      return new Date(iso).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
    } catch (e) {
      return iso;
    }
  }

  function obterFaseExibida() {
    var fases = QuizData.carregarFases();
    if (faseParam && /^fase-[123]$/.test(faseParam)) {
      return fases.find(function (f) { return f.id === faseParam; }) || fases[0];
    }
    var st = QuizStatus.obterEstadoQuiz();
    if (st.faseAtiva) return st.faseAtiva;
    if (st.rankingFaseId) {
      return fases.find(function (f) { return f.id === st.rankingFaseId; }) || fases[fases.length - 1];
    }
    return fases[0];
  }

  function statusLabel(fase) {
    if (fase.rankingCongelado || fase.status === "encerrada") return { texto: "Ranking final", classe: "final" };
    return { texto: "Ranking parcial", classe: "parcial" };
  }

  function escapar(t) {
    return String(t || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function renderTabela(lista, oficial) {
    var top = modoTelao ? lista.slice(0, 10) : lista;
    if (!top.length) {
      els.corpo.innerHTML = '<tr><td colspan="5">Ainda não há participações concluídas nesta fase.</td></tr>';
      return;
    }
    var html = "";
    top.forEach(function (item, i) {
      var pos = item.posicao_ranking || (i + 1);
      var nome = Store.formatarNomePublico(item.participante_nome, privacidade);
      html +=
        "<tr data-id=\"" + escapar(item.id) + "\">" +
        "<td>" + pos + "º</td>" +
        "<th scope=\"row\">" + escapar(nome) + "</th>" +
        "<td>" + item.pontuacao + "</td>" +
        "<td>" + item.quantidade_acertos + " de 5</td>" +
        "<td>" + formatarTempo(item.tempo_total_segundos) + "</td>" +
        "</tr>";
    });
    els.corpo.innerHTML = html;
    if (!oficial) {
      els.conexao.hidden = false;
    }
  }

  function atualizarMeta(fase, oficial, ultima) {
    var st = statusLabel(fase);
    els.titulo.textContent = modoTelao ? "Ranking ao vivo" : "Ranking";
    els.subtitulo.textContent =
      fase.nome + " · " +
      QuizStatus.formatarHorario(fase.horarioInicio) +
      " às " +
      QuizStatus.formatarHorario(fase.horarioFim);
    els.status.textContent = st.texto;
    els.status.className = "selo-status " + st.classe;
    els.ultima.textContent = "Última atualização: " + formatarHora(ultima || Store.ultimaSync() || new Date().toISOString());
    var estado = QuizStatus.obterEstadoQuiz();
    els.mensagem.textContent = estado.mensagem ||
      (oficial
        ? "Ranking oficial sincronizado com o banco remoto."
        : "Exibindo última versão disponível (cache).");
  }

  function marcarNav(faseId) {
    if (!els.nav) return;
    els.nav.querySelectorAll(".chip-fase").forEach(function (a) {
      var id = a.getAttribute("data-fase");
      a.classList.toggle("ativo", modoTelao ? id === "telao" : id === faseId);
    });
  }

  function carregar(fase) {
    faseAtualId = fase.id;
    marcarNav(fase.id);
    atualizarMeta(fase, false, Store.ultimaSync());
    els.corpo.innerHTML = '<tr><td colspan="5">Consultando ranking oficial…</td></tr>';

    return Store.rankingFase(fase.id, true).then(function (res) {
      rankingAtual = res.ranking || [];
      renderTabela(rankingAtual, !!res.oficial);
      atualizarMeta(fase, !!res.oficial, res.ultimaSync);
      els.conexao.hidden = !!res.oficial;
      if (!res.ok) {
        els.conexao.hidden = false;
        els.conexao.textContent =
          "Sem conexão com os dados. Exibindo a última atualização disponível.";
      }
      return res;
    });
  }

  function assinar(fase) {
    if (unsubRealtime && unsubRealtime.unsubscribe) unsubRealtime.unsubscribe();
    unsubRealtime = Store.assinarRealtime({ faseId: fase.id });

    if (unsubEventos) unsubEventos();
    unsubEventos = Store.onEvento(function (evento, payload) {
      if (evento === "conexao") {
        if (payload.status === "SUBSCRIBED") {
          els.conexao.hidden = true;
          carregar(fase);
        } else if (payload.status === "CHANNEL_ERROR" || payload.status === "TIMED_OUT" || payload.status === "CLOSED") {
          els.conexao.hidden = false;
          els.conexao.textContent = "Sem conexão. Exibindo a última atualização disponível.";
        }
      }
      if (evento === "realtime") {
        carregar(fase).then(function () {
          var id = payload.row && payload.row.id;
          if (!id || !els.corpo) return;
          var tr = els.corpo.querySelector('[data-id="' + id + '"]');
          if (tr) {
            tr.classList.add("destaque-movimento");
            setTimeout(function () { tr.classList.remove("destaque-movimento"); }, 1800);
          }
        });
      }
    });
  }

  function montarQr() {
    if (!modoTelao || !els.blocoQr || !els.qr) return;
    var base = location.href.replace(/ranking\.html.*/, "index.html");
    els.qr.src = "https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=" + encodeURIComponent(base);
    els.blocoQr.hidden = false;
  }

  function init() {
    if (modoTelao) document.body.classList.add("modo-telao");
    if (!Store) {
      els.corpo.innerHTML = '<tr><td colspan="5">QuizStore indisponível.</td></tr>';
      return;
    }

    var fase = obterFaseExibida();
    Store.carregarPrivacidade().then(function (modo) {
      privacidade = modo || "primeiro_inicial";
      return carregar(fase);
    }).then(function () {
      assinar(fase);
      montarQr();
    });

    window.addEventListener("online", function () {
      els.conexao.hidden = true;
      carregar(obterFaseExibida());
    });
    window.addEventListener("offline", function () {
      els.conexao.hidden = false;
      els.conexao.textContent = "Sem conexão. Exibindo a última atualização disponível.";
    });

    setInterval(function () {
      if (!navigator.onLine) return;
      var f = obterFaseExibida();
      if (f.id !== faseAtualId) {
        carregar(f).then(function () { assinar(f); });
      }
    }, 20000);
  }

  init();
})();
