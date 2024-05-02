var board = null;
var game = new Chess();
let rookTestFen = 'rnbqk2r/pppppp1p/6Pn/b1PR1P2/3P4/8/PP1QP2P/RNB1KBN1 w Qkq - 1 2'
let bishopTestfen = 'rnbqkb1r/pp1ppnpp/2p1p3/3B4/2P5/P4P1R/1P1PP1PP/RNBQK1N1 w Qkq - 0 1'
let checkFen = 'rnbqkb1Q/pp1p2pp/2p1p3/4R2n/2P5/P2B1P2/1P1PP1PP/RNB1K1N1 b Qq - 0 1'
let checkFen2 = '1nbqkb1Q/pp1p2pp/2p1p3/4R3/2P4r/P2B1P2/1P1PP1PP/RNB1K1N1 b Q - 0 1'
let checkFen3 = '1nbqkb1Q/pp1p2pR/2p1p3/2R5/7r/P2B1P2/1P1PP1PP/1NB1K1N1 b - - 0 1'
let initalFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
// Make a white move for engine to calculate
let checkMateFen = '1nbqkb1Q/pp1p2pR/2p1p3/2R5/r7/P2B1P2/1P1PP1PP/1NB1K1N1 w - - 0 1'
// only checks for non-brq pieces, TO CHECK
let tstCase1 = 'rnbq1bnr/ppp1pppp/8/4k3/7N/8/PPPPPPPP/RNBQKB1R w - - 0 1'
let tstCase2 = 'rnbq1bnr/ppp1pppp/8/4k3/8/8/PPPPPPP1/RNBQK1BR w - - 0 1' // Working

let fen = initalFen // ***CHANGE FEN ONLY HERE, as it is also used in editor Congfig***

console.log("Is fen valid", game.load(fen))
var whiteSquareGrey = "#a9a9a9";
var blackSquareGrey = "#696969";

// Pawn Promo
var promote_to, promoting, promotion_dialog, piece_theme;
var boardJqry = $('#boardEditor')
promotion_dialog = $("#promotion-dialog");
promoting = false;
piece_theme = "img/chesspieces/wikipedia/{piece}.png";

$("#promote-to").selectable({
	stop: function () {
		$(".ui-selected", this).each(function () {
			var selectable = $("#promote-to li");
			var index = selectable.index(this);
			if (index > -1) {
				var promote_to_html = selectable[index].innerHTML;
				var span = $("<div>" + promote_to_html + "</div>").find("span");
				promote_to = span[0].innerHTML;
			}
			promotion_dialog.dialog("close");
			$(".ui-selectee").removeClass("ui-selected");
			board.position(game.fen(), false);
			// showSideToMove();
			promoting = false;
		});
	},
});

function onSnapEnd(params) {
	if (promoting) return; //if promoting we need to select the piece first
	board.position(game.fen())
}

function onDragStart(source, piece) {
	// do not pick up pieces if the game is over
	if (
		(game.turn() === "w" && piece.search(/^b/) !== -1) ||
		(game.turn() === "b" && piece.search(/^w/) !== -1)
	) {
		return false;
	}
	if (game.game_over() || isXRayCheckmate(game.fen())) return false;

	// or if it's not that side's turn

}

function onDrop(source, target) {
	removeGreySquares();

	let madeMove = false
	let moves = []
	if (game.get(source).type === 'r')
		moves = getValidRookMoves(game, source)
	else if (game.get(source).type === 'b')
		moves = getValidBishopMoves(game, source)
	else if (game.get(source).type === 'q')
		moves = getValidQueenMoves(game, source)
	else
		moves = getValidOtherMoves(game, source)

	for (let mv of moves) {
		if (mv.from === source && mv.to === target) {
			var source_rank = source.substring(2, 1);
			var target_rank = target.substring(2, 1);
			var piece = game.get(source).type;
			if (
				piece === "p" &&
				((source_rank === "7" && target_rank === "8") ||
					(source_rank === "2" && target_rank === "1"))
			) {
				handlePawnPromo(game, source, target)
			}
			else {
				makeMoveAndAlterTurn(game, source, target)
			}

			madeMove = true
			break
		}
	}
	checkAndHandleCheckMate(game)
	if (!madeMove)
		return "snapback";
}

