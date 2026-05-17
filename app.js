/* ═══════════════════════════════════════════════════════════
   PROTÓTIPO · Lançar Documento — Interações
   ═══════════════════════════════════════════════════════════ */

const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/* ─── 1. Cross-highlight: focus em campo OCR ilumina região do PDF ─── */
const pdfEl = $('#pdf');
const hl    = $('#pdf-hl');
const tip   = $('#tip');

function showHighlight(targetKey, anchorEl) {
  if (!targetKey) return hideHighlight();
  const target = pdfEl.querySelector(`[data-pdf="${targetKey}"]`);
  if (!target) return hideHighlight();

  const pdfRect = pdfEl.getBoundingClientRect();
  const tRect   = target.getBoundingClientRect();
  // Position highlight relative to .pdf (which is position: relative)
  hl.style.left   = (tRect.left - pdfRect.left - 6) + 'px';
  hl.style.top    = (tRect.top  - pdfRect.top  - 4) + 'px';
  hl.style.width  = (tRect.width  + 12) + 'px';
  hl.style.height = (tRect.height + 8) + 'px';
  hl.classList.remove('show');
  // Force reflow so animation re-runs
  void hl.offsetWidth;
  hl.classList.add('show');

  // Auto-scroll the preview column so user sees the region
  const preview = $('#preview');
  const pdfTopInPreview = target.offsetTop + pdfEl.offsetTop;
  const desiredScroll = pdfTopInPreview - preview.clientHeight / 2 + 40;
  preview.scrollTo({ top: Math.max(0, desiredScroll), behavior: 'smooth' });
}

function hideHighlight() {
  hl.classList.remove('show');
}

/* ─── 2. Input focus / blur wiring ─── */
$$('.input').forEach(inp => {
  const innerInput = inp.querySelector('input');
  const isSelect = inp.classList.contains('is-select');

  // Click on .input → focus inner input
  inp.addEventListener('click', e => {
    if (isSelect) {
      inp.classList.add('focused');
      const target = inp.dataset.pdfTarget;
      if (target) showHighlight(target);
    } else if (innerInput) {
      innerInput.focus();
    }
  });

  if (innerInput) {
    innerInput.addEventListener('focus', () => {
      // Skip locked fields entirely when in sealed state
      if (document.body.classList.contains('sealed')) {
        innerInput.blur();
        inp.classList.add('shake');
        setTimeout(() => inp.classList.remove('shake'), 380);
        return;
      }
      inp.classList.add('focused');
      const target = inp.dataset.pdfTarget;
      if (target) showHighlight(target);
    });
    innerInput.addEventListener('blur', () => {
      inp.classList.remove('focused');
      hideHighlight();
    });
    innerInput.addEventListener('input', () => onValueChange(inp));
  } else if (isSelect) {
    inp.addEventListener('blur', () => {
      inp.classList.remove('focused');
      hideHighlight();
    }, true);
  }

  // Hover preview without focus — subtle tooltip if OCR field
  inp.addEventListener('mouseenter', () => {
    if (inp.classList.contains('ocr-ok') || inp.classList.contains('ocr-divergent')) {
      const r = inp.getBoundingClientRect();
      tip.textContent = inp.classList.contains('ocr-divergent')
        ? '⚠ Divergente do padrão · revise'
        : '📄 Origem: leitura do PDF';
      tip.style.left = (r.left + r.width / 2 - 70) + 'px';
      tip.style.top  = (r.top - 32) + 'px';
      tip.classList.add('show');
    }
  });
  inp.addEventListener('mouseleave', () => tip.classList.remove('show'));
});

/* ─── 3. Live calculation — counting number on Líquido ─── */
const BRUTO = 10000;
let currentRetencoes = 2065; // ISS 350 + IRRF 150 + INSS 1100 + PIS 65 + COFINS 300 + CSLL 100 = 2065
let currentLiquido   = BRUTO - currentRetencoes;
let lastLiquido      = currentLiquido;

