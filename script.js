// Структуры данных
let games = JSON.parse(localStorage.getItem('games')) || [];
let accounts = JSON.parse(localStorage.getItem('accounts')) || [];
let sales = JSON.parse(localStorage.getItem('sales')) || [];
let users = JSON.parse(localStorage.getItem('users')) || [];
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
let useFirebase = false;
if (typeof firebaseManager !== 'undefined') {
    useFirebase = true;
}

// Создаем демо пользователя если нет пользователей
if (users.length === 0) {
    const demoUser = {
        id: 1,
        username: 'demo',
        password: 'demo123',
        name: 'Демо Пользователь',
        created: new Date().toISOString(),
        active: true
    };
    users.push(demoUser);
    localStorage.setItem('users', JSON.stringify(users));
}

// Простая система аутентификации
class SimpleAuth {
    constructor() {
        this.currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
        this.checkAuth();
    }

    checkAuth() {
        const currentPage = window.location.pathname.split('/').pop();
        
        // Если пользователь не авторизован и не на странице логина
        if (!this.currentUser && currentPage !== 'login.html') {
            this.redirectToLogin();
            return;
        }

        // Если пользователь авторизован и на странице логина
        if (this.currentUser && currentPage === 'login.html') {
            this.redirectToDashboard();
            return;
        }

        // Обновляем интерфейс если пользователь авторизован
        if (this.currentUser) {
            this.updateUI();
        }
    }

    login(username, password) {
        const user = users.find(u => 
            u.username === username && 
            u.password === password && 
            u.active === true
        );

        if (user) {
            this.currentUser = user;
            localStorage.setItem('currentUser', JSON.stringify(user));
            this.redirectToDashboard();
            return true;
        }
        return false;
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
        this.redirectToLogin();
    }

    redirectToLogin() {
        if (!window.location.pathname.includes('login.html')) {
            window.location.href = 'login.html';
        }
    }

    redirectToDashboard() {
        window.location.href = 'manager.html';
    }

    updateUI() {
        // Добавляем информацию о пользователе в навигацию
        const nav = document.querySelector('.nav-buttons');
        if (nav && this.currentUser) {
            const userInfo = document.createElement('div');
            userInfo.className = 'user-info';
            userInfo.innerHTML = `
                <span>👤 ${this.currentUser.name}</span>
                <button onclick="auth.logout()" class="btn btn-small btn-danger">Выйти</button>
            `;
            nav.appendChild(userInfo);
        }
    }

    // Все пользователи имеют одинаковые права
    canAccess(page) {
        return this.currentUser !== null;
    }

    // Проверка прав администратора
    isAdmin() {
        return this.currentUser && this.currentUser.role === 'admin';
    }
}

// Управление работниками
class WorkersManager {
    addWorker(workerData) {
        const existingWorker = users.find(u => u.username === workerData.username);
        if (existingWorker) {
            alert('Работник с таким логином уже существует');
            return false;
        }

        const newWorker = {
            id: Date.now(),
            ...workerData,
            created: new Date().toISOString(),
            active: true
        };

        users.push(newWorker);
        localStorage.setItem('users', JSON.stringify(users));
        return true;
    }

    getWorkers() {
        return users.map(worker => ({
            ...worker,
            password: '••••••••' // Скрываем пароли
        }));
    }

    deleteWorker(workerId) {
        // Не позволяем удалить самого себя
        if (workerId === auth.currentUser.id) {
            alert('Нельзя удалить собственный аккаунт');
            return false;
        }

        const workerIndex = users.findIndex(u => u.id === workerId);
        if (workerIndex === -1) return false;

        users.splice(workerIndex, 1);
        localStorage.setItem('users', JSON.stringify(users));
        return true;
    }
}

// Инициализация систем
const auth = new SimpleAuth();
const workersManager = new WorkersManager();

// Обновляем навигацию во всех HTML файлах
function updateNavigation() {
    let navButtons = `
        <button onclick="location.href='manager.html'" class="btn ${location.pathname.includes('manager.html') ? 'btn-primary' : 'btn-secondary'}">
            <span>🎮</span>
            <span class="nav-text">Панель менеджера</span>
        </button>
        <button onclick="location.href='index.html'" class="btn ${location.pathname.includes('index.html') ? 'btn-primary' : 'btn-secondary'}">
            <span>➕</span>
            <span class="nav-text">Добавить аккаунт</span>
        </button>
        <button onclick="location.href='accounts.html'" class="btn ${location.pathname.includes('accounts.html') ? 'btn-primary' : 'btn-secondary'}">
            <span>📋</span>
            <span class="nav-text">Список аккаунтов</span>
        </button>
        <button onclick="location.href='free-accounts.html'" class="btn ${location.pathname.includes('free-accounts.html') ? 'btn-primary' : 'btn-secondary'}">
            <span>🆓</span>
            <span class="nav-text">Свободные аккаунты</span>
        </button>
        <button onclick="location.href='games.html'" class="btn ${location.pathname.includes('games.html') ? 'btn-primary' : 'btn-secondary'}">
            <span>🎯</span>
            <span class="nav-text">Управление играми</span>
        </button>
        <button onclick="location.href='reports.html'" class="btn ${location.pathname.includes('reports.html') ? 'btn-primary' : 'btn-secondary'}">
            <span>📊</span>
            <span class="nav-text">Отчеты</span>
        </button>
    `;
    
    // Только администратор видит кнопку "Работники"
    if (auth.isAdmin()) {
        navButtons += `
            <button onclick="location.href='workers.html'" class="btn ${location.pathname.includes('workers.html') ? 'btn-primary' : 'btn-secondary'}">
                <span>👑</span>
                <span class="nav-text">Работники</span>
            </button>
        `;
    }
    
    // Добавляем кнопку экспорта CSV (если не на странице логина)
    if (!window.location.pathname.includes('login.html')) {
        navButtons += `
            <button onclick="exportToCSV()" class="btn btn-success">
                <span>📁</span>
                <span class="nav-text">Экспорт CSV</span>
            </button>
        `;
    }
    
    const navElement = document.querySelector('.nav-buttons');
    if (navElement) {
        navElement.innerHTML = navButtons;
        auth.updateUI();
    }
}

// Работающее мобильное меню
function initMobileMenu() {
    const navElement = document.querySelector('.nav-buttons');
    if (!navElement) return;
    
    // Проверяем, не создана ли уже кнопка меню
    if (document.querySelector('.mobile-menu-toggle')) return;
    
    // Создаем кнопку переключения меню
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'mobile-menu-toggle';
    toggleBtn.innerHTML = '☰ Меню навигации';
    toggleBtn.type = 'button';
    toggleBtn.setAttribute('aria-label', 'Открыть меню навигации');
    
    toggleBtn.onclick = function() {
        navElement.classList.toggle('active');
        this.innerHTML = navElement.classList.contains('active') 
            ? '✕ Закрыть меню' 
            : '☰ Меню навигации';
    };
    
    // Вставляем кнопку перед навигацией
    navElement.parentNode.insertBefore(toggleBtn, navElement);
    
    // Автоматически скрываем меню на мобильных устройствах
    if (window.innerWidth <= 768) {
        navElement.classList.remove('active');
    }
    
    // Закрываем меню при клике вне его
    document.addEventListener('click', function(event) {
        if (window.innerWidth > 768) return;
        
        const isClickInsideNav = navElement.contains(event.target);
        const isClickOnToggle = toggleBtn.contains(event.target);
        
        if (!isClickInsideNav && !isClickOnToggle) {
            navElement.classList.remove('active');
            toggleBtn.innerHTML = '☰ Меню навигации';
        }
    });
    
    // Обновляем при изменении размера окна
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768) {
            navElement.classList.add('active');
            toggleBtn.innerHTML = '☰ Меню навигации';
        } else {
            navElement.classList.remove('active');
            toggleBtn.innerHTML = '☰ Меню навигации';
        }
    });
    
    // На больших экранах всегда показываем меню
    if (window.innerWidth > 768) {
        navElement.classList.add('active');
    }
}

