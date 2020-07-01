import os

from flask import Flask, jsonify, render_template, request
from flask_socketio import SocketIO, emit

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
socketio = SocketIO(app)

channel_list = ['a', 'maggy loves you', 'haha']
# messages = {'channelname1' : [{'user': user1, 'date': date1, 'message' : message1}]}
messages = {}


@app.route("/")
def index():
    return render_template("index.html", channels = channel_list)

@socketio.on("add channel")
def new_channel(data):
    channel_name = data['channel-name']
    channel_list.append(channel_name)

    emit("announce channel", {'channelName' : channel_name}, broadcast=True)

@socketio.on("new message")
def new_message(data):
    message = {'message' : data['message'], 'name' : data['name'], 'date' : data['date']}
    
    if not data['channel'] in messages:
        messages[data['channel']] = []
    messages[data['channel']].append(message)

    emit("announce messages", messages, broadcast=True)


# APIS
@app.route("/api/channels")
def send_channels():
    return jsonify(channel_list)
