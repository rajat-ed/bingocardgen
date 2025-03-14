const { jsPDF } = window.jspdf;

let items = [];
let calledItems = [];

const colorPalette = [
    '#a7f3d0', '#bae6fd', '#d8b4fe', '#fdd0a2', '#f4d03f',
    '#90cdf4', '#feb2b2', '#c4b5fd', '#b5f5ec', '#f9e2af',
    '#81e6d9', '#f0bbdd', '#a3e635', '#fbd38d', '#bef264'
];

function updateItemCountAndLayouts() {
    const itemsInput = document.getElementById('itemsInput');
    const itemCountSpan = document.getElementById('itemCount');
    const suggestedLayoutsDiv = document.getElementById('suggestedLayouts');
    const items = itemsInput.value.split(',').map(item => item.trim()).filter(item => item.length > 0);
    const itemCount = items.length;
    itemCountSpan.textContent = `Item count: ${itemCount}`;

    suggestedLayoutsDiv.innerHTML = '';
    if (itemCount > 0) {
        const possibleLayouts = [];
        for (let rows = 4; rows <= 7; rows++) {
            for (let cols = 4; cols <= 7; cols++) {
                const slots = rows * cols;
                if (itemCount >= slots && itemCount <= 100) {
                    possibleLayouts.push({ rows, cols, slots });
                }
            }
        }
        if (possibleLayouts.length > 0) {
            suggestedLayoutsDiv.innerHTML = 'Suggested layouts: ';
            possibleLayouts.sort((a, b) => Math.abs(a.rows - a.cols) - Math.abs(b.rows - b.cols));
            possibleLayouts.slice(0, 4).forEach(layout => {
                const span = document.createElement('span');
                span.textContent = `${layout.rows}x${layout.cols} (${layout.slots})`;
                span.onclick = () => {
                    document.getElementById('rows').value = layout.rows;
                    document.getElementById('cols').value = layout.cols;
                };
                suggestedLayoutsDiv.appendChild(span);
            });
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    updateItemCountAndLayouts();
    document.getElementById('itemsInput').addEventListener('input', updateItemCountAndLayouts);
});

document.getElementById('bingoForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const title = document.getElementById('titleInput').value.trim();
    items = document.getElementById('itemsInput').value.split(',').map(item => item.trim()).filter(item => item);
    const rows = parseInt(document.getElementById('rows').value);
    const cols = parseInt(document.getElementById('cols').value);
    const numCards = parseInt(document.getElementById('numCards').value);
    const totalSlots = rows * cols;

    if (items.length > 100) {
        alert('Max 100 items allowed!');
        return;
    }

    if (items.length < totalSlots) {
        alert(`Please provide at least ${totalSlots} items for a ${rows}x${cols} grid!`);
        return;
    }

    const cardsContainer = document.getElementById('cardsContainer');
    cardsContainer.innerHTML = '';
    const allCards = generateAllCards(items, totalSlots, numCards);
    
    allCards.forEach((cardItems, i) => {
        let card = renderCard(cardItems, rows, cols, i);
        cardsContainer.appendChild(card);
    });

    const downloadBtn = document.getElementById('downloadBtn');
    downloadBtn.style.display = 'block';
    downloadBtn.onclick = () => downloadCardsAsPDF(allCards, rows, cols, items, title);

    startBingo();
});

function generateAllCards(items, totalSlots, numCards) {
    const allCards = [];
    const itemUsage = new Map(items.map(item => [item, 0]));

    for (let i = 0; i < numCards; i++) {
        let cardItems = generateCardItems(items, totalSlots);
        allCards.push(cardItems);
        cardItems.forEach(item => itemUsage.set(item, itemUsage.get(item) + 1));
    }

    const unusedItems = [...itemUsage.entries()]
        .filter(([_, count]) => count === 0)
        .map(([item]) => item);

    if (unusedItems.length > 0) {
        let cardsToAdjust = Math.min(unusedItems.length, numCards);
        for (let i = 0; i < cardsToAdjust; i++) {
            let cardItems = allCards[i];
            for (let j = 0; j < Math.min(unusedItems.length, totalSlots); j++) {
                if (unusedItems[j]) {
                    const replaceIndex = Math.floor(Math.random() * totalSlots);
                    const oldItem = cardItems[replaceIndex];
                    cardItems[replaceIndex] = unusedItems[j];
                    itemUsage.set(oldItem, itemUsage.get(oldItem) - 1);
                    itemUsage.set(unusedItems[j], itemUsage.get(unusedItems[j]) + 1);
                    unusedItems.splice(j, 1);
                    j--;
                }
            }
            allCards[i] = cardItems;
        }
    }

    return allCards;
}

