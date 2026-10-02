/**
 * Persistência oficial no Supabase + Realtime.
 * Cache local apenas para UI offline — nunca fonte oficial do ranking.
 */
(function (global) {
  "use strict";

  var STORAGE_CACHE = "quizEnableParticipacoesCache";
  var STORAGE_PRIV = "quizEnablePrivacidadeNome";
  var STORAGE_LAST_SYNC = "quizEnableUltimaSync";
  var TABELA = "participacoes";
  var TABELA_CONFIG = "config_quiz";
  var canal = null;
  var ouvintes = [];

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

  function agoraIso() {
    return new Date().toISOString();
  }

  function marcarSync() {
    localStorage.setItem(STORAGE_LAST_SYNC, agoraIso());
  }

  function ultimaSync() {
    return localStorage.getItem(STORAGE_LAST_SYNC) || null;
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
      posicao_ranking: p.posicao_ranking != null ? p.posicao_ranking : (p.posicaoRanking != null ? p.posicaoRanking : null),
      sincronizado: p.sincronizado !== false,
      pendente_sync: !!p.pendente_sync,
      excluida: !!(p.excluida || p.status === "excluida"),
      excluida_em: p.excluida_em || p.excluidaEm || null,
      excluida_por: p.excluida_por || p.excluidaPorAdministradorId || null,
      motivo_exclusao: p.motivo_exclusao || p.motivoExclusao || null
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
      iniciado_em: n.iniciado_em || agoraIso(),
      finalizado_em: n.finalizado_em,
      status: n.status,
      quantidade_perguntas: n.quantidade_perguntas,
      quantidade_acertos: n.quantidade_acertos,
      pontuacao: n.pontuacao,
      tempo_total_segundos: n.tempo_total_segundos,
      posicao_ranking: n.posicao_ranking,
      sincronizado: true,
      excluida: !!n.excluida,
      excluida_em: n.excluida_em || null,
      excluida_por: n.excluida_por || null,
      motivo_exclusao: n.motivo_exclusao || null,
      atualizado_em: agoraIso()
    };
  }

  function ordenarRanking(lista) {
    return (lista || []).slice().sort(function (a, b) {
      if (b.pontuacao !== a.pontuacao) return b.pontuacao - a.pontuacao;
      if (b.quantidade_acertos !== a.quantidade_acertos) return b.quantidade_acertos - a.quantidade_acertos;
      if (a.tempo_total_segundos !== b.tempo_total_segundos) return a.tempo_total_segundos - b.tempo_total_segundos;
      return String(a.finalizado_em || "").localeCompare(String(b.finalizado_em || ""));
    }).map(function (p, i) {
      return Object.assign({}, p, { posicao_ranking: p.posicao_ranking || (i + 1) });
    });
  }

  function privacidadeAtual() {
    return localStorage.getItem(STORAGE_PRIV) || "primeiro_inicial";
  }

  function salvarPrivacidadeLocal(modo) {
    localStorage.setItem(STORAGE_PRIV, modo || "primeiro_inicial");
  }

  function formatarNomePublico(nomeCompleto, modo) {
    var nome = String(nomeCompleto || "").trim().replace(/\s+/g, " ");
    if (!nome) return "Participante";
    modo = modo || privacidadeAtual();
    var partes = nome.split(" ");
    var primeiro = partes[0];
    var ultimo = partes.length > 1 ? partes[partes.length - 1] : "";

    if (modo === "completo") return nome;

    if (modo === "mascarado") {
      function mask(s) {
        if (!s) return "";
        if (s.length === 1) return s;
        return s.charAt(0) + Array(Math.max(1, s.length - 1) + 1).join("*");
      }
      return ultimo ? mask(primeiro) + " " + mask(ultimo) : mask(primeiro);
    }

    // padrão: primeiro + inicial
    if (ultimo) return primeiro + " " + ultimo.charAt(0).toUpperCase() + ".";
    return primeiro;
  }

  function listarLocal(filtros) {
    filtros = filtros || {};
    return lerCache().map(normalizar).filter(function (p) {
      if (!p) return false;
      if (filtros.faseId && p.fase_id !== filtros.faseId) return false;
      if (filtros.status && p.status !== filtros.status) return false;
      if (filtros.tipoPublico && p.tipo_publico !== filtros.tipoPublico) return false;
      if (filtros.dataEvento && String(p.data_evento) !== String(filtros.dataEvento)) return false;
      if (!filtros.incluirExcluidas && (p.excluida || p.status === "excluida")) return false;
      return true;
    });
  }

  function notificar(evento, payload) {
    ouvintes.slice().forEach(function (fn) {
      try { fn(evento, payload); } catch (e) { /* ignore */ }
    });
  }

  function buscarRemoto(filtros) {
    filtros = filtros || {};
    var cliente = db();
    if (!cliente) {
      return Promise.resolve({
        ok: false,
        oficial: false,
        motivo: "sem_cliente",
        dados: listarLocal(filtros),
        ultimaSync: ultimaSync()
      });
    }

    var query = cliente.from(TABELA).select("*").order("pontuacao", { ascending: false }).limit(2000);
    if (filtros.faseId) query = query.eq("fase_id", filtros.faseId);
    if (filtros.status) query = query.eq("status", filtros.status);
    if (filtros.tipoPublico) query = query.eq("tipo_publico", filtros.tipoPublico);
    if (filtros.dataEvento) query = query.eq("data_evento", filtros.dataEvento);

    return query.then(function (res) {
      if (res.error) {
        return {
          ok: false,
          oficial: false,
          motivo: res.error.message || "erro_supabase",
          codigo: res.error.code,
          dados: listarLocal(filtros),
          ultimaSync: ultimaSync()
        };
      }
      var remotos = (res.data || []).map(normalizar);
      salvarCache(mesclarPorId(lerCache().map(normalizar), remotos));
      marcarSync();
      var filtrados = remotos.filter(function (p) {
        if (!filtros.incluirExcluidas && (p.excluida || p.status === "excluida")) return false;
        return true;
      });
      return {
        ok: true,
        oficial: true,
        dados: filtrados,
        ultimaSync: ultimaSync()
      };
    }).catch(function (err) {
      return {
        ok: false,
        oficial: false,
        motivo: (err && err.message) || "falha_rede",
        dados: listarLocal(filtros),
        ultimaSync: ultimaSync()
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

  function recalcularRemoto(faseId) {
    var cliente = db();
    if (!cliente || !faseId) return Promise.resolve({ ok: false });
    return cliente.rpc("recalcular_ranking_fase", { p_fase_id: faseId }).then(function (res) {
      if (res.error) return { ok: false, motivo: res.error.message };
      return { ok: true };
    }).catch(function () {
      return { ok: false };
    });
  }

  function salvarRemoto(registro) {
    var linha = paraLinhaSupabase(registro);
    upsertLocal(Object.assign({}, linha, { pendente_sync: true, sincronizado: false }));
    var cliente = db();
    if (!cliente) {
      return Promise.resolve({
        ok: false,
        oficial: false,
        motivo: "sem_cliente",
        aguardandoSync: true,
        registro: Object.assign({}, linha, { status: linha.status === "concluida" ? "aguardando_sync" : linha.status, pendente_sync: true })
      });
    }
    return cliente
      .from(TABELA)
      .upsert(linha, { onConflict: "id" })
      .select("*")
      .single()
      .then(function (res) {
        if (res.error) {
          return {
            ok: false,
            oficial: false,
            motivo: res.error.message || "erro_upsert",
            codigo: res.error.code,
            aguardandoSync: true,
            registro: Object.assign({}, linha, { pendente_sync: true })
          };
        }
        var salvo = normalizar(res.data);
        upsertLocal(Object.assign({}, salvo, { pendente_sync: false, sincronizado: true }));
        marcarSync();
        return recalcularRemoto(salvo.fase_id).then(function () {
          notificar("participacao_salva", salvo);
          return { ok: true, oficial: true, remoto: true, registro: salvo };
        });
      })
      .catch(function (err) {
        return {
          ok: false,
          oficial: false,
          motivo: (err && err.message) || "falha_rede",
          aguardandoSync: true,
          registro: Object.assign({}, linha, { pendente_sync: true })
        };
      });
  }

  function atualizarRemoto(id, patch) {
    var atual = lerCache().map(normalizar).find(function (p) { return p.id === id; }) || { id: id };
    return salvarRemoto(Object.assign({}, atual, patch, { id: id }));
  }

  function rankingFase(faseId, apenasConcluidas) {
    return buscarRemoto({ faseId: faseId, incluirExcluidas: true }).then(function (res) {
      var lista = (res.dados || []).filter(function (p) {
        if (p.fase_id !== faseId) return false;
        if (p.excluida || p.status === "excluida") return false;
        if (apenasConcluidas !== false) return p.status === "concluida";
        return true;
      });
      var ranking = ordenarRanking(lista);
      if (!res.oficial) {
        ranking = ranking.map(function (p) {
          return Object.assign({}, p, { _cache: true });
        });
      }
      return {
        ok: res.ok,
        oficial: !!res.oficial,
        motivo: res.motivo,
        ranking: ranking,
        ultimaSync: res.ultimaSync || ultimaSync()
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
      return { ok: res.ok, oficial: res.oficial, existe: existe, motivo: res.motivo };
    });
  }

  function carregarPrivacidade() {
    var cliente = db();
    var local = privacidadeAtual();
    if (!cliente) return Promise.resolve(local);
    return cliente
      .from(TABELA_CONFIG)
      .select("privacidade_nome")
      .eq("id", "padrao")
      .maybeSingle()
      .then(function (res) {
        if (res.error || !res.data) return local;
        salvarPrivacidadeLocal(res.data.privacidade_nome);
        return res.data.privacidade_nome;
      })
      .catch(function () { return local; });
  }

  function salvarPrivacidade(modo) {
    salvarPrivacidadeLocal(modo);
    var cliente = db();
    if (!cliente) return Promise.resolve({ ok: false, local: true });
    return cliente
      .from(TABELA_CONFIG)
      .upsert({ id: "padrao", privacidade_nome: modo, atualizado_em: agoraIso() })
      .then(function (res) {
        if (res.error) return { ok: false, motivo: res.error.message };
        notificar("config", { privacidade_nome: modo });
        return { ok: true };
      })
      .catch(function (err) {
        return { ok: false, motivo: (err && err.message) || "falha" };
      });
  }

  function assinarRealtime(opcoes) {
    opcoes = opcoes || {};
    var cliente = db();
    if (!cliente || !cliente.channel) {
      return { ok: false, unsubscribe: function () {} };
    }
    if (canal) {
      try { cliente.removeChannel(canal); } catch (e) { /* ignore */ }
      canal = null;
    }

    var filtro = opcoes.faseId ? "fase_id=eq." + opcoes.faseId : undefined;
    canal = cliente
      .channel("ranking-" + (opcoes.faseId || "todas") + "-" + Date.now())
      .on(
        "postgres_changes",
        Object.assign(
          { event: "*", schema: "public", table: TABELA },
          filtro ? { filter: filtro } : {}
        ),
        function (payload) {
          var row = normalizar(payload.new || payload.old);
          if (row) {
            if (payload.eventType === "DELETE") {
              var lista = lerCache().map(normalizar).filter(function (p) { return p.id !== row.id; });
              salvarCache(lista);
            } else {
              upsertLocal(row);
            }
          }
          marcarSync();
          notificar("realtime", { tipo: payload.eventType, row: row, raw: payload });
        }
      )
      .subscribe(function (status) {
        notificar("conexao", { status: status });
      });

    return {
      ok: true,
      unsubscribe: function () {
        if (canal && cliente) {
          try { cliente.removeChannel(canal); } catch (e) { /* ignore */ }
          canal = null;
        }
      }
    };
  }

  function onEvento(fn) {
    if (typeof fn === "function") ouvintes.push(fn);
    return function () {
      ouvintes = ouvintes.filter(function (f) { return f !== fn; });
    };
  }

  function excluirParticipacao(id, motivo, adminId) {
    var cliente = db();
    if (!navigator.onLine) {
      return Promise.resolve({ ok: false, codigo: "conexao", oficial: false });
    }
    if (!cliente) {
      return Promise.resolve({ ok: false, codigo: "config", oficial: false });
    }
    if (!motivo || String(motivo).trim().length < 2) {
      return Promise.resolve({ ok: false, codigo: "motivo_invalido", oficial: false });
    }

    return cliente
      .rpc("excluir_participacao_admin", {
        p_id: id,
        p_motivo: String(motivo).trim(),
        p_admin_id: adminId || "admin"
      })
      .then(function (res) {
        if (res.error) {
          var msg = (res.error.message || "").toLowerCase();
          if (/permission|rls|not allowed|jwt/i.test(msg)) {
            return { ok: false, codigo: "permissao", oficial: false };
          }
          if (/function|does not exist|schema cache|pgrst202/i.test(msg)) {
            // Fallback controlado: update remoto direto (ainda exige confirmação do banco)
            return excluirPorUpdateDireto(id, motivo, adminId);
          }
          return { ok: false, codigo: "conexao", oficial: false, detalheTecnico: res.error.message };
        }
        var body = res.data || {};
        if (body.ok === false) {
          return { ok: false, codigo: body.codigo || "erro", oficial: false };
        }
        return buscarRemoto({ incluirExcluidas: true }).then(function (remoto) {
          marcarSync();
          notificar("participacao_excluida", { id: id });
          return {
            ok: true,
            oficial: true,
            codigo: "ok",
            faseId: body.fase_id || null,
            remotoOk: !!remoto.ok
          };
        });
      })
      .catch(function () {
        return { ok: false, codigo: "conexao", oficial: false };
      });
  }

  function excluirPorUpdateDireto(id, motivo, adminId) {
    var cliente = db();
    var patch = {
      status: "excluida",
      excluida: true,
      excluida_em: agoraIso(),
      excluida_por: adminId || "admin",
      motivo_exclusao: String(motivo).trim(),
      posicao_ranking: null,
      atualizado_em: agoraIso()
    };
    return cliente
      .from(TABELA)
      .update(patch)
      .eq("id", id)
      .select("*")
      .single()
      .then(function (res) {
        if (res.error || !res.data) {
          var msg = ((res.error && res.error.message) || "").toLowerCase();
          if (/permission|rls|not allowed/i.test(msg)) {
            return { ok: false, codigo: "permissao", oficial: false };
          }
          if (/column|excluida|does not exist/i.test(msg)) {
            return { ok: false, codigo: "config", oficial: false };
          }
          return { ok: false, codigo: "conexao", oficial: false };
        }
        var salvo = normalizar(res.data);
        upsertLocal(salvo);
        return recalcularRemoto(salvo.fase_id).then(function (rec) {
          if (!rec.ok) {
            console.warn("[Quiz] Recálculo de ranking falhou após exclusão");
          }
          return buscarRemoto({ incluirExcluidas: true }).then(function () {
            marcarSync();
            notificar("participacao_excluida", { id: id });
            return { ok: true, oficial: true, codigo: "ok", faseId: salvo.fase_id };
          });
        });
      })
      .catch(function () {
        return { ok: false, codigo: "conexao", oficial: false };
      });
  }

  function restaurarParticipacao(id, adminId) {
    var cliente = db();
    if (!navigator.onLine || !cliente) {
      return Promise.resolve({ ok: false, codigo: !navigator.onLine ? "conexao" : "config", oficial: false });
    }
    return cliente
      .rpc("restaurar_participacao_admin", {
        p_id: id,
        p_admin_id: adminId || "admin"
      })
      .then(function (res) {
        if (res.error) {
          var msg = (res.error.message || "").toLowerCase();
          if (/function|does not exist|schema cache|pgrst202/i.test(msg)) {
            return cliente
              .from(TABELA)
              .update({
                status: "concluida",
                excluida: false,
                excluida_em: null,
                excluida_por: null,
                motivo_exclusao: null,
                atualizado_em: agoraIso()
              })
              .eq("id", id)
              .select("*")
              .single()
              .then(function (u) {
                if (u.error || !u.data) {
                  return { ok: false, codigo: "conexao", oficial: false };
                }
                var salvo = normalizar(u.data);
                upsertLocal(salvo);
                return recalcularRemoto(salvo.fase_id).then(function () {
                  marcarSync();
                  return { ok: true, oficial: true, codigo: "ok" };
                });
              });
          }
          if (/permission|rls/i.test(msg)) return { ok: false, codigo: "permissao", oficial: false };
          return { ok: false, codigo: "conexao", oficial: false };
        }
        var body = res.data || {};
        if (body.ok === false) return { ok: false, codigo: body.codigo || "erro", oficial: false };
        return buscarRemoto({ incluirExcluidas: true }).then(function () {
          marcarSync();
          return { ok: true, oficial: true, codigo: "ok" };
        });
      })
      .catch(function () {
        return { ok: false, codigo: "conexao", oficial: false };
      });
  }

  function statusNuvem() {
    var cliente = db();
    if (!navigator.onLine) {
      return Promise.resolve({ ok: false, codigo: "conexao", motivo: "offline" });
    }
    if (!cliente) {
      return Promise.resolve({ ok: false, codigo: "config", motivo: "sem_cliente" });
    }
    return cliente
      .from(TABELA)
      .select("id")
      .limit(1)
      .then(function (res) {
        if (res.error) {
          var msg = (res.error.message || "").toLowerCase();
          return {
            ok: false,
            codigo: /permission|rls/i.test(msg) ? "permissao" : (/relation|does not exist/i.test(msg) ? "config" : "conexao"),
            motivo: res.error.message
          };
        }
        return { ok: true, codigo: "ok" };
      })
      .catch(function () {
        return { ok: false, codigo: "conexao", motivo: "falha_rede" };
      });
  }

  function mensagemErroAdmin(codigo) {
    if (codigo === "permissao") {
      return "Você não tem permissão para excluir esta participação.";
    }
    if (codigo === "config") {
      return "Não foi possível concluir a exclusão. Entre em contato com o responsável técnico pelo sistema.";
    }
    if (codigo === "motivo_invalido") {
      return "Informe o motivo da exclusão.";
    }
    if (codigo === "nao_encontrada" || codigo === "ja_excluida") {
      return "Não foi possível concluir a exclusão. Atualize a lista e tente novamente.";
    }
    return "Não foi possível concluir a exclusão neste momento. Verifique sua conexão e tente novamente.";
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
    lerCache: function () { return lerCache().map(normalizar); },
    formatarNomePublico: formatarNomePublico,
    privacidadeAtual: privacidadeAtual,
    carregarPrivacidade: carregarPrivacidade,
    salvarPrivacidade: salvarPrivacidade,
    assinarRealtime: assinarRealtime,
    onEvento: onEvento,
    ultimaSync: ultimaSync,
    recalcularRemoto: recalcularRemoto,
    excluirParticipacao: excluirParticipacao,
    restaurarParticipacao: restaurarParticipacao,
    mensagemErroAdmin: mensagemErroAdmin
  };
})(window);