const fmt = n => n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtBR = n => 'R$ ' + fmt(n);
const fmtShort = n => 'R$ ' + Math.round(n).toLocaleString('pt-BR');

function parseBR(str) {
  if (!str) return 0;
  const cleaned = String(str).replace(/[^\d,-]/g, '').replace(',', '.');
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}

function getTax(id) {
  const el = $('#' + id);
  if (!el) return 0;
  const i = el.querySelector('input');
  return parseBR(i ? i.value : '0');
}

function recompute(pulseField) {
  const iss   = getTax('field-iss');
  const irrf  = parseBR($('#input-irrf').value);
  const inss  = parseBR($('#input-inss').value);
  const pis   = parseBR($('#input-pis').value);
  const cofins= parseBR($('#input-cofins').value);
  const csll  = parseBR($('#input-csll').value);
  const bruto = parseBR($('#input-bruto').value);

  const ret = iss + irrf + inss + pis + cofins + csll;
  const liq = bruto - ret;

  // Update sidebar composition values
  const compMap = {
    'field-iss':    [iss,    'ISS', getTaxPercent('iss', bruto)],
    'input-irrf':   [irrf,   'IRRF (1,5%)'],
    'input-inss':   [inss,   'INSS (11%)'],
    'input-pis':    [pis,    'PIS (0,65%)'],
    'input-cofins': [cofins, 'COFINS (3%)'],
    'input-csll':   [csll,   'CSLL (1%)']
  };
  $$('#composition .row.tax').forEach(row => {
    const a = row.dataset.anchor;
    const [val] = compMap[a] || [0];
    const v = row.querySelector('.v');
    if (v) v.textContent = '- ' + fmtBR(val);
  });
  $('#composition .row.bruto .v').textContent = fmtBR(bruto);

  // Update strip + sidebar net
  $('#pill-bruto .val').textContent = fmtShort(bruto);
  $('#pill-ret   .val').textContent = fmtShort(ret);
  $('#total-retencoes').textContent = fmt(ret);

  // Counting number on Líquido
  animateNumber($('#net-num'),     lastLiquido, liq, 220, n => fmtShort(n));
  animateNumber($('#sidebar-net'), lastLiquido, liq, 280, n => fmtBR(n));
  animateNumber($('#titulo-principal'), lastLiquido, liq, 280, n => fmtBR(n));
  lastLiquido = liq;

  // Pulse the net pill
  const pillNet = $('#pill-net');
  pillNet.classList.remove('pulse');
  void pillNet.offsetWidth;
  pillNet.classList.add('pulse');

  // Pulse the field that triggered the change
  if (pulseField) {
    pulseField.classList.remove('flash');
    void pulseField.offsetWidth;
    pulseField.classList.add('flash');
  }
}

function getTaxPercent(kind, bruto) {
  // Used to keep ISS percentage visible
  return '';
}

function animateNumber(el, from, to, duration, formatter) {
  if (!el) return;
  const start = performance.now();
  function step(t) {
    const p = Math.min(1, (t - start) / duration);
    // easeOutQuart
    const eased = 1 - Math.pow(1 - p, 4);
    const val = from + (to - from) * eased;
    el.textContent = formatter(val);
    if (p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function onValueChange(inputEl) {
  recompute(inputEl);
  bumpAutoSave();
}

/* ─── 4. Auto-save indicator ─── */
const saveStatus = $('#save-status');
let lastSavedAt = Date.now();

function bumpAutoSave() {
  saveStatus.textContent = 'Salvando…';
  clearTimeout(bumpAutoSave._t);
  bumpAutoSave._t = setTimeout(() => {
    lastSavedAt = Date.now();
    saveStatus.textContent = 'Auto-salvo · há um instante';
    showToast('Rascunho salvo');
  }, 600);
}

setInterval(() => {
  const txt = saveStatus.textContent;
  if (txt.startsWith('Salvando')) return;
  const sec = Math.floor((Date.now() - lastSavedAt) / 1000);
  if (sec < 5)  saveStatus.textContent = 'Auto-salvo · há um instante';
  else if (sec < 60) saveStatus.textContent = `Auto-salvo · há ${sec}s`;
  else saveStatus.textContent = `Auto-salvo · há ${Math.floor(sec/60)} min`;
}, 4000);

/* ─── 5. Toast ─── */
const toast = $('#toast');
const toastMsg = $('#toast-msg');
let toastTimer;
function showToast(msg) {
  toastMsg.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 1800);
}

/* ─── 6. Validation → anchor field (dynamic) ─── */
$('#val-iss').addEventListener('click', () => {
  const btn = $('#val-iss');
  const anchorId = btn.dataset.anchor || 'input-iss';
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
  }, 350);
});

