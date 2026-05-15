import mongoose from 'mongoose';
import User from './models/User.js';

(async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/test';
    await mongoose.connect(uri);
    console.log('connected');
    const u = new User({ login: 'testuser999', email: 'test999@example.com', password: 'Secret123', role: 'parent', name: 'Test User' });
    await u.save();
    console.log('saved', u._id.toString());
  } catch (err) {
    console.error('ERR', err);
  } finally {
    await mongoose.disconnect();
  }
})();
