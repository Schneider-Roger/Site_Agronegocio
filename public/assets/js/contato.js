document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('form-contato');
    const btnSubmit = form.querySelector('.btn-submit');
    const btnText = btnSubmit.querySelector('.btn-text');
    const btnLoading = btnSubmit.querySelector('.btn-loading');
    const mensagemSucesso = document.getElementById('mensagem-sucesso');
    const mensagemErro = document.getElementById('mensagem-erro');

    // Máscara para telefone
    const telefoneInput = document.getElementById('telefone');
    telefoneInput.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length <= 11) {
            value = value.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
            if (value.length < 14) {
                value = value.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
            }
        }
        e.target.value = value;
    });

    // Validação em tempo real
    const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
    inputs.forEach(input => {
        input.addEventListener('blur', function() {
            validateField(this);
        });

        input.addEventListener('input', function() {
            if (this.classList.contains('error')) {
                validateField(this);
            }
        });
    });

    function validateField(field) {
        const fieldGroup = field.closest('.form-group');
        let isValid = true;
        let errorMessage = '';

        // Remove mensagens de erro anteriores
        const existingError = fieldGroup.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
        field.classList.remove('error');

        // Validação por tipo de campo
        if (field.type === 'email') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (field.value && !emailRegex.test(field.value)) {
                isValid = false;
                errorMessage = 'Por favor, digite um email válido';
            }
        }

        if (field.type === 'tel') {
            const phoneRegex = /^\(\d{2}\)\s\d{4,5}-\d{4}$/;
            if (field.value && !phoneRegex.test(field.value)) {
                isValid = false;
                errorMessage = 'Por favor, digite um telefone válido';
            }
        }

        if (field.required && !field.value.trim()) {
            isValid = false;
            errorMessage = 'Este campo é obrigatório';
        }

        if (!isValid) {
            field.classList.add('error');
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            errorDiv.textContent = errorMessage;
            fieldGroup.appendChild(errorDiv);
        }

        return isValid;
    }

    // Envio do formulário
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Validar todos os campos
        let isFormValid = true;
        inputs.forEach(input => {
            if (!validateField(input)) {
                isFormValid = false;
            }
        });

        // Verificar termos de uso
        const termosCheckbox = document.getElementById('termos');
        if (!termosCheckbox.checked) {
            isFormValid = false;
            alert('Você deve aceitar os Termos de Uso e Política de Privacidade');
        }

        if (!isFormValid) {
            return;
        }

        // Desabilitar botão e mostrar loading
        btnSubmit.disabled = true;
        btnText.style.display = 'none';
        btnLoading.style.display = 'inline';

        // Ocultar mensagens anteriores
        mensagemSucesso.style.display = 'none';
        mensagemErro.style.display = 'none';

        try {
            // Simular envio (substitua pela sua lógica de envio real)
            await enviarFormulario(new FormData(form));
            
            // Sucesso
            mensagemSucesso.style.display = 'block';
            form.reset();
            
            // Scroll para a mensagem de sucesso
            mensagemSucesso.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
            });

        } catch (error) {
            // Erro
            mensagemErro.style.display = 'block';
            console.error('Erro ao enviar formulário:', error);
            
            // Scroll para a mensagem de erro
            mensagemErro.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
            });
        } finally {
            // Reabilitar botão
            btnSubmit.disabled = false;
            btnText.style.display = 'inline';
            btnLoading.style.display = 'none';
        }
    });

    // Função para enviar o formulário (mock)
    async function enviarFormulario(formData) {
        // Simular delay de rede
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Simular 90% de sucesso
        if (Math.random() > 0.1) {
            return { success: true };
        } else {
            throw new Error('Erro simulado');
        }
    }

    // Animações de entrada
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observar elementos para animação
    const elementsToAnimate = document.querySelectorAll('.contato-info, .contato-form, .contato-mapa');
    elementsToAnimate.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });

    // Efeito parallax no background (opcional)
    let ticking = false;

    function updateParallax() {
        const scrolled = window.pageYOffset;
        const parallax = document.querySelector('.contato-main');
        const speed = scrolled * 0.5;
        
        if (parallax) {
            parallax.style.backgroundPosition = `center ${speed}px`;
        }
        
        ticking = false;
    }

    function requestTick() {
        if (!ticking) {
            requestAnimationFrame(updateParallax);
            ticking = true;
        }
    }

    window.addEventListener('scroll', requestTick);

    // Smooth scroll para links internos
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});

// Estilo CSS para mensagens de erro (adiciona dinamicamente)
const style = document.createElement('style');
style.textContent = `
    .form-group input.error,
    .form-group select.error,
    .form-group textarea.error {
        border-color: #f44336;
        box-shadow: 0 0 0 3px rgba(244, 67, 54, 0.1);
    }
    
    .error-message {
        color: #f44336;
        font-size: 0.85rem;
        margin-top: 5px;
        font-family: 'Montserrat', sans-serif;
        animation: fadeInError 0.3s ease;
    }
    
    @keyframes fadeInError {
        from {
            opacity: 0;
            transform: translateY(-10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
`;
document.head.appendChild(style);
