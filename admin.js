(function () {
  "use strict";

  try {
    var db = typeof obterClienteSupabase === "function" ? obterClienteSupabase() : null;
    var cacheParticipantes = [];

    var els = {
      secaoLogin: document.getElementById("secao-login"),
      secaoPainel: document.getElementById("secao-painel"),
      formLogin: document.getElementById("form-login"),
      loginEmail: document.getElementById("login-email"),
      loginSenha: document.getElementById("login-senha"),
      loginEmailErro: document.getElementById("login-email-erro"),
      loginSenhaErro: document.getElementById("login-senha-erro"),
      btnEntrar: document.getElementById("btn-entrar"),
      btnSair: document.getElementById("btn-sair"),
      usuarioLogado: document.getElementById("usuario-logado"),
      busca: document.getElementById("busca-nome"),
      corpo: document.getElementById("corpo-tabela"),
      vazia: document.getElementById("tabela-vazia"),
      resumo: document.getElementById("resumo-tabela"),
      btnExportar: document.getElementById("btn-exportar"),
      btnLimpar: document.getElementById("btn-limpar-todos"),
      btnAtualizar: document.getElementById("btn-atualizar"),
      avisos: document.getElementById("avisos-admin"),
      dialogo: document.getElementById("dialogo-confirmacao"),
      dialogoTitulo: document.getElementById("dialogo-titulo"),
      dialogoTexto: document.getElementById("dialogo-texto"),
      dialogoCancelar: document.getElementById("dialogo-cancelar"),
      dialogoConfirmar: document.getElementById("dialogo-confirmar"),
      tabela: document.getElementById("tabela-participantes")
    };

    var estadoDialogo = {
      aberto: false,
      aoConfirmar: null,
      focoAnterior: null,
      forte: false
    };

    function anunciar(mensagem) {
      if (!els.avisos) return;
      els.avisos.textContent = "";
      window.requestAnimationFrame(function () {
        els.avisos.textContent = mensagem;
      });
    }

    function limparErro(input, erroEl) {
      if (input) {
        input.classList.remove("campo-invalido");
        input.removeAttribute("aria-invalid");
      }
      if (erroEl) {
        erroEl.hidden = true;
        erroEl.textContent = "";
      }
    }

    function marcarErro(input, erroEl, mensagem) {
      if (input) {
        input.classList.add("campo-invalido");
        input.setAttribute("aria-invalid", "true");
      }
      if (erroEl) {
        erroEl.hidden = false;
        erroEl.textContent = mensagem;
      }
    }

    function ordenarParticipantes(lista) {
      return lista.slice().sort(function (a, b) {
        if (b.pontos !== a.pontos) return b.pontos - a.pontos;
        var tempoA = Number(a.tempo_segundos) || 0;
        var tempoB = Number(b.tempo_segundos) || 0;
        if (tempoA !== tempoB) return tempoA - tempoB;
        return String(a.criado_em || "").localeCompare(String(b.criado_em || ""));
      });
    }

    function formatarTempo(totalSegundos) {
      var s = Math.max(0, Math.floor(Number(totalSegundos) || 0));
      var min = Math.floor(s / 60);
      var seg = s % 60;
      return min + "min " + (seg < 10 ? "0" : "") + seg + "s";
    }

    function formatarDataHora(valor) {
      if (!valor) return "Não informado";
      var d = new Date(valor);
      if (isNaN(d.getTime())) return "Não informado";
      return d.toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      });
    }

    function textoPremio(item) {
      if (item && item.premio && String(item.premio).trim()) {
        return String(item.premio).trim();
      }
      return "Não sorteado";
    }

    function textoTipo(item) {
      var tipo = item && item.tipo_participante ? String(item.tipo_participante) : "";
      if (tipo === "colaborador") return "Colaborador";
      if (tipo === "terceiro") return "Terceiro";
      return "Não informado";
    }

    function textoMatriculaAdmin(item) {
      if (item && item.tipo_participante === "colaborador") {
        return item.matricula ? String(item.matricula) : "—";
      }
      return "—";
    }

    function textoEmpresaAdmin(item) {
      if (item && item.tipo_participante === "terceiro") {
        return item.empresa ? String(item.empresa) : "—";
      }
      return "—";
    }

    function escaparHtml(texto) {
      return String(texto)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
    }

    function mostrarLogin() {
      if (els.secaoLogin) els.secaoLogin.hidden = false;
      if (els.secaoPainel) els.secaoPainel.hidden = true;
      cacheParticipantes = [];
    }

    function mostrarPainel(usuario) {
      if (els.secaoLogin) els.secaoLogin.hidden = true;
      if (els.secaoPainel) els.secaoPainel.hidden = false;
      if (els.usuarioLogado) {
        els.usuarioLogado.textContent = usuario && usuario.email
          ? "Conectado como " + usuario.email
          : "Sessão autenticada";
      }
    }

    function obterFiltrados() {
      var termo = els.busca ? els.busca.value.trim().toLowerCase() : "";
      var ordenado = ordenarParticipantes(cacheParticipantes);
      var comPosicao = ordenado.map(function (item, indice) {
        return { item: item, posicao: indice + 1 };
      });
      if (!termo) return comPosicao;
      return comPosicao.filter(function (entrada) {
        var nome = entrada.item && entrada.item.nome ? String(entrada.item.nome).toLowerCase() : "";
        return nome.indexOf(termo) !== -1;
      });
    }

    function renderizarTabela() {
      var filtrados = obterFiltrados();
      var total = cacheParticipantes.length;
      els.corpo.innerHTML = "";

      if (!filtrados.length) {
        els.tabela.hidden = true;
        els.vazia.hidden = false;
        els.resumo.textContent = total
          ? "Nenhum nome corresponde à busca. Total: " + total + "."
          : "Nenhum participante no Supabase.";
        els.vazia.textContent = total
          ? "Nenhum participante corresponde ao filtro de busca."
          : "Nenhum participante encontrado.";
        return;
      }

      els.tabela.hidden = false;
      els.vazia.hidden = true;
      els.resumo.textContent =
        "Exibindo " + filtrados.length + " de " + total + " participante(s).";

      for (var i = 0; i < filtrados.length; i++) {
        var entrada = filtrados[i];
        var item = entrada.item;
        var tr = document.createElement("tr");
        tr.innerHTML =
          "<td>" +
          entrada.posicao +
          "º</td>" +
          '<th scope="row">' +
          escaparHtml(item.nome || "Sem nome") +
          "</th>" +
          "<td>" +
          escaparHtml(textoTipo(item)) +
          "</td>" +
          "<td>" +
          escaparHtml(textoMatriculaAdmin(item)) +
          "</td>" +
          "<td>" +
          escaparHtml(textoEmpresaAdmin(item)) +
          "</td>" +
          "<td>" +
          (item.pontos != null ? item.pontos : "—") +
          "</td>" +
          "<td>" +
          (item.acertos != null ? item.acertos : "—") +
          "</td>" +
          "<td>" +
          formatarTempo(item.tempo_segundos) +
          "</td>" +
          "<td>" +
          formatarDataHora(item.criado_em) +
          "</td>" +
          "<td>" +
          escaparHtml(textoPremio(item)) +
          "</td>" +
          "<td>" +
          '<button type="button" class="btn btn-perigo btn-excluir" data-id="' +
          escaparHtml(item.id) +
          '" data-nome="' +
          escaparHtml(item.nome || "Sem nome") +
          '">Excluir</button>' +
          "</td>";
        els.corpo.appendChild(tr);
      }
    }

    function carregarParticipantes() {
      if (!db) {
        anunciar("Cliente Supabase indisponível. Verifique supabase-config.js e a conexão.");
        return Promise.resolve();
      }
      anunciar("Carregando participantes…");
      return db
        .from("participantes")
        .select(
          "id, nome, tipo_participante, matricula, empresa, pontos, acertos, tempo_segundos, premio, criado_em"
        )
        .order("pontos", { ascending: false })
        .order("tempo_segundos", { ascending: true })
        .order("criado_em", { ascending: true })
        .then(function (resultado) {
          if (resultado.error) throw resultado.error;
          cacheParticipantes = resultado.data || [];
          renderizarTabela();
          anunciar(cacheParticipantes.length + " participante(s) carregado(s).");
        })
        .catch(function () {
          anunciar("Não foi possível carregar os participantes. Confirme a tabela e as políticas RLS.");
        });
    }

    function obterFocaveis(container) {
      return Array.prototype.slice
        .call(
          container.querySelectorAll(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
        )
        .filter(function (el) {
          return !el.hasAttribute("hidden") && el.offsetParent !== null;
        });
    }

    function fecharDialogo(anular) {
      if (!estadoDialogo.aberto) return;
      estadoDialogo.aberto = false;
      estadoDialogo.aoConfirmar = null;
      els.dialogo.hidden = true;
      els.dialogo.classList.remove("dialogo-forte");
      document.removeEventListener("keydown", noTecladoDialogo, true);
      if (estadoDialogo.focoAnterior && estadoDialogo.focoAnterior.focus) {
        estadoDialogo.focoAnterior.focus();
      }
      estadoDialogo.focoAnterior = null;
      if (anular) anunciar("Ação cancelada.");
    }

    function noTecladoDialogo(evento) {
      if (!estadoDialogo.aberto) return;
      if (evento.key === "Escape") {
        evento.preventDefault();
        fecharDialogo(true);
        return;
      }
      if (evento.key !== "Tab") return;
      var focaveis = obterFocaveis(els.dialogo);
      if (!focaveis.length) return;
      var primeiro = focaveis[0];
      var ultimo = focaveis[focaveis.length - 1];
      if (evento.shiftKey && document.activeElement === primeiro) {
        evento.preventDefault();
        ultimo.focus();
      } else if (!evento.shiftKey && document.activeElement === ultimo) {
        evento.preventDefault();
        primeiro.focus();
      }
    }

    function abrirDialogo(opcoes) {
      estadoDialogo.focoAnterior = document.activeElement;
      estadoDialogo.aoConfirmar = opcoes.aoConfirmar || null;
      estadoDialogo.aberto = true;
      els.dialogoTitulo.textContent = opcoes.titulo || "Confirmar ação";
      els.dialogoTexto.textContent = opcoes.texto || "";
      els.dialogoConfirmar.textContent = opcoes.rotuloConfirmar || "Confirmar";
      els.dialogoCancelar.textContent = opcoes.rotuloCancelar || "Cancelar";
      if (opcoes.forte) els.dialogo.classList.add("dialogo-forte");
      else els.dialogo.classList.remove("dialogo-forte");
      els.dialogo.hidden = false;
      document.addEventListener("keydown", noTecladoDialogo, true);
      window.requestAnimationFrame(function () {
        els.dialogoTitulo.focus();
      });
    }

    function excluirParticipante(id, nome) {
      abrirDialogo({
        titulo: "Excluir participante",
        texto:
          'Tem certeza de que deseja excluir "' +
          nome +
          '" do Supabase? Esta ação não pode ser desfeita.',
        rotuloConfirmar: "Excluir",
        aoConfirmar: function () {
          if (!db) {
            anunciar("Cliente Supabase indisponível.");
            return;
          }
          if (!id) {
            anunciar("Não foi possível identificar o participante para exclusão.");
            return;
          }

          db.auth.getSession().then(function (sessaoRes) {
            var sessao = sessaoRes.data && sessaoRes.data.session;
            if (!sessao) {
              anunciar("Sua sessão expirou. Entre novamente para excluir participantes.");
              mostrarLogin();
              return null;
            }

            return db
              .from("participantes")
              .delete()
              .eq("id", id)
              .select("id");
          }).then(function (resultado) {
            if (!resultado) return;
            if (resultado.error) throw resultado.error;

            var removidos = resultado.data || [];
            if (!removidos.length) {
              anunciar(
                "Nenhum registro foi excluído. Confirme o login e execute as políticas de DELETE no Supabase (arquivo schema-participantes.sql)."
              );
              return;
            }

            anunciar('Participante "' + nome + '" excluído.');
            return carregarParticipantes();
          }).catch(function (erro) {
            var detalhe = erro && erro.message ? String(erro.message) : "";
            anunciar(
              "Não foi possível excluir o participante." +
                (detalhe ? " Detalhe: " + detalhe : " Verifique login e permissões RLS de DELETE.")
            );
          });
        }
      });
    }

    function limparTodos() {
      if (!cacheParticipantes.length) {
        anunciar("Não há resultados para limpar.");
        return;
      }
      abrirDialogo({
        titulo: "Limpar todos os resultados",
        texto:
          "ATENÇÃO: isso apagará permanentemente todos os " +
          cacheParticipantes.length +
          " registro(s) no Supabase. Deseja continuar?",
        rotuloConfirmar: "Sim, limpar todos",
        rotuloCancelar: "Não, manter resultados",
        forte: true,
        aoConfirmar: function () {
          if (!db) {
            anunciar("Cliente Supabase indisponível.");
            return;
          }

          var ids = cacheParticipantes
            .map(function (item) {
              return item.id;
            })
            .filter(Boolean);

          if (!ids.length) {
            anunciar("Não há IDs válidos para excluir.");
            return;
          }

          db.auth.getSession().then(function (sessaoRes) {
            var sessao = sessaoRes.data && sessaoRes.data.session;
            if (!sessao) {
              anunciar("Sua sessão expirou. Entre novamente para limpar os resultados.");
              mostrarLogin();
              return null;
            }

            return db.from("participantes").delete().in("id", ids).select("id");
          }).then(function (resultado) {
            if (!resultado) return;
            if (resultado.error) throw resultado.error;

            var removidos = resultado.data || [];
            if (!removidos.length) {
              anunciar(
                "Nenhum registro foi excluído. Execute as políticas de DELETE no Supabase e tente de novo."
              );
              return;
            }

            if (els.busca) els.busca.value = "";
            anunciar(removidos.length + " resultado(s) removido(s) do Supabase.");
            return carregarParticipantes();
          }).catch(function (erro) {
            var detalhe = erro && erro.message ? String(erro.message) : "";
            anunciar(
              "Não foi possível limpar os resultados." +
                (detalhe ? " Detalhe: " + detalhe : "")
            );
          });
        }
      });
    }

    function csvCelula(valor) {
      var texto = valor == null ? "" : String(valor);
      if (/[";\n\r]/.test(texto)) {
        return '"' + texto.replace(/"/g, '""') + '"';
      }
      return texto;
    }

    function dataArquivo() {
      var d = new Date();
      var y = d.getFullYear();
      var m = String(d.getMonth() + 1);
      var dia = String(d.getDate());
      if (m.length < 2) m = "0" + m;
      if (dia.length < 2) dia = "0" + dia;
      return y + "-" + m + "-" + dia;
    }

    function exportarCsv() {
      var ordenado = ordenarParticipantes(cacheParticipantes);
      if (!ordenado.length) {
        anunciar("Não há participantes para exportar.");
        return;
      }
      var linhas = [
        "posição;nome;tipo_participante;matricula;empresa;pontos;acertos;tempo;data_hora;premio"
      ];
      for (var i = 0; i < ordenado.length; i++) {
        var item = ordenado[i];
        var tipo = item.tipo_participante || "";
        linhas.push(
          [
            csvCelula(i + 1),
            csvCelula(item.nome || ""),
            csvCelula(tipo),
            csvCelula(tipo === "colaborador" ? item.matricula || "" : ""),
            csvCelula(tipo === "terceiro" ? item.empresa || "" : ""),
            csvCelula(item.pontos != null ? item.pontos : ""),
            csvCelula(item.acertos != null ? item.acertos : ""),
            csvCelula(formatarTempo(item.tempo_segundos)),
            csvCelula(formatarDataHora(item.criado_em)),
            csvCelula(textoPremio(item))
          ].join(";")
        );
      }
      var conteudo = "\uFEFF" + linhas.join("\r\n");
      var blob = new Blob([conteudo], { type: "text/csv;charset=utf-8;" });
      var nomeArquivo = "participantes-quiz-enable-" + dataArquivo() + ".csv";
      var url = URL.createObjectURL(blob);
      var link = document.createElement("a");
      link.href = url;
      link.download = nomeArquivo;
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      anunciar("Exportação concluída: " + nomeArquivo);
    }

    function entrar(evento) {
      evento.preventDefault();
      limparErro(els.loginEmail, els.loginEmailErro);
      limparErro(els.loginSenha, els.loginSenhaErro);

      var email = els.loginEmail ? els.loginEmail.value.trim() : "";
      var senha = els.loginSenha ? els.loginSenha.value : "";
      var ok = true;

      if (!email) {
        marcarErro(els.loginEmail, els.loginEmailErro, "Informe o e-mail.");
        ok = false;
      }
      if (!senha) {
        marcarErro(els.loginSenha, els.loginSenhaErro, "Informe a senha.");
        ok = false;
      }
      if (!ok) {
        anunciar("Corrija os campos do login.");
        return;
      }
      if (!db) {
        anunciar("Cliente Supabase indisponível.");
        return;
      }

      if (els.btnEntrar) els.btnEntrar.disabled = true;
      anunciar("Autenticando…");

      db.auth
        .signInWithPassword({ email: email, password: senha })
        .then(function (resultado) {
          if (els.btnEntrar) els.btnEntrar.disabled = false;
          if (resultado.error) {
            marcarErro(els.loginSenha, els.loginSenhaErro, "E-mail ou senha inválidos.");
            anunciar("Falha no login. Verifique e-mail e senha do usuário Supabase.");
            return;
          }
          if (els.loginSenha) els.loginSenha.value = "";
          mostrarPainel(resultado.data && resultado.data.user);
          anunciar("Login realizado com sucesso.");
          return carregarParticipantes();
        })
        .catch(function () {
          if (els.btnEntrar) els.btnEntrar.disabled = false;
          anunciar("Não foi possível autenticar agora. Tente novamente.");
        });
    }

    function sair() {
      if (!db) {
        mostrarLogin();
        return;
      }
      db.auth.signOut().then(function () {
        mostrarLogin();
        anunciar("Sessão encerrada.");
      });
    }

    function iniciarSessaoExistente() {
      if (!db) {
        anunciar("Configure o Supabase e execute o SQL da tabela participantes.");
        mostrarLogin();
        return;
      }
      db.auth.getSession().then(function (resultado) {
        var sessao = resultado.data && resultado.data.session;
        if (sessao && sessao.user) {
          mostrarPainel(sessao.user);
          carregarParticipantes();
        } else {
          mostrarLogin();
        }
      });
    }

    if (els.formLogin) els.formLogin.addEventListener("submit", entrar);
    if (els.btnSair) els.btnSair.addEventListener("click", sair);
    if (els.busca) els.busca.addEventListener("input", renderizarTabela);
    if (els.btnExportar) els.btnExportar.addEventListener("click", exportarCsv);
    if (els.btnLimpar) els.btnLimpar.addEventListener("click", limparTodos);
    if (els.btnAtualizar) els.btnAtualizar.addEventListener("click", carregarParticipantes);

    if (els.corpo) {
      els.corpo.addEventListener("click", function (evento) {
        var botao = evento.target.closest(".btn-excluir");
        if (!botao) return;
        excluirParticipante(botao.getAttribute("data-id"), botao.getAttribute("data-nome") || "Sem nome");
      });
    }

    if (els.dialogoCancelar) {
      els.dialogoCancelar.addEventListener("click", function () {
        fecharDialogo(true);
      });
    }
    if (els.dialogoConfirmar) {
      els.dialogoConfirmar.addEventListener("click", function () {
        var acao = estadoDialogo.aoConfirmar;
        fecharDialogo(false);
        if (typeof acao === "function") acao();
      });
    }
    if (els.dialogo) {
      els.dialogo.addEventListener("click", function (evento) {
        if (evento.target === els.dialogo) fecharDialogo(true);
      });
    }

    iniciarSessaoExistente();
  } catch (erroAdmin) {
    var caixa = document.getElementById("avisos-admin");
    if (caixa) {
      caixa.textContent =
        "A página administrativa carregou. Alguns recursos dinâmicos podem estar indisponíveis.";
    }
  }
})();
