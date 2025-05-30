/**
 * Авторизация и управление пользователями
 */

// Проверка, вошел ли пользователь в систему
function isLoggedIn() {
    return localStorage.getItem('currentUser') !== null;
}

// Проверка, является ли текущий пользователь администратором
function isAdmin() {
    const currentUser = getCurrentUser();
    return currentUser && currentUser.role === 'admin';
}

// Проверка авторизации (для защиты страниц)
function checkAuth() {
    if (!isLoggedIn()) {
        return false;
    }
    return true;
}

// Вход в систему
function login(username, password) {
    const users = getUsersFromStorage();
    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
        // Исключаем пароль из объекта пользователя для сохранения в localStorage
        const { password, ...userWithoutPassword } = user;
        localStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));
        return true;
    }
    
    return false;
}

// Выход из системы
function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
}

// Получение информации о текущем пользователе
function getCurrentUser() {
    const userJson = localStorage.getItem('currentUser');
    return userJson ? JSON.parse(userJson) : null;
}

// Получение участника гильдии, связанного с текущим пользователем
function getCurrentMember() {
    const currentUser = getCurrentUser();
    if (!currentUser) return null;
    
    const members = getMembersFromStorage();
    return members.find(m => m.userId === currentUser.id);
}

// Обновление интерфейса в зависимости от статуса авторизации
function updateAuthUI() {
    const loggedIn = isLoggedIn();
    const admin = isAdmin();
    
    // Отображение/скрытие элементов в зависимости от статуса авторизации
    document.querySelectorAll('.logged-in-only').forEach(el => {
        el.style.display = loggedIn ? '' : 'none';
    });
    
    document.querySelectorAll('.logged-out-only').forEach(el => {
        el.style.display = loggedIn ? 'none' : '';
    });
    
    // Отображение/скрытие элементов в зависимости от уровня доступа
    document.querySelectorAll('.admin-only').forEach(el => {
        el.style.display = (loggedIn && admin) ? '' : 'none';
    });
    
    // Если пользователь авторизован, добавляем обработчик для кнопки выхода
    if (loggedIn) {
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function(e) {
                e.preventDefault();
                logout();
            });
        }
        
        // Отображение имени пользователя, если есть соответствующий элемент
        const currentUser = getCurrentUser();
        const currentMember = getCurrentMember();
        
        const userDisplayElem = document.getElementById('currentUserDisplay');
        if (userDisplayElem && currentMember) {
            userDisplayElem.textContent = currentMember.nickname;
        }
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    updateAuthUI();
}); 