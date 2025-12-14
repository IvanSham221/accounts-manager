// firebase.js
const firebaseConfig = {
    apiKey: "ТВОЙ_API_KEY",
    authDomain: "ТВОЙ_PROJECT.firebaseapp.com",
    databaseURL: "https://ТВОЙ_PROJECT-default-rtdb.firebaseio.com",
    projectId: "ТВОЙ_PROJECT",
    storageBucket: "ТВОЙ_PROJECT.appspot.com",
    messagingSenderId: "ТВОЙ_SENDER_ID",
    appId: "ТВОЙ_APP_ID"
};

// Инициализация Firebase
firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const database = firebase.database();

// Класс для работы с синхронизацией
class FirebaseManager {
    constructor() {
        this.currentUser = null;
        this.setupAuthListener();
        this.isOnline = navigator.onLine;
        this.setupOfflineMode();
    }

    // Слушатель изменения статуса авторизации
    setupAuthListener() {
        auth.onAuthStateChanged((user) => {
            this.currentUser = user;
            if (user) {
                console.log('✅ Пользователь авторизован:', user.email);
                this.startDataSync();
                this.showNotification('Синхронизация включена', 'success');
            } else {
                console.log('⚠️ Пользователь не авторизован');
                this.showNotification('Работа в оффлайн режиме', 'info');
            }
        });
    }

    // Режим оффлайн
    setupOfflineMode() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            if (this.currentUser) {
                this.syncLocalToFirebase();
            }
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.showNotification('Нет подключения к интернету', 'warning');
        });
    }

    // Регистрация нового пользователя
    async register(email, password, name) {
        try {
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            await userCredential.user.updateProfile({ displayName: name });
            
            // Создаем структуру данных для нового пользователя
            await database.ref(`users/${userCredential.user.uid}`).set({
                info: {
                    email: email,
                    name: name,
                    created: new Date().toISOString(),
                    role: 'user'
                },
                games: [],
                accounts: [],
                sales: []
            });

            this.showNotification('Аккаунт создан!', 'success');
            return { success: true, user: userCredential.user };
        } catch (error) {
            console.error('Ошибка регистрации:', error);
            this.showNotification(`Ошибка: ${error.message}`, 'error');
            return { success: false, error: error.message };
        }
    }

    // Вход
    async login(email, password) {
        try {
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            this.showNotification('Вход выполнен', 'success');
            return { success: true, user: userCredential.user };
        } catch (error) {
            console.error('Ошибка входа:', error);
            this.showNotification(`Ошибка: ${error.message}`, 'error');
            return { success: false, error: error.message };
        }
    }

    // Выход
    async logout() {
        try {
            await auth.signOut();
            this.showNotification('Выход выполнен', 'info');
            return { success: true };
        } catch (error) {
            console.error('Ошибка выхода:', error);
            return { success: false, error: error.message };
        }
    }

    // Начало синхронизации данных
    startDataSync() {
        if (!this.currentUser) return;

        const userId = this.currentUser.uid;
        
        // Слушаем изменения игр
        database.ref(`users/${userId}/games`).on('value', (snapshot) => {
            const games = snapshot.val() || [];
            localStorage.setItem('games', JSON.stringify(games));
            
            // Обновляем UI если функции существуют
            if (typeof loadGamesForSelect === 'function') loadGamesForSelect();
            if (typeof loadGamesForFilter === 'function') loadGamesForFilter();
            if (typeof loadGamesForManager === 'function') loadGamesForManager();
            if (typeof displayGames === 'function') displayGames();
        });

        // Слушаем изменения аккаунтов
        database.ref(`users/${userId}/accounts`).on('value', (snapshot) => {
            const accounts = snapshot.val() || [];
            localStorage.setItem('accounts', JSON.stringify(accounts));
            
            if (typeof displayAccounts === 'function') displayAccounts();
            if (typeof displayFreeAccounts === 'function') displayFreeAccounts();
        });

        // Слушаем изменения продаж
        database.ref(`users/${userId}/sales`).on('value', (snapshot) => {
            const sales = snapshot.val() || [];
            localStorage.setItem('sales', JSON.stringify(sales));
        });

        console.log('🎯 Синхронизация данных запущена');
    }

    // Сохранение данных в Firebase
    async saveData(dataType, data) {
        if (!this.currentUser) {
            // Сохраняем локально если нет авторизации
            localStorage.setItem(dataType, JSON.stringify(data));
            return { success: true, local: true };
        }

        if (!this.isOnline) {
            // Оффлайн режим
            localStorage.setItem(`offline_${dataType}`, JSON.stringify(data));
            localStorage.setItem(dataType, JSON.stringify(data));
            return { success: true, offline: true };
        }

        try {
            await database.ref(`users/${this.currentUser.uid}/${dataType}`).set(data);
            localStorage.setItem(dataType, JSON.stringify(data));
            return { success: true, synced: true };
        } catch (error) {
            console.error(`Ошибка сохранения ${dataType}:`, error);
            // Fallback на localStorage
            localStorage.setItem(dataType, JSON.stringify(data));
            return { success: true, local: true };
        }
    }

    // Синхронизация локальных данных с Firebase (при восстановлении связи)
    async syncLocalToFirebase() {
        if (!this.currentUser || !this.isOnline) return;

        const dataTypes = ['games', 'accounts', 'sales'];
        
        for (const type of dataTypes) {
            const offlineData = localStorage.getItem(`offline_${type}`);
            if (offlineData) {
                try {
                    const data = JSON.parse(offlineData);
                    await database.ref(`users/${this.currentUser.uid}/${type}`).set(data);
                    localStorage.removeItem(`offline_${type}`);
                    console.log(`✅ Синхронизировано ${type} после оффлайн`);
                } catch (error) {
                    console.error(`Ошибка синхронизации ${type}:`, error);
                }
            }
        }
    }

    // Уведомления
    showNotification(message, type = 'info') {
        if (typeof showNotification === 'function') {
            showNotification(message, type);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }

    // Получение текущего пользователя
    getCurrentUser() {
        return this.currentUser ? {
            uid: this.currentUser.uid,
            email: this.currentUser.email,
            name: this.currentUser.displayName
        } : null;
    }

    // Проверка админа
    isAdmin() {
        // Пока простой чек - первый пользователь админ
        // Позже можно добавить роли в Firebase
        return this.currentUser && this.currentUser.email === 'admin@example.com';
    }
}

// Создаем глобальный экземпляр
const firebaseManager = new FirebaseManager();