// Click on divergent composition row also anchors
$$('#composition .row.divergent').forEach(row => {
  row.addEventListener('click', () => {
    $('#val-iss').click();
  });
});

/* ─── 7. Click on divergent input → open divergence modal ─── */
// Double-click on the currently-divergent field opens modal
document.addEventListener('dblclick', e => {
  const div = e.target.closest('.input.ocr-divergent');
  if (div) openModal('modal-divergencia');
});
$$('.hint.error').forEach(h => h.addEventListener('click', () => openModal('modal-divergencia')));

/* ─── 8. Modal handling ─── */
function openModal(id) {
  const m = $('#' + id);
  if (!m) return;
  m.classList.add('open');
  document.body.style.overflow = 'hidden';
  setTimeout(() => {
    const first = m.querySelector('input, button:not([data-close])');
    if (first && first.tagName === 'INPUT') first.focus();
  }, 100);
}
function closeModal(m) {
  m.classList.remove('open');
  document.body.style.overflow = '';
}

$$('.modal-backdrop').forEach(m => {
  m.addEventListener('click', e => { if (e.target === m) closeModal(m); });
  m.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => closeModal(m)));
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    const open = $('.modal-backdrop.open');
    if (open) closeModal(open);
    if ($('#tweaks-panel').classList.contains('open')) {
      $('#tweaks-panel').classList.remove('open');
      $('#tweaks-fab').classList.remove('hide');
    }
  }
  // Cmd/Ctrl + Enter → submit
  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
    e.preventDefault();
    $('#btn-approve').click();
  }
});

/* Open modals from form */
$('#open-fornecedor-modal').addEventListener('click', e => { e.preventDefault(); openModal('modal-fornecedor'); });
$('#open-bank-modal').addEventListener('click', () => openModal('modal-bank'));
$('#open-contract').addEventListener('click', () => showToast('Detalhes do contrato (demo)'));
//$('#attach').addEventListener('click', () => showToast('Anexar arquivo (demo)'));//
$('#open-forma').addEventListener('click', () => openModal('modal-forma'));
$('#open-aprovador')?.addEventListener('click', () => openModal('modal-aprovador'));

/* Forma de Pagamento — modal selection */
const PAY_EXTRAS = {
  'PIX':           { k: 'Chave PIX:',         v: '12.345.678/0001-90', mono: true },
  'Boleto':        { k: 'Beneficiário:',      v: 'Tech Solutions Ltda · banco 237',           mono: false },
  'TED':           { k: 'Conta destino:',     v: '077 Inter · Ag 0001-9 / CC 6433553-4', mono: false },
  'Transferência': { k: 'Conta destino:',     v: '077 Inter · Ag 0001-9 / CC 6433553-4', mono: false },
  'Cartão':        { k: 'Cartão corporativo:', v: 'Visa Business **** 4719',           mono: false },
  'Outro':         { k: 'Observação:',         v: 'Definir junto à tesouraria',          mono: false }
};

const DEFAULT_APPROVER = 'Ana Carvalho';
function getSelectedApprover() {
  return $('[data-field="aprovador"] .value')?.textContent?.trim() || DEFAULT_APPROVER;
}

