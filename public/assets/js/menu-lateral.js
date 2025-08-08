document.addEventListener('DOMContentLoaded', function() {
    console.log('Menu lateral script carregado');
    
    // Criar elementos do menu lateral se não existirem
    if (!document.querySelector('.menu-sidebar')) {
        createMobileSidebar();
    }
    
    // Configurar eventos
    setupMenuEvents();
});

function createMobileSidebar() {
    console.log('Criando menu sidebar...');
    
    // Criar sidebar
    const sidebar = document.createElement('div');
    sidebar.className = 'menu-sidebar';
    sidebar.innerHTML = `
        <div class="menu-sidebar-header">
            <h3>Menu</h3>
            <button class="menu-sidebar-close" aria-label="Fechar menu">&times;</button>
        </div>
        <div class="menu-sidebar-content">
            <a href="index.html">Home</a>
            <a href="#afeira">A Feira</a>
            <a href="#sobre" class="submenu-item">→ Sobre a Feira</a>
            <a href="#expositores" class="submenu-item">→ Expositores</a>
            <a href="#mapa" class="submenu-item">→ Mapa da Feira</a>
            <a href="#programacao" class="submenu-item">→ Programação</a>
            <a href="#manual" class="submenu-item">→ Manual da Feira</a>
            <a href="#local" class="submenu-item">→ Local</a>
            <a href="galeria.html">Galeria</a>
            <a href="contato.html">Contato</a>
        </div>
        <div class="menu-sidebar-auth">
            <a href="cadastro.html" class="btn btn-outline">Cadastre-se</a>
            <a href="login.html" class="btn btn-solid">Login</a>
        </div>
    `;
    
    // Criar overlay
    const overlay = document.createElement('div');
    overlay.className = 'menu-overlay';
    
    // Adicionar ao DOM
    document.body.appendChild(sidebar);
    document.body.appendChild(overlay);
    
    // Criar botão hamburger
    const container = document.querySelector('.container');
    if (container && !container.querySelector('.menu-toggle')) {
        const menuToggle = document.createElement('button');
        menuToggle.className = 'menu-toggle';
        menuToggle.innerHTML = '☰';
        menuToggle.setAttribute('aria-label', 'Abrir menu');
        container.appendChild(menuToggle);
        console.log('Botão hamburger criado');
    }
}

function setupMenuEvents() {
    console.log('Configurando eventos do menu...');
    
    const menuToggle = document.querySelector('.menu-toggle');
    const menuSidebar = document.querySelector('.menu-sidebar');
    const menuOverlay = document.querySelector('.menu-overlay');
    const menuClose = document.querySelector('.menu-sidebar-close');
    
    function openMenu() {
        console.log('Abrindo menu');
        if (menuSidebar) menuSidebar.classList.add('active');
        if (menuOverlay) menuOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    
    function closeMenu() {
        console.log('Fechando menu');
        if (menuSidebar) menuSidebar.classList.remove('active');
        if (menuOverlay) menuOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }
    
    // Event listeners
    if (menuToggle) {
        menuToggle.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            openMenu();
        });
        console.log('Event listener do botão hamburger configurado');
    }
    
    if (menuClose) {
        menuClose.addEventListener('click', closeMenu);
    }
    
    if (menuOverlay) {
        menuOverlay.addEventListener('click', closeMenu);
    }
    
    // ESC para fechar
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && menuSidebar && menuSidebar.classList.contains('active')) {
            closeMenu();
        }
    });
    
    // Fechar ao clicar em links
    const sidebarLinks = document.querySelectorAll('.menu-sidebar a');
    sidebarLinks.forEach(link => {
        link.addEventListener('click', function() {
            if (!this.getAttribute('href').startsWith('#')) {
                closeMenu();
            }
        });
    });
}
