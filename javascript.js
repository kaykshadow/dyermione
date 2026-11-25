// =====================================
// SELETOR DE MIN-HEAP E MAX-HEAP (INDEX.HTML)
// =====================================

const heapButtons = document.querySelectorAll(".heap-btn[data-heap]");
const heapTitle = document.getElementById("heap-title");
const heapText = document.getElementById("heap-text");
const heapRule = document.getElementById("heap-rule");

const heapTypes = {
    min: {
        title: "Min-Heap",
        text: "O nó pai deve possuir uma prioridade menor ou igual à de seus filhos. Portanto, a menor prioridade fica no topo da árvore.",
        rule: "Pai ≤ Filhos"
    },
    max: {
        title: "Max-Heap",
        text: "O nó pai deve possuir uma prioridade maior ou igual à de seus filhos. Portanto, a maior prioridade fica no topo da árvore.",
        rule: "Pai ≥ Filhos"
    }
};

if (heapButtons.length && heapTitle && heapText && heapRule) {
    heapButtons.forEach((button) => {
        button.setAttribute("aria-pressed", button.classList.contains("active") ? "true" : "false");

        button.addEventListener("click", () => {
            const information = heapTypes[button.dataset.heap];
            if (!information) return;

            heapTitle.textContent = information.title;
            heapText.textContent = information.text;
            heapRule.textContent = information.rule;

            heapButtons.forEach((otherButton) => {
                const isSelected = otherButton === button;
                otherButton.classList.toggle("active", isSelected);
                otherButton.setAttribute("aria-pressed", String(isSelected));
            });
        });
    });
}


// =====================================
// SIMULADOR INTERATIVO DA TREAP (INTERACAO.HTML)
// =====================================

const treapSvg = document.getElementById("treap-svg");

