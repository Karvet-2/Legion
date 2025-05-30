const express = require('express');
const cors = require('cors');
const path = require('path');
const { Sequelize, DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const crypto = require('crypto');
const { Telegraf } = require('telegraf');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');

// Настройки окружения
dotenv.config();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'legion_jwt_super_secret_key';

// Настройки базы данных
const DB_NAME = process.env.DB_NAME || 'legion_db';
const DB_USER = process.env.DB_USER || 'postgres';
const DB_PASSWORD = process.env.DB_PASSWORD || 'postgres'; // Используем временный пароль для тестирования
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || 5432;
const DB_SSL = process.env.DB_SSL === 'true' ? true : false;

// Настройка Telegram бота
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || 'your_telegram_bot_token_here';
const TELEGRAM_BOT_USERNAME = process.env.TELEGRAM_BOT_USERNAME || 'LegionGuildBot';

// Настройки Telegram API
const TELEGRAM_API_URL = process.env.TELEGRAM_API_URL || 'http://localhost:5000/api/auth/verify';

// Хранение кодов авторизации
let authCodes = {};

// Инициализация Sequelize
let sequelize;

try {
  // Для тестирования, если нет подключения к PostgreSQL, используем SQLite
  if (process.env.NODE_ENV === 'test' || !DB_PASSWORD || DB_PASSWORD === 'your_password_here' || DB_PASSWORD === 'postgres') {
    console.log('Использование SQLite для тестирования');
    sequelize = new Sequelize({
      dialect: 'sqlite',
      storage: 'database.sqlite',
      logging: false
    });
  } else {
    sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
      host: DB_HOST,
      port: DB_PORT,
      dialect: 'postgres',
      dialectOptions: {
        ssl: DB_SSL ? {
          require: true,
          rejectUnauthorized: false
        } : false
      },
      logging: false
    });
  }
} catch (error) {
  console.error('Ошибка при инициализации Sequelize:', error);
}

// Инициализация Express приложения
const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

// Middleware для проверки авторизации
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'Необходима авторизация' });
  }
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Неверный или истекший токен' });
    }
    req.user = user;
    next();
  });
};

// Определение моделей
const User = sequelize.define('User', {
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  nickname: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  character_class: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  role: {
    type: DataTypes.STRING,
    defaultValue: 'member'
  },
  telegram_id: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: true
  },
  telegram_username: {
    type: DataTypes.STRING,
    allowNull: true
  },
  telegram_photo_url: {
    type: DataTypes.STRING,
    allowNull: true
  }
});

// Инициализация Telegram бота
let bot = null;
try {
  // Проверяем, есть ли реальный токен бота
  if (TELEGRAM_BOT_TOKEN && TELEGRAM_BOT_TOKEN !== 'your_telegram_bot_token_here') {
    bot = new Telegraf(TELEGRAM_BOT_TOKEN);
    
    // Обработчик команды /start
    bot.start((ctx) => {
      ctx.reply('Привет! Я бот гильдии Legion. Используйте /auth чтобы получить код для входа на сайт.');
    });
    
    // Обработчик команды /auth
    bot.command('auth', (ctx) => {
      const chatId = ctx.chat.id;
      const userId = ctx.from.id;
      const username = ctx.from.username;
      
      // Генерация 6-значного кода
      const authCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Сохранение кода в базе или в памяти
      authCodes[username] = {
        code: authCode,
        timestamp: Date.now()
      };
      
      ctx.reply(`Ваш код для входа: ${authCode}\nОн действителен в течение 10 минут.\n\nВведите ваш Telegram username и этот код на сайте для входа.`);
    });
    
    // Запуск бота
    bot.launch()
      .then(() => {
        console.log('Telegram бот запущен');
      })
      .catch((error) => {
        console.error('Ошибка при запуске бота:', error);
        bot = null;
      });
  } else {
    console.log('Токен Telegram бота не указан. Бот не будет запущен.');
    bot = null;
  }
} catch (error) {
  console.error('Ошибка при инициализации Telegram бота:', error);
  bot = null;
}

