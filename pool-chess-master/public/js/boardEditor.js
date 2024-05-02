//V0.2

const boardEditorEl = document.getElementById('bd');
const startPlayEl = document.getElementById('startPlay');
const arrangeEl = document.getElementById('arrange');
const saveGameEl = document.getElementById('saveGame');
const savePGNEl = document.getElementById('savePGN');
const myAudioEl = document.getElementById('myAudio');
const clearEditorEl = document.getElementById('clearEditor');
const isForceTopAllowedEle = document.getElementById('isForceTopAllowed')
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
var orignalMove;
var isForceTopAllowedState = isForceTopAllowedEle.checked

isForceTopAllowedEle.addEventListener('click', () => {
	isForceTopAllowedState = isForceTopAllowedEle.checked
})

let currentSAN = null
function createDialogButtons(possMoves, defer, type) {
	let buttons = []
	let j = 0
	let k = 0
	if (type === 'top') {
		let button = {
			text: "0(" + possMoves[j] + ")",
			click: function () {
				$(this).dialog("close");
				defer.resolve(0);
			}
		}
		buttons.push(button)
		j = 1
	}
	for (let i = j; i < possMoves.length; i++) {
		if ('`' == possMoves[i][0]) {
			possMoves[i] = 'z' + possMoves[i][1]
		}
		let button = {
			text: "+" + (k + 1) + "(" + possMoves[i] + ")",
			click: function () {
				$(this).dialog("close");
				defer.resolve(i);
			}
		}
		k++
		buttons.push(button)
	}
	for (let i = possMoves.length; i < 8; i++) {
		let button = {
			text: "+" + (k + 1),
			click: function () {
				$(this).dialog("close");
				defer.resolve(i);
			}
		}
		k++
		buttons.push(button)
	}
	return buttons
}

function forceControl(possMoves, checkPos) {
	var defer = $.Deferred();
	let possMovesLength = possMoves.length
	let type = "force"
	let dialogButtons = createDialogButtons(possMoves, defer, type)
	$(function () {
		$("#dialog-force-control").dialog({
			autoOpen: true,
			closeOnEscape: false,
			resizable: true,
			modal: true,
			height: "auto",
			title: "Force Control",
			buttons: dialogButtons,
			open: function (event, ui) {
				for (let i = possMovesLength; i < 8; i++) {
					$(this).parent().find(`button:contains("+${i + 1}")`).prop('disabled', true).addClass('ui-state-disabled');
				}
				for (let i = 0; checkPos && i < checkPos.length; i++) {
					let j = possMoves.indexOf(checkPos[i])
					$(this).parent().find(`button:contains("+${j + 1}")`).prop('disabled', true).addClass('ui-state-disabled');
				}

				$(this).parent().find(`button:nth-child(${possMovesLength})`).focus();
				$(".ui-dialog-titlebar-close", $(this).parent()).hide();
			},
			close: function () {
				$(this).parent().find('button').prop('disabled', false).removeClass('ui-state-disabled')
			},
			position: { my: "top", at: "top", of: window }
		});
	});
	return defer.promise();
}

function topSpinControl(possMoves) {
	let possMovesLength = possMoves.length
	var defer = $.Deferred();
	let type = "top"
	let dialogButtons = createDialogButtons(possMoves, defer, type)
	$(function () {
		$("#dialog-top-spin").dialog({
			closeOnEscape: false,
			resizable: true,
			modal: true,
			width: 200,
			height: "auto",
			title: "TopSpin Control",
			buttons: dialogButtons,
			open: function (event, ui) {
				for (let i = possMovesLength - 1; i < 8; i++) {
					$(this).parent().find(`button:contains("+${i + 1}")`).prop('disabled', true).addClass('ui-state-disabled');
				}
				$(this).parent().find(`button:nth-child(${possMovesLength + 1})`).focus();
				$(".ui-dialog-titlebar-close", $(this).parent()).hide();
			},
			close: function () {
				$(this).parent().find('button').prop('disabled', false).removeClass('ui-state-disabled')
			},
			position: { my: "top", at: "top", of: window }
		});
	});
	return defer.promise();
}


$(function () {
	$("#dialog-w").dialog({
		autoOpen: false,
		modal: true,
		buttons: {
			Finish: function () {
				$(this).dialog("close");
			}
		},
	});
	// css("font-size", "30px");
	$("#opener-4").click(function () {
		$("#dialog-4").dialog("open");
	});
});
$(function () {
	$("#dialog-b").dialog({
		autoOpen: false,
		modal: true,
		buttons: {
			Finish: function () {
				// console.log("Game Over")
				$(this).dialog("close");
			}
		},
	});
	// css("font-size", "30px");
	$("#opener-4").click(function () {
		$("#dialog-4").dialog("open");
	});
});