function onMouseoverSquare(square, piece) {
	// get list of possible moves for this square
	if (!game.get(square)) return
	if (game.get(square).color !== game.turn()) return
	let moves = []
	if (game.get(square).type === 'r')
		moves = getValidRookMoves(game, square)
	else if (game.get(square).type === 'b')
		moves = getValidBishopMoves(game, square)
	else if (game.get(square).type === 'q')
		moves = getValidQueenMoves(game, square)
	else {
		moves = getValidOtherMoves(game, square)

	}

	// exit if there are no moves available for this square
	if (moves.length === 0) return;

	// highlight the square they moused over
	greySquare(square);

	// highlight the possible squares for this piece
	for (var i = 0; i < moves.length; i++) {
		greySquare(moves[i].to);
	}
}

function onMouseoutSquare(square, piece) {
	removeGreySquares();
}

// DO NOT REMOVE ALL FUNCTIONS as it will lead to circular dependencies in checkAfterMove
function getAllQueenMoves(loadGame, square) {
	return getAllBishopMoves(loadGame, square).concat(getAllRookMoves(loadGame, square))
}

function getValidQueenMoves(loadGame, square) {
	return getValidBishopMoves(loadGame, square).concat(getValidRookMoves(loadGame, square))
}

function getAllBishopMoves(loadGame, square) {
	let sc = square[0].charCodeAt(0)
	let sn = Number(square[1])
	let allBishopMoves = []
	let stop = false
	//upper right
	stop = false
	for (let i = sc + 1, j = sn + 1; i <= 104 && j <= 8; i++, j++) {
		let to = String.fromCharCode(i) + j
		if (!loadGame.get(to)) allBishopMoves.push(build_move(loadGame, square, to))
		else {
			if (loadGame.get(to).color === loadGame.get(square).color) {
				if (stop) break
				stop = true
				continue
			}
			if (stop) {
				allBishopMoves.push(build_move(loadGame, square, to))
				break
			}
			allBishopMoves.push(build_move(loadGame, square, to))
			stop = true
		}
	}
	//upper left
	stop = false
	for (let i = sc - 1, j = sn + 1; i >= 97 && j <= 8; i--, j++) {
		let to = String.fromCharCode(i) + j
		if (!loadGame.get(to)) allBishopMoves.push(build_move(loadGame, square, to))
		else {
			if (loadGame.get(to).color === loadGame.get(square).color) {
				if (stop) break
				stop = true
				continue
			}
			if (stop) {
				allBishopMoves.push(build_move(loadGame, square, to))
				break
			}
			allBishopMoves.push(build_move(loadGame, square, to))
			stop = true
		}
	}
	// bottom right
	stop = false
	for (let i = sc + 1, j = sn - 1; i <= 104 && j >= 1; i++, j--) {
		let to = String.fromCharCode(i) + j
		if (!loadGame.get(to)) allBishopMoves.push(build_move(loadGame, square, to))
		else {
			if (loadGame.get(to).color === loadGame.get(square).color) {
				if (stop) break
				stop = true
				continue
			}
			if (stop) {
				allBishopMoves.push(build_move(loadGame, square, to))
				break
			}
			allBishopMoves.push(build_move(loadGame, square, to))
			stop = true
		}
	}
	// bottom left
	stop = false
	for (let i = sc - 1, j = sn - 1; i >= 97 && j >= 1; i--, j--) {
		let to = String.fromCharCode(i) + j
		if (!loadGame.get(to)) allBishopMoves.push(build_move(loadGame, square, to))
		else {
			if (loadGame.get(to).color === loadGame.get(square).color) {
				if (stop) break
				stop = true
				continue
			}
			if (stop) {
				allBishopMoves.push(build_move(loadGame, square, to))
				break
			}
			allBishopMoves.push(build_move(loadGame, square, to))
			stop = true
		}
	}

	return allBishopMoves
}

