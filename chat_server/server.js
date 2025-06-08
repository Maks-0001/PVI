// Lab_1/chat_server/server.js
// Імпортуємо необхідні модулі
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const mongoose = require('mongoose');
const Notification = require('./models/notification'); //

// --- ІМПОРТ МОДЕЛЕЙ MONGODB ---
const User = require('./models/user'); //
const ChatRoom = require('./models/chatRoom'); //
const Message = require('./models/message'); //

const app = express();
const httpServer = http.createServer(app);

const io = new Server(httpServer, {
    cors: {
        origin: "http://localhost", // Your PHP app's origin
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 3001;
const MONGODB_URI = 'mongodb://localhost:27017/chat_app_db';

// { socketId: { userIdMongo: '...', mysqlUserId: '...', username: '...', currentRoom: '...' } }
const connectedUsersSockets = {}; //

mongoose.connect(MONGODB_URI) //
    .then(() => console.log('Успішно підключено до MongoDB!'))
    .catch(err => console.error('Помилка підключення до MongoDB:', err));


io.on('connection', (socket) => { //
    console.log(`Клієнт підключився: ${socket.id}`);

    socket.on('authenticate', async (authData) => { //
        const token = authData ? authData.token : null;
        const clientMysqlUserId = authData ? authData.userId : null;
        const clientUsername = authData ? authData.username : null; //

        console.log(`Спроба аутентифікації для socket ID: ${socket.id} з токеном: ${token}, mysqlUserId: ${clientMysqlUserId}, username: ${clientUsername}`);

        const isValidToken = token && clientMysqlUserId; //

        if (isValidToken) {
            try {
                let user = await User.findOne({ mysql_user_id: clientMysqlUserId }); //
        let previousUsernameInDb = null; // Зберігатиме попереднє ім'я з БД

        if (!user) {
            // Логіка створення нового користувача
            const usernameToCreate = clientUsername || `User_${clientMysqlUserId}`;
            console.log(`Користувач з mysql_user_id: ${clientMysqlUserId} не знайдений в MongoDB. Створюємо нового з ім'ям: ${usernameToCreate}.`);
            user = new User({ //
                mysql_user_id: clientMysqlUserId,
                username: usernameToCreate,
                status: 'online' //
            });
            // previousUsernameInDb залишається null, бо користувач новий
        } else {
            // Логіка оновлення існуючого користувача
            previousUsernameInDb = user.username; // Зберігаємо поточне ім'я з БД перед можливим оновленням
            let oldStatus = user.status; //
            user.status = 'online'; //
            if (clientUsername && user.username !== clientUsername) { //
                console.log(`Оновлюємо ім'я користувача в MongoDB з '${user.username}' на '${clientUsername}'.`);
                user.username = clientUsername; //
            }
        }
        await user.save(); //
        const finalUsernameInDb = user.username; // Актуальне ім'я після збереження

        // Зберігаємо дані в connectedUsersSockets
        connectedUsersSockets[socket.id] = { //
            userIdMongo: user._id.toString(), //
            mysqlUserId: clientMysqlUserId.toString(), //
            username: finalUsernameInDb, // // Використовуємо finalUsernameInDb
            currentRoom: null 
        };

        // Надсилаємо подію 'authenticated' клієнту
        socket.emit('authenticated', { //
            userIdMongo: user._id.toString(), 
            mysqlUserId: clientMysqlUserId.toString(), 
            username: finalUsernameInDb, // Надсилаємо актуальне ім'я
            message: 'Аутентифікація успішна!'
        });
        
        // Перевіряємо, чи ім'я фактично змінилося в БД ПІД ЧАС ЦІЄЇ АВТЕНТИФІКАЦІЇ
        const usernameActuallyChanged = previousUsernameInDb && finalUsernameInDb !== previousUsernameInDb;

        if (usernameActuallyChanged) {
            console.log(`Ім'я користувача ${user._id} оновлено з '${previousUsernameInDb}' на '${finalUsernameInDb}'. Починаю оновлення інформації в чатах.`);

            // Знаходимо всі чати, де користувач є учасником
            const userChats = await ChatRoom.find({ participants: user._id })
                .populate('participants', 'username mysql_user_id status _id') // Важливо, щоб тут username був вже оновлений
                .populate({
                    path: 'lastMessage',
                    populate: { path: 'senderId', select: 'username _id' }
                });

            // Для кожного чату розсилаємо оновлення його учасникам
            for (const chat of userChats) {
                chat.participants.forEach(chatParticipant => {
                    Object.keys(connectedUsersSockets).forEach(socketIdRecipient => {
                        if (connectedUsersSockets[socketIdRecipient].userIdMongo === chatParticipant._id.toString()) {
                            // Надсилаємо оновлений об'єкт чату
                            io.to(socketIdRecipient).emit('chatListUpdated', chat.toObject());
                            console.log(`Надіслано chatListUpdated для чату ${chat._id} користувачу ${chatParticipant.username}`);

                            // Якщо цей чат активний у клієнта, оновити деталі учасників
                            if (connectedUsersSockets[socketIdRecipient].currentRoom === chat._id.toString()) {
                                io.to(socketIdRecipient).emit('chatParticipantsUpdated', {
                                    chatId: chat._id.toString(),
                                    participants: chat.participants.map(p => ({
                                        _id: p._id.toString(),
                                        username: p.username, // Тут вже буде оновлене ім'я
                                        mysql_user_id: p.mysql_user_id,
                                        status: p.status
                                    })),
                                    updatedChatRoomData: chat.toObject()
                                });
                                console.log(`Надіслано chatParticipantsUpdated для чату ${chat._id} користувачу ${chatParticipant.username}`);
                            }
                        }
                    });
                });
            }
        }

        // Логіка оновлення статусу користувача (online/offline)
        // ... (ваш існуючий код для userStatusChanged)
        const oldStatus = user.status === 'online' ? 'offline' : 'online'; // Це припущення, можливо, треба передавати точніший попередній статус
        if (oldStatus !== 'online' || usernameActuallyChanged) { // Посилати userStatusChanged якщо статус змінився АБО якщо ім'я змінилося
            io.emit('userStatusChanged', { //
                userIdMongo: user._id.toString(),
                status: 'online',
                username: finalUsernameInDb // Надсилаємо оновлене ім'я
            });
            console.log(`Надіслано userStatusChanged: ${finalUsernameInDb} is online`);
        }

            } catch (err) {
                console.error('Помилка під час аутентифікації або роботи з БД User:', err);
                socket.emit('unauthorized', { message: 'Помилка сервера під час аутентифікації.' }); //
            }
        } else {
            console.log(`Токен/mysqlUserId для ${socket.id} невалідний або відсутній.`);
            socket.emit('unauthorized', { message: 'Помилка аутентифікації. Невалідний токен або mysqlUserId.' }); //
        }
    });

    socket.on('createOrJoinChat', async (data) => { //
        if (!connectedUsersSockets[socket.id]) {
            socket.emit('unauthorized', { message: 'Спочатку потрібно аутентифікуватися.' }); //
            return;
        }
        const currentUserSocketData = connectedUsersSockets[socket.id]; //
        const currentUserMongoId = currentUserSocketData.userIdMongo; //
        const { participantMysqlIds = [], chatName } = data; //

        if (!Array.isArray(participantMysqlIds)) {
             socket.emit('error', { message: 'Некоректний формат учасників.' }); //
            return;
        }

        try {
            const participantMongoIdsPromises = participantMysqlIds.map(async (mysqlId) => {
                if (mysqlId.toString() === currentUserSocketData.mysqlUserId) return null; 
                let participantUser = await User.findOne({ mysql_user_id: mysqlId.toString() }); //
                if (!participantUser) {
                    const tempUsername = `User_${mysqlId}`; 
                    console.log(`Створюємо тимчасового User для mysql_user_id: ${mysqlId} з ім'ям ${tempUsername}`);
                    participantUser = new User({ //
                        mysql_user_id: mysqlId.toString(),
                        username: tempUsername, 
                        status: 'offline' 
                    });
                    await participantUser.save(); //
                }
                return participantUser._id; 
            });

            const resolvedParticipantMongoIds = (await Promise.all(participantMongoIdsPromises)).filter(id => id); 

            const allParticipantMongoIdsInChat = [new mongoose.Types.ObjectId(currentUserMongoId), ...resolvedParticipantMongoIds]; 
            
            const uniqueParticipantMongoIds = [...new Set(allParticipantMongoIdsInChat.map(id => id.toString()))] 
                .map(idStr => new mongoose.Types.ObjectId(idStr));


            if (uniqueParticipantMongoIds.length === 0 || (uniqueParticipantMongoIds.length < 2 && !chatName && participantMysqlIds.length > 0) ) { 
                socket.emit('error', { message: 'Для створення чату потрібно вказати учасників або назву групового чату.' }); 
                return;
            }

            let chatRoom; 
            const isEffectivelyGroupChat = uniqueParticipantMongoIds.length > 2 || (chatName && chatName.trim() !== ''); 
            const isPrivateChatWithSelf = uniqueParticipantMongoIds.length === 1 && uniqueParticipantMongoIds[0].equals(currentUserMongoId); 


            if (!isEffectivelyGroupChat && uniqueParticipantMongoIds.length === 2 && !isPrivateChatWithSelf) { 
                console.log('Шукаю приватний чат для учасників:', uniqueParticipantMongoIds.map(id => id.toString()));
                chatRoom = await ChatRoom.findOne({ 
                    isGroupChat: false, 
                    participants: { 
                        $all: uniqueParticipantMongoIds, 
                        $size: 2 
                    }
                });
            } else if (isPrivateChatWithSelf && !chatName) { 
                 chatRoom = await ChatRoom.findOne({ 
                    isGroupChat: false, 
                    participants: { $all: [currentUserMongoId], $size: 1 } 
                 });
            }

            if (!chatRoom) { 
                let finalChatName = chatName ? chatName.trim() : null; 
                let finalIsGroupChat = isEffectivelyGroupChat; 

                if (isPrivateChatWithSelf && !finalChatName) { 
                    finalIsGroupChat = false; 
                } else if (!finalIsGroupChat && uniqueParticipantMongoIds.length === 2) { 
                     finalIsGroupChat = false; 
                     finalChatName = null; 
                } else if (finalIsGroupChat && !finalChatName) { 
                    finalChatName = `Група з ${uniqueParticipantMongoIds.length} учасників`; 
                }

                console.log(`Створення нового чату. Учасники (MongoDB IDs): ${uniqueParticipantMongoIds.map(id => id.toString()).join(', ')}. Груповий: ${finalIsGroupChat}. Назва: ${finalChatName}`);

                const chatRoomDataToSave = { 
                    participants: uniqueParticipantMongoIds, 
                    isGroupChat: finalIsGroupChat, 
                };
                if (finalChatName) { 
                    chatRoomDataToSave.name = finalChatName; 
                }

                chatRoom = new ChatRoom(chatRoomDataToSave); 
                await chatRoom.save(); 
                console.log('Новий чат створено:', chatRoom._id);
            } else {
                console.log('Знайдено існуючий чат:', chatRoom._id); 
            }

            const newRoomId = chatRoom._id.toString(); 
            if (currentUserSocketData.currentRoom && currentUserSocketData.currentRoom !== newRoomId) { 
                socket.leave(currentUserSocketData.currentRoom); 
            }
            socket.join(newRoomId); 
            currentUserSocketData.currentRoom = newRoomId; 

            const populatedChatRoom = await ChatRoom.findById(chatRoom._id) 
                .populate('participants', 'username mysql_user_id status _id') 
                .populate({ 
                    path: 'lastMessage', 
                    populate: { path: 'senderId', select: 'username _id' } 
                });

            socket.emit('chatCreatedOrJoined', populatedChatRoom.toObject()); 

            uniqueParticipantMongoIds.forEach(participantMongoId => { 
                Object.keys(connectedUsersSockets).forEach(socketIdRecipient => { 
                    if (connectedUsersSockets[socketIdRecipient].userIdMongo === participantMongoId.toString()) { 
                        io.to(socketIdRecipient).emit('chatListUpdated', populatedChatRoom.toObject()); 
                        if (participantMongoId.toString() !== currentUserMongoId && chatRoom.createdAt.getTime() === chatRoom.updatedAt.getTime()) { 
                            io.to(socketIdRecipient).emit('newChatAvailable', populatedChatRoom.toObject()); 
                        }
                    }
                });
            });

        } catch (err) {
            console.error('Помилка створення або пошуку чату:', err);
            socket.emit('error', { message: 'Не вдалося створити або приєднатися до чату.' }); 
        }
    });

    socket.on('sendMessage', async (data) => { 
        if (!connectedUsersSockets[socket.id] || !connectedUsersSockets[socket.id].userIdMongo) { 
            socket.emit('unauthorized', { message: 'Аутентифікація не пройдена для надсилання повідомлення.' });
            return;
        }
        const senderData = connectedUsersSockets[socket.id]; 
        const targetChatId = data.roomName || senderData.currentRoom; 

        if (!targetChatId || !mongoose.Types.ObjectId.isValid(targetChatId)) { 
            socket.emit('error', { message: 'Некоректний ID чату для повідомлення.' }); 
            return;
        }

        try {
            const chatRoom = await ChatRoom.findById(targetChatId) 
                .populate('participants', '_id username status'); 
            if (!chatRoom) { 
                socket.emit('error', { message: 'Чат не знайдено.' }); 
                return;
            }
            if (!chatRoom.participants.some(p => p._id.equals(senderData.userIdMongo))) { 
                socket.emit('error', { message: 'Ви не є учасником цього чату.' }); 
                return;
            }

            const newMessage = new Message({ 
                chatRoomId: new mongoose.Types.ObjectId(targetChatId), 
                senderId: new mongoose.Types.ObjectId(senderData.userIdMongo), 
                content: data.message, 
            });
            await newMessage.save(); 

            chatRoom.lastMessage = newMessage._id; 
            chatRoom.updatedAt = Date.now(); 
            await chatRoom.save(); 

            const populatedMessage = await Message.findById(newMessage._id) 
                                                .populate('senderId', 'username _id'); 

            const messageToSend = { 
                _id: populatedMessage._id.toString(), 
                user: populatedMessage.senderId.username, 
                userIdMongo: populatedMessage.senderId._id.toString(), 
                message: populatedMessage.content, 
                room: targetChatId, 
                timestamp: populatedMessage.createdAt, 
                isSystem: false 
            };

            io.to(targetChatId).emit('newMessage', messageToSend); 

            const messagePreviewContent = populatedMessage.content.substring(0, 50) + (populatedMessage.content.length > 50 ? '...' : ''); 
            let chatDisplayNameForNotification; 

            if (!chatRoom.isGroupChat && chatRoom.participants.length === 2) { 
                chatDisplayNameForNotification = senderData.username; 
            } else {
                chatDisplayNameForNotification = chatRoom.name || `Група (${chatRoom.participants.length})`; 
            }

            for (const participant of chatRoom.participants) { 
                const participantMongoId = participant._id.toString(); 
                if (participantMongoId === senderData.userIdMongo) continue; 

                const newDbNotification = new Notification({ 
                    userId: participant._id, 
                    chatId: chatRoom._id,    
                    chatName: chatDisplayNameForNotification, 
                    senderName: senderData.username, 
                    messagePreview: messagePreviewContent, 
                    isRead: false 
                });
                await newDbNotification.save(); 
                console.log(`Створено DB Notification для ${participant.username} (ID: ${newDbNotification._id})`);

                Object.keys(connectedUsersSockets).forEach(socketIdRecipient => { 
                    const recipientSocketData = connectedUsersSockets[socketIdRecipient]; 
                    if (recipientSocketData && recipientSocketData.userIdMongo === participantMongoId) { 
                        // Надсилаємо Socket.IO сповіщення завжди (клієнт вирішить, чи показувати індикатор)
                        io.to(socketIdRecipient).emit('newNotification', { 
                            _id: newDbNotification._id.toString(), 
                            chatId: targetChatId, 
                            chatName: newDbNotification.chatName, 
                            senderName: newDbNotification.senderName, 
                            messagePreview: newDbNotification.messagePreview, 
                            createdAt: newDbNotification.createdAt 
                        });
                        console.log(`Надіслано Socket.IO сповіщення користувачу ${recipientSocketData.username} (політика: завжди надсилати, клієнт фільтрує UI).`);
                    }
                });
            }
            const updatedChatRoomForList = await ChatRoom.findById(targetChatId) 
                .populate('participants', 'username mysql_user_id status _id') 
                .populate({ 
                    path: 'lastMessage', 
                    populate: { path: 'senderId', select: 'username _id' } 
                });
            chatRoom.participants.forEach(p => { 
                 Object.keys(connectedUsersSockets).forEach(sockId => { 
                    if(connectedUsersSockets[sockId].userIdMongo === p._id.toString()){ 
                        io.to(sockId).emit('chatListUpdated', updatedChatRoomForList.toObject()); 
                    }
                 });
            });

        } catch (err) {
            console.error('Помилка збереження повідомлення або створення/надсилання сповіщення:', err);
            socket.emit('error', { message: 'Не вдалося надіслати повідомлення або обробити сповіщення.' }); 
        }
    });

    socket.on('loadUnreadNotifications', async () => { 
        if (!connectedUsersSockets[socket.id] || !connectedUsersSockets[socket.id].userIdMongo) return; 
        const currentUserMongoId = connectedUsersSockets[socket.id].userIdMongo; 
        try {
            const unreadNotifications = await Notification.find({ 
                userId: new mongoose.Types.ObjectId(currentUserMongoId), 
                isRead: false 
            }).sort({ createdAt: -1 }); 

            socket.emit('unreadNotificationsLoaded', unreadNotifications.map(n => ({ 
                _id: n._id.toString(), 
                chatId: n.chatId.toString(), 
                chatName: n.chatName, 
                senderName: n.senderName, 
                messagePreview: n.messagePreview, 
                createdAt: n.createdAt 
            })));
            console.log(`Надіслано ${unreadNotifications.length} непрочитаних сповіщень користувачу ${connectedUsersSockets[socket.id].username}`);
        } catch (err) {
            console.error('Помилка завантаження непрочитаних сповіщень:', err);
        }
    });

    socket.on('markNotificationsAsRead', async (data) => { 
        if (!connectedUsersSockets[socket.id] || !connectedUsersSockets[socket.id].userIdMongo) return; 
        const currentUserMongoId = connectedUsersSockets[socket.id].userIdMongo; 
        try {
            let updateQuery = { userId: new mongoose.Types.ObjectId(currentUserMongoId), isRead: false }; 

            const hasSpecificNotificationIds = data && data.notificationIds && Array.isArray(data.notificationIds) && data.notificationIds.length > 0; 
            const hasSpecificChatId = data && data.chatId && mongoose.Types.ObjectId.isValid(data.chatId); 

            if (hasSpecificNotificationIds) { 
                updateQuery._id = { $in: data.notificationIds.map(id => mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : null).filter(id => id) }; 
            } else if (hasSpecificChatId) { 
                updateQuery.chatId = new mongoose.Types.ObjectId(data.chatId); 
            }
            
            if (hasSpecificNotificationIds || hasSpecificChatId || (!hasSpecificNotificationIds && !hasSpecificChatId)) {
                const result = await Notification.updateMany( 
                    updateQuery,
                    { $set: { isRead: true } } 
                );
                console.log(`Позначено ${result.modifiedCount} сповіщень як прочитані для користувача ${connectedUsersSockets[socket.id].username} за запитом від клієнта:`, data); 
                socket.emit('notificationsMarkedAsRead', { count: result.modifiedCount, requestData: data }); 
            } else {
                 console.log('Недостатньо даних для позначення сповіщень як прочитаних, або запит порожній у неочікуваний спосіб. Запит:', data); 
            }
        } catch (err) {
            console.error('Помилка позначення сповіщень як прочитаних:', err); 
        }
    });

    socket.on('joinRoom', async (chatId) => { 
        if (!connectedUsersSockets[socket.id] || !connectedUsersSockets[socket.id].userIdMongo) { 
            socket.emit('unauthorized', { message: 'Спочатку потрібно аутентифікуватися.' }); 
            return;
        }
        const currentUserData = connectedUsersSockets[socket.id]; 

        if (!mongoose.Types.ObjectId.isValid(chatId)) { 
            socket.emit('error', { message: 'Некоректний ID чату.'}); 
            return;
        }

        try {
            const room = await ChatRoom.findById(chatId) 
                .populate('participants', 'username mysql_user_id status _id') 
                .populate({ path: 'lastMessage', populate: { path: 'senderId', select: 'username _id' }}); 
    
            if (!room) { 
                socket.emit('error', { message: 'Чат не знайдено.' }); 
                return;
            }
            if (!room.participants.some(p => p._id.equals(currentUserData.userIdMongo))) { 
                socket.emit('error', { message: 'Ви не є учасником цього чату.' }); 
                return;
            }

            if (currentUserData.currentRoom && currentUserData.currentRoom !== chatId) { 
                socket.leave(currentUserData.currentRoom); 
                console.log(`Користувач ${currentUserData.username} залишив кімнату Socket.IO: ${currentUserData.currentRoom}`);
            }
            socket.join(chatId); 
            currentUserData.currentRoom = chatId; 
            console.log(`Користувач ${currentUserData.username} приєднався до кімнати Socket.IO: ${chatId}`);

            let clientChatName = room.name; 
            if (!room.isGroupChat && room.participants.length <= 2) { 
                const otherParticipant = room.participants.find(p => !p._id.equals(currentUserData.userIdMongo)); 
                clientChatName = otherParticipant ? otherParticipant.username : (room.participants[0] ? room.participants[0].username : "Приватний чат"); 
                 if (room.participants.length === 1 && room.participants[0]._id.equals(currentUserData.userIdMongo)){ 
                     clientChatName = `${currentUserData.username} (Нотатки)`; 
                 }
            }

            socket.emit('joinedRoom', { 
                room: chatId, 
                name: clientChatName, 
                participants: room.participants.map(p => ({ 
                    _id: p._id.toString(), 
                    username: p.username, 
                    mysql_user_id: p.mysql_user_id, 
                    status: p.status 
                })),
                isGroupChat: room.isGroupChat, 
                fullChatData: room.toObject() 
            });

            const messages = await Message.find({ chatRoomId: new mongoose.Types.ObjectId(chatId) }) 
                .sort({ createdAt: 1 }) 
                .limit(100) 
                .populate('senderId', 'username _id'); 

            socket.emit('loadHistory', { 
                room: chatId, 
                messages: messages.map(m => ({ 
                    _id: m._id.toString(), 
                    senderId: m.senderId ? { _id: m.senderId._id.toString(), username: m.senderId.username } : null, 
                    content: m.content, 
                    createdAt: m.createdAt, 
                    isSystem: m.isSystem || false 
                }))
            });

        } catch (err) {
            console.error(`Помилка приєднання до кімнати ${chatId}:`, err);
            socket.emit('error', { message: 'Не вдалося приєднатися до кімнати.' }); 
        }
    });

    socket.on('leaveRoom', (data) => { 
        const roomToLeave = data && data.roomId ? data.roomId : (connectedUsersSockets[socket.id] ? connectedUsersSockets[socket.id].currentRoom : null); 
        if (connectedUsersSockets[socket.id] && roomToLeave) { 
            const currentUserSocketData = connectedUsersSockets[socket.id]; 
            socket.leave(roomToLeave); 
            console.log(`Користувач ${currentUserSocketData.username} залишив кімнату Socket.IO: ${roomToLeave}`);
            if (currentUserSocketData.currentRoom === roomToLeave) { 
                 currentUserSocketData.currentRoom = null; 
            }
            socket.emit('leftRoom', { room: roomToLeave }); 
        }
    });

    socket.on('addUsersToChat', async (data) => { 
        if (!connectedUsersSockets[socket.id] || !connectedUsersSockets[socket.id].userIdMongo) { 
            socket.emit('unauthorized', { message: 'Аутентифікація не пройдена.' }); 
            return;
        }
        const { chatId, usersToAddMysqlIds } = data; 
        const currentUserMongoId = connectedUsersSockets[socket.id].userIdMongo; 
        const currentUsername = connectedUsersSockets[socket.id].username; 


        if (!chatId || !mongoose.Types.ObjectId.isValid(chatId) || !usersToAddMysqlIds || !Array.isArray(usersToAddMysqlIds) || usersToAddMysqlIds.length === 0) { 
            socket.emit('error', { message: 'Недостатньо або некоректні дані для додавання учасників.' }); 
            return;
        }

        try {
            const chatRoom = await ChatRoom.findById(chatId).populate('participants', '_id mysql_user_id'); 
            if (!chatRoom) { 
                socket.emit('error', { message: 'Чат не знайдено.' }); 
                return;
            }

            if (!chatRoom.participants.some(p => p._id.equals(currentUserMongoId))) { 
                socket.emit('error', { message: 'Ви не можете додавати учасників до цього чату.' }); 
                return;
            }

            const newParticipantMongoIds = []; 
            const addedUsernames = []; 

            for (const mysqlId of usersToAddMysqlIds) { 
                if (chatRoom.participants.some(p => p.mysql_user_id === mysqlId.toString())) { 
                    console.log(`Користувач з MySQL ID ${mysqlId} вже в чаті ${chatId}.`);
                    continue; 
                }

                let user = await User.findOne({ mysql_user_id: mysqlId.toString() }); 
                if (!user) { 
                    const tempUsername = `User_${mysqlId}`; 
                    user = new User({ mysql_user_id: mysqlId.toString(), username: tempUsername, status: 'offline' }); 
                    await user.save(); 
                    console.log(`Створено нового користувача (тимчасово) для додавання: ${tempUsername}`);
                }
                if (user && user._id) { 
                    newParticipantMongoIds.push(user._id); 
                    addedUsernames.push(user.username); 
                }
            }

            if (newParticipantMongoIds.length > 0) { 
                chatRoom.participants.push(...newParticipantMongoIds); 
                if (!chatRoom.isGroupChat && chatRoom.participants.length > 2) { 
                    chatRoom.isGroupChat = true; 
                    if (!chatRoom.name) { 
                        chatRoom.name = `Група з ${chatRoom.participants.length} учасників`; 
                    }
                }
                chatRoom.updatedAt = Date.now(); 
                await chatRoom.save(); 

                const updatedChatRoom = await ChatRoom.findById(chatId) 
                    .populate('participants', 'username mysql_user_id status _id') 
                    .populate({ path: 'lastMessage', populate: { path: 'senderId', select: 'username _id' } }); 

                console.log(`До чату ${chatId} додано нових учасників. Новий склад:`, updatedChatRoom.participants.map(p => p.username));

                updatedChatRoom.participants.forEach(participant => { 
                    Object.keys(connectedUsersSockets).forEach(socketIdRecipient => { 
                        if (connectedUsersSockets[socketIdRecipient].userIdMongo === participant._id.toString()) { 
                            io.to(socketIdRecipient).emit('chatParticipantsUpdated', { 
                                chatId: chatId, 
                                participants: updatedChatRoom.participants.map(p => ({ _id: p._id.toString(), username: p.username, mysql_user_id: p.mysql_user_id, status: p.status })), 
                                updatedChatRoomData: updatedChatRoom.toObject() 
                            });
                             io.to(socketIdRecipient).emit('chatListUpdated', updatedChatRoom.toObject()); 
                        }
                    });
                });
                 const systemMessageContent = `${currentUsername} додав ${addedUsernames.join(', ')} до чату.`; 
                 const systemMessage = new Message({ 
                    chatRoomId: chatRoom._id, 
                    senderId: senderId , 
                    content: systemMessageContent, 
                    isSystem: true 
                 });
                 await systemMessage.save(); 
                 chatRoom.lastMessage = systemMessage._id; 
                 await chatRoom.save(); 

                 io.to(chatId).emit('newMessage', { 
                    _id: systemMessage._id.toString(), 
                    user: 'System', 
                    message: systemMessageContent, 
                    room: chatId, 
                    timestamp: systemMessage.createdAt, 
                    isSystem: true 
                 });

            } else {
                socket.emit('info', { message: 'Вибрані користувачі вже є учасниками чату або не вдалося їх додати.' }); 
            }
        } catch (err) {
            console.error('Помилка додавання учасників до чату:', err);
            socket.emit('error', { message: 'Не вдалося додати учасників.' }); 
        }
    });

    socket.on('loadUserChats', async () => { 
        if (!connectedUsersSockets[socket.id] || !connectedUsersSockets[socket.id].userIdMongo) { 
            return;
        }
        const currentUserMongoId = connectedUsersSockets[socket.id].userIdMongo; 
        try {
            const userChats = await ChatRoom.find({ participants: new mongoose.Types.ObjectId(currentUserMongoId) }) 
                .populate('participants', 'username mysql_user_id status _id') 
                .populate({ 
                    path: 'lastMessage', 
                    populate: { path: 'senderId', select: 'username _id' } 
                })
                .sort({ updatedAt: -1 }); 

            socket.emit('userChatsLoaded', userChats.map(chat => chat.toObject())); 
        } catch (err) {
            console.error('Помилка завантаження чатів користувача:', err);
            socket.emit('error', { message: 'Не вдалося завантажити список чатів.' }); 
        }
    });

    socket.on('disconnect', async (reason) => { 
        console.log(`Клієнт відключився: ${socket.id}, причина: ${reason}`);
        const disconnectedUserData = connectedUsersSockets[socket.id]; 

        if (disconnectedUserData && disconnectedUserData.userIdMongo) { 
            let isStillConnectedElsewhere = false; 
            for (const sid in connectedUsersSockets) { 
                if (sid !== socket.id && connectedUsersSockets[sid].userIdMongo === disconnectedUserData.userIdMongo) { 
                    isStillConnectedElsewhere = true; 
                    break;
                }
            }
            
            delete connectedUsersSockets[socket.id]; 

            if (!isStillConnectedElsewhere) { 
                console.log(`Користувач ${disconnectedUserData.username} (ID: ${disconnectedUserData.userIdMongo}) не має інших активних сесій.`);
                if (disconnectedUserData.currentRoom) { 
                    console.log(`Користувач ${disconnectedUserData.username} автоматично залишив кімнату ${disconnectedUserData.currentRoom} при відключенні останньої сесії.`);
                }
                try {
                    if (mongoose.Types.ObjectId.isValid(disconnectedUserData.userIdMongo)) { 
                        const user = await User.findByIdAndUpdate(disconnectedUserData.userIdMongo, { status: 'offline', last_seen: new Date() }, { new: true }); 
                        if (user) { 
                            console.log(`Статус користувача ${user.username} оновлено на 'offline'.`);
                            io.emit('userStatusChanged', { 
                                userIdMongo: user._id.toString(),
                                status: 'offline',
                                username: user.username
                            });
                            console.log(`Надіслано userStatusChanged: ${user.username} is offline`);
                        } else {
                             console.log(`Користувача з MongoID ${disconnectedUserData.userIdMongo} не знайдено для оновлення статусу.`);
                        }
                    } else {
                        console.log(`Невалідний MongoID для відключеного користувача: ${disconnectedUserData.userIdMongo}`);
                    }
                } catch (err) {
                    console.error(`Помилка оновлення статусу користувача ${disconnectedUserData.username}:`, err);
                }
            } else {
                 console.log(`Користувач ${disconnectedUserData.username} (ID: ${disconnectedUserData.userIdMongo}) все ще має активні сесії.`);
            }
        } else {
            console.log(`Дані для відключеного сокета ${socket.id} не знайдено або userIdMongo відсутній.`);
        }
    });
}); 

app.get('/', (req, res) => { 
    res.send('<h1>Чат-сервер працює!</h1><p>Socket.IO очікує на підключення.</p>');
});

httpServer.listen(PORT, () => { 
    console.log(`Сервер запущено та слухає на порті ${PORT}`);
});