function applyForma(forma) {
  const formaVal = $('[data-field="forma"] .value');
  if (formaVal) formaVal.textContent = forma;
  const extras = $('#pay-extras');
  const bankTypeTag = $('#open-bank-modal .bank-type');
  const bankBot = $('#open-bank-modal .bot');
  const bankTop = $('#open-bank-modal .top');
  if (!extras) return;
  $$('#modal-forma .forma-card').forEach(card => {
    card.classList.toggle('selected', card.dataset.forma === forma);
  });
  const cfg = PAY_EXTRAS[forma];

  if (bankTypeTag) {
    bankTypeTag.style.display = forma === 'PIX' ? '' : 'none';
  }
  if (bankTop && bankTop.firstChild) {
    let topLabel = 'Dados Bancários do Fornecedor ';
    if (forma === 'Boleto') topLabel = 'Pagamento via boleto ';
    else if (forma === 'Cartão') topLabel = 'Cartão corporativo ';
    else if (forma === 'Outro') topLabel = 'Forma de pagamento ';
    bankTop.firstChild.nodeValue = topLabel;
  }

  // Remove any previous barras-input
  const oldBarras = $('#pay-barras');
  if (oldBarras) oldBarras.remove();

  if (!cfg) { extras.style.display = 'none'; return; }

  const bankInfo = '077 · Banco Inter S.A. · Ag 0001-9 / CC 6433553-4';
  if (bankBot) {
    if (forma === 'Boleto') {
      bankBot.innerHTML = `<span>${cfg.v || ''}</span>`;
    } else if (forma === 'Cartão') {
      bankBot.innerHTML = `
        <span>${cfg.v}</span>
      `;
    } else if (forma === 'Outro') {
      bankBot.innerHTML = `
        <textarea class="outro-field" placeholder="Definir junto à tesouraria">${cfg.v}</textarea>
      `;
      const outroInput = bankBot.querySelector('.outro-field');
      outroInput.addEventListener('change', () => {
        // Save value if needed
      });
    } else {
      bankBot.innerHTML = `
        <span>${bankInfo}</span>
        ${forma === 'PIX' ? '<span class="bank-type">PIX cnpj</span>' : ''}
        ${forma === 'PIX' ? `
          <div class="pix-key">
            <div class="pix-label">Chave PIX</div>
            <div class="pix-value">${cfg.v}</div>
          </div>
        ` : ''}`;
    }
  }

  if (forma === 'Boleto' || forma === 'PIX' || forma === 'TED' || forma === 'Transferência' || forma === 'Cartão' || forma === 'Outro') {
    extras.style.display = 'none';
  } else {
    extras.style.display = '';
    extras.classList.remove('pay-extras');
    void extras.offsetWidth;
    extras.classList.add('pay-extras');
    extras.innerHTML = `
      <span class="k">${cfg.k}</span>
      <span class="${cfg.mono ? 'v' : ''}" style="${cfg.mono ? '' : 'color: var(--ink-2); font-weight: 500;'}">${cfg.v}</span>
    `;
  }

  if (forma === 'Boleto') {
    const barras = document.createElement('div');
    barras.className = 'pay-barras-input';
    barras.id = 'pay-barras';
    barras.innerHTML = `
      <div class="br-head">
        <label for="input-cod-barras">Código de barras</label>
        <span class="validate" id="barras-status">✓ válido</span>
      </div>
      <input type="text" id="input-cod-barras" data-field="codigo-barras" inputmode="numeric" value="23793.39001 60000.123456 78901.234567 8 98760000485000" />
      <div class="br-help">Linha digitável (47–48 dígitos)</div>
    `;
    extras.parentNode.insertBefore(barras, extras);

    const codInp = barras.querySelector('input');
    const status = barras.querySelector('#barras-status');
    codInp.addEventListener('input', () => {
      const len = codInp.value.replace(/\D/g, '').length;
      if (len === 47 || len === 48) {
        status.style.color = 'rgb(28, 121, 67)';
        status.innerHTML = '✓ válido';
      } else if (len === 0) {
        status.style.color = 'var(--ink-5)';
        status.innerHTML = 'aguardando';
      } else {
        status.style.color = 'rgb(168, 47, 36)';
        status.innerHTML = `⚠ ${len}/47`;
      }
    });
  }
}

