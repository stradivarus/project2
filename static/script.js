var noMessages = true;

document.addEventListener('DOMContentLoaded', () => {

    // use matchMedia to determine whether logo is clickable
    const mtchMedia = window.matchMedia("(max-width: 937px)");
    sidebarToggle(mtchMedia);
    mtchMedia.addListener(sidebarToggle);

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


    document.querySelector('#message').onkeypress = function (e) {
        if (e.keyCode === 13 && !e.shiftKey) {
            document.querySelector('.type-message button').click();
            return false;
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
            var socket = io.connect(location.protocol + '//' + document.domain);
            //+ ':' + location.port

            socket.on('connect', () => {
                document.querySelector(".add-channel form").onsubmit = () => {
                    const channelName = document.querySelector('#channel-name').value;

                    socket.emit('add channel', { 'channel-name': channelName, 'user': localStorage.getItem('name') });
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
                    return false;
                };
            });

            socket.on('announce channels', data => {
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
                    loadChannels(data.channels);
                    document.querySelectorAll('.channel-list li').forEach(li => {
                        if (li.innerHTML === data.channelName) {
                            li.classList.add("new");
                        }
                    });
                };
            });

            socket.on('announce message', data => {
                if (data.channel === localStorage.getItem('channel')) {
                    createMessage(data);
                    noMessages = false;
                };
            });
        };
    };
    request.open('GET', '/api/channels');
    request.send();
}


function loadMessages(setActive = true, private = false) {
   
    if (localStorage.getItem('channel')) {

        document.querySelector('.type-message button').disabled = false;
        document.querySelector('.type-message textarea').focus();
        document.querySelector('.messages').innerHTML = '';

        if (setActive) {
            document.querySelectorAll('.channel-list li').forEach(li => {
                li.classList.remove("active");
                if (li.innerHTML == localStorage.channel) {
                    li.classList.add("active");
                };
            });
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

    // adding handler for when user clicked on a chat name link
    document.querySelectorAll('.channel-list li').forEach(item => {

        item.onclick = function () {
            document.querySelectorAll('.new').forEach(x => x.classList.remove('new'));    
            localStorage.setItem('channel', item.innerHTML);
            loadMessages();
        };
    });

};

// when we add a message we should check if there were any beforehand
function createMessage(message) {

    paragraphs = '';
    message.message.split("\n").forEach(line => paragraphs += `<p>${line}</p>`);

    const div = document.createElement('div');
    div.innerHTML = `<div class="message">
                            <div class="message-header">
                                <strong>${message.name}</strong>
                                <small>${message.date}</small></div>
                                    <div class="message-text">
                                        ${paragraphs}
                                    </div>
                            </div >`

    if (noMessages) {
        document.querySelector('.messages').innerHTML = "";
    };

    messages = document.querySelector('.messages');
    messages.append(div);
    messages.scrollTop = messages.scrollHeight;

    // making user clickable (to start a private convo)
    div.querySelector('strong').onclick = function() {
        localStorage.setItem('channel', `private: ${this.innerHTML}`);

        const li = document.createElement('li');
        li.innerHTML = `private: ${this.innerHTML}`;
        document.querySelector('.channel-list ul').append(li);
        

        li.onclick = function() {
            localStorage.setItem('channel', this.innerHTML);
            loadMessages();
        };

        loadMessages();
    };
};


// matchMedia query
function sidebarToggle(mm) {
    const sidebar = document.querySelector(".sidebar");
    const logo = document.querySelector(".logo h1");

    if (mm.matches) {
        sidebar.style.display = "none";
        logo.addEventListener("click", sToggle);
    } else {
        sidebar.style.display = "block";
        logo.removeEventListener("click", sToggle);
    };
};

function sToggle() {
    const sidebar = document.querySelector(".sidebar");
    
    if (sidebar.style.display == "block") {
        sidebar.style.display = "none";
    } else {
        sidebar.style.display = "block";
    };
};