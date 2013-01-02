function Board(posX, posY, posZ, boxSize, loader, scene, THREEJS, TWEENJS) {
	//THREEJS passing vars
	this.loader = loader;
	this.scene = scene;
	this.THREE = THREEJS;
	this.TWEEN = TWEENJS;

	//Vars used to program (consts)
	this.boardDict = {};
	this.lettersDict = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
	this.movePos = {};
	this.piecePos = {};
	this.myColor = null;
	this.selectedPiece = null;
	this.highlightedMoves = [];
	this.highlightedPiece = null;
	this.ambient = 0xffffff;
	this.specular = 0xffffff;
	this.boardShininess = 50;
	this.pieceShininess = 200;
	this.colorWhitePlayer = 0xeeeeee;
	this.colorBlackPlayer = 0x222222;
	this.colorWhiteBoard = 0xdddddd;
	this.colorBlackBoard = 0x444444;
	this.pieceMoveTime = 750;

	//passed in vars
	this.boxSize = boxSize;
	this.posX = posX;
	this.posY = posY;
	this.posZ = posZ;

	//create the board, do not call this function more than once!
	this.makeBoard();
}

Board.prototype.makeBoard = function() {
	var tempGeometry = new this.THREE.CubeGeometry( this.boxSize, 5, this.boxSize );
	tempGeometry.dynamic = true;
	var prevmat = true;
	var prevz = -this.boxSize/2 - this.boxSize*3;
	for (var i = 0; i < 8; i++) {
		var prevx = -this.boxSize/2 - this.boxSize*3;
		prevmat = !prevmat;
		for (var j = 0; j < 8; j++) {
			var board;
			if (prevmat) {
				var boardMaterialWhite =  new this.THREE.MeshPhongMaterial( { color: this.colorWhiteBoard, ambient: this.ambient, specular: this.specular, shininess: this.boardShininess } );
				board = new this.THREE.Mesh( tempGeometry, boardMaterialWhite);
				board.tileColor = 'white';
				prevmat = false;
			} else {
				var boardMaterialBlack =  new this.THREE.MeshPhongMaterial( { color: this.colorBlackBoard, ambient: this.ambient, specular: this.specular, shininess: this.boardShininess } );
				board = new this.THREE.Mesh( tempGeometry, boardMaterialBlack);
				board.tileColor = 'black';
				prevmat = true;
			}
			board.receiveShadow = true;
			board.castShadow = true;
			board.position.y = 0 + this.posY;
			board.position.x = prevx + this.posX;
			board.position.z = prevz + this.posZ;
			board.chessPos = this.lettersDict[i] + (j+1);
			this.scene.add(board);
			this.boardDict[this.lettersDict[i] + (j+1)] = board;
			this.movePos[this.lettersDict[i] + (j+1)] = new this.THREE.Vector3(prevx, 0, prevz);
			prevx += this.boxSize;
		}
		prevx = -this.boxSize/2 - this.boxSize*3;
		prevz += this.boxSize;
	}
}

Board.prototype.loadPiece = function(model, positions, rotate, color) {
	var loc = "./models/"+model+".js";
	var oldThis = this;
	this.loader.load(loc, function(geometry) {
		for (var i = 0; i < positions.length; i++) {
			var material;
			if (color == 'black') {
				material = new oldThis.THREE.MeshPhongMaterial( { color: oldThis.colorBlackPlayer, ambient: oldThis.ambient, specular: oldThis.specular, shininess: oldThis.pieceShininess } );
			} else if (color == 'white') {
				material = new oldThis.THREE.MeshPhongMaterial( { color: oldThis.colorWhitePlayer, ambient: oldThis.ambient, specular: oldThis.specular, shininess: oldThis.pieceShininess } );
			}
			var piece = new oldThis.THREE.Mesh(
				geometry,
				material
			);
			var newPos = oldThis.moveToPos(positions[i]);
			piece.receiveShadow = true;
			piece.castShadow = true;
			piece.rotation.y = rotate;
			piece.position.x = newPos.x;
			piece.position.y = newPos.y;
			piece.position.z = newPos.z;
			piece.chessPos = positions[i];
			piece.chessColor = color;
			oldThis.scene.add(piece);
			oldThis.piecePos[positions[i]] = piece;
		}
	});
}

