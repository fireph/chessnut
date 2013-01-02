//global vars
var scene, renderer, loader, boardMaterial, whiteMaterial, blackMaterial, projector, highlightBlockMaterial, highlightPieceMaterial, tableMaterial;

//functions
var init, onWindowResize, animate, render, addWhite, addBlack, clearBoard, onDocumentMouseDown;

var boxSize = 64;

var boardDict = {};

var lettersDict = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

var movePos = {};

var piecePos = {};

myColor = null;

var selectedPiece = null;

var highlightedMoves = [];

var highlightedPiece = null;

camera = null;

controls = null;

//position on board
var a = 1, b = 2, c = 3, d = 4, e = 5, f = 6, g = 7, h = 8;

init = function() {

	camera = new THREE.PerspectiveCamera( 80, window.innerWidth / window.innerHeight, 1, 5000 );

	controls = new THREE.OrbitControls( camera );
	controls.addEventListener( 'change', render );
	controls.autoRotate = true;
	camera.position.x = 0;
	camera.position.y = 300;
	camera.position.z = 300;

	scene = new THREE.Scene();
	scene.fog = new THREE.FogExp2( 0xcccccc, 0.0005 );

	// Model Loader
	loader = new THREE.JSONLoader();

	// Projector
	projector = new THREE.Projector();

	// world
	boardMaterial =  new THREE.MeshPhongMaterial( { color:0x0000ff } );
	//boardMaterialWhite =  new THREE.MeshPhongMaterial( { color: 0xdddddd } );
	//boardMaterialBlack =  new THREE.MeshPhongMaterial( { color: 0x444444 } );
	//whiteMaterial =  new THREE.MeshPhongMaterial( { color: 0xeeeeee } );
	//blackMaterial =  new THREE.MeshPhongMaterial( { color: 0x222222 } );
	//highlightBlockMaterial =  new THREE.MeshPhongMaterial( { color:0xff0000 } );
	//highlightPieceMaterial =  new THREE.MeshPhongMaterial( { color:0x00ff00 } );

	/*
	var board = new THREE.Mesh( new THREE.CubeGeometry( boxSize*8, 5, boxSize*8 ), boardMaterial);
	board.receiveShadow = true;
	board.castShadow = true;
	board.position.y = -2.5;
	scene.add(board);
	*/

	tableMaterial =  new THREE.MeshPhongMaterial( { map: THREE.ImageUtils.loadTexture( './img/monte_carlo.jpg' ), ambient: 0xffffff, specular: 0x96726e, shininess: 20 } );
	tableMaterial.map.wrapS = tableMaterial.map.wrapT = THREE.RepeatWrapping;
	tableMaterial.map.repeat.set(5,5);

	var loc = "./models/table2.js";
	loader.load(loc, function(geometry) {
		var table = new THREE.Mesh(
			geometry,
			tableMaterial
		);
		table.receiveShadow = true;
		table.castShadow = true;
		table.position.x = 0;
		table.position.y = -2.5;
		table.position.z = 0;
		table.scale.x = 8;
		table.scale.y = 8;
		table.scale.z = 8;
		scene.add(table);
	});

	createChessBoard();

	addWhite();
	addBlack();

	// lights
	//var pointLight = new THREE.PointLight( 0xffffff );
	//pointLight.position.set( 0, 200, 0 );
	//scene.add( pointLight );

	var light = new THREE.DirectionalLight( 0xffffff );
	light.position.set( 200, 200, 200 );
	light.castShadow = true;
	light.shadowMapBias = 0.001
	light.shadowMapWidth = light.shadowMapHeight = 2048;
	light.shadowMapDarkness = .6;
	scene.add( light );

	//var ambientLight = new THREE.AmbientLight( 0x111111 );
	//scene.add( ambientLight );


	// renderer

	renderer = new THREE.WebGLRenderer( { antialias: false } );
	renderer.shadowMapEnabled = true;
	renderer.shadowMapSoft = true;
	renderer.setClearColor( scene.fog.color, 1 );
	renderer.setSize( window.innerWidth, window.innerHeight );

	document.body.appendChild( renderer.domElement );

	window.addEventListener( 'resize', onWindowResize, false );
	renderer.domElement.addEventListener( 'mousedown', onDocumentMouseDown, false );
}

