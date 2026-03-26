/**
 * DOCUMENTS PAGE MODULE
 * Gerencia recibos, contratos e histórico de documentos
 */

(function() {
    'use strict';
    
    // ============================================
    // ESTADO
    // ============================================
    let appState = null;
    let documents = [];
    let budgets = [];
    let clients = [];
    
    // ============================================
    // FUNÇÕES AUXILIARES
    // ============================================
    
    function getCurrentUserId() {
        return localStorage.getItem('dbp_last_user');
    }
    
    function loadAppState() {
        const userId = getCurrentUserId();
        if (!userId) return null;
        try {
            const key = `dbp_user_${userId}`;
            const s = localStorage.getItem(key);
            return s ? JSON.parse(s) : { settings: {}, clients: [], budgets: [], services: [] };
        } catch(e) { 
            console.warn('Erro ao carregar estado:', e);
            return null; 
        }
    }
    
    function loadDocuments() {
        try {
            const userId = getCurrentUserId();
            return JSON.parse(localStorage.getItem(`dbp_documents_${userId}`) || '[]');
        } catch(e) { 
            return []; 
        }
    }
    
    function saveDocuments() {
        const userId = getCurrentUserId();
        localStorage.setItem(`dbp_documents_${userId}`, JSON.stringify(documents));
    }
    
    function generateDocNumber(type, budgetNumber) {
        const prefix = type === 'receipt' ? 'REC' : 'CTR';
        if (budgetNumber) {
            const numberPart = budgetNumber.replace(/^ORC-/, '');
            return `${prefix}-${numberPart}`;
        }
        const year = new Date().getFullYear();
        const existing = documents.filter(d => d.type === type && d.number?.startsWith(`${prefix}-${year}`));
        const next = existing.length + 1;
        return `${prefix}-${year}-${String(next).padStart(4, '0')}`;
    }
    
    function populateSelects() {
        const recBudgetSelect = document.getElementById('rec-budget-select');
        const ctrBudgetSelect = document.getElementById('ctr-budget-select');
        const budgetOptions = budgets.map(b => `<option value="${b.id}" data-doc-number="${b.docNumber || ''}">${b.docNumber || 'ORC-' + b.id} - ${b.clientName} - R$ ${(b.total || 0).toFixed(2)}</option>`).join('');
        
        if (recBudgetSelect) recBudgetSelect.innerHTML = `<option value="">Selecione um orçamento</option>${budgetOptions}`;
        if (ctrBudgetSelect) ctrBudgetSelect.innerHTML = `<option value="">Selecione um orçamento</option>${budgetOptions}`;
        
        const recClientSelect = document.getElementById('rec-client-select');
        const ctrClientSelect = document.getElementById('ctr-client-select');
        const clientOptions = clients.map(c => `<option value="${c.id}">${c.name}${c.company ? ' - ' + c.company : ''}</option>`).join('');
        
        if (recClientSelect) recClientSelect.innerHTML = `<option value="">Selecione um cliente</option>${clientOptions}`;
        if (ctrClientSelect) ctrClientSelect.innerHTML = `<option value="">Selecione um cliente</option>${clientOptions}`;
    }
    
    function loadProviderData() {
        const s = appState?.settings || {};
        const p = s.profile || {};
        
        const providerName = document.getElementById('ctr-provider-name');
        const providerEmail = document.getElementById('ctr-provider-email');
        const providerDoc = document.getElementById('ctr-provider-doc');
        const providerAddress = document.getElementById('ctr-provider-address');
        
        if (providerName) providerName.value = s.name || '';
        if (providerEmail) providerEmail.value = s.email || '';
        if (providerDoc) providerDoc.value = p.document || '';
        if (providerAddress) providerAddress.value = p.address || '';
    }
    
    // ============================================
    // LOAD FUNCTIONS
    // ============================================
    
    window.loadBudgetToReceipt = function() {
        const select = document.getElementById('rec-budget-select');
        const budgetId = parseInt(select?.value);
        const budget = budgets.find(b => b.id === budgetId);
        if (!budget) return;
        
        const recNumber = document.getElementById('rec-number');
        const recPayerName = document.getElementById('rec-payer-name');
        const recService = document.getElementById('rec-service');
        const recValue = document.getElementById('rec-value');
        const recNotes = document.getElementById('rec-notes');
        
        if (recNumber) recNumber.value = generateDocNumber('receipt', budget.docNumber || '');
        if (recPayerName) recPayerName.value = budget.clientName || '';
        
        const servicesText = (budget.services || []).map(s => { 
            const price = s.customPrice !== null ? s.customPrice : s.price; 
            const qty = s.qty || 1; 
            return `${s.name} x${qty} - R$ ${(price * qty).toFixed(2)}`; 
        }).join('\n');
        
        if (recService) recService.value = servicesText || 'Serviços de design conforme orçamento';
        if (recValue) recValue.value = budget.total || 0;
        
        if (budget.paymentTerms) {
            const terms = budget.paymentTerms.toLowerCase();
            const paymentMethod = document.getElementById('rec-payment-method');
            if (paymentMethod) {
                if (terms.includes('pix')) paymentMethod.value = 'PIX';
                else if (terms.includes('transferência')) paymentMethod.value = 'Transferência Bancária';
            }
        }
        
        if (recNotes && budget.notes) recNotes.value = budget.notes;
        window.updateReceiptPreview();
        Utils.toast.success('Dados carregados do orçamento!');
    };
    
    window.loadBudgetToContract = function() {
        const select = document.getElementById('ctr-budget-select');
        const budgetId = parseInt(select?.value);
        const budget = budgets.find(b => b.id === budgetId);
        if (!budget) return;
        
        const ctrNumber = document.getElementById('ctr-number');
        const ctrClientName = document.getElementById('ctr-client-name');
        const ctrValue = document.getElementById('ctr-value');
        const ctrPaymentTerms = document.getElementById('ctr-payment-terms');
        const ctrDeadline = document.getElementById('ctr-deadline');
        const ctrObject = document.getElementById('ctr-object');
        const ctrServicesText = document.getElementById('ctr-services-text');
        const ctrExtraClauses = document.getElementById('ctr-extra-clauses');
        
        if (ctrNumber) ctrNumber.value = generateDocNumber('contract', budget.docNumber || '');
        if (ctrClientName) ctrClientName.value = budget.clientName || '';
        if (ctrValue) ctrValue.value = budget.total || 0;
        if (ctrPaymentTerms && budget.paymentTerms) ctrPaymentTerms.value = budget.paymentTerms;
        if (ctrDeadline && budget.deadline) ctrDeadline.value = `${budget.deadline} dias úteis após assinatura`;
        
        const projectName = budget.projectName || 'projeto de design';
        const servicesList = (budget.services || []).map(s => { 
            const price = s.customPrice !== null ? s.customPrice : s.price; 
            const qty = s.qty || 1; 
            return `• ${s.name} (${qty}x) - R$ ${(price * qty).toFixed(2)}`; 
        }).join('\n');
        
        if (ctrObject) ctrObject.value = `Prestação de serviços de design para ${projectName}, conforme detalhado abaixo:\n\n${servicesList}`;
        if (ctrServicesText) ctrServicesText.value = (budget.services || []).map(s => s.name).join('\n');
        if (ctrExtraClauses && budget.notes) ctrExtraClauses.value = budget.notes;
        
        window.updateContractPreview();
        Utils.toast.success('Dados carregados do orçamento!');
    };
    
    window.loadClientToReceipt = function() {
        const select = document.getElementById('rec-client-select');
        const clientId = parseInt(select?.value);
        const client = clients.find(c => c.id === clientId);
        if (!client) return;
        
        const payerName = document.getElementById('rec-payer-name');
        const payerDoc = document.getElementById('rec-payer-doc');
        
        if (payerName) payerName.value = client.name || '';
        if (payerDoc) payerDoc.value = client.document || '';
        
        window.updateReceiptPreview();
        Utils.toast.success('Dados do cliente carregados!');
    };
    
    window.loadClientToContract = function() {
        const select = document.getElementById('ctr-client-select');
        const clientId = parseInt(select?.value);
        const client = clients.find(c => c.id === clientId);
        if (!client) return;
        
        const clientName = document.getElementById('ctr-client-name');
        const clientDoc = document.getElementById('ctr-client-doc');
        const clientEmail = document.getElementById('ctr-client-email');
        const clientAddress = document.getElementById('ctr-client-address');
        
        if (clientName) clientName.value = client.name || '';
        if (clientDoc) clientDoc.value = client.document || '';
        if (clientEmail) clientEmail.value = client.email || '';
        if (clientAddress) clientAddress.value = client.address || '';
        
        window.updateContractPreview();
        Utils.toast.success('Dados do cliente carregados!');
    };
    
    // ============================================
    // PREVIEW
    // ============================================
    
    window.updateReceiptPreview = function() {
        const primary = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || '#2d8a8a';
        const settings = appState?.settings || {};
        const profile = settings.profile || {};
        
        const num = document.getElementById('rec-number')?.value || '—';
        const date = Utils.formatDate(document.getElementById('rec-date')?.value);
        const payer = document.getElementById('rec-payer-name')?.value || '—';
        const payerDoc = document.getElementById('rec-payer-doc')?.value;
        const service = document.getElementById('rec-service')?.value || '—';
        const value = Utils.formatBRL(document.getElementById('rec-value')?.value);
        const method = document.getElementById('rec-payment-method')?.value || '—';
        const notes = document.getElementById('rec-notes')?.value;
        
        const providerName = settings.name || 'Prestador';
        const providerEmail = settings.email || '';
        const providerPix = profile.pix || '';
        const providerDoc = profile.document || '';
        
        const preview = document.getElementById('receipt-preview');
        if (!preview) return;
        
        preview.innerHTML = `
            <div style="border-top: 4px solid ${primary}; padding-top: 16px;">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:20px;">
                    <div>
                        <h2 style="margin:0; font-size:20px; font-weight:800; color:#000000; letter-spacing:1px;">RECIBO DE PAGAMENTO</h2>
                        <p style="margin:4px 0 0; font-size:11px; color:#000000;">${Utils.escapeHtml(providerName)}${providerEmail ? ' · ' + providerEmail : ''}</p>
                    </div>
                    <div style="text-align:right;">
                        <div style="font-size:10px; color:#000000;">Nº do Documento</div>
                        <div style="font-size:16px; font-weight:700; color:${primary};">${Utils.escapeHtml(num)}</div>
                        <div style="font-size:11px; color:#000000;">Data: ${date}</div>
                    </div>
                </div>
                <div style="background:#f8f9fa; border-radius:8px; padding:14px; margin-bottom:16px;">
                    <div style="font-size:10px; color:#000000; margin-bottom:6px;">Recebido de</div>
                    <div style="font-size:14px; font-weight:600; color:#000000;">${Utils.escapeHtml(payer)}</div>
                    ${payerDoc ? `<div style="font-size:11px; color:#000000; margin-top:2px;">CPF/CNPJ: ${Utils.escapeHtml(payerDoc)}</div>` : ''}
                </div>
                <div style="margin-bottom:16px;">
                    <div style="font-size:10px; color:#000000; margin-bottom:6px;">Referente a</div>
                    <div style="font-size:13px; line-height:1.5; white-space:pre-wrap; color:#000000;">${Utils.escapeHtml(service)}</div>
                </div>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:16px;">
                    <div style="background:${primary}15; border-radius:8px; padding:12px;">
                        <div style="font-size:10px; color:#000000;">Valor Recebido</div>
                        <div style="font-size:18px; font-weight:700; color:${primary};">${value}</div>
                    </div>
                    <div style="background:#f8f9fa; border-radius:8px; padding:12px;">
                        <div style="font-size:10px; color:#000000;">Forma de Pagamento</div>
                        <div style="font-size:13px; font-weight:600; color:#000000;">${Utils.escapeHtml(method)}</div>
                    </div>
                </div>
                ${notes ? `<div style="border-left:3px solid ${primary}; padding-left:12px; margin-bottom:16px; font-size:12px; color:#000000;">${Utils.escapeHtml(notes)}</div>` : ''}
                ${providerDoc || providerPix ? `
                <div style="background:#f8f9fa; border-radius:8px; padding:10px; font-size:11px; color:#000000; margin-bottom:16px;">
                    ${providerDoc ? `<span><strong>CPF/CNPJ:</strong> ${Utils.escapeHtml(providerDoc)}</span>` : ''}
                    ${providerPix ? `<span style="margin-left:16px;"><strong>PIX:</strong> ${Utils.escapeHtml(providerPix)}</span>` : ''}
                </div>
                ` : ''}
                <div style="border-top:1px solid #eee; padding-top:14px; text-align:center;">
                    <div style="display:inline-block; border-top:1px solid #000000; padding-top:6px; min-width:200px;">
                        <div style="font-size:12px; font-weight:600; color:#000000;">${Utils.escapeHtml(providerName)}</div>
                        <div style="font-size:10px; color:#000000;">Assinatura do Prestador</div>
                    </div>
                </div>
            </div>
        `;
    };
    
    window.updateContractPreview = function() {
        const primary = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || '#2d8a8a';
        const num = document.getElementById('ctr-number')?.value || '—';
        const date = Utils.formatDate(document.getElementById('ctr-date')?.value);
        const providerName = document.getElementById('ctr-provider-name')?.value || '—';
        const providerDoc = document.getElementById('ctr-provider-doc')?.value;
        const providerAddress = document.getElementById('ctr-provider-address')?.value;
        const providerEmail = document.getElementById('ctr-provider-email')?.value;
        const clientName = document.getElementById('ctr-client-name')?.value || '—';
        const clientDoc = document.getElementById('ctr-client-doc')?.value;
        const clientAddress = document.getElementById('ctr-client-address')?.value;
        const clientEmail = document.getElementById('ctr-client-email')?.value;
        const object = document.getElementById('ctr-object')?.value || '—';
        const servicesText = document.getElementById('ctr-services-text')?.value;
        const value = Utils.formatBRL(document.getElementById('ctr-value')?.value);
        const paymentTerms = document.getElementById('ctr-payment-terms')?.value || 'A combinar entre as partes';
        const deadline = document.getElementById('ctr-deadline')?.value || 'a ser definido';
        const revisions = document.getElementById('ctr-revisions')?.value || '2';
        const extraClauses = document.getElementById('ctr-extra-clauses')?.value;
        
        const servicesList = servicesText ? 
            servicesText.split('\n').filter(s => s.trim()).map(s => `<li style="margin-bottom: 4px; color:#000000;">${Utils.escapeHtml(s.trim())}</li>`).join('') : 
            '<li>Conforme descrito no objeto acima</li>';
        
        const preview = document.getElementById('contract-preview');
        if (!preview) return;
        
        preview.innerHTML = `
            <div style="font-family:'Georgia',serif; color:#111; font-size:11px; line-height:1.7;">
                <div style="border-bottom:3px solid ${primary}; padding-bottom:12px; margin-bottom:16px;">
                    <h2 style="margin:0; font-size:16px; font-weight:700; color:#000000; text-align:center; letter-spacing:2px; text-transform:uppercase;">CONTRATO DE PRESTAÇÃO DE SERVIÇOS</h2>
                    <p style="text-align:center; color:#000000; font-size:10px; margin:4px 0 0;">Nº ${Utils.escapeHtml(num)} · Data: ${date}</p>
                </div>
                <p style="color:#000000;">Pelo presente instrumento particular, de um lado <strong>CONTRATADO</strong>, e de outro <strong>CONTRATANTE</strong>, têm entre si justo e contratado o seguinte:</p>
                <div style="background:#f8f9fa; border-radius:8px; padding:12px; margin:12px 0;">
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
                        <div>
                            <strong style="color:${primary};">CONTRATADO (PRESTADOR)</strong><br>
                            <span style="color:#000000;">${Utils.escapeHtml(providerName)}</span>
                            ${providerDoc ? `<br><span style="color:#000000;">CPF/CNPJ: ${Utils.escapeHtml(providerDoc)}</span>` : ''}
                            ${providerAddress ? `<br><span style="color:#000000;">End.: ${Utils.escapeHtml(providerAddress)}</span>` : ''}
                            ${providerEmail ? `<br><span style="color:#000000;">E-mail: ${Utils.escapeHtml(providerEmail)}</span>` : ''}
                        </div>
                        <div>
                            <strong style="color:${primary};">CONTRATANTE (CLIENTE)</strong><br>
                            <span style="color:#000000;">${Utils.escapeHtml(clientName)}</span>
                            ${clientDoc ? `<br><span style="color:#000000;">CPF/CNPJ: ${Utils.escapeHtml(clientDoc)}</span>` : ''}
                            ${clientAddress ? `<br><span style="color:#000000;">End.: ${Utils.escapeHtml(clientAddress)}</span>` : ''}
                            ${clientEmail ? `<br><span style="color:#000000;">E-mail: ${Utils.escapeHtml(clientEmail)}</span>` : ''}
                        </div>
                    </div>
                </div>
                <h3 style="color:#000000;">CLÁUSULA 1ª - DO OBJETO</h3>
                <p style="color:#000000;">O CONTRATADO obriga-se a prestar os serviços de design conforme descrição abaixo:</p>
                <div style="background:#f9fafb; padding:12px; border-radius:8px; margin:8px 0;">
                    <p style="margin:0; white-space:pre-wrap; color:#000000;">${Utils.escapeHtml(object)}</p>
                </div>
                <h3 style="color:#000000;">CLÁUSULA 2ª - DOS SERVIÇOS</h3>
                <p style="color:#000000;">Os serviços objeto deste contrato compreendem:</p>
                <ul style="margin:8px 0 8px 20px; color:#000000;">${servicesList}</ul>
                <h3 style="color:#000000;">CLÁUSULA 3ª - DO PRAZO</h3>
                <p style="color:#000000;">O prazo para execução dos serviços será de <strong>${Utils.escapeHtml(deadline)}</strong>.</p>
                <h3 style="color:#000000;">CLÁUSULA 4ª - DO VALOR E PAGAMENTO</h3>
                <p style="color:#000000;">Valor total de <strong>${value}</strong>. Condições: ${Utils.escapeHtml(paymentTerms)}.</p>
                <h3 style="color:#000000;">CLÁUSULA 5ª - DAS REVISÕES</h3>
                <p style="color:#000000;">Inclusas <strong>${Utils.escapeHtml(revisions)} revisão(ões)</strong>.</p>
                <h3 style="color:#000000;">CLÁUSULA 6ª - DOS DIREITOS AUTORAIS</h3>
                <p style="color:#000000;">Transferidos após quitação integral.</p>
                <h3 style="color:#000000;">CLÁUSULA 7ª - DO CANCELAMENTO</h3>
                <p style="color:#000000;">Valores pagos não reembolsáveis em caso de cancelamento pelo contratante.</p>
                ${extraClauses ? `<h3 style="color:#000000;">CLÁUSULAS ADICIONAIS</h3><p style="color:#000000;">${Utils.escapeHtml(extraClauses)}</p>` : ''}
                <h3 style="color:#000000;">CLÁUSULA 8ª - DO FORO</h3>
                <p style="color:#000000;">Foro da comarca do domicílio do CONTRATADO.</p>
                <div style="margin-top:24px; padding-top:16px; border-top:1px solid #eee; display:grid; grid-template-columns:1fr 1fr; gap:24px; text-align:center;">
                    <div>
                        <div style="border-top:1px solid ${primary}; padding-top:6px; margin-top:30px;">
                            <div style="font-weight:600; color:#000000;">${Utils.escapeHtml(providerName)}</div>
                            <div style="color:#000000; font-size:10px;">CONTRATADO</div>
                        </div>
                    </div>
                    <div>
                        <div style="border-top:1px solid ${primary}; padding-top:6px; margin-top:30px;">
                            <div style="font-weight:600; color:#000000;">${Utils.escapeHtml(clientName)}</div>
                            <div style="color:#000000; font-size:10px;">CONTRATANTE</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    };
    
    // ============================================
    // PDF GENERATION
    // ============================================
    
    window.generateReceiptPDF = async function() {
        const receiptData = {
            number: document.getElementById('rec-number')?.value,
            date: document.getElementById('rec-date')?.value,
            payerName: document.getElementById('rec-payer-name')?.value.trim(),
            payerDoc: document.getElementById('rec-payer-doc')?.value,
            service: document.getElementById('rec-service')?.value,
            value: parseFloat(document.getElementById('rec-value')?.value),
            paymentMethod: document.getElementById('rec-payment-method')?.value,
            notes: document.getElementById('rec-notes')?.value
        };
        
        try {
            Utils.toast.info('Gerando PDF...');
            await PDFGenerators.generateReceiptPDF(receiptData, {
                onSuccess: () => Utils.toast.success('PDF gerado com sucesso!'),
                onError: (error) => Utils.toast.error(error.message)
            });
        } catch (error) {
            Utils.toast.error(error.message);
        }
    };
    
    window.generateContractPDF = async function() {
        const contractData = {
            number: document.getElementById('ctr-number')?.value,
            date: document.getElementById('ctr-date')?.value,
            clientName: document.getElementById('ctr-client-name')?.value.trim(),
            clientDoc: document.getElementById('ctr-client-doc')?.value,
            clientAddress: document.getElementById('ctr-client-address')?.value,
            clientEmail: document.getElementById('ctr-client-email')?.value,
            object: document.getElementById('ctr-object')?.value,
            servicesText: document.getElementById('ctr-services-text')?.value,
            value: parseFloat(document.getElementById('ctr-value')?.value),
            paymentTerms: document.getElementById('ctr-payment-terms')?.value,
            deadline: document.getElementById('ctr-deadline')?.value,
            revisions: parseInt(document.getElementById('ctr-revisions')?.value) || 2,
            extraClauses: document.getElementById('ctr-extra-clauses')?.value
        };
        
        try {
            Utils.toast.info('Gerando PDF...');
            await PDFGenerators.generateContractPDF(contractData, {
                onSuccess: () => Utils.toast.success('PDF gerado com sucesso!'),
                onError: (error) => Utils.toast.error(error.message)
            });
        } catch (error) {
            Utils.toast.error(error.message);
        }
    };
    
    // ============================================
    // SAVE FUNCTIONS
    // ============================================
    
    window.saveReceipt = function() {
        const payer = document.getElementById('rec-payer-name')?.value.trim();
        const value = document.getElementById('rec-value')?.value;
        
        if (!payer || !value) { 
            Utils.toast.error('Preencha pagador e valor!'); 
            return; 
        }
        
        const doc = { 
            type: 'receipt', 
            number: document.getElementById('rec-number')?.value, 
            date: document.getElementById('rec-date')?.value, 
            payerName: payer, 
            payerDoc: document.getElementById('rec-payer-doc')?.value, 
            service: document.getElementById('rec-service')?.value, 
            value: parseFloat(value), 
            paymentMethod: document.getElementById('rec-payment-method')?.value, 
            notes: document.getElementById('rec-notes')?.value, 
            createdAt: new Date().toISOString() 
        };
        
        documents.push(doc); 
        saveDocuments(); 
        window.renderHistory();
        Utils.toast.success('Recibo salvo!');
    };
    
    window.saveContract = function() {
        const clientName = document.getElementById('ctr-client-name')?.value.trim();
        const value = document.getElementById('ctr-value')?.value;
        
        if (!clientName || !value) { 
            Utils.toast.error('Preencha cliente e valor!'); 
            return; 
        }
        
        const doc = { 
            type: 'contract', 
            number: document.getElementById('ctr-number')?.value, 
            date: document.getElementById('ctr-date')?.value, 
            clientName, 
            clientDoc: document.getElementById('ctr-client-doc')?.value, 
            clientAddress: document.getElementById('ctr-client-address')?.value, 
            clientEmail: document.getElementById('ctr-client-email')?.value, 
            object: document.getElementById('ctr-object')?.value, 
            servicesText: document.getElementById('ctr-services-text')?.value, 
            value: parseFloat(value), 
            paymentTerms: document.getElementById('ctr-payment-terms')?.value, 
            deadline: document.getElementById('ctr-deadline')?.value, 
            revisions: parseInt(document.getElementById('ctr-revisions')?.value) || 2, 
            extraClauses: document.getElementById('ctr-extra-clauses')?.value, 
            createdAt: new Date().toISOString() 
        };
        
        documents.push(doc); 
        saveDocuments(); 
        window.renderHistory();
        Utils.toast.success('Contrato salvo!');
    };
    
    window.clearReceiptForm = function() {
        if (!confirm('Limpar formulário?')) return;
        
        document.getElementById('rec-budget-select').value = '';
        document.getElementById('rec-client-select').value = '';
        document.getElementById('rec-payer-name').value = '';
        document.getElementById('rec-payer-doc').value = '';
        document.getElementById('rec-service').value = '';
        document.getElementById('rec-value').value = '';
        document.getElementById('rec-notes').value = '';
        document.getElementById('rec-date').value = new Date().toISOString().split('T')[0];
        document.getElementById('rec-number').value = generateDocNumber('receipt', null);
        document.getElementById('rec-payment-method').value = 'PIX';
        
        window.updateReceiptPreview();
        Utils.toast.info('Formulário limpo!');
    };
    
    window.clearContractForm = function() {
        if (!confirm('Limpar formulário?')) return;
        
        document.getElementById('ctr-budget-select').value = '';
        document.getElementById('ctr-client-select').value = '';
        document.getElementById('ctr-client-name').value = '';
        document.getElementById('ctr-client-doc').value = '';
        document.getElementById('ctr-client-address').value = '';
        document.getElementById('ctr-client-email').value = '';
        document.getElementById('ctr-object').value = '';
        document.getElementById('ctr-services-text').value = '';
        document.getElementById('ctr-value').value = '';
        document.getElementById('ctr-payment-terms').value = '';
        document.getElementById('ctr-deadline').value = '';
        document.getElementById('ctr-revisions').value = '2';
        document.getElementById('ctr-extra-clauses').value = '';
        document.getElementById('ctr-date').value = new Date().toISOString().split('T')[0];
        document.getElementById('ctr-number').value = generateDocNumber('contract', null);
        
        window.updateContractPreview();
        Utils.toast.info('Formulário limpo!');
    };
    
    // ============================================
    // HISTORY
    // ============================================
    
    window.renderHistory = function() {
        const filter = document.getElementById('history-filter')?.value || 'all';
        const filtered = filter === 'all' ? documents : documents.filter(d => d.type === filter);
        const list = document.getElementById('history-list');
        const empty = document.getElementById('history-empty');
        
        if (!list) return;
        
        if (filtered.length === 0) { 
            list.innerHTML = ''; 
            if (empty) empty.classList.remove('hidden');
            return; 
        }
        
        if (empty) empty.classList.add('hidden');
        
        list.innerHTML = [...filtered].reverse().map((doc, i) => {
            const isReceipt = doc.type === 'receipt';
            const title = isReceipt ? `Recibo para ${Utils.escapeHtml(doc.payerName || '—')}` : `Contrato com ${Utils.escapeHtml(doc.clientName || '—')}`;
            const subtitle = isReceipt ? Utils.escapeHtml(doc.service?.substring(0, 60) || '—') : Utils.escapeHtml(doc.object?.substring(0, 60) || '—');
            const value = (doc.value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            const date = doc.date || doc.createdAt?.split('T')[0];
            const dateStr = Utils.formatDate(date);
            const idx = documents.length - 1 - i;
            const icon = isReceipt ? 'fa-receipt' : 'fa-file-contract';
            const color = isReceipt ? 'text-emerald-600 bg-emerald-50' : 'text-blue-600 bg-blue-50';
            
            return `
                <div class="doc-item bg-white dark:bg-gray-800 rounded-xl border p-4 flex items-center gap-4">
                    <div class="w-10 h-10 rounded-xl ${color} flex items-center justify-center">
                        <i class="fa-solid ${icon} text-sm"></i>
                    </div>
                    <div class="flex-1">
                        <div class="flex items-center gap-2">
                            <span class="text-sm font-semibold">${title}</span>
                            <span class="text-xs text-gray-400">${Utils.escapeHtml(doc.number || '—')}</span>
                        </div>
                        <p class="text-xs text-gray-500 mt-0.5 truncate">${subtitle}</p>
                    </div>
                    <div class="text-right">
                        <div class="text-sm font-bold text-primary">${value}</div>
                        <div class="text-xs text-gray-400">${dateStr}</div>
                    </div>
                    <button onclick="window.deleteDocument(${idx})" class="w-8 h-8 rounded-lg bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 transition-all">
                        <i class="fa-solid fa-trash text-xs"></i>
                    </button>
                </div>
            `;
        }).join('');
    };
    
    window.deleteDocument = function(idx) { 
        if (confirm('Excluir documento?')) { 
            documents.splice(idx, 1); 
            saveDocuments(); 
            window.renderHistory(); 
            Utils.toast.info('Documento removido.'); 
        } 
    };
    
    // ============================================
    // TABS
    // ============================================
    
    window.switchDocTab = function(name) {
        const tabs = ['receipt', 'contract', 'history'];
        
        tabs.forEach(t => {
            const tabContent = document.getElementById(`doc-${t}`);
            const tabButton = document.getElementById(`doc-tab-${t}`);
            if (tabContent) tabContent.classList.add('hidden');
            if (tabButton) tabButton.classList.remove('active');
        });
        
        const activeContent = document.getElementById(`doc-${name}`);
        const activeButton = document.getElementById(`doc-tab-${name}`);
        
        if (activeContent) activeContent.classList.remove('hidden');
        if (activeButton) activeButton.classList.add('active');
        
        if (name === 'history') window.renderHistory();
    };
    
    // ============================================
    // INIT
    // ============================================
    
    function init() {
        const userId = getCurrentUserId();
        if (!userId) return;
        
        appState = loadAppState();
        documents = loadDocuments();
        budgets = appState?.budgets || [];
        clients = appState?.clients || [];
        
        const today = new Date().toISOString().split('T')[0];
        const recDate = document.getElementById('rec-date');
        const ctrDate = document.getElementById('ctr-date');
        
        if (recDate) recDate.value = today;
        if (ctrDate) ctrDate.value = today;
        
        populateSelects();
        loadProviderData();
        
        window.updateReceiptPreview();
        window.updateContractPreview();
        window.renderHistory();
        
        console.log('✅ Documentos page initialized');
    }
    
    // Aguardar DOM carregar
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
})();