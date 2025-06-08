const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    mysql_user_id: { // ID користувача з твоєї існуючої MySQL бази даних студентів
        type: String, // Або Number, залежно від типу ID у MySQL
        required: true,
        unique: true // Гарантує, що кожен mysql_user_id буде унікальним
    },
    username: {
        type: String,
        required: true
        // Можна додати trim: true
    },
    status: {
        type: String,
        enum: ['online', 'offline'],
        default: 'offline'
    },
    // Можна додати поле last_seen: Date
}, { timestamps: true }); // timestamps додасть поля createdAt та updatedAt автоматично

// Створюємо індекс для швидкого пошуку по mysql_user_id
userSchema.index({ mysql_user_id: 1 });

const User = mongoose.model('User', userSchema);

module.exports = User;
