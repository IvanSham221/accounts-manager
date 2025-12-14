// users.js
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