if (treapSvg) {
    class TreapNode {
        constructor(key, priority = null) {
            this.key = key;
            this.priority = priority === null
                ? Math.floor(Math.random() * 999) + 1
                : priority;
            this.left = null;
            this.right = null;
        }
    }

    let heapMode = "min";
    let root = null;
    let splitLeftRoot = null;
    let splitRightRoot = null;
    let highlightedKey = null;
    let rotationLogBuffer = [];

    function better(a, b) {
        return heapMode === "min" ? a < b : a > b;
    }

    function rotateRight(y) {
        const x = y.left;
        y.left = x.right;
        x.right = y;
        rotationLogBuffer.push(`rotate_right(${y.key})`);
        return x;
    }

    function rotateLeft(x) {
        const y = x.right;
        x.right = y.left;
        y.left = x;
        rotationLogBuffer.push(`rotate_left(${x.key})`);
        return y;
    }

    function searchNode(node, key) {
        let current = node;
        while (current !== null) {
            if (key === current.key) return current;
            current = key < current.key ? current.left : current.right;
        }
        return null;
    }

    function insertNode(node, key, priority = null) {
        if (node === null) {
            return new TreapNode(key, priority);
        }
        if (key === node.key) {
            return node;
        }

        if (key < node.key) {
            node.left = insertNode(node.left, key, priority);
            if (better(node.left.priority, node.priority)) {
                node = rotateRight(node);
            }
        } else {
            node.right = insertNode(node.right, key, priority);
            if (better(node.right.priority, node.priority)) {
                node = rotateLeft(node);
            }
        }
        return node;
    }

    function removeNode(node, key) {
        if (node === null) return null;

        if (key < node.key) {
            node.left = removeNode(node.left, key);
        } else if (key > node.key) {
            node.right = removeNode(node.right, key);
        } else {
            if (node.left === null) return node.right;
            if (node.right === null) return node.left;

            if (better(node.left.priority, node.right.priority)) {
                node = rotateRight(node);
                node.right = removeNode(node.right, key);
            } else {
                node = rotateLeft(node);
                node.left = removeNode(node.left, key);
            }
        }
        return node;
    }

    function splitTreap(node, key) {
        if (node === null) return [null, null];

        if (node.key <= key) {
            const [left, right] = splitTreap(node.right, key);
            node.right = left;
            return [node, right];
        } else {
            const [left, right] = splitTreap(node.left, key);
            node.left = right;
            return [left, node];
        }
    }

    function mergeTreaps(a, b) {
        if (a === null) return b;
        if (b === null) return a;

        if (better(a.priority, b.priority)) {
            a.right = mergeTreaps(a.right, b);
            return a;
        } else {
            b.left = mergeTreaps(a, b.left);
            return b;
        }
    }

    function isValidTreap(node, lo = -Infinity, hi = Infinity) {
        if (node === null) return true;
        if (!(lo < node.key && node.key < hi)) return false;

        for (const child of [node.left, node.right]) {
            if (child !== null && better(child.priority, node.priority)) {
                return false;
            }
        }
        return isValidTreap(node.left, lo, node.key) && isValidTreap(node.right, node.key, hi);
    }

    function getInorder(node, result = []) {
        if (node === null) return result;
        getInorder(node.left, result);
        result.push(node.key);
        getInorder(node.right, result);
        return result;
    }

    function getNodesWithPriorities(node, result = []) {
        if (node === null) return result;
        getNodesWithPriorities(node.left, result);
        result.push({ key: node.key, priority: node.priority });
        getNodesWithPriorities(node.right, result);
        return result;
    }

    function getHeight(node) {
        if (node === null) return 0;
        return 1 + Math.max(getHeight(node.left), getHeight(node.right));
    }

    function countNodes(node) {
        if (node === null) return 0;
        return 1 + countNodes(node.left) + countNodes(node.right);
    }

    const feedbackEl = document.getElementById("sim-feedback");
    const metricCountEl = document.getElementById("metric-count");
    const metricHeightEl = document.getElementById("metric-height");
    const metricValidEl = document.getElementById("metric-valid");
    const metricInorderEl = document.getElementById("metric-inorder");
    const executionLogEl = document.getElementById("execution-log");

    const formInsert = document.getElementById("form-insert");
    const inputInsertKey = document.getElementById("insert-key");
    const inputInsertPriority = document.getElementById("insert-priority");
    const inputActionKey = document.getElementById("action-key");

    const btnSearch = document.getElementById("btn-search");
    const btnRemove = document.getElementById("btn-remove");
    const btnPresetDefault = document.getElementById("btn-preset-default");
    const btnRandomNode = document.getElementById("btn-random-node");
    const btnClear = document.getElementById("btn-clear");
    const btnClearLog = document.getElementById("btn-clear-log");

    const inputSplitKey = document.getElementById("split-key");
    const btnSplit = document.getElementById("btn-split");
    const btnMerge = document.getElementById("btn-merge");
    const splitPreviewGrid = document.getElementById("split-preview-grid");
    const splitLeftSvg = document.getElementById("split-left-svg");
    const splitRightSvg = document.getElementById("split-right-svg");
    const splitLeftInorderEl = document.getElementById("split-left-inorder");
    const splitRightInorderEl = document.getElementById("split-right-inorder");

    const simHeapButtons = document.querySelectorAll(".heap-btn[data-sim-heap]");

    function setFeedback(message, type = "info") {
        feedbackEl.textContent = message;
        feedbackEl.className = "sim-feedback";
        if (type === "success") feedbackEl.classList.add("success");
        if (type === "error") feedbackEl.classList.add("error");
    }

    function addLog(message, type = "info") {
        const li = document.createElement("li");
        const now = new Date().toLocaleTimeString("pt-BR", { hour12: false });
        li.textContent = `[${now}] ${message}`;
        if (type === "warn") li.classList.add("log-warn");
        if (type === "ok") li.classList.add("log-ok");
        executionLogEl.prepend(li);
    }

    function renderTreeToSvg(svgElement, treeRoot, highlight = null) {
        svgElement.innerHTML = "";

        if (!treeRoot) {
            svgElement.setAttribute("width", "360");
            svgElement.setAttribute("height", "160");
            svgElement.setAttribute("viewBox", "0 0 360 160");

            const emptyText = document.createElementNS("http://www.w3.org/2000/svg", "text");
            emptyText.setAttribute("x", "180");
            emptyText.setAttribute("y", "85");
            emptyText.setAttribute("text-anchor", "middle");
            emptyText.setAttribute("fill", "#a0aec0");
            emptyText.setAttribute("font-size", "14");
            emptyText.textContent = "Árvore vazia (None)";
            svgElement.appendChild(emptyText);
            return;
        }

        const positions = new Map();
        let xIndex = 0;
        const horizontalSpacing = 76;
        const verticalSpacing = 92;
        const paddingX = 65;
        const paddingY = 55;

        function computeCoords(node, depth) {
            if (!node) return;
            computeCoords(node.left, depth + 1);
            positions.set(node, {
                x: paddingX + xIndex * horizontalSpacing,
                y: paddingY + depth * verticalSpacing
            });
            xIndex++;
            computeCoords(node.right, depth + 1);
        }

        computeCoords(treeRoot, 0);

        const totalNodes = xIndex;
        const treeDepth = getHeight(treeRoot);
        const width = Math.max(420, paddingX * 2 + (totalNodes - 1) * horizontalSpacing);
        const height = Math.max(220, paddingY * 2 + (treeDepth - 1) * verticalSpacing);

        svgElement.setAttribute("width", String(width));
        svgElement.setAttribute("height", String(height));
        svgElement.setAttribute("viewBox", `0 0 ${width} ${height}`);

        function drawEdges(node) {
            if (!node) return;
            const parentPos = positions.get(node);

            for (const child of [node.left, node.right]) {
                if (child) {
                    const childPos = positions.get(child);
                    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
                    line.setAttribute("x1", String(parentPos.x));
                    line.setAttribute("y1", String(parentPos.y));
                    line.setAttribute("x2", String(childPos.x));
                    line.setAttribute("y2", String(childPos.y));
                    line.setAttribute("stroke", "#45a9ff");
                    line.setAttribute("stroke-opacity", "0.55");
                    line.setAttribute("stroke-width", "2");
                    svgElement.appendChild(line);
                    drawEdges(child);
                }
            }
        }

        function drawNodes(node) {
            if (!node) return;
            const pos = positions.get(node);
            const isRoot = node === treeRoot;
            const isHighlighted = highlight !== null && node.key === highlight;

            const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
            group.setAttribute("transform", `translate(${pos.x}, ${pos.y})`);
            group.style.cursor = "pointer";
            group.addEventListener("click", () => {
                inputActionKey.value = node.key;
                inputSplitKey.value = node.key;
            });

            let strokeColor = "#a78bfa";
            let fillColor = "#192237";
            if (isRoot) strokeColor = "#45a9ff";
            if (isHighlighted) {
                strokeColor = "#65dca5";
                fillColor = "#17332b";
            }

            const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            rect.setAttribute("x", "-34");
            rect.setAttribute("y", "-25");
            rect.setAttribute("width", "68");
            rect.setAttribute("height", "50");
            rect.setAttribute("rx", "10");
            rect.setAttribute("fill", fillColor);
            rect.setAttribute("stroke", strokeColor);
            rect.setAttribute("stroke-width", isHighlighted || isRoot ? "2.5" : "2");

            const keyText = document.createElementNS("http://www.w3.org/2000/svg", "text");
            keyText.setAttribute("x", "0");
            keyText.setAttribute("y", "-3");
            keyText.setAttribute("text-anchor", "middle");
            keyText.setAttribute("fill", "#ffffff");
            keyText.setAttribute("font-size", "16");
            keyText.setAttribute("font-weight", "800");
            keyText.textContent = String(node.key);

            const prioText = document.createElementNS("http://www.w3.org/2000/svg", "text");
            prioText.setAttribute("x", "0");
            prioText.setAttribute("y", "15");
            prioText.setAttribute("text-anchor", "middle");
            prioText.setAttribute("fill", "#a0aec0");
            prioText.setAttribute("font-size", "11");
            prioText.textContent = `p=${node.priority}`;

            group.appendChild(rect);
            group.appendChild(keyText);
            group.appendChild(prioText);
            svgElement.appendChild(group);

            drawNodes(node.left);
            drawNodes(node.right);
        }

        drawEdges(treeRoot);
        drawNodes(treeRoot);
    }

    function updateUI() {
        const n = countNodes(root);
        const h = getHeight(root);
        const valid = isValidTreap(root);
        const inorderList = getInorder(root);

        metricCountEl.textContent = String(n);
        metricHeightEl.textContent = String(h);
        metricInorderEl.textContent = `[${inorderList.join(", ")}]`;

        if (valid) {
            metricValidEl.textContent = "✓ Válida (BST + Heap)";
            metricValidEl.className = "status-ok";
        } else {
            metricValidEl.textContent = "✗ Inválida";
            metricValidEl.className = "status-warn";
        }

        renderTreeToSvg(treapSvg, root, highlightedKey);
    }

    function resetSplitState() {
        splitLeftRoot = null;
        splitRightRoot = null;
        splitPreviewGrid.hidden = true;
        btnMerge.disabled = true;
    }

    formInsert.addEventListener("submit", (e) => {
        e.preventDefault();
        if (!splitPreviewGrid.hidden) {
            setFeedback("Execute Merge(L, R) antes de inserir novos nós na árvore principal.", "error");
            return;
        }

        const key = Number(inputInsertKey.value);
        if (Number.isNaN(key)) return;

        if (searchNode(root, key) !== null) {
            highlightedKey = key;
            updateUI();
            setFeedback(`A chave ${key} já existe na Treap (chaves repetidas são ignoradas).`, "error");
            addLog(`insert(${key}) ignorado — chave já existente.`, "warn");
            return;
        }

        const rawPriority = inputInsertPriority.value.trim();
        const priority = rawPriority === "" ? null : Number(rawPriority);

        rotationLogBuffer = [];
        root = insertNode(root, key, priority);
        const inserted = searchNode(root, key);
        highlightedKey = key;

        const rotInfo = rotationLogBuffer.length
            ? ` | Rotações: ${rotationLogBuffer.join(" → ")}`
            : " | Nenhuma rotação necessária";

        setFeedback(`Nó (key=${key}, priority=${inserted.priority}) inserido com sucesso.${rotInfo}`, "success");
        addLog(`insert(key=${key}, p=${inserted.priority})${rotInfo}`, "ok");

        inputInsertKey.value = "";
        inputInsertPriority.value = "";
        updateUI();
    });

    btnSearch.addEventListener("click", () => {
        const key = Number(inputActionKey.value);
        if (inputActionKey.value.trim() === "" || Number.isNaN(key)) {
            setFeedback("Informe uma chave numérica para buscar.", "error");
            return;
        }

        const found = searchNode(root, key);
        if (found) {
            highlightedKey = found.key;
            updateUI();
            setFeedback(`Busca por ${key}: encontrado (prioridade p=${found.priority}).`, "success");
            addLog(`search(${key}) -> encontrado (p=${found.priority})`, "ok");
        } else {
            highlightedKey = null;
            updateUI();
            setFeedback(`Busca por ${key}: não encontrado na Treap.`, "error");
            addLog(`search(${key}) -> None (não encontrado)`, "warn");
        }
    });

    btnRemove.addEventListener("click", () => {
        if (!splitPreviewGrid.hidden) {
            setFeedback("Execute Merge(L, R) antes de remover nós da árvore principal.", "error");
            return;
        }

        const key = Number(inputActionKey.value);
        if (inputActionKey.value.trim() === "" || Number.isNaN(key)) {
            setFeedback("Informe uma chave numérica para remover.", "error");
            return;
        }

        if (searchNode(root, key) === null) {
            setFeedback(`Chave ${key} não encontrada para remoção.`, "error");
            addLog(`remove(${key}) falhou — chave inexistente.`, "warn");
            return;
        }

        rotationLogBuffer = [];
        root = removeNode(root, key);
        highlightedKey = null;

        const rotInfo = rotationLogBuffer.length
            ? ` | Rotações: ${rotationLogBuffer.join(" → ")}`
            : "";

        setFeedback(`Nó com chave ${key} removido.${rotInfo}`, "success");
        addLog(`remove(${key})${rotInfo}`, "ok");
        inputActionKey.value = "";
        updateUI();
    });

    btnSplit.addEventListener("click", () => {
        if (!root) {
            setFeedback("A árvore está vazia. Insira elementos antes de executar Split.", "error");
            return;
        }
        const k = Number(inputSplitKey.value);
        if (inputSplitKey.value.trim() === "" || Number.isNaN(k)) {
            setFeedback("Informe uma chave de corte k para executar split(root, k).", "error");
            return;
        }

        const [leftTree, rightTree] = splitTreap(root, k);
        splitLeftRoot = leftTree;
        splitRightRoot = rightTree;
        root = null;
        highlightedKey = null;

        splitPreviewGrid.hidden = false;
        btnMerge.disabled = false;

        splitLeftInorderEl.textContent = `[${getInorder(splitLeftRoot).join(", ")}]`;
        splitRightInorderEl.textContent = `[${getInorder(splitRightRoot).join(", ")}]`;

        renderTreeToSvg(splitLeftSvg, splitLeftRoot);
        renderTreeToSvg(splitRightSvg, splitRightRoot);
        updateUI();

        setFeedback(`Split(${k}) concluído! Árvore dividida em subárvore ≤ ${k} e subárvore > ${k}.`, "success");
        addLog(`left, right = split(root, ${k})`, "ok");
    });

    btnMerge.addEventListener("click", () => {
        root = mergeTreaps(splitLeftRoot, splitRightRoot);
        resetSplitState();
        updateUI();

        setFeedback("Merge(left, right) concluído! Subárvores reunificadas mantendo BST + Heap.", "success");
        addLog("root = merge(left, right)", "ok");
    });

    simHeapButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
            const newMode = btn.dataset.simHeap;
            if (newMode === heapMode) return;

            if (!splitPreviewGrid.hidden) {
                root = mergeTreaps(splitLeftRoot, splitRightRoot);
                resetSplitState();
            }

            heapMode = newMode;
            simHeapButtons.forEach((b) => {
                const active = b === btn;
                b.classList.toggle("active", active);
                b.setAttribute("aria-pressed", String(active));
            });

            const existingNodes = getNodesWithPriorities(root);
            root = null;
            rotationLogBuffer = [];
            for (const item of existingNodes) {
                root = insertNode(root, item.key, item.priority);
            }

            highlightedKey = null;
            updateUI();
            const label = heapMode === "min" ? "Min-Heap (a < b)" : "Max-Heap (a > b)";
            setFeedback(`Modo alterado para ${label}. Árvore reorganizada.`, "info");
            addLog(`Modo alterado para ${label}`);
        });
    });

    function loadDefaultPreset() {
        resetSplitState();
        root = null;
        highlightedKey = null;
        rotationLogBuffer = [];
        const defaultKeys = [10, 20, 30, 40, 50, 60, 70, 80];
        for (const k of defaultKeys) {
            root = insertNode(root, k);
        }
        updateUI();
        setFeedback("Exemplo padrão do treap.py carregado: chaves (10, 20, 30, 40, 50, 60, 70, 80).", "info");
        addLog("Preset treap.py carregado: [10..80]");
    }

    btnPresetDefault.addEventListener("click", loadDefaultPreset);

    btnRandomNode.addEventListener("click", () => {
        if (!splitPreviewGrid.hidden) {
            setFeedback("Execute Merge(L, R) antes de adicionar nós aleatórios.", "error");
            return;
        }

        let candidate = Math.floor(Math.random() * 99) + 1;
        let attempts = 0;
        while (searchNode(root, candidate) !== null && attempts < 100) {
            candidate = Math.floor(Math.random() * 99) + 1;
            attempts++;
        }

        rotationLogBuffer = [];
        root = insertNode(root, candidate);
        const node = searchNode(root, candidate);
        highlightedKey = candidate;
        updateUI();

        setFeedback(`Nó aleatório inserido: key=${candidate}, priority=${node.priority}.`, "success");
        addLog(`insert(key=${candidate}, p=${node.priority}) [aleatório]`, "ok");
    });

    btnClear.addEventListener("click", () => {
        resetSplitState();
        root = null;
        highlightedKey = null;
        updateUI();
        setFeedback("Árvore limpa (root = None).", "info");
        addLog("Árvore limpa (root = None)");
    });

    btnClearLog.addEventListener("click", () => {
        executionLogEl.innerHTML = "";
    });

    loadDefaultPreset();
}
