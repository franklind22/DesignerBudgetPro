/**
 * VALIDATORS MODULE
 * Validações de formulários reutilizáveis
 */

const Validators = (function() {
    'use strict';
    
    /**
     * Valida e-mail
     */
    function isValidEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(String(email).toLowerCase());
    }
    
    /**
     * Valida CPF
     */
    function isValidCPF(cpf) {
        cpf = String(cpf).replace(/[^\d]/g, '');
        
        if (cpf.length !== 11) return false;
        if (/^(\d)\1{10}$/.test(cpf)) return false;
        
        let sum = 0;
        let rest;
        
        for (let i = 1; i <= 9; i++) {
            sum += parseInt(cpf.substring(i - 1, i)) * (11 - i);
        }
        rest = (sum * 10) % 11;
        if (rest === 10 || rest === 11) rest = 0;
        if (rest !== parseInt(cpf.substring(9, 10))) return false;
        
        sum = 0;
        for (let i = 1; i <= 10; i++) {
            sum += parseInt(cpf.substring(i - 1, i)) * (12 - i);
        }
        rest = (sum * 10) % 11;
        if (rest === 10 || rest === 11) rest = 0;
        
        return rest === parseInt(cpf.substring(10, 11));
    }
    
    /**
     * Valida CNPJ
     */
    function isValidCNPJ(cnpj) {
        cnpj = String(cnpj).replace(/[^\d]/g, '');
        
        if (cnpj.length !== 14) return false;
        if (/^(\d)\1{13}$/.test(cnpj)) return false;
        
        let length = cnpj.length - 2;
        let numbers = cnpj.substring(0, length);
        let digits = cnpj.substring(length);
        let sum = 0;
        let pos = length - 7;
        
        for (let i = length; i >= 1; i--) {
            sum += parseInt(numbers.charAt(length - i)) * pos--;
            if (pos < 2) pos = 9;
        }
        
        let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
        if (result !== parseInt(digits.charAt(0))) return false;
        
        length = length + 1;
        numbers = cnpj.substring(0, length);
        sum = 0;
        pos = length - 7;
        
        for (let i = length; i >= 1; i--) {
            sum += parseInt(numbers.charAt(length - i)) * pos--;
            if (pos < 2) pos = 9;
        }
        
        result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
        
        return result === parseInt(digits.charAt(1));
    }
    
    /**
     * Valida telefone (formato brasileiro)
     */
    function isValidPhone(phone) {
        const cleaned = String(phone).replace(/[^\d]/g, '');
        return cleaned.length >= 10 && cleaned.length <= 11;
    }
    
    /**
     * Valida se campo não está vazio
     */
    function isNotEmpty(value) {
        return value !== null && value !== undefined && String(value).trim() !== '';
    }
    
    /**
     * Valida número positivo
     */
    function isPositiveNumber(value) {
        const num = parseFloat(value);
        return !isNaN(num) && num > 0;
    }
    
    /**
     * Valida se valor está dentro de um intervalo
     */
    function isInRange(value, min, max) {
        const num = parseFloat(value);
        return !isNaN(num) && num >= min && num <= max;
    }
    
    /**
     * Valida formulário completo
     */
    function validateForm(fields) {
        const errors = [];
        
        fields.forEach(field => {
            const element = document.getElementById(field.id);
            if (!element) return;
            
            const value = element.value.trim();
            let isValid = true;
            
            if (field.required && !isNotEmpty(value)) {
                isValid = false;
                errors.push(`${field.label} é obrigatório`);
            }
            
            if (isValid && field.type === 'email' && value) {
                if (!isValidEmail(value)) {
                    isValid = false;
                    errors.push(`${field.label} inválido`);
                }
            }
            
            if (isValid && field.type === 'cpf' && value) {
                if (!isValidCPF(value)) {
                    isValid = false;
                    errors.push(`${field.label} inválido (CPF)`);
                }
            }
            
            if (isValid && field.type === 'cnpj' && value) {
                if (!isValidCNPJ(value)) {
                    isValid = false;
                    errors.push(`${field.label} inválido (CNPJ)`);
                }
            }
            
            if (isValid && field.type === 'phone' && value) {
                if (!isValidPhone(value)) {
                    isValid = false;
                    errors.push(`${field.label} inválido`);
                }
            }
            
            if (isValid && field.min !== undefined && value) {
                if (!isPositiveNumber(value) || parseFloat(value) < field.min) {
                    isValid = false;
                    errors.push(`${field.label} deve ser maior que ${field.min}`);
                }
            }
            
            if (!isValid) {
                element.classList.add('border-red-500', 'bg-red-50');
            } else {
                element.classList.remove('border-red-500', 'bg-red-50');
            }
        });
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }
    
    /**
     * Limpa validação visual de um campo
     */
    function clearValidation(fieldId) {
        const element = document.getElementById(fieldId);
        if (element) {
            element.classList.remove('border-red-500', 'bg-red-50');
        }
    }
    
    /**
     * Limpa validação visual de todos os campos
     */
    function clearAllValidations(fieldIds) {
        fieldIds.forEach(id => clearValidation(id));
    }
    
    return {
        isValidEmail,
        isValidCPF,
        isValidCNPJ,
        isValidPhone,
        isNotEmpty,
        isPositiveNumber,
        isInRange,
        validateForm,
        clearValidation,
        clearAllValidations
    };
    
})();

// Expor globalmente
if (typeof window !== 'undefined') {
    window.Validators = Validators;
}