$(function () {
	let moves = []
	$("#dialog-5").dialog({
		autoOpen: false,
		modal: true,
		closeOnEscape: false,
		buttons: {
			Horz: function () {
				let move = [],
					Moves = [],
					possMoves = []
				move = $(this).data('moveData')
				if (!isPossibleMove(move[0], move[1], move[2], move[3], move[4], move[5])) {
					console.log("Not Possible")
					$(this).dialog("close");
					return "snapback"
				}
				Moves = pushPieceKnight(move[5], move[0], move[1], "h")
				for (let i = 0; i < Moves.length; i++) {
					possMoves.push(Moves[i].to)
				}
				if (possMoves.length == 0) {
					$(this).dialog("close");
					editorGame.load(move[4])
					editorBoard.position(move[4])
					return "Snapback"
				}
				let pushPosition = ""
				if (isForceTopAllowedState) {
					let checkPos = isCheckAfterForceMove(possMoves, editorGame.fen(), move[0], move[1], move[2], move[3], move[7])
					console.log(checkPos)
					forceControl(possMoves, checkPos).then(pushPos => {
						pushPosition = possMoves[pushPos]
						if (editorGame.get(pushPosition) === null && possMoves.includes(pushPosition)) {
							makeKnightPoolMove(move[3], pushPosition, move[7])
							changeSquareColorAfterMove(move[0], move[1])
							console.log('Move')
						}
						else {
							console.log('Knight Undo Move')
							editorGame.undo()
						}
						console.log("KNIGHT: " + editorGame.fen())
						if (move[7])
							currentSAN = "<" + currentSAN + "." + pushPosition + "." + move[1]
						else {
							currentSAN = "?" + move[0] + "." + move[1] + "." + move[1] + "." + pushPosition

						}
						// sourceFrom, sourceTo, targetFrom, targetTo
						console.log("FSAN " + currentSAN)
						addMove(editorGame.fen())
						// addMove(editorGame.fen())
						$(this).dialog("close");
					})
				}
				else {
					makeKnightPoolMove(move[3], possMoves[possMoves.length - 1], move[7])
					currentSAN = "?" + move[0] + "." + move[1] + "." + move[1] + "." + possMoves[possMoves.length - 1]
					addMove(editorGame.fen())
					changeSquareColorAfterMove(move[0], move[1])
					console.log("KNIGHT: " + editorGame.fen())
					$(this).dialog("close");
				}
			},
			Vert: function () {
				let move = [],
					Moves = [],
					possMoves = []
				move = $(this).data('moveData')
				if (!isPossibleMove(move[0], move[1], move[2], move[3], move[4], move[5])) {
					console.log("Not Possible")
					$(this).dialog("close");
					return "snapback"
				}
				Moves = pushPieceKnight(move[5], move[0], move[1], "v")
				for (let i = 0; i < Moves.length; i++) {
					possMoves.push(Moves[i].to)
				}
				// console.log("Possible Moves " + possMoves.length)
				if (possMoves.length == 0) {
					$(this).dialog("close");
					editorGame.load(move[4])
					editorBoard.position(move[4])
					return "Snapback"
				}
				let pushPosition = ""
				if (isForceTopAllowedState) {
					let checkPos = isCheckAfterForceMove(possMoves, editorGame.fen(), move[0], move[1], move[2], move[3], move[7])
					console.log(checkPos)
					forceControl(possMoves, checkPos).then(pushPos => {
						pushPosition = possMoves[pushPos]
						if (editorGame.get(pushPosition) === null && possMoves.includes(pushPosition)) {
							makeKnightPoolMove(move[3], pushPosition, move[7])
							changeSquareColorAfterMove(move[0], move[1])
						}
						else {
							editorGame.undo()
						}
						console.log("KNIGHT: " + editorGame.fen())
						if (move[7])
							currentSAN = "<" + currentSAN + "." + pushPosition + "." + move[1]
						else {
							currentSAN = "?" + move[0] + "." + move[1] + "." + move[1] + "." + pushPosition

						}
						// sourceFrom, sourceTo, targetFrom, targetTo
						console.log("FSAN " + currentSAN)
						addMove(editorGame.fen())
						$(this).dialog("close");
					})
				}
				else {
					makeKnightPoolMove(move[3], possMoves[possMoves.length - 1], move[7])
					currentSAN = "?" + move[0] + "." + move[1] + "." + move[1] + "." + possMoves[possMoves.length - 1]
					addMove(editorGame.fen())
					changeSquareColorAfterMove(move[0], move[1])
					console.log("KNIGHT: " + editorGame.fen())
					$(this).dialog("close");
				}
			},
		},
		open: function (event, ui) {
			$(".ui-dialog-titlebar-close", $(this).parent()).hide();
		},
		close: function () {
			if (isForceTopAllowedState)
				$(this).parent().find('button').prop('disabled', false).removeClass('ui-state-disabled')
		}
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
	// console.log(editorBoard.fen())
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
	// let currentFen = editorBoard.fen();
	let currentFen =
		'rnb1qbnr/pp1pkpp1/2N4p/8/2P5/Q7/PP1PPPPP/RNB1KB1R b KQ - 0 4'
	configEditor = {
		draggable: true,
		dropOffBoard: 'trash',
		position: currentFen,
		sparePieces: true
	}
	editorBoard = Chessboard('boardEditor', configEditor);
	$('#clearEditor').on('click', editorBoard.clear)
})

saveGameEl.addEventListener('click', saveGameListener)
savePGNEl.addEventListener('click', savePGNListener)

document.getElementById('check').style.display = "none"

boardEditorEl.addEventListener('click', (e) => {
	e.preventDefault();
	document.getElementById('gameMode').style.display = "none";
	document.querySelector('#boardEditorGame').style.display = null;
	saveGameEl.style.display = null;
	savePGNEl.style.display = null;
	moveTable.style.display = null;
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
}

function makeKnightPoolMove(targetPiece, pos3, isValidMove) {
	if (targetPiece.type == 'k') {
		targetPiece.type = 'K'
	}
	editorGame.put({
		type: targetPiece.type,
		color: targetPiece.color
	}, pos3)
	// if ()
	// currentSAN = "<" + currentSAN + "." + pos3 + "." + orignalMove['to']

	console.log(isValidMove)
	let tokens = editorGame.fen().split(" ");

	if (!isValidMove) {
		tokens[1] = editorGame.turn() === "b" ? "w" : "b";
		tokens[3] = "-";
	}
	let Fen = tokens.join(" ");
	editorGame.load(Fen)
	editorBoard.position(Fen)
	changeForceControlSquareColorAfterMove(pos3)

	document.getElementById('horz').style.display = "none"
	document.getElementById('vert').style.display = "none"
}


function makePoolMove(targetPiece, pos3, isValidMove) {
	if (targetPiece.type == 'k') {
		targetPiece.type = 'K'
	}
	editorGame.put({
		type: targetPiece.type,
		color: targetPiece.color
	}, pos3)
	changeForceControlSquareColorAfterMove(pos3)
	let tokens = editorGame.fen().split(" ");

	if (!isValidMove) {
		tokens[1] = editorGame.turn() === "b" ? "w" : "b";
		tokens[3] = "-";
	}
	let Fen = tokens.join(" ");
	editorGame.load(Fen)
	editorBoard.position(Fen, false)
	// addMove(Fen)
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
		if (Moves != null) {
			let possMoves = []
			for (let i = 0; i < Moves.length; i++) {
				possMoves.push(Moves[i].to)
			}
			if (possMoves.length == 0) {
				return 0
			}
		} else if (Moves == null) {
			return 0
		}
	}
	return 1
}

function pushPieceKnight(loadGame, source, target, dir) {

	let alphas = source[0].charCodeAt(0)
	let betas = Number(source[1])

	let alphat = target[0].charCodeAt(0)
	let betat = Number(target[1])

	let allKnightMoves = []

	let horz = []
	let vert = []

	let stop = false

	if (alphas < alphat) {
		// console.log("RIGHT")
		for (let i = target[0].charCodeAt(0) + 1; i <= 105; i++) {
			let to = String.fromCharCode(i) + target[1]
			// console.log("RIGHT " + to)
			if (!loadGame.get(to)) {
				horz.push(build_move_check(loadGame, source, to))
				allKnightMoves.push(build_move_check(loadGame, source, to))
			} else {
				break
			}
		}
		if (betas < betat) { //UPPER RIGHT
			stop = false
			for (let i = betat + 1; i <= 9; i++) {
				let to = target[0] + i
				// console.log("UPPER RIGHT " + to)
				if (!loadGame.get(to)) {
					vert.push(build_move_check(loadGame, source, to))
					allKnightMoves.push(build_move_check(loadGame, source, to))
				} else {
					break
				}
			}
			stop = false
			//return allKnightMoves
		} else if (betas > betat) { //LOWER RIGHT
			stop = false
			for (let i = betat - 1; i >= 0; i--) {
				let to = target[0] + i
				// console.log("LOWER RIGHT " + to)
				if (!loadGame.get(to)) {
					vert.push(build_move_check(loadGame, source, to))
					allKnightMoves.push(build_move_check(loadGame, source, to))
				} else {
					break
				}
			}
			stop = false
			//return allKnightMoves
		}
		if (dir == "h") {
			// console.log(horz)
			return horz
		} else if (dir == "v") {
			// console.log(vert)
			return vert
		} else {
			allKnightMoves.push("i9")
			// console.log(allKnightMoves)
			return allKnightMoves
		}
	} else {
		// console.log("LEFT")
		for (let i = target[0].charCodeAt(0) - 1; i >= 96; i--) {
			let to = String.fromCharCode(i) + target[1]
			// console.log("LEFT " + to)
			if (!loadGame.get(to)) {
				horz.push(build_move_check(loadGame, source, to))
				allKnightMoves.push(build_move_check(loadGame, source, to))
			} else {
				break
			}
		}
		if (betas < betat) { //UPPER LEFT
			stop = false
			for (let i = betat + 1; i <= 9; i++) {
				let to = target[0] + i
				// console.log("UPPER LEFT " + to)
				if (!loadGame.get(to)) {
					vert.push(build_move_check(loadGame, source, to))
					allKnightMoves.push(build_move_check(loadGame, source, to))
				} else {
					break
				}
			}
			stop = false
			//return allKnightMoves
		} else if (betas > betat) { //LOWER LEFT
			stop = false
			for (let i = betat - 1; i >= 0; i--) {
				let to = target[0] + i
				// console.log(to)
				// console.log("LOWER LEFT " + to)
				// console.log(loadGame.get(to))
				if (!loadGame.get(to)) {
					vert.push(build_move_check(loadGame, source, to))
					allKnightMoves.push(build_move_check(loadGame, source, to))
				} else {
					break
				}
				stop = true
			}
			stop = false
			//return allKnightMoves
		}
		if (dir == "h") {
			// console.log(horz)
			return horz
		} else if (dir == "v") {
			// console.log(vert)
			return vert
		} else {
			allKnightMoves.push("i9")
			// console.log(allKnightMoves)
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
				if (!loadGame.get(to)) allRookMoves.push(build_move_check(loadGame, source, to))
				else {
					break
				}
			}
			return allRookMoves
		} else if (betas > betat) {
			stop = false
			for (let i = betat - 1; i >= 0; i--) {
				let to = source[0] + i
				if (!loadGame.get(to)) allRookMoves.push(build_move_check(loadGame, source, to))
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
				if (!loadGame.get(to)) allRookMoves.push(build_move_check(loadGame, source, to))
				else {
					break
				}
			}
			return allRookMoves
		} else if (alphas > alphat) {
			stop = false
			for (let i = target[0].charCodeAt(0) - 1; i >= 96; i--) {
				let to = String.fromCharCode(i) + source[1]
				if (!loadGame.get(to)) allRookMoves.push(build_move_check(loadGame, source, to))
				else {
					break
				}
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
	// console.log(source)
	// console.log(alphas + " " + betas + " ")

	if (alphas < alphat) {
		if (betas < betat) { //UPPER RIGHT
			stop = false
			for (let i = alphat + 1, j = betat + 1; i <= 105 && j <= 9; i++, j++) {
				let to = String.fromCharCode(i) + j
				if (!loadGame.get(to)) allBishopMoves.push(build_move_check(loadGame, source, to))
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
				if (!loadGame.get(to)) allBishopMoves.push(build_move_check(loadGame, source, to))
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
				if (!loadGame.get(to)) allBishopMoves.push(build_move_check(loadGame, source, to))
				else {
					break
				}
			}
			return allBishopMoves
		} else if (betas > betat) { //LOWER LEFT
			stop = false
			for (let i = alphat - 1, j = betat - 1; i >= 96 && j >= 0; i--, j--) {
				let to = String.fromCharCode(i) + j
				if (!loadGame.get(to)) allBishopMoves.push(build_move_check(loadGame, source, to))
				else {
					break
				}
			}
			return allBishopMoves
		}
	}

}

function build_move_check(loadGame, from, to) {

	var move = {
		color: loadGame.get(from).color,
		from: from,
		to: to,
		flags: 'n',
		piece: loadGame.get(from).type,
	};
	if (loadGame.get(to)) {
		if (loadGame.get(to).color === loadGame.get(from).color) throw "Capturing Same Color"
		move.captured = loadGame.get(to).type;
		move.flags = 'c'
		let sourcePieceType = loadGame.get(from).type
		if (sourcePieceType == "b") {
			let moves = pushPieceBishop(loadGame, from, to)
			move.endTarget = [moves[moves.length - 1]]
		}
		if (sourcePieceType == 'q') {
			let moves = pushPieceQueen(loadGame, from, to)
			move.endTarget = [moves[moves.length - 1]]
		}
		if (sourcePieceType == 'n') {
			let horz = pushPieceKnight(loadGame, from, to, "h")
			let vert = pushPieceKnight(loadGame, from, to, "v")

			let et = []
			if (horz.length >= 1)
				et.push(horz[horz.length - 1])
			if (vert.length >= 1)
				et.push(vert[vert.length - 1])

			move.endTarget = et
		}
		if (sourcePieceType == 'r') {
			let moves = pushPieceRook(loadGame, from, to)
			move.endTarget = [moves[moves.length - 1]]
		}
		if (sourcePieceType == 'p') {
			let moves = pushPieceBishop(loadGame, from, to)
			move.endTarget = [moves[moves.length - 1]]
		}
		if (sourcePieceType == 'k') {
			let moves = pushPieceQueen(loadGame, from, to)
			move.endTarget = [moves[moves.length - 1]]
		}
	}
	return move;
}

function getAllKnightMoves(loadGame, square) {
	let allKnightMoves = []
	// Upper Squares
	// write a function to check if the given square is within board
	function isSquareWithinBoard(square) {
		if (square[0].charCodeAt(0) >= 97 && square[0].charCodeAt(0) <= 104 && square[1] >= 1 && square[1] <= 8)
			return true
		return false
	}

	let possibleKnightMoves = [
		// Upper Moves
		// Upper Right Moves
		String.fromCharCode(square[0].charCodeAt(0) + 1) + (Number(square[1]) + 2).toString(),
		String.fromCharCode(square[0].charCodeAt(0) + 2) + (Number(square[1]) + 1).toString(),
		String.fromCharCode(square[0].charCodeAt(0) - 1) + (Number(square[1]) + 2).toString(),
		String.fromCharCode(square[0].charCodeAt(0) - 2) + (Number(square[1]) + 1).toString(),

		String.fromCharCode(square[0].charCodeAt(0) + 1) + (Number(square[1]) - 2).toString(),
		String.fromCharCode(square[0].charCodeAt(0) + 2) + (Number(square[1]) - 1).toString(),
		String.fromCharCode(square[0].charCodeAt(0) - 1) + (Number(square[1]) - 2).toString(),
		String.fromCharCode(square[0].charCodeAt(0) - 2) + (Number(square[1]) - 1).toString(),
	]
	possibleKnightMoves.forEach(posSquare => {
		if (isSquareWithinBoard(posSquare))
			if (!loadGame.get(posSquare))
				allKnightMoves.push(build_move_check(loadGame, square, posSquare))
			else
				if (!(loadGame.get(square).color === loadGame.get(posSquare).color))
					allKnightMoves.push(build_move_check(loadGame, square, posSquare))

	})
	return allKnightMoves
}

function getAllRookMoves(loadGame, square) {
	let allRookMoves = []
	// Upper Squares
	let stop = false
	for (let i = Number(square[1]) + 1; i <= 8; i++) {
		let to = square[0] + i
		if (!loadGame.get(to)) allRookMoves.push(build_move_check(loadGame, square, to))
		else {
			if (!(loadGame.get(square).color === loadGame.get(to).color))
				allRookMoves.push(build_move_check(loadGame, square, to))
			break
		}
	}
	// Lower Squares
	stop = false

	for (let i = Number(square[1]) - 1; i >= 1; i--) {
		let to = square[0] + i
		if (!loadGame.get(to)) allRookMoves.push(build_move_check(loadGame, square, to))
		else {
			if (!(loadGame.get(square).color === loadGame.get(to).color))
				allRookMoves.push(build_move_check(loadGame, square, to))
			break
		}
	}
	// [97, 98, 99, 100, 101, 102, 103, 104]
	// Right Squares
	stop = false

	for (let i = square[0].charCodeAt(0) + 1; i <= 104; i++) {
		let to = String.fromCharCode(i) + square[1]
		if (!loadGame.get(to)) allRookMoves.push(build_move_check(loadGame, square, to))
		else {
			if (!(loadGame.get(square).color === loadGame.get(to).color))
				allRookMoves.push(build_move_check(loadGame, square, to))
			break
		}
	}
	// Left Squares
	stop = false
	for (let i = square[0].charCodeAt(0) - 1; i >= 97; i--) {
		let to = String.fromCharCode(i) + square[1]
		if (!loadGame.get(to)) allRookMoves.push(build_move_check(loadGame, square, to))
		else {
			if (!(loadGame.get(square).color === loadGame.get(to).color))
				allRookMoves.push(build_move_check(loadGame, square, to))
			break
		}
	}
	return allRookMoves
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
		if (!loadGame.get(to)) allBishopMoves.push(build_move_check(loadGame, square, to))
		else {
			if (!(loadGame.get(square).color === loadGame.get(to).color))
				allBishopMoves.push(build_move_check(loadGame, square, to))
			break
		}
	}
	//upper left
	stop = false
	for (let i = sc - 1, j = sn + 1; i >= 97 && j <= 8; i--, j++) {
		let to = String.fromCharCode(i) + j
		if (!loadGame.get(to)) allBishopMoves.push(build_move_check(loadGame, square, to))
		else {
			if (!(loadGame.get(square).color === loadGame.get(to).color))
				allBishopMoves.push(build_move_check(loadGame, square, to))
			break
		}
	}
	// bottom right
	stop = false
	for (let i = sc + 1, j = sn - 1; i <= 104 && j >= 1; i++, j--) {
		let to = String.fromCharCode(i) + j
		if (!loadGame.get(to)) allBishopMoves.push(build_move_check(loadGame, square, to))
		else {
			if (!(loadGame.get(square).color === loadGame.get(to).color))
				allBishopMoves.push(build_move_check(loadGame, square, to))
			break
		}
	}
	// bottom left
	stop = false
	for (let i = sc - 1, j = sn - 1; i >= 97 && j >= 1; i--, j--) {
		let to = String.fromCharCode(i) + j
		if (!loadGame.get(to)) allBishopMoves.push(build_move_check(loadGame, square, to))
		else {
			if (!(loadGame.get(square).color === loadGame.get(to).color))
				allBishopMoves.push(build_move_check(loadGame, square, to))
			break
		}
	}

	return allBishopMoves
}


function getAllQueenMoves(loadGame, square) {
	return getAllBishopMoves(loadGame, square).concat(getAllRookMoves(loadGame, square))
}

function getAllKingMoves(loadGame, square) {
	let allKingMoves = []
	let possibleKingMoves = []
	let color = loadGame.get(square).color
	// Upper Squares
	// write a function to check if the given square is within board
	function isSquareWithinBoard(square) {
		if (square[0].charCodeAt(0) >= 97 && square[0].charCodeAt(0) <= 104 && square[1] >= 1 && square[1] <= 8)
			return true
		return false
	}

	function isDiffColor(loadGame, dest) {
		if (loadGame.get(dest) && color !== loadGame.get(dest).color)
			return true
		return false
	}

	possibleKingMoves = [

		String.fromCharCode(square[0].charCodeAt(0) + 1) + (Number(square[1]) - 1).toString(),
		square[0] + (Number(square[1]) - 1).toString(),
		String.fromCharCode(square[0].charCodeAt(0) - 1) + (Number(square[1]) - 1).toString(),

		String.fromCharCode(square[0].charCodeAt(0) + 1) + (Number(square[1]) + 1).toString(),
		square[0] + (Number(square[1]) + 1).toString(),
		String.fromCharCode(square[0].charCodeAt(0) - 1) + (Number(square[1]) + 1).toString(),

		String.fromCharCode(square[0].charCodeAt(0) - 1) + (Number(square[1])).toString(),
		String.fromCharCode(square[0].charCodeAt(0) + 1) + (Number(square[1])).toString(),
	]

	possibleKingMoves.forEach(mv => {
		if (isSquareWithinBoard(mv))
			if (!loadGame.get(mv)) allKingMoves.push(mv)
			else if (isDiffColor(loadGame, mv)) allKingMoves.push(mv)
	})

	return allKingMoves.map(mv => {
		return build_move_check(loadGame, square, mv)
	})
}


function getAllPawnMoves(loadGame, square) {
	let allPawnMoves = []
	let piece = loadGame.get(square)
	let color = piece.color
	let dLeft, dRight, front1, front2 = null;
	// Upper Squares
	// write a function to check if the given square is within board
	function isSquareWithinBoard(square) {
		if (square[0].charCodeAt(0) >= 97 && square[0].charCodeAt(0) <= 104 && square[1] >= 1 && square[1] <= 8)
			return true
		return false
	}

	function isDiffColor(loadGame, dest) {
		if (loadGame.get(dest) && color !== loadGame.get(dest).color)
			return true
		return false
	}

	function checkDiagonalMove(dMove) {
		if (isSquareWithinBoard(dMove))
			if (loadGame.get(dMove) && isDiffColor(loadGame, dMove))
				return true
		return false
	}

	if (color === 'w') {
		front1 = square[0] + (Number(square[1]) + 1).toString()
		if (square[1] === "2")
			front2 = square[0] + (Number(square[1]) + 2).toString()
		dLeft = String.fromCharCode(square[0].charCodeAt(0) - 1) + (Number(square[1]) + 1).toString()
		dRight = String.fromCharCode(square[0].charCodeAt(0) + 1) + (Number(square[1]) + 1).toString()
	}

	if (color === 'b') {
		front1 = square[0] + (Number(square[1]) - 1).toString()
		if (square[1] === "7") {
			front2 = square[0] + (Number(square[1]) - 2).toString()
		}
		dLeft = String.fromCharCode(square[0].charCodeAt(0) + 1) + (Number(square[1]) - 1).toString()
		dRight = String.fromCharCode(square[0].charCodeAt(0) - 1) + (Number(square[1]) - 1).toString()
	}

	if (isSquareWithinBoard(front1) && !loadGame.get(front1)) {
		allPawnMoves.push(front1)
		if (front2 && isSquareWithinBoard(front2) && !loadGame.get(front2))
			allPawnMoves.push(front2)
	}

	if (checkDiagonalMove(dLeft))
		allPawnMoves.push(dLeft)
	if (checkDiagonalMove(dRight))
		allPawnMoves.push(dRight)

	return allPawnMoves.map(mv => {
		return build_move_check(loadGame, square, mv)
	})
}

function isCheckMate(currentFen) {
	let game = new Chess()
	let arr = []
	game.load(currentFen)
	console.log(currentFen)
	for (let sq of game.SQUARES) {
		let p = game.get(sq)
		if (!p || p.color !== game.turn()) continue // replace with whichever turn
		if (p.type == 'q') {
			arr = getAllQueenMoves(game, sq)
		}
		if (p.type == 'k') {
			arr = getAllKingMoves(game, sq)
		}
		if (p.type == 'p') {
			arr = getAllPawnMoves(game, sq)
		}
		if (p.type == 'r') {
			arr = getAllRookMoves(game, sq)
		}
		if (p.type == 'n') {
			arr = getAllKnightMoves(game, sq)
		}
		if (p.type == "b") {
			arr = getAllBishopMoves(game, sq)
		}
		for (let mv of arr) {
			let tosq = mv.to
			let c = new Chess()
			c.load(currentFen)
			if (mv.flags !== 'c') {
				c.remove(sq)
				if (p.type == 'k') {
					p.type = 'K'
				}
				c.put({
					type: p.type,
					color: p.color
				}, tosq)
				if (isFenSafe(c.fen())) {
					console.log('Fen Is Safe')
					return false
				}
			}
			else if (mv.flags === 'c') {
				let endTarget, moves
				let sourcePiece = c.get(sq)
				let targetPiece = c.get(tosq)
				if (sourcePiece == "b") {
					moves = pushPieceBishop(c, sq, tosq)
					if (moves) {
						endTarget = [moves[moves.length - 1]]
					}
				}
				if (sourcePiece.type == 'q') {
					moves = pushPieceQueen(c, sq, tosq)
					if (moves) {
						endTarget = [moves[moves.length - 1]]
					}
				}
				if (sourcePiece.type == 'r') {
					moves = pushPieceRook(c, sq, tosq)
					if (moves) {
						endTarget = [moves[moves.length - 1]]
					}
				}
				if (sourcePiece.type == 'p') {
					moves = pushPieceBishop(c, sq, tosq)
					if (moves) {
						endTarget = [moves[moves.length - 1]]
					}
				}
				if (sourcePiece.type == 'k') {
					console.log(sq, tosq)
					moves = pushPieceQueen(c, sq, tosq)
					if (moves) {
						endTarget = [moves[moves.length - 1]]
					}
				}
				if (sourcePiece.type == 'n') {
					let horz = pushPieceKnight(c, sq, tosq, "h")
					let vert = pushPieceKnight(c, sq, tosq, "v")
					if (horz.length >= 1) {
						for (let move of horz) {
							c.put({
								type: targetPiece.type,
								color: targetPiece.color
							}, move.to)
							if (sourcePiece.type == 'k') {
								sourcePiece.type = 'K'
							}
							c.put({
								type: sourcePiece.type,
								color: sourcePiece.color
							}, tosq)
							if (isFenSafe(c.fen())) {
								console.log('Fen Is Safe')
								return false;
							}
						}
					}
					if (vert.length >= 1) {
						for (let move of vert) {
							c.put({
								type: targetPiece.type,
								color: targetPiece.color
							}, move.to)
							if (sourcePiece.type == 'k') {
								sourcePiece.type = 'K'
							}
							c.put({
								type: sourcePiece.type,
								color: sourcePiece.color
							}, tosq)
							// vertCheck = isFenSafe(c.fen())
							if (isFenSafe(c.fen())) {
								console.log('Fen Is Safe')
								return false;
							}
						}
					}
				}
				c.remove(sq)
				console.log(endTarget)
				if (endTarget && moves.length > 0) {
					for (let move of endTarget) {
						console.log(move)
						c.put({
							type: targetPiece.type,
							color: targetPiece.color
						}, move.to)
						if (sourcePiece.type == 'k') {
							sourcePiece.type = 'K'
						}
						c.put({
							type: sourcePiece.type,
							color: sourcePiece.color
						}, tosq)
						console.log(c.fen())
						if (isFenSafe(c.fen())) {
							console.log('Fen Is Safe')
							return false
						}
					}
				}
			}
		}
	}
	return true
}

function isCheck(fen) {
	function isAnyEndTargetEdge(endArray) {
		for (let et of endArray) {
			if (!et) continue
			if (et.to.includes("9") || et.to.includes("`") || et.to.includes("i") || et.to.includes("0"))
				return true
		}
		return false
	}

	let game = new Chess()
	game.load(fen)
	let arr = []
	for (let sq of game.SQUARES) {
		let p = game.get(sq)
		if (!p || p.color === game.turn()) continue // replace with whichever turn
		if (p.type == 'q') {
			arr = getAllQueenMoves(game, sq)
		}
		if (p.type == 'k') {
			arr = getAllKingMoves(game, sq)
		}
		if (p.type == 'p') {
			arr = getAllPawnMoves(game, sq)
		}
		if (p.type == 'r') {
			arr = getAllRookMoves(game, sq)
		}
		if (p.type == 'n') {
			arr = getAllKnightMoves(game, sq)
		}
		if (p.type == "b") {
			arr = getAllBishopMoves(game, sq)
		}
		for (let mv of arr) {
			if (mv.flags === 'c' && mv.captured === 'k') {
				if (mv.endTarget.length >= 1 && isAnyEndTargetEdge(mv.endTarget)) return true
			}
		}
	}
	return false
}


function isCheckAfterForceMove(possMoves, fen, source, target, sourcePiece, targetPiece, isValid) {
	console.log(fen)
	let checkPos = []
	for (let move of possMoves) {
		let game = new Chess()
		game.load(fen)
		game.put({
			type: targetPiece.type,
			color: targetPiece.color
		}, move)
		if (sourcePiece.type == 'k') {
			sourcePiece.type = 'K'
		}
		game.put({
			type: sourcePiece.type,
			color: sourcePiece.color
		}, target)
		game.remove(source)
		let Fen = game.fen()
		if (isValid) {
			let FenA = Fen.split(" ")
			if (FenA[1] == "b") {
				FenA[1] = "w"
			} else {
				FenA[1] = "b"
			}
			Fen = FenA.join(" ");
		}
		console.log(Fen)
		if (!isFenSafe(Fen)) {
			checkPos.push(move)
		}
	}
	return checkPos
}


function isFenSafe(fen) {
	function isAnyEndTargetEdge(endArray) {
		for (let et of endArray) {
			if (!et) continue
			if (et.to.includes("9") || et.to.includes("`") || et.to.includes("i") || et.to.includes("0"))
				return true
		}
		return false
	}

	let game = new Chess()
	game.load(fen)
	let arr = []
	for (let sq of game.SQUARES) {
		let p = game.get(sq)
		if (!p || p.color === game.turn()) {
			continue
		}
		if (p.type == 'q') {
			arr = getAllQueenMoves(game, sq)
		}
		if (p.type == 'k') {
			arr = getAllKingMoves(game, sq)
		}
		if (p.type == 'p') {
			arr = getAllPawnMoves(game, sq)
		}
		if (p.type == 'r') {
			arr = getAllRookMoves(game, sq)
		}
		if (p.type == 'n') {
			arr = getAllKnightMoves(game, sq)
		}
		if (p.type == "b") {
			arr = getAllBishopMoves(game, sq)
		}
		for (let mv of arr) {
			if (mv.flags === 'c' && mv.captured === 'k') {
				if (mv.endTarget.length >= 1 && isAnyEndTargetEdge(mv.endTarget)) {
					return false
				}
			}
		}
	}
	return true
}



function isCheckForTurnAftermoveOfKnight(fen, source, target) {
	let isCheckGame = new Chess()
	isCheckGame.load(fen)
	let sourcePiece = isCheckGame.get(source)
	let targetPiece = isCheckGame.get(target)
	if (targetPiece != null) {
		if (sourcePiece.type == 'n') {
			let horz = pushPieceKnight(isCheckGame, source, target, "h")
			let vert = pushPieceKnight(isCheckGame, source, target, "v")
			let horzCheck = false,
				vertCheck = false
			let et = []
			if (horz.length >= 1) {
				let c = new Chess()
				c.load(isCheckGame.fen())
				let horzEndTarget = horz[horz.length - 1]
				console.log(horz)
				if (targetPiece.type == 'k') {
					targetPiece.type = 'K'
				}
				c.put({
					type: targetPiece.type,
					color: targetPiece.color
				}, horzEndTarget.to)
				c.remove(target)
				c.put({
					type: sourcePiece.type,
					color: sourcePiece.color
				})
				console.log(c.fen())
				horzCheck = isFenSafe(c.fen())
			} else {
				horzCheck = true
			}
			if (vert.length >= 1) {
				let c = new Chess()
				c.load(isCheckGame.fen())
				let vertEndTarget = vert[vert.length - 1]
				c.put({
					type: targetPiece.type,
					color: targetPiece.color
				}, vertEndTarget.to)
				c.remove(target)
				c.put({
					type: sourcePiece.type,
					color: sourcePiece.color
				})
				vertCheck = isFenSafe(c.fen())
				console.log(c.fen())
			} else {
				vertCheck = true
			}
			console.log("Is King Safe ", horzCheck, vertCheck)
			if (horzCheck == true && vertCheck == true) {
				return 't'
			}
			else if (horzCheck == true && vertCheck == false) {
				return 'h'
			}
			else if (horzCheck == false && vertCheck == true) {
				return 'v'
			}
			else {
				return 'f'
			}
		}
	}
}

function isCheckForTurnAftermove(fen, source, target) {
	let isCheckGame = new Chess()
	isCheckGame.load(fen)
	let sourcePiece = isCheckGame.get(source)
	let targetPiece = isCheckGame.get(target)
	let endTarget
	let moves
	if (targetPiece != null) {
		if (sourcePiece.type == "b") {
			moves = pushPieceBishop(isCheckGame, source, target)
			if (moves) {
				endTarget = [moves[moves.length - 1]]
			}
		}
		if (sourcePiece.type == 'q') {
			moves = pushPieceQueen(isCheckGame, source, target)
			if (moves) {
				endTarget = [moves[moves.length - 1]]
			}
		}
		if (sourcePiece.type == 'r') {
			moves = pushPieceRook(isCheckGame, source, target)
			if (moves) {
				endTarget = [moves[moves.length - 1]]
			}
		}
		if (sourcePiece.type == 'p') {
			moves = pushPieceBishop(isCheckGame, source, target)
			if (moves) {
				endTarget = [moves[moves.length - 1]]
			}
		}
		if (sourcePiece.type == 'k') {
			moves = pushPieceQueen(isCheckGame, source, target)
			if (moves) {
				endTarget = [moves[moves.length - 1]]
			}
		}
		if (endTarget && moves.length > 0) {
			if (targetPiece.type == 'k') {
				targetPiece.type = 'K'
			}
			isCheckGame.put({
				type: targetPiece.type,
				color: targetPiece.color
			}, endTarget[0].to)
		}
	}
	isCheckGame.remove(source)
	if (sourcePiece.type == 'k') {
		sourcePiece.type = 'K'
	}
	isCheckGame.put({
		type: sourcePiece.type,
		color: sourcePiece.color
	}, target)
	return isFenSafe(isCheckGame.fen())
}

var topSpinPos = ""

function onDropEditor(source, target) {
	let sourcePiece = editorGame.get(source)
	let targetPiece = editorGame.get(target)
	var loadGame = new Chess()
	let currentFen = editorGame.fen()
	loadGame.load(currentFen)
	if (!isPossibleMove(source, target, sourcePiece, targetPiece, currentFen, loadGame)) {
		console.log('Possible Move')
		return "snapback"
	}
	let isCheckForTurnAftermoveKnightBool = isCheckForTurnAftermoveOfKnight(currentFen, source, target)

	if (!isCheckForTurnAftermove(currentFen, source, target)) {
		return "snapback"
	}

	let possibleDirectionOfKnight
	if (isCheckForTurnAftermoveKnightBool == 'f') {
		return 'snapback'
	}
	else if (isCheckForTurnAftermoveKnightBool == 'h') {
		possibleDirectionOfKnight = 'h'
	}
	else if (isCheckForTurnAftermoveKnightBool == 'v') {
		possibleDirectionOfKnight = 'v'
	}
	else {
		possibleDirectionOfKnight = 't'
	}
	// console.log(possibleDirectionOfKnight)

	let Moves = []
	var move = editorGame.move({
		from: source,
		to: target,
		promotion: 'q' // NOTE: always promote to a queen for example simplicity
	})
	if (move) currentSAN = move['san']
	orignalMove = move
	document.getElementById('trn').style.display = null;
	document.getElementById('trn').innerHTML = editorGame.turn();
	document.getElementById('possMoves').style.display = "none";
	document.getElementById('input-pos').style.display = "none";
	document.getElementById('top-spin').style.display = "none";
	document.getElementById('horz').style.display = "none"
	document.getElementById('vert').style.display = "none"
	document.getElementById('check').style.display = "none"
	document.getElementById('push').style.display = "none"
	console.log(isCheck(editorGame.fen()))
	console.log(editorGame.fen())
	if (isCheck(editorGame.fen()) && !isCheckMate(editorGame.fen())) {
		document.getElementById('check').style.display = "block"
	} else {
		document.getElementById('check').style.display = "none"
	}

	myAudioEl.play();
	// illegal move
	if (move === null) {
		let isFinalMove = false
		let finalFen
		console.log("Move Is Null")
		// else{
		let arr = []
		let p = sourcePiece.type
		if (!p || sourcePiece.color !== editorGame.turn()) {
			return "snapback"
		} // replace with whichever turn
		if (p == 'q') {
			arr = getAllQueenMoves(editorGame, source)
		}
		if (p == 'k') {
			arr = getAllKingMoves(editorGame, source)
		}
		if (p == 'p') {
			arr = getAllPawnMoves(editorGame, source)
		}
		if (p == 'r') {
			arr = getAllRookMoves(editorGame, source)
		}
		if (p == 'n') {
			arr = getAllKnightMoves(editorGame, source)
		}
		if (p == "b") {
			arr = getAllBishopMoves(editorGame, source)
		}
		// console.log(arr)
		for (let mv of arr) {
			console.log(source, mv.from, target, mv.to)
			if (target == mv.to && source == mv.from) {
				if (mv.flags == 'c') {
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
						isFinalMove = false
						let moveData = [source, target, sourcePiece, targetPiece, currentFen, loadGame, possibleDirectionOfKnight, false];
						let horz = pushPieceKnight(loadGame, source, target, "h")
						let vert = pushPieceKnight(loadGame, source, target, "v")

						let et = []
						if (horz.length >= 1)
							et.push(horz[horz.length - 1])
						if (vert.length >= 1)
							et.push(vert[vert.length - 1])
						if (et.length > 0) {
							if (possibleDirectionOfKnight == 't') {
								editorGame.put({
									type: sourcePiece.type,
									color: sourcePiece.color
								}, target)
								editorGame.remove(source)
								$("#dialog-5").data('moveData', moveData).dialog("open");
							}
							else if (possibleDirectionOfKnight == 'h') {
								$("#dialog-5").data('moveData', moveData).dialog("open").parent().find("button:contains('Vert')").prop('disabled', true).addClass('ui-state-disabled');
							}
							else if (possibleDirectionOfKnight == 'v') {
								$("#dialog-5").data('moveData', moveData).dialog("open").parent().find("button:contains('Horz')").prop('disabled', true).addClass('ui-state-disabled');
							}
						} else {
							editorGame.load(currentFen)
						}
						if (isCheckMate(editorGame.fen())) {
							if (editorGame.turn() == "b") {
								alert("White Wins")
							} else {
								alert("Black Wins")
							}
						}
					}
					if (sourcePiece.type == 'p') {
						Moves = pushPieceBishop(loadGame, source, target)
					}
					if (sourcePiece.type == 'k') {
						Moves = pushPieceQueen(loadGame, source, target)
					}
					let possMoves = []
					var pushPosition = ""

					if (sourcePiece.type != 'n') {
						for (let i = 0; i < Moves.length; i++) {
							possMoves.push(Moves[i].to)
						}
						if (isForceTopAllowedState) {
							let checkPos = isCheckAfterForceMove(possMoves, editorGame.fen(), source, target, sourcePiece, targetPiece, false)
							if (possMoves.length > 0) {
								forceControl(possMoves, checkPos).then(pushPos => {
									pushPosition = possMoves[pushPos]
									let topSpinPositions = [target]
									if (editorGame.get(pushPosition) === null && possMoves.includes(pushPosition)) {
										if (sourcePiece.type == 'k') {
											sourcePiece.type = 'K'
										}
										editorGame.put({
											type: sourcePiece.type,
											color: sourcePiece.color
										}, target)
										editorGame.remove(source)
										makePoolMove(targetPiece, pushPosition, false)

										finalFen = editorGame.fen()
										console.log(sourcePiece.type)
										if (sourcePiece.type != 'p' && sourcePiece.type != 'k' && sourcePiece.type != 'K') {
											for (let i = 0; i < possMoves.length; i++) {
												if (pushPosition != possMoves[i]) {
													topSpinPositions.push(possMoves[i])
												}
												else {
													break;
												}
											}
											if (topSpinPositions.length > 1) {
												isFinalMove = false;
												topSpinControl(topSpinPositions).then(moves => {
													let topSpinPushPosition = topSpinPositions[moves]
													if (editorGame.get(topSpinPushPosition) === null && topSpinPositions.includes(topSpinPushPosition)) {
														if (sourcePiece.type == 'k') {
															sourcePiece.type = 'K'
														}
														editorGame.put({
															type: sourcePiece.type,
															color: sourcePiece.color
														}, topSpinPushPosition)
														editorGame.remove(target)
														let Fen = editorGame.fen()
														editorGame.load(Fen)
														editorBoard.position(Fen)
														finalFen = Fen
														console.log(";tf", finalFen)
														currentSAN = "?" + source + "." + topSpinPushPosition + "." + target + "." + pushPosition
														console.log("FSAN " + currentSAN)
														addMove(editorGame.fen())
														changeSquareColorAfterMove(source, topSpinPushPosition)
														if (isCheck(editorGame.fen()) && !isCheckMate(editorGame.fen())) {
															document.getElementById('check').style.display = "block"
														} else {
															document.getElementById('check').style.display = "none"
														}

														if (isCheckMate(editorGame.fen())) {
															if (editorGame.turn() == "b") {
																alert("White Wins")
															} else {
																alert("Black Wins")
															}
														}
													}
													return
												})
											}
											else {
												console.log("No Top Spin Moves ", editorGame.fen())
												currentSAN = "?" + source + "." + target + "." + target + "." + pushPosition
												// sourceFrom, sourceTo, targetFrom, targetTo
												console.log("FSAN " + currentSAN)
												addMove(editorGame.fen())
												changeSquareColorAfterMove(source, target)
												boardJqry.find('.' + squareClass).removeClass('highlight-force-control')
												if (isCheck(editorGame.fen()) && !isCheckMate(editorGame.fen())) {
													document.getElementById('check').style.display = "block"
												} else {
													document.getElementById('check').style.display = "none"
												}

												if (isCheckMate(editorGame.fen())) {
													if (editorGame.turn() == "b") {
														alert("White Wins")
													} else {
														alert("Black Wins")
													}
												}
											}
										}
										else {
											currentSAN = "?" + source + "." + topSpinPositions[0] + "." + target + "." + pushPosition
											console.log("FSAN " + currentSAN)
											addMove(editorGame.fen())
											console.log("Push Fen", editorGame.fen())
											changeSquareColorAfterMove(source, target)
											if (isCheck(editorGame.fen()) && !isCheckMate(editorGame.fen())) {
												document.getElementById('check').style.display = "block"
											} else {
												document.getElementById('check').style.display = "none"
											}

											if (isCheckMate(editorGame.fen())) {
												if (editorGame.turn() == "b") {
													alert("White Wins")
												} else {
													alert("Black Wins")
												}
											}
											return
										}
									}

									if (isCheck(editorGame.fen()) && !isCheckMate(editorGame.fen())) {
										document.getElementById('check').style.display = "block"
									} else {
										document.getElementById('check').style.display = "none"
									}

									if (isCheckMate(editorGame.fen())) {
										if (editorGame.turn() == "b") {
											alert("White Wins")
										} else {
											alert("Black Wins")
										}
									}
									return
								})
							}
						}
						else {
							if (sourcePiece.type == 'k') {
								sourcePiece.type = 'K'
							}
							editorGame.put({
								type: sourcePiece.type,
								color: sourcePiece.color
							}, target)
							editorGame.remove(source)
							makePoolMove(targetPiece, possMoves[possMoves.length - 1], false)
							console.log("FSAN " + currentSAN)
							// currentSAN = "?" + currentSAN + "." + possMoves[possMoves.length - 1] + "." + orignalMove['to']
							currentSAN = "?" + source + "." + target + "." + target + "." + possMoves[possMoves.length - 1]
							addMove(editorGame.fen())
							console.log('Final Fen ' + editorGame.fen())
							changeSquareColorAfterMove(source, target)

							if (isCheck(editorGame.fen()) && !isCheckMate(editorGame.fen())) {
								document.getElementById('check').style.display = "block"
							} else {
								document.getElementById('check').style.display = "none"
							}

							if (isCheckMate(editorGame.fen())) {
								if (editorGame.turn() == "b") {
									alert("White Wins")
								} else {
									alert("Black Wins")
								}
							}
							return
						}
					}
				}
				else {
					console.log('Not Capture')
					if (p == 'k') {
						p = 'K'
					}
					editorGame.put({
						type: p,
						color: sourcePiece.color
					}, target)
					changeSquareColorAfterMove(source, target)
					currentSAN = "?" + source + "." + target

					editorGame.remove(source)
					let tokens = editorGame.fen().split(" ");
					boardJqry.find('.' + squareClass).removeClass('highlight-force-control')

					tokens[1] = editorGame.turn() === "b" ? "w" : "b";
					tokens[3] = "-";

					let Fen = tokens.join(" ");
					editorGame.load(Fen)
					editorBoard.position(Fen, false)
					addMove(Fen)
					if (isCheck(editorGame.fen()) && !isCheckMate(editorGame.fen())) {
						document.getElementById('check').style.display = "block"
					} else {
						document.getElementById('check').style.display = "none"
					}

					if (isCheckMate(editorGame.fen())) {
						if (editorGame.turn() == "b") {
							alert("White Wins")
						} else {
							alert("Black Wins")
						}
					}
					return;
				}
			}
		}
		console.log('Illegal Move')
		return "snapback"
	}
	else {
		if (sourcePiece.type != 'n')
			changeSquareColorAfterMove(source, target)
	}
	boardJqry.find('.' + squareClass)
		.removeClass('highlight-force-control')
	// console.log(target)
	let finalFen = editorGame.fen()
	let isFinalMove = true;
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
			isFinalMove = false
			let moveData = [source, target, sourcePiece, targetPiece, currentFen, loadGame, possibleDirectionOfKnight, true];
			let horz = pushPieceKnight(loadGame, source, target, "h")
			let vert = pushPieceKnight(loadGame, source, target, "v")

			let et = []
			if (horz.length >= 1)
				et.push(horz[horz.length - 1])
			if (vert.length >= 1)
				et.push(vert[vert.length - 1])
			if (et.length > 0) {
				if (possibleDirectionOfKnight == 't') {
					$("#dialog-5").data('moveData', moveData).dialog("open");
				}
				else if (possibleDirectionOfKnight == 'h') {
					$("#dialog-5").data('moveData', moveData).dialog("open").parent().find("button:contains('Vert')").prop('disabled', true).addClass('ui-state-disabled');
				}
				else if (possibleDirectionOfKnight == 'v') {
					$("#dialog-5").data('moveData', moveData).dialog("open").parent().find("button:contains('Horz')").prop('disabled', true).addClass('ui-state-disabled');
				}
			} else {
				editorGame.load(currentFen)
			}
		}
		if (sourcePiece.type == 'p') {
			Moves = pushPieceBishop(loadGame, source, target)
		}
		if (sourcePiece.type == 'k') {
			Moves = pushPieceQueen(loadGame, source, target)
		}
		let possMoves = []
		var pushPosition = ""

		if (sourcePiece.type != 'n') {
			for (let i = 0; i < Moves.length; i++) {
				possMoves.push(Moves[i].to)
			}
			if (isForceTopAllowedState) {
				let checkPos = isCheckAfterForceMove(possMoves, editorGame.fen(), source, target, sourcePiece, targetPiece, true)
				console.log(checkPos)
				forceControl(possMoves, checkPos).then(pushPos => {
					pushPosition = possMoves[pushPos]
					let topSpinPositions = [target]
					if (editorGame.get(pushPosition) === null && possMoves.includes(pushPosition)) {
						makePoolMove(targetPiece, pushPosition, true)
						currentSAN = currentSAN + "." + pushPosition
						finalFen = editorGame.fen()
						console.log(sourcePiece.type)
						if (sourcePiece.type != 'p' && sourcePiece.type != 'k' && sourcePiece.type != 'K') {
							for (let i = 0; i < possMoves.length; i++) {
								if (pushPosition != possMoves[i]) {
									topSpinPositions.push(possMoves[i])
								}
								else {
									break;
								}
							}
							if (topSpinPositions.length > 1) {
								isFinalMove = false;
								topSpinControl(topSpinPositions).then(moves => {
									let topSpinPushPosition = topSpinPositions[moves]
									console.log(moves + " " + topSpinPushPosition)
									if (editorGame.get(topSpinPushPosition) === null && topSpinPositions.includes(topSpinPushPosition)) {
										if (sourcePiece.type == 'k') {
											sourcePiece.type = 'K'
										}
										editorGame.put({
											type: sourcePiece.type,
											color: sourcePiece.color
										}, topSpinPushPosition)
										editorGame.remove(target)
										let Fen = editorGame.fen()
										editorGame.load(Fen)
										editorBoard.position(Fen)
										finalFen = Fen
										console.log(";tf", finalFen)
										currentSAN = "<" + currentSAN + "." + topSpinPushPosition
										console.log("FSAN " + currentSAN)
										addMove(editorGame.fen())
										changeSquareColorAfterMove(source, topSpinPushPosition)
									}
									else {
										console.log("no top spin", editorGame.fen())
										console.log(target)
										console.log(currentSAN, "destPieceHere", target)
									}

									if (isCheck(editorGame.fen()) && !isCheckMate(editorGame.fen())) {
										document.getElementById('check').style.display = "block"
									} else {
										document.getElementById('check').style.display = "none"
									}

									if (isCheckMate(editorGame.fen())) {
										if (editorGame.turn() == "b") {
											alert("White Wins")
											console.log("CHECKMATE")
										} else {
											alert("Black Wins")
											console.log("CHECKMATE")
										}
									}
								})
							}
							else {
								console.log("No Top Spin Moves ", editorGame.fen())
								currentSAN = "<" + currentSAN + "." + target
								console.log("FSAN " + currentSAN)
								addMove(editorGame.fen())
								changeSquareColorAfterMove(source, target)

								if (isCheck(editorGame.fen()) && !isCheckMate(editorGame.fen())) {
									document.getElementById('check').style.display = "block"
								} else {
									document.getElementById('check').style.display = "none"
								}

								if (isCheckMate(editorGame.fen())) {
									if (editorGame.turn() == "b") {
										alert("White Wins")
										console.log("CHECKMATE")
									} else {
										alert("Black Wins")
										console.log("CHECKMATE")
									}
								}
							}
						}
						else {
							currentSAN = "<" + currentSAN + "." + topSpinPositions[0]
							console.log("FSAN " + currentSAN)

							addMove(editorGame.fen())
							console.log("Push Fen", editorGame.fen())

							if (isCheck(editorGame.fen()) && !isCheckMate(editorGame.fen())) {
								document.getElementById('check').style.display = "block"
							} else {
								document.getElementById('check').style.display = "none"
							}

							if (isCheckMate(editorGame.fen())) {
								if (editorGame.turn() == "b") {
									alert("White Wins")
									console.log("CHECKMATE")
								} else {
									alert("Black Wins")
									console.log("CHECKMATE")
								}
							} else {
								// console.log("NOT CHECKMATE")
							}
						}
					}
					else {
						editorGame.undo()
						isFinalMove = false
						finalFen = editorGame.fen()
					}

					if (isCheck(editorGame.fen()) && !isCheckMate(editorGame.fen())) {
						document.getElementById('check').style.display = "block"
					} else {
						document.getElementById('check').style.display = "none"
					}

					if (isCheckMate(editorGame.fen())) {
						if (editorGame.turn() == "b") {
							alert("White Wins")
							console.log("CHECKMATE")
						} else {
							alert("Black Wins")
							console.log("CHECKMATE")
						}
					} else {
						// console.log("NOT CHECKMATE")
					}
				})
			}
			else {
				makePoolMove(targetPiece, possMoves[possMoves.length - 1], true)
				console.log("FSAN " + currentSAN)
				currentSAN = "<" + currentSAN + "." + possMoves[possMoves.length - 1] + "." + orignalMove['to']
				addMove(editorGame.fen())
				console.log('Final Fen ' + editorGame.fen())

				if (isCheck(editorGame.fen()) && !isCheckMate(editorGame.fen())) {
					document.getElementById('check').style.display = "block"
				} else {
					document.getElementById('check').style.display = "none"
				}

				if (isCheckMate(editorGame.fen())) {
					if (editorGame.turn() == "b") {
						alert("White Wins")
						console.log("CHECKMATE")
					} else {
						alert("Black Wins")
						console.log("CHECKMATE")
					}
				}
			}
		}
		// squareToHighlight = move.to
		editorTurnt = 1 - editorTurnt;

		// make random legal move for black
		// window.setTimeout(makeRandomMoveEditor, 250)
	}
	else if (isFinalMove && isForceTopAllowedState) {
		console.log("FSAN " + currentSAN)
		addMove(editorGame.fen())
		if (sourcePiece.type == 'n') {
			changeSquareColorAfterMove(source, target)
		}
		boardJqry.find('.' + squareClass)
			.removeClass('highlight-force-control')

		if (isCheck(editorGame.fen()) && !isCheckMate(editorGame.fen())) {
			document.getElementById('check').style.display = "block"
		} else {
			document.getElementById('check').style.display = "none"
		}

		if (isCheckMate(editorGame.fen())) {
			if (editorGame.turn() == "b") {
				alert("White Wins")
				console.log("CHECKMATE")
			} else {
				alert("Black Wins")
				console.log("CHECKMATE")
			}
		} else {
			// console.log("NOT CHECKMATE")
		}
	}
	else {
		boardJqry.find('.' + squareClass)
			.removeClass('highlight-force-control')
		console.log("Final Fen " + finalFen)
		addMove(editorGame.fen())
		if (sourcePiece.type == 'n') {
			changeSquareColorAfterMove(source, target)
		}

		if (isCheck(editorGame.fen()) && !isCheckMate(editorGame.fen())) {
			document.getElementById('check').style.display = "block"
		} else {
			document.getElementById('check').style.display = "none"
		}

		if (isCheckMate(editorGame.fen())) {
			if (editorGame.turn() == "b") {
				alert("White Wins")
				console.log("CHECKMATE")
			} else {
				alert("Black Wins")
				console.log("CHECKMATE")
			}
		} else {
			// console.log("NOT CHECKMATE")
		}
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

function changeForceControlSquareColorAfterMove(forcePos) {
	if (forcePos != null && !(forcePos.includes("9") || forcePos.includes("`") || forcePos.includes("i") || forcePos.includes("0"))) {
		boardJqry.find('.' + squareClass)
			.removeClass('highlight-force-control')
		boardJqry.find('.square-' + forcePos).addClass('highlight-force-control')
	}
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

function addMove(moveFen) {
	if (currentSAN == null) return
	let moveTable = null
	const currTurn = editorGame.turn()
	if (currTurn === 'b')
		moveTable = document.getElementById("whiteMoves")
	else moveTable = document.getElementById("blackMoves")

	let tr = document.createElement("tr")
	let td = document.createElement("td")
	const rowNum = moveTable.rows.length
	// td.innerText = `Move ${rowNum + 1}`
	if (currentSAN.includes('`')){
		currentSAN = currentSAN.replace('`', 'z')
		console.log(currentSAN)
	}
	td.innerText = currentSAN
	currentSAN = null
	// td.addEventListener('click', () => { previewFen(moveFen, rowNum, currTurn) })
	// td.style = "cursor:pointer"
	tr.appendChild(td)
	tr.id = `m${currTurn}-${rowNum}`
	moveTable.appendChild(tr)
}

function saveGameListener(e) {
	e.preventDefault();
	var copyText = editorGame.fen();
	// navigator.clipboard.writeText(copyText);
	// alert("Copied the FEN : " + copyText + " to clipboard");
	downloadFile("fen.txt", copyText)
}

function savePGNListener(e) {
	e.preventDefault();
	let wt = document.getElementById("whiteMoves")
	let bt = document.getElementById("blackMoves")

	let wr = wt.rows
	let br = bt.rows

	let wc = wr.length
	let bc = br.length

	let pgnString = ""
	let wp = 0, bp = 0;
	for (; wp < wc, bp < bc; wp++, bp++) {
		let w = wr[wp].children[0].innerText
		let b = br[bp].children[0].innerText
		pgnString += (wp + 1 + ". " + w + " " + b + " ")
	}
	if (wp < wc) {
		for (; wp < wc; wp++) {
			let w = wr[wp].children[0].innerText
			pgnString += (wp + 1 + ". " + w + " ")
		}
	}
	pgnString = pgnString.trim()
	navigator.clipboard.writeText(pgnString);
	alert("Copied the PGN : " + pgnString + " to clipboard")
	downloadFile("pgn.txt", pgnString)
}

function downloadFile(filename, text) {
	var element = document.createElement('a');
	element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
	element.setAttribute('download', filename);

	element.style.display = 'none';
	document.body.appendChild(element);

	element.click();

	document.body.removeChild(element);
}


window.bd = boardJqry
window.editorGame = editorGame