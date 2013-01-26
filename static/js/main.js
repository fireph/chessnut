var init, onWindowResize, animate, render, onDocumentMouseDown;

var chessBoard, myPlayer, camera, renderer, controls, projector, scene;

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
	var loader = new THREE.JSONLoader();

	// Projector
	projector = new THREE.Projector();

	// world
	var tableMaterial =  new THREE.MeshPhongMaterial( { map: THREE.ImageUtils.loadTexture( './img/monte_carlo.jpg' ), ambient: 0xffffff, specular: 0x96726e, shininess: 20 } );
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

	chessBoard = new Board(0, -2.5, 0, 64, loader, scene, THREE, TWEEN);

	myPlayer = new Player(chessBoard, controls, TWEEN, camera, 'http://chessnut.fmeyer.com');

	chessBoard.addWhite();
	chessBoard.addBlack();

	// lights
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

onDocumentMouseDown = function(event) {
	if (event.button == 0) {
		event.preventDefault();

		var vector = new THREE.Vector3( ( event.clientX / window.innerWidth ) * 2 - 1, - ( event.clientY / window.innerHeight ) * 2 + 1, 0.5 );
		projector.unprojectVector( vector, camera );

		var ray = new THREE.Ray( camera.position, vector.subSelf( camera.position ).normalize() );

		var intersects = ray.intersectObjects( scene.children );

		if ( intersects.length > 0 ) {
			var intersectObj = intersects[0].object;
			var myColor = chessBoard.returnMyColor();
			if (intersectObj.hasOwnProperty('chessColor') && intersectObj.chessColor == myColor) {
				if (chessBoard.highlightedPiece == intersectObj) {
					chessBoard.selectedPiece = null;
					chessBoard.unhighlightPiece();
					chessBoard.unhighlightMoves();
				} else {
					chessBoard.selectedPiece = intersectObj;
					chessBoard.highlightPiece(chessBoard.selectedPiece);
					myPlayer.emitPossibleMoves(chessBoard.selectedPiece.chessPos);
				}
			} else if (intersectObj.hasOwnProperty('chessPos') && chessBoard.selectedPiece) {
				myPlayer.emitMove(chessBoard.selectedPiece.chessPos, intersectObj.chessPos);
				chessBoard.selectedPiece = null;
				chessBoard.unhighlightMoves();
				chessBoard.unhighlightPiece();
			}
		}
	}
}

$("#joinGame").click(function() {
	myPlayer.joinGame();
});

$("#spectateGame").click(function() {
	myPlayer.spectateGame();
});

if ( ! Detector.webgl ) {
	Detector.addGetWebGLMessage();
} else {
	init();
	animate();
}