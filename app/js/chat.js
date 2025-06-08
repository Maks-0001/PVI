// Lab_1/app/js/chat.js
document.addEventListener('DOMContentLoaded', () => {
    // Перевіряємо, чи io завантажено, і чи window.socket вже ініціалізовано global-socket.js
    if (typeof io === 'undefined' && !window.socket) {
        console.error('Socket.IO client (io) is not defined and no global socket instance exists. Ensure Socket.IO is loaded.');
        alert('Помилка завантаження чату. Socket.IO не знайдено.');
        return;
    }

    // Використовуємо глобальний сокет, якщо він є, інакше створюємо новий (малоймовірно, якщо global-socket.js працює)
    if (!window.socket || !window.socket.connected) {
        if (typeof io !== 'undefined') {
            console.log('Chat.js: Global socket not found or not connected, initializing new one for chat page.');
            window.socket = io('http://localhost:3001', {
                reconnectionAttempts: 5,
                reconnectionDelay: 3000,
            });
        } else {
            // Це не повинно траплятися, якщо global-socket.js успішно завантажив io
            console.error('Socket.IO client (io) is not defined in chat.js and no global socket present.');
            alert('Помилка завантаження чату. Socket.IO не знайдено.');
            return;
        }
    } else {
        console.log('Chat.js: Using existing global socket.');
    }
    
    const socket = window.socket; // Локальна змінна для зручності

    const chatToken = localStorage.getItem('chat_token');
    const currentUserId = localStorage.getItem('user_id'); // Це mysql_user_id
    const currentUsername = localStorage.getItem('username');
    let currentUserMongoId = window.currentUserMongoId || null; // Беремо з глобального, якщо є

    // Елементи DOM
    const chatListContainer = document.getElementById('chatList');
    const activeChatNameElement = document.getElementById('activeChatName');
    const activeChatMembersContainer = document.querySelector('.chat-header .chat-members');
    const messagesContainer = document.getElementById('messagesContainer');
    const messageForm = document.getElementById('messageForm');
    const messageInput = document.getElementById('messageInput');
    const newChatButton = document.getElementById('newChatButton');
    const newChatModal = document.getElementById('newChatModal');
    const studentListContainer = document.getElementById('studentListContainer');
    const createChatForm = document.getElementById('createChatForm');
    const closeNewChatModalButton = document.getElementById('closeNewChatModal');
    const addMembersModal = document.getElementById('addMembersModal');
    const closeAddMembersModalButton = document.getElementById('closeAddMembersModal');
    const addMembersForm = document.getElementById('addMembersForm');
    const addMembersStudentListContainer = document.getElementById('addMembersStudentListContainer');
    const addMembersChatNameSpan = document.getElementById('addMembersChatName');
    const addMembersChatIdInput = document.getElementById('addMembersChatId');

    let currentRoomId = null;
    window.currentRoomIdForNotifications = null; // Для синхронізації з global-socket
    let allStudents = [];
    let loadedChatsCache = [];

    if (!chatToken || !currentUserId) {
        console.error('Не знайдено токен або ID користувача. Будь ласка, авторизуйтесь.');
        alert('Помилка: Необхідна авторизація для доступу до чату.');
        return;
    }

    // --- ФУНКЦІЇ ДОПОМІЖНІ ---
    function escapeHTML(str) {
        const div = document.createElement('div');
        div.appendChild(document.createTextNode(str || ''));
        return div.innerHTML;
    }

    function getChatAvatar(participants = [], isGroupChat = false) {
        let iconClass = 'fa-user'; // Default
        if (isGroupChat) {
            iconClass = 'fa-users';
        } else if (currentUserMongoId && participants.length === 1 && participants[0] && participants[0]._id && participants[0]._id.toString() === currentUserMongoId) {
            iconClass = 'fa-user-circle'; // Chat with self (notes)
        } else if (participants.length > 0) {
            // For 1-on-1 chats, could potentially show a specific icon if available
            // For now, default fa-user is fine if not group or self-chat
        }
        return `<div class="chat-avatar"><div class="default-avatar"><i class="fas ${iconClass}"></i></div></div>`;
    }
    
    function getMemberAvatar(username = "Unknown", userId = "N/A") {
        let icon = 'fa-user';
        if (username === 'Admin') icon = 'fa-user-shield';
        return `<div class="member-avatar" title="${escapeHTML(username)}"><div class="default-avatar-small"><i class="fas ${icon}"></i></div></div>`;
    }

    async function fetchStudents() {
        try {
            const response = await fetch('/Lab_1/app/api/controller.php?action=load');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const students = await response.json();
            allStudents = students.map(student => ({
                id: student.id.toString(), // MySQL ID
                name: `${student.first_name} ${student.last_name}`
            }));
        } catch (error) {
            console.error('Помилка завантаження списку студентів:', error);
        }
    }
    
    function populateStudentListForNewChat() {
        if (!studentListContainer) return;
        studentListContainer.innerHTML = '';
        let count = 0;
        allStudents.forEach(student => {
            if (student.id === currentUserId) return;
            const div = document.createElement('div');
            div.classList.add('student-select-item');
            div.innerHTML = `
                <input type="checkbox" id="student_new_${student.id}" name="participants" value="${student.id}">
                <label for="student_new_${student.id}">${escapeHTML(student.name)}</label>
            `;
            studentListContainer.appendChild(div);
            count++;
        });
        if (count === 0 && studentListContainer) studentListContainer.innerHTML = '<p>Немає доступних студентів для створення чату.</p>';
    }

    function populateStudentListForAddMembers(existingParticipantMysqlIds = []) {
        if (!addMembersStudentListContainer) return;
        addMembersStudentListContainer.innerHTML = '';
        let studentsAvailableToAdd = 0;
        allStudents.forEach(student => {
            if (student.id === currentUserId || existingParticipantMysqlIds.includes(student.id)) {
                return;
            }
            const div = document.createElement('div');
            div.classList.add('student-select-item');
            div.innerHTML = `
                <input type="checkbox" id="add_student_${student.id}" name="add_participants" value="${student.id}">
                <label for="add_student_${student.id}">${escapeHTML(student.name)}</label>
            `;
            addMembersStudentListContainer.appendChild(div);
            studentsAvailableToAdd++;
        });
        if (studentsAvailableToAdd === 0 && addMembersStudentListContainer) {
            addMembersStudentListContainer.innerHTML = '<p>Немає доступних студентів для додавання.</p>';
        }
    }

    function getChatHeaderHTML(chat) {
        if (!chat || !Array.isArray(chat.participants) || !currentUserMongoId) return 'Невідомий чат';
        if (chat.isGroupChat) {
            return escapeHTML(chat.name || `Група (${chat.participants.length})`);
        } else {
            const otherParticipant = chat.participants.find(p => p._id.toString() !== currentUserMongoId);
            if (otherParticipant) {
                const statusClass = otherParticipant.status === 'online' ? 'status-online' : 'status-offline';
                const statusText = otherParticipant.status === 'online' ? 'Online' : 'Offline';
                return `${escapeHTML(otherParticipant.username)} <span class="${statusClass}">(${statusText})</span>`;
            } else if (chat.participants.length === 1 && chat.participants[0]._id.toString() === currentUserMongoId) {
                const selfUsername = localStorage.getItem('username') || 'Я';
                return `${escapeHTML(selfUsername)} <span class="status-online">(Online)</span>`;
            }
            return 'Приватний чат';
        }
    }

    // --- ОБРОБНИКИ ПОДІЙ SOCKET.IO ---
    if (socket.connected && !currentUserMongoId) { 
        console.log('Chat.js: Socket connected, authenticating for chat page...');
        socket.emit('authenticate', { token: chatToken, userId: currentUserId, username: currentUsername });
    } else if (!socket.connected) { 
        socket.on('connect', () => {
            console.log('Chat.js: Connected to Socket.IO. Authenticating...');
            socket.emit('authenticate', { token: chatToken, userId: currentUserId, username: currentUsername });
        });
    }
    if (currentUserMongoId) {
        console.log('Chat.js: Already authenticated via global socket. Loading user chats.');
        if (allStudents.length === 0) fetchStudents();
        socket.emit('loadUserChats');
        socket.emit('loadUnreadNotifications'); 
    }


    socket.on('authenticated', (data) => {
        console.log('Chat.js: Authenticated with chat server.', data);
        currentUserMongoId = data.userIdMongo;
        window.currentUserMongoId = data.userIdMongo; 
        if (data.username && currentUsername !== data.username) {
            localStorage.setItem('username', data.username);
        }
        if (allStudents.length === 0) fetchStudents();
        socket.emit('loadUserChats');
        socket.emit('loadUnreadNotifications'); 
    });

    socket.on('unauthorized', (data) => {
        console.error('Chat.js: Authentication error:', data.message);
        alert(`Помилка аутентифікації в чаті: ${data.message}. Спробуйте перезайти.`);
    });

    socket.on('userChatsLoaded', (chats) => {
        console.log('Chat.js: Loaded user chats:', chats);
        loadedChatsCache = chats;
        renderChatList(chats);
        const navigateToChatId = localStorage.getItem('navigateToChatIdAfterChatsLoaded');
        if (navigateToChatId && chats.some(chat => chat._id === navigateToChatId)) {
            joinChatRoom(navigateToChatId);
            localStorage.removeItem('navigateToChatIdAfterChatsLoaded');
        } else if (chats && chats.length > 0) {
            const shouldJoinFirstChat = !currentRoomId || !chats.some(chat => chat._id === currentRoomId);
            if (shouldJoinFirstChat && !navigateToChatId) {
                joinChatRoom(chats[0]._id);
            } else if (currentRoomId) {
                const currentChatData = chats.find(chat => chat._id === currentRoomId);
                if (currentChatData && activeChatNameElement) {
                    activeChatNameElement.innerHTML = getChatHeaderHTML(currentChatData);
                    renderChatParticipants(currentChatData.participants);
                }
            }
        } else {
            if(activeChatNameElement) activeChatNameElement.textContent = 'Немає доступних чатів';
            if(activeChatMembersContainer) activeChatMembersContainer.innerHTML = '<span class="chat-members-title">Members:</span>';
            if(messagesContainer) messagesContainer.innerHTML = '<p>Створіть новий чат або дочекайтесь запрошення.</p>';
        }
    });
    
    socket.on('unreadNotificationsLoaded', (notifications) => {
        console.log('Chat.js: Loaded unread notifications for chat page:', notifications);
        const notificationDrop = document.querySelector(".notification-drop");
        if (!notificationDrop) return;

        let shouldShowIndicator = false;
        if (notifications && notifications.length > 0) {
            notifications.forEach(notif => {
                // Check against window.currentRoomIdForNotifications which is updated more immediately by optimistic join
                if (notif.chatId !== window.currentRoomIdForNotifications) { 
                    if (typeof window.addNotificationToDropdown === 'function') {
                         if (!notificationDrop.querySelector(`.notification-item[data-notification-id="${notif._id}"]`)) {
                            window.addNotificationToDropdown(notif);
                        }
                    }
                    shouldShowIndicator = true;
                } else {
                    // If for current room, mark as read
                    socket.emit('markNotificationsAsRead', { notificationIds: [notif._id] });
                }
            });
        }
        
        const indicator = document.getElementById('notification-indicator');
        if (indicator) {
            indicator.style.display = shouldShowIndicator ? 'block' : 'none';
             if (shouldShowIndicator) localStorage.setItem('hasUnreadNotifications', 'true');
            else localStorage.removeItem('hasUnreadNotifications');
        }

        if (typeof window.updateNotificationPlaceholder === 'function') {
            window.updateNotificationPlaceholder();
        }
    });

    socket.on('newNotification', (notificationData) => {
        console.log('Chat.js: Received LIVE new notification for chat page:', notificationData);

        if (notificationData.chatId === window.currentRoomIdForNotifications) {
            console.log('Chat.js: User in active chat for this notification. Marking as read.');
            if (socket && socket.connected) {
                 socket.emit('markNotificationsAsRead', { notificationIds: [notificationData._id] });
            }
            return; 
        }

        if (typeof window.addNotificationToDropdown === 'function') {
            const notificationDrop = document.querySelector(".notification-drop");
            if (notificationDrop && !notificationDrop.querySelector(`.notification-item[data-notification-id="${notificationData._id}"]`)) {
                window.addNotificationToDropdown(notificationData);
            }
        }
        if (typeof window.showNotificationIndicator === 'function') {
            window.showNotificationIndicator(true);
        }
    });

     socket.on('notificationsMarkedAsRead', (data) => {
        console.log(`Chat.js: ${data.count} notifications marked as read confirmed by server.`);
        const notificationDrop = document.querySelector(".notification-drop");
        if (!notificationDrop) return;

        if (data.requestData && data.requestData.notificationIds && Array.isArray(data.requestData.notificationIds)) {
            data.requestData.notificationIds.forEach(idToRemove => {
                const itemToRemove = notificationDrop.querySelector(`.notification-item[data-notification-id="${idToRemove}"]`);
                if (itemToRemove) itemToRemove.remove();
            });
        } else if (data.requestData && data.requestData.chatId) {
            const itemsToRemove = notificationDrop.querySelectorAll(`.notification-item[data-chat-id="${data.requestData.chatId}"]`);
            itemsToRemove.forEach(item => item.remove());
        }
        
        if (typeof window.updateNotificationPlaceholder === 'function') {
            window.updateNotificationPlaceholder();
        }

        const remainingNotifications = notificationDrop.querySelectorAll('.notification-item:not(.notification-placeholder)').length;
        if (remainingNotifications === 0) {
            const indicator = document.getElementById('notification-indicator');
            if (indicator) indicator.style.display = 'none';
            localStorage.removeItem('hasUnreadNotifications');
        }
    });
    
    socket.on('userStatusChanged', (data) => { 
        console.log('Chat.js: User status changed event received ->', data.username, 'is now', data.status);
        let chatHeaderNeedsUpdate = false;
        let chatListNeedsUpdate = false;

        loadedChatsCache.forEach(chat => {
            let participantFoundInThisChat = false;
            chat.participants.forEach(p => {
                if (p._id.toString() === data.userIdMongo) {
                    if (p.status !== data.status) { 
                        p.status = data.status;
                        participantFoundInThisChat = true;
                    }
                    if (data.username && p.username !== data.username) { 
                        p.username = data.username;
                        participantFoundInThisChat = true; 
                        chatListNeedsUpdate = true;
                    }
                }
            });

            if (chat._id === currentRoomId && participantFoundInThisChat) {
                chatHeaderNeedsUpdate = true;
            }
        });

        if (chatListNeedsUpdate) { 
            renderChatList(loadedChatsCache);
        }

        if (chatHeaderNeedsUpdate && activeChatNameElement && currentRoomId) {
            const currentChatData = loadedChatsCache.find(chat => chat._id === currentRoomId);
            if (currentChatData) {
                activeChatNameElement.innerHTML = getChatHeaderHTML(currentChatData);
                renderChatParticipants(currentChatData.participants); 
            }
        }
    });

    socket.on('chatCreatedOrJoined', (chatRoomData) => {
        console.log('Чат створено або приєднано:', chatRoomData);
        const existingIndex = loadedChatsCache.findIndex(c => c._id === chatRoomData._id);
        if (existingIndex > -1) {
            loadedChatsCache[existingIndex] = chatRoomData;
        } else {
            loadedChatsCache.push(chatRoomData);
        }
        socket.emit('loadUserChats'); 
        joinChatRoom(chatRoomData._id); 
        if (newChatModal && newChatModal.style.display === 'block') newChatModal.style.display = 'none';
    });

    socket.on('joinedRoom', (data) => { 
        console.log(`Приєднано до кімнати (сервер підтвердив): ${data.room} (Server name: ${data.name})`);
        // currentRoomId and window.currentRoomIdForNotifications were set optimistically in joinChatRoom
        // Here we mainly refresh data and UI elements based on server confirmation
        
        const currentChatData = data.fullChatData || loadedChatsCache.find(chat => chat._id === data.room);
        if (activeChatNameElement) {
            if (currentChatData) {
                activeChatNameElement.innerHTML = getChatHeaderHTML(currentChatData); 
            } else {
                activeChatNameElement.textContent = data.name; 
            }
        }
        renderChatParticipants(currentChatData ? currentChatData.participants : (data.participants || []));
        if(messagesContainer) messagesContainer.innerHTML = ''; 
        
        updateActiveChatInList(data.room); // Ensure UI list reflects active chat

        const justClickedNotificationForThisChat = localStorage.getItem('lastClickedNotificationChatId') === data.room;
        if (justClickedNotificationForThisChat) {
            console.log('Успішно перейшли до чату зі сповіщення (в joinedRoom):', data.room);
            localStorage.removeItem('lastClickedNotificationChatId');
            socket.emit('markNotificationsAsRead', { chatId: data.room }); 
            if (typeof window.hideNotificationIndicatorIfNoUnread === 'function') {
                window.hideNotificationIndicatorIfNoUnread();
            }
        }
        // History will be loaded by a separate 'loadHistory' event triggered by server's joinRoom logic
    });

    socket.on('loadHistory', (data) => { 
        console.log(`Завантажено історію для кімнати ${data.room}:`, data.messages.length, 'повідомлень');
        if (data.room === currentRoomId && messagesContainer) {
            messagesContainer.innerHTML = ''; 
            if (data.messages && data.messages.length > 0) {
                data.messages.forEach(msg => {
                    appendMessage(
                        msg.senderId ? msg.senderId.username : 'System', 
                        msg.content,
                        msg.senderId ? msg.senderId._id.toString() === currentUserMongoId : false,
                        new Date(msg.createdAt || msg.timestamp), 
                        msg.isSystem || false
                    );
                });
            } else {
                appendSystemMessage("Повідомлень ще немає.");
            }
            messagesContainer.scrollTop = messagesContainer.scrollHeight; 
        }
    });

    socket.on('userJoined', (data) => { 
        console.log(`Користувач ${data.username} приєднався до кімнати ${data.room}`);
        if (data.room === currentRoomId) {
            appendSystemMessage(`${data.username} приєднався до чату.`);
            // Potentially refresh participant list if not handled by another event
            socket.emit('loadUserChats'); // Or a more specific participant update
        }
    });

    socket.on('userLeft', (data) => { 
        console.log(`Користувач ${data.username} залишив кімнату ${data.room}`);
        if (data.room === currentRoomId) {
            appendSystemMessage(`${data.username} залишив чат.`);
            socket.emit('loadUserChats'); // Or a more specific participant update
        }
    });

    socket.on('chatParticipantsUpdated', (data) => { 
        console.log('Учасники чату оновлені (подія chatParticipantsUpdated):', data);
        const chatIndex = loadedChatsCache.findIndex(chat => chat._id === data.chatId);
        if (chatIndex !== -1) {
            loadedChatsCache[chatIndex] = data.updatedChatRoomData;
        } else {
            loadedChatsCache.push(data.updatedChatRoomData); 
        }
        renderChatList(loadedChatsCache); 
        if (data.chatId === currentRoomId) {
            if (activeChatNameElement) activeChatNameElement.innerHTML = getChatHeaderHTML(data.updatedChatRoomData); 
            renderChatParticipants(data.updatedChatRoomData.participants);
        }
    });

    socket.on('chatListUpdated', (updatedChatRoomData) => { 
        console.log('Отримано оновлення для списку чатів (один чат):', updatedChatRoomData);
        const chatIndex = loadedChatsCache.findIndex(chat => chat._id === updatedChatRoomData._id);
        if (chatIndex !== -1) {
            loadedChatsCache[chatIndex] = updatedChatRoomData;
        } else {
            loadedChatsCache.push(updatedChatRoomData); 
        }
        renderChatList(loadedChatsCache); 
    });

    socket.on('newChatAvailable', (newChatData) => { 
        console.log('Доступний новий чат:', newChatData);
        if (!loadedChatsCache.some(chat => chat._id === newChatData._id)) {
            loadedChatsCache.push(newChatData);
        }
        renderChatList(loadedChatsCache); 
        alert(`Вас додали до нового чату: ${getChatDisplayName(newChatData)}`);
    });

    socket.on('leftRoom', (data) => { 
        console.log(`Ви залишили кімнату: ${data.room}`);
        if (data.room === currentRoomId) { // Only if we are sure this was the room we were in
            currentRoomId = null;
            window.currentRoomIdForNotifications = null;
            if(activeChatNameElement) activeChatNameElement.textContent = 'Оберіть чат';
            if (activeChatMembersContainer) activeChatMembersContainer.innerHTML = '<span class="chat-members-title">Members:</span>';
            if(messagesContainer) messagesContainer.innerHTML = '<p>Ви залишили кімнату.</p>';
        }
        updateActiveChatInList(null); 
    });

    socket.on('newMessage', (data) => { 
        console.log('Отримано нове повідомлення:', data);
        if (data.room === currentRoomId) { // currentRoomId is optimistically set
            appendMessage(data.user, data.message, data.userIdMongo === currentUserMongoId, new Date(data.timestamp), data.isSystem);
            // Mark as read if user is in the room where message arrived
            socket.emit('markNotificationsAsRead', { chatId: data.room });
        }
        updateChatListItemLastMessage(data.room, data.user, data.message, data.userIdMongo === currentUserMongoId);
        const chatToMove = loadedChatsCache.find(c => c._id === data.room);
        if (chatToMove) {
            chatToMove.updatedAt = new Date().toISOString(); 
            if(chatToMove.lastMessage) {
                chatToMove.lastMessage.content = data.message;
                if (chatToMove.lastMessage.senderId) { 
                    chatToMove.lastMessage.senderId.username = data.user;
                     chatToMove.lastMessage.senderId._id = data.userIdMongo;
                } else { 
                     chatToMove.lastMessage.senderId = { username: data.user, _id: data.userIdMongo };
                }
                 chatToMove.lastMessage.createdAt = data.timestamp; 
            } else { 
                 chatToMove.lastMessage = {
                    content: data.message,
                    senderId: { username: data.user, _id: data.userIdMongo },
                    createdAt: data.timestamp
                 };
            }
        }
        renderChatList(loadedChatsCache);
    });

    socket.on('error', (data) => {
        console.error('Помилка від сервера:', data.message);
        alert(`Помилка: ${data.message}`);
        // If the error was related to joining a room, we might need to revert optimistic UI changes.
        // For example, if currentRoomId was optimistically set and the join failed.
        // This might require more specific error codes from the server.
        // For now, a generic alert. If a join fails, user might need to click another chat to reset state.
    });

    socket.on('disconnect', (reason) => {
        console.log(`Chat.js: Відключено від Socket.IO сервера. Причина: ${reason}`);
        if(messagesContainer && currentRoomId) appendSystemMessage('З\'єднання з сервером втрачено.', true);
        // currentRoomId and window.currentRoomIdForNotifications will be reset by global-socket.js or next successful connection
        // For safety, we can clear them here too if on messages.php
        currentRoomId = null;
        window.currentRoomIdForNotifications = null;
    });
    socket.on('connect_error', (err) => {
        console.error('Chat.js: Connection error:', err.message);
    });


    function getChatDisplayName(chat) { 
        if (!chat || !Array.isArray(chat.participants) || !currentUserMongoId) return 'Невідомий чат';
        if (chat.isGroupChat) {
            return escapeHTML(chat.name || `Група (${chat.participants.length})`);
        } else {
            if (chat.participants.length === 1 && chat.participants[0]._id.toString() === currentUserMongoId) {
                return `${escapeHTML(localStorage.getItem('username') || 'Я')} (Нотатки)`; 
            }
            const otherParticipant = chat.participants.find(p => p._id.toString() !== currentUserMongoId);
            return otherParticipant ? escapeHTML(otherParticipant.username) : (chat.participants.length > 0 ? escapeHTML(chat.participants[0].username) : 'Приватний чат');
        }
    }

    function renderChatList(chats) {
        if (!chatListContainer) return;
        chatListContainer.innerHTML = ''; 
        if (chats && chats.length > 0) {
            const sortedChats = chats.sort((a, b) => {
                const timeA = a.lastMessage ? new Date(a.lastMessage.createdAt || a.lastMessage.timestamp || a.updatedAt) : new Date(a.updatedAt);
                const timeB = b.lastMessage ? new Date(b.lastMessage.createdAt || b.lastMessage.timestamp || b.updatedAt) : new Date(b.updatedAt);
                return timeB - timeA; 
            });
            sortedChats.forEach(chat => {
                const listItem = document.createElement('li');
                listItem.classList.add('chat-list-item');
                listItem.dataset.chatId = chat._id;
                const chatDisplayName = getChatDisplayName(chat); 
                let lastMessageText = 'Немає повідомлень';
                let lastMessageFull = 'Немає повідомлень';
                if (chat.lastMessage && chat.lastMessage.content) {
                    const senderIsSelf = chat.lastMessage.senderId && chat.lastMessage.senderId._id && chat.lastMessage.senderId._id.toString() === currentUserMongoId;
                    const senderName = senderIsSelf ? 'Ви' : (chat.lastMessage.senderId ? escapeHTML(chat.lastMessage.senderId.username) : 'System');
                    lastMessageText = `${senderName}: ${escapeHTML(chat.lastMessage.content)}`;
                    lastMessageFull = lastMessageText;
                    if (lastMessageText.length > 30) lastMessageText = lastMessageText.substring(0, 27) + "...";
                }
                listItem.innerHTML = `
                    ${getChatAvatar(chat.participants, chat.isGroupChat)}
                    <div class="chat-info">
                        <div class="chat-name">${chatDisplayName}</div>
                        <div class="last-message" title="${lastMessageFull}">${lastMessageText}</div>
                    </div>
                `;
                if (chat._id === currentRoomId) { // currentRoomId is optimistically set
                    listItem.classList.add('active-chat');
                }
                chatListContainer.appendChild(listItem);
            });
        } else {
            chatListContainer.innerHTML = '<li><p style="padding: 15px; text-align: center; color: #777;">У вас поки немає чатів.</p></li>';
        }
    }

    function updateChatListItemLastMessage(chatId, senderUsername, messageContent, isSentByMe) {
        const chatItem = chatListContainer ? chatListContainer.querySelector(`.chat-list-item[data-chat-id="${chatId}"]`) : null;
        if (chatItem) {
            const lastMessageDiv = chatItem.querySelector('.last-message');
            if (lastMessageDiv) {
                const prefix = isSentByMe ? 'Ви: ' : `${escapeHTML(senderUsername) || 'System'}: `;
                const fullMessage = `${prefix}${escapeHTML(messageContent)}`;
                let displayMessage = fullMessage;
                if (displayMessage.length > 30) displayMessage = displayMessage.substring(0, 27) + "...";
                lastMessageDiv.textContent = displayMessage;
                lastMessageDiv.title = fullMessage; 
            }
            if (chatListContainer.firstChild !== chatItem) {
                chatListContainer.prepend(chatItem);
            }
        }
    }

    function renderChatParticipants(participants = []) { 
        if (!activeChatMembersContainer) return;
        activeChatMembersContainer.innerHTML = '<span class="chat-members-title">Members:</span>'; 
        if (participants && participants.length > 0) {
             participants.forEach(participant => {
                activeChatMembersContainer.innerHTML += getMemberAvatar(participant.username, participant._id);
            });
        }
        const currentChat = getCurrentChatObjectFromServerData(); // Uses optimistically set currentRoomId
        if (currentRoomId && currentChat && (currentChat.isGroupChat || currentChat.participants.length < 2) ) { 
             const addMemberButtonHTML = `<div class="add-member-icon" id="addMemberButton" title="Add member"><i class="fas fa-plus"></i></div>`;
             activeChatMembersContainer.innerHTML += addMemberButtonHTML;
        }
    }

    function getCurrentChatObjectFromServerData() {
        if (!currentRoomId || !loadedChatsCache) return null; // currentRoomId is optimistically set
        return loadedChatsCache.find(chat => chat._id === currentRoomId);
    }

    function joinChatRoom(roomId) {
        if (roomId && (!currentRoomId || roomId !== currentRoomId)) {
            console.log(`Клієнт: Ініціюю приєднання до кімнати ${roomId}. Поточна: ${currentRoomId}`);
            if (currentRoomId) { 
                socket.emit('leaveRoom', { roomId: currentRoomId });
            }

            // --- Optimistic Update ---
            currentRoomId = roomId; 
            window.currentRoomIdForNotifications = roomId;
            updateActiveChatInList(roomId); 

            const chatData = loadedChatsCache.find(chat => chat._id === roomId);
            if (activeChatNameElement && chatData) {
                activeChatNameElement.innerHTML = getChatHeaderHTML(chatData);
                renderChatParticipants(chatData.participants); 
            } else if (activeChatNameElement) {
                 activeChatNameElement.textContent = "Завантаження чату...";
            }
            if (messagesContainer) messagesContainer.innerHTML = '<p style="text-align:center; color:#777; margin-top:20px;">Завантаження історії повідомлень...</p>';
            // --- End Optimistic Update ---

            socket.emit('joinRoom', roomId); 
        } else if (roomId === currentRoomId) {
            console.log(`Клієнт: Вже в кімнаті ${roomId}. Оновлюю дані, якщо потрібно.`);
            const currentChatData = getCurrentChatObjectFromServerData();
            if (currentChatData && activeChatNameElement) {
                activeChatNameElement.innerHTML = getChatHeaderHTML(currentChatData);
                renderChatParticipants(currentChatData.participants);
            }
            // Trigger history load again if needed, or rely on server's `joinedRoom` to send it
            socket.emit('joinRoom', roomId); // Re-emit to ensure server sends history if client missed it
        }
    }


    function updateActiveChatInList(activeRoomId) {
        if (!chatListContainer) return;
        const chatItems = chatListContainer.querySelectorAll('.chat-list-item');
        chatItems.forEach(item => {
            item.classList.toggle('active-chat', item.dataset.chatId === activeRoomId);
        });
    }

    function appendMessage(senderName, messageText, isSentByMe, timestamp, isSystem = false) {
        if (!messagesContainer) return;
        const messageItem = document.createElement('div');
        const senderDisplayName = escapeHTML(senderName);
        if (isSystem) {
            messageItem.classList.add('system-message');
            messageItem.textContent = escapeHTML(messageText);
        } else {
            messageItem.classList.add('message-item');
            messageItem.classList.toggle('sent', isSentByMe);
            messageItem.classList.toggle('received', !isSentByMe);
            const avatar = document.createElement('div');
            avatar.classList.add('msg-avatar');
            avatar.innerHTML = `<i class="fas ${isSentByMe ? 'fa-user' : (senderDisplayName === 'Admin' || senderDisplayName === 'System' ? 'fa-user-shield' : 'fa-user-tie')}"></i>`;
            avatar.title = senderDisplayName;
            const content = document.createElement('div');
            content.classList.add('message-content');
            const senderSpan = document.createElement('span');
            senderSpan.classList.add('message-sender');
            senderSpan.textContent = senderDisplayName;
            const textP = document.createElement('p');
            textP.classList.add('message-text');
            textP.textContent = messageText; 
            const timeSpan = document.createElement('span');
            timeSpan.classList.add('message-timestamp');
            timeSpan.textContent = timestamp instanceof Date ? timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            content.appendChild(senderSpan);
            content.appendChild(textP);
            content.appendChild(timeSpan);
            if (isSentByMe) { 
                messageItem.appendChild(content);
                messageItem.appendChild(avatar);
            } else { 
                messageItem.appendChild(avatar);
                messageItem.appendChild(content);
            }
        }
        const placeholder = messagesContainer.querySelector('p');
        if (placeholder && (placeholder.textContent === "Завантаження історії повідомлень..." || placeholder.textContent === "Повідомлень ще немає.")){
            placeholder.remove();
        }

        const shouldScroll = messagesContainer.scrollHeight - messagesContainer.scrollTop - messagesContainer.clientHeight < 100 || isSentByMe || isSystem;
        messagesContainer.appendChild(messageItem);
        if (shouldScroll) {
           messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    }

    function appendSystemMessage(text, isError = false) {
        appendMessage(null, text, false, new Date(), true); 
        if (isError) console.error("System Error Message:", text);
    }
    
    if (messageForm) {
        messageForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (messageInput && messageInput.value.trim() && currentRoomId) { // currentRoomId is optimistically set
                const message = messageInput.value.trim();
                socket.emit('sendMessage', { message: message, roomName: currentRoomId });
                messageInput.value = ''; 
            } else if (!currentRoomId) {
                alert('Будь ласка, оберіть чат для надсилання повідомлення.');
            }
        });
    }

    if (chatListContainer) {
        chatListContainer.addEventListener('click', (e) => {
            const chatItem = e.target.closest('.chat-list-item');
            if (chatItem && chatItem.dataset.chatId) {
                const roomIdToJoin = chatItem.dataset.chatId;
                joinChatRoom(roomIdToJoin);
            }
        });
    }

    if (newChatButton) {
        newChatButton.addEventListener('click', async () => {
            if (allStudents.length === 0) await fetchStudents(); 
            if (newChatModal) {
                populateStudentListForNewChat();
                newChatModal.style.display = 'block';
            }
        });
    }

    if (closeNewChatModalButton) {
        closeNewChatModalButton.addEventListener('click', () => {
            if (newChatModal) newChatModal.style.display = 'none';
        });
    }

    if (createChatForm) {
        createChatForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const selectedStudentsCheckboxes = createChatForm.querySelectorAll('input[name="participants"]:checked');
            const participantMysqlIds = Array.from(selectedStudentsCheckboxes).map(cb => cb.value);
            const chatNameInput = createChatForm.querySelector('input[name="chatName"]');
            const chatName = chatNameInput ? chatNameInput.value.trim() : '';
            if (participantMysqlIds.length === 0 && !chatName) {
                alert('Будь ласка, оберіть хоча б одного учасника або введіть назву групового чату (якщо створюєте групу з одним собою).');
                return;
            }
             if (participantMysqlIds.length === 0 && chatName) { 
            } else if (participantMysqlIds.length === 0 && !chatName) {
                 alert('Будь ласка, оберіть учасників або введіть назву чату.');
                 return;
            }
            socket.emit('createOrJoinChat', { participantMysqlIds: participantMysqlIds, chatName: chatName });
            if (newChatModal) newChatModal.style.display = 'none';
            createChatForm.reset();
        });
    }

    async function handleOpenAddMembersModal() {
        if (!currentRoomId) { // currentRoomId is optimistically set
            alert('Спочатку оберіть чат, до якого хочете додати учасників.');
            return;
        }
        if (addMembersModal) {
            const currentChat = getCurrentChatObjectFromServerData(); // Uses optimistically set currentRoomId
            if (!currentChat) {
                alert('Не вдалося отримати дані поточного чату.');
                return;
            }
            if (allStudents.length === 0) await fetchStudents();
            if(addMembersChatNameSpan) addMembersChatNameSpan.textContent = getChatDisplayName(currentChat);
            if(addMembersChatIdInput) addMembersChatIdInput.value = currentRoomId;
            const currentParticipantsMysqlIdsInChat = currentChat.participants
                .map(p => p.mysql_user_id ? p.mysql_user_id.toString() : null)
                .filter(id => id); 
            populateStudentListForAddMembers(currentParticipantsMysqlIdsInChat);
            addMembersModal.style.display = 'block';
        }
    }
    
    document.body.addEventListener('click', function(event) {
        const target = event.target;
        if (target && (target.id === 'addMemberButton' || target.closest('#addMemberButton'))) {
            handleOpenAddMembersModal();
        }
    });

    if (closeAddMembersModalButton) {
        closeAddMembersModalButton.addEventListener('click', () => {
            if (addMembersModal) addMembersModal.style.display = 'none';
        });
    }

    if (addMembersForm) {
        addMembersForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const chatId = addMembersChatIdInput.value;
            const selectedStudentsCheckboxes = addMembersForm.querySelectorAll('input[name="add_participants"]:checked');
            const usersToAddMysqlIds = Array.from(selectedStudentsCheckboxes).map(cb => cb.value);
            if (!chatId) { alert('Помилка: ID чату не визначено.'); return; }
            if (usersToAddMysqlIds.length === 0) { alert('Будь ласка, оберіть хоча б одного студента для додавання.'); return; }
            socket.emit('addUsersToChat', { 
                chatId: chatId,
                usersToAddMysqlIds: usersToAddMysqlIds
            });
            if (addMembersModal) addMembersModal.style.display = 'none';
            addMembersForm.reset();
        });
    }
    
    window.addEventListener('click', (event) => {
        if (newChatModal && event.target == newChatModal) newChatModal.style.display = "none";
        if (addMembersModal && event.target == addMembersModal) addMembersModal.style.display = "none";
    });

});