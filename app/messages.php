<?php
session_start();
if (!isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true) {
  header("Location: welcome.php");
  exit;
}
?>
<!DOCTYPE html>
<html lang="uk">

<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Повідомлення</title>
  <link rel="stylesheet" href="static/styles/style.css">
  <link rel="stylesheet" href="static/styles/navbar.css">
  <link rel="stylesheet" href="static/styles/messages.css"> <!-- Підключення нових стилів -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
  <script src="js/header.js" defer></script>
</head>

<body>
  <div id="header-placeholder"></div>

  <div class="messages-page-container">
    <div class="messages-header">
      Messages
    </div>
    <div class="chat-layout-container">
      <!-- Ліва панель: Список чатів -->
      <aside class="chat-list-panel">
        <div class="chat-list-header">
          <h2>Chat room</h2>
          <button class="new-chat-button" id="newChatButton">
            <i class="fas fa-plus"></i> New chat room
          </button>
        </div>
        <ul class="chat-list" id="chatList">
          <!-- Приклад елемента списку чатів (буде генеруватися динамічно) -->
          <li class="chat-list-item active-chat" data-chat-id="chat1_admin">
            <div class="chat-avatar">
              <div class="default-avatar"><i class="fas fa-user-shield"></i></div>
            </div>
            <div class="chat-info">
              <div class="chat-name">Admin</div>
              <div class="last-message">Ти: Останнє повідомлення тут...</div>
            </div>
          </li>
          <li class="chat-list-item" data-chat-id="chat2_ann">
            <div class="chat-avatar">
              <div class="default-avatar"><i class="fas fa-user"></i></div>
              <!-- <img src="path/to/ann_avatar.jpg" alt="Ann"> -->
            </div>
            <div class="chat-info">
              <div class="chat-name">Ann Smith</div>
              <div class="last-message">Ann: Привіт! Як справи?</div>
            </div>
          </li>
          <li class="chat-list-item" data-chat-id="chat3_john">
            <div class="chat-avatar">
              <div class="default-avatar"><i class="fas fa-user"></i></div>
            </div>
            <div class="chat-info">
              <div class="chat-name">John Bond</div>
              <div class="last-message">John: Перевіряю функціонал...</div>
            </div>
          </li>
          <li class="chat-list-item" data-chat-id="chat4_ivan">
            <div class="chat-avatar">
              <div class="default-avatar"><i class="fas fa-user"></i></div>
            </div>
            <div class="chat-info">
              <div class="chat-name">Ivan Stan</div>
              <div class="last-message">Ivan: Все працює.</div>
            </div>
          </li>
          <!-- Кінець прикладу -->
        </ul>
      </aside>

      <!-- Права панель: Активний чат -->
      <main class="active-chat-panel">
        <header class="chat-header">
          <h3 id="activeChatName">Chat room Admin</h3>
          <div class="chat-members">
            <span class="chat-members-title">Members:</span>
            <div class="member-avatar" title="Admin">
              <div class="default-avatar-small"><i class="fas fa-user-shield"></i></div>
            </div>
            <div class="member-avatar" title="User 1">
              <div class="default-avatar-small"><i class="fas fa-user"></i></div>
            </div>
            <div class="member-avatar" title="User 2">
              <div class="default-avatar-small"><i class="fas fa-user"></i></div>
            </div>
            <div class="add-member-icon" id="addMemberButton" title="Add member">
              <i class="fas fa-plus"></i>
            </div>
          </div>
        </header>
        <div class="messages-area" id="messagesContainer">
          <!-- Приклад повідомлень (будуть генеруватися динамічно) -->
          <div class="message-item received" data-message-id="msg1">
            <div class="msg-avatar" title="Admin"><i class="fas fa-user-shield"></i></div>
            <div class="message-content">
              <span class="message-sender">Admin</span>
              <p class="message-text">Це перше повідомлення від Адміна в цьому чаті.</p>
              <span class="message-timestamp">10:00 AM</span>
            </div>
          </div>
          <div class="message-item sent" data-message-id="msg2">
            <div class="msg-avatar" title="Me"><i class="fas fa-user"></i></div>
            <div class="message-content">
              <span class="message-sender">Me</span>
              <p class="message-text">А це моє повідомлення у відповідь. Все виглядає добре!</p>
              <span class="message-timestamp">10:01 AM</span>
            </div>
          </div>
          <div class="message-item received" data-message-id="msg3">
            <div class="msg-avatar" title="Admin"><i class="fas fa-user-shield"></i></div>
            <div class="message-content">
              <span class="message-sender">Admin</span>
              <p class="message-text">Чудово, продовжуємо роботу.</p>
              <span class="message-timestamp">10:02 AM</span>
            </div>
          </div>
          <!-- Кінець прикладу -->
        </div>
        <div class="message-input-area">
          <form id="messageForm">
            <input type="text" id="messageInput" placeholder="Type a message..." autocomplete="off">
            <button type="submit" id="sendMessageButton" title="Send message">
              <i class="fas fa-paper-plane"></i>
            </button>
          </form>
        </div>
      </main>
    </div>
  </div>

  <div id="newChatModal" class="modal" style="display: none;">
    <div class="modal-content" style="width: 50%; margin: 5% auto;"> <span class="close" id="closeNewChatModal" style="float: right; font-size: 28px; cursor: pointer;">&times;</span>
      <h2>Створити новий чат</h2>
      <form id="createChatForm">
        <div class="form-group">
          <label for="chatNameInput">Назва групового чату (необов'язково):</label>
          <input type="text" id="chatNameInput" name="chatName" class="form-control">
        </div>
        <div class="form-group">
          <p>Оберіть учасників:</p>
          <div id="studentListContainer" style="max-height: 200px; overflow-y: auto; border: 1px solid #ccc; padding: 10px; margin-bottom:15px;">
            <p>Завантаження списку студентів...</p>
          </div>
        </div>
        <button type="submit" class="btn btn-primary" style="padding: 10px 15px; background-color: #007bff; color: white; border: none; border-radius: 5px;">Створити чат</button>
      </form>
    </div>
  </div>

  <div id="addMembersModal" class="modal" style="display: none;">
    <div class="modal-content" style="width: 50%; margin: 5% auto;">
      <span class="close" id="closeAddMembersModal" style="float: right; font-size: 28px; cursor: pointer;">&times;</span>
      <h2>Додати учасників до чату "<span id="addMembersChatName"></span>"</h2>
      <form id="addMembersForm">
        <input type="hidden" id="addMembersChatId" name="chatId">
        <div class="form-group">
          <p>Оберіть студентів для додавання:</p>
          <div id="addMembersStudentListContainer" style="max-height: 200px; overflow-y: auto; border: 1px solid #ccc; padding: 10px; margin-bottom:15px;">
            <p>Завантаження списку студентів...</p>
          </div>
        </div>
        <button type="submit" class="btn btn-primary" style="padding: 10px 15px; background-color: #007bff; color: white; border: none; border-radius: 5px;">Додати учасників</button>
      </form>
    </div>
  </div>

  <script src="http://localhost:3001/socket.io/socket.io.js"></script>
  <script src="js/chat.js" defer></script>
</body>

</html>