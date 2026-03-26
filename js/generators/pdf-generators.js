/**
 * PDF GENERATORS MODULE
 * Centraliza toda a lógica de geração de PDF do sistema
 */

const PDFGenerators = (function() {
    'use strict';
    
    // ============================================
    // UTILITÁRIOS INTERNOS
    // ============================================
    
    /**
     * Escapa HTML para prevenir XSS
     */
    function _escapeHtml(text) {
        if (text === null || text === undefined) return '';
        const div = document.createElement('div');
        div.textContent = String(text);
        return div.innerHTML;
    }
    
    /**
     * Formata valor para BRL
     */
    function _formatBRL(value) {
        const n = parseFloat(value) || 0;
        return 'R$ ' + n.toFixed(2).replace('.', ',');
    }
    
    /**
     * Formata data para exibição
     */
    function _formatDate(dateString) {
        if (!dateString) return '—';
        const [year, month, day] = dateString.split('-');
        return `${day}/${month}/${year}`;
    }
    
    /**
     * Obtém cor primária do tema atual
     */
    function _getPrimaryColor() {
        const rootStyles = getComputedStyle(document.documentElement);
        return (rootStyles.getPropertyValue('--primary') || '').trim() || '#2d8a8a';
    }
    
    /**
     * Extrai paleta de cores do orçamento
     */
    function _extractPalette(budget) {
        if (budget.paletteSource === 'custom' && Array.isArray(budget.customPalette) && budget.customPalette.length) {
            return budget.customPalette;
        }
        if (budget.paletteSource === 'generator' && Array.isArray(budget.generatedPalette) && budget.generatedPalette.length) {
            return budget.generatedPalette.map(color => ({ name: '', color }));
        }
        return [];
    }
    
    /**
     * Constrói seção de paleta de cores para o PDF
     */
    function _buildPaletteSection(budget, primaryColor) {
        const colors = _extractPalette(budget);
        if (!colors.length) return '';
        
        const sourceLabel = budget.paletteSource === 'custom' ? 'Personalizada' : 'Gerada';
        
        let swatchesHtml = '';
        for (let i = 0; i < colors.length; i++) {
            const c = colors[i];
            swatchesHtml += `
                <div style="flex: 1; text-align: center; min-width: 55px;">
                    <div style="
                        height: 45px;
                        background-color: ${c.color};
                        border-radius: 8px;
                        margin-bottom: 5px;
                        border: 1px solid #e2e8f0;
                    "></div>
                    <div style="
                        font-size: 8px;
                        font-family: monospace;
                        font-weight: 500;
                        color: #2d3748;
                        background: #f5f5f5;
                        display: inline-block;
                        padding: 2px 5px;
                        border-radius: 10px;
                    ">${c.color.toUpperCase()}</div>
                </div>
            `;
        }
        
        return `
            <div style="margin: 16px 0;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
                    <i class="fa-solid fa-palette" style="color: ${primaryColor}; font-size: 12px;"></i>
                    <span style="font-size: 11px; font-weight: 600; color: #1a2a3a;">Paleta de Cores</span>
                    <span style="font-size: 8px; color: #494949; background: #f1f5f9; padding: 2px 8px; border-radius: 20px;">${sourceLabel}</span>
                </div>
                <div style="display: flex; gap: 10px; flex-wrap: wrap; justify-content: flex-start;">${swatchesHtml}</div>
            </div>
        `;
    }
    
    /**
     * Cria elemento temporário para renderização do PDF
     */
    function _createTempElement(htmlContent, width = 680) {
        const element = document.createElement('div');
        element.innerHTML = htmlContent;
        element.style.position = 'absolute';
        element.style.left = '-9999px';
        element.style.top = '-9999px';
        element.style.width = `${width}px`;
        element.style.backgroundColor = '#ffffff';
        element.style.padding = '20px';
        document.body.appendChild(element);
        return element;
    }
    
    /**
     * Gera PDF a partir de um elemento HTML
     */
    async function _generatePDFFromElement(element, fileName, options = {}) {
        const { timeout = 30000, scale = 2, quality = 0.95 } = options;
        
        try {
            // Aguardar renderização
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Gerar canvas com timeout
            const canvas = await Promise.race([
                html2canvas(element, {
                    scale,
                    backgroundColor: '#ffffff',
                    logging: false,
                    useCORS: true,
                    allowTaint: false
                }),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Timeout na geração do PDF')), timeout)
                )
            ]);
            
            const imgData = canvas.toDataURL('image/jpeg', quality);
            const { jsPDF } = window.jspdf;
            
            // Calcular dimensões
            const pdfWidth = 190; // mm
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            
            const pdf = new jsPDF({
                unit: 'mm',
                format: [pdfWidth, pdfHeight + 20],
                orientation: 'portrait'
            });
            
            pdf.addImage(imgData, 'JPEG', 10, 10, pdfWidth, pdfHeight);
            pdf.save(fileName);
            
            return { success: true, fileName };
            
        } catch (error) {
            console.error('Erro ao gerar PDF:', error);
            throw error;
        }
    }
    
    // ============================================
    // GERADORES ESPECÍFICOS
    // ============================================
    
    /**
     * Gera PDF do orçamento
     */
    async function generateBudgetPDF(budget, settings, callbacks = {}) {
    const { onStart, onSuccess, onError } = callbacks;
    
    if (!budget) {
        const error = new Error('Orçamento não encontrado');
        if (onError) onError(error);
        throw error;
    }
    
    if (onStart) onStart();
    
    try {
        const state = window.Store?.state || {};
        const userProfile = state.settings?.profile || {};
        const userName = state.settings?.name || settings?.name || 'Designer Profissional';
        const userEmail = state.settings?.email || settings?.email || '';
        const userSpecialty = userProfile.specialty || '';
        const userPhone = userProfile.phone || '';
        const userInstagram = userProfile.instagram || '';
        const userWebsite = userProfile.website || '';
        const userDocument = userProfile.document || '';
        const userPix = userProfile.pix || '';
        const userAvatarUrl = userProfile.avatarUrl || null;
        
        const issueDate = new Date(budget.date);
        const validityDate = new Date(budget.date);
        validityDate.setDate(validityDate.getDate() + (budget.validity || 30));
        
        const primaryColor = _getPrimaryColor();
        
        // Agrupar serviços por categoria
        const servicesByCategory = {};
        (budget.services || []).forEach(s => {
            const cat = s.category || 'Serviços';
            if (!servicesByCategory[cat]) servicesByCategory[cat] = [];
            servicesByCategory[cat].push(s);
        });
        
        let servicesHTML = '';
        
        for (const [category, items] of Object.entries(servicesByCategory)) {
            servicesHTML += `
                <div style="margin-bottom: 20px;">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px;">
                        <span style="font-size: 12px; font-weight: 700; color: ${primaryColor};">${_escapeHtml(category)}</span>
                    </div>
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="border-bottom: 1px solid #d1d5db;">
                                <th style="text-align: left; padding: 8px 4px; font-size: 10px; font-weight: 600; color: #374151;">Serviço</th>
                                <th style="text-align: center; padding: 8px 4px; font-size: 10px; font-weight: 600; color: #374151; width: 50px;">Qtd</th>
                                <th style="text-align: right; padding: 8px 4px; font-size: 10px; font-weight: 600; color: #374151; width: 90px;">Unitário</th>
                                <th style="text-align: right; padding: 8px 4px; font-size: 10px; font-weight: 600; color: #374151; width: 90px;">Total</th>
                            </tr>
                        </thead>
                        <tbody>
            `;
            
            for (const s of items) {
                const price = (s.customPrice !== null && s.customPrice !== undefined) ? s.customPrice : (s.price || 0);
                const total = price * (s.qty || 1);
                servicesHTML += `
                    <tr style="border-bottom: 1px solid #e5e7eb;">
                        <td style="padding: 8px 4px; font-size: 10px; color: #1f2937;">${_escapeHtml(s.name)}</td>
                        <td style="text-align: center; padding: 8px 4px; font-size: 10px; color: #1f2937;">${_escapeHtml(s.qty || 1)}</td>
                        <td style="text-align: right; padding: 8px 4px; font-size: 10px; color: #1f2937;">${_formatBRL(price)}</td>
                        <td style="text-align: right; padding: 8px 4px; font-size: 10px; color: #1f2937;">${_formatBRL(total)}</td>
                    </tr>
                `;
            }
            
            servicesHTML += `
                        </tbody>
                    </table>
                </div>
            `;
        }
        
        const paletteHTML = _buildPaletteSection(budget, primaryColor);
        
        // Montar informações de contato
        let contactInfoHTML = '';
        const contactItems = [];
        if (userPhone) contactItems.push(`📞 ${_escapeHtml(userPhone)}`);
        if (userEmail) contactItems.push(`✉️ ${_escapeHtml(userEmail)}`);
        if (userInstagram) contactItems.push(`📷 @${_escapeHtml(userInstagram)}`);
        if (userWebsite) contactItems.push(`🌐 ${_escapeHtml(userWebsite)}`);
        
        if (contactItems.length > 0) {
            contactInfoHTML = `
                <div style="margin-top: 6px; font-size: 8px; color: #6b7280; display: flex; flex-wrap: wrap; gap: 12px;">
                    ${contactItems.map(item => `<span>${item}</span>`).join('')}
                </div>
            `;
        }
        
        const logoHTML = `
            <div style="display: flex; align-items: center; gap: 12px;">
                <div style="width: 48px; height: 48px; background: ${primaryColor}; border-radius: 12px; display: flex; align-items: center; justify-content: center; overflow: hidden;">
                    ${userAvatarUrl ? 
                        `<img src="${userAvatarUrl}" style="width: 100%; height: 100%; object-fit: cover;">` : 
                        `<span style="color: white; font-size: 20px; font-weight: bold;">🎨</span>`
                    }
                </div>
                <div>
                    <div style="font-size: 16px; font-weight: 700; color: #111827;">${_escapeHtml(userName)}</div>
                    ${userSpecialty ? `<div style="font-size: 9px; color: ${primaryColor}; font-weight: 500;">${_escapeHtml(userSpecialty)}</div>` : ''}
                    ${contactInfoHTML}
                </div>
            </div>
        `;
        
        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Orçamento ${budget.docNumber}</title>
                <style>
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }
                    body {
                        font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif;
                        background: white;
                        padding: 40px;
                        font-size: 10px;
                        line-height: 1.5;
                        color: #111827;
                    }
                    .container {
                        max-width: 800px;
                        margin: 0 auto;
                        background: white;
                    }
                    .header {
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-start;
                        margin-bottom: 24px;
                        padding-bottom: 16px;
                        border-bottom: 2px solid ${primaryColor};
                        flex-wrap: wrap;
                        gap: 16px;
                    }
                    .title-section {
                        text-align: right;
                    }
                    .title-section h1 {
                        font-size: 20px;
                        font-weight: 700;
                        color: #111827;
                        margin: 0 0 4px 0;
                    }
                    .title-section p {
                        font-size: 10px;
                        color: #6b7280;
                        margin: 0;
                    }
                    .info-grid {
                        background: #f9fafb;
                        border-radius: 12px;
                        padding: 16px;
                        margin-bottom: 24px;
                        border-left: 4px solid ${primaryColor};
                        display: grid;
                        grid-template-columns: repeat(2, 1fr);
                        gap: 12px;
                    }
                    .info-item {
                        display: flex;
                        align-items: baseline;
                        flex-wrap: wrap;
                        gap: 4px;
                    }
                    .info-label {
                        font-weight: 600;
                        color: #4b5563;
                        font-size: 9px;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                        min-width: 55px;
                    }
                    .info-value {
                        font-weight: 500;
                        color: #111827;
                        font-size: 10px;
                    }
                    .section-title {
                        font-size: 12px;
                        font-weight: 700;
                        margin: 24px 0 12px 0;
                        color: #111827;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                    }
                    .section-title i {
                        color: ${primaryColor};
                    }
                    .total-box {
                        margin-top: 24px;
                        text-align: right;
                        padding-top: 16px;
                        border-top: 1px solid #e5e7eb;
                    }
                    .total-row {
                        font-size: 10px;
                        margin-bottom: 4px;
                        color: #4b5563;
                    }
                    .total-grand {
                        font-size: 14px;
                        font-weight: 700;
                        margin-top: 8px;
                        color: ${primaryColor};
                    }
                    .payment-box, .notes-box {
                        margin: 16px 0;
                        padding: 14px 16px;
                        background: #f9fafb;
                        border-left: 4px solid ${primaryColor};
                        border-radius: 8px;
                        font-size: 10px;
                        color: #1f2937;
                    }
                    .signature-box {
                        margin-top: 32px;
                        display: flex;
                        justify-content: space-between;
                        gap: 32px;
                    }
                    .signature {
                        flex: 1;
                        text-align: center;
                        border-top: 1px solid #e5e7eb;
                        padding-top: 10px;
                        font-size: 9px;
                        color: #6b7280;
                    }
                    .footer {
                        margin-top: 32px;
                        text-align: center;
                        font-size: 8px;
                        color: #9ca3af;
                        border-top: 1px solid #e5e7eb;
                        padding-top: 16px;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                    }
                    .palette-swatch {
                        display: inline-block;
                        width: 32px;
                        height: 32px;
                        border-radius: 8px;
                        margin-right: 8px;
                        border: 1px solid #e5e7eb;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        ${logoHTML}
                        <div class="title-section">
                            <h1>PROPOSTA COMERCIAL</h1>
                            <p>${_escapeHtml(budget.docNumber || 'ORC-' + String(budget.id || '').slice(-6))}</p>
                        </div>
                    </div>
                    
                    <div class="info-grid">
                        <div class="info-item">
                            <span class="info-label">Cliente:</span>
                            <span class="info-value">${_escapeHtml(budget.clientName || '—')}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Emissão:</span>
                            <span class="info-value">${_formatDate(budget.date)}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Validade:</span>
                            <span class="info-value">${_formatDate(validityDate.toISOString().split('T')[0])}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Projeto:</span>
                            <span class="info-value">${_escapeHtml(budget.projectName || 'Não especificado')}</span>
                        </div>
                        ${budget.deadline ? `
                        <div class="info-item">
                            <span class="info-label">Prazo:</span>
                            <span class="info-value">${budget.deadline} dias</span>
                        </div>
                        ` : ''}
                    </div>
                    
                    <div class="section-title">
                        📋 SERVIÇOS
                    </div>
                    ${servicesHTML || '<p style="color:#9ca3af; font-size:10px;">Nenhum serviço adicionado.</p>'}
                    
                    ${paletteHTML}
                    
                    ${budget.paymentTerms ? `
                    <div class="section-title">
                        💰 CONDIÇÕES DE PAGAMENTO
                    </div>
                    <div class="payment-box">
                        ${_escapeHtml(budget.paymentTerms)}
                    </div>
                    ` : ''}
                    
                    <div class="total-box">
                        <div class="total-row">
                            <strong>Subtotal:</strong> ${_formatBRL(budget.subtotal || 0)}
                        </div>
                        ${budget.hoursWorked > 0 ? `
                        <div class="total-row">
                            <strong>Horas (${budget.hoursWorked}h):</strong> ${_formatBRL(budget.hoursCost || 0)}
                        </div>
                        ` : ''}
                        <div class="total-grand">
                            <strong>TOTAL:</strong> ${_formatBRL(budget.total || 0)}
                        </div>
                    </div>
                    
                    ${budget.notes ? `
                    <div class="section-title">
                        📝 OBSERVAÇÕES
                    </div>
                    <div class="notes-box">
                        ${_escapeHtml(budget.notes)}
                    </div>
                    ` : ''}
                    
                    <div class="signature-box">
                        <div class="signature">
                            Assinatura do Cliente<br>
                            _________________________
                        </div>
                        <div class="signature">
                            ${_escapeHtml(userName)}<br>
                            _________________________
                        </div>
                    </div>
                    
                    <div class="footer">
                        <p>Gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
                        <p>Válido até ${_formatDate(validityDate.toISOString().split('T')[0])}</p>
                        <p>Designer Budget Pro</p>
                    </div>
                </div>
            </body>
            </html>
        `;
        
        const element = _createTempElement(htmlContent, 800);
        const fileName = `orcamento_${(budget.clientName || 'cliente').replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
        
        const result = await _generatePDFFromElement(element, fileName);
        
        if (element && element.remove) element.remove();
        if (onSuccess) onSuccess(result);
        
        return result;
        
    } catch (error) {
        console.error('Erro na geração do PDF de orçamento:', error);
        if (onError) onError(error);
        throw error;
    }
}
    
    /**
     * Gera PDF do recibo a partir dos dados do formulário
     */
    async function generateReceiptPDF(receiptData, callbacks = {}) {
        const { onStart, onSuccess, onError } = onError;
        
        if (!receiptData.payerName || !receiptData.service || !receiptData.value) {
            const error = new Error('Preencha: pagador, serviço e valor!');
            if (onError) onError(error);
            throw error;
        }
        
        if (onStart) onStart();
        
        try {
            const primaryColor = _getPrimaryColor();
            const state = window.Store?.state || {};
            const settings = state.settings || {};
            const profile = settings.profile || {};
            const providerName = settings.name || 'Prestador';
            const providerEmail = settings.email || '';
            const providerPix = profile.pix || '';
            const providerDoc = profile.document || '';
            
            const htmlContent = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <title>${receiptData.number || 'Recibo'}</title>
                    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
                    <style>
                        * { margin: 0; padding: 0; box-sizing: border-box; }
                        body {
                            font-family: 'Georgia', serif;
                            background: white;
                            padding: 40px;
                            font-size: 11px;
                            line-height: 1.5;
                            color: #000000;
                        }
                        .container { max-width: 680px; margin: 0 auto; }
                        .receipt-header {
                            border-top: 4px solid ${primaryColor};
                            padding-top: 16px;
                            display: flex;
                            justify-content: space-between;
                            align-items: flex-start;
                            margin-bottom: 20px;
                        }
                        .receipt-title h2 {
                            font-size: 20px;
                            font-weight: 800;
                            margin: 0;
                            letter-spacing: 1px;
                            color: #000000;
                        }
                        .receipt-number {
                            text-align: right;
                        }
                        .payer-box {
                            background: #f8f9fa;
                            border-radius: 8px;
                            padding: 14px;
                            margin-bottom: 16px;
                        }
                        .value-box {
                            background: ${primaryColor}15;
                            border-radius: 8px;
                            padding: 12px;
                        }
                        .signature-line {
                            border-top: 1px solid #000000;
                            padding-top: 6px;
                            margin-top: 30px;
                            display: inline-block;
                            min-width: 200px;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="receipt-header">
                            <div class="receipt-title">
                                <h2>RECIBO DE PAGAMENTO</h2>
                                <p style="margin:4px 0 0; font-size:11px;">${_escapeHtml(providerName)}${providerEmail ? ' · ' + providerEmail : ''}</p>
                            </div>
                            <div class="receipt-number">
                                <div style="font-size:10px; color:#666;">Nº do Documento</div>
                                <div style="font-size:16px; font-weight:700; color:${primaryColor};">${_escapeHtml(receiptData.number || '—')}</div>
                                <div style="font-size:11px;">Data: ${_formatDate(receiptData.date)}</div>
                            </div>
                        </div>
                        
                        <div class="payer-box">
                            <div style="font-size:10px; margin-bottom:6px;">Recebido de</div>
                            <div style="font-size:14px; font-weight:600;">${_escapeHtml(receiptData.payerName)}</div>
                            ${receiptData.payerDoc ? `<div style="font-size:11px; margin-top:2px;">CPF/CNPJ: ${_escapeHtml(receiptData.payerDoc)}</div>` : ''}
                        </div>
                        
                        <div style="margin-bottom:16px;">
                            <div style="font-size:10px; margin-bottom:6px;">Referente a</div>
                            <div style="font-size:13px; line-height:1.5; white-space:pre-wrap;">${_escapeHtml(receiptData.service)}</div>
                        </div>
                        
                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:16px;">
                            <div class="value-box">
                                <div style="font-size:10px;">Valor Recebido</div>
                                <div style="font-size:18px; font-weight:700; color:${primaryColor};">${_formatBRL(receiptData.value)}</div>
                            </div>
                            <div style="background:#f8f9fa; border-radius:8px; padding:12px;">
                                <div style="font-size:10px;">Forma de Pagamento</div>
                                <div style="font-size:13px; font-weight:600;">${_escapeHtml(receiptData.paymentMethod || '—')}</div>
                            </div>
                        </div>
                        
                        ${receiptData.notes ? `
                        <div style="border-left:3px solid ${primaryColor}; padding-left:12px; margin-bottom:16px;">
                            ${_escapeHtml(receiptData.notes)}
                        </div>
                        ` : ''}
                        
                        ${providerDoc || providerPix ? `
                        <div style="background:#f8f9fa; border-radius:8px; padding:10px; font-size:11px; margin-bottom:16px;">
                            ${providerDoc ? `<span><strong>CPF/CNPJ:</strong> ${_escapeHtml(providerDoc)}</span>` : ''}
                            ${providerPix ? `<span style="margin-left:16px;"><strong>PIX:</strong> ${_escapeHtml(providerPix)}</span>` : ''}
                        </div>
                        ` : ''}
                        
                        <div style="text-align:center; margin-top:20px;">
                            <div class="signature-line">
                                <div style="font-size:12px; font-weight:600;">${_escapeHtml(providerName)}</div>
                                <div style="font-size:10px;">Assinatura do Prestador</div>
                            </div>
                        </div>
                    </div>
                </body>
                </html>
            `;
            
            const element = _createTempElement(htmlContent);
            const fileName = `${receiptData.number || 'recibo'}.pdf`;
            
            const result = await _generatePDFFromElement(element, fileName);
            
            if (element && element.remove) element.remove();
            if (onSuccess) onSuccess(result);
            
            return result;
            
        } catch (error) {
            console.error('Erro na geração do PDF de recibo:', error);
            if (onError) onError(error);
            throw error;
        }
    }
    
    /**
     * Gera PDF do contrato a partir dos dados do formulário
     */
    async function generateContractPDF(contractData, callbacks = {}) {
        const { onStart, onSuccess, onError } = callbacks;
        
        if (!contractData.clientName || !contractData.value) {
            const error = new Error('Preencha: cliente e valor!');
            if (onError) onError(error);
            throw error;
        }
        
        if (onStart) onStart();
        
        try {
            const primaryColor = _getPrimaryColor();
            const state = window.Store?.state || {};
            const settings = state.settings || {};
            const profile = settings.profile || {};
            const providerName = settings.name || 'Prestador';
            const providerDoc = profile.document || '';
            const providerAddress = profile.address || '';
            const providerEmail = settings.email || '';
            
            // Processar lista de serviços
            const servicesList = contractData.servicesText ? 
                contractData.servicesText.split('\n').filter(s => s.trim()).map(s => `<li style="margin-bottom: 4px;">${_escapeHtml(s.trim())}</li>`).join('') : 
                '<li>Conforme descrito no objeto acima</li>';
            
            const htmlContent = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <title>${contractData.number || 'Contrato'}</title>
                    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
                    <style>
                        * { margin: 0; padding: 0; box-sizing: border-box; }
                        body {
                            font-family: 'Georgia', serif;
                            background: white;
                            padding: 40px;
                            font-size: 11px;
                            line-height: 1.6;
                            color: #000000;
                        }
                        .container { max-width: 680px; margin: 0 auto; }
                        h2 {
                            font-size: 16px;
                            font-weight: 700;
                            margin: 0 0 8px 0;
                            text-align: center;
                            letter-spacing: 2px;
                            text-transform: uppercase;
                        }
                        h3 {
                            font-size: 12px;
                            font-weight: 700;
                            margin-top: 16px;
                            margin-bottom: 8px;
                        }
                        .info-grid {
                            background: #f8f9fa;
                            border-radius: 8px;
                            padding: 12px;
                            margin: 12px 0;
                            display: grid;
                            grid-template-columns: 1fr 1fr;
                            gap: 12px;
                        }
                        .signature-box {
                            margin-top: 24px;
                            padding-top: 16px;
                            border-top: 1px solid #eee;
                            display: grid;
                            grid-template-columns: 1fr 1fr;
                            gap: 24px;
                            text-align: center;
                        }
                        .signature {
                            border-top: 1px solid ${primaryColor};
                            padding-top: 6px;
                            margin-top: 30px;
                        }
                        ul { margin: 8px 0 8px 20px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div style="border-bottom: 3px solid ${primaryColor}; padding-bottom: 12px; margin-bottom: 16px;">
                            <h2>CONTRATO DE PRESTAÇÃO DE SERVIÇOS</h2>
                            <p style="text-align:center; font-size:10px; margin:4px 0 0;">
                                Nº ${_escapeHtml(contractData.number || '—')} · Data: ${_formatDate(contractData.date)}
                            </p>
                        </div>
                        
                        <p>Pelo presente instrumento particular, de um lado <strong>CONTRATADO</strong>, e de outro <strong>CONTRATANTE</strong>, têm entre si justo e contratado o seguinte:</p>
                        
                        <div class="info-grid">
                            <div>
                                <strong style="color:${primaryColor};">CONTRATADO (PRESTADOR)</strong><br>
                                ${_escapeHtml(providerName)}<br>
                                ${providerDoc ? `CPF/CNPJ: ${_escapeHtml(providerDoc)}<br>` : ''}
                                ${providerAddress ? `End.: ${_escapeHtml(providerAddress)}<br>` : ''}
                                ${providerEmail ? `E-mail: ${_escapeHtml(providerEmail)}` : ''}
                            </div>
                            <div>
                                <strong style="color:${primaryColor};">CONTRATANTE (CLIENTE)</strong><br>
                                ${_escapeHtml(contractData.clientName)}<br>
                                ${contractData.clientDoc ? `CPF/CNPJ: ${_escapeHtml(contractData.clientDoc)}<br>` : ''}
                                ${contractData.clientAddress ? `End.: ${_escapeHtml(contractData.clientAddress)}<br>` : ''}
                                ${contractData.clientEmail ? `E-mail: ${_escapeHtml(contractData.clientEmail)}` : ''}
                            </div>
                        </div>
                        
                        <h3>CLÁUSULA 1ª - DO OBJETO</h3>
                        <p>O CONTRATADO obriga-se a prestar os serviços de design conforme descrição abaixo:</p>
                        <div style="background:#f9fafb; padding:12px; border-radius:8px; margin:8px 0;">
                            <p style="margin:0; white-space:pre-wrap;">${_escapeHtml(contractData.object || '—')}</p>
                        </div>
                        
                        <h3>CLÁUSULA 2ª - DOS SERVIÇOS</h3>
                        <p>Os serviços objeto deste contrato compreendem:</p>
                        <ul>${servicesList}</ul>
                        
                        <h3>CLÁUSULA 3ª - DO PRAZO</h3>
                        <p>O prazo para execução dos serviços será de <strong>${_escapeHtml(contractData.deadline || 'a ser definido')}</strong>.</p>
                        
                        <h3>CLÁUSULA 4ª - DO VALOR E PAGAMENTO</h3>
                        <p>Valor total de <strong>${_formatBRL(contractData.value)}</strong>. Condições: ${_escapeHtml(contractData.paymentTerms || 'A combinar entre as partes')}.</p>
                        
                        <h3>CLÁUSULA 5ª - DAS REVISÕES</h3>
                        <p>Inclusas <strong>${contractData.revisions || 2} revisão(ões)</strong> gratuitas.</p>
                        
                        <h3>CLÁUSULA 6ª - DOS DIREITOS AUTORAIS</h3>
                        <p>Transferidos após quitação integral.</p>
                        
                        ${contractData.extraClauses ? `
                        <h3>CLÁUSULAS ADICIONAIS</h3>
                        <p>${_escapeHtml(contractData.extraClauses)}</p>
                        ` : ''}
                        
                        <div class="signature-box">
                            <div>
                                <div class="signature">
                                    <div style="font-weight:600;">${_escapeHtml(providerName)}</div>
                                    <div style="font-size:10px;">CONTRATADO</div>
                                </div>
                            </div>
                            <div>
                                <div class="signature">
                                    <div style="font-weight:600;">${_escapeHtml(contractData.clientName)}</div>
                                    <div style="font-size:10px;">CONTRATANTE</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </body>
                </html>
            `;
            
            const element = _createTempElement(htmlContent);
            const fileName = `${contractData.number || 'contrato'}.pdf`;
            
            const result = await _generatePDFFromElement(element, fileName);
            
            if (element && element.remove) element.remove();
            if (onSuccess) onSuccess(result);
            
            return result;
            
        } catch (error) {
            console.error('Erro na geração do PDF de contrato:', error);
            if (onError) onError(error);
            throw error;
        }
    }
    
    // ============================================
    // API PÚBLICA
    // ============================================
    
    return {
        generateBudgetPDF,
        generateReceiptPDF,
        generateContractPDF,
        
        // Utilitários expostos para uso externo
        utils: {
            escapeHtml: _escapeHtml,
            formatBRL: _formatBRL,
            formatDate: _formatDate,
            getPrimaryColor: _getPrimaryColor
        }
    };
    
})();

// Expor globalmente
if (typeof window !== 'undefined') {
    window.PDFGenerators = PDFGenerators;
}