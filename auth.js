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
    // updateAuthUI(); // Пока отключим обновление UI здесь, чтобы избежать конфликтов перенаправления

    // Проверяем состояние авторизации
    firebase.auth().onAuthStateChanged(function(user) {
        const currentPage = window.location.pathname.split('/').pop();
        const authPages = ['login.html', 'register.html'];

        if (user) {
            // Пользователь авторизован
            // Если пользователь на странице входа или регистрации, перенаправляем на главную
            if (authPages.includes(currentPage)) {
                 window.location.href = 'index.html';
            } else {
                // Для всех остальных страниц (защищенных), если пользователь авторизован, получаем его данные
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
                             // Теперь, когда данные есть, можно обновить UI, если функция активна
                             // updateAuthUI();
                        } else {
                             console.warn("User document not found for UID:", user.uid);
                             // Если документа пользователя нет, возможно, это ошибка - выходим
                             logout();
                        }
                    }).catch(error => {
                        console.error("Error fetching user data:", error);
                        // Если не удалось получить данные пользователя, возможно, стоит выйти
                        logout();
                    });
            }
        } else {
            // Пользователь не авторизован
            // Если пользователь НЕ на странице входа или регистрации, перенаправляем на вход
            if (!authPages.includes(currentPage)) {
                window.location.href = 'login.html';
            } else {
                 // Пользователь не авторизован и находится на странице входа или регистрации - остаемся
            }
        }
        
         // Возможно, стоит вызвать updateAuthUI здесь, после определения состояния авторизации
         // updateAuthUI();
    });
    
    // Временно отключим updateAuthUI здесь, чтобы точно понять проблему перенаправления
    // updateAuthUI();

    // Добавляем обработчик для кнопки выхода, если она есть на странице
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    }
}); 