function generateCardItems(items, totalSlots) {
    let cardItems = [...items];
    shuffleArray(cardItems);
    return cardItems.slice(0, totalSlots);
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function renderCard(items, rows, cols, index) {
    const card = document.createElement('div');
    card.className = 'bingo-card';
    card.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    card.style.width = `${cols * 70}px`;
    items.forEach(item => {
        const cell = document.createElement('div');
        cell.textContent = item;
        card.appendChild(cell);
    });
    const branding = document.createElement('div');
    branding.className = 'branding';
    branding.textContent = 'From Bingo Card Gen by Rajat';
    card.appendChild(branding);
    return card;
}

function downloadCardsAsPDF(cards, rows, cols, items, title) {
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    doc.setFont('helvetica', 'normal');

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 10;
    const cardWidth = pageWidth - 2 * margin;
    const cellSize = cardWidth / cols;
    const titleHeight = 10;
    const brandingHeight = 8;
    const cardHeight = rows * cellSize + titleHeight + brandingHeight;

    const longestWord = items.reduce((a, b) => a.length > b.length ? a : b, '');
    const maxWidth = cellSize - 4;
    const baseFontSize = 12;
    const longestWordLength = longestWord.length;
    let fontSize = Math.min(baseFontSize, Math.floor(maxWidth * 10 / longestWordLength));
    fontSize = Math.max(6, Math.min(12, fontSize));

    doc.setFontSize(fontSize);
    doc.setLineWidth(0.5);

    cards.forEach((cardItems, index) => {
        if (index > 0) doc.addPage();

        const y = margin;

        doc.setFontSize(16);
        doc.text(title || 'Bingo Card', pageWidth / 2, y + 5, { align: 'center' });
        doc.setFontSize(fontSize);

        const cardY = y + titleHeight;
        doc.rect(margin, cardY, cardWidth, rows * cellSize, 'S');

        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                const item = cardItems[i * cols + j];
                const cellX = margin + j * cellSize;
                const cellY = cardY + i * cellSize;
                doc.rect(cellX, cellY, cellSize, cellSize);

                const lines = doc.splitTextToSize(item, maxWidth);
                const lineHeight = fontSize / 3;
                const textY = cellY + (cellSize - (lines.length * lineHeight)) / 2 + lineHeight;
                doc.text(lines, cellX + cellSize / 2, textY, { align: 'center' });
            }
        }

        doc.setFontSize(Math.max(4, fontSize - 3));
        doc.text('From Bingo Card Gen by Rajat', pageWidth - margin - 2, cardY + rows * cellSize + 6, { align: 'right' });
        doc.setFontSize(fontSize);
    });

    doc.save('bingo_cards.pdf');
}

function startBingo() {
    calledItems = [];
    updateCalledList();
    document.getElementById('currentItem').textContent = '-';
    hideGameOver();
    document.getElementById('nextBtn').onclick = callNext;
}

function callNext() {
    if (items.length === 0 && calledItems.length > 0) {
        showGameOver();
        return;
    }
    if (items.length === 0) {
        alert('No items to call!');
        return;
    }

    const randomIndex = Math.floor(Math.random() * items.length);
    const calledItem = items[randomIndex];
    calledItems.push(calledItem);
    items.splice(randomIndex, 1);

    document.getElementById('currentItem').textContent = calledItem;
    updateCalledList();

    if (items.length === 0) {
        showGameOver();
    }
}

function updateCalledList() {
    const calledList = document.getElementById('usedWordsList');
    calledList.innerHTML = '';
    calledItems.forEach((item, index) => {
        const span = document.createElement('span');
        span.textContent = item;
        span.style.backgroundColor = colorPalette[index % colorPalette.length];
        calledList.appendChild(span);
    });
}

function resetBingo() {
    items = document.getElementById('itemsInput').value.split(',').map(item => item.trim()).filter(item => item);
    calledItems = [];
    document.getElementById('currentItem').textContent = '-';
    updateCalledList();
    hideGameOver();
}

function showGameOver() {
    const gameOver = document.getElementById('gameOver');
    gameOver.style.display = 'flex';
    launchConfetti();
}

function hideGameOver() {
    const gameOver = document.getElementById('gameOver');
    gameOver.style.display = 'none';
}

function launchConfetti() {
    const duration = 5 * 1000;
    const end = Date.now() + duration;

    (function frame() {
        confetti({
            particleCount: 3,
            angle: 60,
            spread: 55,
            origin: { x: 0 }
        });
        confetti({
            particleCount: 3,
            angle: 120,
            spread: 55,
            origin: { x: 1 }
        });

        if (Date.now() < end) {
            requestAnimationFrame(frame);
        }
    })();
}
