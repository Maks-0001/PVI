const mongoose = require('mongoose');
  const Schema = mongoose.Schema;

  const messageSchema = new Schema({
      chatRoomId: {
          type: Schema.Types.ObjectId,
          ref: 'ChatRoom', // Посилання на модель ChatRoom
          required: true
      },
      senderId: { // ID відправника з нашої колекції User в MongoDB
          type: Schema.Types.ObjectId,
          ref: 'User',
          required: true
      },
      // Якщо не створюєш окрему колекцію User в MongoDB,
      // а посилаєшся безпосередньо на MySQL ID:
      // sender_mysql_id: {
      //     type: String, // Або Number
      //     required: true
      // },
      content: {
          type: String,
          required: true,
          trim: true
      },
      timestamp: { // Це поле вже є через { timestamps: true }, але можна залишити для ясності або кастомної логіки
          type: Date,
          default: Date.now
      },
      status: { // Наприклад, "sent", "delivered", "read"
          type: String,
          enum: ['sent', 'delivered', 'read'],
          default: 'sent'
      },
      // Можна додати readBy: [{ type: Schema.Types.ObjectId, ref: 'User' }]
  }, { timestamps: true }); // createdAt, updatedAt

  // Індекси
  messageSchema.index({ chatRoomId: 1 });
  messageSchema.index({ chatRoomId: 1, createdAt: -1 }); // Для сортування повідомлень у чаті

  const Message = mongoose.model('Message', messageSchema);

  module.exports = Message;