/**
 * API.js - Функции для работы с хранилищем данных
 * Этот файл содержит функции для работы с локальным хранилищем,
 * обеспечивая простой API для остальных файлов JavaScript.
 */

// Ключи для локального хранилища
const STORAGE_KEYS = {
  MEMBERS: 'legion_members',
  PACKS: 'legion_packs',
  EVENTS: 'legion_events',
  ATTENDANCE: 'legion_attendance',
  USERS: 'legion_users'
};

// Получение участников из хранилища
function getMembersFromStorage() {
  const membersJSON = localStorage.getItem(STORAGE_KEYS.MEMBERS);
  return membersJSON ? JSON.parse(membersJSON) : [];
}

// Сохранение участников в хранилище
function saveMembersToStorage(members) {
  localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(members));
}

// Получение групп из хранилища
function getPacksFromStorage() {
  const packsJSON = localStorage.getItem(STORAGE_KEYS.PACKS);
  return packsJSON ? JSON.parse(packsJSON) : [];
}

// Сохранение групп в хранилище
function savePacksToStorage(packs) {
  localStorage.setItem(STORAGE_KEYS.PACKS, JSON.stringify(packs));
}

// Получение событий из хранилища
function getEventsFromStorage() {
  const eventsJSON = localStorage.getItem(STORAGE_KEYS.EVENTS);
  return eventsJSON ? JSON.parse(eventsJSON) : [];
}

// Сохранение событий в хранилище
function saveEventsToStorage(events) {
  localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
}

// Получение посещаемости из хранилища
function getAttendanceFromStorage() {
  const attendanceJSON = localStorage.getItem(STORAGE_KEYS.ATTENDANCE);
  return attendanceJSON ? JSON.parse(attendanceJSON) : [];
}

// Сохранение посещаемости в хранилище
function saveAttendanceToStorage(attendance) {
  localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(attendance));
}

// Получение пользователей из хранилища
function getUsersFromStorage() {
  const usersJSON = localStorage.getItem(STORAGE_KEYS.USERS);
  return usersJSON ? JSON.parse(usersJSON) : [];
}

// Сохранение пользователей в хранилище
function saveUsersToStorage(users) {
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
}

// Инициализация локального хранилища с демо-данными
function initializeLocalStorage() {
  // Пользователи
  const users = [
    { id: 1, username: 'admin', password: 'admin123', role: 'admin' },
    { id: 2, username: 'user', password: 'user123', role: 'user' }
  ];
  saveUsersToStorage(users);

  // Группы (круги)
  const packs = [
    { id: 1, name: 'Основной круг', color: '#007bff', description: 'Круг для основных рейдов гильдии' },
    { id: 2, name: 'PvP круг', color: '#dc3545', description: 'Круг для PvP активностей' },
    { id: 3, name: 'Новички', color: '#28a745', description: 'Круг для новых участников гильдии' }
  ];
  savePacksToStorage(packs);

  // Участники
  const members = [
    { id: 1, nickname: 'Темный_Страж', telegramUsername: 'dark_guardian', class: 'Страж', battlePower: 15000, packId: 1, notes: 'Лидер гильдии', active: true, joinDate: '2023-01-15T10:00:00Z' },
    { id: 2, nickname: 'ЛесникДруид', telegramUsername: 'forest_druid', class: 'Друид', battlePower: 12800, packId: 1, notes: 'Основной хилер', active: true, joinDate: '2023-01-20T14:30:00Z' },
    { id: 3, nickname: 'FireMage', telegramUsername: 'fire_mage', class: 'Маг', battlePower: 13200, packId: 1, notes: 'ДД', active: true, joinDate: '2023-02-05T09:15:00Z' },
    { id: 4, nickname: 'ShadowHunter', telegramUsername: 'shadow_hunter', class: 'Жнец', battlePower: 11500, packId: 2, notes: '', active: true, joinDate: '2023-02-10T18:45:00Z' },
    { id: 5, nickname: 'Лучник999', telegramUsername: 'archer999', class: 'Лучник', battlePower: 9800, packId: 3, notes: 'Новичок, нужна помощь с гайдом по классу', active: true, joinDate: '2023-03-01T11:20:00Z' },
    { id: 6, nickname: 'Паладин777', telegramUsername: '', class: 'Жрец', battlePower: 7500, packId: 3, notes: '', active: false, joinDate: '2023-03-15T16:10:00Z' }
  ];
  saveMembersToStorage(members);

  // События
  const events = [
    { id: 1, title: 'Рейд на Гоблинов', description: 'Еженедельный рейд', date: '2023-04-10T19:00:00Z', requiredMembers: 10, packId: null },
    { id: 2, title: 'Подземелье Дракона', description: 'Сложное подземелье', date: '2023-04-15T20:00:00Z', requiredMembers: 5, packId: 1 },
    { id: 3, title: 'Тренировка новичков', description: 'Обучение механикам', date: '2023-04-12T18:00:00Z', requiredMembers: 3, packId: 3 }
  ];
  saveEventsToStorage(events);

  // Посещаемость
  const attendance = [
    { eventId: 1, memberId: 1, status: 'present' },
    { eventId: 1, memberId: 2, status: 'present' },
    { eventId: 1, memberId: 3, status: 'present' },
    { eventId: 1, memberId: 4, status: 'absent' },
    { eventId: 2, memberId: 1, status: 'present' },
    { eventId: 2, memberId: 2, status: 'present' },
    { eventId: 3, memberId: 5, status: 'present' }
  ];
  saveAttendanceToStorage(attendance);
}

// Если данных нет, инициализируем хранилище
if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
  initializeLocalStorage();
} 