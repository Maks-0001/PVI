// Lab_1/app/js/global-socket.js
console.log('Global Socket: Script execution started (global-socket.js is being parsed).');

// Виконуємо перевірки та ініціалізацію безпосередньо,
// оскільки header.js вже чекає на DOMContentLoaded для основного документа.

if (window.location.pathname.endsWith('welcome.php')) { 
    console.log('Global Socket: On welcome.php, exiting script.');
    // Немає return, щоб не перешкоджати іншим можливим глобальним скриптам, якщо вони є,
    // але initializeGlobalSocket не буде викликано.
} else if (typeof io === 'undefined') { 
    console.error('Global Socket: Socket.IO client (io) is not defined. Ensure it is loaded. Global socket WILL NOT INITIALIZE.'); 
} else {
    console.log('Global Socket: io is defined. Calling initializeGlobalSocket directly.');
    initializeGlobalSocket(); 
}


function initializeGlobalSocket() { 
    console.log('Global Socket: initializeGlobalSocket function HAS BEEN CALLED.');
    if (window.socketInstanceInitialized) { 
        console.log('Global Socket: Instance already initialized. Checking for re-authentication needs.'); 
        if (window.socket && window.socket.connected && !window.currentUserMongoId) { 
             const chatToken = localStorage.getItem('chat_token'); 
             const currentMysqlUserId = localStorage.getItem('user_id'); 
             const currentUsername = localStorage.getItem('username'); 
             if (chatToken && currentMysqlUserId) { 
                 console.log('Global Socket: Re-authenticating existing socket connection.'); 
                 window.socket.emit('authenticate', { token: chatToken, userId: currentMysqlUserId, username: currentUsername }); 
             } else {
                 console.warn('Global Socket: Re-auth check: chatToken or currentMysqlUserId missing from localStorage.');
             }
        }
        return;
    }
    window.socketInstanceInitialized = true; 
    console.log('Global Socket: First time initialization of global socket instance.');

    const chatToken = localStorage.getItem('chat_token'); 
    const currentMysqlUserId = localStorage.getItem('user_id'); 
    const currentUsername = localStorage.getItem('username');  

    console.log('Global Socket: Retrieved from localStorage for connection attempt:');
    console.log('Global Socket: chat_token =', chatToken);
    console.log('Global Socket: user_id (currentMysqlUserId) =', currentMysqlUserId);
    console.log('Global Socket: username =', currentUsername);

    if (!chatToken || !currentMysqlUserId) { 
        console.error('Global Socket: CRITICAL - chat_token or user_id is MISSING from localStorage. Cannot establish socket connection. Notifications will NOT work.'); 
        return; 
    }

    console.log('Global Socket: chat_token and user_id ARE PRESENT. Proceeding to initialize connection to Socket.IO server...'); 
    if (!window.socket) { 
        try {
            window.socket = io('http://localhost:3001', { 
                reconnectionAttempts: 5,  
                reconnectionDelay: 3000,  
            });
            console.log('Global Socket: New socket instance CREATED.');
        } catch (e) {
            console.error('Global Socket: ERROR CREATING SOCKET.IO INSTANCE:', e);
            return;
        }
    } else {
        console.log('Global Socket: Using existing window.socket instance (should not happen on first init).');
    }

    window.socket.on('connect', () => { 
        console.log('Global Socket: EVENT "connect" - Successfully connected to Socket.IO server. Socket ID:', window.socket.id); 
        console.log('Global Socket: Emitting "authenticate" event.');
        window.socket.emit('authenticate', { token: chatToken, userId: currentMysqlUserId, username: currentUsername }); 
    });

    window.socket.on('authenticated', (data) => {  
        console.log('Global Socket: EVENT "authenticated" - User authenticated with server. UserMongoId:', data.userIdMongo, "Username:", data.username); 
        window.currentUserMongoId = data.userIdMongo; 
        if (!window.location.pathname.includes('messages.php')) { 
            console.log('Global Socket: Not on messages.php, emitting "loadUnreadNotifications".');
            window.socket.emit('loadUnreadNotifications'); 
        }
    });

    window.socket.on('unauthorized', (data) => { 
        console.error('Global Socket: EVENT "unauthorized" - Authentication error from server:', data.message); 
    });

    window.socket.on('unreadNotificationsLoaded', (notifications) => { 
        console.log('Global Socket: EVENT "unreadNotificationsLoaded" received with data:', notifications);
        if (window.location.pathname.includes('messages.php')) { 
             console.log('Global Socket: On messages.php, "unreadNotificationsLoaded" will be handled by chat.js.');
             return; 
        }

        console.log('Global Socket: Processing "unreadNotificationsLoaded" (not on messages.php). Count:', notifications ? notifications.length : 0); 
        const notificationDrop = document.querySelector(".notification-drop"); 
        if (!notificationDrop) {
            console.warn('Global Socket: .notification-drop element not found for "unreadNotificationsLoaded".');
            return; 
        }

        let shouldShowIndicator = false; 
        if (notifications && notifications.length > 0) { 
            notifications.forEach(notif => { 
                if (typeof window.addNotificationToDropdown === 'function') { 
                    if (!notificationDrop.querySelector(`.notification-item[data-notification-id="${notif._id}"]`)) { 
                        console.log('Global Socket: Adding notification to dropdown from "unreadNotificationsLoaded":', notif);
                        window.addNotificationToDropdown(notif); 
                    }
                } else {
                    console.warn('Global Socket: window.addNotificationToDropdown is not a function during "unreadNotificationsLoaded".');
                }
                shouldShowIndicator = true; 
            });
        }
        
        const indicator = document.getElementById('notification-indicator'); 
        if (indicator) { 
            indicator.style.display = shouldShowIndicator ? 'block' : 'none'; 
            console.log('Global Socket: Notification indicator display set to (from "unreadNotificationsLoaded"):', indicator.style.display);
            if (shouldShowIndicator) localStorage.setItem('hasUnreadNotifications', 'true'); 
            else localStorage.removeItem('hasUnreadNotifications'); 
        } else {
            console.warn('Global Socket: #notification-indicator element not found during "unreadNotificationsLoaded".');
        }
        
        if (typeof window.updateNotificationPlaceholder === 'function') { 
            window.updateNotificationPlaceholder(); 
        } else {
            console.warn('Global Socket: window.updateNotificationPlaceholder is not a function during "unreadNotificationsLoaded".');
        }
    });

    window.socket.on('newNotification', (notificationData) => { 
        console.log('Global Socket: EVENT "newNotification" - Received LIVE new notification from server:', notificationData); 

        const currentPagePath = window.location.pathname; 
        const isOnMessagesPage = currentPagePath.includes('messages.php'); 
        console.log('Global Socket: "newNotification" - Current page path:', currentPagePath, 'Is on messages page?', isOnMessagesPage);
        
        const activeChatIdUserIsIn = window.currentRoomIdForNotifications || null; 
        console.log('Global Socket: "newNotification" - Active chat ID user is in (from window.currentRoomIdForNotifications):', activeChatIdUserIsIn);

        if (isOnMessagesPage && notificationData.chatId === activeChatIdUserIsIn) { 
            console.log('Global Socket: "newNotification" - Notification is for the currently active chat on messages.php. Global indicator/animation skipped. Marking as read via socket.'); 
            if (window.socket && window.socket.connected) { 
                 window.socket.emit('markNotificationsAsRead', { notificationIds: [notificationData._id] }); 
             }
            return; 
        }

        console.log('Global Socket: "newNotification" - Proceeding to show notification indicator and add to dropdown.');
        if (typeof window.addNotificationToDropdown === 'function') { 
            const notificationDrop = document.querySelector(".notification-drop"); 
            if (notificationDrop && !notificationDrop.querySelector(`.notification-item[data-notification-id="${notificationData._id}"]`)) { 
                console.log('Global Socket: "newNotification" - Calling addNotificationToDropdown.');
                window.addNotificationToDropdown(notificationData); 
            } else if (!notificationDrop) {
                console.warn('Global Socket: "newNotification" - .notification-drop element not found.');
            }
        } else {
            console.warn('Global Socket: "newNotification" - window.addNotificationToDropdown is not a function.');
        }

        if (typeof window.showNotificationIndicator === 'function') { 
            console.log('Global Socket: "newNotification" - Calling showNotificationIndicator.');
            window.showNotificationIndicator(true); 
        } else {
            console.warn('Global Socket: "newNotification" - window.showNotificationIndicator is not a function.');
        }
    });

    window.socket.on('notificationsMarkedAsRead', (responseData) => { 
        console.log(`Global Socket: EVENT "notificationsMarkedAsRead" - ${responseData.count} notifications marked as read. Request:`, responseData.requestData); 
        const notificationDrop = document.querySelector(".notification-drop"); 
        if (!notificationDrop) return; 
        const clientRequest = responseData.requestData; 
        if (clientRequest && clientRequest.notificationIds && Array.isArray(clientRequest.notificationIds)) { 
            clientRequest.notificationIds.forEach(idToRemove => { 
                const itemToRemove = notificationDrop.querySelector(`.notification-item[data-notification-id="${idToRemove}"]`); 
                if (itemToRemove) itemToRemove.remove(); 
            });
        } else if (clientRequest && clientRequest.chatId) { 
            const itemsToRemove = notificationDrop.querySelectorAll(`.notification-item[data-chat-id="${clientRequest.chatId}"]`); 
            itemsToRemove.forEach(item => item.remove()); 
        } else if (responseData.count > 0 && (!clientRequest || Object.keys(clientRequest).length === 0)) { 
            if (!window.location.pathname.includes('messages.php')) { 
                 notificationDrop.querySelectorAll('.notification-item:not(.notification-placeholder)').forEach(item => item.remove()); 
            }
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
    
    window.socket.on('userStatusChanged', (data) => {  
        console.log('Global Socket: EVENT "userStatusChanged" - Username:', data.username, 'Status:', data.status); 
    });

    window.socket.on('disconnect', (reason) => { 
        console.warn('Global Socket: EVENT "disconnect" - Disconnected from Socket.IO server. Reason:', reason); 
        window.socketInstanceInitialized = false;  
        window.currentUserMongoId = null;  
        window.currentRoomIdForNotifications = null; 
    });

    window.socket.on('connect_error', (err) => { 
        console.error('Global Socket: EVENT "connect_error" - Connection error to Socket.IO server:', err.message, err); 
    });
    
    window.socket.on('error', (error) => {  
        console.error('Global Socket: EVENT "error" - Socket.IO connection error:', error.message ? error.message : error); 
    });
    console.log('Global Socket: All event listeners for socket instance have been attached.');
}