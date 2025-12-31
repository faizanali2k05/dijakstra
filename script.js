// --- Configuration ---
const ROWS = 15;
const COLS = 25;
const DIAGONAL_COST = Math.SQRT2;

// --- State ---
let grid = []; // 2D array of { row, col, isWall, element }
let startNode = { row: Math.floor(ROWS / 2), col: 3 };
let endNode = { row: Math.floor(ROWS / 2), col: COLS - 4 };

let isMouseDown = false;
let currentTool = "wall";
let placeEndAndRunMode = false;
let isRunning = false;

// --- DOM references ---
const gridElement = document.getElementById("grid");
const algorithmSelect = document.getElementById("algorithmSelect");
const diagonalCheckbox = document.getElementById("diagonalCheckbox");
const speedSlider = document.getElementById("speedSlider");
const runButton = document.getElementById("runButton");
const resetButton = document.getElementById("resetButton");
const placeEndAndRunButton = document.getElementById("placeEndAndRunButton");
const toolRadios = document.querySelectorAll('input[name="tool"]');
const statsElement = document.getElementById("stats");
const distanceTableContainer = document.getElementById("distanceTable");
const predecessorTableContainer = document.getElementById("predecessorTable");

// --- Initialization ---
initGrid();
attachUIEvents();
updateStats("—", "—", "—");

// --- Grid creation ---
function initGrid() {
  gridElement.innerHTML = "";
  grid = [];

  for (let r = 0; r < ROWS; r++) {
    const rowArr = [];
    for (let c = 0; c < COLS; c++) {
      const cell = document.createElement("div");
      cell.className = "cell";
      cell.dataset.row = r;
      cell.dataset.col = c;

      cell.addEventListener("mousedown", handleCellMouseDown);
      cell.addEventListener("mouseenter", handleCellMouseEnter);
      cell.addEventListener("mouseup", handleCellMouseUp);
      cell.addEventListener("dragstart", (e) => e.preventDefault());

      rowArr.push({ row: r, col: c, isWall: false, element: cell });
      gridElement.appendChild(cell);
    }
    grid.push(rowArr);
  }

  markStartEnd();
}

// --- UI events ---
function attachUIEvents() {
  document.addEventListener("mouseup", () => {
    isMouseDown = false;
  });

  runButton.addEventListener("click", () => {
    const algo = algorithmSelect.value; // "dijkstra" or "astar"
    runAlgorithmFromUI(algo);
  });

  resetButton.addEventListener("click", () => {
    if (isRunning) return;
    resetGrid();
    clearTables();
    updateStats("—", "—", "—");
  });

  placeEndAndRunButton.addEventListener("click", () => {
    if (isRunning) return;
    placeEndAndRunMode = true;
    setTool("moveEnd");
    statsElement.textContent =
      "Click on the grid to place the end node, then the selected algorithm will run.";
  });

  toolRadios.forEach((radio) => {
    radio.addEventListener("change", () => {
      if (radio.checked) {
        setTool(radio.value);
        placeEndAndRunMode = false; // cancel special mode if user changes tool
      }
    });
  });
}

// --- Cell mouse handlers ---
function handleCellMouseDown(e) {
  if (isRunning) return;
  if (e.button !== 0) return; // left button only
  isMouseDown = true;

  const cell = e.currentTarget;
  const row = parseInt(cell.dataset.row, 10);
  const col = parseInt(cell.dataset.col, 10);

  applyCurrentTool(row, col);
}

function handleCellMouseEnter(e) {
  if (!isMouseDown || isRunning) return;
  if (currentTool !== "wall") return; // drag only draws walls

  const cell = e.currentTarget;
  const row = parseInt(cell.dataset.row, 10);
  const col = parseInt(cell.dataset.col, 10);
  applyCurrentTool(row, col);
}

function handleCellMouseUp() {
  isMouseDown = false;
}

// --- Tools: walls, move start, move end ---
function applyCurrentTool(row, col) {
  const cellObj = grid[row][col];

  if (currentTool === "wall") {
    if (isStart(row, col) || isEnd(row, col)) return;
    cellObj.isWall = !cellObj.isWall;
    cellObj.element.classList.toggle("wall", cellObj.isWall);
  } else if (currentTool === "moveStart") {
    if (isEnd(row, col)) return;
    setStart(row, col);
  } else if (currentTool === "moveEnd") {
    if (isStart(row, col)) return;
    setEnd(row, col);

    if (placeEndAndRunMode) {
      // Run after user sets end node
      placeEndAndRunMode = false;
      setTool("wall");
      const algo = algorithmSelect.value;
      runAlgorithmFromUI(algo);
    }
  }
}

function setTool(toolValue) {
  currentTool = toolValue;
  toolRadios.forEach((r) => {
    r.checked = r.value === toolValue;
  });
}

function isStart(row, col) {
  return row === startNode.row && col === startNode.col;
}

function isEnd(row, col) {
  return row === endNode.row && col === endNode.col;
}

function markStartEnd() {
  grid[startNode.row][startNode.col].element.classList.add("start");
  grid[endNode.row][endNode.col].element.classList.add("end");
}