// API Routes

// API маршрут для аутентификации через Telegram
app.post('/api/auth/telegram', async (req, res) => {
  try {
    const { telegram_username, auth_code } = req.body;
    
    if (!telegram_username || !auth_code) {
      return res.status(400).json({ message: 'Необходимо указать имя пользователя Telegram и код авторизации' });
    }
    
    // Проверка кода через Python API
    try {
      const response = await axios.post(TELEGRAM_API_URL, {
        telegram_username: telegram_username.replace('@', ''),
        auth_code
      });
      
      if (!response.data.success) {
        return res.status(400).json({ message: response.data.message || 'Ошибка авторизации' });
      }
      
      const telegram_data = response.data.user_data;
      
      // Поиск или создание пользователя
      let user = await User.findOne({ 
        where: { 
          telegram_username: telegram_data.telegram_username 
        } 
      });
      
      if (!user) {
        // Создание нового пользователя
        user = await User.create({
          username: telegram_data.telegram_username,
          password: bcrypt.hashSync(crypto.randomBytes(16).toString('hex'), 10), // Случайный пароль
          telegram_username: telegram_data.telegram_username,
          telegram_id: telegram_data.telegram_id,
          nickname: telegram_data.telegram_username,
          role: 'member'
        });
      } else {
        // Обновляем telegram_id если не было установлено
        if (!user.telegram_id) {
          user.telegram_id = telegram_data.telegram_id;
          await user.save();
        }
      }
      
      // Генерация JWT токена
      const token = jwt.sign(
        { 
          id: user.id,
          username: user.username,
          role: user.role
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      );
      
      res.json({
        message: 'Авторизация успешна',
        token,
        user: {
          id: user.id,
          username: user.username,
          nickname: user.nickname,
          role: user.role,
          telegram_username: user.telegram_username
        }
      });
    } catch (error) {
      console.error('Ошибка при проверке кода авторизации:', error.message);
      if (error.response) {
        return res.status(error.response.status).json({ 
          message: error.response.data.message || 'Ошибка при проверке кода авторизации'
        });
      }
      return res.status(500).json({ message: 'Ошибка соединения с сервером проверки кодов авторизации' });
    }
  } catch (error) {
    console.error('Ошибка при авторизации через Telegram:', error);
    res.status(500).json({ message: 'Ошибка сервера при авторизации' });
  }
});

// Загрузка фото профиля пользователя из Telegram
app.get('/api/user/get-telegram-photo', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user || !user.telegram_id) {
      return res.status(404).json({ message: 'Пользователь не найден или не привязан к Telegram' });
    }
    
    // Получаем фото профиля через Telegram API
    try {
      const response = await axios.get(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUserProfilePhotos?user_id=${user.telegram_id}&limit=1`);
      
      if (response.data.ok && response.data.result.photos.length > 0) {
        const fileId = response.data.result.photos[0][0].file_id;
        const fileResponse = await axios.get(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getFile?file_id=${fileId}`);
        
        if (fileResponse.data.ok) {
          const filePath = fileResponse.data.result.file_path;
          const photoUrl = `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${filePath}`;
          
          // Обновляем URL фото в базе данных
          user.photo_url = photoUrl;
          await user.save();
          
          return res.status(200).json({ photo_url: photoUrl });
        }
      }
      
      return res.status(404).json({ message: 'Фото профиля не найдено' });
    } catch (error) {
      console.error('Ошибка при получении фото профиля из Telegram:', error);
      return res.status(500).json({ message: 'Ошибка при получении фото профиля' });
    }
  } catch (error) {
    console.error('Ошибка при работе с базой данных:', error);
    res.status(500).json({ message: 'Произошла ошибка при получении данных' });
  }
});

