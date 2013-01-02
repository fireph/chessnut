var socket = io.connect('http://ec2-50-17-136-11.compute-1.amazonaws.com:8081');
var userId = document.userId;
console.log(userId);

joinGame = function(){
	controls.autoRotate = false;
	resetBoard();
	$('#joinMenu').bPopup().close();
	socket.emit('findgame', {uid: userId});
}

emitMove = function(from, to){
	socket.emit('move', {from: from, to: to, uid: userId});
}

emitPossibleMoves = function(from){
	socket.emit('possmoves', {from: from, uid: userId});
}

spectateGame = function(){
	socket.emit('spectategame', {uid: userId});
}

socket.on('invalidmove', function(data){
	$(function(){
		$.pnotify({
			title: 'Warning!',
			text: 'Invalid move from '+data.from+' to '+data.to+'!',
			delay: 5000
		});
	});
	//alert(data.from + " to " + data.to + "not a valid move!");
});

socket.on('playerdata', function(data){
	myColor = data.color;
	if (myColor == 'black') {
		if (camera.position.x < 0) {
			var tween = new TWEEN.Tween(camera.position).to( {x: [0,300], y: [300,300], z: [500,0]}, 2000).interpolation(TWEEN.Interpolation.Bezier).easing(TWEEN.Easing.Quadratic.InOut).delay(1000).start();
		} else {
			var tween = new TWEEN.Tween(camera.position).to( {x: 300, y: 300, z: 0}, 1000).easing(TWEEN.Easing.Quadratic.InOut).delay(1000).start();
		}
	} else if (myColor == 'white') {
		if (camera.position.x > 0) {
			var tween = new TWEEN.Tween(camera.position).to( {x: [0,-300], y: [300,300], z: [500,0]}, 2000).interpolation(TWEEN.Interpolation.Bezier).easing(TWEEN.Easing.Quadratic.InOut).delay(1000).start();
		} else {
			var tween = new TWEEN.Tween(camera.position).to( {x: -300, y: 300, z: 0}, 1000).easing(TWEEN.Easing.Quadratic.InOut).delay(1000).start();
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

socket.on('move', function(data){
	if (data.remove = "true"){
		removePiece(data.to);
	}
	movePiece(data.from, data.to);
});

socket.on('possmoves', function(data){
	highlightMoves(data.possmoves);
});

socket.on('nogamefound', function(data){
	$(function(){
		$.pnotify({
			title: 'Warning!',
			text: 'Unable to find a game to spectate.',
			delay: 5000
		});
	});
});

socket.on('checkmate', function(data){
	var title;
	var text;
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

socket.on('draw', function() {
	$(function(){
		$.pnotify({
			title: 'Sadness',
			text: 'Game is a draw.',
			delay: 5000
		});
	});
});

socket.on('stalemate', function() {
	$(function(){
		$.pnotify({
			title: 'Sadness',
			text: 'Game is a stalemate.',
			delay: 5000
		});
	});
});

socket.on('threefoldrep', function() {
	$(function(){
		$.pnotify({
			title: 'Sadness',
			text: 'Game is a stalemate by three fold draw.',
			delay: 5000
		});
	});
});

function spectateGame(){
	socket.emit('spectategame', {})
}

function leaveGame(){
	socket.emit('leavegame', {})
}

socket.on('gameOver', function(data) {
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
	controls.autoRotate = true;
	myColor = null;
	unhighlightMoves();
	unhighlightPiece();
});

socket.on('roomMessage', function(data){
	$(function(){
		$.pnotify({
			title: data.title,
			text: data.text,
			delay: 5000
		});
	});
	//alert(data.from + " to " + data.to + "not a valid move!");
});