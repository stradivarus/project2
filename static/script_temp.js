localStorage.setItem('name','w/e');
document.addEventListener('DOMContentLoaded', load);


function load() {
    document.querySelector('.user').innerHTML = `<p>singed in as</p>
    <strong>${localStorage.getItem('name')}</strong>`;

    // get list of current channels from the server with AJAX
    const request = new XMLHttpRequest();

    request.onreadystatechange = function () {

        if (this.readyState == 1) {
            document.querySelector('.channel-list').innerHTML = "";
        };

        if (this.readyState == 4 && this.status == 200) {
            const channelList = JSON.parse(request.responseText);

            loadChannels(channelList);

            // we did all we had to do with loading channels

            // integrating socketIO
            var socket = io();
            socket.on('connect', () => {
                document.querySelector(".add-channel form").onsubmit = (e) => {
                    e.preventDefault();
                    const channelName = document.querySelector('#channel-name').value;

                    socket.emit('add channel', { 'channel-name': channelName });
                    document.querySelector('#channel-name').value = '';
                };
            });

            socket.on('announce channel', data => {
                const li = document.createElement('li')
                li.innerHTML = data.channelName;
                document.querySelector('.channel-list ul').append(li);
                
            });
        };
    };
    request.open('GET', '/api/channels');
    request.send();
};


function loadChannels(channels) {

    var result = '<ul>';

    channels.forEach(channel =>
        result += `<li>${channel}</li>`
    );
    result += '</ul>'

    document.querySelector('.channel-list').innerHTML = result;
};