$$('#modal-forma .forma-card').forEach(card => {
  card.addEventListener('click', () => {
    const forma = card.dataset.forma;
    $$('#modal-forma .forma-card').forEach(c => c.classList.remove('selected'));
    card.classList.add('selected');
    setTimeout(() => {
      applyForma(forma);
      closeModal($('#modal-forma'));
      showToast(`Forma de pagamento: ${forma}`);
    }, 180);
  });
});

const approverCards = $$('#modal-aprovador .approver-card');
approverCards.forEach(card => {
  card.addEventListener('click', () => {
    approverCards.forEach(c => c.classList.remove('selected'));
    card.classList.add('selected');
  });
});

$('#confirm-aprovador')?.addEventListener('click', () => {
  const selected = $('#modal-aprovador .approver-card.selected');
  const name = selected?.dataset.name || DEFAULT_APPROVER;
  const target = $('[data-field="aprovador"] .value');
  if (target) target.textContent = name;
  closeModal($('#modal-aprovador'));
  showToast(`Aprovador selecionado: ${name}`);
});

/* Fornecedor search keyboard nav */
const fornInput = $('#forn-search');
const results = () => $$('#forn-results .result');
fornInput?.addEventListener('keydown', e => {
  const arr = results();
  let idx = arr.findIndex(r => r.classList.contains('focused'));
  if (e.key === 'ArrowDown') { e.preventDefault(); idx = (idx + 1) % arr.length; }
  else if (e.key === 'ArrowUp') { e.preventDefault(); idx = (idx - 1 + arr.length) % arr.length; }
  else if (e.key === 'Enter') {
    e.preventDefault();
    showToast('Fornecedor selecionado');
    closeModal($('#modal-fornecedor'));
    return;
  } else return;
  arr.forEach((r, i) => r.classList.toggle('focused', i === idx));
  arr[idx].scrollIntoView({ block: 'nearest' });
});

/* ─── 9. Divergência modal — radio choice ─── */
$$('#modal-divergencia .choice').forEach(c => {
  c.addEventListener('click', () => {
    $$('#modal-divergencia .choice').forEach(o => o.classList.remove('selected'));
    c.classList.add('selected');
  });
});

$('#confirm-divergence').addEventListener('click', () => {
  const sel = $('#modal-divergencia .choice.selected')?.dataset.choice;
  closeModal($('#modal-divergencia'));
  if (sel === 'corrigir') {
    const inp = $('#input-iss');
    inp.value = 'R$ 500,00';
    inp.dispatchEvent(new Event('input', { bubbles: true }));
    showToast('ISS ajustado para R$ 500,00 — auditoria registrada');
  } else if (sel === 'aceitar') {
    showToast('Divergência aceita · assinatura registrada na trilha');
  } else if (sel === 'contatar') {
    showToast('Notificação enviada ao fornecedor');
  }
});

/* ─── 10. Approve flow ─── */
const btnApprove = $('#btn-approve');
btnApprove.addEventListener('click', () => {
  if (btnApprove.disabled) return;
  btnApprove.disabled = true;
  const original = btnApprove.innerHTML;
  btnApprove.innerHTML = '<span style="display:inline-block;width:12px;height:12px;border:1.5px solid white;border-top-color:transparent;border-radius:50%;animation:spin 0.6s linear infinite;"></span> Enviando…';
  // Add @keyframes for spin if not present
  if (!$('#spin-style')) {
    const s = document.createElement('style');
    s.id = 'spin-style';
    s.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
    document.head.appendChild(s);
  }
  setTimeout(() => {
    const approver = getSelectedApprover();
    btnApprove.innerHTML = '✓ Enviado';
    btnApprove.style.background = 'var(--green)';
    $('#stage-pill').textContent = 'Em Aprovação';
    $('#stage-pill').style.background = 'rgba(242, 191, 51, 0.18)';
    $('#stage-pill').style.color = 'var(--amber-deep)';
    showToast(`Documento enviado para ${approver} (Aprovador)`);
    setTimeout(() => {
      btnApprove.disabled = false;
      btnApprove.innerHTML = original;
      btnApprove.style.background = '';
    }, 3200);
  }, 1100);
});

