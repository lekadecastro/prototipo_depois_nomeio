/* ═══════════════════════════════════════════════════════════
   PROTÓTIPO · Schemas dos Tipos de Documento
   Aderente à RN-05 (campos tributários condicionais) e
   ao item 9.1.x da Especificação de Domínio
   ═══════════════════════════════════════════════════════════ */

/* Cada tipo declara:
   - meta (label, sub, ícone do seletor)
   - fiscal: true/false → habilita seção de retenções
   - fornecedor: PJ/PF + dados
   - identif: nº, série, emissão, vencimento, bruto, descrição
   - retencoes[]: lista com id, label, value, divergent?, hint?
   - titulos[]: títulos previstos derivados (RN-02)
   - extras[]: campos extras (ex: código de barras p/ Boleto)
   - pdf(): função que retorna o HTML do preview do documento
*/

const DOC_TYPES = {

  'NFS-e': {
    label: 'NFS-e',
    sub: 'Nota Fiscal de Serviço Eletrônica',
    desc: 'Serviços contratados de PJ — gera retenções tributárias',
    glyph: 'SF',
    color: 'teal',
    fiscal: true,
    docId: 'DOC-2026-0847',
    fornecedor: {
      kind: 'PJ',
      name: 'Tech Solutions Ltda',
      docNumber: 'CNPJ 12.345.678/0001-90',
      avatar: 'TS',
      meta: 'Contratado desde mai/2023',
      bankBrand: 'B', bankName: 'Banco Inter S.A.',
      bankInfo: '077 · Ag 0001-9 / CC 6433553-4 · PIX cnpj'
    },
    identif: {
      numero: '0847', serie: 'A1', competencia: '05/2026',
      emissao: '02/05/2026', vencimento: '10/06/2026',
      bruto: 10000, descricao: 'Consultoria técnica · maio/2026'
    },
    retencoes: [
      { id: 'iss',    label: 'ISS (5% padrão)',  value: 350,  divergent: true, hint: 'Documento traz <strong>3,5%</strong> — padrão SEFIN: 5%' },
      { id: 'irrf',   label: 'IRRF (1,5%)',      value: 150 },
      { id: 'inss',   label: 'INSS (11%)',       value: 1100 },
      { id: 'pis',    label: 'PIS (0,65%)',      value: 65 },
      { id: 'cofins', label: 'COFINS (3%)',      value: 300 },
      { id: 'csll',   label: 'CSLL (1%)',        value: 100 },
      { id: 'cbs',    label: 'CBS (0,9%)',       value: 90,   hint: 'Reforma Tributária · vigência transitória' },
      { id: 'ibsmun', label: 'IBS Municipal (0,1%)', value: 10, hint: 'Reforma Tributária · em vigência teste' },
      { id: 'ibsest', label: 'IBS Estadual (0,1%)',  value: 10, hint: 'Reforma Tributária · em vigência teste' }
    ],
    titulos: [
      { kind: 'ISS',  to: 'SEFIN Fortaleza',  amt: 350,  divergent: true, due: 'venc 10/06' },
      { kind: 'IRRF', to: 'Receita Federal',  amt: 150 },
      { kind: 'INSS', to: 'Receita Federal',  amt: 1100 },
      { kind: 'CSRF', to: 'Receita Federal',  amt: 465 },
      { kind: 'CBS',  to: 'Receita Federal',  amt: 90 },
      { kind: 'IBS',  to: 'Comitê Gestor IBS', amt: 20 }
    ],
    extras: [],
    formaPag: 'PIX',
    contrato: { form: 'Contrato', num: '0037/2026', label: 'PARC · Assessoria técnica · vigência 01/01–31/12/2026', status: 'Ativo' },
    pdf: pdfNFSe
  },

  'DANFE': {
    label: 'DANFE',
    sub: 'Documento Auxiliar da Nota Fiscal Eletrônica',
    desc: 'Produtos / mercadorias — ICMS informativo, IPI e federais retidos',
    glyph: 'NF',
    color: 'teal',
    fiscal: true,
    docId: 'DOC-2026-0091',
    fornecedor: {
      kind: 'PJ',
      name: 'Distribuidora Atlas Ltda',
      docNumber: 'CNPJ 34.829.117/0001-22',
      avatar: 'DA',
      meta: 'Fornecedor recorrente · 14 NFEs em 2026',
      bankBrand: 'I', bankName: 'Itaú Unibanco S.A.',
      bankInfo: '341 · Ag 3492 / CC 78201-5'
    },
    identif: {
      numero: '00091', serie: '1', competencia: '04/2026',
      emissao: '28/04/2026', vencimento: '28/05/2026',
      bruto: 18500, descricao: 'Equipamentos de TI · pedido 4421'
    },
    retencoes: [
      { id: 'ipi',    label: 'IPI (5%)',       value: 925 },
      { id: 'irrf',   label: 'IRRF (1,5%)',    value: 277.50 },
      { id: 'pis',    label: 'PIS (0,65%)',    value: 120.25 },
      { id: 'cofins', label: 'COFINS (3%)',    value: 555 },
      { id: 'csll',   label: 'CSLL (1%)',      value: 185 },
      { id: 'cbs',    label: 'CBS (0,9%)',     value: 166.50 },
      { id: 'ibsest', label: 'IBS Estadual (0,1%)', value: 18.50 }
    ],
    titulos: [
      { kind: 'IPI',  to: 'Receita Federal', amt: 925 },
      { kind: 'IRRF', to: 'Receita Federal', amt: 277.50 },
      { kind: 'CSRF', to: 'Receita Federal', amt: 860.25 },
      { kind: 'CBS',  to: 'Receita Federal', amt: 166.50 },
      { kind: 'IBS',  to: 'Comitê Gestor IBS', amt: 18.50 }
    ],
    extras: [
      { id: 'chaveAcesso', label: 'Chave de Acesso', value: '2304 2608 4291 1200 0122 5500 1000 0910 9114 1234 5670', mono: true, full: true, hint: '44 dígitos · validada na SEFAZ-CE em 28/04/2026' }
    ],
    formaPag: 'Boleto',
    contrato: { form: 'Ordem de Compra', num: 'OC-4421', label: 'Equipamentos de TI · pedido 4421', status: 'Em execução' },
    pdf: pdfDANFE
  },

  'RPA': {
    label: 'RPA',
    sub: 'Recibo de Pagamento Autônomo',
    desc: 'Pessoa física autônoma — INSS, IRRF tabela progressiva, ISS',
    glyph: 'RP',
    color: 'teal',
    fiscal: true,
    docId: 'DOC-2026-RPA-014',
    fornecedor: {
      kind: 'PF',
      name: 'João Mendes da Silva',
      docNumber: 'CPF 142.857.301-95',
      avatar: 'JM',
      meta: 'Autônomo · ISS Fortaleza · profissional liberal',
      bankBrand: 'NU', bankName: 'Nu Pagamentos S.A.',
      bankInfo: '260 · Ag 0001 / CC 9847512-0 · PIX cpf'
    },
    identif: {
      numero: '014/2026', serie: '—', competencia: '05/2026',
      emissao: '08/05/2026', vencimento: '15/05/2026',
      bruto: 3500, descricao: 'Diagramação editorial · projeto Anuário 2026'
    },
    retencoes: [
      { id: 'inss',   label: 'INSS PF (11% / teto)', value: 385 },
      { id: 'irrf',   label: 'IRRF · tabela progr.', value: 174.30 },
      { id: 'iss',    label: 'ISS (5%)',             value: 175 },
      { id: 'ibsmun', label: 'IBS Municipal (0,1%)', value: 3.50, hint: 'Reforma Tributária · vigência teste' }
    ],
    titulos: [
      { kind: 'ISS',  to: 'SEFIN Fortaleza', amt: 175 },
      { kind: 'INSS', to: 'Receita Federal', amt: 385 },
      { kind: 'IRRF', to: 'Receita Federal', amt: 174.30 },
      { kind: 'IBS',  to: 'Comitê Gestor IBS', amt: 3.50 }
    ],
    extras: [],
    formaPag: 'PIX',
    contrato: { form: 'Ordem de Serviço', num: 'OS-014/2026', label: 'Diagramação editorial · projeto Anuário 2026', status: 'Ativo' },
    pdf: pdfRPA
  },

  'Fatura': {
    label: 'Fatura',
    sub: 'Fatura comercial',
    desc: 'Cobrança comercial — retenções condicionais (opt-in)',
    glyph: 'FT',
    color: 'gray',
    fiscal: 'partial',
    docId: 'DOC-2026-FT-329',
    fornecedor: {
      kind: 'PJ',
      name: 'Cloud Brasil Hosting S.A.',
      docNumber: 'CNPJ 19.847.220/0001-08',
      avatar: 'CB',
      meta: 'Serviço recorrente · mensal',
      bankBrand: 'BB', bankName: 'Banco do Brasil',
      bankInfo: '001 · Ag 1582-3 / CC 28491-7'
    },
    identif: {
      numero: '329', serie: '—', competencia: '05/2026',
      emissao: '01/05/2026', vencimento: '20/05/2026',
      bruto: 2480, descricao: 'Hospedagem em nuvem · plano Business · maio/2026'
    },
    retencoes: [],
    titulos: [],
    extras: [],
    formaPag: 'PIX',
    contrato: { form: 'Contrato', num: '0018/2024', label: 'Infraestrutura de TI · renovação anual', status: 'Ativo' },
    pdf: pdfFatura
  },

  'Boleto': {
    label: 'Boleto',
    sub: 'Boleto bancário',
    desc: 'Pagamento com código de barras — sem retenções',
    glyph: 'BL',
    color: 'gray',
    fiscal: false,
    docId: 'DOC-2026-BL-552',
    fornecedor: {
      kind: 'PJ',
      name: 'Imóveis Centro Ltda',
      docNumber: 'CNPJ 27.482.913/0001-66',
      avatar: 'IC',
      meta: 'Locador · aluguel comercial',
      bankBrand: 'B', bankName: 'Bradesco S.A.',
      bankInfo: '237 · Ag 0298 / CC 12490-7'
    },
    identif: {
      numero: '552', serie: '—', competencia: '05/2026',
      emissao: '05/05/2026', vencimento: '15/05/2026',
      bruto: 4850, descricao: 'Aluguel sala 1402 · maio/2026'
    },
    retencoes: [],
    titulos: [],
    extras: [
      { id: 'codBarras', label: 'Linha digitável', value: '23793.39001 60000.123456 78901.234567 8 98760000485000', mono: true, full: true }
    ],
    formaPag: 'Boleto',
    contrato: { form: 'Termo de Quitação', num: 'TQ-552', label: 'Aluguel sala 1402 · maio/2026', status: 'A vencer' },
    pdf: pdfBoleto
  },

  'Recibo': {
    label: 'Recibo',
    sub: 'Recibo simples',
    desc: 'Lançamento manual sem aderência fiscal',
    glyph: 'RC',
    color: 'gray',
    fiscal: false,
    docId: 'DOC-2026-RC-018',
    fornecedor: {
      kind: 'PJ',
      name: 'Auto Posto Líder',
      docNumber: 'CNPJ 09.473.182/0001-30',
      avatar: 'AL',
      meta: 'Despesa eventual',
      bankBrand: 'S', bankName: 'Santander S.A.',
      bankInfo: '033 · Ag 4193 / CC 01094825-3'
    },
    identif: {
      numero: '018', serie: '—', competencia: '05/2026',
      emissao: '09/05/2026', vencimento: '09/05/2026',
      bruto: 287.50, descricao: 'Combustível · frota viatura A'
    },
    retencoes: [],
    titulos: [],
    extras: [],
    formaPag: 'PIX',
    contrato: { form: 'Sem Contrato', num: '', label: 'Despesa avulsa', status: 'Livre' },
    pdf: pdfRecibo
  },

  'Guia': {
    label: 'Guia',
    sub: 'Guia de Recolhimento (DARF · GPS)',
    desc: 'Recolhimento de tributo já apurado — sem retenções',
    glyph: 'GD',
    color: 'amber',
    fiscal: false,
    docId: 'DOC-2026-GD-DARF-220',
    fornecedor: {
      kind: 'PJ',
      name: 'Receita Federal do Brasil',
      docNumber: 'Órgão federal',
      avatar: 'RF',
      meta: 'Recolhimento de tributo retido em ciclo anterior',
      bankBrand: 'BB', bankName: 'Banco do Brasil',
      bankInfo: '001 · DARF · código 1708'
    },
    identif: {
      numero: 'DARF 1708', serie: '—', competencia: '04/2026',
      emissao: '01/05/2026', vencimento: '20/05/2026',
      bruto: 1567.55, descricao: 'IRRF · período de apuração abr/2026'
    },
    retencoes: [],
    titulos: [],
    extras: [
      { id: 'codReceita', label: 'Código de Receita', value: '1708 — IRRF · Remuneração de Serviços' },
      { id: 'periodoApu', label: 'Período de Apuração', value: '04/2026' }
    ],
    formaPag: 'TED',
    contrato: { form: 'Sem Contrato', num: '', label: 'Recolhimento tributário avulso', status: 'Livre' },
    pdf: pdfGuia
  },

  'Outro': {
    label: 'Outro',
    sub: 'Outro documento (livre)',
    desc: 'Tipo não-padrão — preenchimento totalmente manual',
    glyph: '?',
    color: 'gray',
    fiscal: false,
    docId: 'DOC-2026-XX-001',
    fornecedor: {
      kind: 'PJ',
      name: 'Selecione um fornecedor…',
      docNumber: '—',
      avatar: '?',
      meta: 'preencha manualmente',
      bankBrand: '?', bankName: '—',
      bankInfo: '—'
    },
    identif: {
      numero: '', serie: '—', competencia: '—',
      emissao: '', vencimento: '',
      bruto: 0, descricao: ''
    },
    retencoes: [],
    titulos: [],
    extras: [],
    formaPag: 'PIX',
    contrato: { form: 'Sem Contrato', num: '', label: 'Documento manual', status: 'Livre' },
    pdf: pdfOutro
  }
};

