import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema({
  login: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'parent', 'teacher'], required: true },
  name: { type: String, required: true },
  avatar: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  
  childrenIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  class: { type: String, default: '' },
  school: { type: String, default: '' },
  
  level: { type: Number, default: 1 },
  experience: { type: Number, default: 0 },
  totalExperience: { type: Number, default: 0 },  
  coins: { type: Number, default: 0 },
  totalTasksCompleted: { type: Number, default: 0 },
  
  subjectsProgress: {
    math: { score: { type: Number, default: 0 }, tasksCompleted: { type: Number, default: 0 } },
    russian: { score: { type: Number, default: 0 }, tasksCompleted: { type: Number, default: 0 } },
    english: { score: { type: Number, default: 0 }, tasksCompleted: { type: Number, default: 0 } },
    kyrgyz: { score: { type: Number, default: 0 }, tasksCompleted: { type: Number, default: 0 } },
    science: { score: { type: Number, default: 0 }, tasksCompleted: { type: Number, default: 0 } }
  },
  
  completedTasks: [{
    taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
    score: Number,
    coinsEarned: Number,
    completedAt: { type: Date, default: Date.now }
  }],
  
  inventory: { type: [String], default: [] },
  equippedItems: {
    avatar: { type: String, default: '🎓' },
    frame: { type: String, default: 'border-primary' },
    badge: { type: String, default: '' }
  },
  
  taskProgress: { type: Object, default: {} }
});

userSchema.pre('save', async function(next) {
  if (this.isModified('email') && this.email) {
    this.email = this.email.toLowerCase().trim();
  }
  if (this.isModified('login') && this.login) {
    this.login = this.login.toLowerCase().trim();
  }
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;

  const isBcryptHash = /^\$2[aby]\$/.test(this.password);
  if (isBcryptHash) {
    return await bcrypt.compare(candidatePassword, this.password);
  }

  const isPlainMatch = candidatePassword === this.password;
  if (isPlainMatch) {
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(candidatePassword, salt);
    await this.updateOne({ password: hashed });
    return true;
  }

  return false;
};

const User = mongoose.model('User', userSchema);
export default User;
