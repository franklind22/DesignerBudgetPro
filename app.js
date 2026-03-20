// PDF Template - VERSÃO FINAL ESTILIZADA (BONITA E PROFISSIONAL)
const pdfTemplate = {
    gerarOrcamentoPDF(budget, settings) {
        // Pegar cores do tema
        const rootStyles = getComputedStyle(document.documentElement);
        const primaryColor = rootStyles.getPropertyValue('--primary').trim() || '#2d8a8a';
        const primaryDark = rootStyles.getPropertyValue('--primary-dark').trim() || '#1e5f5f';
        const primaryLight = rootStyles.getPropertyValue('--primary-light').trim() || '#e6f3f3';
        
        // Calcular datas
        const validityDate = new Date(budget.date);
        validityDate.setDate(validityDate.getDate() + (budget.validity || 30));
        
        // Agrupar serviços
        const servicesByCategory = {};
        budget.services?.forEach(s => {
            if (!servicesByCategory[s.category]) {
                servicesByCategory[s.category] = [];
            }
            servicesByCategory[s.category].push(s);
        });
        
        // Criar container
        const container = document.createElement('div');
        container.style.position = 'absolute';
        container.style.left = '-9999px';
        container.style.top = '-9999px';
        container.style.width = '800px';
        container.style.backgroundColor = '#FFFFFF';
        container.style.fontFamily = "'Inter', 'Segoe UI', 'Poppins', Arial, sans-serif";
        
        // Construir HTML ESTILIZADO
        let html = `
            <div style="padding: 35px; background: #FFFFFF;">
                
                <!-- CABEÇALHO COM ELEMENTOS DECORATIVOS -->
                <div style="position: relative; margin-bottom: 25px;">
                    <div style="position: absolute; top: -10px; right: -10px; width: 120px; height: 120px; background: ${primaryLight}; border-radius: 50%; opacity: 0.4; z-index: 0;"></div>
                    <div style="position: relative; z-index: 1;">
                        <div style="display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap; border-bottom: 3px solid ${primaryColor}; padding-bottom: 20px;">
                            <div>
                                <div style="font-size: 12px; letter-spacing: 2px; color: ${primaryColor}; margin-bottom: 5px;">DOCUMENTO COMERCIAL</div>
                                <h1 style="margin: 0; font-size: 36px; font-weight: 800; color: #1a1a2e; letter-spacing: -1px;">PROPOSTA</h1>
                                <h1 style="margin: 0; font-size: 36px; font-weight: 800; color: ${primaryColor}; letter-spacing: -1px;">COMERCIAL</h1>
                                <p style="margin: 12px 0 0; font-size: 14px; color: #4a5568;">${settings.name || 'Designer Profissional'}</p>
                                ${settings.email ? `<p style="margin: 4px 0 0; font-size: 12px; color: #718096;">${settings.email}</p>` : ''}
                            </div>
                            <div style="text-align: right;">
                                <div style="background: ${primaryLight}; padding: 12px 20px; border-radius: 12px;">
                                    <div style="font-size: 10px; color: ${primaryDark}; letter-spacing: 1px;">NÚMERO DO DOCUMENTO</div>
                                    <div style="font-size: 24px; font-weight: 800; color: ${primaryColor};">${budget.docNumber || 'ORÇ-' + String(budget.id).slice(-6)}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- INFORMAÇÕES COM CARDS -->
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin: 30px 0;">
                    <div style="background: #F7FAFC; padding: 15px; border-radius: 12px; border-left: 3px solid ${primaryColor};">
                        <div style="font-size: 11px; color: ${primaryColor}; text-transform: uppercase; letter-spacing: 1px;">Cliente</div>
                        <div style="font-size: 14px; font-weight: 600; color: #1a202c; margin-top: 5px;">${budget.clientName}</div>
                    </div>
                    <div style="background: #F7FAFC; padding: 15px; border-radius: 12px; border-left: 3px solid ${primaryColor};">
                        <div style="font-size: 11px; color: ${primaryColor}; text-transform: uppercase; letter-spacing: 1px;">Data de Emissão</div>
                        <div style="font-size: 14px; font-weight: 600; color: #1a202c; margin-top: 5px;">${new Date(budget.date).toLocaleDateString('pt-BR')}</div>
                    </div>
                    <div style="background: #F7FAFC; padding: 15px; border-radius: 12px; border-left: 3px solid ${primaryColor};">
                        <div style="font-size: 11px; color: ${primaryColor}; text-transform: uppercase; letter-spacing: 1px;">Validade</div>
                        <div style="font-size: 14px; font-weight: 600; color: #1a202c; margin-top: 5px;">${validityDate.toLocaleDateString('pt-BR')}</div>
                    </div>
                    <div style="background: #F7FAFC; padding: 15px; border-radius: 12px; border-left: 3px solid ${primaryColor};">
                        <div style="font-size: 11px; color: ${primaryColor}; text-transform: uppercase; letter-spacing: 1px;">Projeto</div>
                        <div style="font-size: 14px; font-weight: 600; color: #1a202c; margin-top: 5px;">${budget.projectName || 'Não especificado'}</div>
                    </div>
                </div>
                
                <!-- SERVIÇOS COM DESIGN MODERNO -->
                <div style="margin: 35px 0 25px;">
                    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 20px;">
                        <div style="width: 40px; height: 3px; background: ${primaryColor}; border-radius: 2px;"></div>
                        <h2 style="margin: 0; font-size: 22px; font-weight: 700; color: #1a202c;">SERVIÇOS</h2>
                        <div style="flex: 1; height: 1px; background: linear-gradient(90deg, ${primaryColor} 0%, transparent 100%);"></div>
                    </div>
        `;
        
        // Adicionar serviços com design elegante
        for (const [category, items] of Object.entries(servicesByCategory)) {
            html += `
                <div style="margin-bottom: 30px; background: #FFFFFF; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                    <div style="background: ${primaryLight}; padding: 10px 16px;">
                        <span style="font-weight: 600; color: ${primaryDark}; font-size: 14px;">📁 ${category}</span>
                    </div>
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background: #F9FAFB;">
                                <th style="text-align: left; padding: 12px 16px; font-size: 12px; font-weight: 600; color: #4a5568;">DESCRIÇÃO</th>
                                <th style="text-align: center; padding: 12px 16px; font-size: 12px; font-weight: 600; color: #4a5568; width: 70px;">QTD</th>
                                <th style="text-align: right; padding: 12px 16px; font-size: 12px; font-weight: 600; color: #4a5568; width: 110px;">UNITÁRIO</th>
                                <th style="text-align: right; padding: 12px 16px; font-size: 12px; font-weight: 600; color: #4a5568; width: 110px;">TOTAL</th>
                               </tr>
                        </thead>
                        <tbody>
            `;
            
            for (const s of items) {
                const price = s.customPrice || s.price;
                const total = price * s.qty;
                html += `
                    <tr style="border-bottom: 1px solid #EDF2F7;">
                        <td style="padding: 12px 16px; color: #2d3748; font-size: 13px;">${s.name}</td>
                        <td style="text-align: center; padding: 12px 16px; color: #2d3748; font-size: 13px;">${s.qty}</td>
                        <td style="text-align: right; padding: 12px 16px; color: #2d3748; font-size: 13px;">R$ ${price.toFixed(2).replace('.', ',')}</td>
                        <td style="text-align: right; padding: 12px 16px; font-weight: 600; color: ${primaryDark};">R$ ${total.toFixed(2).replace('.', ',')}</td>
                    </tr>
                `;
            }
            
            html += `</tbody>  </table> </div>`;
        }
        
        // INFORMAÇÕES ADICIONAIS (Pagamento e Observações)
        html += `
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 25px 0 30px;">
                        <div style="background: ${primaryLight}20; border-radius: 12px; padding: 18px; border: 1px solid ${primaryLight};">
                            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
                                <span style="font-size: 20px;">💰</span>
                                <strong style="color: ${primaryColor}; font-size: 14px;">CONDIÇÕES DE PAGAMENTO</strong>
                            </div>
                            <p style="margin: 0; color: #2d3748; font-size: 13px; line-height: 1.5;">${budget.paymentTerms || 'A combinar'}</p>
                        </div>
                        <div style="background: #FFFAF0; border-radius: 12px; padding: 18px; border: 1px solid #FEF3C7;">
                            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
                                <span style="font-size: 20px;">📝</span>
                                <strong style="color: #D97706; font-size: 14px;">OBSERVAÇÕES</strong>
                            </div>
                            <p style="margin: 0; color: #2d3748; font-size: 13px; line-height: 1.5;">${budget.notes || 'Nenhuma observação adicional.'}</p>
                        </div>
                    </div>
                    
                    <!-- TOTAL COM DESTAQUE -->
                    <div style="display: flex; justify-content: flex-end; margin: 20px 0 35px;">
                        <div style="width: 340px; background: linear-gradient(135deg, ${primaryLight} 0%, #FFFFFF 100%); border-radius: 16px; padding: 20px 25px;">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                                <span style="color: #4a5568;">Subtotal:</span>
                                <span style="font-weight: 600; color: #2d3748;">R$ ${budget.subtotal.toFixed(2).replace('.', ',')}</span>
                            </div>
                            ${budget.hoursWorked > 0 ? `
                            <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                                <span style="color: #4a5568;">Horas (${budget.hoursWorked}h):</span>
                                <span style="font-weight: 600; color: #2d3748;">R$ ${budget.hoursCost.toFixed(2).replace('.', ',')}</span>
                            </div>
                            ` : ''}
                            <div style="border-top: 2px dashed ${primaryColor}; margin: 12px 0 8px;"></div>
                            <div style="display: flex; justify-content: space-between; align-items: baseline;">
                                <span style="font-size: 14px; font-weight: 600; color: #1a202c;">VALOR TOTAL</span>
                                <span style="font-size: 28px; font-weight: 800; color: ${primaryColor};">R$ ${budget.total.toFixed(2).replace('.', ',')}</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- ASSINATURAS COM ESTILO -->
                    <div style="display: flex; justify-content: space-between; gap: 50px; margin: 40px 0 30px;">
                        <div style="flex: 1; text-align: center;">
                            <div style="border-top: 2px dotted ${primaryColor}; padding-top: 12px;">
                                <strong style="color: #1a202c;">_________________________</strong>
                                <div style="font-size: 12px; color: #4a5568; margin-top: 8px;">Ass do Cliente</div>
                                <div style="font-size: 10px; color: #718096;">Data: ___/___/______</div>
                            </div>
                        </div>
                        <div style="flex: 1; text-align: center;">
                            <div style="border-top: 2px dotted ${primaryColor}; padding-top: 12px;">
                                <strong style="color: #1a202c;">_________________________</strong>
                                <div style="font-size: 12px; color: #4a5568; margin-top: 8px;">${settings.name || 'Designer'}</div>
                                <div style="font-size: 10px; color: #718096;">Assinatura Digital</div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- RODAPÉ ELEGANTE -->
                    <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #E2E8F0;">
                        <p style="margin: 0; font-size: 10px; color: #718096;">
                            ⚡ Este orçamento é válido até ${validityDate.toLocaleDateString('pt-BR')}
                        </p>
                        <p style="margin: 8px 0 0; font-size: 9px; color: #94a3b8;">
                            Gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}
                        </p>
                        <p style="margin: 8px 0 0; font-size: 10px; color: ${primaryColor}; font-weight: 500;">
                            Designer Budget Pro
                        </p>
                    </div>
                </div>
            </div>
        `;
        
        container.innerHTML = html;
        document.body.appendChild(container);
        
        // Gerar PDF
        setTimeout(() => {
            html2canvas(container, {
                scale: 2,
                backgroundColor: '#FFFFFF',
                useCORS: true,
                logging: false
            }).then(canvas => {
                const imgData = canvas.toDataURL('image/jpeg', 0.95);
                const { jsPDF } = window.jspdf;
                
                const pdfWidth = 210;
                const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
                
                const pdf = new jsPDF({
                    unit: 'mm',
                    format: [pdfWidth, pdfHeight],
                    orientation: 'portrait'
                });
                
                pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
                pdf.save(`orcamento_${budget.clientName.replace(/\s+/g, '_')}.pdf`);
                
                document.body.removeChild(container);
            }).catch(err => {
                console.error('Erro:', err);
                Toast.error('Erro ao gerar PDF');
                document.body.removeChild(container);
            });
        }, 500);
    }
};
