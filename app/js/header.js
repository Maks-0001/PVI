// Lab_1/app/js/header.js

document.addEventListener("DOMContentLoaded", () => {
  fetch("header.php") //
    .then((response) => response.text()) //
    .then((data) => {
      const headerPlaceholder = document.getElementById("header-placeholder");
      if (headerPlaceholder) {
        headerPlaceholder.innerHTML = data; // Header DOM (including .notification-drop) is now in place
      }

      // DEFINE GLOBAL UI FUNCTIONS NOW THAT HEADER DOM IS READY
      window.updateNotificationPlaceholder = function() {
          const notificationDrop = document.querySelector(".notification-drop");
          if (!notificationDrop) return;

          const existingPlaceholder = notificationDrop.querySelector('.notification-placeholder');
          const notificationItemsCount = notificationDrop.querySelectorAll('.notification-item:not(.notification-placeholder)').length;

          if (notificationItemsCount === 0) {
              if (!existingPlaceholder) {
                  const placeholder = document.createElement('div');
                  placeholder.classList.add('notification-item', 'notification-placeholder');
                  placeholder.style.textAlign = 'center';
                  placeholder.style.padding = '10px';
                  placeholder.style.color = '#ccc';
                  placeholder.textContent = "Немає нових сповіщень";
                  
                  notificationDrop.innerHTML = ''; 
                  notificationDrop.appendChild(placeholder);
              }
          } else {
              if (existingPlaceholder) {
                  existingPlaceholder.remove();
              }
          }
      };

      window.addNotificationToDropdown = function(notificationData) {
          const notificationDrop = document.querySelector(".notification-drop");
          if (!notificationDrop) return;

          if (notificationDrop.querySelector(`.notification-item[data-notification-id="${notificationData._id}"]`)) {
              return; 
          }

          const placeholder = notificationDrop.querySelector('.notification-placeholder');
          if (placeholder) { 
              placeholder.remove();
          }
          if (notificationDrop.textContent.trim() === "Немає нових сповіщень" && notificationDrop.children.length === 0) {
            notificationDrop.innerHTML = '';
          }

          const notificationItem = document.createElement('div');
          notificationItem.classList.add('notification-item');
          notificationItem.dataset.chatId = notificationData.chatId;
          notificationItem.dataset.notificationId = notificationData._id; 

          const avatarImg = document.createElement('img');
          avatarImg.src = "static/images/istockphoto-1495088043-612x612.jpg"; // Default avatar
          avatarImg.alt = "Avatar";
          
          const contentDiv = document.createElement('div');
          contentDiv.classList.add('notification-content');
          
          const senderStrong = document.createElement('strong');
          senderStrong.textContent = notificationData.senderName;
          
          const messageP = document.createElement('p');
          messageP.textContent = notificationData.messagePreview;
          
          contentDiv.appendChild(senderStrong);
          contentDiv.appendChild(messageP);
          
          notificationItem.appendChild(avatarImg);
          notificationItem.appendChild(contentDiv);

          notificationDrop.prepend(notificationItem);

          notificationItem.addEventListener('click', function() {
              const chatId = this.dataset.chatId;
              const notificationId = this.dataset.notificationId;

              localStorage.setItem('navigateToChatId', chatId); 
              localStorage.setItem('lastClickedNotificationChatId', chatId); 

              if (typeof window.socket !== 'undefined' && window.socket && window.socket.connected) {
                  window.socket.emit('markNotificationsAsRead', { notificationIds: [notificationId] });
              }
              
              this.remove();
              if (typeof window.updateNotificationPlaceholder === 'function') {
                  window.updateNotificationPlaceholder();
              }
              
              const remainingNotifications = notificationDrop.querySelectorAll('.notification-item:not(.notification-placeholder)').length;
              if (remainingNotifications === 0) {
                  const indicator = document.getElementById('notification-indicator');
                  if (indicator) indicator.style.display = 'none';
                  localStorage.removeItem('hasUnreadNotifications');
                  localStorage.setItem('notificationsHidden', 'true');
              }

              window.location.href = 'messages.php';
          });

          if (typeof window.updateNotificationPlaceholder === 'function') {
              window.updateNotificationPlaceholder();
          }
      };
      
      if (typeof window.updateNotificationPlaceholder === 'function') {
        window.updateNotificationPlaceholder();
      }

      const username = localStorage.getItem("username"); 
      if (username) { 
        const nameElement = document.getElementById("name");
        if (nameElement) nameElement.textContent = username; 
      }

      const functionalScript = document.createElement("script"); 
      functionalScript.src = "./js/functional.js"; 
      functionalScript.type = "text/javascript";
      
      const globalSocketScript = document.createElement("script"); 
      globalSocketScript.src = "./js/global-socket.js"; 

      functionalScript.onload = () => {
        if (!document.querySelector('script[src="./js/global-socket.js"]')) {
            document.head.appendChild(globalSocketScript);
        }
        // Ініціалізуємо стан дзвіночка після завантаження основного функціоналу та global-socket
        if (typeof initializeBellNotifications === 'function') {
            if (!window.bellNotificationsInitialized) {
                initializeBellNotifications();
                window.bellNotificationsInitialized = true;
            }
        }
      };
      
      functionalScript.onreadystatechange = () => {
          if (functionalScript.readyState === "loaded" || functionalScript.readyState === "complete") {
              functionalScript.onreadystatechange = null; 
              if (!document.querySelector('script[src="./js/global-socket.js"]')) { 
                document.head.appendChild(globalSocketScript);
              }
              if (typeof initializeBellNotifications === 'function') {
                if (!window.bellNotificationsInitialized) {
                    initializeBellNotifications();
                    window.bellNotificationsInitialized = true;
                }
              }
          }
      };
      document.head.appendChild(functionalScript); 


      const bellLinkElement = document.getElementById('bellLink');
      if (bellLinkElement) {
          bellLinkElement.addEventListener('click', (e) => {
              e.preventDefault();
              const bellIcon = document.getElementById('bell');
              if (bellIcon && typeof bellIcon.onclick === 'function') {
                  bellIcon.onclick(); 
              } else {
                  // Fallback, якщо functional.js не встановив bellIcon.onclick
                  // (initializeBellNotifications має це робити)
                  if (typeof initializeBellNotifications === 'function') {
                      initializeBellNotifications(); // Спробувати ініціалізувати зараз
                      if (bellIcon && typeof bellIcon.onclick === 'function') {
                         bellIcon.onclick();
                      } else {
                         window.location.href = 'messages.php'; // крайній випадок
                      }
                  } else {
                    window.location.href = 'messages.php';
                  }
              }
          });
      }
    })
    .catch((error) => console.error('Error loading header.php:', error)); 
});