const errorElement = document.getElementById('error');
const inputMessage = document.getElementById('messageInput');
const inputName = document.getElementById('nameInput');
const messagesList = document.querySelector('#messages');
const usersList = document.querySelector('#users');

let myName;

function connectToChat(userId) {
  const socket = new WebSocket(`ws://chat-task2-backend.herokuapp.com?${userId}`);
  socket.addEventListener('message', (msg) => {
    const data = JSON.parse(msg.data);

    function addMessage(user, time, message) {
      const isMyMessage = myName === user;

      const messageHeader = document.createElement('div');
      messageHeader.classList.add('messageHeader');
      if (isMyMessage) {
        messageHeader.classList.add('red');
      }

      const usernameContainer = document.createElement('span');
      usernameContainer.textContent = `${isMyMessage ? 'You' : user}, `;
      messageHeader.appendChild(usernameContainer);

      const timeContainer = document.createElement('span');
      timeContainer.textContent = time;
      messageHeader.appendChild(timeContainer);

      const messageElement = document.createElement('div');
      messageElement.classList.add('message');
      if (isMyMessage) {
        messageElement.classList.add('right');
      }
      messageElement.appendChild(messageHeader);

      const textElement = document.createElement('div');
      textElement.textContent = message;
      messageElement.appendChild(textElement);

      messagesList.appendChild(messageElement);
    }

    function addUserToList(user) {
      const listUsers = document.createElement('div');
      listUsers.classList.add('listUsers');
      listUsers.textContent = `● ${user}`;
      usersList.appendChild(listUsers);
    }

    if (data.type === 'initial') {
      for (const { user, time, message } of data.messages) {
        addMessage(user, time, message);
      }

      for (const user of data.users) {
        addUserToList(user);
      }
    }

    if (data.type === 'message') {
      addMessage(data.message.user, data.message.time, data.message.message);
    }

    if (data.type === 'newUser') {
      addUserToList(data.name);
    }

    if (data.type === 'userExit') {
      const userElements = document.querySelectorAll('.listUsers');
      for (const userElement of userElements) {
        if (userElement.textContent === `● ${data.name}`) {
          userElement.parentNode.removeChild(userElement);
          break;
        }
      }
    }
  });

  inputMessage.addEventListener('keydown', (event) => {
    if (event.code === 'Enter') {
      const message = { message: inputMessage.value, userId };
      socket.send(JSON.stringify(message));
      inputMessage.value = '';
    }
  });
}

document.getElementById('registrationForm').addEventListener('submit', (event) => {
  event.preventDefault();

  myName = inputName.value;
  inputName.value = '';

  const xhr = new XMLHttpRequest();
  xhr.open('POST', 'https://chat-task2-backend.herokuapp.com/');

  xhr.onload = () => {
    if (xhr.status >= 200 && xhr.status < 400) {
      const data = JSON.parse(xhr.responseText);

      if (data.status === 'ok') {
        document.querySelector('#registrationForm').classList.add('hidden');
        document.querySelector('#chat').classList.remove('hidden');
        connectToChat(data.userId);
      }

      if (data.status === 'duplicated') {
        errorElement.textContent = 'Такой ник-нейм уже занят';
      }

      if (data.status === 'error') {
        errorElement.textContent = 'Ошибка, заполните поле';
      }
    }
  };

  xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
  xhr.send(`name=${myName}`);
});
