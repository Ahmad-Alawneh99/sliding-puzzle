let select;
let slidingGrid;
let moves = 0;
let size = 3;
let matrix = [];
let numbers = [];

let states = [];

const createMatrix = (matrix) => {
	let pointer = 0;
	for (let row = 0; row < size; row++) {
		matrix[row] = [];
		for (let column = 0; column < size; column++) {
			matrix[row][column] = numbers[pointer++];
		}
	}
};

const createGrid = (matrix) => {
	slidingGrid.innerHTML = '';
	slidingGrid.dataset.grid = size * size;

	for (let row = 0; row < size; row++) {
		for (let column = 0; column < size; column++) {
			const slidingItem = document.createElement('div');
			slidingItem.classList.add('sliding-puzzle-item');
			slidingItem.dataset.sliding = matrix[row][column];
			slidingGrid.append(slidingItem);
		}
	}
};

const updateMoves = () => {
	movesElement.textContent = moves;
};

const createNumbers = () => {
	numbers = [];
	for (let index = 0; index < size * size; index++) {
		numbers.push(index);
	}
	numbers = [1, 2, 3, 0, 4, 6, 7, 5, 8];

	// shuffle numbers
	// numbers.sort(() => Math.random() - 0.5);
};

const shuffle = (matrix) => {
	size = +sizeSelect.value;
	moves = 0;

	createNumbers();
	updateMoves();
	createMatrix(matrix);
	createGrid(matrix);
};

const searchNumber = (matrix, slidingItem) => {
	for (let i = 0; i < size; i++) {
		for (let j = 0; j < size; j++) {
			if (slidingItem === matrix[i][j]) {
				return [i, j];
			}
		}
	}
};

const updateMatrix = (matrix, row, column, shouldRender) => {
	let checkRight;
	let checkLeft;
	let checkTop;
	let checkBottom;

	let currentNumber = matrix[row][column];

	if (column + 1 < size) {
		checkRight = matrix[row][column + 1] === 0;
	}

	if (column > 0) {
		checkLeft = matrix[row][column - 1] === 0;
	}

	if (row > 0) {
		checkTop = matrix[row - 1][column] === 0;
	}

	if (row + 1 < size) {
		checkBottom = matrix[row + 1][column] === 0;
	}

	if (checkRight) {
		matrix[row][column + 1] = currentNumber;
	} else if (checkLeft) {
		matrix[row][column - 1] = currentNumber;
	} else if (checkTop) {
		matrix[row - 1][column] = currentNumber;
	} else if (checkBottom) {
		matrix[row + 1][column] = currentNumber;
	}

	if (checkRight || checkLeft || checkBottom || checkTop) {
		matrix[row][column] = 0;
		moves++;

		if (shouldRender) {
			updateMoves();
			createGrid(matrix);
		}
	}
};

const startSliding = (matrix, slidingItem) => {
	if (slidingItem === 0) return;

	const [row, column] = searchNumber(matrix, slidingItem);
	updateMatrix(matrix, row, column, true);
};

document.addEventListener('DOMContentLoaded', () => {
	sizeSelect = document.querySelector('[data-select]');
	slidingGrid = document.querySelector('[data-grid]');
	resetButton = document.querySelector('[data-shuffle]');
	movesElement = document.querySelector('[data-moves]');

	shuffle(matrix);

	sizeSelect.addEventListener('change', () => {
		shuffle(matrix);
	});

	resetButton.addEventListener('click', () => {
		shuffle(matrix);
	});

	slidingGrid.addEventListener('click', (event) => {
		const slidingItem = event.target.dataset.sliding;

		if (slidingItem) {
			startSliding(matrix, +slidingItem);
		}
	});

	document.querySelector('.solve').addEventListener('click', () => {
		const path = getShortestSteps(matrix);
		console.log(path);
		solve(path);
	});
});

// Tree definition
const goalState = '123456780';