function getValidBishopMoves(loadGame, source) {
	let sc = source[0].charCodeAt(0)
	let sn = Number(source[1])
	let validBishopMoves = []
	function checkAndPush(target) {
		if (!isCheckAfterMakeMove(loadGame.fen(), source, target))
			validBishopMoves.push(build_move(loadGame, source, target))
	}
	let stop = false
	//upper right

	for (let i = sc + 1, j = sn + 1; i <= 104 && j <= 8; i++, j++) {
		let target = String.fromCharCode(i) + j
		if (!loadGame.get(target)) checkAndPush(target)
		else {
			if (loadGame.get(target).color === loadGame.get(source).color) {
				if (stop) break
				stop = true
				continue
			}
			if (stop) {
				checkAndPush(target)
				break
			}
			checkAndPush(target)
			stop = true
		}
	}
	//upper left
	stop = false
	for (let i = sc - 1, j = sn + 1; i >= 97 && j <= 8; i--, j++) {
		let target = String.fromCharCode(i) + j
		if (!loadGame.get(target)) checkAndPush(target)
		else {
			if (loadGame.get(target).color === loadGame.get(source).color) {
				if (stop) break
				stop = true
				continue
			}
			if (stop) {
				checkAndPush(target)
				break
			}
			checkAndPush(target)
			stop = true
		}
	}
	// bottom right
	stop = false
	for (let i = sc + 1, j = sn - 1; i <= 104 && j >= 1; i++, j--) {
		let target = String.fromCharCode(i) + j
		if (!loadGame.get(target)) checkAndPush(target)
		else {
			if (loadGame.get(target).color === loadGame.get(source).color) {
				if (stop) break
				stop = true
				continue
			}
			if (stop) {
				checkAndPush(target)
				break
			}
			checkAndPush(target)
			stop = true
		}
	}
	// bottom left
	stop = false
	for (let i = sc - 1, j = sn - 1; i >= 97 && j >= 1; i--, j--) {
		let target = String.fromCharCode(i) + j
		if (!loadGame.get(target)) checkAndPush(target)
		else {
			if (loadGame.get(target).color === loadGame.get(source).color) {
				if (stop) break
				stop = true
				continue
			}
			if (stop) {
				checkAndPush(target)
				break
			}
			checkAndPush(target)
			stop = true
		}
	}
	return validBishopMoves
}