onWindowResize = function() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize( window.innerWidth, window.innerHeight );

	render();
}

animate = function() {
	requestAnimationFrame( animate );
	renderer.render( scene, camera );
	controls.update();
	TWEEN.update();
}

render = function() {
	renderer.render( scene, camera );
}

moveToPos = function(move) {
	return movePos[move];
}

loadPiece = function(model, positions, rotate, color) {
	var loc = "./models/"+model+".js";
	loader.load(loc, function(geometry) {
		for (var i = 0; i < positions.length; i++) {
			var material;
			if (color == 'black') {
				material = new THREE.MeshPhongMaterial( { color: 0x222222, ambient: 0xffffff, specular: 0xffffff, shininess: 200 } );
			} else if (color == 'white') {
				material = new THREE.MeshPhongMaterial( { color: 0xeeeeee, ambient: 0xffffff, specular: 0xffffff, shininess: 200 } );
			}
			var piece = new THREE.Mesh(
				geometry,
				material
			);
			var newPos = moveToPos(positions[i]);
			piece.receiveShadow = true;
			piece.castShadow = true;
			piece.rotation.y = rotate;
			piece.position.x = newPos.x;
			piece.position.y = newPos.y;
			piece.position.z = newPos.z;
			piece.chessPos = positions[i];
			piece.chessColor = color;
			scene.add(piece);
			piecePos[positions[i]] = piece;
		}
	});
}

onDocumentMouseDown = function(event) {
	if (event.button == 0) {
		event.preventDefault();

		var vector = new THREE.Vector3( ( event.clientX / window.innerWidth ) * 2 - 1, - ( event.clientY / window.innerHeight ) * 2 + 1, 0.5 );
		projector.unprojectVector( vector, camera );

		var ray = new THREE.Ray( camera.position, vector.subSelf( camera.position ).normalize() );

		var intersects = ray.intersectObjects( scene.children );

		if ( intersects.length > 0 ) {
			if (intersects[0].object.hasOwnProperty('chessColor') && intersects[0].object.chessColor == myColor) {
				//console.log('selecting piece at: '+intersects[0].object.chessPos);
				if (highlightedPiece == intersects[0].object) {
					selectedPiece = null;
					unhighlightPiece();
					unhighlightMoves();
				} else {
					selectedPiece = intersects[0].object
					highlightPiece(selectedPiece);
					emitPossibleMoves(selectedPiece.chessPos);
				}
			} else if (intersects[0].object.hasOwnProperty('chessPos') && selectedPiece) {
				console.log('moving piece from-to: '+selectedPiece.chessPos+", "+intersects[0].object.chessPos);
				emitMove(selectedPiece.chessPos, intersects[0].object.chessPos);
				selectedPiece = null;
				unhighlightMoves();
				unhighlightPiece();
			}
		}
	}
}

movePiece = function(fromPos, toPos) {
	console.log('moving from '+fromPos+' to '+toPos);
	var piece = piecePos[fromPos];
	var newPos = moveToPos(toPos);
	var tween = new TWEEN.Tween(piece.position).to( {x: newPos.x, y: newPos.y, z: newPos.z}, 750).easing(TWEEN.Easing.Quadratic.InOut).start();
	//piece.position.x = newPos.x;
	//piece.position.y = newPos.y;
	//piece.position.z = newPos.z;
	piece.chessPos = toPos;
	delete piecePos[fromPos];
	piecePos[toPos] = piece;
}

removePiece = function(pos) {
	console.log('removing '+pos);
	var piece = piecePos[pos];
	delete piecePos[pos];
	scene.remove(piece);
}

unhighlightPiece = function() {
	if (highlightedPiece) {
		if (highlightedPiece.chessColor == 'white' && highlightedPiece) {
			highlightedPiece.material.color.setHex(0xeeeeee);
		} else if (highlightedPiece.chessColor == 'black'  && highlightedPiece) {
			highlightedPiece.material.color.setHex(0x222222);
		}
	}
	highlightedPiece = null;
}

highlightPiece = function(piece) {
	if (highlightedPiece) {
		unhighlightPiece();
	}
	if (piece) {
		if (piece.chessColor == 'white') {
			piece.material.color.setHex(0x5fed6d);
		} else if (piece.chessColor == 'black') {
			piece.material.color.setHex(0x245322);
		}
		highlightedPiece = piece;
	}
}

