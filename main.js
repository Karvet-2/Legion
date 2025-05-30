/**
 * Основные скрипты для сайта гильдии
 */

// Форматирование даты и времени
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// === Функции для работы с участниками ===

// Получение всех участников
function getAllMembers() {
    const members = JSON.parse(localStorage.getItem('members') || '[]');
    return members;
}

// Получение участника по ID
function getMemberById(id) {
    const members = getAllMembers();
    return members.find(member => member.id === id);
}

// Сохранение участника (добавление нового или обновление существующего)
function saveMember(member) {
    const members = getAllMembers();
    
    // Если у участника нет ID, генерируем новый и добавляем дату создания
    if (!member.id) {
        member.id = generateId(members);
        member.createdAt = new Date().toISOString();
    } else {
        // Ищем существующего участника для обновления
        const existingIndex = members.findIndex(m => m.id === member.id);
        if (existingIndex >= 0) {
            // Сохраняем дату создания
            member.createdAt = members[existingIndex].createdAt;
            // Удаляем старую запись
            members.splice(existingIndex, 1);
        }
    }
    
    // Добавляем участника в массив
    members.push(member);
    
    // Сохраняем обновленный массив в localStorage
    localStorage.setItem('members', JSON.stringify(members));
    
    return member;
}

// Удаление участника по ID
function deleteMember(id) {
    const members = getAllMembers();
    const updatedMembers = members.filter(member => member.id !== id);
    
    // Удаляем посещаемость для этого участника
    const allAttendance = getAllAttendance();
    const updatedAttendance = allAttendance.map(record => {
        return {
            ...record,
            memberIds: record.memberIds.filter(memberId => memberId !== id)
        };
    });
    
    localStorage.setItem('members', JSON.stringify(updatedMembers));
    localStorage.setItem('attendance', JSON.stringify(updatedAttendance));
    
    return true;
}

// === Функции для работы с группами (паками) ===

// Получение всех групп
function getAllPacks() {
    const packs = JSON.parse(localStorage.getItem('packs') || '[]');
    return packs;
}

// Получение группы по ID
function getPackById(id) {
    const packs = getAllPacks();
    return packs.find(pack => pack.id === id);
}

// Сохранение группы (добавление новой или обновление существующей)
function savePack(pack) {
    const packs = getAllPacks();
    
    // Если у группы нет ID, генерируем новый и добавляем дату создания
    if (!pack.id) {
        pack.id = generateId(packs);
        pack.createdAt = new Date().toISOString();
    } else {
        // Ищем существующую группу для обновления
        const existingIndex = packs.findIndex(p => p.id === pack.id);
        if (existingIndex >= 0) {
            // Сохраняем дату создания
            pack.createdAt = packs[existingIndex].createdAt;
            // Удаляем старую запись
            packs.splice(existingIndex, 1);
        }
    }
    
    // Добавляем группу в массив
    packs.push(pack);
    
    // Сохраняем обновленный массив в localStorage
    localStorage.setItem('packs', JSON.stringify(packs));
    
    return pack;
}

// Удаление группы по ID
function deletePack(id) {
    const packs = getAllPacks();
    const updatedPacks = packs.filter(pack => pack.id !== id);
    
    // Обновляем ссылки на группу у участников
    const members = getAllMembers();
    const updatedMembers = members.map(member => {
        if (member.packId === id) {
            return { ...member, packId: 0 };
        }
        return member;
    });
    
    localStorage.setItem('packs', JSON.stringify(updatedPacks));
    localStorage.setItem('members', JSON.stringify(updatedMembers));
    
    return true;
}

// Получение участников по группе
function getMembersByPack(packId) {
    const members = getAllMembers();
    return members.filter(member => member.packId === packId);
}

// === Функции для работы с событиями ===

// Получение всех событий
function getAllEvents() {
    const events = JSON.parse(localStorage.getItem('events') || '[]');
    return events;
}

// Получение события по ID
function getEventById(id) {
    const events = getAllEvents();
    return events.find(event => event.id === id);
}

// Сохранение события (добавление нового или обновление существующего)
function saveEvent(event) {
    const events = getAllEvents();
    
    // Если у события нет ID, генерируем новый и добавляем дату создания
    if (!event.id) {
        event.id = generateId(events);
        event.createdAt = new Date().toISOString();
    } else {
        // Ищем существующее событие для обновления
        const existingIndex = events.findIndex(e => e.id === event.id);
        if (existingIndex >= 0) {
            // Сохраняем дату создания
            event.createdAt = events[existingIndex].createdAt;
            // Удаляем старую запись
            events.splice(existingIndex, 1);
        }
    }
    
    // Добавляем событие в массив
    events.push(event);
    
    // Сохраняем обновленный массив в localStorage
    localStorage.setItem('events', JSON.stringify(events));
    
    return event;
}