function getAllRookMoves(loadGame, square) {
	let allRookMoves = []
	// Upper Squares
	let stop = false
	for (let i = Number(square[1]) + 1; i <= 8; i++) {
		let to = square[0] + i
		if (!loadGame.get(to)) allRookMoves.push(build_move(loadGame, square, to))
		else {
			if (loadGame.get(to).color === loadGame.get(square).color) {
				if (stop) break
				stop = true
				continue
			}
			if (stop) {
				allRookMoves.push(build_move(loadGame, square, to))
				break
			}
			allRookMoves.push(build_move(loadGame, square, to))
			stop = true
		}
	}
	// Lower Squares
	stop = false

	for (let i = Number(square[1]) - 1; i >= 1; i--) {
		let to = square[0] + i
		if (!loadGame.get(to)) allRookMoves.push(build_move(loadGame, square, to))
		else {
			if (loadGame.get(to).color === loadGame.get(square).color) {
				if (stop) break
				stop = true
				continue
			}
			if (stop) {
				allRookMoves.push(build_move(loadGame, square, to))
				break
			}
			allRookMoves.push(build_move(loadGame, square, to))
			stop = true
		}
	}
	// [97, 98, 99, 100, 101, 102, 103, 104]
	// Right Squares
	stop = false

	for (let i = square[0].charCodeAt(0) + 1; i <= 104; i++) {
		let to = String.fromCharCode(i) + square[1]
		if (!loadGame.get(to)) allRookMoves.push(build_move(loadGame, square, to))
		else {
			if (loadGame.get(to).color === loadGame.get(square).color) {
				if (stop) break
				stop = true
				continue
			}
			if (stop) {
				allRookMoves.push(build_move(loadGame, square, to))
				break
			}
			allRookMoves.push(build_move(loadGame, square, to))
			stop = true
		}
	}
	// Left Squares
	stop = false
	for (let i = square[0].charCodeAt(0) - 1; i >= 97; i--) {
		let to = String.fromCharCode(i) + square[1]
		if (loadGame.get(to) && loadGame.get(to).color === loadGame.get(square).color && stop) break
		if (loadGame.get(to) && loadGame.get(to).color === loadGame.get(square).color && !stop) {
			stop = true
			continue
		}

		if (loadGame.get(to) && stop) {
			allRookMoves.push(build_move(loadGame, square, to))
			break
		}
		if (loadGame.get(to)) stop = true
		allRookMoves.push(build_move(loadGame, square, to))
	}
	return allRookMoves
}

function getValidRookMoves(loadGame, source) {
	let validRookMoves = []
	function checkAndPush(target) {
		if (!isCheckAfterMakeMove(loadGame.fen(), source, target))
			validRookMoves.push(build_move(loadGame, source, target))
	}
	// Upper Squares
	let stop = false
	for (let i = Number(source[1]) + 1; i <= 8; i++) {
		let target = source[0] + i

		if (!loadGame.get(target)) checkAndPush(target)
		else {
			if (loadGame.get(target).color === loadGame.get(source).color) {
				if (stop) break
				stop = true
				continue
			}
			if (stop) {
				checkAndPush(target)
				break
			}
			checkAndPush(target)
			stop = true
		}
	}
	// Lower Squares
	stop = false

	for (let i = Number(source[1]) - 1; i >= 1; i--) {
		let target = source[0] + i
		if (!loadGame.get(target)) checkAndPush(target)
		else {
			if (loadGame.get(target).color === loadGame.get(source).color) {
				if (stop) break
				stop = true
				continue
			}
			if (stop) {
				checkAndPush(target)
				break
			}
			checkAndPush(target)
			stop = true
		}
	}
	// [97, 98, 99, 100, 101, 102, 103, 104]
	// Right Squares
	stop = false

	for (let i = source[0].charCodeAt(0) + 1; i <= 104; i++) {
		let target = String.fromCharCode(i) + source[1]
		if (!loadGame.get(target)) checkAndPush(target)
		else {
			if (loadGame.get(target).color === loadGame.get(source).color) {
				if (stop) break
				stop = true
				continue
			}
			if (stop) {
				checkAndPush(target)
				break
			}
			checkAndPush(target)
			stop = true
		}
	}
	// Left Squares
	stop = false
	for (let i = source[0].charCodeAt(0) - 1; i >= 97; i--) {
		let target = String.fromCharCode(i) + source[1]
		if (!loadGame.get(target)) checkAndPush(target)
		else {
			if (loadGame.get(target).color === loadGame.get(source).color) {
				if (stop) break
				stop = true
				continue
			}
			if (stop) {
				checkAndPush(target)
				break
			}
			checkAndPush(target)
			stop = true
		}
	}
	return validRookMoves
}

function getValidOtherMoves(loadGame, source) {
	let validOtherMoves = []
	let moves = loadGame.moves({ square: source, verbose: true })

	for (let mv of moves) {
		if (!isCheckAfterMakeMove(loadGame.fen(), source, mv.to)) {
			validOtherMoves.push(mv)
		}
	}
	return validOtherMoves
}

