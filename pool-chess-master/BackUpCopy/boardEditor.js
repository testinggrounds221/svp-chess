//V0.2

const boardEditorEl = document.getElementById('bd');
const startPlayEl = document.getElementById('startPlay');
const arrangeEl = document.getElementById('arrange');
const myAudioEl = document.getElementById('myAudio');
const clearEditorEl = document.getElementById('clearEditor');
// const startEditor = document.getElementById('startEditor');
var editorTurnt = 0;
let play = true;
var configEditor = {};
var editorBoard = null;
var boardJqry = $('#boardEditor')
var editorGame = new Chess()
var fen, editorGame, piece_theme, promote_to, promoting, promotion_dialog;
promotion_dialog = $("#promotion-dialog");
promoting = false;
piece_theme = "img/chesspieces/wikipedia/{piece}.png";
var squareToHighlight = null
var squareClass = 'square-55d63'



$(function () {
	$("#dialog-4").dialog({
		autoOpen: false,
		modal: true,
		buttons: {
			Yes: function () {
				moveBack($(this).data('move'))
				$(this).dialog("close");
				waitForBoom = false
			},
			No: function () {
				$(this).dialog("close");
				waitForBoom = false
				alertCheckMate()
			},
		},
	});
	// css("font-size", "30px");
	$("#opener-4").click(function () {
		$("#dialog-4").dialog("open");
	});
});

startPlayEl.addEventListener('click', (e) => {
	e.preventDefault();
	document.getElementById('trn').innerHTML = editorGame.turn();
	// clearEditorEl.style.display = null; // changed Here
	if ((editorBoard.fen().match(/k/g) || []).length < 1 || (editorBoard.fen().match(/K/g) || []).length < 1) {
		alert("There must be atleast 2 Kings of both color in the board")
		return
	}
	console.log(editorBoard.fen())
	startPlayEl.style.display = "none";
	arrangeEl.style.display = null;
	let clr = 'w'
	if (confirm("Is it White's turn ?")) {
		clr = "w";
	} else {
		clr = "b";
	}
	let currentFen = editorBoard.fen() + ' ' + clr + ' KQkq - 2 3';
	editorGame = new Chess(currentFen)
	configEditor = {
		draggable: true,
		position: editorBoard.fen(),
		onSnapEnd: onSnapEndEditor,
		onDragStart: onDragStartEditor,
		onDrop: onDropEditor,
		onMoveEnd: onMoveEnd,
	}
	editorBoard = Chessboard('boardEditor', configEditor);
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
	//let currentFen = editorBoard.fen();
	let currentFen = "r1k5/8/2p3b1/Q3p1pp/p2BP3/5N2/3b4/6K1 w - - 0 1";
	configEditor = {
		draggable: true,
		dropOffBoard: 'trash',
		position: currentFen,
		sparePieces: true
	}
	editorBoard = Chessboard('boardEditor', configEditor);
	$('#clearEditor').on('click', editorBoard.clear)
})

boardEditorEl.addEventListener('click', (e) => {
	e.preventDefault();
	document.getElementById('gameMode').style.display = "none";
	document.querySelector('#boardEditorGame').style.display = null;
	// document.querySelector('#clearEditor').style.display = "none";
	// document.querySelector('#startEditor').style.display = "none";
	configEditor = {
		draggable: true,
		position: 'start',
		onSnapEnd: onSnapEndEditor,
		onDragStart: onDragStartEditor,
		onDrop: onDropEditor,
		onMoveEnd: onMoveEnd,
	}
	editorBoard = Chessboard('boardEditor', configEditor);
})

// Board Change Functions
function onSnapEndEditor(params) {
	if (promoting) return; //if promoting we need to select the piece first
	editorBoard.position(editorGame.fen())
}

function onDragStartEditor(source, piece, position, orientation) {
	if (editorGame.game_over()) {
		if (editorGame.in_checkmate() || editorGame.in_check()) {
			console.log('Check Mate')
		}
	}
}


function makeTopSpinMove(target, sourcePiece, possMoves){

	var topSpinPos;
	var movePiecePos = document.getElementById("pool-move").value
	for (let i = 0; i < possMoves.length; i++) {
		if (movePiecePos == possMoves[i]) {
			topSpinPos = possMoves[i - 1]
		}
	}
	editorGame.put({
		type: sourcePiece.type,
		color: sourcePiece.color
	}, topSpinPos)
	editorGame.remove(target);
	let Fen = editorGame.fen()
	let FenA = Fen.split(" ")
	if (FenA[1] == "b") {
		FenA[1].replace("b", "w")
	} else {
		FenA[1].replace("w", "b")
	}
	editorGame.load(Fen)
	editorBoard.position(Fen)
}