// Тема и уведомления
function initUIEnhancements() {
    // Переключатель темы
    const themeToggle = document.createElement('div');
    themeToggle.className = 'theme-toggle';
    themeToggle.innerHTML = `
        <button class="theme-btn" onclick="toggleTheme()">
            <span id="themeIcon">🌙</span>
        </button>
    `;
    document.body.appendChild(themeToggle);
    
    // Проверяем сохраненную тему
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-theme');
        document.getElementById('themeIcon').textContent = '☀️';
    }
    
    // Добавляем анимации при загрузке
    document.addEventListener('DOMContentLoaded', () => {
        document.body.style.opacity = '0';
        document.body.style.transition = 'opacity 0.3s ease-in';
        
        setTimeout(() => {
            document.body.style.opacity = '1';
        }, 100);
    });
}

// Переключение темы
function toggleTheme() {
    const body = document.body;
    const themeIcon = document.getElementById('themeIcon');
    
    body.classList.toggle('dark-theme');
    
    if (body.classList.contains('dark-theme')) {
        themeIcon.textContent = '☀️';
        localStorage.setItem('theme', 'dark');
    } else {
        themeIcon.textContent = '🌙';
        localStorage.setItem('theme', 'light');
    }
}

// Система уведомлений
function showNotification(message, type = 'info', duration = 3000) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    const icons = {
        success: '✅',
        error: '❌',
        info: 'ℹ️',
        warning: '⚠️'
    };
    
    notification.innerHTML = `
        <span>${icons[type] || icons.info}</span>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    // Показываем уведомление
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Скрываем через duration
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 400);
    }, duration);
}

// Инициализация приложения
document.addEventListener('DOMContentLoaded', function() {
    // Проверяем авторизацию на всех страницах кроме login.html
    const currentPage = window.location.pathname.split('/').pop();
    if (currentPage !== 'login.html' && !auth.currentUser) {
        auth.redirectToLogin();
        return;
    }

    // Обновляем навигацию
    updateNavigation();

    // Инициализируем мобильное меню (теперь работает!)
    initMobileMenu();
    
    // Инициализируем улучшения UI
    initUIEnhancements();
    
    // Показываем приветственное уведомление
    if (currentPage !== 'login.html' && auth.currentUser) {
        showNotification(`Добро пожаловать, ${auth.currentUser.name}! 👋`, 'info', 2000);
    }

    // Инициализация специфичных страниц
    if (currentPage === 'index.html' || currentPage === '') {
        loadGamesForSelect();
    } else if (currentPage === 'accounts.html') {
        loadGamesForFilter();
        displayAccounts();
    } else if (currentPage === 'games.html') {
        displayGames();
    } else if (currentPage === 'manager.html') {
        loadGamesForManager();
    } else if (currentPage === 'free-accounts.html') {
        displayFreeAccounts();
    } else if (currentPage === 'reports.html') {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
        document.getElementById('startDate').value = startDate.toISOString().split('T')[0];
        document.getElementById('endDate').value = endDate.toISOString().split('T')[0];
    }
});

// Функции для игр
function addGame() {
    const gameName = document.getElementById('gameName').value.trim();
    if (!gameName) {
        showNotification('Введите название игры', 'warning');
        return;
    }
    
    if (games.find(game => game.name.toLowerCase() === gameName.toLowerCase())) {
        showNotification('Игра с таким названием уже существует', 'error');
        return;
    }
    
    const newGame = {
        id: Date.now(),
        name: gameName,
        created: new Date().toLocaleDateString('ru-RU')
    };
    
    games.push(newGame);
    saveToLocalStorage();
    document.getElementById('gameName').value = '';
    
    if (window.location.pathname.includes('games.html')) {
        displayGames();
    } else {
        loadGamesForSelect();
    }
    
    showNotification(`Игра "${gameName}" успешно добавлена! 🎮`, 'success');
}

function displayGames() {
    const list = document.getElementById('gamesList');
    if (games.length === 0) {
        list.innerHTML = '<div class="empty">Нет добавленных игр</div>';
        return;
    }
    
    list.innerHTML = games.map(game => `
        <div class="item">
            <div class="account-info">
                <strong>${game.name}</strong>
                <div><small>Добавлена: ${game.created}</small></div>
            </div>
            <button class="btn btn-danger btn-small" onclick="deleteGame(${game.id})">🗑️ Удалить</button>
        </div>
    `).join('');
}

function deleteGame(gameId) {
    const accountsWithThisGame = accounts.filter(acc => acc.gameId === gameId);
    const game = games.find(g => g.id === gameId);
    
    if (accountsWithThisGame.length > 0) {
        if (!confirm(`Удалить игру "${game.name}"? ${accountsWithThisGame.length} аккаунт(ов) с этой игрой останутся без привязки.`)) {
            return;
        }
    } else {
        if (!confirm(`Удалить игру "${game.name}"?`)) {
            return;
        }
    }
    
    games = games.filter(game => game.id !== gameId);
    saveToLocalStorage();
    displayGames();
    loadGamesForSelect();
    loadGamesForFilter();
    
    showNotification(`Игра "${game.name}" удалена`, 'info');
}

// Функции для аккаунтов
function addAccount() {
    const formData = getAccountFormData();
    if (!formData) return;
    
    const newAccount = {
        id: Date.now(),
        ...formData,
        created: new Date().toLocaleDateString('ru-RU'),
        timestamp: new Date().toISOString()
    };
    
    accounts.push(newAccount);
    saveToLocalStorage();
    clearAccountForm();
    
    showNotification('Аккаунт успешно добавлен! 🎮', 'success');
}

function getAccountFormData() {
    const gameSelect = document.getElementById('accountGame');
    const gameId = parseInt(gameSelect.value);
    const game = games.find(g => g.id === gameId);
    
    const psnLogin = document.getElementById('psnLogin').value.trim();
    if (!psnLogin) {
        showNotification('Введите логин PSN', 'warning');
        return null;
    }
    
    const gameData = game ? {
        gameId: gameId,
        gameName: game.name
    } : {
        gameId: 0,
        gameName: 'Свободный'
    };

    return {
        ...gameData,
        purchaseAmount: parseFloat(document.getElementById('purchaseAmount').value) || 0,
        psnLogin: psnLogin,
        psnPassword: document.getElementById('psnPassword').value,
        email: document.getElementById('email').value.trim(),
        emailPassword: document.getElementById('emailPassword').value,
        backupEmail: document.getElementById('backupEmail').value.trim(),
        birthDate: document.getElementById('birthDate').value.trim(),
        psnCodes: document.getElementById('psnCodes').value.trim(),
        psnAuthenticator: document.getElementById('psnAuthenticator').value.trim(),
        positions: {
            p2_ps4: parseInt(document.getElementById('p2_ps4').value) || 0,
            p3_ps4: parseInt(document.getElementById('p3_ps4').value) || 0,
            p2_ps5: parseInt(document.getElementById('p2_ps5').value) || 0,
            p3_ps5: parseInt(document.getElementById('p3_ps5').value) || 0
        }
    };
}

function clearAccountForm() {
    document.getElementById('accountGame').selectedIndex = 0;
    document.getElementById('purchaseAmount').value = '';
    document.getElementById('psnLogin').value = '';
    document.getElementById('psnPassword').value = '';
    document.getElementById('email').value = '';
    document.getElementById('emailPassword').value = '';
    document.getElementById('backupEmail').value = '';
    document.getElementById('birthDate').value = '';
    document.getElementById('psnCodes').value = '';
    document.getElementById('psnAuthenticator').value = '';
    document.getElementById('p2_ps4').value = '0';
    document.getElementById('p3_ps4').value = '0';
    document.getElementById('p2_ps5').value = '0';
    document.getElementById('p3_ps5').value = '0';
}

// Функции для отображения аккаунтов
function displayAccounts(accountsToShow = accounts) {
    const list = document.getElementById('accountsList');
    
    if (accountsToShow.length === 0) {
        list.innerHTML = '<div class="empty">Аккаунты не найдены</div>';
        return;
    }
    
    list.innerHTML = accountsToShow.map(account => `
        <div class="account-card">
            <div class="account-header">
                <div class="account-game">${account.gameName}</div>
                <div class="account-price">${account.purchaseAmount} ₽</div>
            </div>
            
            <div class="account-info">
                <div class="info-row">
                    <span class="info-label">Логин PSN:</span>
                    <span class="info-value">${account.psnLogin}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Пароль PSN:</span>
                    <span class="info-value">${account.psnPassword || 'Не указан'}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Коды PSN:</span>
                    <span class="info-value">${account.psnCodes || 'Не указаны'}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Почта:</span>
                    <span class="info-value">${account.email || 'Не указана'}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Пароль почты:</span>
                    <span class="info-value">${account.emailPassword || 'Не указан'}</span>
                </div>
                ${account.birthDate ? `<div class="info-row"><span class="info-label">Дата рождения:</span><span class="info-value">${account.birthDate}</span></div>` : ''}
                ${account.backupEmail ? `<div class="info-row"><span class="info-label">Резервная почта:</span><span class="info-value">${account.backupEmail}</span></div>` : ''}
                ${account.psnAuthenticator ? `<div class="info-row"><span class="info-label">PSN Аутентификатор:</span><span class="info-value">${account.psnAuthenticator}</span></div>` : ''}
            </div>
            
            <div class="positions-info">
                <h4>Позиции:</h4>
                <div class="positions-grid">
                    <div class="position-item"><span>П2 PS4:</span><strong>${account.positions.p2_ps4}</strong></div>
                    <div class="position-item"><span>П3 PS4:</span><strong>${account.positions.p3_ps4}</strong></div>
                    <div class="position-item"><span>П2 PS5:</span><strong>${account.positions.p2_ps5}</strong></div>
                    <div class="position-item"><span>П3 PS5:</span><strong>${account.positions.p3_ps5}</strong></div>
                </div>
            </div>
            
            <div class="account-actions">
                <button class="btn btn-primary btn-small" onclick="editAccount(${account.id})">✏️ Редактировать</button>
                <button class="btn btn-danger btn-small" onclick="deleteAccount(${account.id})">🗑️ Удалить</button>
            </div>
        </div>
    `).join('');
}

// Функция для отображения свободных аккаунтов
function displayFreeAccounts() {
    const freeAccounts = accounts.filter(acc => !acc.gameId || acc.gameId === 0);
    const list = document.getElementById('freeAccountsList');
    
    if (freeAccounts.length === 0) {
        list.innerHTML = '<div class="empty">Нет свободных аккаунтов</div>';
        return;
    }
    
    list.innerHTML = freeAccounts.map(account => `
        <div class="account-card">
            <div class="account-header">
                <div class="account-game" style="color: #e74c3c;">🆓 Свободный</div>
                <div class="account-price">${account.purchaseAmount} ₽</div>
            </div>
            
            <div class="account-info">
                <div class="info-row">
                    <span class="info-label">Логин PSN:</span>
                    <span class="info-value">${account.psnLogin}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Пароль PSN:</span>
                    <span class="info-value">${account.psnPassword || 'Не указан'}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Коды PSN:</span>
                    <span class="info-value">${account.psnCodes || 'Не указаны'}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Почта:</span>
                    <span class="info-value">${account.email || 'Не указана'}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Пароль почты:</span>
                    <span class="info-value">${account.emailPassword || 'Не указан'}</span>
                </div>
                ${account.birthDate ? `<div class="info-row"><span class="info-label">Дата рождения:</span><span class="info-value">${account.birthDate}</span></div>` : ''}
                ${account.backupEmail ? `<div class="info-row"><span class="info-label">Резервная почта:</span><span class="info-value">${account.backupEmail}</span></div>` : ''}
                ${account.psnAuthenticator ? `<div class="info-row"><span class="info-label">PSN Аутентификатор:</span><span class="info-value">${account.psnAuthenticator}</span></div>` : ''}
            </div>
            
            <div class="positions-info">
                <h4>Позиции:</h4>
                <div class="positions-grid">
                    <div class="position-item"><span>П2 PS4:</span><strong>${account.positions.p2_ps4}</strong></div>
                    <div class="position-item"><span>П3 PS4:</span><strong>${account.positions.p3_ps4}</strong></div>
                    <div class="position-item"><span>П2 PS5:</span><strong>${account.positions.p2_ps5}</strong></div>
                    <div class="position-item"><span>П3 PS5:</span><strong>${account.positions.p3_ps5}</strong></div>
                </div>
            </div>
            
            <div class="account-actions">
                <button class="btn btn-success btn-small" onclick="attachGameToAccount(${account.id})">🎮 Привязать игру</button>
                <button class="btn btn-primary btn-small" onclick="editAccount(${account.id})">✏️ Редактировать</button>
                <button class="btn btn-danger btn-small" onclick="deleteAccount(${account.id})">🗑️ Удалить</button>
            </div>
        </div>
    `).join('');
}

// Функция для привязки игры к свободному аккаунту
function attachGameToAccount(accountId) {
    const account = accounts.find(acc => acc.id === accountId);
    if (!account) return;
    
    const editForm = document.getElementById('editFreeForm');
    editForm.innerHTML = `
        <input type="hidden" id="editFreeAccountId" value="${account.id}">
        
        <select id="editFreeGame" class="input" required style="grid-column: 1 / -1;">
            <option value="">Выберите игру</option>
            ${games.map(game => `<option value="${game.id}">${game.name}</option>`).join('')}
        </select>
        
        <input type="number" id="editFreePurchaseAmount" value="${account.purchaseAmount}" placeholder="Сумма закупа" class="input" step="0.01" style="grid-column: 1 / -1;">
        
        <button onclick="saveFreeAccountChanges()" class="btn btn-success" style="grid-column: 1 / -1;">💾 Привязать игру</button>
    `;
    
    document.getElementById('editFreeModal').style.display = 'block';
}

function saveFreeAccountChanges() {
    const accountId = parseInt(document.getElementById('editFreeAccountId').value);
    const accountIndex = accounts.findIndex(acc => acc.id === accountId);
    
    if (accountIndex === -1) return;
    
    const gameSelect = document.getElementById('editFreeGame');
    const gameId = parseInt(gameSelect.value);
    const game = games.find(g => g.id === gameId);
    
    if (!game) {
        showNotification('Выберите игру', 'warning');
        return;
    }
    
    const purchaseAmount = parseFloat(document.getElementById('editFreePurchaseAmount').value) || 0;
    
    accounts[accountIndex] = {
        ...accounts[accountIndex],
        gameId: gameId,
        gameName: game.name,
        purchaseAmount: purchaseAmount
    };
    
    saveToLocalStorage();
    closeFreeModal();
    
    if (window.location.pathname.includes('free-accounts.html')) {
        displayFreeAccounts();
    } else {
        displayAccounts();
    }
    
    showNotification(`Игра "${game.name}" успешно привязана к аккаунту!`, 'success');
}

function closeFreeModal() {
    document.getElementById('editFreeModal').style.display = 'none';
}

// Фильтрация и поиск
function filterAccounts() {
    const gameFilter = document.getElementById('filterGame').value;
    const searchText = document.getElementById('searchAccount').value.toLowerCase();
    
    let filteredAccounts = accounts;
    
    if (gameFilter) {
        filteredAccounts = filteredAccounts.filter(acc => acc.gameId === parseInt(gameFilter));
    }
    
    if (searchText) {
        filteredAccounts = filteredAccounts.filter(acc => 
            acc.psnLogin.toLowerCase().includes(searchText) ||
            (acc.email && acc.email.toLowerCase().includes(searchText))
        );
    }
    
    displayAccounts(filteredAccounts);
    
    if (filteredAccounts.length === 0) {
        showNotification('Аккаунты не найдены', 'info');
    }
}

function clearFilters() {
    document.getElementById('filterGame').selectedIndex = 0;
    document.getElementById('searchAccount').value = '';
    displayAccounts();
    showNotification('Фильтры сброшены', 'info');
}

// Редактирование аккаунта
function editAccount(accountId) {
    const account = accounts.find(acc => acc.id === accountId);
    if (!account) return;
    
    const editForm = document.getElementById('editForm');
    editForm.innerHTML = `
        <input type="hidden" id="editAccountId" value="${account.id}">
        
        <select id="editGame" class="input" required>
            <option value="">Выберите игру</option>
            ${games.map(game => `<option value="${game.id}" ${game.id === account.gameId ? 'selected' : ''}>${game.name}</option>`).join('')}
        </select>
        <input type="number" id="editPurchaseAmount" value="${account.purchaseAmount}" placeholder="Сумма закупа" class="input" step="0.01">
        
        <input type="text" id="editPsnLogin" value="${account.psnLogin}" placeholder="Логин PSN" class="input">
        <input type="text" id="editPsnPassword" value="${account.psnPassword}" placeholder="Пароль PSN" class="input">
        
        <input type="email" id="editEmail" value="${account.email}" placeholder="Почта" class="input">
        <input type="text" id="editEmailPassword" value="${account.emailPassword}" placeholder="Пароль от почты" class="input">
        
        <input type="email" id="editBackupEmail" value="${account.backupEmail || ''}" placeholder="Резервная почта" class="input">
        <input type="text" id="editBirthDate" value="${account.birthDate || ''}" placeholder="Дата рождения" class="input">
        
        <input type="text" id="editPsnCodes" value="${account.psnCodes || ''}" placeholder="Коды PSN (через запятую)" class="input">
        <input type="text" id="editPsnAuthenticator" value="${account.psnAuthenticator || ''}" placeholder="PSN Аутентификатор" class="input">
        
        <div class="positions-section" style="grid-column: 1 / -1;">
            <h3>Количество позиций:</h3>
            <div class="positions-grid">
                <label>П2 PS4: <input type="number" id="editP2_ps4" value="${account.positions.p2_ps4}" class="input-small" min="0"></label>
                <label>П3 PS4: <input type="number" id="editP3_ps4" value="${account.positions.p3_ps4}" class="input-small" min="0"></label>
                <label>П2 PS5: <input type="number" id="editP2_ps5" value="${account.positions.p2_ps5}" class="input-small" min="0"></label>
                <label>П3 PS5: <input type="number" id="editP3_ps5" value="${account.positions.p3_ps5}" class="input-small" min="0"></label>
            </div>
        </div>
        
        <button onclick="saveAccountChanges()" class="btn btn-success" style="grid-column: 1 / -1;">💾 Сохранить изменения</button>
    `;
    
    document.getElementById('editModal').style.display = 'block';
}

function saveAccountChanges() {
    const accountId = parseInt(document.getElementById('editAccountId').value);
    const accountIndex = accounts.findIndex(acc => acc.id === accountId);
    
    if (accountIndex === -1) return;
    
    const gameSelect = document.getElementById('editGame');
    const gameId = parseInt(gameSelect.value);
    const game = games.find(g => g.id === gameId);
    
    if (!game) {
        showNotification('Выберите игру', 'warning');
        return;
    }
    
    const psnLogin = document.getElementById('editPsnLogin').value.trim();
    if (!psnLogin) {
        showNotification('Введите логин PSN', 'warning');
        return;
    }
    
    accounts[accountIndex] = {
        ...accounts[accountIndex],
        gameId: gameId,
        gameName: game.name,
        purchaseAmount: parseFloat(document.getElementById('editPurchaseAmount').value) || 0,
        psnLogin: psnLogin,
        psnPassword: document.getElementById('editPsnPassword').value,
        email: document.getElementById('editEmail').value.trim(),
        emailPassword: document.getElementById('editEmailPassword').value,
        backupEmail: document.getElementById('editBackupEmail').value.trim(),
        birthDate: document.getElementById('editBirthDate').value.trim(),
        psnCodes: document.getElementById('editPsnCodes').value.trim(),
        psnAuthenticator: document.getElementById('editPsnAuthenticator').value.trim(),
        positions: {
            p2_ps4: parseInt(document.getElementById('editP2_ps4').value) || 0,
            p3_ps4: parseInt(document.getElementById('editP3_ps4').value) || 0,
            p2_ps5: parseInt(document.getElementById('editP2_ps5').value) || 0,
            p3_ps5: parseInt(document.getElementById('editP3_ps5').value) || 0
        }
    };
    
    saveToLocalStorage();
    closeModal();
    displayAccounts();
    showNotification('Изменения сохранены! ✅', 'success');
}

function deleteAccount(accountId) {
    const account = accounts.find(acc => acc.id === accountId);
    if (!account) return;
    
    if (confirm(`Удалить аккаунт "${account.psnLogin}"? Это действие нельзя отменить.`)) {
        accounts = accounts.filter(acc => acc.id !== accountId);
        saveToLocalStorage();
        displayAccounts();
        showNotification(`Аккаунт "${account.psnLogin}" удален`, 'info');
    }
}

// Функции для менеджера
function loadGamesForManager() {
    const select = document.getElementById('managerGame');
    if (select) {
        select.innerHTML = '<option value="">Выберите игру</option>' +
            games.map(game => `<option value="${game.id}">${game.name}</option>`).join('');
    }
}

function searchByGame() {
    const gameSelect = document.getElementById('managerGame');
    const gameId = parseInt(gameSelect.value);
    
    if (!gameId) {
        showNotification('Выберите игру для поиска', 'warning');
        return;
    }
    
    const game = games.find(g => g.id === gameId);
    if (!game) {
        showNotification('Игра не найдена', 'error');
        return;
    }
    
    const gameAccounts = accounts.filter(acc => acc.gameId === gameId);
    displaySearchResults(gameAccounts, game.name);
}

function searchByLogin() {
    const loginSearch = document.getElementById('managerLogin').value.trim().toLowerCase();
    
    if (!loginSearch) {
        showNotification('Введите логин для поиска', 'warning');
        return;
    }
    
    const foundAccounts = accounts.filter(acc => 
        acc.psnLogin.toLowerCase().includes(loginSearch)
    );
    
    if (foundAccounts.length === 0) {
        document.getElementById('statsSection').style.display = 'none';
        document.getElementById('searchResults').innerHTML = `
            <div class="empty">
                <h3>Аккаунты с логином "${loginSearch}" не найдены</h3>
            </div>
        `;
        showNotification(`Аккаунты с логином "${loginSearch}" не найдены`, 'info');
        return;
    }
    
    const gamesMap = {};
    foundAccounts.forEach(acc => {
        if (!gamesMap[acc.gameName]) {
            gamesMap[acc.gameName] = [];
        }
        gamesMap[acc.gameName].push(acc);
    });
    
    const statsSection = document.getElementById('statsSection');
    statsSection.style.display = 'block';
    statsSection.innerHTML = `
        <div class="stats-header">
            <h3>🔍 Результаты поиска по логину: "${loginSearch}"</h3>
        </div>
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-value">${foundAccounts.length}</div>
                <div class="stat-label">Найдено аккаунтов</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${Object.keys(gamesMap).length}</div>
                <div class="stat-label">Игр</div>
            </div>
        </div>
        ${Object.keys(gamesMap).length > 1 ? `
            <div class="games-breakdown">
                <h4>Распределение по играм:</h4>
                <div class="games-list">
                    ${Object.entries(gamesMap).map(([gameName, gameAccounts]) => `
                        <div class="game-item">
                            <span class="game-name">${gameName}</span>
                            <span class="game-count">${gameAccounts.length} акк.</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        ` : ''}
    `;
    
    displaySearchResults(foundAccounts, `по логину "${loginSearch}"`);
}

