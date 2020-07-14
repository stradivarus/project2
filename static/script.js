var noMessages = true;

document.addEventListener('DOMContentLoaded', () => {

    // user submitted the name form nad it's remembered in localStorage
    if (document.querySelector('.user form')) {
        document.querySelector('.user form').onsubmit = () => {
            localStorage.setItem('name', document.querySelector('#name').value);
            load();
            return false;
        };
    };

    if (localStorage.getItem('name')) {
        load();
    };


    document.querySelector('#message').onkeyup = function(e) {
        if (e.keyCode === 13 && !e.shiftKey) {
            document.querySelector('.type-message button').click();
        };
    };
    
});


function load() {
    document.querySelector('.user').innerHTML = `<p>singed in as</p>
    <strong>${localStorage.getItem('name')}</strong>`;
    document.querySelector('.add-channel button').disabled = false;

    // get list of current channels from the server with AJAX
    const request = new XMLHttpRequest();

    request.onreadystatechange = function () {

        if (this.readyState == 1) {
            document.querySelector('.channel-list').innerHTML = "";
        }

        if (this.readyState == 4 && this.status == 200) {
            const channelList = JSON.parse(request.responseText);

            loadChannels(channelList);
            loadMessages(false);

            // we did all we had to do with loading channels

            // integrating socketIO
            var socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);

            socket.on('connect', () => {
                document.querySelector(".add-channel form").onsubmit = () => {
                    const channelName = document.querySelector('#channel-name').value;

                    socket.emit('add channel', {'channel-name': channelName, 'user' : localStorage.getItem('name')});
                    document.querySelector('#channel-name').value = '';
                    return false;
                };

                document.querySelector(".type-message form").onsubmit = () => {
                    const message = document.querySelector("#message").value;

                    var today = new Date();
                    var date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
                    var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
                    var dateTime = date + ' ' + time;

                    socket.emit('new message', { 'channel': localStorage.getItem('channel'), 'message': message, 'name': localStorage.getItem('name'), 'date': dateTime });
                    document.querySelector('#message').value = '';
                    document.querySelector('#message').focus();
                    return false;
                };
            });

            socket.on('announce channel', data => {
                if (data.exists) {
                    if (data.user == localStorage.getItem('name')) {
                        document.querySelectorAll('.channel-list li').forEach(li => {
                            if (li.innerHTML === data.channelName) {
                                li.click();
                            };
                        });
                    };
                } 
                else {
                    const li = document.createElement('li')
                    li.innerHTML = data.channelName;
                    document.querySelector('.channel-list ul').append(li);
                    
                    li.onclick = function () {
                        localStorage.setItem('channel', li.innerHTML);
                        loadMessages();
                    };
                }; 
            });

            socket.on('announce message', data => {
                if (data.channel === localStorage.getItem('channel')) {
                    createMessage(data);
                    noMessages = false;
                };
            });

            // user clicked on a chat name link
            document.querySelectorAll('.channel-list li').forEach(item => {

                item.onclick = function () {
                    localStorage.setItem('channel', item.innerHTML);
                    loadMessages();
                };
            });
            
        };
    };
    request.open('GET', '/api/channels');
    request.send();
}


function loadMessages(setActive=true) {

    if (localStorage.getItem('channel')) {

        document.querySelector('.type-message button').disabled = false;
        document.querySelector('.type-message textarea').focus(); //this isnt working ?????
        document.querySelector('.messages').innerHTML = '';

        if (setActive) {
            document.querySelectorAll('.channel-list li').forEach(li => li.classList.remove("active"));
            event.target.classList.add("active");
        };   
    };

    //get all messages for that channel below
    const request = new XMLHttpRequest;

    request.onload = function () {
        const messages = JSON.parse(request.responseText);

        if (messages == "empty") {
            if (localStorage.getItem('channel')) {
                document.querySelector('.messages').innerHTML = "<div class=\"alert-container\"><div class=\"alert-warning\">No messages yet!</div></div>";
            }
            noMessages = true;
        }
        else {
            noMessages = false;
            messages.forEach(message => createMessage(message));
        };
    };

    request.open('GET', `/api/messages/${localStorage.getItem('channel')}`)
    request.send();
};


function loadChannels(channels) {

    var result = '<ul>';

    channels.forEach(channel => {
        if (channel === localStorage.getItem('channel')) {
            result += `<li class="active">${channel}</li>`;
        }
        else {
            result += `<li>${channel}</li>`;
        };
    });
    
    result += '</ul>';

    document.querySelector('.channel-list').innerHTML = result;
};

// when we add a message we should check if there were any beforehand
function createMessage(message) {
    const div = document.createElement('div');
    div.innerHTML = `<div class="message">
                            <div class="message-header">
                                <strong>${message.name}</strong>
                                <small>${message.date}</small></div>
                                    <div class="message-text">
                                        <p>${message.message}</p>
                                    </div>
                            </div >`

    if (noMessages) {
        document.querySelector('.messages').innerHTML = "";
    };

    messages = document.querySelector('.messages');
    messages.append(div);
    messages.scrollTop = messages.scrollHeight;
};


// Helpers - NOT SURE I NEED THIS ONE
// function spacesToDashes(s) {
//     var converted = "";
//     for (let i = 0; i < s.length; i++) {
//         if (s[i] === " ") {
//             converted += "-";
//         }
//         else
//         {
//             converted += s[i];
//         };
//     };

//     return converted;
// };