/**
 * Авторизация и управление пользователями
 */

// Функция проверки авторизации
function isLoggedIn() {
    return firebase.auth().currentUser !== null;
}

// Функция проверки прав администратора
async function isAdmin() {
    const user = firebase.auth().currentUser;
    if (!user) return false;
    
    const userDoc = await firebase.firestore()
        .collection('users')
        .doc(user.uid)
        .get();
    
    return userDoc.exists && userDoc.data().role === 'admin';
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
    firebase.auth().signOut().then(() => {
        localStorage.removeItem('user');
        window.location.href = 'login.html';
    });
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

    // Проверяем состояние авторизации
    firebase.auth().onAuthStateChanged(function(user) {
        const currentPage = window.location.pathname.split('/').pop();
        
        if (user) {
            // Пользователь авторизован
            // Перенаправляем на главную, только если не на страницах входа/регистрации
            if (currentPage !== 'login.html' && currentPage !== 'register.html') {
                firebase.firestore()
                    .collection('users')
                    .doc(user.uid)
                    .get()
                    .then((doc) => {
                        if (doc.exists) {
                            const userData = doc.data();
                            localStorage.setItem('user', JSON.stringify({
                                uid: user.uid,
                                email: user.email,
                                role: userData.role || 'user',
                                nickname: userData.nickname
                            }));
                        }
                        // Перенаправляем только после получения данных пользователя
                        window.location.href = 'index.html';
                    }).catch(error => {
                        console.error("Error fetching user data:", error);
                        // Если не удалось получить данные пользователя, возможно, стоит выйти
                        logout();
                    });
            } else {
                // Если пользователь авторизован, но находится на странице входа/регистрации, остаемся там
                // (Это нужно, если мы хотим позволить авторизованным пользователям видеть эти страницы)
                // Если нужно сразу перенаправлять на главную, можно убрать этот else
            }
        } else {
            // Пользователь не авторизован
            // Перенаправляем на страницу входа, только если не на страницах входа/регистрации
            if (currentPage !== 'login.html' && currentPage !== 'register.html') {
                window.location.href = 'login.html';
            }
        }
    });
}); 