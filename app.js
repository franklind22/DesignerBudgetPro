// PDF Template - VERSÃO PÁGINA ÚNICA DINÂMICA (CORRIGIDA)
const pdfTemplate = {
    gerarOrcamentoPDF(budget, settings) {
        // 1. Pegar cores do tema ou usar fallbacks
        const rootStyles = getComputedStyle(document.documentElement);
        const primaryColor = rootStyles.getPropertyValue('--primary').trim() || '#2d8a8a';
        const primaryDark = rootStyles.getPropertyValue('--primary-dark').trim() || '#1e5f5f';
        
        // 2. Calcular datas
        const validityDate = new Date(budget.date);
        validityDate.setDate(validityDate.getDate() + (budget.validity || 30));
        
        // 3. Agrupar serviços por categoria
        const servicesByCategory = {};
        budget.services?.forEach(s => {
            if (!servicesByCategory[s.category]) {
                servicesByCategory[s.category] = [];
            }
            servicesByCategory[s.category].push(s);
        });
        
        // 4. Criar container invisível para renderização
        const container = document.createElement('div');
        container.style.position = 'absolute';
        container.style.left = '-9999px';
        container.style.top = '-9999px';
        container.style.width = '800px';
        container.style.backgroundColor = 'white';
        container.style.fontFamily = "'Inter', 'Segoe UI', Arial, sans-serif";
        container.style.padding = '0';
        container.style.margin = '0';
        
        // 5. Construir o HTML do PDF
        let html = `
            <div style="padding: 25px; background: rgb(255, 255, 255);">
                
                <!-- CABEÇALHO -->
                <div style="background: ${primaryColor}; color: white; padding: 30px; border-radius: 12px 12px 0 0;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <h1 style="margin: 0; font-size: 26px; letter-spacing: 1px;">PROPOSTA COMERCIAL</h1>
                            <p style="margin: 8px 0 0; font-size: 16px;">${settings.name || 'Profissional'}</p>
                            ${settings.email ? `<p style="margin: 4px 0 0; font-size: 12px; opacity: 1;">${settings.email}</p>` : ''}
                        </div>
                        <div style="background: rgba(255,255,255,0.2); padding: 10px 20px; border-radius: 12px; text-align: center;">
                            <div style="font-size: 10px; text-transform: uppercase;">Nº Documento</div>
                            <div style="font-size: 18px; font-weight: bold;">${budget.docNumber || 'ORÇ-' + String(budget.id).slice(-6)}</div>
                        </div>
                    </div>
                </div>
                
                <!-- INFORMAÇÕES -->
                <div style="display: flex; gap: 10px; padding: 20px; background: #f0f0f0; border-bottom: 1px solid #ddd;">
                    <div style="flex: 1;"><small style="color: #000; font-size: 10px;">CLIENTE</small><br><strong>${budget.clientName}</strong></div>
                    <div style="flex: 1;"><small style="color: #000; font-size: 10px;">DATA EMISSÃO</small><br><strong>${new Date(budget.date).toLocaleDateString('pt-BR')}</strong></div>
                    <div style="flex: 1;"><small style="color: #000; font-size: 10px;">VALIDADE</small><br><strong>${validityDate.toLocaleDateString('pt-BR')}</strong></div>
                    <div style="flex: 2;"><small style="color: #000; font-size: 10px;">PROJETO</small><br><strong>${budget.projectName || 'Geral'}</strong></div>
                </div>
                
                <!-- SERVIÇOS -->
                <div style="padding: 20px;">
                    <h2 style="color: ${primaryColor}; font-size: 18px; border-left: 4px solid ${primaryColor}; padding-left: 10px; margin-bottom: 20px;">DETALHAMENTO DOS SERVIÇOS</h2>
        `;

        for (const [category, items] of Object.entries(servicesByCategory)) {
            html += `
                <div style="margin-bottom: 25px;">
                    <div style="background: ${primaryDark}10; padding: 6px 12px; font-weight: bold; color: ${primaryDark}; margin-bottom: 5px; border-radius: 4px;">${category}</div>
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="border-bottom: 2px solid #000; font-size: 12px; color: #000;">
                                <th style="text-align: left; padding: 10px;">DESCRIÇÃO</th>
                                <th style="text-align: center; padding: 10px; width: 50px;">QTD</th>
                                <th style="text-align: right; padding: 10px; width: 100px;">UNITÁRIO</th>
                                <th style="text-align: right; padding: 10px; width: 100px;">TOTAL</th>
                             </tr>
                        </thead>
                        <tbody>
            `;
            
            items.forEach(s => {
                const price = s.customPrice || s.price;
                const total = price * s.qty;
                html += `
                    <tr style="border-bottom: 1px solid #eee; font-size: 13px;">
                        <td style="padding: 10px;">${s.name}</td>
                        <td style="text-align: center; padding: 10px;">${s.qty}</td>
                        <td style="text-align: right; padding: 10px;">R$ ${price.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
                        <td style="text-align: right; padding: 10px; font-weight: 500;">R$ ${total.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
                    </tr>
                `;
            });
            
            html += `</tbody></table></div>`;
        }
        
        // TOTAIS, PAGAMENTO E OBSERVAÇÕES
        html += `
                    <div style="margin-top: 30px; display: flex; flex-direction: column; gap: 20px; color: #000;">
                        
                        <div style="display: flex; gap: 20px;">
                            <div style="flex: 1; border: 1px solid #ddd; border-radius: 8px; padding: 15px; background: #f8f9fa;">
                                <strong style="font-size: 12px; display: block; margin-bottom: 8px; border-bottom: 1px solid #ddd; padding-bottom: 4px;">💰 CONDIÇÕES DE PAGAMENTO</strong>
                                <p style="margin: 0; font-size: 13px; line-height: 1.4;">${budget.paymentTerms || 'A combinar'}</p>
                            </div>
                            
                            <div style="flex: 1; border: 1px solid #ddd; border-radius: 8px; padding: 15px; background: #f8f9fa;">
                                <strong style="font-size: 12px; display: block; margin-bottom: 8px; border-bottom: 1px solid #ddd; padding-bottom: 4px;">📝 OBSERVAÇÕES</strong>
                                <p style="margin: 0; font-size: 13px; line-height: 1.4;">${budget.notes || 'Sem observações adicionais.'}</p>
                            </div>
                        </div>

                        <div style="display: flex; justify-content: flex-end;">
                            <div style="width: 320px; border: 2px solid ${primaryColor}; border-radius: 12px; padding: 20px; background: ${primaryColor}08;">
                                <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px;">
                                    <span>Subtotal:</span>
                                    <span style="font-weight: bold;">R$ ${budget.subtotal.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                                </div>
                                
                                ${budget.hoursWorked > 0 ? `
                                <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px;">
                                    <span>Horas (${budget.hoursWorked}h):</span>
                                    <span style="font-weight: bold;">R$ ${budget.hoursCost.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                                </div>
                                ` : ''}

                                <div style="border-top: 2px solid ${primaryColor}; margin-top: 10px; padding-top: 10px; text-align: right;">
                                    <span style="font-size: 12px; font-weight: bold; text-transform: uppercase;">Valor Total da Proposta</span><br>
                                    <span style="font-size: 28px; font-weight: 900; letter-spacing: -1px; color: ${primaryColor};">R$ ${budget.total.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                                </div>
                            </div>
                        </div>

                        <div style="margin-top: 50px; display: flex; justify-content: space-between; gap: 60px;">
                            <div style="flex: 1; text-align: center; border-top: 1px solid #ccc; padding-top: 10px;">
                                <strong style="font-size: 12px; display: block;">Aceite do Cliente</strong>
                                <span style="font-size: 10px;">Data: ____/____/_______</span>
                            </div>
                            <div style="flex: 1; text-align: center; border-top: 1px solid #ccc; padding-top: 10px;">
                                <strong style="font-size: 12px; display: block;">${settings.name || 'Responsável'}</strong>
                                <span style="font-size: 10px;">Assinatura Digital</span>
                            </div>
                        </div>

                        <div style="margin-top: 30px; text-align: center; font-size: 10px; border-top: 1px solid #ddd; padding-top: 15px; color: #666;">
                            Gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')} • Válido até ${validityDate.toLocaleDateString('pt-BR')}
                        </div>
                    </div>
                </div>
            </div>
        `;

        container.innerHTML = html;
        document.body.appendChild(container);
        
        // 6. Gerar o PDF com altura dinâmica
        setTimeout(() => {
            html2canvas(container, {
                scale: 2,
                backgroundColor: '#ffffff',
                useCORS: true,
                logging: false
            }).then(canvas => {
                const imgData = canvas.toDataURL('image/jpeg', 0.95);
                const { jsPDF } = window.jspdf;
                
                // CÁLCULO DE PÁGINA ÚNICA DINÂMICA
                const pdfWidth = 210; // Largura A4 padrão em mm
                const pdfHeight = (canvas.height * pdfWidth) / canvas.width; // Altura proporcional ao conteúdo
                
                const pdf = new jsPDF({
                    unit: 'mm',
                    format: [pdfWidth, pdfHeight],
                    orientation: 'portrait'
                });
                
                pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
                pdf.save(`orcamento_${budget.clientName.replace(/\s+/g, '_')}_${budget.docNumber || 'ORC'}.pdf`);
                
                document.body.removeChild(container);
            }).catch(err => {
                console.error('Erro na geração do PDF:', err);
                Toast.error('Erro ao gerar PDF. Tente novamente.');
                document.body.removeChild(container);
            });
        }, 600);
    }
};