function makePoolMove(targetPiece, possMoves) {
	var movePiecePos = document.getElementById("pool-move").value
	if (possMoves.includes(movePiecePos)) {
		console.log(movePiecePos)
		editorGame.put({
			type: targetPiece.type,
			color: targetPiece.color
		}, movePiecePos) //Move Pos2 To Pos3
		let Fen = editorGame.fen()
		let FenA = Fen.split(" ")
		if (FenA[1] == "b") {
			FenA[1].replace("b", "w")
		} else {
			FenA[1].replace("w", "b")
		}
		editorGame.load(Fen)
		editorBoard.position(Fen)
	}
}

function isPossibleMove(source, target, sourcePiece, targetPiece, currentFen, loadGame) {
	let c = new Chess()
	c.load(currentFen)
	var move = c.move({
		from: source,
		to: target,
		promotion: 'q' // NOTE: always promote to a queen for example simplicity
	})


	let Moves = []
	if (move === null) {
		return 'snapback'
	}
	if (move != null && 'captured' in move) {
		if (sourcePiece.type == 'b') {
			Moves = pushPieceBishop(loadGame, source, target)
		}
		if (sourcePiece.type == 'r') {
			Moves = pushPieceRook(loadGame, source, target)
		}
		if (sourcePiece.type == 'q') {
			Moves = pushPieceQueen(loadGame, source, target)
		}
		if (sourcePiece.type == 'n') {
			Moves = pushPieceKnight(loadGame, source, target)
		}
		if (sourcePiece.type == 'p') {
			Moves = pushPieceBishop(loadGame, source, target)
		}
		if (sourcePiece.type == 'k') {
			Moves = pushPieceQueen(loadGame, source, target)
		}
		let possMoves = []
		for (let i = 0; i < Moves.length; i++) {
			possMoves.push(Moves[i].to)
		}
		if (possMoves.length == 0) {
			return 0
		}
	}
	return 1
}

function pushPieceKnight(loadGame, source, target) {

	let alphas = source[0].charCodeAt(0)
	let betas = Number(source[1])


	let alphat = target[0].charCodeAt(0)
	let betat = Number(target[1])

	let allKnightMoves = []
	let stop = false

	if (alphas < alphat) {
		console.log("RIGHT")
		for (let i = target[0].charCodeAt(0) + 1; i <= 105; i++) {
			let to = String.fromCharCode(i) + target[1]
			if (!loadGame.get(to)) allKnightMoves.push(build_move(loadGame, source, to))
			else {
				break
			}
		}
		if (betas < betat) { //UPPER RIGHT
			stop = false
			for (let i = betat + 1; i <= 9; i++) {
				let to = target[0] + i
				if (!loadGame.get(to)) allKnightMoves.push(build_move(loadGame, source, to))
				else {
					break
				}
			}
			stop = false
			return allKnightMoves
		} else if (betas > betat) { //LOWER RIGHT
			stop = false
			for (let i = betat - 1; i >= 0; i--) {
				let to = target[0] + i
				if (!loadGame.get(to)) allKnightMoves.push(build_move(loadGame, source, to))
				else {
					break
				}
			}
			stop = false
			return allKnightMoves
		}
	} else {
		console.log("LEFT")
		for (let i = target[0].charCodeAt(0) - 1; i >= 96; i--) {
			let to = String.fromCharCode(i) + target[1]
			if (!loadGame.get(to)) allKnightMoves.push(build_move(loadGame, source, to))
			else {
				break
			}
		}
		if (betas < betat) { //UPPER RIGHT
			stop = false
			for (let i = betat + 1; i <= 9; i++) {
				let to = target[0] + i
				if (!loadGame.get(to)) allKnightMoves.push(build_move(loadGame, source, to))
				else {
					break
				}
			}
			stop = false
			return allKnightMoves
		} else if (betas > betat) { //LOWER RIGHT
			stop = false
			for (let i = betat - 1; i >= 0; i--) {
				let to = target[0] + i
				if (!loadGame.get(to)) allKnightMoves.push(build_move(loadGame, source, to))
				else {
					break
				}
				allKnightMoves.push(build_move(loadGame, source, to))
				stop = true
			}
			stop = false
			return allKnightMoves
		}
	}
}

function pushPieceQueen(loadGame, source, target) {

	let alphas = source[0]
	let betas = source[1]

	let alphat = target[0]
	let betat = target[1]

	if (alphas != alphat && betas != betat) {
		let validBMoves = pushPieceBishop(loadGame, source, target);
		console.log("Bishop")
		return validBMoves
	} else {
		let validRMoves = pushPieceRook(loadGame, source, target);
		return validRMoves
	}
}

