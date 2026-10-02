/**
 * Estado centralizado do quiz — fuso America/Sao_Paulo
 * Horários das fases são apenas identificação.
 * O quiz pode ser iniciado a qualquer momento (salvo pausa/encerramento manual).
 */
(function (global) {
  "use strict";

  function partsSP(date) {
    var d = date || new Date();
    var fmt = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Sao_Paulo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false
    });
    var parts = fmt.formatToParts(d);
    var map = {};
    parts.forEach(function (p) {
      if (p.type !== "literal") map[p.type] = p.value;
    });
    return map;
  }

  function agoraSP() {
    var p = partsSP();
    return {
      dateStr: p.year + "-" + p.month + "-" + p.day,
      hour: Number(p.hour),
      minute: Number(p.minute),
      second: Number(p.second),
      minutos: Number(p.hour) * 60 + Number(p.minute)
    };
  }

  function parseHHMM(str) {
    var m = String(str || "").match(/^(\d{1,2}):(\d{2})$/);
    if (!m) return 0;
    return Number(m[1]) * 60 + Number(m[2]);
  }

  function formatarHorario(hhmm) {
    return String(hhmm || "").replace(":", "h");
  }

  function faseBloqueadaAdmin(f) {
    return !!(f && (f.pausadaManual || f.status === "pausada" || f.status === "encerrada"));
  }

  function faseDisponivel(f) {
    return !!(f && !faseBloqueadaAdmin(f));
  }

  function sugerirFasePorHorario(fases, minutos) {
    for (var i = 0; i < fases.length; i++) {
      var f = fases[i];
      if (!faseDisponivel(f)) continue;
      var ini = parseHHMM(f.horarioInicio);
      var fim = parseHHMM(f.horarioFim);
      if (minutos >= ini && minutos < fim) return f;
    }
    return null;
  }

  function obterEstadoQuiz(opcoes) {
    opcoes = opcoes || {};
    var fases = opcoes.fases || (global.QuizData && global.QuizData.carregarFases()) || [];
    var agora = agoraSP();
    var disponiveis = fases.filter(faseDisponivel);
    var sugerida = sugerirFasePorHorario(fases, agora.minutos);
    if (sugerida && !faseDisponivel(sugerida)) sugerida = null;

    var forçada = fases.find(function (f) {
      return f && f.ativaManual && faseDisponivel(f);
    });

    var faseAtiva = forçada || sugerida || disponiveis[0] || null;

    var resultado = {
      agora: agora,
      faseAtiva: faseAtiva,
      fasesDisponiveis: disponiveis,
      liberado: disponiveis.length > 0,
      motivoBloqueio: "",
      mensagem: "",
      rankingFaseId: faseAtiva ? faseAtiva.id : (fases[0] && fases[0].id) || null,
      proximaFase: null,
      proximoHorario: null,
      status: disponiveis.length ? "ativa" : "indisponivel",
      horarioApenasIdentificacao: true
    };

    if (!disponiveis.length) {
      resultado.motivoBloqueio = "admin";
      resultado.mensagem =
        "Nenhuma fase está disponível no momento. Aguarde a liberação pelo administrador.";
      resultado.status = "pausada";
      return resultado;
    }

    if (faseAtiva) {
      resultado.mensagem =
        "Escolha a fase e comece quando quiser. Os horários servem só para identificar cada fase (" +
        formatarHorario(faseAtiva.horarioInicio) +
        " às " +
        formatarHorario(faseAtiva.horarioFim) +
        ").";
    }

    return resultado;
  }

  function fasePodeSerJogada(faseId, opcoes) {
    var st = obterEstadoQuiz(opcoes);
    return st.fasesDisponiveis.some(function (f) { return f.id === faseId; });
  }

  global.QuizStatus = {
    agoraSP: agoraSP,
    obterEstadoQuiz: obterEstadoQuiz,
    parseHHMM: parseHHMM,
    formatarHorario: formatarHorario,
    fasePodeSerJogada: fasePodeSerJogada,
    faseDisponivel: faseDisponivel
  };
})(window);
