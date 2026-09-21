/* =========================================================================
   SITE LOADER — LP genérica orientada por configuração
   Uma única LP (mesmo HTML/CSS) serve qualquer polo. Tudo que muda de polo
   pra polo (nome, WhatsApp, endereço, textos, estatísticas, fotos da
   galeria e a lista de cursos) vem de um arquivo de configuração JSON.

   Como usar:
   1) Copie polos/exemplo.json, preencha os dados do novo polo e suba no
      mesmo repositório (ex: polos/caracol.json, polos/vitoria.json).
   2) Na LP, aponte a tag <script> pro JSON desse polo:

      <script src="site-loader.js"
              data-config="https://cdn.jsdelivr.net/gh/USUARIO/REPO@main/polos/caracol.json"></script>

   3) Pronto — o HTML da LP não precisa de nenhuma outra edição.

   EXCLUIR CURSOS SÓ NESSE POLO (ex: licenciaturas):
   No JSON do polo, adicione o campo "excluirCursosContendo" com uma lista
   de termos. Qualquer curso cujo nome contenha um desses termos (sem
   diferenciar maiúsculas/acentos) é removido SÓ na montagem dessa LP — o
   cursos.json compartilhado e as outras LPs continuam intactos.

      "excluirCursosContendo": ["licenciatura"]

   EXCLUIR UM GRUPO INTEIRO SÓ NESSE POLO (ex: toda a coluna "Semipresencial"):
   No JSON do polo, adicione o campo "excluirGrupos", indicando a chave da
   modalidade e, dentro dela, a lista de chaves de grupo a remover:

      "excluirGrupos": {
        "graduacao": ["semipresencial"]
      }

   As chaves de modalidade são: graduacao, pos, aperfeicoamento,
   profissionalizantes. A chave de cada grupo é a mesma usada nos filtros
   do cursos.json (ex: "semipresencial", "bacharelado", "tecnologo").

   Se nenhum dos dois campos existir no JSON do polo, nada é filtrado
   (comportamento padrão, igual ao de hoje).
   ========================================================================= */