function build_move(loadGame, from, to) {
	var move = {
		color: loadGame.get(from).color,
		from: from,
		to: to,
		flags: 'n',
		piece: loadGame.get(from).type
	};

	if (loadGame.get(to)) {
		if (loadGame.get(to).color === loadGame.get(from).color) throw "Capturing Same Color"
		move.captured = loadGame.get(to).type;
		move.flags = 'c'
	}
	return move;
}

function makeMoveAndAlterTurn(loadGame, source, target) {
	makeMove(loadGame, source, target)
	let alterTurnFen = getAlterTurnFen(loadGame.fen())
	loadGame.load(alterTurnFen)
}

function makePawnPromoAndAlterTurn(loadGame, source, target, pieceType) {
	makePawnPromo(loadGame, source, target, pieceType)
	let alterTurnFen = getAlterTurnFen(loadGame.fen())
	loadGame.load(alterTurnFen)
}

function makeMove(loadGame, source, target) {
	var sourcePiece = loadGame.get(source);
	loadGame.remove(source)
	loadGame.remove(target)
	loadGame.put({ type: sourcePiece.type, color: sourcePiece.color }, target)
}

function makePawnPromo(loadGame, source, target, pieceType) {
	loadGame.remove(source)
	loadGame.remove(target)
	loadGame.put({ type: pieceType.type, color: pieceType.color }, target)
}

function isXRayCheckmate(fen) {
	let isCheckGame = new Chess()
	isCheckGame.load(fen)
	for (let sq of isCheckGame.SQUARES) {
		if (isCheckGame.get(sq) && isCheckGame.get(sq).color === isCheckGame.turn()) {
			let moves = []
			if (isCheckGame.get(sq).type === 'r')
				moves = getValidRookMoves(isCheckGame, sq)
			else if (isCheckGame.get(sq).type === 'b')
				moves = getValidBishopMoves(isCheckGame, sq)
			else if (isCheckGame.get(sq).type === 'q')
				moves = getValidQueenMoves(isCheckGame, sq)
			else {
				moves = getValidOtherMoves(isCheckGame, sq)
			}
			if (moves.length > 0) {
				console.log(moves) // Keep this
				return false
			}
		}
	}
	return true
}

function isKingUnderAttack(fen) { // For Current Turn King
	let isCheckGame = new Chess()
	let myArray = fen.split(" ");
	if (myArray[1] == "b")
		myArray[1] = "w";
	else
		myArray[1] = "b";
	fen = myArray.join(" ");
	isCheckGame.load(fen)

	for (let source of isCheckGame.SQUARES) {
		if (isCheckGame.get(source) && isCheckGame.get(source).color === isCheckGame.turn()) {
			let moves = []
			if (isCheckGame.get(source).type === 'r')
				moves = getAllRookMoves(isCheckGame, source)
			else if (isCheckGame.get(source).type === 'b')
				moves = getAllBishopMoves(isCheckGame, source)
			else if (isCheckGame.get(source).type === 'q')
				moves = getAllQueenMoves(isCheckGame, source)
			else {
				moves = isCheckGame.moves({ verbose: true, square: source })

			}
			for (let mv of moves) {
				if ('captured' in mv && mv.captured === 'k') return true
			}
		}
	}
	return false
}

function getAlterTurnFen(fen) {
	let myArray = fen.split(" ");
	if (myArray[1] == "b")
		myArray[1] = "w";
	else
		myArray[1] = "b";
	return myArray.join(" ");
}

function isCheckAfterMakeMove(fen, source, target) {
	let loadGame = new Chess()
	loadGame.load(fen)
	makeMove(loadGame, source, target)
	return isKingUnderAttack(loadGame.fen())
}

function removeGreySquares() {
	$("#myBoard .square-55d63").css("background", "");
}

