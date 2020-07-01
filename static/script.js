document.addEventListener('DOMContentLoaded', () => {


    // get list of current channels from the server with AJAX
    const request = new XMLHttpRequest();
    request.open('GET', '/api/channels')

    request.onload = () => {
        const channelList = JSON.parse(request.responseText);
        var currentChannel;

        // if user picked a name before, we display that name
        if (localStorage.getItem('name')) {
            changeSidebar(channelList);
        };

        // user submitted the name form nad it's remembered in localStorage
        if (document.querySelector('.user form')) {
            document.querySelector('.user form').onsubmit = () => {
                const name = document.querySelector('#name').value;

                if (!localStorage.getItem('name'))
                    localStorage.setItem('name', name);
                changeSidebar(channelList);

                return false;
            };
        };


        // integrating socketIO
        var socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);

        socket.on('connect', () => {
            document.querySelector(".add-channel form").onsubmit = () => {
                const channelName = document.querySelector('#channel-name').value;

                socket.emit('add channel', { 'channel-name': channelName });
                document.querySelector('#channel-name').value = '';
                return false;
            };

            document.querySelector(".type-message form").onsubmit = () => {
                const message = document.querySelector("#message").value;

                var today = new Date();
                var date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
                var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
                var dateTime = date + ' ' + time;

                socket.emit('new message', {'channel' : currentChannel, 'message': message, 'name': localStorage.getItem('name'), 'date': dateTime });
                document.querySelector('#message').value = '';
                return false;
            }
        });

        socket.on('announce channel', data => {
            const li = document.createElement('li')
            li.innerHTML = data.channelName;
            document.querySelector('.channel-list ul').append(li);
        });

        socket.on('announce messages', data => {
            console.log(data);

            const div = document.createElement('div') // add clas message to it and fill
            //PUT MESSAGES FROM CURRENT CHANNEL IN DIV
        });
        
        // user clicked on a chat name link
        document.querySelectorAll('.channel-list li').forEach(item => {
            item.onclick = function () {
                currentChannel = this.innerHTML;
                console.log(currentChannel)
            };
        });
    };

    request.send();
});

function changeSidebar(channels) {
    document.querySelector('.user').innerHTML = `<p>singed in as</p>
        <strong>${localStorage.getItem('name')}</strong>`;

    var result = '<ul>';

    channels.forEach(channel =>
        result += `<li>${channel}</li>`
    );
    result += '</ul>'

    document.querySelector('.channel-list').innerHTML = result;
};