highlightMoves = function(moves) {
	if (highlightedMoves.length > 0) {
		unhighlightMoves();
	}
	if (moves.length > 0) {
		for (var i = 0; i < moves.length; i++) {
			console.log('Highlighting');
			console.log(moves);
			highlightedMoves.push(moves[i]);
			if (boardDict[moves[i]].tileColor == 'white') {
				boardDict[moves[i]].material.color.setHex(0xdb5858);
			} else if (boardDict[moves[i]].tileColor == 'black') {
				boardDict[moves[i]].material.color.setHex(0x451c1c);
			}
		}
	}
}

unhighlightMoves = function() {
	var length = highlightedMoves.length;
	for (var i = 0; i < length; i++) {
		var move = highlightedMoves.pop();
		if (boardDict[move].tileColor == 'white') {
			boardDict[move].material.color.setHex(0xdddddd);
		} else if (boardDict[move].tileColor == 'black') {
			boardDict[move].material.color.setHex(0x444444);
		}
	}
}

createChessBoard = function() {
	var tempGeometry = new THREE.CubeGeometry( boxSize, 5, boxSize );
	tempGeometry.dynamic = true;
	prevmat = true;
	prevz = -boxSize/2 - boxSize*3;
	for (var i = 0; i < 8; i++) {
		prevx = -boxSize/2 - boxSize*3;
		prevmat = !prevmat;
		for (var j = 0; j < 8; j++) {
			var board;
			if (prevmat) {
				var boardMaterialWhite =  new THREE.MeshPhongMaterial( { color: 0xdddddd, ambient: 0xffffff, specular: 0xffffff, shininess: 50 } );
				board = new THREE.Mesh( tempGeometry, boardMaterialWhite);
				board.tileColor = 'white';
				prevmat = false;
			} else {
				var boardMaterialBlack =  new THREE.MeshPhongMaterial( { color: 0x444444, ambient: 0xffffff, specular: 0xffffff, shininess: 50 } );
				board = new THREE.Mesh( tempGeometry, boardMaterialBlack);
				board.tileColor = 'black';
				prevmat = true;
			}
			board.receiveShadow = true;
			board.castShadow = true;
			board.position.y = -2.5;
			board.position.x = prevx;
			board.position.z = prevz;
			board.chessPos = lettersDict[i] + (j+1);
			scene.add(board);
			boardDict[lettersDict[i] + (j+1)] = board;
			movePos[lettersDict[i] + (j+1)] = new THREE.Vector3(prevx, 0, prevz);
			prevx += boxSize;
		}
		prevx = -boxSize/2 - boxSize*3;
		prevz += boxSize;
	}
}

addWhite = function() {
	rotation = 0;
	loadPiece('pawn', ['a2', 'b2', 'c2', 'd2', 'e2', 'f2', 'g2', 'h2'], 0, 'white');
	loadPiece('rook', ['c1', 'f1'], Math.PI, 'white');
	loadPiece('knight', ['b1', 'g1'], 0, 'white');
	loadPiece('castle', ['a1', 'h1'], 0, 'white');
	loadPiece('king', ['e1'], Math.PI/2, 'white');
	loadPiece('queen', ['d1'], 0, 'white');
}

addBlack = function() {
	rotation = Math.PI
	loadPiece('pawn', ['a7', 'b7', 'c7', 'd7', 'e7', 'f7', 'g7', 'h7'], 0+rotation, 'black');
	loadPiece('rook', ['c8', 'f8'], Math.PI+rotation, 'black');
	loadPiece('knight', ['b8', 'g8'], 0+rotation, 'black');
	loadPiece('castle', ['a8', 'h8'], 0+rotation, 'black');
	loadPiece('king', ['e8'], Math.PI/2+rotation, 'black');
	loadPiece('queen', ['d8'], 0+rotation, 'black');
}

resetBoard = function() {
	unhighlightMoves();
	unhighlightPiece();
	var keys = Object.keys(piecePos);
	console.log(keys);
	for (var i = 0; i < keys.length; i++) {
		removePiece(keys[i]);
	}
	myColor = null;
	addWhite();
	addBlack();
	//joinGame();
}

if ( ! Detector.webgl ) {
	Detector.addGetWebGLMessage();
} else {
	init();
	animate();
}