// Регистрация нового пользователя
app.post('/api/register', async (req, res) => {
  try {
    const { username, password, nickname, character_class, bm_level, ame_level } = req.body;
    
    // Проверка существования пользователя
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ message: 'Пользователь с таким именем уже существует' });
    }
    
    // Хеширование пароля
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Создание пользователя
    const user = await User.create({
      username,
      password: hashedPassword,
      nickname,
      character_class,
      bm_level: bm_level || 0,
      ame_level: ame_level || 0
    });
    
    // Создание JWT токена
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.status(201).json({
      message: 'Пользователь успешно зарегистрирован',
      token,
      user: {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        character_class: user.character_class,
        bm_level: user.bm_level,
        ame_level: user.ame_level,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Ошибка при регистрации:', error);
    res.status(500).json({ message: 'Произошла ошибка при регистрации' });
  }
});

// Авторизация пользователя
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Поиск пользователя
    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(401).json({ message: 'Неверные учетные данные' });
    }
    
    // Проверка пароля
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Неверные учетные данные' });
    }
    
    // Создание JWT токена
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.status(200).json({
      message: 'Авторизация успешна',
      token,
      user: {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        character_class: user.character_class,
        bm_level: user.bm_level,
        ame_level: user.ame_level,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Ошибка при авторизации:', error);
    res.status(500).json({ message: 'Произошла ошибка при авторизации' });
  }
});

// Получение информации о текущем пользователе
app.get('/api/user', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }
    
    res.status(200).json({
      id: user.id,
      username: user.username,
      nickname: user.nickname,
      first_name: user.first_name,
      last_name: user.last_name,
      photo_url: user.photo_url,
      character_class: user.character_class,
      bm_level: user.bm_level,
      ame_level: user.ame_level,
      role: user.role
    });
  } catch (error) {
    console.error('Ошибка при получении данных пользователя:', error);
    res.status(500).json({ message: 'Произошла ошибка при получении данных' });
  }
});

// Обновление профиля пользователя
app.put('/api/user/update', authenticateToken, async (req, res) => {
  try {
    const { nickname, character_class, bm_level, ame_level, password } = req.body;
    
    // Находим пользователя
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }
    
    // Обновляем данные
    user.nickname = nickname || user.nickname;
    user.character_class = character_class || user.character_class;
    if (bm_level !== undefined) user.bm_level = bm_level;
    if (ame_level !== undefined) user.ame_level = ame_level;
    
    // Если указан новый пароль, обновляем его
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      user.password = hashedPassword;
    }
    
    // Сохраняем изменения
    await user.save();
    
    res.status(200).json({
      message: 'Профиль успешно обновлен',
      user: {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        first_name: user.first_name,
        last_name: user.last_name,
        photo_url: user.photo_url,
        character_class: user.character_class,
        bm_level: user.bm_level,
        ame_level: user.ame_level,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Ошибка при обновлении профиля:', error);
    res.status(500).json({ message: 'Произошла ошибка при обновлении профиля' });
  }
});

// SPA fallback - для всех остальных маршрутов отдаем index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Синхронизация моделей с базой данных
try {
  // Для SQLite используем force: true при первом запуске, чтобы создать таблицы заново
  const syncOptions = process.env.NODE_ENV === 'test' || 
    (!DB_PASSWORD || DB_PASSWORD === 'your_password_here' || DB_PASSWORD === 'postgres') ? 
    { force: true } : { alter: true };
  
  sequelize.sync(syncOptions)
    .then(async () => {
      console.log('Модели успешно синхронизированы с базой данных');
      
      // Создание администратора, если его нет
      const adminExists = await User.findOne({ where: { username: 'admin' } });
      if (!adminExists) {
        await User.create({
          username: 'admin',
          password: bcrypt.hashSync('admin', 10),
          role: 'admin'
        });
        console.log('Создан аккаунт администратора по умолчанию');
      }
      
      // Запуск сервера
      app.listen(PORT, () => {
        console.log(`Сервер запущен на порту ${PORT}`);
        console.log(`Откройте http://localhost:${PORT} в вашем браузере`);
      });
    })
    .catch(error => {
      console.error('Ошибка при синхронизации моделей:', error);
    });
} catch (error) {
  console.error('Ошибка при запуске сервера:', error);
} 