/* ═════ PDF Templates ═════ */
const PDF_BG = {
  teal:  'var(--paper)',
  amber: 'var(--paper)',
  gray:  'var(--paper)'
};

function brl(n) {
  return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function pdfNFSe(t) {
  return `
    <div class="pdf-head">
      <div class="seal">SF</div>
      <div>
        <h2>Nota Fiscal de Serviço Eletrônica</h2>
        <div class="pdf-sub">Prefeitura Municipal de Fortaleza · SEFIN</div>
      </div>
      <div class="pdf-num"><div>Número</div><strong>${t.identif.numero}</strong><div>Série ${t.identif.serie}</div></div>
    </div>
    <div class="pdf-section">
      <div class="pdf-section-title">Prestador de Serviços</div>
      <div class="pdf-row" data-pdf="prestador-nome"><span class="k">Razão Social</span><span class="v">${t.fornecedor.name}</span></div>
      <div class="pdf-row" data-pdf="prestador-cnpj"><span class="k">${t.fornecedor.docNumber.split(' ')[0]}</span><span class="v">${t.fornecedor.docNumber.replace(/^[A-Z]+\s/, '')}</span></div>
      <div class="pdf-row"><span class="k">Endereço</span><span class="v">Av. Antônio Sales, 1854 · Fortaleza/CE</span></div>
    </div>
    <div class="pdf-section">
      <div class="pdf-section-title">Tomador</div>
      <div class="pdf-row"><span class="k">Razão Social</span><span class="v">Bem Comum Tecnologia S/A</span></div>
      <div class="pdf-row"><span class="k">CNPJ</span><span class="v">48.295.610/0001-44</span></div>
    </div>
    <div class="pdf-section">
      <div class="pdf-section-title">Discriminação do Serviço</div>
      <table class="pdf-table"><thead><tr><th>Item</th><th>Descrição</th><th class="right">Valor (R$)</th></tr></thead><tbody>
        <tr><td>1.</td><td data-pdf="descricao">${t.identif.descricao}</td><td class="right" data-pdf="valor-bruto">${brl(t.identif.bruto)}</td></tr>
      </tbody></table>
    </div>
    <div class="pdf-section">
      <div class="pdf-section-title">Datas e Identificação</div>
      <div class="pdf-row" data-pdf="emissao"><span class="k">Emissão</span><span class="v">${t.identif.emissao}</span></div>
      <div class="pdf-row"><span class="k">Competência</span><span class="v">${t.identif.competencia}</span></div>
      <div class="pdf-row"><span class="k">Local Prestação</span><span class="v">Fortaleza / CE</span></div>
      <div class="pdf-row"><span class="k">Cód. Serviço</span><span class="v">01.05 — Consultoria em TI</span></div>
    </div>
    <div class="pdf-section">
      <div class="pdf-section-title">Retenções</div>
      <table class="pdf-table"><tbody>
        ${t.retencoes.map(r => `<tr><td data-pdf="${r.id}-label">${r.label.replace(/\([^)]+\)/, '')}<strong style="font-weight:600;">${(r.label.match(/\(([^)]+)\)/)||['',''])[1] && '('+r.label.match(/\(([^)]+)\)/)[1]+')'}</strong></td><td class="right" data-pdf="${r.id}-valor">${brl(r.value)}</td></tr>`).join('')}
      </tbody></table>
    </div>
    ${pdfTotals(t)}
    <div class="pdf-section" style="margin-top: 16px;">
      <div class="pdf-section-title">Vencimento</div>
      <div class="pdf-row" data-pdf="venc"><span class="k">Vence em</span><span class="v">${t.identif.vencimento}</span></div>
    </div>
  `;
}

