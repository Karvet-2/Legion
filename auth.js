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
async function updateAuthUI() {
    const user = firebase.auth().currentUser;
    const loggedIn = user !== null;
    let isAdminUser = false;
    let userNickname = 'Гость';
    let userPhotoURL = 'path/to/default-avatar.png'; // Путь к аватару по умолчанию

    if (loggedIn) {
        console.log("User is logged in. Trying to fetch user data."); // Отладочный вывод перед try
        try {
            console.log("Fetching user document..."); // Отладочный вывод перед await
            const userDoc = await firebase.firestore().collection('users').doc(user.uid).get();
            if (userDoc.exists) {
                const userData = userDoc.data();
                isAdminUser = userData.role === 'admin';
                userNickname = userData.nickname || user.email; // Используем ник или email
                userPhotoURL = userData.photoURL || userPhotoURL; // Используем photoURL из Firestore или дефолтный
                 localStorage.setItem('user', JSON.stringify({...userData, uid: user.uid})); // Обновляем localStorage с полными данными
            }
        } catch (error) {
            console.error("Error fetching user data for UI update:", error);
        }
    }
    
    // Отображение/скрытие элементов в зависимости от статуса авторизации
    document.querySelectorAll('.logged-in-only').forEach(el => {
        el.style.display = loggedIn ? '' : 'none';
    });
    
    document.querySelectorAll('.logged-out-only').forEach(el => {
        el.style.display = loggedIn ? 'none' : '';
    });
    
    // Отображение/скрытие элементов в зависимости от уровня доступа
    document.querySelectorAll('.admin-only').forEach(el => {
        el.style.display = (loggedIn && isAdminUser) ? '' : 'none';
    });
    
    // Отображение ника пользователя
    const userDisplayElem = document.getElementById('currentUserDisplay');
    if (userDisplayElem) {
        userDisplayElem.textContent = userNickname;
    }

    // Отображение аватара пользователя
    const userPhotoElem = document.getElementById('userPhoto');
    if (userPhotoElem) {
        userPhotoElem.src = userPhotoURL;
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    // Временно отключим updateAuthUI здесь, чтобы точно понять проблему перенаправления
    // updateAuthUI();

    // Проверяем состояние авторизации
    firebase.auth().onAuthStateChanged(async function(user) { // Сделаем асинхронной
        const currentPage = window.location.pathname.split('/').pop();
        const authPages = ['login.html', 'register.html'];

        if (user) {
            // Пользователь авторизован
            // Если пользователь на странице входа или регистрации, перенаправляем на главную
            if (authPages.includes(currentPage)) {
                 window.location.href = 'index.html';
            } else {
                // Для всех остальных страниц (защищенных), если пользователь авторизован, получаем его данные
                 try {
                     const userDoc = await firebase.firestore()
                        .collection('users')
                        .doc(user.uid)
                        .get();
                    
                    if (userDoc.exists) {
                        const userData = userDoc.data();
                        localStorage.setItem('user', JSON.stringify({
                            uid: user.uid,
                            email: user.email,
                            role: userData.role || 'user',
                            nickname: userData.nickname
                        }));
                         // Теперь, когда данные есть, можно обновить UI
                         updateAuthUI(); // Вызываем обновление UI после загрузки данных
                    } else {
                         console.warn("User document not found for UID:", user.uid);
                         // Если документа пользователя нет, возможно, это ошибка - выходим
                         logout();
                    }
                 } catch (error) {
                    console.error("Error fetching user data:", error);
                    // Если не удалось получить данные пользователя, возможно, стоит выйти
                    logout();
                 }
            }
        } else {
            // Пользователь не авторизован
            // Если пользователь НЕ на странице входа или регистрации, перенаправляем на вход
            if (!authPages.includes(currentPage)) {
                window.location.href = 'login.html';
            } else {
                 // Пользователь не авторизован и находится на странице входа или регистрации - остаемся
                 // updateAuthUI(); // Пока отключим здесь, чтобы не было лишних вызовов до определения состояния
            }
        }
        
        // Вызываем updateAuthUI после определения состояния авторизации, независимо от страницы
        // Но только если Firebase уже проинициализирован (что должно быть так)
        if (typeof firebase !== 'undefined' && firebase.auth().currentUser !== undefined) {
             updateAuthUI();
        }
    });
    
    // Добавляем обработчик для кнопки выхода, если она есть на странице
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    }
}); 