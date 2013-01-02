Array.prototype.indexOfObjProp = function (id, val) {
	for (var i = 0; i < this.length; i++) {
		if (this[i].hasOwnProperty(id) && this[i][id] == val) {
			return i;
		}
	}
	return -1;
};

function matchMaking(io, ch, glicko2, uuid) {
	this.gameList = {};
	this.usersInGames = {};
	this.socketsToUsers = {};
	this.io = io;
	this.ch = ch;
	this.glicko2 = glicko2;
	this.uuid = uuid;

	this.sockets();
}

matchMaking.prototype.killGame = function(socket, type) {
	var socketId = socket.id;
	var userId = this.socketsToUsers[socketId];
	var room = this.usersInGames[userId];
	this.io.sockets.in(room).emit('gameOver', {type: type});
	var roomSockets = this.io.sockets.clients(room);
	for (var i = 0; i < roomSockets.length; i++) {
		var socketIdTemp = roomSockets[i].id;
		var userIdTemp = this.socketsToUsers[socketIdTemp];
		var roomTemp = this.usersInGames[userId];
		delete this.usersInGames[userIdTemp];
		delete this.socketsToUsers[socketIdTemp];
		if (this.gameList.hasOwnProperty(roomTemp)) {
			delete this.gameList[roomTemp];
		}
		roomSockets[i].leave(room);
	}
}