function pdfDANFE(t) {
  return `
    <div class="pdf-head">
      <div class="seal">NF</div>
      <div>
        <h2>DANFE · NF-e</h2>
        <div class="pdf-sub">Documento Auxiliar da NFe — SEFAZ</div>
      </div>
      <div class="pdf-num"><div>Número</div><strong>${t.identif.numero}</strong><div>Série ${t.identif.serie}</div></div>
    </div>
    <div class="pdf-section">
      <div class="pdf-section-title">Emitente</div>
      <div class="pdf-row" data-pdf="prestador-nome"><span class="k">Razão Social</span><span class="v">${t.fornecedor.name}</span></div>
      <div class="pdf-row" data-pdf="prestador-cnpj"><span class="k">CNPJ</span><span class="v">${t.fornecedor.docNumber.replace(/^[A-Z]+\s/, '')}</span></div>
      <div class="pdf-row"><span class="k">IE</span><span class="v">06.123.487-9 · CE</span></div>
    </div>
    <div class="pdf-section">
      <div class="pdf-section-title">Destinatário</div>
      <div class="pdf-row"><span class="k">Razão Social</span><span class="v">Bem Comum Tecnologia S/A</span></div>
      <div class="pdf-row"><span class="k">CNPJ</span><span class="v">48.295.610/0001-44</span></div>
    </div>
    <div class="pdf-section">
      <div class="pdf-section-title">Itens da Nota</div>
      <table class="pdf-table"><thead><tr><th>NCM</th><th>Descrição</th><th class="right">Qtd</th><th class="right">Valor</th></tr></thead><tbody>
        <tr><td>8471.30</td><td data-pdf="descricao">Notebook corporativo i7 16GB SSD512</td><td class="right">5</td><td class="right" data-pdf="valor-bruto">${brl(t.identif.bruto)}</td></tr>
      </tbody></table>
    </div>
    <div class="pdf-section">
      <div class="pdf-section-title">Datas e ICMS</div>
      <div class="pdf-row" data-pdf="emissao"><span class="k">Emissão</span><span class="v">${t.identif.emissao}</span></div>
      <div class="pdf-row"><span class="k">CFOP</span><span class="v">5101 — Venda</span></div>
      <div class="pdf-row"><span class="k">ICMS (12% · informativo)</span><span class="v">R$ 2.220,00</span></div>
      <div class="pdf-row" data-pdf="chave"><span class="k">Chave de Acesso</span><span class="v" style="font-family:'JetBrains Mono',monospace;font-size:9px;">2304 2608 4291 1200 0122 5500 1000 0910 9114 1234 5670</span></div>
    </div>
    <div class="pdf-section">
      <div class="pdf-section-title">Retenções Federais</div>
      <table class="pdf-table"><tbody>
        ${t.retencoes.map(r => `<tr><td data-pdf="${r.id}-label">${r.label}</td><td class="right" data-pdf="${r.id}-valor">${brl(r.value)}</td></tr>`).join('')}
      </tbody></table>
    </div>
    ${pdfTotals(t)}
    <div class="pdf-section" style="margin-top: 16px;">
      <div class="pdf-section-title">Vencimento (boleto)</div>
      <div class="pdf-row" data-pdf="venc"><span class="k">Vence em</span><span class="v">${t.identif.vencimento}</span></div>
    </div>
  `;
}