function setStart(row, col) {
  clearPathVisualization();
  clearTables();
  updateStats("—", "—", "—");

  grid[startNode.row][startNode.col].element.classList.remove("start");
  const cell = grid[row][col];
  cell.isWall = false;
  cell.element.classList.remove("wall");
  startNode = { row, col };
  cell.element.classList.add("start");
}

function setEnd(row, col) {
  clearPathVisualization();
  clearTables();
  updateStats("—", "—", "—");

  grid[endNode.row][endNode.col].element.classList.remove("end");
  const cell = grid[row][col];
  cell.isWall = false;
  cell.element.classList.remove("wall");
  endNode = { row, col };
  cell.element.classList.add("end");
}

function resetGrid() {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const cellObj = grid[r][c];
      cellObj.isWall = false;
      cellObj.element.className = "cell";
    }
  }
  markStartEnd();
}

function clearPathVisualization() {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const el = grid[r][c].element;
      el.classList.remove("visited", "frontier", "path");
    }
  }
}

function clearTables() {
  distanceTableContainer.innerHTML = "";
  predecessorTableContainer.innerHTML = "";
}

// --- Stats & utility ---
function updateStats(algoLabel, nodesVisited, pathText) {
  statsElement.textContent = `Algorithm: ${algoLabel} | Nodes visited: ${nodesVisited} | Path: ${pathText}`;
}

function getDelay() {
  const v = parseInt(speedSlider.value, 10); // 0..100
  const maxDelay = 500; // ms
  // Map 0..100 to 500..0 ms (slow to fast)
  const delay = Math.round((maxDelay * (100 - v)) / 100);
  return delay;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runAlgorithmFromUI(algo) {
  if (isRunning) return;

  clearPathVisualization();
  clearTables();

  const algoName = algo === "astar" ? "A*" : "Dijkstra's";
  updateStats(`${algoName} (running...)`, 0, "—");

  await runAlgorithm(algo);
}

// --- Algorithm core: Dijkstra & A* ---
function setRunningState(running) {
  isRunning = running;
  runButton.disabled = running;
  resetButton.disabled = running;
  algorithmSelect.disabled = running;
  diagonalCheckbox.disabled = running;
  placeEndAndRunButton.disabled = running;
  toolRadios.forEach((r) => (r.disabled = running));
}

async function runAlgorithm(algo) {
  setRunningState(true);
  isMouseDown = false;

  const allowDiagonal = diagonalCheckbox.checked;

  const dist = Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => Infinity)
  );
  const prev = Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => null)
  );
  const visited = Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => false)
  );

  const queue = []; // simple priority queue (array)

  dist[startNode.row][startNode.col] = 0;
  const startPriority =
    algo === "astar"
      ? heuristic(
          startNode.row,
          startNode.col,
          endNode.row,
          endNode.col,
          allowDiagonal
        )
      : 0;

  queue.push({
    row: startNode.row,
    col: startNode.col,
    priority: startPriority,
  });

  let nodesVisited = 0;

  while (queue.length > 0) {
    const currentIndex = extractMinIndex(queue);
    const current = queue.splice(currentIndex, 1)[0];
    const { row, col } = current;

    if (visited[row][col]) continue;
    visited[row][col] = true;
    nodesVisited++;

    const cellEl = grid[row][col].element;
    if (!isStart(row, col) && !isEnd(row, col)) {
      cellEl.classList.remove("frontier");
      cellEl.classList.add("visited");
    }

    if (row === endNode.row && col === endNode.col) {
      break;
    }

    const delay = getDelay();
    if (delay > 0) {
      await sleep(delay);
    }

    const neighbors = getNeighbors(row, col, allowDiagonal);
    for (const nb of neighbors) {
      const nr = nb.row;
      const nc = nb.col;
      const cost = nb.cost;

      if (grid[nr][nc].isWall || visited[nr][nc]) continue;

      const alt = dist[row][col] + cost;
      if (alt < dist[nr][nc]) {
        dist[nr][nc] = alt;
        prev[nr][nc] = { row, col };

        let priority;
        if (algo === "astar") {
          const h = heuristic(nr, nc, endNode.row, endNode.col, allowDiagonal);
          priority = alt + h;
        } else {
          priority = alt;
        }

        queue.push({ row: nr, col: nc, priority });

        const nbCellEl = grid[nr][nc].element;
        if (
          !isStart(nr, nc) &&
          !isEnd(nr, nc) &&
          !nbCellEl.classList.contains("visited")
        ) {
          nbCellEl.classList.add("frontier");
        }
      }
    }
  }

  const reachedEnd = dist[endNode.row][endNode.col] !== Infinity;
  let pathText;

  if (reachedEnd) {
    const path = reconstructPath(prev, startNode, endNode);

    for (const node of path) {
      const { row, col } = node;
      if (!isStart(row, col) && !isEnd(row, col)) {
        const el = grid[row][col].element;
        el.classList.remove("visited", "frontier");
        el.classList.add("path");
      }
    }

    const length = dist[endNode.row][endNode.col];
    pathText = `length ≈ ${length.toFixed(2)}`;
  } else {
    pathText = "no path found";
  }

  const algoLabel = algo === "astar" ? "A*" : "Dijkstra's";
  updateStats(algoLabel, nodesVisited, pathText);

  renderDistanceTable(dist);
  renderPredecessorTable(prev);

  setRunningState(false);
}