/* ─── 11. Discard ─── */
$('#btn-discard').addEventListener('click', () => {
  showToast('Rascunho descartado (demo)');
});

/* ─── 12. Sealed state — locks all fields ─── */
function setSealed(on) {
  document.body.classList.toggle('sealed', on);
  $('#lock-banner').classList.toggle('show', on);
  $('#stage-pill').textContent = on ? 'Selado' : 'Rascunho';
  $('#stage-pill').style.background = on ? 'rgba(77,71,64,0.10)' : '';
  $('#stage-pill').style.color = on ? 'var(--ink-2)' : '';

  if (on) {
    $$('.input input').forEach(i => i.setAttribute('readonly', 'readonly'));
    $$('.input.is-select').forEach(i => i.style.pointerEvents = 'none');
  } else {
    $$('.input input').forEach(i => i.removeAttribute('readonly'));
    $$('.input.is-select').forEach(i => i.style.pointerEvents = '');
  }
}

$('#reopen').addEventListener('click', () => {
  setSealed(false);
  showToast('Documento reaberto · status volta a Rascunho');
});

/* ─── 13. Demo scenes via tweaks panel ─── */
const tweaksFab = $('#tweaks-fab');
const tweaksPanel = $('#tweaks-panel');

tweaksFab.addEventListener('click', () => {
  tweaksPanel.classList.add('open');
  tweaksFab.classList.add('hide');
});
$('#tweaks-close').addEventListener('click', () => {
  tweaksPanel.classList.remove('open');
  tweaksFab.classList.remove('hide');
});

