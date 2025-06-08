const mongoose = require('mongoose');
  const Schema = mongoose.Schema;

  const chatRoomSchema = new Schema({
      name: { // Назва групового чату, може бути порожнім для приватних чатів 1-на-1
          type: String,
          trim: true
      },
      participants: [{ // Масив ID учасників
          type: Schema.Types.ObjectId,
          ref: 'User' // Посилання на модель User (користувачі, збережені в MongoDB)
      }],
      isGroupChat: {
          type: Boolean,
          default: false // За замовчуванням чат не груповий (1-на-1)
      },
      lastMessage: { // Опціонально, для відображення останнього повідомлення у списку чатів
          type: Schema.Types.ObjectId,
          ref: 'Message'
      },
      // Можна додати поле createdBy: { type: Schema.Types.ObjectId, ref: 'User' }
  }, { timestamps: true }); // createdAt, updatedAt

  // Індекси для швидкого пошуку чатів за учасниками
  chatRoomSchema.index({ participants: 1 });

  const ChatRoom = mongoose.model('ChatRoom', chatRoomSchema);

  module.exports = ChatRoom;