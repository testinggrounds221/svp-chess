// import './../boardEditor.js'
const formEl = document.querySelectorAll('#joinForm > div > input')
const joinButtonEl = document.querySelector('#joinButton')
const messageEl = document.querySelector('#message')
const statusEl = document.querySelector('#status')
const roomsListEl = document.getElementById('roomsList');
const myAudioEl = document.getElementById('myAudio');
const totalRoomsEl = document.getElementById('rooms')
const totalPlayersEl = document.getElementById('players')
const ChatEl = document.querySelector('#chat')
const sendButtonEl = document.querySelector('#send')
const chatContentEl = document.getElementById('chatContent')
const saveGame = document.getElementById('saveGame');
let currentSource = null
var game = new Chess()
var turnt = 0;
let globalRooms = null
var editorTurnt = 0;
let play = true;
var editorBoard = null;
var boardJqry = $('#boardEditor')
var editorGame = new Chess()
var fen, editorGame, piece_theme, promote_to, promoting, promotion_dialog;
promotion_dialog = $("#promotion-dialog");
promoting = false;
piece_theme = "img/chesspieces/wikipedia/{piece}.png";
var squareToHighlight = null
var squareClass = 'square-55d63'

let isChangeFen = false
let changeFen = {}

let waitForBoom = false

let configEditor = {
	draggable: true,
	position: 'start',
	orientation: 'white',
	onSnapEnd: onSnapEndEditor,
	onDrop: onDropEditor,
	onMoveEnd: onMoveEnd,
	onDragStart: () => { return false }
}
editorBoard = Chessboard('boardEditor', configEditor);
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

$(function () {
	$("#dialog-4").dialog({
		dialogClass: 'no-close',
		autoOpen: false,
		modal: true,
		buttons: {
			Yes: function () {
				moveBack($(this).data('move'))
				$(this).dialog("close");
				waitForBoom = false
				handleBoomMove($(this).data('move').from, $(this).data('move').to)
			},
			No: function () {
				$(this).dialog("close");
				waitForBoom = false
				handleValidMove($(this).data('move').from, $(this).data('move').to)
				alertCheckMate()
			},
		},
	});
	// css("font-size", "30px");
	$("#opener-4").click(function () {
		$("#dialog-4").dialog("open");
	});
});
// old
var time_in_minutes = 30;
var current_time = null;
var deadline = null;
var paused = false;
var time_left;
var timeinterval;

// initializing semantic UI dropdown
$('.ui.dropdown')
	.dropdown();
$("#dialog").dialog({
	autoOpen: false
});

// function for defining onchange on dropdown menus
$("#roomDropdown").dropdown({
	onChange: function (val) {
		// console.log(val)
		// console.log('running the function')
		formEl[1].value = val
	}
});

//Connection will be established after webpage is refreshed
const socket = io()

//Triggers after a piece is dropped on the editorBoard
function onDrop(source, target) {
	//emits event after piece is dropped
	pause_clock();
	var room = formEl[1].value;
	myAudioEl.play();
	// isMyTurn(false)
	// socket.emit('Dropped', { source, target, room })
}

