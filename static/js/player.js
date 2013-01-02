function Player(chessBoard, controls, TWEENJS, camera, addr) {
	this.chessBoard = chessBoard;
	this.controls = controls;
	this.camera = camera;
	this.TWEEN = TWEENJS;
	this.socket = io.connect(addr);
	this.userId = document.userId;

	this.sockets();
}

Player.prototype.joinGame = function(){
	this.controls.autoRotate = false;
	this.chessBoard.resetBoard();
	$('#joinMenu').bPopup().close();
	this.socket.emit('findgame', {uid: this.userId});
}

Player.prototype.emitMove = function(from, to){
	this.socket.emit('move', {from: from, to: to, uid: this.userId});
}

Player.prototype.emitPossibleMoves = function(from){
	this.socket.emit('possmoves', {from: from, uid: this.userId});
}

Player.prototype.spectateGame = function(){
	this.socket.emit('spectategame', {uid: this.userId});
}

Player.prototype.spectateGame = function(){
	this.socket.emit('spectategame', {})
}

Player.prototype.leaveGame = function(){
	this.socket.emit('leavegame', {})
}

Player.prototype.sockets = function() {
	var oldThis = this;
	this.socket.on('invalidmove', function(data){
		$(function(){
			$.pnotify({
				title: 'Warning!',
				text: 'Invalid move from '+data.from+' to '+data.to+'!',
				delay: 5000
			});
		});
		//alert(data.from + " to " + data.to + "not a valid move!");
	});

	this.socket.on('playerdata', function(data){
		oldThis.chessBoard.setMyColor(data.color);
		var myColor = oldThis.chessBoard.returnMyColor();
		if (myColor == 'black') {
			if (oldThis.camera.position.x < 0) {
				var tween = new oldThis.TWEEN.Tween(oldThis.camera.position).to( {x: [0,300], y: [300,300], z: [500,0]}, 2000).interpolation(oldThis.TWEEN.Interpolation.Bezier).easing(oldThis.TWEEN.Easing.Quadratic.InOut).delay(1000).start();
			} else {
				var tween = new oldThis.TWEEN.Tween(oldThis.camera.position).to( {x: 300, y: 300, z: 0}, 1000).easing(oldThis.TWEEN.Easing.Quadratic.InOut).delay(1000).start();
			}
		} else if (myColor == 'white') {
			if (oldThis.camera.position.x > 0) {
				var tween = new oldThis.TWEEN.Tween(oldThis.camera.position).to( {x: [0,-300], y: [300,300], z: [500,0]}, 2000).interpolation(oldThis.TWEEN.Interpolation.Bezier).easing(oldThis.TWEEN.Easing.Quadratic.InOut).delay(1000).start();
			} else {
				var tween = new oldThis.TWEEN.Tween(oldThis.camera.position).to( {x: -300, y: 300, z: 0}, 1000).easing(oldThis.TWEEN.Easing.Quadratic.InOut).delay(1000).start();
			}
		}
		$(function(){
			$.pnotify({
				title: 'Welcome!',
				text: 'You are color '+myColor+' in room '+data.room+'.',
				delay: 5000
			});
		});
	});

	this.socket.on('move', function(data){
		if (data.remove = "true"){
			oldThis.chessBoard.removePiece(data.to);
		}
		oldThis.chessBoard.movePiece(data.from, data.to);
	});

	this.socket.on('possmoves', function(data){
		oldThis.chessBoard.highlightMoves(data.possmoves);
	});

	this.socket.on('nogamefound', function(data){
		$(function(){
			$.pnotify({
				title: 'Warning!',
				text: 'Unable to find a game to spectate.',
				delay: 5000
			});
		});
	});

	this.socket.on('checkmate', function(data){
		var title, text;
		var myColor = oldThis.chessBoard.returnMyColor();
		if (myColor == data.winner) {
			title = 'Congratulations!'
			text = 'You win!'
		} else if (myColor == data.loser) {
			title = 'Disappointment...'
			text = 'You lose.'
		} else {
			title = 'Game Complete!'
			text = data.winner+' wins!'
		}
		$(function(){
			$.pnotify({
				title: title,
				text: text,
				delay: 5000
			});
		});
	});

	this.socket.on('draw', function() {
		$(function(){
			$.pnotify({
				title: 'Sadness',
				text: 'Game is a draw.',
				delay: 5000
			});
		});
	});

	this.socket.on('stalemate', function() {
		$(function(){
			$.pnotify({
				title: 'Sadness',
				text: 'Game is a stalemate.',
				delay: 5000
			});
		});
	});

	this.socket.on('threefoldrep', function() {
		$(function(){
			$.pnotify({
				title: 'Sadness',
				text: 'Game is a stalemate by three fold draw.',
				delay: 5000
			});
		});
	});

	this.socket.on('gameOver', function(data) {
		var myColor = oldThis.chessBoard.returnMyColor();
		if (data.type == 'leave') {
			$(function(){
				$.pnotify({
					title: 'Notify',
					text: 'Other user left, game ended.',
					delay: 5000
				});
			});
		} else if (data.type == 'finish') {
			$(function(){
				$.pnotify({
					title: 'Notify',
					text: 'Game has finished.',
					delay: 5000
				});
			});
		}
		$('#joinMenu').bPopup({
			modal: false,
			escClose: false
		});
		oldThis.controls.autoRotate = true;
		oldThis.chessBoard.setMyColor(null);
		oldThis.chessBoard.unhighlightMoves();
		oldThis.chessBoard.unhighlightPiece();
	});

	this.socket.on('roomMessage', function(data){
		$(function(){
			$.pnotify({
				title: data.title,
				text: data.text,
				delay: 5000
			});
		});
	});
}

window.Player = Player;