function pushPieceRook(loadGame, source, target) {
	let alphas = source[0].charCodeAt(0)
	let betas = Number(source[1])


	let alphat = target[0].charCodeAt(0)
	let betat = Number(target[1])

	let allRookMoves = []
	let stop = false


	if (alphas == alphat) {
		if (betas < betat) {
			stop = false
			for (let i = betat + 1; i <= 9; i++) {
				let to = source[0] + i
				if (!loadGame.get(to)) allRookMoves.push(build_move(loadGame, source, to))
				else {
					break
				}
			}
			return allRookMoves
		} else if (betas > betat) {
			stop = false
			for (let i = betat - 1; i >= 0; i--) {
				let to = source[0] + i
				if (!loadGame.get(to)) allRookMoves.push(build_move(loadGame, source, to))
				else {
					break
				}
			}
			return allRookMoves
		}
	} else {
		if (alphas < alphat) {
			stop = false

			for (let i = target[0].charCodeAt(0) + 1; i <= 105; i++) {
				let to = String.fromCharCode(i) + source[1]
				if (!loadGame.get(to)) allRookMoves.push(build_move(loadGame, source, to))
				else {
					break
				}
			}
			return allRookMoves
		} else if (alphas > alphat) {
			stop = false
			for (let i = target[0].charCodeAt(0) - 1; i >= 96; i--) {
				let to = String.fromCharCode(i) + source[1]
				if (loadGame.get(to) && loadGame.get(to).color === loadGame.get(source).color && stop) break
				if (loadGame.get(to) && loadGame.get(to).color === loadGame.get(source).color && !stop) {
					stop = true
					continue
				}
				if (loadGame.get(to) && stop) {
					allRookMoves.push(build_move(loadGame, source, to))
					break
				}
				if (loadGame.get(to)) stop = true
				allRookMoves.push(build_move(loadGame, source, to))
			}
			return allRookMoves
		}
	}


}