matchMaking.prototype.sockets = function() {
	var oldThis = this;
	this.io.sockets.on('connection', function (socket) {

		/* JOINING A GAME */
		/* JOINING A GAME */
		/* JOINING A GAME */
		/* JOINING A GAME */

		socket.on('findgame', function(data){
			var rooms = oldThis.io.sockets.manager.rooms;
			var joinedRoom = false;
			if (oldThis.usersInGames[data.uid]) {
				socket.emit('roomMessage', {title: 'Error!', text: 'You are already in a game.'});
				return;
			}
			for (var room in rooms) {
				if (rooms.hasOwnProperty(room)) {
					if (rooms[room].length == 1 && room != "") { //see if there is 1 person in room
						room = room.split('/')[1];
						joinedRoom = true;
						var color;
						if (oldThis.gameList[room]['players'][0].color == 'white') {
							color = 'black';
						} else if (oldThis.gameList[room]['players'][0].color == 'black') {
							color = 'white';
						} else {
							console.log('Error has occurred while joining game, room does not have proper first user.'); 
							socket.emit('roomMessage', {title: 'Error!', text: 'An error has occurred while joining game, room does not have proper first user.'});
							return;
						}
						socket.join(room);
						oldThis.gameList[room]['players'].push({userId: data.uid, color: color});
						oldThis.usersInGames[data.uid] = room;
						oldThis.socketsToUsers[socket.id] = data.uid;

						socket.emit('playerdata', {color: color, room: room});
						oldThis.io.sockets.in(room).emit('roomMessage', {title: 'Begin!', text: 'The match has begun!'});
						break;
					}
				}
			}
			if (!joinedRoom) { // no rooms with 1 person found
				var roomNew = oldThis.uuid.v1();
				socket.join(roomNew);

				var gameInfo = {};
				gameInfo['players'] = new Array();
				gameInfo['players'].push({userId: data.uid, color: 'white'});
				gameInfo['spectators'] = new Array();
				var chess = new oldThis.ch.Chess();
				gameInfo['board'] = chess;
				oldThis.usersInGames[data.uid] = roomNew;

				socket.emit('playerdata', {color: "white", room: roomNew});
				socket.emit('roomMessage', {title: 'Plase hold on...', text: 'We are waiting for a user to match you with.'});

				oldThis.gameList[roomNew] = gameInfo;
				oldThis.socketsToUsers[socket.id] = data.uid;
			}
		});

		/* MOVING A PIECE */
		/* MOVING A PIECE */
		/* MOVING A PIECE */
		/* MOVING A PIECE */

		socket.on('move', function(data){

			var from = data.from;
			var to = data.to;
			var roomName = oldThis.usersInGames[data.uid];
			if (oldThis.gameList.hasOwnProperty(roomName) && oldThis.gameList[roomName]['players'].indexOfObjProp('userId', data.uid) != -1) {

				var chessBoard = oldThis.gameList[roomName]['board'];
				var toSquare = chessBoard.get(to);
				var fromSquare = chessBoard.get(from);

				if (oldThis.gameList[roomName]['players'].length > 1) {
					var theMove = chessBoard.move({from: from, to: to});
					if (theMove) {
						oldThis.gameList[roomName]['board'] = chessBoard;
						if (toSquare) {
							oldThis.io.sockets.in(roomName).emit('move', {from: from, to: to, flags: theMove.flags, remove: "true"});
						} else {
							oldThis.io.sockets.in(roomName).emit('move', {from: from, to: to, flags: theMove.flags, remove: "false"});
						}					
					} else {
						socket.emit('invalidmove', {from: from, to: to});
					}
				} else {
					socket.emit('roomMessage', {title: 'Plase hold on...', text: 'We are still trying to match you with another user.'});
				}
				if (chessBoard.in_checkmate()){
					var winner;
					var loser;
					var side = chessBoard.turn();
					if (side == 'w') {
						oldThis.io.sockets.in(roomName).emit('checkmate', {winner: "black", loser: "white"});
					} else if (side == 'b') {
						oldThis.io.sockets.in(roomName).emit('checkmate', {winner: "white", loser: "black"});
					}
					oldThis.killGame(socket, 'finish');
				} else if (chessBoard.in_draw()){
					oldThis.io.sockets.in(roomName).emit('draw', {});
					oldThis.killGame(socket, 'finish');
				} else if (chessBoard.in_stalemate()) {
					oldThis.io.sockets.in(roomName).emit('stalemate', {});
					oldThis.killGame(socket, 'finish');
				} else if (chessBoard.in_threefold_repetition()){
					oldThis.io.sockets.in(roomName).emit('threefoldrep', {});
					oldThis.killGame(socket, 'finish');
				}
			}
		});

		/* POSSIBLE MOVES */
		/* POSSIBLE MOVES */
		/* POSSIBLE MOVES */
		/* POSSIBLE MOVES */

		socket.on('possmoves', function(data){
			if (oldThis.usersInGames.hasOwnProperty(data.uid) && oldThis.gameList.hasOwnProperty(oldThis.usersInGames[data.uid])) {
				var roomName = oldThis.usersInGames[data.uid];
				var fromsq = data.from;
				var chessBoard = oldThis.gameList[roomName]['board'];
				var moveList = chessBoard.moves({verbose: true});
				var i = 0;
				var possMoves = [];
				while (i < moveList.length) {
					if (moveList[i]['from'] == fromsq){
						possMoves.push(moveList[i]['to']);
					}
					i++;
				}

				socket.emit('possmoves', {possmoves: possMoves});
			}
		});

		socket.on('message', function(data) {
			var roomname = oldThis.usersInGames[data.uid]
			oldThis.io.sockets.in(roomname).emit('message', data);
		});

		socket.on('spectategame', function(data){
			var rooms = oldThis.io.sockets.manager.rooms;
			var joinedRoom = false;
			for (var room in rooms) {
				if (rooms.hasOwnProperty(room)){
					if (rooms[room].length >= 2) { //see if there are 2 or more people in room
						if (oldThis.gameList.hasOwnProperty(room)) {
							socket.join(room);
							joinedRoom = true;
							oldThis.gameList[room]['spectators'].push(data.uid);
							oldThis.usersInGames[data.uid] = room;
							break;
						}
					}
				}
			}
			if (!joinedRoom) {
				socket.emit('nogamefound');
			}
		}); 

		socket.on('leavegame', function(data){
			oldThis.killGame(socket, 'leave');
		});


		socket.on('disconnect', function () {
			oldThis.killGame(socket, 'leave');
		});

	});
}

exports.matchMaking = matchMaking;