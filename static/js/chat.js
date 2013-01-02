var newChatMessage, chatToggle;
var chat = document.getElementById('chat'),
    chatInput = document.getElementById('chatInput'),
    chatOpen = false;
    
newChatMessage = function(user, message) {
    var newMessage = $('<div>', {class:'chatMessage'});
    var chatMessageUser = $('<div>', {class:'chatMessageUser'});
    chatMessageUser.text(user+': ');
    var chatMessageText = $('<div>', {class:'chatMessageText'});
    chatMessageText.text(message);
    newMessage.append(chatMessageUser);
    newMessage.append(chatMessageText);
    var updateScroll = true;
    if ($('#chatText')[0].scrollHeight > $('#chatText').scrollTop() + 319) {
        updateScroll = false;
    }
    $('#chatText').append(newMessage);
    if (updateScroll) {
        $('#chatText').scrollTop($('#chatText')[0].scrollHeight);
    }
}

chatToggle = function() {
    if (chatOpen) {
        chat.style.left = '-380px';
        chat.style.background = 'rgba(0, 0, 0, 0.25)';
        chatInput.style.borderStyle = 'hidden'
        chatInput.blur();
        chatOpen = false;
    } else {
        chat.style.left = '0px';
        chat.style.background = 'rgba(0, 0, 0, 0.5)';
        chatInput.style.borderStyle = 'solid';
        chatInput.focus();
        chatOpen = true;
    }
}

chat.addEventListener('mousedown', chatToggle);

document.addEventListener('keydown', function(evt) {
    switch (evt.keyCode) {
        case 13: // enter
            var message = $('#chatInput').val();
            if (message != '') {
                socket.emit('message', {user: document.userName, text: chatInput.value});
                chatInput.value = '';
            }
            break;
        case 17: // ctrl
            chatToggle();
            break
    }
});

socket.on('message', function(data) {
    newChatMessage(data.user, data.text);
});