function pushPieceBishop(loadGame, source, target) {

	let alphas = source[0].charCodeAt(0)
	let betas = Number(source[1])


	let alphat = target[0].charCodeAt(0)
	let betat = Number(target[1])

	let allBishopMoves = []
	let stop = false
	console.log(source)
	console.log(alphas + " " + betas + " ")

	if (alphas < alphat) {
		if (betas < betat) { //UPPER RIGHT
			stop = false
			for (let i = alphat + 1, j = betat + 1; i <= 105 && j <= 9; i++, j++) {
				let to = String.fromCharCode(i) + j
				if (!loadGame.get(to)) allBishopMoves.push(build_move(loadGame, source, to))
				else {
					break
				}
			}
			stop = false
			return allBishopMoves
		} else if (betas > betat) { //LOWER RIGHT
			stop = false
			for (let i = alphat + 1, j = betat - 1; i <= 105 && j >= 0; i++, j--) {
				let to = String.fromCharCode(i) + j
				if (!loadGame.get(to)) allBishopMoves.push(build_move(loadGame, source, to))
				else {
					break
				}
			}
			stop = false
			return allBishopMoves
		}
	} else {
		if (betas < betat) { //UPPER LEFT
			stop = false
			for (let i = alphat - 1, j = betat + 1; i >= 96 && j <= 9; i--, j++) {
				let to = String.fromCharCode(i) + j
				if (!loadGame.get(to)) allBishopMoves.push(build_move(loadGame, source, to))
				else {
					break
				}
			}
			return allBishopMoves
		} else if (betas > betat) { //LOWER LEFT
			stop = false
			for (let i = alphat - 1, j = betat - 1; i >= 96 && j >= 0; i--, j--) {
				let to = String.fromCharCode(i) + j
				if (!loadGame.get(to)) allBishopMoves.push(build_move(loadGame, source, to))
				else {
					break
				}
			}
			return allBishopMoves
		}
	}

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

function onDropEditor(source, target) {
	let sourcePiece = editorGame.get(source)
	let targetPiece = editorGame.get(target)
	var loadGame = new Chess()
	let currentFen = editorGame.fen()
	loadGame.load(currentFen)
	if (!isPossibleMove(source, target, sourcePiece, targetPiece, currentFen, loadGame)) {
		return "snapback"
	}

	let Moves = []
	var move = editorGame.move({
		from: source,
		to: target,
		promotion: 'q' // NOTE: always promote to a queen for example simplicity
	})

	document.getElementById('trn').style.display = null;
	document.getElementById('trn').innerHTML = editorGame.turn();
	document.getElementById('possMoves').style.display = "none";
	document.getElementById('input-pos').style.display = "none";
	document.getElementById('top-spin').style.display = "none";

	myAudioEl.play();
	// illegal move
	if (move === null) {
		return 'snapback'
	}
	if (move != null && 'captured' in move) {
		if (sourcePiece.type == 'b') {
			console.log("BISHOP")
			Moves = pushPieceBishop(loadGame, source, target)
			console.log(Moves)
		}
		if (sourcePiece.type == 'r') {
			console.log("ROOK")
			Moves = pushPieceRook(loadGame, source, target)
			console.log(Moves)
		}
		if (sourcePiece.type == 'q') {
			console.log("QUEEN")
			Moves = pushPieceQueen(loadGame, source, target)
			console.log(Moves)
		}
		if (sourcePiece.type == 'n') {
			console.log("KNIGHT")
			Moves = pushPieceKnight(loadGame, source, target)
			console.log(Moves)
		}
		if (sourcePiece.type == 'p') {
			console.log("PAWN")
			Moves = pushPieceBishop(loadGame, source, target)
			console.log(Moves)
		}
		if (sourcePiece.type == 'k') {
			console.log("KING")
			Moves = pushPieceQueen(loadGame, source, target)
			console.log(Moves)
		}
		let possMoves = []
		let topSpinPieces = ['b', 'q', 'r']
		for (let i = 0; i < Moves.length; i++) {
			possMoves.push(Moves[i].to)
		}

		document.getElementById('input-pos').style.display = "block";
		var movePiecePos, topSpinPos;
		
		if (document.getElementById("pool-yes").value != null) { //Pos 3 after capture
			$("#pool-yes").click(function () {
				makePoolMove(targetPiece, possMoves) //Valid Pos3
			});
			document.getElementById('input-pos').style.display = null;
		}

		if (topSpinPieces.includes(sourcePiece.type)) {
			document.getElementById('top-spin').style.display = "block";
			$("#top-spin").click(function () {
				makeTopSpinMove(target, sourcePiece, possMoves)											//Move (Pos3 - 1) Top Spin
			});
		}

		document.getElementById('possMoves').style.display = "block";
		document.getElementById('possMoves').innerHTML = possMoves;

	}
	editorGame.undo(); //move is ok, now we can go ahead and check for promotion
	// is it a promotion?
	var source_rank = source.substring(2, 1);
	var target_rank = target.substring(2, 1);
	if (source != null) {
		var piece = editorGame.get(source).type;
		if (
			piece === "p" &&
			((source_rank === "7" && target_rank === "8") ||
				(source_rank === "2" && target_rank === "1"))
		) {
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
						move.promotion = promote_to
						editorGame.move(move)
					},
					closeOnEscape: false,
					dialogClass: "noTitleStuff",
				})
				.dialog("widget")
				.position({
					of: $("#boardEditorGame"),
					my: "middle middle",
					at: "middle middle",
				});
			//the actual move is made after the piece to promote to
			//has been selected, in the stop event of the promotion piece selectable
			return;
		} else {
			var move = editorGame.move({
				from: source,
				to: target,
				promotion: 'q' // NOTE: always promote to a queen for example simplicity
			})
		}

		// squareToHighlight = move.to
		editorTurnt = 1 - editorTurnt;
		// make random legal move for black
		// window.setTimeout(makeRandomMoveEditor, 250)

	}
}



function onMoveEnd() {
	boardJqry.find('.square-' + squareToHighlight)
		.addClass('highlight-black')
}

var onDialogClose = function () {
	move_cfg.promotion = promote_to;
	var move = editorGame.move(move_cfg);
	// illegal move
	if (move === null) return "snapback";
};
// Action/Moving Functions
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
			editorBoard.position(editorGame.fen(), false);
			// showSideToMove();
			promoting = false;
		});
	},
});



function changeSquareColorAfterMove(source, target) {
	boardJqry.find('.' + squareClass)
		.removeClass('highlight-from')
	boardJqry.find('.' + squareClass)
		.removeClass('highlight-to')
	boardJqry.find('.square-' + source).addClass('highlight-from')
	boardJqry.find('.square-' + target).addClass('highlight-to')
}



// Misc Functions
function makeRandomMoveEditor() {
	var possibleMoves = editorGame.moves()
	// editorGame over
	if (possibleMoves.length === 0) {
		return;
	}
	var randomIdx = Math.floor(Math.random() * possibleMoves.length)
	editorGame.move(possibleMoves[randomIdx]);
	myAudioEl.play();
	editorTurnt = 1 - editorTurnt;
	editorBoard.position(editorGame.fen());
}



window.bd = boardJqry
window.editorGame = editorGame