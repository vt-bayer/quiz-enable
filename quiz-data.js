/**
 * Quiz ENABLE — configuração de fases, pontuação e banco de perguntas.
 * Fuso: America/Sao_Paulo
 */
(function (global) {
  "use strict";

  var PONTOS = { facil: 10, intermediaria: 20, dificil: 30 };
  var MAX_POR_FASE = 90;
  var PERGUNTAS_POR_FASE = 5;

  var FASES_PADRAO = [
    {
      id: "fase-1",
      nome: "Quiz do Almoço — Fase 1",
      ordem: 1,
      horarioInicio: "10:00",
      horarioFim: "11:30",
      status: "agendada",
      ativaManual: false,
      pausadaManual: false,
      rankingCongelado: false,
      embaralharPerguntas: true
    },
    {
      id: "fase-2",
      nome: "Quiz do Almoço — Fase 2",
      ordem: 2,
      horarioInicio: "11:40",
      horarioFim: "12:30",
      status: "agendada",
      ativaManual: false,
      pausadaManual: false,
      rankingCongelado: false,
      embaralharPerguntas: true
    },
    {
      id: "fase-3",
      nome: "Quiz do Almoço — Fase 3",
      ordem: 3,
      horarioInicio: "12:40",
      horarioFim: "14:00",
      status: "agendada",
      ativaManual: false,
      pausadaManual: false,
      rankingCongelado: false,
      embaralharPerguntas: true
    }
  ];

  var PERGUNTAS_PADRAO = [
    {
      id: "f1-q1",
      faseId: "fase-1",
      enunciado: "O que significa inclusão no ambiente de trabalho?",
      alternativas: [
        { id: "a", texto: "Criar condições para que todas as pessoas possam participar, contribuir e ser respeitadas.", correta: true },
        { id: "b", texto: "Tratar todas as pessoas do mesmo modo, sem considerar necessidades diferentes.", correta: false },
        { id: "c", texto: "Contratar pessoas com deficiência apenas para cumprir uma exigência formal.", correta: false },
        { id: "d", texto: "Oferecer ajuda sem perguntar se ela é desejada ou necessária.", correta: false }
      ],
      explicacao: "Inclusão é criar condições reais de participação, contribuição e respeito para todas as pessoas.",
      dificuldade: "facil",
      ordemNaFase: 1,
      status: "ativa"
    },
    {
      id: "f1-q2",
      faseId: "fase-1",
      enunciado: "Qual atitude ajuda uma pessoa com deficiência durante uma conversa?",
      alternativas: [
        { id: "a", texto: "Falar apenas com quem a acompanha.", correta: false },
        { id: "b", texto: "Falar diretamente com a pessoa, com respeito e atenção ao que ela comunica.", correta: true },
        { id: "c", texto: "Elevar o tom de voz automaticamente.", correta: false },
        { id: "d", texto: "Evitar perguntas para não errar.", correta: false }
      ],
      explicacao: "Fale diretamente com a pessoa, com respeito e atenção ao que ela comunica.",
      dificuldade: "facil",
      ordemNaFase: 2,
      status: "ativa"
    },
    {
      id: "f1-q3",
      faseId: "fase-1",
      enunciado: "Qual é a diferença entre igualdade e equidade?",
      alternativas: [
        { id: "a", texto: "Igualdade oferece o mesmo para todos; equidade considera necessidades diferentes para garantir oportunidades justas.", correta: true },
        { id: "b", texto: "Igualdade e equidade significam exatamente a mesma coisa.", correta: false },
        { id: "c", texto: "Equidade significa dar benefícios sem nenhum critério.", correta: false },
        { id: "d", texto: "Igualdade significa retirar adaptações para todos receberem o mesmo tratamento.", correta: false }
      ],
      explicacao: "Igualdade trata igualmente; equidade ajusta recursos às necessidades para oportunidades justas.",
      dificuldade: "intermediaria",
      ordemNaFase: 3,
      status: "ativa"
    },
    {
      id: "f1-q4",
      faseId: "fase-1",
      enunciado: "Por que uma legenda em vídeo melhora a acessibilidade?",
      alternativas: [
        { id: "a", texto: "Porque deixa o vídeo mais curto.", correta: false },
        { id: "b", texto: "Porque permite que pessoas surdas, com deficiência auditiva ou em ambientes sem áudio acompanhem o conteúdo.", correta: true },
        { id: "c", texto: "Porque elimina a necessidade de informações visuais acessíveis.", correta: false },
        { id: "d", texto: "Porque substitui todos os outros recursos de acessibilidade.", correta: false }
      ],
      explicacao: "Legendas oferecem alternativa textual para quem não ouve o áudio ou está em ambiente sem som.",
      dificuldade: "intermediaria",
      ordemNaFase: 4,
      status: "ativa"
    },
    {
      id: "f1-q5",
      faseId: "fase-1",
      enunciado: "Por que uma rampa, sozinha, não garante que um ambiente seja acessível?",
      alternativas: [
        { id: "a", texto: "Porque rampas nunca são necessárias.", correta: false },
        { id: "b", texto: "Porque basta qualquer inclinação para cumprir a acessibilidade.", correta: false },
        { id: "c", texto: "Porque a acessibilidade depende de vários fatores, como circulação, sinalização, mobiliário, comunicação e ausência de outras barreiras.", correta: true },
        { id: "d", texto: "Porque acessibilidade se resume a recursos digitais.", correta: false }
      ],
      explicacao: "Acessibilidade envolve circulação, sinalização, mobiliário, comunicação e atitudes — não só uma rampa.",
      dificuldade: "dificil",
      ordemNaFase: 5,
      status: "ativa"
    },
    {
      id: "f2-q1",
      faseId: "fase-2",
      enunciado: "A acessibilidade beneficia apenas pessoas com deficiência?",
      alternativas: [
        { id: "a", texto: "Sim, somente pessoas com deficiência visual.", correta: false },
        { id: "b", texto: "Sim, mas apenas em prédios públicos.", correta: false },
        { id: "c", texto: "Não. Ela beneficia todas as pessoas, incluindo idosos, gestantes, pessoas temporariamente lesionadas e quem enfrenta diferentes necessidades no dia a dia.", correta: true },
        { id: "d", texto: "Não, porque acessibilidade é apenas uma escolha estética.", correta: false }
      ],
      explicacao: "Acessibilidade beneficia todas as pessoas em diferentes situações de uso, não só quem tem deficiência.",
      dificuldade: "facil",
      ordemNaFase: 1,
      status: "ativa"
    },
    {
      id: "f2-q2",
      faseId: "fase-2",
      enunciado: "O que é uma barreira atitudinal?",
      alternativas: [
        { id: "a", texto: "Um degrau na entrada de um edifício.", correta: false },
        { id: "b", texto: "Uma falha temporária de conexão.", correta: false },
        { id: "c", texto: "Uma sinalização ausente.", correta: false },
        { id: "d", texto: "É uma atitude, comportamento ou preconceito que dificulta a participação e a autonomia de uma pessoa.", correta: true }
      ],
      explicacao: "Barreira atitudinal é preconceito ou comportamento que limita participação e autonomia.",
      dificuldade: "facil",
      ordemNaFase: 2,
      status: "ativa"
    },
    {
      id: "f2-q3",
      faseId: "fase-2",
      enunciado: "Qual cuidado é necessário ao descrever imagens em uma apresentação?",
      alternativas: [
        { id: "a", texto: "Dizer apenas “imagem ilustrativa”.", correta: false },
        { id: "b", texto: "Ler o nome do arquivo da imagem.", correta: false },
        { id: "c", texto: "Descrever as informações importantes da imagem de forma clara, objetiva e relacionada ao conteúdo apresentado.", correta: true },
        { id: "d", texto: "Omitir a descrição para não prolongar a apresentação.", correta: false }
      ],
      explicacao: "Descreva com clareza as informações relevantes da imagem ligadas ao conteúdo.",
      dificuldade: "intermediaria",
      ordemNaFase: 3,
      status: "ativa"
    },
    {
      id: "f2-q4",
      faseId: "fase-2",
      enunciado: "Como uma reunião online pode ser mais acessível a pessoas cegas?",
      alternativas: [
        { id: "a", texto: "Compartilhando slides sem leitura ou explicação.", correta: false },
        { id: "b", texto: "Usando gráficos sem qualquer descrição verbal.", correta: false },
        { id: "c", texto: "Pedindo que outra pessoa acompanhe a reunião no lugar dela.", correta: false },
        { id: "d", texto: "Verbalizando informações visuais importantes, descrevendo conteúdos exibidos e usando materiais digitais estruturados.", correta: true }
      ],
      explicacao: "Verbalize o que é visual, descreva conteúdos e compartilhe materiais estruturados.",
      dificuldade: "intermediaria",
      ordemNaFase: 4,
      status: "ativa"
    },
    {
      id: "f2-q5",
      faseId: "fase-2",
      enunciado: "Como o desenho universal reduz barreiras antes que adaptações individuais sejam necessárias?",
      alternativas: [
        { id: "a", texto: "Ao planejar espaços, serviços e produtos para serem usados pelo maior número possível de pessoas desde o início.", correta: true },
        { id: "b", texto: "Ao adaptar soluções somente depois que alguém reporta uma barreira.", correta: false },
        { id: "c", texto: "Ao criar produtos exclusivos para um único perfil de usuário.", correta: false },
        { id: "d", texto: "Ao padronizar o visual sem considerar formas de uso.", correta: false }
      ],
      explicacao: "Desenho universal planeja desde o início para o maior número possível de pessoas.",
      dificuldade: "dificil",
      ordemNaFase: 5,
      status: "ativa"
    },
    {
      id: "f3-q1",
      faseId: "fase-3",
      enunciado: "Por que perguntar como ajudar é melhor do que presumir a necessidade da pessoa?",
      alternativas: [
        { id: "a", texto: "Porque respeita a autonomia da pessoa e evita oferecer uma ajuda inadequada ou não desejada.", correta: true },
        { id: "b", texto: "Porque ajuda imediata sem perguntar demonstra mais solidariedade.", correta: false },
        { id: "c", texto: "Porque a pessoa sempre espera que alguém decida por ela.", correta: false },
        { id: "d", texto: "Porque perguntar é desnecessário quando a deficiência é visível.", correta: false }
      ],
      explicacao: "Perguntar respeita a autonomia e evita ajuda inadequada ou indesejada.",
      dificuldade: "facil",
      ordemNaFase: 1,
      status: "ativa"
    },
    {
      id: "f3-q2",
      faseId: "fase-3",
      enunciado: "Qual atitude demonstra respeito ao se comunicar com uma pessoa com deficiência?",
      alternativas: [
        { id: "a", texto: "Assumir o que a pessoa precisa com base na aparência.", correta: false },
        { id: "b", texto: "Perguntar de forma respeitosa como a pessoa prefere se comunicar e ouvir sua orientação.", correta: true },
        { id: "c", texto: "Usar tom infantilizado para transmitir carinho.", correta: false },
        { id: "d", texto: "Falar somente com acompanhantes ou intérpretes.", correta: false }
      ],
      explicacao: "Pergunte com respeito como a pessoa prefere se comunicar e siga a orientação dela.",
      dificuldade: "facil",
      ordemNaFase: 2,
      status: "ativa"
    },
    {
      id: "f3-q3",
      faseId: "fase-3",
      enunciado: "Por que documentos digitais devem ter títulos estruturados e texto alternativo?",
      alternativas: [
        { id: "a", texto: "Porque esses recursos facilitam a navegação e a compreensão do conteúdo por pessoas que utilizam leitores de tela.", correta: true },
        { id: "b", texto: "Porque tornam os arquivos maiores e mais coloridos.", correta: false },
        { id: "c", texto: "Porque substituem a necessidade de linguagem simples.", correta: false },
        { id: "d", texto: "Porque eliminam a necessidade de revisar o conteúdo.", correta: false }
      ],
      explicacao: "Títulos e texto alternativo ajudam quem usa leitores de tela a navegar e compreender o conteúdo.",
      dificuldade: "intermediaria",
      ordemNaFase: 3,
      status: "ativa"
    },
    {
      id: "f3-q4",
      faseId: "fase-3",
      enunciado: "Por que disponibilizar materiais em formatos acessíveis antes de um evento é importante?",
      alternativas: [
        { id: "a", texto: "Porque permite que as pessoas se preparem, acessem as informações com autonomia e solicitem apoio adequado quando necessário.", correta: true },
        { id: "b", texto: "Porque materiais antecipados substituem a acessibilidade no dia do evento.", correta: false },
        { id: "c", texto: "Porque apenas a equipe organizadora precisa dos materiais com antecedência.", correta: false },
        { id: "d", texto: "Porque formatos acessíveis servem somente para arquivos impressos.", correta: false }
      ],
      explicacao: "Materiais acessíveis com antecedência permitem preparação, autonomia e pedido de apoio adequado.",
      dificuldade: "intermediaria",
      ordemNaFase: 4,
      status: "ativa"
    },
    {
      id: "f3-q5",
      faseId: "fase-3",
      enunciado: "Por que o contraste de cores importa para pessoas com baixa visão?",
      alternativas: [
        { id: "a", texto: "Porque obriga todos os materiais a usar fundo escuro.", correta: false },
        { id: "b", texto: "Porque um contraste adequado facilita a leitura e a identificação de textos, botões e informações visuais.", correta: true },
        { id: "c", texto: "Porque elimina a necessidade de aumentar o tamanho do texto.", correta: false },
        { id: "d", texto: "Porque substitui o uso de títulos e descrições.", correta: false }
      ],
      explicacao: "Bom contraste facilita ler e identificar textos, botões e informações visuais.",
      dificuldade: "dificil",
      ordemNaFase: 5,
      status: "ativa"
    },
    {
      id: "res-1",
      faseId: null,
      enunciado: "Como incluir uma pessoa com deficiência no planejamento, e não apenas na execução, melhora a ação?",
      alternativas: [
        { id: "a", texto: "Porque incorpora experiências e necessidades desde o início, reduzindo barreiras e tornando as decisões mais adequadas.", correta: true },
        { id: "b", texto: "Porque a consulta só é necessária no lançamento final.", correta: false },
        { id: "c", texto: "Porque decisões podem ser tomadas apenas por especialistas sem vivência da deficiência.", correta: false },
        { id: "d", texto: "Porque o planejamento inclusivo atrasa o projeto sem benefícios práticos.", correta: false }
      ],
      explicacao: "Incluir no planejamento incorpora experiências reais desde o início e reduz barreiras.",
      dificuldade: "dificil",
      ordemNaFase: 0,
      status: "reserva"
    },
    {
      id: "res-2",
      faseId: null,
      enunciado: "Em uma campanha interna, como medir se a inclusão foi além da comunicação e gerou mudança prática?",
      alternativas: [
        { id: "a", texto: "Avaliando mudanças em comportamentos, processos, participação, acessibilidade e percepção das pessoas envolvidas.", correta: true },
        { id: "b", texto: "Medindo apenas o número de curtidas nas redes sociais.", correta: false },
        { id: "c", texto: "Considerando somente o orçamento investido na campanha.", correta: false },
        { id: "d", texto: "Avaliando só a beleza visual das peças publicitárias.", correta: false }
      ],
      explicacao: "Meça mudanças reais em comportamentos, processos, participação e acessibilidade.",
      dificuldade: "dificil",
      ordemNaFase: 0,
      status: "reserva"
    }
  ];

  var STORAGE_FASES = "quizEnableFasesConfig";
  var STORAGE_PERGUNTAS = "quizEnablePerguntasConfig";
  var STORAGE_EVENTO = "quizEnableDataEvento";

  function clonar(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function carregarFases() {
    try {
      var bruto = localStorage.getItem(STORAGE_FASES);
      if (bruto) {
        var dados = JSON.parse(bruto);
        if (Array.isArray(dados) && dados.length === 3) return dados;
      }
    } catch (e) { /* ignore */ }
    return clonar(FASES_PADRAO);
  }

  function salvarFases(lista) {
    localStorage.setItem(STORAGE_FASES, JSON.stringify(lista));
  }

  function carregarPerguntas() {
    try {
      var bruto = localStorage.getItem(STORAGE_PERGUNTAS);
      if (bruto) {
        var dados = JSON.parse(bruto);
        if (Array.isArray(dados) && dados.length) return dados;
      }
    } catch (e) { /* ignore */ }
    return clonar(PERGUNTAS_PADRAO);
  }

  function salvarPerguntas(lista) {
    localStorage.setItem(STORAGE_PERGUNTAS, JSON.stringify(lista));
  }

  function dataEvento() {
    try {
      var d = localStorage.getItem(STORAGE_EVENTO);
      if (d) return d;
    } catch (e) { /* ignore */ }
    return null;
  }

  function salvarDataEvento(isoDate) {
    localStorage.setItem(STORAGE_EVENTO, isoDate);
  }

  function pontosPorDificuldade(dif) {
    return PONTOS[dif] || 0;
  }

  function validarDistribuicaoFase(faseId, perguntas) {
    var ativas = (perguntas || carregarPerguntas()).filter(function (p) {
      return p.faseId === faseId && p.status === "ativa";
    });
    var faceis = ativas.filter(function (p) { return p.dificuldade === "facil"; }).length;
    var inter = ativas.filter(function (p) { return p.dificuldade === "intermediaria"; }).length;
    var difs = ativas.filter(function (p) { return p.dificuldade === "dificil"; }).length;
    var ok = ativas.length === 5 && faceis === 2 && inter === 2 && difs === 1;
    return {
      ok: ok,
      total: ativas.length,
      faceis: faceis,
      intermediarias: inter,
      dificeis: difs,
      mensagem: ok
        ? "Distribuição válida."
        : "A fase não pode ser liberada: são necessárias exatamente 2 perguntas fáceis, 2 intermediárias e 1 difícil."
    };
  }

  function perguntasDaFase(faseId, embaralhar) {
    var lista = carregarPerguntas().filter(function (p) {
      return p.faseId === faseId && p.status === "ativa";
    });
    lista.sort(function (a, b) { return (a.ordemNaFase || 0) - (b.ordemNaFase || 0); });
    if (embaralhar) {
      for (var i = lista.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var t = lista[i];
        lista[i] = lista[j];
        lista[j] = t;
      }
    }
    return lista.map(function (p) {
      var alts = p.alternativas.slice();
      for (var i = alts.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var tmp = alts[i];
        alts[i] = alts[j];
        alts[j] = tmp;
      }
      return {
        id: p.id,
        faseId: p.faseId,
        enunciado: p.enunciado,
        alternativas: alts,
        explicacao: p.explicacao,
        dificuldade: p.dificuldade,
        pontos: pontosPorDificuldade(p.dificuldade)
      };
    });
  }

  function rotuloDificuldade(dif) {
    if (dif === "facil") return "Fácil";
    if (dif === "intermediaria") return "Intermediária";
    if (dif === "dificil") return "Difícil";
    return dif || "";
  }

  global.QuizData = {
    PONTOS: PONTOS,
    MAX_POR_FASE: MAX_POR_FASE,
    PERGUNTAS_POR_FASE: PERGUNTAS_POR_FASE,
    FASES_PADRAO: FASES_PADRAO,
    PERGUNTAS_PADRAO: PERGUNTAS_PADRAO,
    carregarFases: carregarFases,
    salvarFases: salvarFases,
    carregarPerguntas: carregarPerguntas,
    salvarPerguntas: salvarPerguntas,
    dataEvento: dataEvento,
    salvarDataEvento: salvarDataEvento,
    pontosPorDificuldade: pontosPorDificuldade,
    validarDistribuicaoFase: validarDistribuicaoFase,
    perguntasDaFase: perguntasDaFase,
    rotuloDificuldade: rotuloDificuldade,
    STORAGE_FASES: STORAGE_FASES,
    STORAGE_PERGUNTAS: STORAGE_PERGUNTAS,
    STORAGE_EVENTO: STORAGE_EVENTO
  };
})(window);
