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
			},
			No: function () {
				$(this).dialog("close");
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

	if ((editorBoard.fen().match(/k/g) || []).length < 1 && (editorBoard.fen().match(/K/g) || []).length < 1) {
		alert("There must be atleast 2 Kings of both color in the board")
		return
	}
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
	let currentFen = editorBoard.fen();
	// let currentFen = "r1bnkn1r/ppp1Qppp/2p2p2/8/8/4R3/PPPPPPPP/RNB1KBN1 w Qkq - 0 1";

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

// clearEditorEl.addEventListener('click', (e) => {
// 	e.preventDefault();
// 	configEditor = {
// 		draggable: true,
// 		dropOffBoard: 'trash',
// 		position: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR',
// 		sparePieces: true
// 	}
// 	editorBoard = Chessboard('boardEditor', configEditor);
// })


var validMoves = []

function onSnapEndEditor(params) {
	if (promoting) return; //if promoting we need to select the piece first
	editorBoard.position(editorGame.fen())

	console.log("here", params)
}


function onDragStartEditor(source, piece, position, orientation) {
	// do not pick up pieces if the editorGame is over
	let cust = source;

	let a = cust.charCodeAt(0);
	let b = cust.charAt(1);
	if (piece.charAt(1) == 'K' && piece.charAt(0) == editorGame.turn()) {
		console.log('Here')
		validMoves = validMovesKing(a, b)
	}
	else {
		return;
	}


	let flag = 0

	if (editorGame.game_over()) {
		if (editorGame.in_draw()) {
			alert('Game Draw!!');
		}
		else if (editorGame.in_checkmate() || editorGame.in_check()) {
			console.log('Check Mate')
			for (let i = 0; i < validMoves.length - 1; i++) {
				if (editorGame.get(validMoves[i]) != null) {
					console.log(editorGame.get(validMoves[i]).color + " " + editorGame.turn())
					if (editorGame.get(validMoves[i]).color != editorGame.turn()) {
						flag++
						console.log(flag++)
					}
				}
			}
			if (flag > 0 && piece.charAt(0) == editorGame.turn()) {
				if (piece === 'bK' || piece == 'wK') {
					console.log("King")
					flag = 0;
					return
				} else {
					console.log('I am Here')
					flag = 0;
					return
				}
			}
			else {
				if (piece.charAt(1) == 'K' && piece.charAt(0) == editorGame.turn()) {
					console.log("Helloo")

					if (editorTurnt === 1) {
						flag = 0;
						alert('You won the game!!');
						return false
					} else {
						flag = 0;
						alert('You lost!!');
						return false
					}
				}
				else if (piece.charAt(1) != 'K') {
					return;
				}
				else {
					console.log("Helloo")
				}
			}

		}
		return false
	}


	else if (editorGame.in_check()) {
		console.log('Check')
		for (let i = 0; i < validMoves.length - 1; i++) {
			if (editorGame.get(validMoves[i]) != null) {
				console.log(editorGame.get(validMoves[i]).color + " " + editorGame.turn())
				if (editorGame.get(validMoves[i]).color != editorGame.turn()) {
					flag++
					console.log(flag++)
				}
			}
		}

		if (flag > 0 && piece.charAt(0) == editorGame.turn()) {
			if (piece === 'bK' || piece == 'wK') {
				flag = 0;
				return;
			} else {
				console.log('I am Here')
				flag = 0;
				return;
			}
		}
	}

	// only pick up pieces for White

	// if (piece.search(/^b/) !== -1) return false

}

function calc(source) {
	var flag = 0;
	let cust = source;

	let a = cust.charCodeAt(0);
	let b = cust.charAt(1);

	validMoves = validMovesKing(a, b)
	for (let i = 0; i < validMoves.length - 1; i++) {
		if (editorGame.get(validMoves[i]) != null) {
			console.log(editorGame.get(validMoves[i]).color + " " + editorGame.turn())
			if (editorGame.get(validMoves[i]).color != editorGame.turn()) {
				flag++
				console.log(flag++)
			}
		}
	}
	console.log(flag)
	return flag;

}


function moveBack(move) {
	let currentFen = editorGame.fen()
	console.log('Move Me to my old position')
	editorGame.load(currentFen)
	editorGame.put({
		type: move.piece,
		color: move.color
	}, move.from)
	editorGame.remove(move.to)
	if (!editorGame.fen().includes("k")) {
		editorGame.put({
			type: 'k',
			color: 'b'
		}, move.from)
	}
	if (!editorGame.fen().includes("K")) {

		editorGame.put({
			type: 'k',
			color: 'w'
		}, move.from)
	}
	editorBoard.position(editorGame.fen())

	let isCheck = null
	let eg = editorGame.fen()
	if (editorGame.turn() === 'w') {
		let myArray = eg.split(" ");
		myArray[1] = "b";
		isCheck = myArray.join(" ");
	}
	if (editorGame.turn() === 'b') {
		let myArray = eg.split(" ");
		myArray[1] = "w";
		isCheck = myArray.join(" ");
	}

	let tempG = new Chess()
	console.log("Is valid fen", tempG.load(isCheck))

	if (tempG.in_check()) {
		editorGame.load(currentFen)
		editorBoard.position(editorGame.fen())
		return {
			s: -1,
			m: "Cant Move back as it leads to Check"
		}
	}
	editorTurnt = 1 - editorTurnt;

	return {
		s: 1,
		m: "Moved Back"
	}

}


function validMovesKing(a, b) {
	let alpha = a;
	let num = parseInt(b);


	var movesKing = []
	movesKing[0] = String.fromCharCode((alpha)).concat(num - 1);
	movesKing[1] = String.fromCharCode((alpha - 1)).concat(num - 1);
	movesKing[2] = String.fromCharCode((alpha + 1)).concat(num - 1);
	movesKing[3] = String.fromCharCode((alpha)).concat(num + 1);
	movesKing[4] = String.fromCharCode((alpha - 1)).concat(num + 1);
	movesKing[5] = String.fromCharCode((alpha + 1)).concat(num + 1);
	movesKing[6] = String.fromCharCode((alpha - 1)).concat(num);
	movesKing[7] = String.fromCharCode((alpha + 1)).concat(num);
	return movesKing
}

function onDropEditor(source, target) {
	// see if the move is legal
	var move = editorGame.move({
		from: source,
		to: target,
		promotion: 'q' // NOTE: always promote to a queen for example simplicity
	})
	document.getElementById('trn').style.display = null;

	document.getElementById('trn').innerHTML = editorGame.turn();
	var custommove = editorGame.get(source);

	myAudioEl.play();
	// illegal move
	let currentFen = editorGame.fen()
	if (move === null) {
		console.log("Here")
		if (editorGame.in_checkmate() || editorGame.in_check() || custommove.type == 'k') {
			console.log('Check Mate')
			if (custommove != null) {
				console.log('Custom Move Nott Null')
				if (custommove.color == editorGame.turn() && validMoves.includes(target)) {
					var targetmove = editorGame.get(target);
					console.log("Custom Move")
					if (targetmove == null) {
						console.log("Target Move Null")
						return 'snapback'
					}
					else if (custommove.color != targetmove.color && custommove.type == 'k' && custommove.color == editorGame.turn()) {
						console.log('Return')
						editorGame.load(currentFen)
						editorGame.put({ type: custommove.type, color: custommove.color }, target)
						editorGame.remove(target)
						if (editorGame.in_check()) {
							let moveKing = calc(source);
							if (moveKing <= 1) {
								console.log("Check Mate")
								if (editorTurnt === 1) {
									alert('You won the game!!')
									editorGame.load(currentFen);
									return
								} else {
									alert('You lost!!')
									editorGame.load(currentFen);
									return
								}
							}
							console.log("Reload")
							editorGame.load(currentFen);
							return;
						}
						let isCheck = null
						let eg = editorGame.fen()
						if (editorGame.turn() === 'w') {
							let myArray = eg.split(" ");
							myArray[1] = "b";
							isCheck = myArray.join(" ");
						}
						if (editorGame.turn() === 'b') {
							let myArray = eg.split(" ");
							myArray[1] = "w";
							isCheck = myArray.join(" ");
						}
						console.log("Load Check")
						editorGame.load(isCheck)
						editorBoard.position(isCheck, false);
					}
				}
				else {
					console.log('Snap');
					return;
				}
			}
			else {
				console.log('Snap 1');
				return
			}
		}
		else {
			console.log('Snap 2');
			return
		}
		return;
	}


	if (move != null && 'captured' in move && move.piece != 'p') {
		if (!checkMoveBackLeadstoCheck(editorGame.fen(), move))
			$("#dialog-4").data('move', move).dialog("open");
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
		if (editorGame.turn() === "b") {
			removeHighlights()
			removeHighlights()
			boardJqry.find('.square-' + source).addClass('highlight-from')
			boardJqry.find('.square-' + target).addClass('highlight-to')
		} else {
			removeHighlights()
			removeHighlights()
			boardJqry.find('.square-' + source).addClass('highlight-from')
			boardJqry.find('.square-' + target).addClass('highlight-to')
			// squareToHighlight = move.to
		}
		editorTurnt = 1 - editorTurnt;
		// make random legal move for black
		// window.setTimeout(makeRandomMoveEditor, 250)
	}

}

function checkMoveBackLeadstoCheck(currFen, move) {
	let tG = new Chess()

	tG.load(currFen)
	tG.put({
		type: move.piece,
		color: move.color
	}, move.from)
	tG.remove(move.to)
	if (!tG.fen().includes("k")) {
		tG.put({
			type: 'k',
			color: 'b'
		}, move.from)
	}
	if (!tG.fen().includes("K")) {

		tG.put({
			type: 'k',
			color: 'w'
		}, move.from)
	}
	let isCheck = null
	let eg = tG.fen()
	if (tG.turn() === 'w') {
		let myArray = eg.split(" ");
		myArray[1] = "b";
		isCheck = myArray.join(" ");
	}
	if (tG.turn() === 'b') {
		let myArray = eg.split(" ");
		myArray[1] = "w";
		isCheck = myArray.join(" ");
	}

	console.log("Is valid fen", tG.load(isCheck))

	return tG.in_check()
}

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

var onDialogClose = function () {
	// console.log(promote_to);
	move_cfg.promotion = promote_to;
	makeMove(editorGame, move_cfg);
};

function getImgSrc(piece) {
	return piece_theme.replace(
		"{piece}",
		editorGame.turn() + piece.toLocaleUpperCase()
	);
}

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

function makeMove(editorGame, cfg) {
	// see if the move is legal
	var move = editorGame.move(cfg);
	// illegal move
	if (move === null) return "snapback";
}

function removeHighlights() {
	boardJqry.find('.' + squareClass)
		.removeClass('highlight-from')
	boardJqry.find('.' + squareClass)
		.removeClass('highlight-to')
}

function onMoveEnd() {
	boardJqry.find('.square-' + squareToHighlight)
		.addClass('highlight-black')
}

window.bd = boardJqry