// --- Priority queue helper ---
function extractMinIndex(queue) {
  let bestIndex = 0;
  let bestPriority = queue[0].priority;
  for (let i = 1; i < queue.length; i++) {
    if (queue[i].priority < bestPriority) {
      bestPriority = queue[i].priority;
      bestIndex = i;
    }
  }
  return bestIndex;
}

// --- Neighbors & heuristic ---
function getNeighbors(row, col, allowDiagonal) {
  const neighbors = [];
  const directions4 = [
    { dr: -1, dc: 0, cost: 1 }, // up
    { dr: 1, dc: 0, cost: 1 }, // down
    { dr: 0, dc: -1, cost: 1 }, // left
    { dr: 0, dc: 1, cost: 1 }, // right
  ];
  const directionsDiag = [
    { dr: -1, dc: -1, cost: DIAGONAL_COST },
    { dr: -1, dc: 1, cost: DIAGONAL_COST },
    { dr: 1, dc: -1, cost: DIAGONAL_COST },
    { dr: 1, dc: 1, cost: DIAGONAL_COST },
  ];

  for (const d of directions4) {
    const nr = row + d.dr;
    const nc = col + d.dc;
    if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
      neighbors.push({ row: nr, col: nc, cost: d.cost });
    }
  }

  if (allowDiagonal) {
    for (const d of directionsDiag) {
      const nr = row + d.dr;
      const nc = col + d.dc;
      if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
        neighbors.push({ row: nr, col: nc, cost: d.cost });
      }
    }
  }

  return neighbors;
}

function heuristic(r1, c1, r2, c2, allowDiagonal) {
  const dr = Math.abs(r1 - r2);
  const dc = Math.abs(c1 - c2);

  if (allowDiagonal) {
    // Octile distance: good when diagonal movement is allowed
    const minD = Math.min(dr, dc);
    const maxD = Math.max(dr, dc);
    return (maxD - minD) + DIAGONAL_COST * minD;
  } else {
    // Manhattan distance
    return dr + dc;
  }
}

// --- Path reconstruction ---
function reconstructPath(prev, start, end) {
  const path = [];
  let cur = { row: end.row, col: end.col };

  if (
    prev[cur.row][cur.col] === null &&
    !(cur.row === start.row && cur.col === start.col)
  ) {
    return path; // no path
  }

  while (true) {
    path.push({ row: cur.row, col: cur.col });
    if (cur.row === start.row && cur.col === start.col) break;
    const p = prev[cur.row][cur.col];
    if (!p) break;
    cur = { row: p.row, col: p.col };
  }

  path.reverse();
  return path;
}

// --- Table rendering ---
function renderDistanceTable(dist) {
  const table = document.createElement("table");

  const headerRow = document.createElement("tr");
  const cornerTh = document.createElement("th");
  cornerTh.textContent = "r\\c";
  headerRow.appendChild(cornerTh);

  for (let c = 0; c < COLS; c++) {
    const th = document.createElement("th");
    th.textContent = c;
    headerRow.appendChild(th);
  }
  table.appendChild(headerRow);

  for (let r = 0; r < ROWS; r++) {
    const tr = document.createElement("tr");
    const rowHeader = document.createElement("th");
    rowHeader.textContent = r;
    tr.appendChild(rowHeader);

    for (let c = 0; c < COLS; c++) {
      const td = document.createElement("td");
      const d = dist[r][c];
      td.textContent = d === Infinity ? "∞" : d.toFixed(1);
      tr.appendChild(td);
    }

    table.appendChild(tr);
  }

  distanceTableContainer.innerHTML = "";
  distanceTableContainer.appendChild(table);
}

function renderPredecessorTable(prev) {
  const table = document.createElement("table");

  const headerRow = document.createElement("tr");
  const cornerTh = document.createElement("th");
  cornerTh.textContent = "r\\c";
  headerRow.appendChild(cornerTh);

  for (let c = 0; c < COLS; c++) {
    const th = document.createElement("th");
    th.textContent = c;
    headerRow.appendChild(th);
  }
  table.appendChild(headerRow);

  for (let r = 0; r < ROWS; r++) {
    const tr = document.createElement("tr");
    const rowHeader = document.createElement("th");
    rowHeader.textContent = r;
    tr.appendChild(rowHeader);

    for (let c = 0; c < COLS; c++) {
      const td = document.createElement("td");
      const p = prev[r][c];
      td.textContent = p ? `${p.row},${p.col}` : "-";
      tr.appendChild(td);
    }

    table.appendChild(tr);
  }

  predecessorTableContainer.innerHTML = "";
  predecessorTableContainer.appendChild(table);
}