import os

from flask import Flask, jsonify, render_template, request
from flask_socketio import SocketIO, emit

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
socketio = SocketIO(app)
socketio.init_app(app, cors_allowed_origins="*")

MSG_LIMIT = 100
channel_list = ['a', 'maggy loves you', 'haha']
# messages = {'channelname1' : [{'user': user1, 'date': date1, 'message' : message1}]}
# private_messages = {(user1, user2) : [{'user' : user, 'date' : date1, 'message': message1}]}
messages = {}


@app.route("/")
def index():
    return render_template("index.html")

@socketio.on("add channel")
def new_channel(data):
    channel_name = data['channel-name']
    exists = 1

    if channel_name not in channel_list:
        channel_list.append(channel_name)
        exists = 0
        channel_list.sort()

    emit("announce channels", {'channels': channel_list, 'channelName' : channel_name, 'exists' : exists, 'user' : data['user']}, broadcast=True)


@socketio.on("new message")
def new_message(data):
    channel = data['channel']
    message = {'message' : data['message'], 'name' : data['name'], 'date' : data['date'], 'channel' : channel}
    
    if not channel in messages:
        messages[channel] = []
    messages[channel].append(message)

    no_of_msg = len(messages[channel])
    if no_of_msg >= MSG_LIMIT:
        messages[channel] = messages[channel][(no_of_msg - MSG_LIMIT):]
     
    emit("announce message", message, broadcast=True)


# APIS
@app.route("/api/channels")
def send_channels():
    return jsonify(channel_list)

@app.route("/api/messages/<channel>")
def send_messages(channel):
    if not channel in messages:
        return jsonify("empty")
    else:
        return  jsonify(messages[channel])
