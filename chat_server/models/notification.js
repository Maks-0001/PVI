// chat_server/models/notification.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const notificationSchema = new Schema({
    userId: { // Кому сповіщення (MongoDB ObjectId користувача)
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    chatId: { // З якого чату (MongoDB ObjectId ChatRoom)
        type: Schema.Types.ObjectId,
        ref: 'ChatRoom',
        required: true
    },
    chatName: { // Для відображення (назва групи або ім'я співрозмовника)
        type: String,
        required: true
    },
    senderName: { // Хто надіслав повідомлення, що спричинило сповіщення
        type: String,
        required: true
    },
    messagePreview: {
        type: String,
        required: true
    },
    isRead: {
        type: Boolean,
        default: false
    }
}, { timestamps: true }); // createdAt, updatedAt

notificationSchema.index({ userId: 1, isRead: 1 }); // Для швидкого пошуку непрочитаних сповіщень користувача

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;