class Node {
	constructor(parentNode, gridState, currentMove) {
		this.parentNode = parentNode;
		this.gridState = gridState;
		this.currentMove = currentMove;
		this.moves = this.parentNode?.moves + 1 || 0;
	}


	getScore() {
		let misplacedCount = 0;
		const flattenedMatrix = [].concat(...this.gridState).join('');

		for (let i = 0; i < goalState.length; i ++) {
			if (flattenedMatrix[i] !== goalState[i] && flattenedMatrix[i] != '0') {
				misplacedCount++;
			}
		}

		return this.moves + misplacedCount;
	}
};

const getMoveableElements = (matrix, excludeElement) => {
	let zeroRow = 0;
	let zeroColumn = 0;
	const moveableElements = [];
	for (let i = 0; i < matrix.length; i ++) {
		let zeroFound = false;
		for (let j = 0; j < matrix[i].length; j ++) {
			if (matrix[i][j] === 0) {
				zeroRow = i;
				zeroColumn = j;
				zeroFound = true;
				break;
			}

			if (zeroFound) {
				break;
			}
		}
	}

	if (zeroColumn + 1 < size && matrix[zeroRow][zeroColumn + 1] !== excludeElement) {
		moveableElements.push({
			row: zeroRow,
			column: zeroColumn + 1,
		});
	}

	if (zeroColumn - 1 >= 0 && matrix[zeroRow][zeroColumn - 1] !== excludeElement) {
		moveableElements.push({
			row: zeroRow,
			column: zeroColumn - 1,
		});
	}

	if (zeroRow - 1 >= 0 && matrix[zeroRow - 1][zeroColumn] !== excludeElement) {
		moveableElements.push({
			row: zeroRow - 1,
			column: zeroColumn,
		});
	}

	if (zeroRow + 1 < size && matrix[zeroRow + 1][zeroColumn] !== excludeElement) {
		moveableElements.push({
			row: zeroRow + 1,
			column: zeroColumn,
		});
	}

	return moveableElements;
};

const getPathToRoot = (node) => {
	const path = [];
	let iterator = node;
	while (iterator != null) {
		path.unshift(iterator.currentMove);
		iterator = iterator.parentNode;
	}

	return path;
};

const stateExists = (matrix) => {
	let isDuplicate = false;
	for (let i = 0; i < states.length; i ++) {
		const flattenedMatrix = [].concat(...matrix).join('');

		if (flattenedMatrix === states[i]) {
			isDuplicate = true;
			break;
		}
	}

	return isDuplicate;
};

// Algorithm to solve the puzzle
const getShortestSteps = (matrix) => {
	const node = new Node(null, matrix, null);
	const queue = [node];

	while(queue.length) {
		const currentNode = queue.shift();
		if (isComplete(currentNode.gridState)) {
			return getPathToRoot(currentNode);
		}
		states.push([].concat(...currentNode.gridState).join(''));
		console.log(currentNode.getScore());
		const moveableElements = getMoveableElements(currentNode.gridState, currentNode.currentMove);

		moveableElements.forEach((element) => {
			const copyMatrix = structuredClone(currentNode.gridState);
			updateMatrix(copyMatrix, element.row, element.column);
			if (!stateExists(copyMatrix)) {
				queue.push(new Node(currentNode, copyMatrix, currentNode.gridState[element.row][element.column]));
			}
		});
		queue.sort((a, b) => a.getScore() - b.getScore());
	}
};

const isComplete = (matrix) => {
	const flattenedMatrix = [].concat(...matrix).join('');
	console.log(flattenedMatrix);

	return flattenedMatrix === '123456780';
};

const solve = (steps) => {
	let index = 0;
	const playingInterval = setInterval(() => {
		document.querySelector(`[data-sliding="${steps[index++]}"]`)?.click();
		if (index === steps.length) {
			clearInterval(playingInterval);
		}
	}, 500);
};