(function(){
  var CURSOS_JSON_URL = 'https://cdn.jsdelivr.net/gh/GabrielBitten/Script-Catalogo-LP@main/cursos.json';

  var scriptAtual = document.currentScript;
  var CONFIG_URL = scriptAtual && scriptAtual.getAttribute('data-config');

  if(!CONFIG_URL){
    console.error('site-loader.js: faltou o atributo data-config na tag <script>.');
    return;
  }

  function normalizar(txt){
    return (txt || '')
      .toString()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  function linkWhatsapp(numero, texto){
    return 'https://wa.me/' + numero + '?text=' + encodeURIComponent(texto);
  }

  function set(id, fn){
    var el = document.getElementById(id);
    if(el) fn(el);
  }

  /* ---------- Filtra cursos indesejados (por polo, via config) ---------- */
  function aplicarExclusoes(dadosCursos, termosExcluir, gruposExcluir){
    var temTermos = termosExcluir && termosExcluir.length;
    var temGrupos = gruposExcluir && Object.keys(gruposExcluir).length;
    if(!temTermos && !temGrupos) return dadosCursos;

    var termosNormalizados = temTermos ? termosExcluir.map(normalizar) : [];

    function nomeContemTermoExcluido(nomeCurso){
      var nomeNormalizado = normalizar(nomeCurso);
      return termosNormalizados.some(function(termo){
        return termo && nomeNormalizado.indexOf(termo) !== -1;
      });
    }

    var resultado = {};
    Object.keys(dadosCursos).forEach(function(chaveModalidade){
      var modalidade = dadosCursos[chaveModalidade];
      var chavesGrupoExcluidas = (gruposExcluir && gruposExcluir[chaveModalidade]) || [];

      var gruposFiltrados = modalidade.grupos
        .filter(function(grupo){
          return chavesGrupoExcluidas.indexOf(grupo.chave) === -1;
        })
        .map(function(grupo){
          var cursosFiltrados = grupo.cursos.filter(function(curso){
            return !nomeContemTermoExcluido(curso.nome);
          });
          return {
            chave: grupo.chave,
            label: grupo.label,
            cursos: cursosFiltrados
          };
        })
        .filter(function(grupo){ return grupo.cursos.length > 0; });

      var chavesRestantes = gruposFiltrados.map(function(g){ return g.chave; });
      var filtrosFiltrados = (modalidade.filtros || []).filter(function(f){
        return chavesRestantes.indexOf(f.chave) !== -1;
      });

      resultado[chaveModalidade] = {
        singular: modalidade.singular,
        plural: modalidade.plural,
        filtros: filtrosFiltrados,
        grupos: gruposFiltrados
      };
    });

    return resultado;
  }

  /* ---------- Preenche todo o conteúdo do site a partir do config ---------- */
  function montarSite(config){
    var whatsapp = config.contato.whatsapp;
    var poloNome = config.polo.nome; // ex: "Polo Caracol/MS"

    if(config.titulo) document.title = config.titulo;

    var textoSaudacao = 'Olá! Vim pela página do ' + poloNome + ' e quero falar com um consultor.';
    var linkSaudacao = linkWhatsapp(whatsapp, textoSaudacao);

    set('ctaHeaderWhatsapp', function(el){ el.href = linkSaudacao; });
    set('ctaMobileWhatsapp', function(el){ el.href = linkSaudacao; });
    set('ctaHeroWhatsapp',   function(el){ el.href = linkSaudacao; });

    set('heroEyebrow',    function(el){ el.textContent = config.hero.eyebrow; });
    set('heroTitulo',     function(el){ el.innerHTML = config.hero.titulo; });
    set('heroParagrafo',  function(el){ el.textContent = config.hero.paragrafo; });

    set('linkEmecStrip',       function(el){ el.href = config.emec.link; });
    set('enderecoResumoStrip', function(el){ el.textContent = config.endereco.resumo; });

    set('sobreTitulo', function(el){ el.textContent = config.sobre.titulo; });
    set('sobreTexto', function(el){
      el.innerHTML = '';
      config.sobre.paragrafos.forEach(function(paragrafo, indice){
        var p = document.createElement('p');
        p.textContent = paragrafo;
        if(indice === config.sobre.paragrafos.length - 1 && config.sobre.paragrafoDestaque !== false){
          p.className = 'ucv-strong';
        }
        el.appendChild(p);
      });
    });

    set('statPoloTitulo', function(el){ el.textContent = config.polo.statTitulo || poloNome; });
    set('statPoloSub',    function(el){ el.textContent = config.polo.statSub || config.endereco.resumo; });

    set('localizacaoTitulo',    function(el){ el.textContent = config.localizacao.titulo; });
    set('localizacaoParagrafo', function(el){ el.textContent = config.localizacao.paragrafo; });

    set('mapaIframe', function(el){
      el.src = 'https://www.google.com/maps?q=' + encodeURIComponent(config.endereco.mapsQuery) + '&output=embed';
      el.title = 'Mapa do ' + poloNome;
    });
    set('mapaEnderecoNome',  function(el){ el.textContent = config.localizacao.enderecoNome; });
    set('mapaEnderecoTexto', function(el){ el.textContent = config.endereco.resumo; });
    set('linkComoChegar', function(el){
      el.href = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(config.endereco.mapsQuery);
    });

    set('footerDescricao', function(el){ el.textContent = config.footer.descricao; });
    set('footerEndereco', function(el){
      el.innerHTML = config.endereco.linhas.map(function(linha){
        return linha;
      }).join('<br>');
    });
    set('footerLinkMapa', function(el){
      el.href = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(config.endereco.mapsQuery);
    });
    set('footerWhatsapp', function(el){
      el.href = 'https://wa.me/' + whatsapp;
      el.textContent = 'WhatsApp ' + (config.contato.whatsappExibicao || whatsapp);
    });
    set('footerEmail', function(el){
      el.href = 'mailto:' + config.contato.email;
      el.textContent = config.contato.email;
    });
    set('footerLinkEmec', function(el){ el.href = config.emec.link; });
    set('footerBottom', function(el){ el.textContent = config.footer.bottomText || poloNome; });

    /* Textos do rodapé de cada modal ("Não encontrou o que procura?...") */
    var frasesRodape = {
      footTextoGrad:  'Não encontrou o que procura? Fale com um consultor do ' + poloNome + '.',
      footTextoPos:   'Não encontrou o que procura? Fale com um consultor do ' + poloNome + '.',
      footTextoAperf: 'Não encontrou o que procura? Fale com um consultor do ' + poloNome + '.',
      footTextoProf:  'Não encontrou o que procura? Fale com um consultor do ' + poloNome + '.'
    };
    Object.keys(frasesRodape).forEach(function(id){
      set(id, function(el){ el.textContent = frasesRodape[id]; });
    });

    montarGaleria(config.galeria || []);
    montarBotoesModal(config, whatsapp, poloNome);
  }

  /* ---------- Galeria de fotos (monta o DOM e liga prev/next/dots) ---------- */
  function montarGaleria(fotos){
    var track = document.getElementById('ucvGalleryTrack');
    var captionEl = document.getElementById('ucvGalleryCaption');
    var counterEl = document.getElementById('ucvGalleryCounter');
    var dotsEl = document.getElementById('ucvGalleryDots');
    if(!track || !fotos.length) return;

    track.innerHTML = '';
    fotos.forEach(function(foto){
      var slide = document.createElement('div');
      slide.className = 'ucv-gallery-slide';
      var img = document.createElement('img');
      img.src = foto.src;
      img.alt = foto.alt || '';
      img.loading = 'lazy';
      slide.appendChild(img);
      track.appendChild(slide);
    });

    var index = 0;

    function render(){
      track.style.transform = 'translateX(-' + (index * 100) + '%)';
      if(captionEl) captionEl.textContent = fotos[index].caption || '';
      if(counterEl) counterEl.textContent = (index + 1) + '/' + fotos.length;
      if(dotsEl){
        var buttons = dotsEl.querySelectorAll('button');
        for(var i = 0; i < buttons.length; i++){
          buttons[i].classList.toggle('active', i === index);
          buttons[i].setAttribute('aria-current', i === index ? 'true' : 'false');
        }
      }
    }

    if(dotsEl){
      dotsEl.innerHTML = '';
      fotos.forEach(function(foto, i){
        var button = document.createElement('button');
        button.type = 'button';
        button.className = 'ucv-gallery-dot' + (i === 0 ? ' active' : '');
        button.setAttribute('aria-label', 'Ir para a foto ' + (i + 1));
        button.addEventListener('click', function(){
          index = i;
          render();
        });
        dotsEl.appendChild(button);
      });
    }

    var prev = document.getElementById('ucvGalleryPrev');
    var next = document.getElementById('ucvGalleryNext');
    if(prev){
      prev.addEventListener('click', function(){
        index = (index - 1 + fotos.length) % fotos.length;
        render();
      });
    }
    if(next){
      next.addEventListener('click', function(){
        index = (index + 1) % fotos.length;
        render();
      });
    }

    render();
  }

  /* ---------- Botão "Falar no WhatsApp" do rodapé de cada modal ---------- */
  function montarBotoesModal(config, whatsapp, poloNome){
    var areas = {
      ucvModalGraduacao: 'Graduação',
      ucvModalPos: 'Pós-graduação',
      ucvModalAperfeicoamento: 'Aperfeiçoamento',
      ucvModalProfissionalizantes: 'cursos Profissionalizantes'
    };
    Object.keys(areas).forEach(function(modalId){
      var modal = document.getElementById(modalId);
      if(!modal) return;
      var botao = modal.querySelector('.ucv-modal-foot a.ucv-btn');
      if(!botao) return;
      var texto = 'Olá! Quero falar sobre ' + areas[modalId] + ' no ' + poloNome + '.';
      botao.href = linkWhatsapp(whatsapp, texto);
    });
  }

  /* ---------- Catálogo de cursos (grupos, filtros, busca, "Tenho interesse") ---------- */
  var MODALS = [
    { modalId: 'ucvModalGraduacao',         prefixo: 'grad',  chave: 'graduacao',          interesse: 'curso de graduação' },
    { modalId: 'ucvModalPos',                prefixo: 'pos',   chave: 'pos',                 interesse: 'curso de pós-graduação' },
    { modalId: 'ucvModalAperfeicoamento',    prefixo: 'aperf', chave: 'aperfeicoamento',     interesse: 'curso de aperfeiçoamento' },
    { modalId: 'ucvModalProfissionalizantes',prefixo: 'prof',  chave: 'profissionalizantes', interesse: 'curso profissionalizante' }
  ];

  function montarModalCursos(cfg, dadosModalidade, whatsapp, poloNome){
    var modal = document.getElementById(cfg.modalId);
    if(!modal) return null;

    var filtersContainer = modal.querySelector('.ucv-filters');
    var groupsContainer = document.getElementById(cfg.prefixo + '-grupos');
    var metaEl = document.getElementById(cfg.prefixo + '-meta');
    if(!groupsContainer) return null;

    var totalCursos = 0;
    dadosModalidade.grupos.forEach(function(g){ totalCursos += g.cursos.length; });

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

        var texto = 'Olá! Tenho interesse no ' + cfg.interesse + ' ' + curso.nome + ' no ' + poloNome + '.';
        var link = document.createElement('a');
        link.className = 'ucv-course-interest';
        link.textContent = 'Tenho interesse →';
        link.href = linkWhatsapp(whatsapp, texto);
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

    var botaoCard = document.querySelector('[data-modal-target="' + cfg.modalId + '"]');
    if(botaoCard){
      var card = botaoCard.closest('.ucv-card');
      var countEl = card ? card.querySelector('.ucv-card-count') : null;
      if(countEl) countEl.textContent = totalCursos + ' cursos';
    }

    return {
      total: totalCursos,
      singular: dadosModalidade.singular,
      plural: dadosModalidade.plural,
      metaPadrao: metaPadrao
    };
  }

  function iniciarBuscaEFiltro(config){
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
        var combinaFiltro = !filtroAtivo || grupo.getAttribute('data-modalidade') === filtroAtivo;
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
          meta.textContent = total + ' ' + (total === 1 ? config.singular : config.plural) + ' encontrado' + (total === 1 ? '' : 's') + '.';
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

  function montarCursos(config, dadosCursos){
    var whatsapp = config.contato.whatsapp;
    var poloNome = config.polo.nome;
    var totalGeral = 0;

    MODALS.forEach(function(cfg){
      var dadosModalidade = dadosCursos[cfg.chave];
      if(!dadosModalidade) return;
      var resultado = montarModalCursos(cfg, dadosModalidade, whatsapp, poloNome);
      if(resultado){
        totalGeral += resultado.total;
        iniciarBuscaEFiltro({
          prefixo: cfg.prefixo,
          singular: resultado.singular,
          plural: resultado.plural,
          metaPadrao: resultado.metaPadrao
        });
      }
    });

    set('statCursosTitulo', function(el){ el.textContent = totalGeral + ' cursos'; });
    set('statCursosSub',    function(el){ el.textContent = 'entre graduação, pós e formação livre'; });

    iniciarModais();
  }

  /* ---------- Ponto de entrada: busca a config do polo e o catálogo ---------- */
  fetch(CONFIG_URL)
    .then(function(res){
      if(!res.ok) throw new Error('Falha ao carregar a configuração do polo (' + res.status + ')');
      return res.json();
    })
    .then(function(config){
      montarSite(config);
      return fetch(CURSOS_JSON_URL)
        .then(function(res){
          if(!res.ok) throw new Error('Falha ao carregar cursos.json (' + res.status + ')');
          return res.json();
        })
        .then(function(dadosCursos){
          var dadosFiltrados = aplicarExclusoes(dadosCursos, config.excluirCursosContendo, config.excluirGrupos);
          montarCursos(config, dadosFiltrados);
        });
    })
    .catch(function(erro){
      console.error('site-loader.js:', erro);
    });
})();