Board.prototype.movePiece = function(fromPos, toPos) {
	var piece = this.piecePos[fromPos];
	var newPos = this.moveToPos(toPos);
	var tween = new this.TWEEN.Tween(piece.position).to( {x: newPos.x, y: newPos.y, z: newPos.z}, this.pieceMoveTime).easing(this.TWEEN.Easing.Quadratic.InOut).start();
	piece.chessPos = toPos;
	delete this.piecePos[fromPos];
	this.piecePos[toPos] = piece;
}

Board.prototype.removePiece = function(pos) {
	var piece = this.piecePos[pos];
	delete this.piecePos[pos];
	this.scene.remove(piece);
}

Board.prototype.unhighlightPiece = function() {
	if (this.highlightedPiece) {
		if (this.highlightedPiece.chessColor == 'white' && this.highlightedPiece) {
			this.highlightedPiece.material.color.setHex(this.colorWhitePlayer);
		} else if (this.highlightedPiece.chessColor == 'black'  && this.highlightedPiece) {
			this.highlightedPiece.material.color.setHex(this.colorBlackPlayer);
		}
	}
	this.highlightedPiece = null;
}

Board.prototype.highlightPiece = function(piece) {
	if (this.highlightedPiece) {
		this.unhighlightPiece();
	}
	if (piece) {
		if (piece.chessColor == 'white') {
			piece.material.color.setHex(0x5fed6d);
		} else if (piece.chessColor == 'black') {
			piece.material.color.setHex(0x245322);
		}
		this.highlightedPiece = piece;
	}
}

Board.prototype.highlightMoves = function(moves) {
	if (this.highlightedMoves.length > 0) {
		this.unhighlightMoves();
	}
	if (moves.length > 0) {
		for (var i = 0; i < moves.length; i++) {
			this.highlightedMoves.push(moves[i]);
			if (this.boardDict[moves[i]].tileColor == 'white') {
				this.boardDict[moves[i]].material.color.setHex(0xdb5858);
			} else if (this.boardDict[moves[i]].tileColor == 'black') {
				this.boardDict[moves[i]].material.color.setHex(0x451c1c);
			}
		}
	}
}

Board.prototype.unhighlightMoves = function() {
	var length = this.highlightedMoves.length;
	for (var i = 0; i < length; i++) {
		var move = this.highlightedMoves.pop();
		if (this.boardDict[move].tileColor == 'white') {
			this.boardDict[move].material.color.setHex(this.colorWhiteBoard);
		} else if (this.boardDict[move].tileColor == 'black') {
			this.boardDict[move].material.color.setHex(this.colorBlackBoard);
		}
	}
}

Board.prototype.addWhite = function() {
	var rotation = 0;
	this.loadPiece('pawn', ['a2', 'b2', 'c2', 'd2', 'e2', 'f2', 'g2', 'h2'], 0, 'white');
	this.loadPiece('rook', ['c1', 'f1'], Math.PI, 'white');
	this.loadPiece('knight', ['b1', 'g1'], 0, 'white');
	this.loadPiece('castle', ['a1', 'h1'], 0, 'white');
	this.loadPiece('king', ['e1'], Math.PI/2, 'white');
	this.loadPiece('queen', ['d1'], 0, 'white');
}

Board.prototype.addBlack = function() {
	var rotation = Math.PI
	this.loadPiece('pawn', ['a7', 'b7', 'c7', 'd7', 'e7', 'f7', 'g7', 'h7'], 0+rotation, 'black');
	this.loadPiece('rook', ['c8', 'f8'], Math.PI+rotation, 'black');
	this.loadPiece('knight', ['b8', 'g8'], 0+rotation, 'black');
	this.loadPiece('castle', ['a8', 'h8'], 0+rotation, 'black');
	this.loadPiece('king', ['e8'], Math.PI/2+rotation, 'black');
	this.loadPiece('queen', ['d8'], 0+rotation, 'black');
}

Board.prototype.resetBoard = function() {
	this.unhighlightMoves();
	this.unhighlightPiece();
	var keys = Object.keys(this.piecePos);
	for (var i = 0; i < keys.length; i++) {
		this.removePiece(keys[i]);
	}
	this.myColor = null;
	this.addWhite();
	this.addBlack();
}

Board.prototype.moveToPos = function(move) {
	return this.movePos[move];
}

Board.prototype.returnMyColor = function() {
	return this.myColor;
}

Board.prototype.setMyColor = function(color) {
	this.myColor = color;
}

window.Board = Board;