function pdfRPA(t) {
  return `
    <div class="pdf-head" style="border-bottom-color: var(--ink-3);">
      <div class="seal" style="background: var(--paper-warm);">RP</div>
      <div>
        <h2>Recibo de Pagamento a Autônomo</h2>
        <div class="pdf-sub">Pessoa Física · ISS Fortaleza</div>
      </div>
      <div class="pdf-num"><div>RPA Nº</div><strong>${t.identif.numero}</strong></div>
    </div>
    <div class="pdf-section">
      <div class="pdf-section-title">Beneficiário (Pessoa Física)</div>
      <div class="pdf-row" data-pdf="prestador-nome"><span class="k">Nome completo</span><span class="v">${t.fornecedor.name}</span></div>
      <div class="pdf-row" data-pdf="prestador-cnpj"><span class="k">CPF</span><span class="v">${t.fornecedor.docNumber.replace(/^[A-Z]+\s/, '')}</span></div>
      <div class="pdf-row"><span class="k">PIS/NIT</span><span class="v">128.4729.4920-3</span></div>
      <div class="pdf-row"><span class="k">Profissão</span><span class="v">Designer Gráfico — Autônomo</span></div>
    </div>
    <div class="pdf-section">
      <div class="pdf-section-title">Pagador</div>
      <div class="pdf-row"><span class="k">Razão Social</span><span class="v">Bem Comum Tecnologia S/A</span></div>
      <div class="pdf-row"><span class="k">CNPJ</span><span class="v">48.295.610/0001-44</span></div>
    </div>
    <div class="pdf-section">
      <div class="pdf-section-title">Serviço Prestado</div>
      <div class="pdf-row" data-pdf="descricao"><span class="k">Descrição</span><span class="v">${t.identif.descricao}</span></div>
      <div class="pdf-row"><span class="k">Período</span><span class="v">01/05/2026 a 07/05/2026</span></div>
      <div class="pdf-row" data-pdf="emissao"><span class="k">Data emissão</span><span class="v">${t.identif.emissao}</span></div>
      <div class="pdf-row" data-pdf="valor-bruto"><span class="k">Valor Bruto</span><span class="v">R$ ${brl(t.identif.bruto)}</span></div>
    </div>
    <div class="pdf-section">
      <div class="pdf-section-title">Retenções de Pessoa Física</div>
      <table class="pdf-table"><tbody>
        ${t.retencoes.map(r => `<tr><td data-pdf="${r.id}-label">${r.label}</td><td class="right" data-pdf="${r.id}-valor">${brl(r.value)}</td></tr>`).join('')}
      </tbody></table>
    </div>
    ${pdfTotals(t)}
    <div class="pdf-section" style="margin-top: 14px;">
      <div class="pdf-section-title">Declaração</div>
      <p style="font-size: 10px; color: var(--ink-3); line-height: 1.5; margin: 4px 0 0; font-style: italic;">Declaro ter recebido a importância líquida acima discriminada, dando plena e geral quitação do serviço prestado.</p>
      <div style="margin-top: 14px; border-top: 1px solid var(--ink-2); padding-top: 4px; width: 200px; font-size: 9px; color: var(--ink-5); text-align: center;">${t.fornecedor.name}</div>
    </div>
  `;
}

