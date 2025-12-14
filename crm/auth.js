// auth.js
let users = JSON.parse(localStorage.getItem('users')) || [];
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;

// Создаем администратора по умолчанию если нет пользователей
if (users.length === 0) {
    const adminUser = {
        id: 1,
        username: 'admin',
        password: '@Az27831501112',
        name: 'Администратор',
        role: 'admin',
        created: new Date().toISOString(),
        active: true
    };
    users.push(adminUser);
    localStorage.setItem('users', JSON.stringify(users));
}

class SimpleAuth {
    constructor() {
        this.currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
        this.checkAuth();
    }

    checkAuth() {
        const currentPage = window.location.pathname.split('/').pop();
        
        if (!this.currentUser && currentPage !== 'login.html' && currentPage !== 'index.html') {
            this.redirectToLogin();
            return;
        }

        if (this.currentUser && (currentPage === 'login.html' || currentPage === 'index.html')) {
            this.redirectToDashboard();
            return;
        }

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
        window.location.href = 'login.html';
    }

    redirectToDashboard() {
        window.location.href = 'manager.html';
    }

    updateUI() {
        const nav = document.querySelector('.nav-buttons');
        if (nav && this.currentUser) {
            const userRole = this.currentUser.role === 'admin' ? '👑 Администратор' : '👷 Работник';
            const userInfo = document.createElement('div');
            userInfo.className = 'user-info';
            userInfo.innerHTML = `
                <span>${userRole}: ${this.currentUser.name}</span>
                <button onclick="auth.logout()" class="btn btn-small btn-danger">Выйти</button>
            `;
            nav.appendChild(userInfo);
        }
    }

    isAdmin() {
        return this.currentUser && this.currentUser.role === 'admin';
    }

    canAccess(page) {
        return this.currentUser !== null;
    }
}

const auth = new SimpleAuth();