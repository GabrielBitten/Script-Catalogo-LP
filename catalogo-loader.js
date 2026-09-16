/* =========================================================================
   CATÁLOGO DE CURSOS — CARREGADOR DINÂMICO
   Busca os cursos em um único JSON externo (cursos.json) e monta os grupos,
   filtros e links de "Tenho interesse" de cada modal (Graduação, Pós,
   Aperfeiçoamento, Profissionalizantes). Para atualizar os cursos em TODAS
   as LPs, edite só o cursos.json — este script não precisa mudar.

   Como usar:
   1) Suba o cursos.json (gerado a partir da LP atual) em um repositório
      GitHub e sirva pelo jsDelivr, ou em qualquer CDN/host que você controle.
   2) Ajuste CURSOS_JSON_URL abaixo para a URL desse arquivo.
   3) Na LP, inclua este arquivo no lugar do antigo bloco <script>
      "CATÁLOGO DE CURSOS", informando o WhatsApp e o nome do polo
      daquela LP específica via atributos data-* na própria tag <script>,
      já que este arquivo é compartilhado por várias LPs com números e
      polos diferentes:

      <script src="catalogo-loader.js"
              data-whatsapp="5567996185246"
              data-polo="Polo Caracol/MS"></script>

      Se algum desses atributos não for informado, o script cai nos
      valores padrão definidos abaixo (WHATSAPP_PADRAO / POLO_PADRAO).
   ========================================================================= */