function pdfFatura(t) {
  return `
    <div class="pdf-head" style="border-bottom-color: var(--ink-3);">
      <div class="seal" style="background: var(--paper-warm);">FT</div>
      <div>
        <h2>Fatura Comercial</h2>
        <div class="pdf-sub">${t.fornecedor.name}</div>
      </div>
      <div class="pdf-num"><div>Fatura Nº</div><strong>${t.identif.numero}</strong></div>
    </div>
    <div class="pdf-section">
      <div class="pdf-section-title">Cliente</div>
      <div class="pdf-row"><span class="k">Razão Social</span><span class="v">Bem Comum Tecnologia S/A</span></div>
      <div class="pdf-row"><span class="k">CNPJ</span><span class="v">48.295.610/0001-44</span></div>
    </div>
    <div class="pdf-section">
      <div class="pdf-section-title">Cobrança</div>
      <table class="pdf-table"><thead><tr><th>Descrição</th><th class="right">Valor</th></tr></thead><tbody>
        <tr><td data-pdf="descricao">${t.identif.descricao}</td><td class="right" data-pdf="valor-bruto">${brl(t.identif.bruto)}</td></tr>
      </tbody></table>
    </div>
    <div class="pdf-section">
      <div class="pdf-section-title">Datas</div>
      <div class="pdf-row" data-pdf="emissao"><span class="k">Emissão</span><span class="v">${t.identif.emissao}</span></div>
      <div class="pdf-row" data-pdf="venc"><span class="k">Vencimento</span><span class="v">${t.identif.vencimento}</span></div>
    </div>
    ${pdfTotals(t)}
    <div class="pdf-section" style="margin-top: 16px;">
      <div class="pdf-section-title">Forma de pagamento sugerida</div>
      <div class="pdf-row"><span class="k">PIX</span><span class="v" style="font-family:'JetBrains Mono',monospace;font-size:10px;">${t.fornecedor.docNumber.replace(/^[A-Z]+\s/, '')}</span></div>
    </div>
  `;
}