// Удаление события по ID
function deleteEvent(id) {
    const events = getAllEvents();
    const updatedEvents = events.filter(event => event.id !== id);
    
    // Удаляем посещаемость для этого события
    const allAttendance = getAllAttendance();
    const updatedAttendance = allAttendance.filter(record => record.eventId !== id);
    
    localStorage.setItem('events', JSON.stringify(updatedEvents));
    localStorage.setItem('attendance', JSON.stringify(updatedAttendance));
    
    return true;
}

// === Функции для работы с посещаемостью ===

// Получение всех записей о посещаемости
function getAllAttendance() {
    const attendance = JSON.parse(localStorage.getItem('attendance') || '[]');
    return attendance;
}

// Получение записи о посещаемости по ID события
function getAttendanceByEvent(eventId) {
    const attendance = getAllAttendance();
    return attendance.find(record => record.eventId === eventId);
}

// Сохранение посещаемости для события
function saveAttendance(eventId, memberIds) {
    const attendance = getAllAttendance();
    const existingIndex = attendance.findIndex(record => record.eventId === eventId);
    
    if (existingIndex >= 0) {
        // Обновляем существующую запись
        attendance[existingIndex].memberIds = memberIds;
    } else {
        // Создаем новую запись
        attendance.push({
            id: generateId(attendance),
            eventId: eventId,
            memberIds: memberIds,
            createdAt: new Date().toISOString()
        });
    }
    
    // Сохраняем обновленный массив в localStorage
    localStorage.setItem('attendance', JSON.stringify(attendance));
    
    return true;
}

// === Вспомогательные функции ===

// Генерация уникального ID
function generateId(items) {
    if (items.length === 0) return 1;
    const maxId = Math.max(...items.map(item => item.id));
    return maxId + 1;
}

// Генерация статистики посещаемости
function generateAttendanceStats() {
    const members = getAllMembers();
    const events = getAllEvents();
    const attendance = getAllAttendance();
    
    const stats = [];
    
    members.forEach(member => {
        let eventsAttended = 0;
        let lastEventId = null;
        let lastEventDate = null;
        
        // Подсчет посещенных событий
        attendance.forEach(record => {
            if (record.memberIds.includes(member.id)) {
                eventsAttended++;
                
                // Поиск последнего посещенного события
                const event = events.find(e => e.id === record.eventId);
                if (event) {
                    const eventDate = new Date(event.date + ' ' + event.time);
                    if (!lastEventDate || eventDate > new Date(lastEventDate)) {
                        lastEventDate = event.date + ' ' + event.time;
                        lastEventId = event.id;
                    }
                }
            }
        });
        
        // Расчет процента посещаемости
        const attendanceRate = events.length > 0 ? eventsAttended / events.length : 0;
        
        stats.push({
            memberId: member.id,
            eventsAttended,
            totalEvents: events.length,
            attendanceRate,
            lastEventId
        });
    });
    
    return stats;
}

// Инициализация фильтров таблиц и других общих элементов при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    // Инициализация подсказок Bootstrap
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function(tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
    
    // Инициализация подтверждений удаления
    document.querySelectorAll('.delete-confirm').forEach(btn => {
        btn.addEventListener('click', function(e) {
            if (!confirm('Вы уверены, что хотите удалить этот элемент?')) {
                e.preventDefault();
                e.stopPropagation();
            }
        });
    });
    
    // Фильтрация таблиц
    document.querySelectorAll('#tableFilter').forEach(filter => {
        filter.addEventListener('input', function() {
            const filterText = this.value.toLowerCase();
            const table = document.querySelector('.filterable-table');
            
            if (table) {
                const rows = table.querySelectorAll('tbody tr');
                
                rows.forEach(row => {
                    let found = false;
                    const cells = row.querySelectorAll('td');
                    
                    cells.forEach(cell => {
                        if (cell.textContent.toLowerCase().includes(filterText)) {
                            found = true;
                        }
                    });
                    
                    row.style.display = found ? '' : 'none';
                });
            }
        });
    });
}); 