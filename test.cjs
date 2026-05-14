require('dotenv').config();
const mongoose = require('mongoose');

console.log('🔄 Пытаюсь подключиться к MongoDB...');

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB подключена успешно!');
    console.log('🎉 Всё работает, база данных готова!');
    process.exit(0);
  })
  .catch(err => {
    console.log('❌ Ошибка подключения:', err.message);
    process.exit(1);
  });