function pdfBoleto(t) {
  return `
    <div class="pdf-head" style="border-bottom-color: var(--ink-1);">
      <div class="seal" style="background: var(--paper-beige); border-radius: 4px; font-size: 11px;">237</div>
      <div>
        <h2>Boleto Bancário</h2>
        <div class="pdf-sub">Bradesco S.A. · agência ${t.identif.numero}</div>
      </div>
      <div class="pdf-num"><div>Vencimento</div><strong>${t.identif.vencimento}</strong></div>
    </div>
    <div class="pdf-section">
      <div class="pdf-section-title">Beneficiário</div>
      <div class="pdf-row" data-pdf="prestador-nome"><span class="k">Nome</span><span class="v">${t.fornecedor.name}</span></div>
      <div class="pdf-row" data-pdf="prestador-cnpj"><span class="k">CNPJ</span><span class="v">${t.fornecedor.docNumber.replace(/^[A-Z]+\s/, '')}</span></div>
      <div class="pdf-row"><span class="k">Agência/Conta</span><span class="v">0298 / 12490-7</span></div>
    </div>
    <div class="pdf-section">
      <div class="pdf-section-title">Pagador</div>
      <div class="pdf-row"><span class="k">Nome</span><span class="v">Bem Comum Tecnologia S/A</span></div>
      <div class="pdf-row"><span class="k">CNPJ</span><span class="v">48.295.610/0001-44</span></div>
    </div>
    <div class="pdf-section">
      <div class="pdf-section-title">Documento</div>
      <div class="pdf-row" data-pdf="descricao"><span class="k">Descrição</span><span class="v">${t.identif.descricao}</span></div>
      <div class="pdf-row" data-pdf="emissao"><span class="k">Emissão</span><span class="v">${t.identif.emissao}</span></div>
      <div class="pdf-row" data-pdf="venc"><span class="k">Vencimento</span><span class="v" style="font-weight:600;">${t.identif.vencimento}</span></div>
      <div class="pdf-row" data-pdf="valor-bruto"><span class="k">Valor do documento</span><span class="v" style="font-weight:700; color: var(--ink-1);">R$ ${brl(t.identif.bruto)}</span></div>
    </div>
    <div class="pdf-section">
      <div class="pdf-section-title">Instruções</div>
      <p style="font-size:10px; color: var(--ink-3); margin: 4px 0 0; line-height: 1.5;">Não receber após o vencimento. Multa de 2% e juros de 1% ao mês.</p>
    </div>
    <div style="margin-top: 18px; padding: 12px 0; border-top: 1px solid var(--ink-1); border-bottom: 1px solid var(--ink-1);">
      <div style="font-size: 8.5px; color: var(--ink-5); margin-bottom: 6px;">LINHA DIGITÁVEL</div>
      <div style="font-family: 'JetBrains Mono', monospace; font-weight: 600; font-size: 11.5px; letter-spacing: 0.5px; color: var(--ink-1);">23793.39001 60000.123456 78901.234567 8 98760000485000</div>
      <div style="margin-top: 10px; height: 36px; background: repeating-linear-gradient(90deg, var(--ink-1), var(--ink-1) 2px, transparent 2px, transparent 5px, var(--ink-1) 5px, var(--ink-1) 8px, transparent 8px, transparent 11px, var(--ink-1) 11px, var(--ink-1) 13px, transparent 13px, transparent 14px); width: 100%;"></div>
    </div>
  `;
}

