/* ═══════════════════════════════════════════════════════════
   PROTÓTIPO · Transform — troca de tipo de documento
   Orquestra mudança em hero, identif, retenções, PDF, sidebar
   ═══════════════════════════════════════════════════════════ */

(function() {
  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  let currentType = 'NFS-e';

  /* ─── 1. Marcar campos de retenção existentes com data-retencao ─── */
  function tagExistingRetencoes() {
    const map = {
      'input-iss':    'iss',
      'input-irrf':   'irrf',
      'input-inss':   'inss',
      'input-pis':    'pis',
      'input-cofins': 'cofins',
      'input-csll':   'csll'
    };
    Object.entries(map).forEach(([id, key]) => {
      const inp = $('#' + id);
      if (inp) {
        const wrap = inp.closest('.input');
        if (wrap) wrap.dataset.retencao = key;
        const field = inp.closest('.field');
        if (field) field.dataset.retencao = key;
      }
    });

    // Tag composition rows that aren't already tagged
    const rowMap = { 'field-iss': 'iss', 'input-irrf': 'irrf', 'input-inss': 'inss', 'input-pis': 'pis', 'input-cofins': 'cofins', 'input-csll': 'csll' };
    $$('#composition .row.tax').forEach(row => {
      const a = row.dataset.anchor;
      if (rowMap[a]) row.dataset.retencao = rowMap[a];
    });
  }

  /* ─── 2. Recompute dinâmico — lê tudo da DOM ─── */
  function dynamicRecompute(pulseField) {
    const bruto = parseFloat(($('#input-bruto')?.value || '0').replace(/[^\d,-]/g, '').replace(',', '.')) || 0;

    let ret = 0;
    const retValues = {};
    $$('.input[data-retencao]').forEach(wrap => {
      const inp = wrap.querySelector('input');
      if (!inp) return;
      const id = wrap.dataset.retencao;
      const v = parseFloat((inp.value || '0').replace(/[^\d,-]/g, '').replace(',', '.')) || 0;
      retValues[id] = v;
      ret += v;
    });
    const liq = bruto - ret;

    // Composition rows
    $$('#composition .row[data-retencao]').forEach(row => {
      const id = row.dataset.retencao;
      if (retValues[id] !== undefined) {
        row.querySelector('.v').textContent = '- ' + fmtBR(retValues[id]);
      }
    });

    const brutoEl = $('#composition .row.bruto .v');
    if (brutoEl) brutoEl.textContent = fmtBR(bruto);

    const pillBruto = $('#pill-bruto .val');
    const pillRet   = $('#pill-ret .val');
    const totRet    = $('#total-retencoes');
    if (pillBruto) pillBruto.textContent = fmtShort(bruto);
    if (pillRet)   pillRet.textContent   = fmtShort(ret);
    if (totRet)    totRet.textContent    = fmt(ret);

    animateNum($('#net-num'),          window.__lastLiq || liq, liq, 220, fmtShort);
    animateNum($('#sidebar-net'),      window.__lastLiq || liq, liq, 280, fmtBR);
    animateNum($('#titulo-principal'), window.__lastLiq || liq, liq, 280, fmtBR);
    window.__lastLiq = liq;

    const pillNet = $('#pill-net');
    if (pillNet) {
      pillNet.classList.remove('pulse');
      void pillNet.offsetWidth;
      pillNet.classList.add('pulse');
    }
    if (pulseField) {
      pulseField.classList.remove('flash');
      void pulseField.offsetWidth;
      pulseField.classList.add('flash');
    }
  }

  // Helpers (mirror app.js)
  const fmt      = n => n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtBR    = n => 'R$ ' + fmt(n);
  const fmtShort = n => 'R$ ' + Math.round(n).toLocaleString('pt-BR');

  function animateNum(el, from, to, duration, formatter) {
    if (!el) return;
    const start = performance.now();
    function step(t) {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 4);
      const val = from + (to - from) * eased;
      el.textContent = formatter(val);
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  /* ─── 3. Build tipo cards in modal ─── */
  function buildTipoCards() {
    const grid = $('#tipo-grid');
    if (!grid) return;
    grid.innerHTML = '';
    Object.entries(DOC_TYPES).forEach(([key, t]) => {
      const card = document.createElement('button');
      card.className = 'tipo-card' + (key === currentType ? ' selected' : '');
      card.dataset.tipo = key;
      card.dataset.color = t.color;
      const fiscalPill = t.fiscal === true ? '<span class="fiscal-pill">Fiscal</span>'
        : t.fiscal === 'partial' ? '<span class="fiscal-pill partial">Parcial</span>'
        : '<span class="fiscal-pill none">Não-fiscal</span>';
      card.innerHTML = `
        <div class="glyph">${t.glyph}</div>
        <div class="info">
          <div class="nm">${t.label} ${fiscalPill}</div>
          <div class="sub">${t.sub}</div>
          <div class="desc">${t.desc}</div>
        </div>`;
      card.addEventListener('click', () => {
        $$('.tipo-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        setTimeout(() => {
          setDocType(key);
          closeModal($('#modal-tipo'));
        }, 180);
      });
      grid.appendChild(card);
    });
  }

  function closeModal(m) {
    if (!m) return;
    m.classList.remove('open');
    document.body.style.overflow = '';
  }
  function openModal(id) {
    const m = $('#' + id);
    if (!m) return;
    m.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function updateTipoSelection(key) {
    $$('#modal-tipo .tipo-card').forEach(card => {
      card.classList.toggle('selected', card.dataset.tipo === key);
    });
  }

  function updateFormaSelection(forma) {
    $$('#modal-forma .forma-card').forEach(card => {
      card.classList.toggle('selected', card.dataset.forma === forma);
    });
  }

  /* ─── 4. setDocType — orquestração geral ─── */
  function setDocType(key) {
    const t = DOC_TYPES[key];
    if (!t) return;
    currentType = key;

    // Topbar doc-id
    const docIdEl = $('.topbar .doc-id');
    if (docIdEl) docIdEl.textContent = t.docId;

    // Hero
    updateHero(t);

    // Tipo field display
    const tipoVal = $('[data-field="tipo"] .value');
    if (tipoVal) tipoVal.textContent = t.label;

    // Identif fields
    updateIdentif(t);

    // Retenções section
    updateRetencoes(t);

    // Calc strip — hide retenções pill if no retenções
    const pillRet = $('#pill-ret');
    const pillRetSep1 = pillRet?.previousElementSibling;
    const pillRetSep2 = pillRet?.nextElementSibling;
    if (t.retencoes.length === 0) {
      if (pillRet) pillRet.style.display = 'none';
      if (pillRetSep1?.classList.contains('op')) pillRetSep1.style.display = 'none';
    } else {
      if (pillRet) pillRet.style.display = '';
      if (pillRetSep1?.classList.contains('op')) pillRetSep1.style.display = '';
    }

    // Sidebar composition
    updateComposition(t);

    // Sidebar títulos
    updateTitulos(t);
    updateTipoSelection(key);

    // Forma de pagamento default
    const formaVal = $('[data-field="forma"] .value');
    if (formaVal) formaVal.textContent = t.formaPag;
    if (window.applyForma) window.applyForma(t.formaPag);
    updateFormaSelection(t.formaPag);

    // Contrato
    updateContrato(t);

    // Extras
    updateExtras(t);

    // PDF preview
    updatePDF(t);

    // Validation list
    updateValidations(t);

    // Recompute
    window.__lastLiq = t.identif.bruto - t.retencoes.reduce((s, r) => s + r.value, 0);
    setTimeout(() => dynamicRecompute(), 60);

    // Apply fade animation
    ['#form', '#preview', '#sidebar'].forEach(s => {
      const el = $(s);
      if (el) {
        el.classList.remove('swap-fade');
        void el.offsetWidth;
        el.classList.add('swap-fade');
      }
    });

    showToast(`Tipo alterado para ${t.label}`);
  }

  /* ─── Sub-updaters ─── */
  function updateHero(t) {
    const hero = $('.hero');
    if (!hero) return;
    const name = hero.querySelector('.info .name');
    const cnpj = hero.querySelector('.info .cnpj');
    const meta = hero.querySelector('.info .meta');
    if (name) name.textContent = t.fornecedor.name;
    if (cnpj) cnpj.textContent = t.fornecedor.docNumber;
    if (meta) {
      const penSVG = `<svg class="ic-pen" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12L2.5 9.5L10 2L12 4L4.5 11.5L2 12Z"/><path d="M8.5 3.5L10.5 5.5"/></svg>`;
      const label = t.fornecedor.kind === 'PF' ? 'Alterar pessoa' : 'Alterar fornecedor';
      
      meta.innerHTML = `
        <a href="#" id="open-fornecedor-modal">${penSVG} ${label}</a>
        <span class="meta-separator">·</span>
        <span class="meta-date">${t.fornecedor.meta}</span>`;
        
      meta.querySelector('a').addEventListener('click', e => {
        e.preventDefault();
        openModal('modal-fornecedor');
      });
    }
  }

  function updateIdentif(t) {
    setInputValue('numero', t.identif.numero);
    setInputValue('serie', t.identif.serie);
    setInputValue('competencia', t.identif.competencia);
    setInputValue('emissao', t.identif.emissao);
    setInputValue('vencimento', t.identif.vencimento);
    setInputValue('descricao', t.identif.descricao);
    const bruto = $('#input-bruto');
    if (bruto) bruto.value = 'R$ ' + fmt(t.identif.bruto);

    // Hide série/competência for types that don't use them
    const showSerie = !['Recibo', 'Boleto', 'Guia', 'RPA', 'Fatura'].includes(t.label) || t.identif.serie !== '—';
    const serieField = $('[data-field="serie"]')?.closest('.field');
    if (serieField) serieField.style.opacity = (t.identif.serie === '—') ? '0.4' : '1';

    // DANFE-specific OCR field: Chave de Acesso
    const section = $('[data-section="identif"]');
    if (section) {
      const oldChaveRow = section.querySelector('[data-field="chaveAcesso"]')?.closest('.field-row');
      if (oldChaveRow) oldChaveRow.remove();
      const chaveExtra = t.extras?.find(e => e.id === 'chaveAcesso');
      if (chaveExtra) {
        const row = document.createElement('div');
        row.className = 'field-row wide';
        row.innerHTML = `
          <div class="field">
            <label>${chaveExtra.label}</label>
            <div class="input ocr-ok" data-field="chaveAcesso" data-pdf-target="chave">
              <input type="text" value="${chaveExtra.value}" style="font-family: 'JetBrains Mono', monospace; font-size: 11px;" />
            </div>
            ${chaveExtra.hint ? `<div class="hint"><span class="icon">✓</span><span>${chaveExtra.hint}</span></div>` : ''}
          </div>
        `;
        const lastRow = section.querySelector('.field-row:last-of-type');
        if (lastRow) lastRow.after(row);
        else section.appendChild(row);
        wireInput(row.querySelector('input'), row.querySelector('.input'));
      }
    }
  }

  function setInputValue(fieldKey, val) {
    const wrap = $(`[data-field="${fieldKey}"]`);
    if (!wrap) return;
    const inp = wrap.querySelector('input');
    if (inp) inp.value = val;
  }

  function updateRetencoes(t) {
    const section = $('#section-retencoes');
    if (!section) return;

    // Always clear old field-rows first — they leak into the calc if left behind
    $$('#section-retencoes .field-row').forEach(r => r.remove());

    if (t.retencoes.length === 0) {
      section.style.display = 'none';
      return;
    }
    section.style.display = '';

    const head = section.querySelector('.section-head');
    const divergent = t.retencoes.find(r => r.divergent);
    section.classList.toggle('has-issue', !!divergent);
    if (head) {
      const rule = head.querySelector('.rule');
      const help = head.querySelector('.help');
      const count = head.querySelector('.count');
      if (rule) rule.style.background = divergent ? 'var(--red)' : 'var(--teal)';
      if (help) {
        help.textContent = divergent ? '1 divergência detectada' : `${t.retencoes.length} retenções`;
        help.style.color = divergent ? 'rgb(168, 47, 36)' : '';
      }
      const total = t.retencoes.reduce((s, r) => s + r.value, 0);
      if (count) count.innerHTML = `${t.retencoes.length} retenções · R$ <span id="total-retencoes">${fmt(total)}</span>`;
    }

    // Remove old field-rows (keep only the section-head)
    // (already done above for early-return case; safe to repeat)
    $$('#section-retencoes .field-row').forEach(r => r.remove());

    // Build new rows (groups of 3)
    let row;
    t.retencoes.forEach((r, i) => {
      if (i % 3 === 0) {
        row = document.createElement('div');
        row.className = 'field-row';
        section.appendChild(row);
      }
      const field = document.createElement('div');
      field.className = 'field';
      field.dataset.retencao = r.id;
      const ocrClass = r.divergent ? 'ocr-divergent' : 'ocr-ok';
      const hint = r.divergent
        ? `<div class="hint error"><span class="icon">⚠</span><span>${r.hint || 'Divergente do padrão'}</span></div>`
        : '';
      const reqStar = r.divergent ? '<span class="req">*</span>' : '';
      field.innerHTML = `
        <label>${r.label} ${reqStar}</label>
        <div class="input ${ocrClass}" data-field="${r.id}" data-retencao="${r.id}" data-pdf-target="${r.id}-label" id="field-${r.id}">
          <input type="text" value="R$ ${fmt(r.value)}" id="input-${r.id}" />
        </div>
        ${hint}`;
      row.appendChild(field);

      // Wire focus/blur/input for the new input
      const inp = field.querySelector('input');
      const wrap = field.querySelector('.input');
      wireInput(inp, wrap);
    });

    // Keep the validation button visible; only update its state when there is a divergent item.
    const valBtn = $('#val-iss');
    if (valBtn) {
      valBtn.style.display = '';
      if (divergent) {
        valBtn.classList.add('warn');
        valBtn.classList.remove('ok', 'pending');
        valBtn.dataset.anchor = `input-${divergent.id}`;
        valBtn.querySelector('.label-txt').textContent = `Alíquota ${divergent.id.toUpperCase()} divergente do padrão`;
      } else {
        valBtn.classList.add('ok');
        valBtn.classList.remove('warn', 'pending');
        valBtn.dataset.anchor = 'input-iss';
        valBtn.querySelector('.label-txt').textContent = 'Alíquota ISS conforme padrão SEFIN';
      }
    }
  }

  function wireInput(inp, wrap) {
    if (!inp || !wrap) return;
    inp.addEventListener('focus', () => {
      if (document.body.classList.contains('sealed')) {
        inp.blur();
        wrap.classList.add('shake');
        setTimeout(() => wrap.classList.remove('shake'), 380);
        return;
      }
      wrap.classList.add('focused');
      const target = wrap.dataset.pdfTarget;
      if (target && window.showHighlight) window.showHighlight(target);
    });
    inp.addEventListener('blur', () => {
      wrap.classList.remove('focused');
      if (window.hideHighlight) window.hideHighlight();
    });
    inp.addEventListener('input', () => {
      dynamicRecompute(wrap);
      if (window.bumpAutoSave) window.bumpAutoSave();
    });
  }

  function updateComposition(t) {
    const comp = $('#composition');
    if (!comp) return;
    const bruto = t.identif.bruto;
    let html = `
      <div class="row bruto"><span class="k">Valor Bruto</span><span class="v">R$ ${fmt(bruto)}</span></div>
    `;
    if (t.retencoes.length > 0) {
      html += `<div class="sep"></div>`;
      t.retencoes.forEach(r => {
        const divCls = r.divergent ? 'divergent' : '';
        const anchor = r.divergent ? `field-${r.id}` : `input-${r.id}`;
        html += `<div class="row tax ${divCls}" data-retencao="${r.id}" data-anchor="${anchor}"><span class="k">${r.label}</span><span class="v">- R$ ${fmt(r.value)}</span></div>`;
      });
    }
    html += `
      <div class="sep"></div>
      <div class="row"><span class="k">Descontos</span><span class="v">R$ 0,00</span></div>
      <div class="row"><span class="k">Juros / Multa</span><span class="v">R$ 0,00</span></div>
    `;
    comp.innerHTML = html;

    // Re-wire divergent click → anchor
    $$('#composition .row.divergent').forEach(row => {
      row.addEventListener('click', () => {
        $('#val-iss')?.click();
      });
    });
  }

  function updateTitulos(t) {
    const titles = $('#titles');
    if (!titles) return;
    const liq = t.identif.bruto - t.retencoes.reduce((s, r) => s + r.value, 0);

    let childrenHTML = '';
    if (t.titulos.length > 0) {
      childrenHTML = t.titulos.map(c => `
        <div class="title-child ${c.divergent ? 'divergent' : ''}">
          <span class="kind">${c.kind}</span>
          <span class="to">${c.to}</span>
          <span class="amt">R$ ${fmt(c.amt)}</span>
        </div>`).join('');
    } else {
      childrenHTML = `<div style="font-size: 10.5px; color: var(--ink-5); padding: 8px 0; font-style: italic;">Sem títulos derivados — apenas o título principal</div>`;
    }

    titles.innerHTML = `
      <div class="h4-row"><h4>Títulos Previstos</h4></div>
      <div class="title-parent">
        <div class="kind">${t.label}</div>
        <div class="name">${t.fornecedor.name}</div>
        <div class="meta">
          <span class="amt" id="titulo-principal">R$ ${fmt(liq)}</span>
        </div>
      </div>
      <div class="title-children">${childrenHTML}</div>
    `;
  }

  function formatContractNumber(num) {
    const value = String(num || '').trim();
    const match = value.match(/^0*([0-9]+)\/(\d{4})$/);
    if (match) {
      return match[1].padStart(4, '0') + '/' + match[2];
    }
    return value;
  }

  function updateContrato(t) {
    const card = $('#open-contract');
    if (!card) return;
    const c = t.contrato || {
      form: 'Sem Contrato',
      num: '',
      label: 'Documento sem vínculo contratual',
      status: 'Livre'
    };
    card.style.display = '';
    const numberPart = c.num ? ` ${formatContractNumber(c.num)}` : '';
    const formLabel = c.form || 'Contrato';
    const status = c.status || 'Ativo';
    card.querySelector('.info .top').innerHTML = `${formLabel}${numberPart} <span class="pill-tag">${status}</span>`;
    card.querySelector('.info .bot').textContent = c.label;
  }

  function updateExtras(t) {
    let extras = $('#section-extras');
    const extrasToRender = (t.extras || []).filter(e => e.id !== 'chaveAcesso');
    if (extrasToRender.length === 0) {
      if (extras) extras.style.display = 'none';
      return;
    }
    if (!extras) {
      // Create the extras section right before .attach
      extras = document.createElement('section');
      extras.className = 'section';
      extras.id = 'section-extras';
      extras.dataset.section = 'extras';
      //const attach = $('#attach');
      //attach.parentNode.insertBefore(extras, attach);
    }
    extras.style.display = '';
    extras.innerHTML = `
      <div class="section-head">
        <span class="rule"></span>
        <h3>Detalhes Específicos</h3>
        <span class="help">campos do tipo ${t.label}</span>
      </div>
      ${extrasToRender.map(e => {
        const monoStyle = e.mono ? 'font-family: \'JetBrains Mono\', monospace; font-size: 11px; letter-spacing: 0.3px;' : '';
        return `
          <div class="field-row ${e.full ? 'wide' : 'cols-2'}">
            <div class="field">
              <label>${e.label}</label>
              <div class="input ocr-ok" data-field="extra-${e.id}" data-pdf-target="${e.id === 'chaveAcesso' ? 'chave' : 'valor-bruto'}">
                <input type="text" value="${e.value}" style="${monoStyle}" />
              </div>
              ${e.hint ? `<div class="hint"><span class="icon">✓</span><span>${e.hint}</span></div>` : ''}
            </div>
          </div>
        `;
      }).join('')}
    `;
  }

  function updatePDF(t) {
    const pdfEl = $('#pdf');
    if (!pdfEl) return;
    const hl = pdfEl.querySelector('.pdf-hl');
    const scan = pdfEl.querySelector('.pdf-scan');
    pdfEl.innerHTML = t.pdf(t);
    if (hl) pdfEl.appendChild(hl);
    if (scan) pdfEl.appendChild(scan);

    // Update preview-head label
    const lbl = $('.preview-head .label');
    if (lbl) {
      const filename = `${t.label.replace(/[^a-zA-Z0-9]/g, '_')}_2026_${t.identif.numero || 'xxxx'}.pdf`;
      lbl.textContent = `📄 ${filename} · página 1/1`;
    }
  }

  function ensureValidationsSection() {
    const sidebar = $('#sidebar');
    if (!sidebar) return null;
    let validations = sidebar.querySelector('.validations');
    if (validations) return validations;

    const heading = document.createElement('h4');
    heading.style.marginBottom = '8px';
    heading.textContent = 'Validação';

    validations = document.createElement('div');
    validations.className = 'validations';
    validations.innerHTML = `
      <button class="val ok"><span class="dot">✓</span><span class="label-txt">Fornecedor identificado</span></button>
      <button class="val ok"><span class="dot">✓</span><span class="label-txt">Cálculo bruto → líquido íntegro</span></button>
      <button class="val ok"><span class="dot">✓</span><span class="label-txt">Dados bancários válidos</span></button>
      <button class="val warn" id="val-iss" data-anchor="field-iss">
        <span class="dot">!</span>
        <span class="label-txt">Alíquota ISS divergente do padrão SEFIN</span>
        <span class="arrow">→</span>
      </button>
      <button class="val pending"><span class="dot">·</span><span class="label-txt">Aguarda aprovação do gestor</span></button>
    `;

    const sep = sidebar.querySelector('.sb-sep');
    if (sep) {
      sep.insertAdjacentElement('afterend', heading);
      heading.insertAdjacentElement('afterend', validations);
    } else {
      sidebar.appendChild(heading);
      sidebar.appendChild(validations);
    }

    return validations;
  }

  function updateValidations(t) {
    const validations = ensureValidationsSection();
    if (validations) validations.style.display = 'flex';

    let v = $('#val-iss');
    if (!v && validations) {
      v = validations.querySelector('#val-iss');
    }
    if (!v && validations) {
      v = document.createElement('button');
      v.id = 'val-iss';
      v.className = 'val warn';
      v.dataset.anchor = 'field-iss';
      v.innerHTML = `
        <span class="dot">!</span>
        <span class="label-txt">Alíquota ISS divergente do padrão SEFIN</span>
        <span class="arrow">→</span>
      `;
      v.addEventListener('click', () => {
        const anchorId = v.dataset.anchor || 'input-iss';
        const targetInput = $('#' + anchorId);
        let field = targetInput?.closest('.input');
        if (!field && anchorId.startsWith('input-')) {
          field = $(`#field-${anchorId.slice(6)}`);
        }
        field = field || $('#field-iss');
        if (!field) return;
        field.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => {
          const inp = field.querySelector('input');
          if (inp) inp.focus();
          field.classList.add('shake');
          setTimeout(() => field.classList.remove('shake'), 380);
        }, 40);
      });
      validations.appendChild(v);
    }

    if (!v) return;
    v.style.display = 'flex';
    const divergent = t.retencoes.find(r => r.divergent);
    if (divergent) {
      v.classList.add('warn');
      v.classList.remove('ok', 'pending');
      v.dataset.anchor = `input-${divergent.id}`;
      v.querySelector('.label-txt').textContent = `Alíquota ${divergent.id.toUpperCase()} divergente do padrão`;
    } else {
      v.classList.add('ok');
      v.classList.remove('warn', 'pending');
      v.dataset.anchor = 'input-iss';
      v.querySelector('.label-txt').textContent = 'Alíquota ISS conforme padrão SEFIN';
    }
  }

  /* ─── 5. Demo scene: cycle through types ─── */
  let cycleIdx = 0;
  const cycleOrder = ['DANFE', 'RPA', 'Boleto', 'Guia', 'NFS-e'];
  window.cycleDocType = function() {
    const next = cycleOrder[cycleIdx % cycleOrder.length];
    cycleIdx++;
    setDocType(next);
  };

  /* ─── 6. Init ─── */
  function init() {
    tagExistingRetencoes();
    buildTipoCards();

    // Override the original recompute by re-binding inputs
    $$('.input input').forEach(inp => {
      const wrap = inp.closest('.input');
      // Remove old listeners by cloning the node
      // (only do this for retenção inputs to avoid double-binding everything)
      if (wrap?.dataset.retencao) {
        const newInp = inp.cloneNode(true);
        inp.parentNode.replaceChild(newInp, inp);
        wireInput(newInp, wrap);
      } else if (inp.id === 'input-bruto') {
        inp.addEventListener('input', () => dynamicRecompute(wrap));
      }
    });

    // Wire Tipo field click
    const tipoField = $('[data-field="tipo"]');
    if (tipoField) tipoField.addEventListener('click', () => openModal('modal-tipo'));

    // Wire close handlers on the new modal
    const tipoModal = $('#modal-tipo');
    if (tipoModal) {
      tipoModal.addEventListener('click', e => { if (e.target === tipoModal) closeModal(tipoModal); });
      tipoModal.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => closeModal(tipoModal)));
    }

    // Wire cycle scene
    document.addEventListener('click', e => {
      const btn = e.target.closest('[data-scene="tipo-cycle"]');
      if (btn) window.cycleDocType();
    });

    // Expose
    window.setDocType = setDocType;
    window.dynamicRecompute = dynamicRecompute;
    window.showHighlight = window.showHighlight || function(){};
    window.hideHighlight = window.hideHighlight || function(){};

    // Render initial state from schema (source of truth)
    setTimeout(() => setDocType('NFS-e'), 50);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
