// Глобальные переменные
let members = [];
let packs = [];
let membersTable;

// Проверка авторизации
document.addEventListener("DOMContentLoaded", function () {
  // Проверка авторизации
  if (!checkAuth()) {
    window.location.href = "login.html";
    return;
  }

  // Загрузка данных и инициализация
  loadData();
  
  // Обработка формы добавления участника
  setupEventListeners();
});

// Загрузка данных
function loadData() {
  // Загрузка групп
  packs = getPacksFromStorage();
  populatePackSelect();
  
  // Загрузка участников
  members = getMembersFromStorage();
  renderMembersTable();
  
  // Обновление счетчика
  updateMembersCount();
}

// Настройка обработчиков событий
function setupEventListeners() {
  // Фильтр по вводу
  document.getElementById("tableFilter").addEventListener("input", renderMembersTable);
  
  // Фильтр по группам
  document.getElementById("packFilter").addEventListener("change", renderMembersTable);
  
  // Сохранение нового участника
  document.getElementById("saveMemberBtn").addEventListener("click", function () {
    const nickname = document.getElementById("nickname").value;
    const telegramUsername = document.getElementById("telegramUsername").value;
    const characterClass = document.getElementById("class").value;
    const battlePower = parseInt(document.getElementById("battlePower").value);
    const packId = parseInt(document.getElementById("packId").value);
    const active = document.getElementById("active").checked;
    
    if (!nickname || !characterClass) {
      alert("Пожалуйста, заполните все обязательные поля");
      return;
    }
    
    // Генерация ID для нового участника
    const newId = members.length > 0 ? Math.max(...members.map(m => m.id)) + 1 : 1;
    
    // Создание нового участника
    const newMember = {
      id: newId,
      nickname: nickname,
      telegramUsername: telegramUsername,
      class: characterClass,
      battlePower: battlePower,
      packId: packId === 0 ? null : packId,
      notes: "",
      active: active,
      joinDate: new Date().toISOString()
    };
    
    // Добавление участника в массив и сохранение
    members.push(newMember);
    saveMembersToStorage(members);
    
    // Перерисовка таблицы и закрытие модального окна
    renderMembersTable();
    updateMembersCount();
    clearAddMemberForm();
    
    // Закрытие модального окна
    const modal = bootstrap.Modal.getInstance(document.getElementById("addMemberModal"));
    modal.hide();
  });
  
  // Редактирование участника
  document.getElementById("updateMemberBtn").addEventListener("click", function () {
    const id = parseInt(document.getElementById("editMemberId").value);
    const nickname = document.getElementById("editNickname").value;
    const telegramUsername = document.getElementById("editTelegramUsername").value;
    const characterClass = document.getElementById("editClass").value;
    const battlePower = parseInt(document.getElementById("editBattlePower").value);
    const packId = parseInt(document.getElementById("editPackId").value);
    const notes = document.getElementById("editNotes").value;
    const active = document.getElementById("editActive").checked;
    
    if (!nickname || !characterClass) {
      alert("Пожалуйста, заполните все обязательные поля");
      return;
    }
    
    // Обновление данных участника
    const memberIndex = members.findIndex(m => m.id === id);
    if (memberIndex !== -1) {
      members[memberIndex] = {
        ...members[memberIndex],
        nickname: nickname,
        telegramUsername: telegramUsername,
        class: characterClass,
        battlePower: battlePower,
        packId: packId === 0 ? null : packId,
        notes: notes,
        active: active
      };
      
      // Сохранение и обновление интерфейса
      saveMembersToStorage(members);
      renderMembersTable();
      
      // Закрытие модального окна
      const modal = bootstrap.Modal.getInstance(document.getElementById("editMemberModal"));
      modal.hide();
    }
  });
  
  // Удаление участника
  document.getElementById("deleteMemberBtn").addEventListener("click", function() {
    const id = parseInt(document.getElementById("editMemberId").value);
    const member = members.find(m => m.id === id);
    
    if (member) {
      document.getElementById("deleteUserName").textContent = member.nickname;
      
      // Закрыть окно редактирования и открыть окно подтверждения
      const editModal = bootstrap.Modal.getInstance(document.getElementById("editMemberModal"));
      editModal.hide();
      
      const deleteModal = new bootstrap.Modal(document.getElementById("deleteConfirmModal"));
      deleteModal.show();
    }
  });
  
  // Подтверждение удаления
  document.getElementById("confirmDeleteBtn").addEventListener("click", function() {
    const id = parseInt(document.getElementById("editMemberId").value);
    const memberIndex = members.findIndex(m => m.id === id);
    
    if (memberIndex !== -1) {
      // Удаление участника
      members.splice(memberIndex, 1);
      saveMembersToStorage(members);
      
      // Обновление интерфейса
      renderMembersTable();
      updateMembersCount();
      
      // Закрыть модальное окно
      const modal = bootstrap.Modal.getInstance(document.getElementById("deleteConfirmModal"));
      modal.hide();
    }
  });
}