function greySquare(square) {
	var $square = $("#myBoard .square-" + square);

	var background = whiteSquareGrey;
	if ($square.hasClass("black-3c85d")) {
		background = blackSquareGrey;
	}

	$square.css("background", background);
}

function checkAndHandleCheckMate(game) {
	if (isXRayCheckmate(game.fen())) {
		if (game.turn() === 'w') alert('🥳 Black Wins the Game 🎉')
		else alert('🥳 White Wins the Game 🎉')
	}
}


var config = {
	draggable: true,
	position: fen,
	onDragStart: onDragStart,
	onDrop: onDrop,
	onMouseoutSquare: onMouseoutSquare,
	onMouseoverSquare: onMouseoverSquare,
	onSnapEnd: onSnapEnd,
};
board = Chessboard("myBoard", config);
window.game = game



const startPlayEl = document.getElementById('startPlay');
const arrangeEl = document.getElementById('arrange');
const clearEditorEl = document.getElementById('clearEditor');
let play = true
startPlayEl.addEventListener('click', (e) => {
	e.preventDefault();
	document.getElementById('trn').innerHTML = game.turn();
	// clearEditorEl.style.display = null; // changed Here
	if ((board.fen().match(/k/g) || []).length < 1 || (board.fen().match(/K/g) || []).length < 1) {
		alert("There must be atleast 2 Kings of both color in the board")
		return
	}
	console.log(board.fen())
	startPlayEl.style.display = "none";
	arrangeEl.style.display = null;
	let clr = 'w'
	if (confirm("Is it White's turn ?")) {
		clr = "w";
	} else {
		clr = "b";
	}
	let currentFen = board.fen() + ' ' + clr + ' KQkq - 2 3';
	game = new Chess(currentFen)
	var config = {
		draggable: true,
		position: currentFen,
		onDragStart: onDragStart,
		onDrop: onDrop,
		onMouseoutSquare: onMouseoutSquare,
		onMouseoverSquare: onMouseoverSquare,
		onSnapEnd: onSnapEnd,
	};
	board = Chessboard('myBoard', config);
	play = true;
})

arrangeEl.addEventListener('click', (e) => {
	e.preventDefault();
	play = false;
	// Get current Fen string and set config
	// document.querySelector('#clearEditor').style.display = null;
	startPlayEl.style.display = null;
	arrangeEl.style.display = "none";
	clearEditorEl.style.display = null;
	//let currentFen = board.fen();
	let currentFen = game.fen();
	let config = {
		draggable: true,
		dropOffBoard: 'trash',
		position: currentFen,
		sparePieces: true
	};
	board = Chessboard('myBoard', config);
	$('#clearEditor').on('click', board.clear)
})

function getImgSrc(piece) {
	return piece_theme.replace(
		"{piece}",
		game.turn() + piece.toLocaleUpperCase()
	);
}

function handlePawnPromo(game, source, target) {
	// is it a promotion?
	// check above in loop
	promoting = true;
	// get piece images
	$(".promotion-piece-q").attr("src", getImgSrc("q"));
	$(".promotion-piece-r").attr("src", getImgSrc("r"));
	$(".promotion-piece-n").attr("src", getImgSrc("n"));
	$(".promotion-piece-b").attr("src", getImgSrc("b"));
	//show the select piece to promote to dialog
	promotion_dialog
		.dialog({
			modal: true,
			height: 52,
			width: 184,
			resizable: true,
			draggable: false,
			close: () => {
				let pt = { type: promote_to, color: game.get(source).color }
				console.log(pt)
				makePawnPromoAndAlterTurn(game, source, target, pt)
				checkAndHandleCheckMate(game)
			},
			closeOnEscape: false,
			dialogClass: "noTitleStuff",
		})
		.dialog("widget")
		.position({
			of: $("#myBoard"),
			my: "middle middle",
			at: "middle middle",
		});
	//the actual move is made after the piece to promote to
	//has been selected, in the stop event of the promotion piece selectable
	return;
}