(function(){
  var CURSOS_JSON_URL = 'https://cdn.jsdelivr.net/gh/GabrielBitten/Script-Catalogo-LP@main/cursos.json';
  var WHATSAPP_PADRAO = '5567996185246';
  var POLO_PADRAO = 'Polo Caracol/MS';

  /* Lê os atributos data-whatsapp e data-polo da própria tag <script> que
     carregou este arquivo, para que cada LP use seu número e seu polo sem
     precisar editar este script compartilhado. */
  var scriptAtual = document.currentScript;
  var WHATSAPP = (scriptAtual && scriptAtual.getAttribute('data-whatsapp')) || WHATSAPP_PADRAO;
  var POLO = (scriptAtual && scriptAtual.getAttribute('data-polo')) || POLO_PADRAO;

  var MODALS = [
    { modalId: 'ucvModalGraduacao',         prefixo: 'grad',  chave: 'graduacao',          interesse: 'curso de graduação',      area: 'Graduação' },
    { modalId: 'ucvModalPos',                prefixo: 'pos',   chave: 'pos',                 interesse: 'curso de pós-graduação',  area: 'Pós-graduação' },
    { modalId: 'ucvModalAperfeicoamento',    prefixo: 'aperf', chave: 'aperfeicoamento',     interesse: 'curso de aperfeiçoamento', area: 'Aperfeiçoamento' },
    { modalId: 'ucvModalProfissionalizantes',prefixo: 'prof',  chave: 'profissionalizantes', interesse: 'curso profissionalizante', area: 'cursos Profissionalizantes' }
  ];


  function normalizar(txt){
    return (txt || '')
      .toString()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  function linkInteresse(nome, modalidade){
    var texto = 'Olá! Tenho interesse no ' + modalidade + ' ' + nome + ' no ' + POLO + '.';
    return 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(texto);
  }

  /* ---------- Monta o DOM de filtros + grupos a partir do JSON ---------- */
  function montarModal(cfg, dadosModalidade){
    var modal = document.getElementById(cfg.modalId);
    if(!modal) return null;

    var filtersContainer = modal.querySelector('.ucv-filters');
    var groupsContainer = document.getElementById(cfg.prefixo + '-grupos');
    var metaEl = document.getElementById(cfg.prefixo + '-meta');
    if(!groupsContainer) return null;

    var totalCursos = 0;
    dadosModalidade.grupos.forEach(function(g){ totalCursos += g.cursos.length; });

    /* Filtros */
    if(filtersContainer){
      filtersContainer.innerHTML = '';
      dadosModalidade.filtros.forEach(function(f){
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'ucv-filter-btn';
        btn.setAttribute('data-filtro', f.chave);
        btn.setAttribute('aria-pressed', 'false');
        btn.textContent = f.label;
        filtersContainer.appendChild(btn);
      });
    }

    /* Grupos + cursos */
    groupsContainer.innerHTML = '';
    dadosModalidade.grupos.forEach(function(grupo, indice){
      var details = document.createElement('details');
      details.className = 'ucv-group';
      details.setAttribute('data-modalidade', grupo.chave);
      if(indice === 0) details.open = true;

      var summary = document.createElement('summary');
      var head = document.createElement('span');
      head.className = 'ucv-group-head';
      head.appendChild(document.createTextNode(grupo.label + ' '));
      var count = document.createElement('span');
      count.className = 'ucv-group-count';
      count.textContent = grupo.cursos.length;
      head.appendChild(count);
      summary.appendChild(head);

      var chevron = document.createElementNS('http://www.w3.org/2000/svg','svg');
      chevron.setAttribute('class','ucv-group-chevron');
      chevron.setAttribute('viewBox','0 0 24 24');
      chevron.setAttribute('fill','none');
      chevron.setAttribute('stroke','currentColor');
      chevron.setAttribute('stroke-width','2');
      chevron.setAttribute('aria-hidden','true');
      var path = document.createElementNS('http://www.w3.org/2000/svg','path');
      path.setAttribute('d','M6 9l6 6 6-6');
      chevron.appendChild(path);
      summary.appendChild(chevron);

      details.appendChild(summary);

      var wrap = document.createElement('div');
      wrap.className = 'ucv-group-wrap';
      var ul = document.createElement('ul');
      ul.className = 'ucv-course-list';

      grupo.cursos.forEach(function(curso){
        var li = document.createElement('li');
        li.className = 'ucv-course';
        li.setAttribute('data-nome', normalizar(curso.nome));
        li.appendChild(document.createTextNode(curso.nome + ' '));

        if(curso.duracao){
          var dur = document.createElement('span');
          dur.className = 'ucv-course-dur';
          dur.textContent = curso.duracao;
          li.appendChild(dur);
        }

        var link = document.createElement('a');
        link.className = 'ucv-course-interest';
        link.textContent = 'Tenho interesse →';
        link.href = linkInteresse(curso.nome, cfg.interesse);
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        li.appendChild(link);

        ul.appendChild(li);
      });

      wrap.appendChild(ul);
      details.appendChild(wrap);
      groupsContainer.appendChild(details);
    });

    var metaPadrao = totalCursos + ' ' + (totalCursos === 1 ? dadosModalidade.singular : dadosModalidade.plural) + '.';
    if(metaEl) metaEl.textContent = metaPadrao;

    /* Atualiza o contador no card da seção "áreas" (ex: "116 cursos") */
    var botaoCard = document.querySelector('[data-modal-target="' + cfg.modalId + '"]');
    if(botaoCard){
      var card = botaoCard.closest('.ucv-card');
      var countEl = card ? card.querySelector('.ucv-card-count') : null;
      if(countEl) countEl.textContent = totalCursos + ' cursos';
    }

    return {
      singular: dadosModalidade.singular,
      plural: dadosModalidade.plural,
      metaPadrao: metaPadrao
    };
  }

  /* ---------- Botão "Falar no WhatsApp" do rodapé do modal ----------
     Esse botão (o de "Não encontrou o que procura?") vinha com o link
     fixo no HTML. Aqui ele passa a usar o mesmo WHATSAPP/POLO configurados
     na tag <script>, igual aos links "Tenho interesse →". */
  function ajustarBotaoRodape(cfg){
    var modal = document.getElementById(cfg.modalId);
    if(!modal) return;
    var botao = modal.querySelector('.ucv-modal-foot a.ucv-btn');
    if(!botao) return;
    var texto = 'Olá! Quero falar sobre ' + cfg.area + ' no ' + POLO + '.';
    botao.href = 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(texto);
  }

  /* ---------- Busca + filtro (mesma lógica de antes, roda após montar o DOM) ---------- */
  function iniciarCatalogo(config){
    var input = document.getElementById(config.prefixo + '-busca');
    var limpar = document.getElementById(config.prefixo + '-limpar');
    var meta = document.getElementById(config.prefixo + '-meta');
    var vazio = document.getElementById(config.prefixo + '-vazio');
    var container = document.getElementById(config.prefixo + '-grupos');
    if(!input || !container) return;

    var grupos = Array.prototype.slice.call(container.querySelectorAll('.ucv-group'));
    var botoes = Array.prototype.slice.call(
      container.closest('.ucv-modal').querySelectorAll('.ucv-filter-btn')
    );
    if(!grupos.length) return;

    var filtroAtivo = null;
    var abertosAntesDaBusca = null;

    function aplicar(){
      var termo = normalizar(input.value);
      var temBusca = termo.length > 0;
      if(limpar) limpar.classList.toggle('ucv-show', temBusca);

      if(temBusca && abertosAntesDaBusca === null){
        abertosAntesDaBusca = grupos.filter(function(g){ return g.open; });
      }

      var total = 0;
      var algumVisivel = false;

      grupos.forEach(function(grupo){
        var combinaFiltro = !filtroAtivo ||
          grupo.getAttribute('data-modalidade') === filtroAtivo;
        var visiveis = 0;

        grupo.querySelectorAll('.ucv-course').forEach(function(item){
          var nome = item.getAttribute('data-nome') || item.textContent;
          var combinaBusca = !temBusca || normalizar(nome).indexOf(termo) !== -1;
          var mostrar = combinaFiltro && combinaBusca;
          item.hidden = !mostrar;
          if(mostrar) visiveis++;
        });

        var mostrarGrupo = combinaFiltro && visiveis > 0;
        grupo.hidden = !mostrarGrupo;

        if(mostrarGrupo){
          algumVisivel = true;
          total += visiveis;
          if(temBusca) grupo.open = true;
        }
      });

      if(!temBusca && abertosAntesDaBusca !== null){
        grupos.forEach(function(g){ g.open = abertosAntesDaBusca.indexOf(g) !== -1; });
        abertosAntesDaBusca = null;
      }

      if(vazio) vazio.classList.toggle('ucv-show', !algumVisivel);

      if(meta){
        if(temBusca || filtroAtivo){
          meta.textContent = total + ' ' +
            (total === 1 ? config.singular : config.plural) +
            ' encontrado' + (total === 1 ? '' : 's') + '.';
        } else {
          meta.textContent = config.metaPadrao;
        }
      }
    }

    input.addEventListener('input', aplicar);

    if(limpar){
      limpar.addEventListener('click', function(){
        input.value = '';
        input.focus();
        aplicar();
      });
    }

    botoes.forEach(function(btn){
      btn.addEventListener('click', function(){
        var novo = btn.getAttribute('data-filtro');
        if(filtroAtivo === novo){
          filtroAtivo = null;
          btn.setAttribute('aria-pressed', 'false');
        } else {
          filtroAtivo = novo;
          botoes.forEach(function(b){
            b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
          });
        }
        aplicar();
      });
    });
  }

  /* ---------- Abertura/fechamento dos modais (igual ao script original) ---------- */
  function iniciarModais(){
    var ultimoAcionador = null;

    function abrir(modal, acionador){
      if(!modal) return;
      ultimoAcionador = acionador || null;
      modal.hidden = false;
      document.body.classList.add('ucv-modal-open');
      window.requestAnimationFrame(function(){
        modal.classList.add('ucv-modal-visible');
        var fechar = modal.querySelector('.ucv-modal-close');
        if(fechar) fechar.focus();
      });
    }

    function fechar(modal){
      if(!modal || modal.hidden) return;
      modal.classList.remove('ucv-modal-visible');
      document.body.classList.remove('ucv-modal-open');
      window.setTimeout(function(){ modal.hidden = true; }, 230);
      if(ultimoAcionador) ultimoAcionador.focus();
    }

    document.querySelectorAll('[data-modal-target]').forEach(function(botao){
      botao.addEventListener('click', function(){
        abrir(document.getElementById(botao.getAttribute('data-modal-target')), botao);
      });
    });

    document.querySelectorAll('.ucv-modal').forEach(function(modal){
      modal.addEventListener('click', function(evento){
        if(evento.target.closest('[data-modal-close]')) fechar(modal);
      });
    });

    document.addEventListener('keydown', function(evento){
      if(evento.key !== 'Escape') return;
      var aberto = document.querySelector('.ucv-modal:not([hidden])');
      if(aberto) fechar(aberto);
    });
  }

  /* ---------- Carrega o JSON e monta tudo ---------- */
  fetch(CURSOS_JSON_URL)
    .then(function(res){
      if(!res.ok) throw new Error('Falha ao carregar cursos.json (' + res.status + ')');
      return res.json();
    })
    .then(function(dados){
      MODALS.forEach(function(cfg){
        var dadosModalidade = dados[cfg.chave];
        if(!dadosModalidade) return;
        var config = montarModal(cfg, dadosModalidade);
        ajustarBotaoRodape(cfg);
        if(config){
          iniciarCatalogo({
            prefixo: cfg.prefixo,
            singular: config.singular,
            plural: config.plural,
            metaPadrao: config.metaPadrao
          });
        }
      });
      iniciarModais();
    })
    .catch(function(erro){
      console.error('Não foi possível carregar o catálogo de cursos:', erro);
    });
})();