// Отображение таблицы участников
function renderMembersTable() {
  const container = document.getElementById("membersTableContainer");
  const searchTerm = document.getElementById("tableFilter").value.toLowerCase();
  const packFilter = parseInt(document.getElementById("packFilter").value);
  
  // Фильтрация участников
  let filteredMembers = [...members];
  
  if (searchTerm) {
    filteredMembers = filteredMembers.filter(member => 
      member.nickname.toLowerCase().includes(searchTerm) ||
      (member.telegramUsername && member.telegramUsername.toLowerCase().includes(searchTerm)) ||
      member.class.toLowerCase().includes(searchTerm)
    );
  }
  
  if (packFilter !== 0) {
    filteredMembers = filteredMembers.filter(member => member.packId === packFilter);
  }
  
  // Если нет участников
  if (filteredMembers.length === 0) {
    container.innerHTML = `
      <div class="alert alert-info">
        <i class="fas fa-info-circle me-2"></i>
        ${searchTerm || packFilter !== 0 ? 'Участники не найдены' : 'Нет добавленных участников'}
      </div>
    `;
    return;
  }
  
  // Создание таблицы
  const table = document.createElement("table");
  table.className = "table table-hover table-striped";
  
  // Заголовок таблицы
  const thead = document.createElement("thead");
  thead.innerHTML = `
    <tr>
      <th>Ник</th>
      <th>Класс</th>
      <th>БМ</th>
      <th>Круг</th>
      <th>Статус</th>
      <th>Действия</th>
    </tr>
  `;
  table.appendChild(thead);
  
  // Тело таблицы
  const tbody = document.createElement("tbody");
  
  filteredMembers.forEach(member => {
    const tr = document.createElement("tr");
    
    // Класс строки для неактивных участников
    if (!member.active) {
      tr.classList.add("table-secondary");
    }
    
    // Название круга
    const packName = member.packId 
      ? packs.find(p => p.id === member.packId)?.name || "Неизвестный круг" 
      : "Без круга";
    
    // Класс с иконкой
    const classWithIcon = `
      <div class="d-flex align-items-center">
        <span class="class-icon class-${member.class.toLowerCase().replace(' ', '.')}"></span>
        ${member.class}
      </div>
    `;
    
    // Статус активности
    const activeStatus = member.active 
      ? '<span class="badge bg-success"><i class="fas fa-check me-1"></i>Активен</span>' 
      : '<span class="badge bg-secondary"><i class="fas fa-times me-1"></i>Неактивен</span>';
    
    // Формирование строки
    tr.innerHTML = `
      <td>
        <div>
          <strong>${member.nickname}</strong>
          ${member.telegramUsername ? `<div class="small text-muted"><i class="fab fa-telegram"></i> ${member.telegramUsername}</div>` : ''}
        </div>
      </td>
      <td>${classWithIcon}</td>
      <td>${member.battlePower.toLocaleString()}</td>
      <td>${packName}</td>
      <td>${activeStatus}</td>
      <td>
        <button class="btn btn-sm btn-primary edit-member" data-id="${member.id}">
          <i class="fas fa-edit"></i>
        </button>
      </td>
    `;
    
    tbody.appendChild(tr);
  });
  
  table.appendChild(tbody);
  container.innerHTML = '';
  container.appendChild(table);
  
  // Добавление обработчиков для кнопок редактирования
  document.querySelectorAll(".edit-member").forEach(button => {
    button.addEventListener("click", function() {
      const id = parseInt(this.getAttribute("data-id"));
      openEditModal(id);
    });
  });
}

// Открытие модального окна редактирования
function openEditModal(id) {
  const member = members.find(m => m.id === id);
  if (!member) return;
  
  // Заполнение формы данными участника
  document.getElementById("editMemberId").value = member.id;
  document.getElementById("editNickname").value = member.nickname;
  document.getElementById("editTelegramUsername").value = member.telegramUsername || '';
  document.getElementById("editClass").value = member.class;
  document.getElementById("editBattlePower").value = member.battlePower;
  document.getElementById("editPackId").value = member.packId || 0;
  document.getElementById("editNotes").value = member.notes || '';
  document.getElementById("editActive").checked = member.active;
  
  // Открытие модального окна
  const modal = new bootstrap.Modal(document.getElementById("editMemberModal"));
  modal.show();
}

// Заполнение выпадающего списка кругов
function populatePackSelect() {
  const packSelects = [
    document.getElementById("packId"),
    document.getElementById("editPackId"),
    document.getElementById("packFilter")
  ];
  
  // Для каждого выпадающего списка добавляем группы
  packSelects.forEach(select => {
    if (!select) return;
    
    // Очистка списка, кроме первого элемента
    while (select.options.length > 1) {
      select.remove(1);
    }
    
    // Добавление групп
    packs.forEach(pack => {
      const option = document.createElement("option");
      option.value = pack.id;
      option.textContent = pack.name;
      select.appendChild(option);
    });
  });
}

// Очистка формы добавления участника
function clearAddMemberForm() {
  document.getElementById("nickname").value = "";
  document.getElementById("telegramUsername").value = "";
  document.getElementById("class").value = "";
  document.getElementById("battlePower").value = "1000";
  document.getElementById("packId").value = "0";
  document.getElementById("active").checked = true;
}

// Обновление счетчика участников
function updateMembersCount() {
  document.getElementById("totalMembers").textContent = members.length;
} 