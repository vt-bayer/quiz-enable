/**
 * Persistência compartilhada (Supabase) + cache local.
 * Garante ranking/resultados entre celulares e computadores.
 */
(function (global) {
  "use strict";

  var STORAGE_CACHE = "quizEnableParticipacoes";
  var TABELA = "participacoes";

  function db() {
    return typeof global.obterClienteSupabase === "function"
      ? global.obterClienteSupabase()
      : null;
  }

  function gerarUuid() {
    if (global.crypto && typeof global.crypto.randomUUID === "function") {
      return global.crypto.randomUUID();
    }
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0;
      var v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  function lerCache() {
    try {
      var bruto = localStorage.getItem(STORAGE_CACHE);
      var dados = bruto ? JSON.parse(bruto) : [];
      return Array.isArray(dados) ? dados : [];
    } catch (e) {
      return [];
    }
  }

  function salvarCache(lista) {
    localStorage.setItem(STORAGE_CACHE, JSON.stringify(lista || []));
  }

  function mesclarPorId(base, extras) {
    var mapa = {};
    (base || []).forEach(function (p) {
      if (p && p.id) mapa[p.id] = p;
    });
    (extras || []).forEach(function (p) {
      if (p && p.id) mapa[p.id] = Object.assign({}, mapa[p.id] || {}, p);
    });
    return Object.keys(mapa).map(function (k) { return mapa[k]; });
  }

  function normalizar(p) {
    if (!p) return null;
    return {
      id: p.id,
      participante_nome: p.participante_nome || p.participanteNome || p.nome || "",
      tipo_publico: p.tipo_publico || p.tipoPublico || "",
      empresa_parceira: p.empresa_parceira || p.empresaParceira || p.empresa || "",
      matricula: p.matricula || "",
      fase_id: p.fase_id || p.faseId || "",
      fase_nome: p.fase_nome || p.faseNome || "",
      data_evento: p.data_evento || p.dataEvento || "",
      horario_inicio_fase: p.horario_inicio_fase || p.horarioInicioFase || "",
      horario_fim_fase: p.horario_fim_fase || p.horarioFimFase || "",
      iniciado_em: p.iniciado_em || p.iniciadoEm || "",
      finalizado_em: p.finalizado_em || p.finalizadoEm || null,
      status: p.status || "",
      quantidade_perguntas: Number(p.quantidade_perguntas != null ? p.quantidade_perguntas : p.quantidadePerguntas) || 5,
      quantidade_acertos: Number(p.quantidade_acertos != null ? p.quantidade_acertos : p.quantidadeAcertos) || 0,
      pontuacao: Number(p.pontuacao != null ? p.pontuacao : p.pontos) || 0,
      tempo_total_segundos: Number(p.tempo_total_segundos != null ? p.tempo_total_segundos : p.tempoTotalSegundos) || 0,
      posicao_ranking: p.posicao_ranking != null ? p.posicao_ranking : p.posicaoRanking
    };
  }

  function paraLinhaSupabase(p) {
    var n = normalizar(p);
    return {
      id: n.id,
      participante_nome: n.participante_nome,
      tipo_publico: n.tipo_publico,
      empresa_parceira: n.empresa_parceira || null,
      fase_id: n.fase_id,
      fase_nome: n.fase_nome,
      data_evento: n.data_evento || null,
      horario_inicio_fase: n.horario_inicio_fase || null,
      horario_fim_fase: n.horario_fim_fase || null,
      iniciado_em: n.iniciado_em || new Date().toISOString(),
      finalizado_em: n.finalizado_em,
      status: n.status,
      quantidade_perguntas: n.quantidade_perguntas,
      quantidade_acertos: n.quantidade_acertos,
      pontuacao: n.pontuacao,
      tempo_total_segundos: n.tempo_total_segundos,
      posicao_ranking: n.posicao_ranking != null ? n.posicao_ranking : null
    };
  }

  function ordenarRanking(lista) {
    return (lista || []).slice().sort(function (a, b) {
      if (b.pontuacao !== a.pontuacao) return b.pontuacao - a.pontuacao;
      if (b.quantidade_acertos !== a.quantidade_acertos) return b.quantidade_acertos - a.quantidade_acertos;
      if (a.tempo_total_segundos !== b.tempo_total_segundos) return a.tempo_total_segundos - b.tempo_total_segundos;
      return String(a.finalizado_em || "").localeCompare(String(b.finalizado_em || ""));
    });
  }

  function listarLocal(filtros) {
    filtros = filtros || {};
    return lerCache().map(normalizar).filter(function (p) {
      if (!p) return false;
      if (filtros.faseId && p.fase_id !== filtros.faseId) return false;
      if (filtros.status && p.status !== filtros.status) return false;
      if (filtros.tipoPublico && p.tipo_publico !== filtros.tipoPublico) return false;
      if (filtros.dataEvento && p.data_evento !== filtros.dataEvento) return false;
      return true;
    });
  }

  function buscarRemoto(filtros) {
    filtros = filtros || {};
    var cliente = db();
    if (!cliente) {
      return Promise.resolve({ ok: false, motivo: "sem_cliente", dados: listarLocal(filtros) });
    }

    var query = cliente.from(TABELA).select("*").order("pontuacao", { ascending: false }).limit(1000);
    if (filtros.faseId) query = query.eq("fase_id", filtros.faseId);
    if (filtros.status) query = query.eq("status", filtros.status);
    if (filtros.tipoPublico) query = query.eq("tipo_publico", filtros.tipoPublico);
    if (filtros.dataEvento) query = query.eq("data_evento", filtros.dataEvento);

    return query.then(function (res) {
      if (res.error) {
        return {
          ok: false,
          motivo: res.error.message || "erro_supabase",
          codigo: res.error.code,
          dados: listarLocal(filtros)
        };
      }
      var remotos = (res.data || []).map(normalizar);
      var mesclado = mesclarPorId(listarLocal(filtros), remotos);
      if (!filtros.faseId && !filtros.status) {
        salvarCache(mesclarPorId(lerCache().map(normalizar), remotos));
      } else {
        salvarCache(mesclarPorId(lerCache().map(normalizar), remotos));
      }
      return { ok: true, dados: mesclado, remoto: true };
    }).catch(function (err) {
      return {
        ok: false,
        motivo: (err && err.message) || "falha_rede",
        dados: listarLocal(filtros)
      };
    });
  }

  function upsertLocal(registro) {
    var n = normalizar(registro);
    var lista = lerCache().map(normalizar);
    var achou = false;
    for (var i = 0; i < lista.length; i++) {
      if (lista[i].id === n.id) {
        lista[i] = Object.assign({}, lista[i], n);
        achou = true;
        break;
      }
    }
    if (!achou) lista.push(n);
    salvarCache(lista);
    return n;
  }

  function salvarRemoto(registro) {
    var linha = paraLinhaSupabase(registro);
    upsertLocal(linha);
    var cliente = db();
    if (!cliente) {
      return Promise.resolve({ ok: false, motivo: "sem_cliente", local: true, registro: linha });
    }
    return cliente
      .from(TABELA)
      .upsert(linha, { onConflict: "id" })
      .select("*")
      .single()
      .then(function (res) {
        if (res.error) {
          return { ok: false, motivo: res.error.message || "erro_upsert", codigo: res.error.code, local: true, registro: linha };
        }
        var salvo = normalizar(res.data);
        upsertLocal(salvo);
        return { ok: true, remoto: true, registro: salvo };
      })
      .catch(function (err) {
        return { ok: false, motivo: (err && err.message) || "falha_rede", local: true, registro: linha };
      });
  }

  function atualizarRemoto(id, patch) {
    var atual = lerCache().map(normalizar).find(function (p) { return p.id === id; }) || { id: id };
    var mesclado = Object.assign({}, atual, patch, { id: id });
    return salvarRemoto(mesclado);
  }

  function rankingFase(faseId, apenasConcluidas) {
    var status = apenasConcluidas === false ? null : "concluida";
    return buscarRemoto({ faseId: faseId, status: status || undefined }).then(function (res) {
      var lista = (res.dados || []).filter(function (p) {
        if (p.fase_id !== faseId) return false;
        if (status) return p.status === status;
        return true;
      });
      return {
        ok: res.ok,
        motivo: res.motivo,
        ranking: ordenarRanking(lista)
      };
    });
  }

  function jaParticipou(nome, tipo, faseId) {
    var chave = String(nome || "").trim().toLowerCase();
    return buscarRemoto({ faseId: faseId, status: "concluida" }).then(function (res) {
      var existe = (res.dados || []).some(function (p) {
        return (
          p.fase_id === faseId &&
          p.status === "concluida" &&
          String(p.participante_nome || "").trim().toLowerCase() === chave &&
          p.tipo_publico === tipo
        );
      });
      return { ok: res.ok, existe: existe, motivo: res.motivo };
    });
  }

  function statusNuvem() {
    var cliente = db();
    if (!cliente) return Promise.resolve({ ok: false, motivo: "Cliente Supabase indisponível." });
    return cliente
      .from(TABELA)
      .select("id")
      .limit(1)
      .then(function (res) {
        if (res.error) {
          return {
            ok: false,
            motivo: res.error.message,
            precisaSchema: /relation|does not exist|PGRST/i.test(res.error.message || "")
          };
        }
        return { ok: true };
      })
      .catch(function (err) {
        return { ok: false, motivo: (err && err.message) || "falha_rede" };
      });
  }

  global.QuizStore = {
    STORAGE_CACHE: STORAGE_CACHE,
    gerarUuid: gerarUuid,
    normalizar: normalizar,
    ordenarRanking: ordenarRanking,
    listarLocal: listarLocal,
    buscarRemoto: buscarRemoto,
    salvarRemoto: salvarRemoto,
    atualizarRemoto: atualizarRemoto,
    rankingFase: rankingFase,
    jaParticipou: jaParticipou,
    statusNuvem: statusNuvem,
    upsertLocal: upsertLocal,
    lerCache: function () { return lerCache().map(normalizar); }
  };
})(window);
