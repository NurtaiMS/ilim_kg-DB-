import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import User from './models/User.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'development_secret';
if (!process.env.JWT_SECRET) {
  console.warn('⚠️ JWT_SECRET не задан. Используется временный секрет для локальной разработки.');
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getSubjectFromSubtopic(subtopicId) {
  if (!subtopicId) return null;
  if (/^(numbers_|addition_|subtraction_|addSub_|word_)/.test(subtopicId)) return 'math';
  if (/^ru_/.test(subtopicId)) return 'russian';
  if (/^ky_/.test(subtopicId)) return 'kyrgyz';
  if (/^eng_/.test(subtopicId)) return 'english';
  if (/^(phy_|geo_|bio_)/.test(subtopicId)) return 'science';
  return null;
}

function buildSubjectsProgressFromTaskProgress(taskProgress) {
  const subjectsProgress = {
    math: { score: 0, tasksCompleted: 0 },
    russian: { score: 0, tasksCompleted: 0 },
    english: { score: 0, tasksCompleted: 0 },
    kyrgyz: { score: 0, tasksCompleted: 0 },
    science: { score: 0, tasksCompleted: 0 },
  };
  let totalTasksCompleted = 0;

  if (taskProgress && typeof taskProgress === 'object') {
    for (const subtopicId in taskProgress) {
      const subjectId = getSubjectFromSubtopic(subtopicId);
      if (!subjectId) continue;
      const tasks = taskProgress[subtopicId];
      if (!tasks || typeof tasks !== 'object') continue;

      for (const taskId in tasks) {
        if (tasks[taskId]?.completed === true) {
          subjectsProgress[subjectId].tasksCompleted += 1;
          totalTasksCompleted += 1;
        }
      }
    }
  }

  return { subjectsProgress, totalTasksCompleted };
}

async function normalizeStudentExperience(user) {
  if (!user) return user;

  const rawExperience = Number(user.experience || 0);
  const rawLevel = Number(user.level || 1);
  const existingTotalExperience = Number(user.totalExperience || 0);
  const calculatedTotalExperience = existingTotalExperience || ((rawLevel - 1) * 100 + rawExperience);
  const normalizedLevel = Math.floor(calculatedTotalExperience / 100) + 1;
  const normalizedExperience = calculatedTotalExperience % 100;

  const needsUpdate = normalizedLevel !== rawLevel || normalizedExperience !== rawExperience || calculatedTotalExperience !== existingTotalExperience;
  const normalizedUser = {
    ...user.toObject?.(),
    ...user,
    level: normalizedLevel,
    experience: normalizedExperience,
    totalExperience: calculatedTotalExperience,
  };

  if (needsUpdate && user._id) {
    await User.findByIdAndUpdate(user._id, {
      level: normalizedLevel,
      experience: normalizedExperience,
      totalExperience: calculatedTotalExperience,
    });
  }

  return normalizedUser;
}

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB подключена'))
  .catch(err => console.log('❌ Ошибка:', err));

// ========== АВТОРИЗАЦИЯ ==========
app.post('/api/auth/register', async (req, res) => {
  try {
    const { login, email, password, role, name } = req.body;
    const normalizedEmail = email?.toLowerCase().trim();
    const normalizedLogin = login?.toLowerCase().trim();

    const existingUser = await User.findOne({
      $or: [
        { login: normalizedLogin },
        { email: normalizedEmail }
      ]
    });
    if (existingUser) return res.status(400).json({ error: 'Пользователь уже существует' });
    
    const user = new User({ login: normalizedLogin, email: normalizedEmail, password, role, name });
    await user.save();
    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user: { id: user._id, login: normalizedLogin, email: normalizedEmail, role: user.role, name } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { login, password } = req.body;
    const credentials = String(login ?? '').trim();
    if (!credentials) return res.status(400).json({ error: 'Введите логин или email' });

    const normalizedEmail = credentials.includes('@') ? credentials.toLowerCase() : credentials;
    const loginQuery = credentials.includes('@')
      ? { email: normalizedEmail }
      : { login: { $regex: `^${escapeRegExp(normalizedEmail)}$`, $options: 'i' } };

    const user = await User.findOne({
      $or: [
        loginQuery,
        { email: normalizedEmail }
      ]
    });

    if (!user) return res.status(400).json({ error: 'Неверный логин или email' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ error: 'Неверный пароль' });

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    let children = [];

    if (user.role === 'parent') {
      children = await User.find({ parentId: user._id }).select('_id login name avatar grade').lean();
    } else if (user.role === 'teacher') {
      children = await User.find({ teacherId: user._id }).select('_id login name avatar grade').lean();
    }

    const normalizedUser = await normalizeStudentExperience(user);

    const responseUser = {
      id: normalizedUser._id || normalizedUser.id,
      login: normalizedUser.login,
      email: normalizedUser.email,
      role: normalizedUser.role,
      name: normalizedUser.name,
      avatar: normalizedUser.avatar,
      childrenIds: normalizedUser.childrenIds || [],
      children,
      level: normalizedUser.level,
      experience: normalizedUser.experience,
      totalExperience: normalizedUser.totalExperience,
      coins: normalizedUser.coins,
      totalTasksCompleted: normalizedUser.totalTasksCompleted,
      subjectsProgress: normalizedUser.subjectsProgress,
      taskProgress: normalizedUser.taskProgress,
    };

    res.json({
      token,
      user: responseUser,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ========== ПРОФИЛЬ ==========
app.get('/api/user/profile/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ========== СВЯЗИ РОДИТЕЛЬ-РЕБЁНОК ==========
app.post('/api/user/link-child', async (req, res) => {
  try {
    const { parentId, childId } = req.body;
    await User.findByIdAndUpdate(parentId, { $addToSet: { childrenIds: childId } });
    await User.findByIdAndUpdate(childId, { parentId: parentId });
    res.json({ message: 'Ребёнок успешно привязан' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ========== ИГРОВАЯ СТАТИСТИКА УЧЕНИКА ==========
// Добавить монеты
app.post('/api/user/add-coins', async (req, res) => {
  try {
    const { studentId, coins } = req.body;
    await User.findByIdAndUpdate(studentId, { $inc: { coins: coins } });
    res.json({ message: `Добавлено ${coins} монет` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Добавить опыт и повысить уровень
app.post('/api/user/add-experience', async (req, res) => {
  try {
    const { studentId, exp } = req.body;
    const student = await User.findById(studentId);
    if (!student) return res.status(404).json({ error: 'Ученик не найден' });

    const legacyTotalExperience = student.totalExperience || 0;
    const currentTotalExperience = legacyTotalExperience || ((student.level - 1) * 100 + (student.experience || 0));
    const newTotalExperience = currentTotalExperience + exp;
    const newLevel = Math.floor(newTotalExperience / 100) + 1;
    const newExperience = newTotalExperience % 100;

    await User.findByIdAndUpdate(studentId, {
      experience: newExperience,
      totalExperience: newTotalExperience,
      level: newLevel,
    });

    res.json({
      message: `Добавлено ${exp} опыта`,
      newLevel,
      experience: newExperience,
      totalExperience: newTotalExperience,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/user/shop/purchase', async (req, res) => {
  try {
    const { studentId, itemId, type, value, price } = req.body;
    if (!studentId || !itemId || !type || value === undefined || price === undefined) {
      return res.status(400).json({ error: 'studentId, itemId, type, value, price required' });
    }

    const student = await User.findById(studentId).select('coins inventory equippedItems');
    if (!student) return res.status(404).json({ error: 'Ученик не найден' });
    const inventory = Array.isArray(student.inventory) ? student.inventory : [];

    if (inventory.includes(itemId)) {
      return res.status(400).json({ error: 'Предмет уже приобретён' });
    }
    if ((student.coins || 0) < price) {
      return res.status(400).json({ error: 'Недостаточно монет' });
    }

    const nextInventory = [...inventory, itemId];
    const equippedItems = {
      avatar: student.equippedItems?.avatar || '🎓',
      frame: student.equippedItems?.frame || 'border-primary',
      badge: student.equippedItems?.badge || '',
    };

    if (type === 'avatar') equippedItems.avatar = value;
    if (type === 'frame') equippedItems.frame = value;
    if (type === 'badge') equippedItems.badge = value;

    const updatedCoins = (student.coins || 0) - price;
    await User.findByIdAndUpdate(studentId, {
      inventory: nextInventory,
      equippedItems,
      coins: updatedCoins,
    });

    res.json({ inventory: nextInventory, equippedItems, coins: updatedCoins });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/user/shop/equip', async (req, res) => {
  try {
    const { studentId, itemId, type, value } = req.body;
    if (!studentId || !type || value === undefined) {
      return res.status(400).json({ error: 'studentId, type and value required' });
    }

    const student = await User.findById(studentId).select('inventory equippedItems');
    if (!student) return res.status(404).json({ error: 'Ученик не найден' });
    const inventory = Array.isArray(student.inventory) ? student.inventory : [];

    if (itemId && !inventory.includes(itemId)) {
      return res.status(400).json({ error: 'Предмет не приобретён' });
    }

    const equippedItems = {
      avatar: student.equippedItems?.avatar || '🎓',
      frame: student.equippedItems?.frame || 'border-primary',
      badge: student.equippedItems?.badge || '',
    };

    if (type === 'avatar') equippedItems.avatar = value;
    if (type === 'frame') equippedItems.frame = value;
    if (type === 'badge') equippedItems.badge = value;

    await User.findByIdAndUpdate(studentId, { equippedItems });
    res.json({ equippedItems });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/users/leaderboard', async (req, res) => {
  try {
    const currentUserId = req.query.currentUserId;
    const students = await User.aggregate([
      { $match: { role: 'student' } },
      {
        $addFields: {
          normalizedTotalExperience: {
            $cond: [
              { $gt: ['$totalExperience', 0] },
              '$totalExperience',
              { $add: [ { $multiply: [ { $subtract: ['$level', 1] }, 100 ] }, { $ifNull: ['$experience', 0] } ] }
            ]
          }
        }
      },
      { $sort: { normalizedTotalExperience: -1, level: -1, experience: -1 } },
      { $project: { name: 1, avatar: 1, login: 1, level: 1, experience: 1, totalExperience: 1 } }
    ]);

    const leaderboard = students.map((student) => ({
      id: student._id,
      name: student.name || student.login || 'Ученик',
      avatar: student.avatar || '🎓',
      level: student.level || 1,
      experience: student.experience || 0,
      totalExperience: student.totalExperience || ((student.level - 1) * 100 + (student.experience || 0)),
      isCurrentUser: currentUserId ? String(student._id) === String(currentUserId) : false,
    }));

    res.json(leaderboard);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/user/save-progress', async (req, res) => {
  try {
    const {
      studentId,
      taskProgress,
      subjectsProgress,
      experience,
      level,
      coins,
      totalTasksCompleted,
      totalExperience,
    } = req.body;
    if (!studentId) return res.status(400).json({ error: 'studentId is required' });

    const student = await User.findById(studentId).select('taskProgress subjectsProgress totalTasksCompleted');
    if (!student) return res.status(404).json({ error: 'Ученик не найден' });

    const currentTaskProgress = student.taskProgress && typeof student.taskProgress === 'object' ? student.taskProgress : {};
    const mergedTaskProgress = taskProgress && typeof taskProgress === 'object'
      ? { ...currentTaskProgress, ...taskProgress }
      : currentTaskProgress;

    const derived = buildSubjectsProgressFromTaskProgress(mergedTaskProgress);
    const update = {
      taskProgress: mergedTaskProgress,
      subjectsProgress: {
        ...((student.subjectsProgress && typeof student.subjectsProgress === 'object') ? student.subjectsProgress : {}),
        ...derived.subjectsProgress,
        ...((subjectsProgress && typeof subjectsProgress === 'object') ? subjectsProgress : {}),
      },
    };

    if (totalTasksCompleted !== undefined) {
      update.totalTasksCompleted = totalTasksCompleted;
    } else {
      update.totalTasksCompleted = derived.totalTasksCompleted;
    }

    if (experience !== undefined) update.experience = experience;
    if (level !== undefined) update.level = level;
    if (totalExperience !== undefined) {
      update.totalExperience = totalExperience;
    } else if (experience !== undefined && level !== undefined) {
      update.totalExperience = ((level - 1) * 100) + experience;
    }
    if (coins !== undefined) update.coins = coins;

    await User.findByIdAndUpdate(studentId, update);
    res.json({ message: 'Прогресс сохранён', taskProgress: mergedTaskProgress, subjectsProgress: update.subjectsProgress });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Получить прогресс ученика
app.get('/api/user/progress/:studentId', async (req, res) => {
  try {
    const student = await User.findById(req.params.studentId).select('level experience totalExperience coins subjectsProgress completedTasks inventory equippedItems taskProgress');
    if (!student) return res.status(404).json({ error: 'Ученик не найден' });
    const normalizedStudent = await normalizeStudentExperience(student);
    const response = {
      ...normalizedStudent,
      inventory: Array.isArray(student.inventory) ? student.inventory : [],
      equippedItems: {
        avatar: student.equippedItems?.avatar || '🎓',
        frame: student.equippedItems?.frame || 'border-primary',
        badge: student.equippedItems?.badge || '',
      }
    };
    res.json(response);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Регистрация родителя/учителя с детьми
app.post('/api/auth/register-with-children', async (req, res) => {
  try {
    const { login, email, password, role, name, children } = req.body;
    const normalizedEmail = email?.toLowerCase().trim();
    const normalizedLogin = login?.toLowerCase().trim();

    // Проверяем, существует ли уже такой пользователь
    const existingUser = await User.findOne({
      $or: [
        { login: normalizedLogin },
        { email: normalizedEmail }
      ]
    });
    if (existingUser) return res.status(400).json({ error: 'Пользователь уже существует' });
    
    // Создаем родителя/учителя
    const parent = new User({
      login: normalizedLogin,
      email: normalizedEmail,
      password,
      role,
      name: name || normalizedLogin,
      avatar: '🎓'
    });
    await parent.save();

    // Создаем студентов
    const students = [];
    for (const child of children) {
      const studentLogin = `${child.username.toLowerCase()}_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`;
      const studentPassword = Math.random().toString(36).slice(2, 10);

      const student = new User({
        login: studentLogin,
        email: `${studentLogin}@ilim.local`,
        password: studentPassword,
        role: 'student',
        name: child.username,
        avatar: child.avatar || '🎓',
        class: child.grade || '',
        [role === 'parent' ? 'parentId' : 'teacherId']: parent._id
      });
      await student.save();

      // Добавляем студента в массив childrenIds родителя
      parent.childrenIds.push(student._id);

      students.push({
        username: child.username,
        login: studentLogin,
        password: studentPassword,
        avatar: student.avatar,
        grade: child.grade || ''
      });
    }

    // Сохраняем обновленного родителя с детьми
    await parent.save();

    const token = jwt.sign({ id: parent._id, role: parent.role }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({
      token,
      parent: {
        id: parent._id,
        login: normalizedLogin,
        email: normalizedEmail,
        role: parent.role,
        name: parent.name
      },
      students
    });
  } catch (err) {
    console.error('Ошибка при регистрации:', err);
    res.status(500).json({ error: err.message });
  }
});

// ========== ЗАПУСК СЕРВЕРА ==========
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на порту ${PORT}`);
});