const scenes = {
  'ocr-cascade': () => {
    // Reset all values to "empty" first then simulate OCR fill
    const fields = ['input-bruto', 'input-iss', 'input-irrf', 'input-inss', 'input-pis', 'input-cofins', 'input-csll'];
    const targets = {
      'input-bruto':  'R$ 10.000,00',
      'input-iss':    'R$ 350,00',
      'input-irrf':   'R$ 150,00',
      'input-inss':   'R$ 1.100,00',
      'input-pis':    'R$ 65,00',
      'input-cofins': 'R$ 300,00',
      'input-csll':   'R$ 100,00'
    };
    fields.forEach(id => { const e = $('#' + id); if (e) e.value = ''; });
    // Reset top fields too
    const topFields = {
      'numero': '0847', 'emissao': '02/05/2026', 'vencimento': '10/06/2026',
      'descricao': 'Consultoria técnica · maio/2026'
    };
    $$('.input').forEach(i => { const inp = i.querySelector('input'); if (inp) inp.placeholder = '—'; });

    // Trigger scan overlay
    const scan = $('#pdf-scan');
    scan.classList.remove('scanning');
    void scan.offsetWidth;
    scan.classList.add('scanning');

    showToast('Lendo NFS-e_2026_0847.pdf…');

    const sequence = [
      { id: 'numero', val: '0847', delay: 600 },
      { id: 'emissao', val: '02/05/2026', delay: 750 },
      { id: 'vencimento', val: '10/06/2026', delay: 900 },
      { id: 'descricao', val: 'Consultoria técnica · maio/2026', delay: 1050 },
      { id: 'input-bruto', val: 'R$ 10.000,00', delay: 1200, top: false },
      { id: 'input-iss', val: 'R$ 350,00', delay: 1380 },
      { id: 'input-irrf', val: 'R$ 150,00', delay: 1500 },
      { id: 'input-inss', val: 'R$ 1.100,00', delay: 1620 },
      { id: 'input-pis', val: 'R$ 65,00', delay: 1740 },
      { id: 'input-cofins', val: 'R$ 300,00', delay: 1860 },
      { id: 'input-csll', val: 'R$ 100,00', delay: 1980 }
    ];

    sequence.forEach(({id, val, delay}) => {
      setTimeout(() => {
        const el = $('#' + id) || $(`[data-field="${id}"] input`);
        if (el) {
          el.value = val;
          el.dispatchEvent(new Event('input', { bubbles: true }));
          const wrap = el.closest('.input');
          if (wrap) {
            wrap.classList.remove('flash');
            void wrap.offsetWidth;
            wrap.classList.add('flash');
          }
        }
      }, delay);
    });

    setTimeout(() => showToast('11 campos lidos · 1 divergência sinalizada'), 2300);
  },
  'cross-highlight': () => {
    const seq = ['valor-bruto', 'iss', 'emissao'];
    seq.forEach((f, i) => {
      setTimeout(() => {
        const field = $(`[data-field="${f}"]`);
        if (field) {
          field.scrollIntoView({ behavior: 'smooth', block: 'center' });
          const inp = field.querySelector('input');
          if (inp) inp.focus();
          else field.click();
        }
      }, i * 1400);
    });
    setTimeout(() => $$('.input').forEach(i => i.querySelector('input')?.blur()), seq.length * 1400 + 800);
    showToast('Observe a região destacada no PDF →');
  },
  'live-calc': () => {
    const inp = $('#input-iss');
    const steps = [500, 250, 750, 350];
    steps.forEach((v, i) => {
      setTimeout(() => {
        inp.value = 'R$ ' + v.toLocaleString('pt-BR') + ',00';
        inp.dispatchEvent(new Event('input', { bubbles: true }));
      }, i * 800);
    });
    showToast('Edite o ISS — veja o Líquido recalcular ao vivo');
  },
  'divergence': () => openModal('modal-divergencia'),
  'approve':    () => { $('#btn-approve').click(); },
  'sealed':     () => {
    setSealed(true);
    showToast('Tente editar um campo — receberá feedback físico');
  },
  'reset': () => location.reload()
};

$$('.scene').forEach(btn => {
  btn.addEventListener('click', () => {
    $$('.scene').forEach(s => s.classList.remove('active'));
    btn.classList.add('active');
    const s = btn.dataset.scene;
    if (scenes[s]) scenes[s]();
  });
});

/* ─── 14. Hover on title-parent highlights filhos (relação RN-02) ─── */
const parent = $('.title-parent');
const children = $$('.title-child');
parent?.addEventListener('mouseenter', () => {
  children.forEach((c, i) => {
    c.style.transition = `transform 220ms cubic-bezier(.2,.7,.2,1) ${i * 40}ms, background 120ms`;
    c.style.transform = 'translateX(4px)';
  });
});
parent?.addEventListener('mouseleave', () => {
  children.forEach(c => c.style.transform = '');
});

/* ─── 15. Tab order: skip OCR-confident fields if Shift not held? Keep default. ─── */
/* (Browser-native tab order matches DOM order = reading order) */

/* ─── 16. Initial demo hint ─── */
setTimeout(() => {
  showToast('Clique no botão ✦ embaixo para ver as demos');
}, 800);

/* ─── Expose helpers for transform.js ─── */
window.showHighlight = showHighlight;
window.hideHighlight = hideHighlight;
window.bumpAutoSave  = bumpAutoSave;
window.showToast     = showToast;
window.openModal     = openModal;
window.closeModal    = closeModal;
window.fmt           = fmt;
window.fmtBR         = fmtBR;
window.fmtShort      = fmtShort;
window.applyForma    = applyForma;