function pdfRecibo(t) {
  return `
    <div class="pdf-head" style="border-bottom-color: var(--ink-3);">
      <div class="seal" style="background: var(--paper-warm);">RC</div>
      <div>
        <h2>Recibo</h2>
        <div class="pdf-sub">Documento simples · não fiscal</div>
      </div>
      <div class="pdf-num"><div>Nº</div><strong>${t.identif.numero}</strong></div>
    </div>
    <div class="pdf-section" style="margin-top: 24px;">
      <p style="font-size: 11px; line-height: 1.7; color: var(--ink-2); margin: 0;">
        Recebi de <strong>Bem Comum Tecnologia S/A</strong>, CNPJ 48.295.610/0001-44,
        a importância de <strong data-pdf="valor-bruto">R$ ${brl(t.identif.bruto)}</strong>
        referente a <strong data-pdf="descricao">${t.identif.descricao}</strong>,
        dando plena e total quitação.
      </p>
    </div>
    <div class="pdf-section">
      <div class="pdf-section-title">Emitido por</div>
      <div class="pdf-row" data-pdf="prestador-nome"><span class="k">Nome</span><span class="v">${t.fornecedor.name}</span></div>
      <div class="pdf-row" data-pdf="prestador-cnpj"><span class="k">CNPJ</span><span class="v">${t.fornecedor.docNumber.replace(/^[A-Z]+\s/, '')}</span></div>
      <div class="pdf-row" data-pdf="emissao"><span class="k">Data</span><span class="v">${t.identif.emissao}</span></div>
    </div>
    <div style="margin-top: 40px; border-top: 1px solid var(--ink-2); padding-top: 4px; width: 240px; margin-left: auto; margin-right: auto; font-size: 10px; color: var(--ink-5); text-align: center;">${t.fornecedor.name}</div>
  `;
}