function onDropEditor(source, target) {
	if (source === target)
		return onClickSquare(source)
	currentSource = null
	if (isChangeFen) handleChangeHistory(changeFen)
	// see if the move is legal
	var move = editorGame.move({
		from: source,
		to: target,
		promotion: 'q' // NOTE: always promote to a queen for example simplicity
	})

	let currentFen = editorGame.fen()
	let fun = 0;
	let validMovesOfPieces = editorGame.moves({ verbose: true, legal: false })
	for (let i = 0; i < validMovesOfPieces.length; i++) {
		if (validMovesOfPieces[i].from === source && validMovesOfPieces[i].to === target) {
			fun = 1;
			break;
		}
	}
	myAudioEl.play();
	// illegal move
	if (move === null) {
		console.log("Move is null")
		if (editorGame.get(target) && !isCheckAfterRemovePiece(currentFen, target)
			&& fun === 1) {
			moveIllegal(source, target);
			handleBoomMove(source, target)
		}
		// TODO: EMit Check mate

		else if (editorGame.in_checkmate() || editorGame.in_check()) {
			console.log('Check Mate')
			if (editorGame.get(target) && !isCheckAfterRemovePiece(currentFen, target) && fun === 1) {
				moveIllegal(source, target);
				handleBoomMove(source, target)
			} else {
				return
			}
		} else {
			console.log('Snap 2');
			return
		}
		return;
	} else {
		// changeSquareColorAfterMove(source, target)
		if (move.san === "O-O" || move.san === "O-O-O") {
			alertCheckMate()
			handleCastleMove(source, target)
			return
		}
	}
	if (move != null && 'captured' in move && move.piece != 'p') {
		waitForBoom = true
		editorGame.undo();
		if (!isCheckAfterRemovePiece(editorGame.fen(), move.to)) {
			var move = editorGame.move({
				from: source,
				to: target,
				promotion: 'q'
			})
			$("#dialog-4").data('move', move).dialog("open");
		} else {
			var move = editorGame.move({
				from: source,
				to: target,
				promotion: 'q'
			})
			handleValidMove(source, target)
		}
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
						let pt = { type: move.promotion, color: move.color }
						handlePawnPromo(source, target, pt)
						alertCheckMate()
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
	if (!waitForBoom) {
		alertCheckMate()
		handleValidMove(source, target)
	}
}

function onMoveEnd() {
	boardJqry.find('.square-' + squareToHighlight)
		.addClass('highlight-black')
}

function handleValidMove(source, target) {
	pause_clock();
	var room = formEl[1].value;
	myAudioEl.play();
	socket.emit('Dropped', { source, target, room })
}

function handleBoomMove(source, target) {
	pause_clock();
	var room = formEl[1].value;
	myAudioEl.play();
	socket.emit('boomDropped', { source, target, room })
}

function handleCastleMove(source, target) {
	pause_clock();
	var room = formEl[1].value;
	myAudioEl.play();
	socket.emit('castleDropped', { source, target, room })
}

function handlePawnPromo(source, target, pieceType) {
	pause_clock();
	var room = formEl[1].value;
	myAudioEl.play();
	socket.emit('pawnPromoDropped', { source, target, pieceType, room })
}

function handleChangeHistory(changeFen) {
	var room = formEl[1].value;
	// myAudioEl.play(); Can use Shuffle Sound ?
	socket.emit('changeHistory', { changeFen, room })
}

function onSnapEndEditor(params) {
	if (promoting) return; //if promoting we need to select the piece first
	editorBoard.position(editorGame.fen())
}

function saveGameListener(e) {
	e.preventDefault();
	var copyText = editorGame.fen();
	navigator.clipboard.writeText(copyText);
	alert("Copied the text: " + copyText + " to clipboard");
}

//Update Status Event
socket.on('updateEvent', ({ status, fen, pgn }) => {
	statusEl.textContent = status

})

socket.on('printing', (fen) => {
	console.log(fen)
})

//Catch Display event
socket.on('DisplayBoard', (fenString, mvSq, userId) => {
	// console.log(fenString)
	//This is to be done initially only
	if (userId != undefined) {
		current_time = Date.parse(new Date());
		deadline = new Date(current_time + time_in_minutes * 60 * 1000);
		messageEl.textContent = 'Match Started!! Best of Luck...'
		if (socket.id == userId) {
			configEditor.orientation = 'black'
			run_clock('clck', deadline);
			pause_clock()
		} else {
			run_clock('clck', deadline);
		}
		document.getElementById('joinFormDiv').style.display = "none";
		document.querySelector('#chessGame').style.display = null
		document.querySelector('#moveTable').style.display = null
		ChatEl.style.display = null
		document.getElementById('statusPGN').style.display = null
	}

	configEditor.position = fenString
	console.log(`Is received Fen String Valid ? ${editorGame.load(fenString)}`)
	editorBoard = ChessBoard('boardEditor', configEditor)
	editorBoard.position(fenString)
	addEventListeners()
	if (!userId)
		addMoveToHistory(fenString)
	if (mvSq.source && mvSq.source)
		changeSquareColorAfterMove(mvSq.source, mvSq.target)


	// console.log(turnt)
	// document.getElementById('pgn').textContent = pgn
})

socket.on('changeHistoryFromSever', (changeFen) => {
	addEventListeners()
	isChangeFen = false
	setBoardAndGame(changeFen)
})

//To turn off dragging
socket.on('Dragging', id => {
	if (socket.id != id) {
		configEditor.draggable = true;//"white dont drag"		
	} else {
		configEditor.draggable = false;//black dont drag		
	}
})



//To Update Status Element
socket.on('updateStatus', (turn) => {
	if (editorBoard.orientation().includes(turn)) {
		statusEl.textContent = "Your turn"
		resume_clock()
	}
	else {
		statusEl.textContent = "Opponent's turn"
		pause_clock()
	}
})

//If in check
socket.on('inCheck', turn => {
	if (editorBoard.orientation().includes(turn)) {
		statusEl.textContent = "You are in Check!!"
	}
	else {
		statusEl.textContent = "Opponent is in Check!!"
	}
})

//If win or draw
socket.on('gameOver', (turn, win) => {
	configEditor.draggable = false;
	if (win) {
		if (editorBoard.orientation().includes(turn)) {
			statusEl.textContent = "You lost, better luck next time :)"
			alert("You lost")
		}
		else {
			statusEl.textContent = "Congratulations, you won!!"
			alert("You Won")
		}
	}
	else {
		statusEl.value = 'Game Draw'
	}
})

//Client disconnected in between
socket.on('disconnectedStatus', () => {
	alert('Opponent left the game!!')
	messageEl.textContent = 'Opponent left the game!!'
})

//Receiving a message
socket.on('receiveMessage', (user, message) => {
	var chatContentEl = document.getElementById('chatContent')
	//Create a div element for using bootstrap
	chatContentEl.scrollTop = chatContentEl.scrollHeight;
	var divEl = document.createElement('div')
	if (formEl[0].value == user) {
		divEl.classList.add('myMessage');
		divEl.textContent = message;
	}
	else {
		divEl.classList.add('youMessage');
		divEl.textContent = message;
		document.getElementById('messageTone').play();
	}
	var style = window.getComputedStyle(document.getElementById('chatBox'));
	if (style.display === 'none') {
		document.getElementById('chatBox').style.display = 'block';
	}
	chatContentEl.appendChild(divEl);
	divEl.focus();
	divEl.scrollIntoView();
})
//Rooms List update
socket.on('roomsList', (rooms) => {
	// roomsListEl.innerHTML = null;
	// console.log('Rooms List event triggered!! ',  rooms);
	totalRoomsEl.innerHTML = rooms.length
	globalRooms = rooms
	var dropRooms = document.getElementById('dropRooms')
	while (dropRooms.firstChild) {
		dropRooms.removeChild(dropRooms.firstChild)
	}
	// added event listener to each room
	rooms.forEach(x => {
		var roomEl = document.createElement('div')
		roomEl.setAttribute('class', 'item')

		roomEl.setAttribute('data-value', x)
		roomEl.textContent = x;
		dropRooms.appendChild(roomEl)
	})
})

socket.on('updateTotalUsers', totalUsers => {
	// console.log('event listened')
	totalPlayersEl.innerHTML = totalUsers;
})

//Message will be sent only after you click the button
sendButtonEl.addEventListener('click', (e) => {
	e.preventDefault()
	var message = document.querySelector('#inputMessage').value
	var user = formEl[0].value
	var room = formEl[1].value
	document.querySelector('#inputMessage').value = ''
	document.querySelector('#inputMessage').focus()
	socket.emit('sendMessage', { user, room, message })
})

//Connect clients only after they click Join
joinButtonEl.addEventListener('click', (e) => {
	e.preventDefault()

	var user = formEl[0].value, room = formEl[1].value

	if (!user || !room) {
		messageEl.textContent = "Input fields can't be empty!"
	}
	else {
		joinButtonEl.setAttribute("disabled", "disabled");
		formEl[0].setAttribute("disabled", "disabled")
		document.querySelector('#roomDropdownP').style.display = 'none';
		formEl[1].setAttribute("disabled", "disabled")
		//Now Let's try to join it in room // If users more than 2 we will 
		const promptFen = () => {
			let lf = null
			lf = prompt("Enter Fen. Click Cancel to Continue")
			var temp = new Chess()
			if (lf && !temp.load(lf)) {
				temp.load(lf)
				alert("Enter Valid State !");
				promptFen()
			}
			else return lf
		}

		const urlParams = new URLSearchParams(window.location.search);
		if (!urlParams.get('loadGame')) console.error("NO LOADGAME Instructions")
		let loadFen = null
		let isRoomPresent = false
		for (let r of globalRooms) if (room === r) isRoomPresent = true
		if (isRoomPresent && urlParams.get('loadGame') === 'true') {
			loadFen = promptFen()
		}
		socket.emit('joinRoom', { user, room, loadFen }, (error) => {
			messageEl.textContent = error
			if (alert(error)) {
				window.location.reload()
			}
			else    //to reload even if negative confirmation
				window.location.reload();
		})
		messageEl.textContent = "Waiting for other player to join"
	}
})

saveGame.addEventListener('click', saveGameListener)

function time_remaining(endtime) {
	var t = Date.parse(endtime) - Date.parse(new Date());
	var seconds = Math.floor((t / 1000) % 60);
	var minutes = Math.floor((t / 1000 / 60) % 60);
	var hours = Math.floor((t / (1000 * 60 * 60)) % 24);
	var days = Math.floor(t / (1000 * 60 * 60 * 24));
	return { 'total': t, 'days': days, 'hours': hours, 'minutes': minutes, 'seconds': seconds };
}

function run_clock(id, endtime) {
	var clock = document.getElementById(id);
	function update_clock() {
		var t = time_remaining(endtime);
		clock.innerHTML = t.minutes + ' : ' + t.seconds;
		if (t.total <= 0) { clearInterval(timeinterval); }
	}
	update_clock(); // run function once at first to avoid delay
	timeinterval = setInterval(update_clock, 1000);
}

function pause_clock() {
	if (!paused) {
		paused = true;
		clearInterval(timeinterval); // stop the clock
		time_left = time_remaining(deadline).total; // preserve remaining time
	}
}

function resume_clock() {
	if (paused) {
		paused = false;
		deadline = new Date(Date.parse(new Date()) + time_left);
		run_clock('clck', deadline);
	}
}

//For removing class from all buttons


// Color Buttons
document.getElementById('messageBox').addEventListener('click', e => {
	e.preventDefault();
	var style = window.getComputedStyle(document.getElementById('chatBox'));
	if (style.display === 'none') {
		document.getElementById('chatBox').style.display = 'block';
	} else {
		document.getElementById('chatBox').style.display = 'none';
	}
})

function isCheckAfterRemovePiece(fen, square) {
	// we see isCheck for turn
	let c = new Chess()
	c.load(fen)
	c.remove(square)
	return c.in_check() // If in Check dont allow to cut, remove from valid moves
}

function moveIllegal(source, target) {
	if (!editorGame.get(target)) return
	let currentFen = editorGame.fen()
	var custommove = editorGame.get(source);
	editorGame.load(currentFen)
	editorGame.put({ type: custommove.type, color: custommove.color }, target)
	editorGame.remove(target)
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

	editorGame.load(isCheck)
	editorBoard.position(isCheck, false);

	// changeSquareColorAfterMove(source, target)
}

function changeSquareColorAfterMove(source, target) {
	boardJqry.find('.' + squareClass)
		.removeClass('highlight-from')
	boardJqry.find('.' + squareClass)
		.removeClass('highlight-to')
	boardJqry.find('.square-' + source).addClass('highlight-from')
	boardJqry.find('.square-' + target).addClass('highlight-to')
}
//TODO: Emit Check mate
function alertCheckMate() {
	if (editorGame.in_checkmate() && isBoomCheckMate(editorGame.fen())) {
		if (editorBoard.orientation().includes(editorGame.turn())) {
			statusEl.textContent = "You lost, better luck next time :)"
			alert("You lost")
		}
		else {
			statusEl.textContent = "Congratulations, you won!!"
			// alert("You Won")
		}

		// if (editorGame.turn() === 'w')
		// 	alert('Black Wins')
		// if (editorGame.turn() === 'b')
		// 	alert('White Wins')
		return
	}
}

function isBoomCheckMate(fen) {
	let c = new Chess()
	c.load(fen)

	// console.log(c.moves({ verbose: true, legal: false }))
	let f = 0
	let mvs = c.moves({ verbose: true, legal: false })
	for (let i = 0; i < mvs.length; i++) {
		const mv = mvs[i];

		if (mv.flags === 'c' && !isCheckAfterRemovePiece(fen, mv.to)) {
			console.log(mv) // ! DO NOT DLT. Keep This Console Log for moves
			f++;
		}
	}
	return (!f > 0)
}

function moveBack(move) {
	let currentFen = editorGame.fen()
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
	alertCheckMate()
	waitForBoom = false
	return {
		s: 1,
		m: "Moved Back"
	}

}

function getImgSrc(piece) {
	return piece_theme.replace(
		"{piece}",
		editorGame.turn() + piece.toLocaleUpperCase()
	);
}

function addEventListeners() {
	editorGame.SQUARES.forEach(
		(sq) => boardJqry.find('.square-' + sq).bind('click',
			() => {
				onClickSquare(sq)
			}
		))
}

function currHighlight(sq) {
	boardJqry.find('.square-' + sq).addClass('highlight-curr')
}

function removeCurrHighlight() {
	boardJqry.find('.' + squareClass).removeClass('highlight-curr')
}

function onClickSquare(sq) {

	if (currentSource === null) {
		if (editorGame.get(sq) === null) return
		if (editorBoard.orientation().startsWith(editorGame.get(sq).color) && editorGame.turn().startsWith(editorGame.get(sq).color)) {
			currentSource = sq
			currHighlight(sq)
			return
		}
	}
	else {
		if (editorGame.get(sq) === null) {
			onDropEditor(currentSource, sq)
			removeCurrHighlight()
			currentSource = null
			return
		}

		if (editorGame.get(sq).color === editorGame.get(currentSource).color) {
			currentSource = null
			removeCurrHighlight()
			return
		}

		if (editorGame.get(sq).color !== editorGame.get(currentSource).color) {
			onDropEditor(currentSource, sq)
			currentSource = null
			removeCurrHighlight()
			return
		}
	}
}

// Change History Functions
function addMoveToHistory(moveFen) {
	let moveTable = null
	let myArray = moveFen.split(" ");
	const currTurn = myArray[1]
	if (currTurn === 'b')
		moveTable = document.getElementById("whiteMoves")
	else moveTable = document.getElementById("blackMoves")

	let tr = document.createElement("tr")
	let td = document.createElement("td")
	const rowNum = moveTable.rows.length
	td.innerText = `Move ${rowNum + 1}`
	console.log(editorBoard.orientation(), currTurn)
	if (editorBoard.orientation()[0] === currTurn) {
		td.addEventListener('click', () => { previewFen(moveFen, rowNum, currTurn) })
		td.style = "cursor:pointer"
	}
	tr.appendChild(td)
	tr.id = `m${currTurn}-${rowNum}`
	moveTable.appendChild(tr)
}

function previewFen(moveFen, rowNum, turn) {
	currentSource = null
	boardJqry.find('.' + squareClass)
		.removeClass('highlight-from')
	boardJqry.find('.' + squareClass)
		.removeClass('highlight-to')
	if (!(editorGame.turn() == editorBoard.orientation()[0])) return

	console.log(editorGame.turn(), editorBoard.orientation()[0])
	console.log(typeof (editorGame.turn()), typeof (editorBoard.orientation()[0]))
	editorGame.load(moveFen)
	editorBoard.position(moveFen)
	changeFen = { moveFen, rowNum, turn }
	isChangeFen = true
}

function setBoardAndGame({ moveFen, rowNum, turn }) {
	isChangeFen = false
	editorGame.load(moveFen)
	editorBoard.position(moveFen)
	// TODO emit Change History like in handle valid move
	const whiteTable = document.getElementById("whiteMoves")
	const blackTable = document.getElementById("blackMoves")

	const maxLenW = whiteTable.rows.length
	const maxLenB = blackTable.rows.length

	// for (let i = rowNum; i < maxLenW; i++) {
	// 	document.getElementById(`mb-${i}`).remove()
	// }

	// for (let i = rowNum; i < maxLenB; i++) {
	// 	document.getElementById(`mw-${i}`).remove()
	// }
	const removeID = (id) => {
		let ele = document.getElementById(id)
		if (ele) ele.remove()
		else console.error(id + "Not found")
	}


	if (editorBoard.orientation()[0] === 'w') {
		for (let i = rowNum; i < maxLenW; i++) { // DO NOT ADD 1. IT COMES FROM DISPLAY BOARD.
			removeID(`mb-${i}`)
		}
		for (let i = rowNum; i < maxLenB; i++) {
			removeID(`mw-${i}`)
		}
	}
	else {
		for (let i = rowNum + 1; i < maxLenW; i++) { // DO NOT ADD 1. IT COMES FROM DISPLAY BOARD.
			removeID(`mb-${i}`)
		}
		for (let i = rowNum; i < maxLenB; i++) {
			removeID(`mw-${i}`)
		}
	}
}