function getPositionSaleInfo(accountId, positionType, positionIndex) {
    const positionId = `${accountId}_${positionType}_${positionIndex}`;
    return sales.find(sale => sale.id === positionId);
}

function displaySearchResults(accountsList, gameName) {
    const resultsContainer = document.getElementById('searchResults');
    const statsSection = document.getElementById('statsSection');
    
    if (accountsList.length === 0) {
        statsSection.style.display = 'none';
        resultsContainer.innerHTML = '<div class="empty">По игре "' + gameName + '" не найдено аккаунтов</div>';
        return;
    }
    
    const totalAccounts = accountsList.length;
    const totalInvestment = accountsList.reduce((sum, acc) => sum + (acc.purchaseAmount || 0), 0);
    const totalPositions = accountsList.reduce((sum, acc) => 
        sum + acc.positions.p2_ps4 + acc.positions.p3_ps4 + acc.positions.p2_ps5 + acc.positions.p3_ps5, 0
    );
    
    const p2_ps4 = accountsList.reduce((sum, acc) => sum + acc.positions.p2_ps4, 0);
    const p3_ps4 = accountsList.reduce((sum, acc) => sum + acc.positions.p3_ps4, 0);
    const p2_ps5 = accountsList.reduce((sum, acc) => sum + acc.positions.p2_ps5, 0);
    const p3_ps5 = accountsList.reduce((sum, acc) => sum + acc.positions.p3_ps5, 0);
    
    statsSection.style.display = 'block';
    statsSection.innerHTML = `
        <div class="stats-header">
            <h3>🎮 Статистика: ${gameName}</h3>
        </div>
        <div class="stats-grid">
            <div class="stat-card"><div class="stat-value">${totalAccounts}</div><div class="stat-label">Аккаунтов</div></div>
            <div class="stat-card"><div class="stat-value">${totalInvestment} ₽</div><div class="stat-label">Сумма закупа</div></div>
            <div class="stat-card"><div class="stat-value">${totalPositions}</div><div class="stat-label">Всего позиций</div></div>
            <div class="stat-card"><div class="stat-value">${p2_ps4}</div><div class="stat-label">П2 PS4</div></div>
            <div class="stat-card"><div class="stat-value">${p3_ps4}</div><div class="stat-label">П3 PS4</div></div>
            <div class="stat-card"><div class="stat-value">${p2_ps5}</div><div class="stat-label">П2 PS5</div></div>
            <div class="stat-card"><div class="stat-value">${p3_ps5}</div><div class="stat-label">П3 PS5</div></div>
        </div>
    `;
    
    resultsContainer.innerHTML = accountsList.map(account => `
        <div class="account-card-manager">
            <div class="account-main">
                <div class="account-login">${account.psnLogin}</div>
                <div class="account-meta">
                    <span class="account-price-manager">${account.purchaseAmount} ₽</span>
                    <span class="account-game-manager">${account.gameName}</span>
                </div>
            </div>
            
            <div class="platforms-container">
                <!-- PS4 -->
                <div class="platform-section">
                    <div class="platform-title">PS4</div>
                    <div class="positions-container">
                        <!-- П2 PS4 -->
                        ${account.positions.p2_ps4 > 0 ? `
                            <div class="position-group">
                                <div class="position-label">П2:</div>
                                <div class="position-buttons">
                                    ${Array(account.positions.p2_ps4).fill().map((_, index) => {
                                        const saleInfo = getPositionSaleInfo(account.id, 'p2_ps4', index + 1);
                                        const isSold = !!saleInfo;
                                        const displayDate = saleInfo ? (saleInfo.datetime || saleInfo.date || '') : '';
                                        return `
                                            <div class="position-single ${isSold ? 'sold' : ''}" 
                                                 onclick="handlePositionClick(${account.id}, 'p2_ps4', 'П2 PS4', ${index + 1})">
                                                ${index + 1}
                                                ${isSold ? `<div class="position-sale-date">${displayDate}</div>` : ''}
                                            </div>
                                        `;
                                    }).join('')}
                                </div>
                            </div>
                        ` : ''}
                        
                        <!-- П3 PS4 -->
                        ${account.positions.p3_ps4 > 0 ? `
                            <div class="position-group">
                                <div class="position-label">П3:</div>
                                <div class="position-buttons">
                                    ${Array(account.positions.p3_ps4).fill().map((_, index) => {
                                        const saleInfo = getPositionSaleInfo(account.id, 'p3_ps4', index + 1);
                                        const isSold = !!saleInfo;
                                        const displayDate = saleInfo ? (saleInfo.datetime || saleInfo.date || '') : '';
                                        return `
                                            <div class="position-single ${isSold ? 'sold' : ''}" 
                                                 onclick="handlePositionClick(${account.id}, 'p3_ps4', 'П3 PS4', ${index + 1})">
                                                ${index + 1}
                                                ${isSold ? `<div class="position-sale-date">${displayDate}</div>` : ''}
                                            </div>
                                        `;
                                    }).join('')}
                                </div>
                            </div>
                        ` : ''}
                        
                        ${account.positions.p2_ps4 === 0 && account.positions.p3_ps4 === 0 ? 
                            '<div class="position-empty">Нет позиций</div>' : ''
                        }
                    </div>
                </div>
                
                <!-- PS5 -->
                <div class="platform-section">
                    <div class="platform-title">PS5</div>
                    <div class="positions-container">
                        <!-- П2 PS5 -->
                        ${account.positions.p2_ps5 > 0 ? `
                            <div class="position-group">
                                <div class="position-label">П2:</div>
                                <div class="position-buttons">
                                    ${Array(account.positions.p2_ps5).fill().map((_, index) => {
                                        const saleInfo = getPositionSaleInfo(account.id, 'p2_ps5', index + 1);
                                        const isSold = !!saleInfo;
                                        const displayDate = saleInfo ? (saleInfo.datetime || saleInfo.date || '') : '';
                                        return `
                                            <div class="position-single ${isSold ? 'sold' : ''}" 
                                                 onclick="handlePositionClick(${account.id}, 'p2_ps5', 'П2 PS5', ${index + 1})">
                                                ${index + 1}
                                                ${isSold ? `<div class="position-sale-date">${displayDate}</div>` : ''}
                                            </div>
                                        `;
                                    }).join('')}
                                </div>
                            </div>
                        ` : ''}
                        
                        <!-- П3 PS5 -->
                        ${account.positions.p3_ps5 > 0 ? `
                            <div class="position-group">
                                <div class="position-label">П3:</div>
                                <div class="position-buttons">
                                    ${Array(account.positions.p3_ps5).fill().map((_, index) => {
                                        const saleInfo = getPositionSaleInfo(account.id, 'p3_ps5', index + 1);
                                        const isSold = !!saleInfo;
                                        const displayDate = saleInfo ? (saleInfo.datetime || saleInfo.date || '') : '';
                                        return `
                                            <div class="position-single ${isSold ? 'sold' : ''}" 
                                                 onclick="handlePositionClick(${account.id}, 'p3_ps5', 'П3 PS5', ${index + 1})">
                                                ${index + 1}
                                                ${isSold ? `<div class="position-sale-date">${displayDate}</div>` : ''}
                                            </div>
                                        `;
                                    }).join('')}
                                </div>
                            </div>
                        ` : ''}
                        
                        ${account.positions.p2_ps5 === 0 && account.positions.p3_ps5 === 0 ? 
                            '<div class="position-empty">Нет позиций</div>' : ''
                        }
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// Функция обработки клика по позиции
function handlePositionClick(accountId, positionType, positionName, positionIndex) {
    const existingSale = getPositionSaleInfo(accountId, positionType, positionIndex);
    if (existingSale) {
        showSaleDetails(existingSale);
    } else {
        openSaleModal(accountId, positionType, positionName, positionIndex);
    }
}

// Функция открытия модального окна продажи
function openSaleModal(accountId, positionType, positionName, positionIndex) {
    const account = accounts.find(acc => acc.id === accountId);
    if (!account) return;
    
    window.currentSaleAccount = accountId;
    window.currentSalePosition = positionType;
    window.currentSalePositionIndex = positionIndex;
    
    // Получаем текущую дату и время
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().slice(0, 5);
    
    const modalContent = document.getElementById('saleModalContent');
    modalContent.innerHTML = `
        <h2>💰 Оформить продажу</h2>
        
        <div class="sale-info">
            <div class="sale-info-item"><strong>Аккаунт:</strong><span>${account.psnLogin}</span></div>
            <div class="sale-info-item"><strong>Игра:</strong><span>${account.gameName}</span></div>
            <div class="sale-info-item"><strong>Позиция:</strong><span>${positionName}</span></div>
        </div>
        
        <div class="sale-form">
            <div><label for="salePrice">Цена продажи (₽):</label><input type="number" id="salePrice" class="sale-input" placeholder="Введите цену" required></div>
            <div class="datetime-group">
                <div>
                    <label for="saleDate">Дата продажи:</label>
                    <input type="date" id="saleDate" class="sale-input" value="${currentDate}">
                </div>
                <div>
                    <label for="saleTime">Время продажи:</label>
                    <input type="time" id="saleTime" class="sale-input" value="${currentTime}">
                </div>
            </div>
            <div><label for="saleNotes">Примечания:</label><input type="text" id="saleNotes" class="sale-input" placeholder="Дополнительная информация"></div>
        </div>
        
        <div class="sale-buttons">
            <button class="btn btn-secondary" onclick="closeSaleModal()">Отмена</button>
            <button class="btn btn-success" onclick="confirmSaleAndShowData()">✅ Подтвердить продажу</button>
        </div>
    `;
    
    document.getElementById('saleModal').style.display = 'block';
}

// Функция: подтверждение продажи и показ данных
function confirmSaleAndShowData() {
    const salePrice = document.getElementById('salePrice').value;
    const saleDate = document.getElementById('saleDate').value;
    const saleTime = document.getElementById('saleTime').value;
    const saleNotes = document.getElementById('saleNotes').value;
    
    if (!salePrice) {
        showNotification('Введите цену продажи', 'warning');
        return;
    }
    
    // Объединяем дату и время
    const saleDateTime = saleDate && saleTime ? `${saleDate} ${saleTime}` : new Date().toLocaleString('ru-RU');
    
    // Сначала записываем продажу
    const accountIndex = accounts.findIndex(acc => acc.id === window.currentSaleAccount);
    if (accountIndex === -1) return;
    
    const positionId = `${window.currentSaleAccount}_${window.currentSalePosition}_${window.currentSalePositionIndex}`;
    
    const newSale = {
        id: positionId,
        accountId: window.currentSaleAccount,
        accountLogin: accounts[accountIndex].psnLogin,
        gameName: accounts[accountIndex].gameName,
        positionType: window.currentSalePosition,
        positionName: getPositionName(window.currentSalePosition),
        price: parseFloat(salePrice),
        date: saleDate || new Date().toISOString().split('T')[0],
        time: saleTime || new Date().toTimeString().slice(0, 5),
        datetime: saleDateTime,
        notes: saleNotes,
        timestamp: new Date().toISOString(),
        sold: true,
        positionIndex: window.currentSalePositionIndex
    };
    
    sales.push(newSale);
    localStorage.setItem('sales', JSON.stringify(sales));
    
    // Теперь показываем данные аккаунта
    showAccountDataAfterSale(window.currentSaleAccount);
}

// Функция показа данных аккаунта после продажи
function showAccountDataAfterSale(accountId) {
    const account = accounts.find(acc => acc.id === accountId);
    if (!account) return;

    // Получаем коды и берем первый доступный
    const psnCodesArray = account.psnCodes ? account.psnCodes.split(',').map(code => code.trim()).filter(code => code !== '') : [];
    const currentCode = psnCodesArray.length > 0 ? psnCodesArray[0] : 'По запросу';
    
    // Если есть коды, удаляем использованный из аккаунта
    if (psnCodesArray.length > 0) {
        psnCodesArray.shift();
        const updatedCodes = psnCodesArray.join(', ');
        
        const accountIndex = accounts.findIndex(acc => acc.id === accountId);
        if (accountIndex !== -1) {
            accounts[accountIndex].psnCodes = updatedCodes;
            saveToLocalStorage();
        }
    }

    const modalContent = document.getElementById('saleModalContent');
    modalContent.innerHTML = `
        <h2>✅ Продажа оформлена!</h2>
        
        <div class="order-info">
            <h3>Данные для клиента:</h3>
            <div class="order-data">
                <pre>Игра: ${account.gameName}
Логин PSN: ${account.psnLogin}
Пароль PSN: ${account.psnPassword || 'Не указан'}
Код аутентификации PSN: ${currentCode}</pre>
            </div>
            
            ${psnCodesArray.length > 0 ? `
                <div class="remaining-codes">
                    <h4>📋 Оставшиеся коды (${psnCodesArray.length}):</h4>
                    <div class="codes-list">
                        ${psnCodesArray.map(code => `
                            <div class="code-item">${code}</div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
        </div>
        
        <div class="order-buttons">
            <button class="btn btn-success" onclick="copyAccountData()">📋 Скопировать данные</button>
            <button class="btn btn-primary" onclick="closeSaleModalAndRefresh()">Готово</button>
        </div>
    `;
    
    window.currentOrderData = `Игра: ${account.gameName}
Логин PSN: ${account.psnLogin}
Пароль PSN: ${account.psnPassword || 'Не указан'}
Код аутентификации PSN: ${currentCode}`;
}

// Функция копирования данных в буфер обмена
function copyAccountData() {
    if (!window.currentOrderData) return;
    
    navigator.clipboard.writeText(window.currentOrderData).then(() => {
        showNotification('Данные скопированы в буфер обмена! 📋', 'success');
    }).catch(err => {
        const textArea = document.createElement('textarea');
        textArea.value = window.currentOrderData;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showNotification('Данные скопированы в буфер обмена! 📋', 'success');
    });
}

// Функция закрытия модального окна и обновления интерфейса
function closeSaleModalAndRefresh() {
    closeSaleModal();
    
    const gameSelect = document.getElementById('managerGame');
    const gameId = parseInt(gameSelect.value);
    if (gameId) {
        const gameAccounts = accounts.filter(acc => acc.gameId === gameId);
        const game = games.find(g => g.id === gameId);
        if (game) {
            displaySearchResults(gameAccounts, game.name);
        }
    }
}

// Функция для просмотра деталей продажи
function showSaleDetails(sale) {
    const modalContent = document.getElementById('saleModalContent');
    
    const saleDate = sale.date || new Date(sale.timestamp).toISOString().split('T')[0];
    const saleTime = sale.time || new Date(sale.timestamp).toTimeString().slice(0, 5);
    
    modalContent.innerHTML = `
        <h2>💰 Информация о продаже</h2>
        
        <div class="sale-info">
            <div class="sale-info-item"><strong>Аккаунт:</strong><span>${sale.accountLogin}</span></div>
            <div class="sale-info-item"><strong>Игра:</strong><span>${sale.gameName}</span></div>
            <div class="sale-info-item"><strong>Позиция:</strong><span>${sale.positionName}</span></div>
        </div>
        
        <div class="sale-form">
            <div><label for="editSalePrice">Цена продажи (₽):</label><input type="number" id="editSalePrice" class="sale-input" value="${sale.price}" required></div>
            <div class="datetime-group">
                <div>
                    <label for="editSaleDate">Дата продажи:</label>
                    <input type="date" id="editSaleDate" class="sale-input" value="${saleDate}">
                </div>
                <div>
                    <label for="editSaleTime">Время продажи:</label>
                    <input type="time" id="editSaleTime" class="sale-input" value="${saleTime}">
                </div>
            </div>
            <div><label for="editSaleNotes">Примечания:</label><input type="text" id="editSaleNotes" class="sale-input" value="${sale.notes || ''}" placeholder="Дополнительная информация"></div>
        </div>
        
        <div class="sale-buttons">
            <button class="btn btn-secondary" onclick="closeSaleModal()">Отмена</button>
            <button class="btn btn-primary" onclick="updateSaleDetails('${sale.id}')">💾 Сохранить изменения</button>
            <button class="btn btn-danger" onclick="deleteSale('${sale.id}')">🗑️ Удалить продажу</button>
        </div>
    `;
    
    document.getElementById('saleModal').style.display = 'block';
}

// Функция обновления деталей продажи
function updateSaleDetails(saleId) {
    const salePrice = document.getElementById('editSalePrice').value;
    const saleDate = document.getElementById('editSaleDate').value;
    const saleTime = document.getElementById('editSaleTime').value;
    const saleNotes = document.getElementById('editSaleNotes').value;
    
    if (!salePrice) {
        showNotification('Введите цену продажи', 'warning');
        return;
    }
    
    const saleDateTime = saleDate && saleTime ? `${saleDate} ${saleTime}` : '';
    
    const saleIndex = sales.findIndex(s => s.id === saleId);
    if (saleIndex !== -1) {
        sales[saleIndex] = {
            ...sales[saleIndex],
            price: parseFloat(salePrice),
            date: saleDate,
            time: saleTime,
            datetime: saleDateTime,
            notes: saleNotes
        };
        
        localStorage.setItem('sales', JSON.stringify(sales));
        closeSaleModal();
        
        const gameSelect = document.getElementById('managerGame');
        const gameId = parseInt(gameSelect.value);
        if (gameId) {
            const gameAccounts = accounts.filter(acc => acc.gameId === gameId);
            const game = games.find(g => g.id === gameId);
            if (game) {
                displaySearchResults(gameAccounts, game.name);
            }
        }
        
        showNotification('Данные продажи обновлены! 💾', 'success');
    }
}

// Функция удаления продажи
function deleteSale(saleId) {
    if (confirm('Удалить запись о продаже? Это действие нельзя отменить.')) {
        sales = sales.filter(sale => sale.id !== saleId);
        localStorage.setItem('sales', JSON.stringify(sales));
        closeSaleModal();
        
        const gameSelect = document.getElementById('managerGame');
        const gameId = parseInt(gameSelect.value);
        if (gameId) {
            const gameAccounts = accounts.filter(acc => acc.gameId === gameId);
            const game = games.find(g => g.id === gameId);
            if (game) {
                displaySearchResults(gameAccounts, game.name);
            }
        }
        
        showNotification('Продажа удалена! 🗑️', 'info');
    }
}

function getPositionName(positionType) {
    const names = {
        'p2_ps4': 'П2 PS4',
        'p3_ps4': 'П3 PS4', 
        'p2_ps5': 'П2 PS5',
        'p3_ps5': 'П3 PS5'
    };
    return names[positionType] || positionType;
}

function closeSaleModal() {
    document.getElementById('saleModal').style.display = 'none';
}

function clearManagerSearch() {
    document.getElementById('managerGame').selectedIndex = 0;
    document.getElementById('managerLogin').value = '';
    document.getElementById('statsSection').style.display = 'none';
    document.getElementById('searchResults').innerHTML = '';
    showNotification('Поиск очищен', 'info');
}

// Функции для отчетов
function generateReport() {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    
    if (!startDate || !endDate) {
        showNotification('Выберите начальную и конечную дату', 'warning');
        return;
    }
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    
    if (start > end) {
        showNotification('Начальная дата не может быть больше конечной', 'error');
        return;
    }
    
    const periodSales = sales.filter(sale => {
        const saleDate = new Date(sale.timestamp);
        return saleDate >= start && saleDate <= end;
    });
    
    displayReportResults(periodSales, startDate, endDate);
}

function generateFullReport() {
    displayReportResults(sales, 'все время', 'все время');
}

function displayReportResults(salesData, startDate, endDate) {
    const reportResults = document.getElementById('reportResults');
    
    if (salesData.length === 0) {
        reportResults.innerHTML = `
            <div class="section">
                <h2>📊 Отчет за период: ${startDate} - ${endDate}</h2>
                <div class="empty">Нет продаж за выбранный период</div>
            </div>
        `;
        return;
    }
    
    // Рассчитываем прибыль для каждой продажи
    const salesWithProfit = salesData.map(sale => {
        const account = accounts.find(acc => acc.id === sale.accountId);
        if (!account) {
            return { ...sale, cost: 0, profit: sale.price, profitMargin: 100 };
        }
        
        const totalPositions = account.positions.p2_ps4 + account.positions.p3_ps4 + 
                              account.positions.p2_ps5 + account.positions.p3_ps5;
        
        const costPerPosition = totalPositions > 0 ? (account.purchaseAmount || 0) / totalPositions : 0;
        const cost = costPerPosition;
        const profit = sale.price - cost;
        const profitMargin = sale.price > 0 ? (profit / sale.price) * 100 : 0;
        
        return {
            ...sale,
            cost: cost,
            profit: profit,
            profitMargin: profitMargin
        };
    });
    
    // Общая статистика
    const totalRevenue = salesWithProfit.reduce((sum, sale) => sum + sale.price, 0);
    const totalCost = salesWithProfit.reduce((sum, sale) => sum + sale.cost, 0);
    const totalProfit = salesWithProfit.reduce((sum, sale) => sum + sale.profit, 0);
    const totalSales = salesWithProfit.length;
    const avgSale = totalRevenue / totalSales;
    const avgProfit = totalProfit / totalSales;
    const totalProfitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
    
    // Статистика по играм
    const gamesStats = {};
    salesWithProfit.forEach(sale => {
        if (!gamesStats[sale.gameName]) {
            gamesStats[sale.gameName] = {
                revenue: 0,
                cost: 0,
                profit: 0,
                sales: 0
            };
        }
        gamesStats[sale.gameName].revenue += sale.price;
        gamesStats[sale.gameName].cost += sale.cost;
        gamesStats[sale.gameName].profit += sale.profit;
        gamesStats[sale.gameName].sales += 1;
    });
    
    // Ежедневная статистика
    const dailyStats = {};
    salesWithProfit.forEach(sale => {
        const saleDate = sale.date || new Date(sale.timestamp).toISOString().split('T')[0];
        if (!dailyStats[saleDate]) {
            dailyStats[saleDate] = {
                revenue: 0,
                cost: 0,
                profit: 0,
                sales: 0
            };
        }
        dailyStats[saleDate].revenue += sale.price;
        dailyStats[saleDate].cost += sale.cost;
        dailyStats[saleDate].profit += sale.profit;
        dailyStats[saleDate].sales += 1;
    });
    
    // Сортируем игры по прибыли
    const sortedGames = Object.entries(gamesStats)
        .sort(([,a], [,b]) => b.profit - a.profit);
    
    // Сортируем дни по дате
    const sortedDays = Object.entries(dailyStats)
        .sort(([a], [b]) => new Date(b) - new Date(a));
    
    reportResults.innerHTML = `
        <div class="section">
            <h2>📊 Отчет за период: ${startDate} - ${endDate}</h2>
            
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-value">${totalRevenue.toFixed(0)} ₽</div>
                    <div class="stat-label">Общая выручка</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${totalCost.toFixed(0)} ₽</div>
                    <div class="stat-label">Себестоимость</div>
                </div>
                <div class="stat-card ${totalProfit >= 0 ? 'profit-positive' : 'profit-negative'}">
                    <div class="stat-value">${totalProfit.toFixed(0)} ₽</div>
                    <div class="stat-label">Чистая прибыль</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${totalProfitMargin.toFixed(1)}%</div>
                    <div class="stat-label">Рентабельность</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${totalSales}</div>
                    <div class="stat-label">Всего продаж</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${avgSale.toFixed(0)} ₽</div>
                    <div class="stat-label">Средний чек</div>
                </div>
                <div class="stat-card ${avgProfit >= 0 ? 'profit-positive' : 'profit-negative'}">
                    <div class="stat-value">${avgProfit.toFixed(0)} ₽</div>
                    <div class="stat-label">Средняя прибыль</div>
                </div>
            </div>
        </div>
        
        <div class="section">
            <h3>🎮 Статистика по играм</h3>
            <div class="games-report">
                ${sortedGames.map(([gameName, stats]) => {
                    const gameProfitMargin = stats.revenue > 0 ? (stats.profit / stats.revenue) * 100 : 0;
                    return `
                    <div class="game-report-card">
                        <div class="game-report-header">
                            <div class="game-name">${gameName}</div>
                            <div class="game-revenue ${stats.profit >= 0 ? 'profit-positive' : 'profit-negative'}">${stats.profit.toFixed(0)} ₽</div>
                        </div>
                        <div class="game-report-details">
                            <div class="game-stat">
                                <span class="stat-label">Выручка:</span>
                                <span class="stat-value">${stats.revenue.toFixed(0)} ₽</span>
                            </div>
                            <div class="game-stat">
                                <span class="stat-label">Себестоимость:</span>
                                <span class="stat-value">${stats.cost.toFixed(0)} ₽</span>
                            </div>
                            <div class="game-stat">
                                <span class="stat-label">Прибыль:</span>
                                <span class="stat-value ${stats.profit >= 0 ? 'profit-positive' : 'profit-negative'}">${stats.profit.toFixed(0)} ₽</span>
                            </div>
                            <div class="game-stat">
                                <span class="stat-label">Рентабельность:</span>
                                <span class="stat-value">${gameProfitMargin.toFixed(1)}%</span>
                            </div>
                            <div class="game-stat">
                                <span class="stat-label">Продажи:</span>
                                <span class="stat-value">${stats.sales}</span>
                            </div>
                        </div>
                    </div>
                    `;
                }).join('')}
            </div>
        </div>
        
        <div class="section">
            <h3>📅 Ежедневная статистика</h3>
            <div class="daily-report">
                ${sortedDays.map(([date, stats]) => {
                    const dailyProfitMargin = stats.revenue > 0 ? (stats.profit / stats.revenue) * 100 : 0;
                    return `
                    <div class="daily-report-card">
                        <div class="daily-date">${date}</div>
                        <div class="daily-stats">
                            <div class="daily-stat">
                                <span>Выручка:</span>
                                <strong>${stats.revenue.toFixed(0)} ₽</strong>
                            </div>
                            <div class="daily-stat">
                                <span>Себестоимость:</span>
                                <strong>${stats.cost.toFixed(0)} ₽</strong>
                            </div>
                            <div class="daily-stat ${stats.profit >= 0 ? 'profit-positive' : 'profit-negative'}">
                                <span>Прибыль:</span>
                                <strong>${stats.profit.toFixed(0)} ₽</strong>
                            </div>
                            <div class="daily-stat">
                                <span>Рентабельность:</span>
                                <strong>${dailyProfitMargin.toFixed(1)}%</strong>
                            </div>
                            <div class="daily-stat">
                                <span>Продажи:</span>
                                <strong>${stats.sales}</strong>
                            </div>
                        </div>
                    </div>
                    `;
                }).join('')}
            </div>
        </div>
        
        <div class="section">
            <h3>💰 Все продажи</h3>
            <div class="sales-list">
                ${salesWithProfit.map(sale => `
                    <div class="sale-item ${sale.profit >= 0 ? 'profit-positive' : 'profit-negative'}">
                        <div class="sale-header">
                            <div class="sale-game">${sale.gameName} - ${sale.positionName}</div>
                            <div class="sale-price">${sale.price} ₽</div>
                        </div>
                        <div class="sale-details">
                            <div class="sale-info">
                                <span class="info-label">Аккаунт:</span>
                                <span class="info-value">${sale.accountLogin}</span>
                            </div>
                            <div class="sale-info">
                                <span class="info-label">Себестоимость:</span>
                                <span class="info-value">${sale.cost.toFixed(0)} ₽</span>
                            </div>
                            <div class="sale-info ${sale.profit >= 0 ? 'profit-positive' : 'profit-negative'}">
                                <span class="info-label">Прибыль:</span>
                                <span class="info-value">${sale.profit.toFixed(0)} ₽ (${sale.profitMargin.toFixed(1)}%)</span>
                            </div>
                            <div class="sale-info">
                                <span class="info-label">Дата:</span>
                                <span class="info-value">${sale.datetime || sale.date || ''}</span>
                            </div>
                            ${sale.notes ? `
                                <div class="sale-info">
                                    <span class="info-label">Примечания:</span>
                                    <span class="info-value">${sale.notes}</span>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    showNotification(`Отчет за ${startDate} - ${endDate} сгенерирован 📊`, 'success');
}

// Вспомогательные функции
function loadGamesForSelect() {
    const select = document.getElementById('accountGame');
    if (select) {
        select.innerHTML = '<option value="">Выберите игру</option>' +
            games.map(game => `<option value="${game.id}">${game.name}</option>`).join('');
    }
}

function loadGamesForFilter() {
    const filter = document.getElementById('filterGame');
    if (filter) {
        filter.innerHTML = '<option value="">Все игры</option>' +
            games.map(game => `<option value="${game.id}">${game.name}</option>`).join('');
    }
}

function closeModal() {
    document.getElementById('editModal').style.display = 'none';
}

function saveToLocalStorage() {
    localStorage.setItem('games', JSON.stringify(games));
    localStorage.setItem('accounts', JSON.stringify(accounts));
    localStorage.setItem('sales', JSON.stringify(sales));
    localStorage.setItem('users', JSON.stringify(users));
}

// Экспорт данных
function exportToCSV() {
    if (accounts.length === 0) {
        showNotification('Нет данных для экспорта', 'warning');
        return;
    }
    
    const headers = ['Игра', 'Логин PSN', 'Пароль PSN', 'Почта', 'Пароль почты', 'Сумма закупа', 'Коды PSN', 'Дата добавления'];
    const csvRows = [];
    
    csvRows.push(headers.join(','));
    
    accounts.forEach(account => {
        const row = [
            `"${account.gameName}"`,
            `"${account.psnLogin}"`,
            `"${account.psnPassword || ''}"`,
            `"${account.email || ''}"`,
            `"${account.emailPassword || ''}"`,
            account.purchaseAmount || 0,
            `"${account.psnCodes || ''}"`,
            `"${account.created}"`
        ];
        csvRows.push(row.join(','));
    });
    
    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (navigator.msSaveBlob) {
        navigator.msSaveBlob(blob, 'accounts.csv');
    } else {
        link.href = URL.createObjectURL(blob);
        link.download = 'accounts.csv';
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    
    showNotification('Данные экспортированы в CSV 📁', 'success');
}

// Обработчики кликов вне модальных окон
window.onclick = function(event) {
    const editModal = document.getElementById('editModal');
    const saleModal = document.getElementById('saleModal');
    const editFreeModal = document.getElementById('editFreeModal');
    
    if (event.target === editModal) closeModal();
    if (event.target === saleModal) closeSaleModal();
    if (event.target === editFreeModal) closeFreeModal();
}

// Горячие клавиши
document.addEventListener('keydown', function(e) {
    // ESC закрывает модальные окна
    if (e.key === 'Escape') {
        closeModal();
        closeSaleModal();
        closeFreeModal();
    }
    
    // Ctrl+S - сохранить
    if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        if (document.getElementById('editAccountId')) {
            saveAccountChanges();
        }
    }
});