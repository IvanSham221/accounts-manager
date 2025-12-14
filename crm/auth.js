// auth.js
class SimpleAuth {
    constructor() {
        this.currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
        this.checkAuth();
    }

    checkAuth() {
        const currentPage = window.location.pathname.split('/').pop();
        
        if (!this.currentUser && currentPage !== 'login.html') {
            this.redirectToLogin();
            return;
        }

        if (this.currentUser && currentPage === 'login.html') {
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
        if (!window.location.pathname.includes('login.html')) {
            window.location.href = 'login.html';
        }
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

    // Проверка прав доступа
    isAdmin() {
        return this.currentUser && this.currentUser.role === 'admin';
    }

    canAccess(page) {
        return this.currentUser !== null;
    }
}

const auth = new SimpleAuth();