function pdfGuia(t) {
  return `
    <div class="pdf-head" style="border-bottom-color: var(--ink-1);">
      <div class="seal" style="background: rgb(255, 235, 178); color: var(--amber-deep);">RF</div>
      <div>
        <h2>DARF · Documento de Arrecadação</h2>
        <div class="pdf-sub">Ministério da Fazenda · Receita Federal do Brasil</div>
      </div>
      <div class="pdf-num"><div>Código de Receita</div><strong>1708</strong></div>
    </div>
    <div class="pdf-section">
      <div class="pdf-section-title">Contribuinte</div>
      <div class="pdf-row" data-pdf="prestador-nome"><span class="k">Razão Social</span><span class="v">Bem Comum Tecnologia S/A</span></div>
      <div class="pdf-row" data-pdf="prestador-cnpj"><span class="k">CNPJ</span><span class="v">48.295.610/0001-44</span></div>
    </div>
    <div class="pdf-section">
      <div class="pdf-section-title">Apuração</div>
      <div class="pdf-row"><span class="k">Código da Receita</span><span class="v"><strong>1708</strong> — IRRF · Remuneração de Serviços</span></div>
      <div class="pdf-row"><span class="k">Período de Apuração</span><span class="v">04/2026</span></div>
      <div class="pdf-row" data-pdf="emissao"><span class="k">Data emissão</span><span class="v">${t.identif.emissao}</span></div>
      <div class="pdf-row" data-pdf="venc"><span class="k">Data Vencimento</span><span class="v" style="font-weight:600; color: rgb(168,47,36);">${t.identif.vencimento}</span></div>
    </div>
    <div class="pdf-section">
      <div class="pdf-section-title">Valores</div>
      <div class="pdf-row" data-pdf="valor-bruto"><span class="k">Valor do Principal</span><span class="v" style="font-weight:600;">R$ ${brl(t.identif.bruto)}</span></div>
      <div class="pdf-row"><span class="k">Multa</span><span class="v">R$ 0,00</span></div>
      <div class="pdf-row"><span class="k">Juros / Encargos</span><span class="v">R$ 0,00</span></div>
      <div class="pdf-row" style="border-top: 1px solid var(--ink-1); margin-top: 6px; padding-top: 6px;"><span class="k" style="font-weight: 600; color: var(--ink-1);">Total a Recolher</span><span class="v" style="font-weight: 700; color: var(--ink-1);">R$ ${brl(t.identif.bruto)}</span></div>
    </div>
    <div style="margin-top: 18px; padding: 10px 14px; background: rgb(255, 247, 224); border-left: 3px solid var(--amber); border-radius: 4px; font-size: 10.5px; color: var(--ink-3); line-height: 1.5;">
      <strong>Atenção:</strong> recolhimento de tributo já retido em ciclo anterior. Não gera retenções adicionais.
    </div>
  `;
}

function pdfOutro(t) {
  return `
    <div class="pdf-head" style="border-bottom-color: var(--ink-3); border-bottom-style: dashed;">
      <div class="seal" style="background: var(--paper-beige); color: var(--ink-5);">?</div>
      <div>
        <h2 style="color: var(--ink-4);">Documento não-padrão</h2>
        <div class="pdf-sub">Arraste o arquivo (PDF/XML) sobre este painel</div>
      </div>
    </div>
    <div style="height: 380px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px; color: var(--ink-5);">
      <div style="font-size: 48px; opacity: 0.4;">⤴</div>
      <p style="font-size: 12px; color: var(--ink-4); text-align: center; max-width: 240px; line-height: 1.6; margin: 0;">
        Sem documento de origem para conferir. Preencha os campos manualmente — o sistema não validará alíquotas automáticas para este tipo.
      </p>
      <button class="btn btn-secondary" style="margin-top: 8px;">Selecionar arquivo</button>
    </div>
  `;
}

function pdfTotals(t) {
  const ret = t.retencoes.reduce((sum, r) => sum + r.value, 0);
  const liq = t.identif.bruto - ret;
  if (!t.fiscal || ret === 0) {
    return `
      <div class="pdf-totals">
        <div class="line net"><span class="k">Total</span><span class="v">R$ ${brl(t.identif.bruto)}</span></div>
      </div>`;
  }
  return `
    <div class="pdf-totals">
      <div class="line"><span class="k">Valor Bruto</span><span class="v">R$ ${brl(t.identif.bruto)}</span></div>
      <div class="line"><span class="k">(-) Retenções</span><span class="v">R$ ${brl(ret)}</span></div>
      <div class="line net"><span class="k">Valor Líquido</span><span class="v">R$ ${brl(liq)}</span></div>
    </div>`;
}

window.DOC_TYPES = DOC_TYPES;
window.brl = brl;
