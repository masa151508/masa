// DOM要素の取得
const cells = document.querySelectorAll('[data-cell]');
const board = document.getElementById('game-board');
const statusDisplay = document.getElementById('status');
const resetButton = document.getElementById('resetButton');
const difficultySelect = document.getElementById('difficulty');

// 定数
const PLAYER_CLASS = 'o';
const COMPUTER_CLASS = 'x';
const WINNING_COMBINATIONS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6]
];

// ゲームの状態を管理する変数
let isPlayerTurn;

// ゲーム開始
startGame();

// イベントリスナー
resetButton.addEventListener('click', startGame);
difficultySelect.addEventListener('change', startGame);

function startGame() {
  isPlayerTurn = true;
  cells.forEach(cell => {
    cell.classList.remove(PLAYER_CLASS);
    cell.classList.remove(COMPUTER_CLASS);
    cell.removeEventListener('click', handleClick);
    cell.addEventListener('click', handleClick, { once: true });
  });
  board.style.pointerEvents = 'auto';
  statusDisplay.innerText = 'あなたの番です（〇）';
}

function handleClick(e) {
  if (!isPlayerTurn) return;
  const cell = e.target;
  placeMark(cell, PLAYER_CLASS);

  if (checkWin(PLAYER_CLASS)) {
    endGame(false);
  } else if (isDraw()) {
    endGame(true);
  } else {
    isPlayerTurn = false;
    statusDisplay.innerText = 'コンピュータの番です（×）';
    board.style.pointerEvents = 'none';
    setTimeout(computerMove, 800);
  }
}

function computerMove() {
  const difficulty = difficultySelect.value;
  let move;

  if (difficulty === 'easy') {
    move = getEasyMove();
  } else if (difficulty === 'normal') {
    move = getNormalMove();
  } else { // hard
    move = getHardMove();
  }
  
  if (cells[move]) {
    placeMark(cells[move], COMPUTER_CLASS);
    if (checkWin(COMPUTER_CLASS)) {
      endGame(false);
    } else if (isDraw()) {
      endGame(true);
    } else {
      isPlayerTurn = true;
      statusDisplay.innerText = 'あなたの番です（〇）';
      board.style.pointerEvents = 'auto';
    }
  }
}

function getAvailableCells() {
    return [...cells].map((cell, index) => ({ cell, index }))
                     .filter(item => !item.cell.classList.contains(PLAYER_CLASS) && !item.cell.classList.contains(COMPUTER_CLASS))
                     .map(item => item.index);
}

// --- かんたん ---
function getEasyMove() {
  const availableCells = getAvailableCells();
  return availableCells[Math.floor(Math.random() * availableCells.length)];
}

// --- ふつう ---
function getNormalMove() {
    // 1. 自分が勝てる手を探す
    let winningMove = findWinningMove(COMPUTER_CLASS);
    if (winningMove !== null) return winningMove;

    // 2. 相手が勝つ手のを防ぐ
    let blockingMove = findWinningMove(PLAYER_CLASS);
    if (blockingMove !== null) return blockingMove;
    
    // 3. ランダムな手
    return getEasyMove();
}

function findWinningMove(playerClass) {
    const availableCells = getAvailableCells();
    for (let i = 0; i < availableCells.length; i++) {
        const cellIndex = availableCells[i];
        const tempCell = cells[cellIndex];
        tempCell.classList.add(playerClass); // 一時的に手を打ってみる
        if (checkWin(playerClass)) {
            tempCell.classList.remove(playerClass); // 元に戻す
            return cellIndex;
        }
        tempCell.classList.remove(playerClass); // 元に戻す
    }
    return null;
}


// --- むずかしい (ミニマックス法) ---
function getHardMove() {
  let bestScore = -Infinity;
  let move;
  const availableCells = getAvailableCells();

  for (let i = 0; i < availableCells.length; i++) {
    const index = availableCells[i];
    cells[index].classList.add(COMPUTER_CLASS);
    let score = minimax(false);
    cells[index].classList.remove(COMPUTER_CLASS);
    if (score > bestScore) {
      bestScore = score;
      move = index;
    }
  }
  return move;
}

const scores = {
  [COMPUTER_CLASS]: 1,
  [PLAYER_CLASS]: -1,
  draw: 0
};

function minimax(isMaximizing) {
  if (checkWin(COMPUTER_CLASS)) return scores[COMPUTER_CLASS];
  if (checkWin(PLAYER_CLASS)) return scores[PLAYER_CLASS];
  if (isDraw()) return scores.draw;

  const availableCells = getAvailableCells();

  if (isMaximizing) {
    let bestScore = -Infinity;
    for (let i = 0; i < availableCells.length; i++) {
      const index = availableCells[i];
      cells[index].classList.add(COMPUTER_CLASS);
      let score = minimax(false);
      cells[index].classList.remove(COMPUTER_CLASS);
      bestScore = Math.max(score, bestScore);
    }
    return bestScore;
  } else {
    let bestScore = Infinity;
    for (let i = 0; i < availableCells.length; i++) {
      const index = availableCells[i];
      cells[index].classList.add(PLAYER_CLASS);
      let score = minimax(true);
      cells[index].classList.remove(PLAYER_CLASS);
      bestScore = Math.min(score, bestScore);
    }
    return bestScore;
  }
}

// --- 共通の関数 ---
function endGame(draw) {
  if (draw) {
    statusDisplay.innerText = '引き分けです！';
  } else {
    statusDisplay.innerText = `${isPlayerTurn ? "あなた(〇)" : "コンピュータ(×)"}の勝ち！`;
  }
  board.style.pointerEvents = 'none';
}

function isDraw() {
  return [...cells].every(cell => {
    return cell.classList.contains(PLAYER_CLASS) || cell.classList.contains(COMPUTER_CLASS);
  });
}

function placeMark(cell, currentClass) {
  cell.classList.add(currentClass);
}

function checkWin(currentClass) {
  return WINNING_COMBINATIONS.some(combination => {
    return combination.every(index => {
      return cells[index].classList.contains(currentClass);
    });
  });
}