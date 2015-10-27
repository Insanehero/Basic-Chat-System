var http = require('http');
var WebSocketServer = require('websocket').server
var server = http.createServer(function(request, response) {

});

function httpPort(portn) {
	server.listen(portn);
	console.log('Server listening on ' + portn);
}

httpPort(3002);

var wsServer = new WebSocketServer({
	httpServer: server
})

var count = 0;
var clients = {};
var deleteMe = [];

wsServer.on('request', function(r) {

	var connection = r.accept('echo-protocol', r.origin);
	var id = count++;
	clients[id] = {connection: connection};
	wsSendData(connection, new Message('id', {id: id}));
	console.log(new Date() + " Peer [" + id + "] " + "connection accepted at " + connection.remoteAddress);

	connection.on('message', function(data) {
		var data = JSON.parse(data.utf8Data);

		switch (data.type) {
			case 'message':
				wsSendData('all', new Message('message', {id: data.content.id, username: clients[data.content.id].username, text: data.content.text, date: data.content.date}));
				break;
			case 'username':
				clients[data.content.id].username = data.content.username;
				break;
		}
	});

	connection.on('close', function(reasonCode, description) {
		deleteMe.push(id);
		console.log(new Date() + " Peer [" + id + "] disconnected " + connection.remoteAddress);
	});

})

function wsSendData (connection, data) {

	if (connection == 'all') {
		for (var i in clients) {
			clients[i].connection.send(JSON.stringify(data));
		}
	} else {
		connection.send(JSON.stringify(data));
	}
}

function updateOnlineUsers(interval) {
	setInterval(function() {
		if (deleteMe.length > 0) {
			deleteMe.forEach(function(id){
				delete clients[id];
			})
		}
		var keys = Object.keys(clients);
		if (keys.length > 0) {
			var users = keys.filter(function(id) {
				return clients[id].username;
			}).map(function(id) {
				return clients[id].username;
			})
			wsSendData('all', new Message('onlineUsers', {users: users}));
		}
	}, interval)
}
updateOnlineUsers(1000);

function Message (type, content) {
	this.type = type;
	this.content = content
}
