const { jsPDF } = window.jspdf;

document.getElementById('bingoForm').addEventListener('submit', function(e) {
  e.preventDefault();

  const title = document.getElementById('titleInput').value.trim();
  const items = document.getElementById('itemsInput').value.split(',').map(item => item.trim()).filter(item => item);
  const rows = parseInt(document.getElementById('rows').value);
  const cols = parseInt(document.getElementById('cols').value);
  const numCards = parseInt(document.getElementById('numCards').value);
  const totalSlots = rows * cols;

  if (items.length > 100) {
    alert('Max 100 items allowed!');
    return;
  }

  const cardsContainer = document.getElementById('cardsContainer');
  cardsContainer.innerHTML = '';
  const allCards = [];
  for (let i = 0; i < numCards; i++) {
    let cardItems = generateCardItems(items, totalSlots, rows, cols);
    let card = renderCard(cardItems, rows, cols, i);
    cardsContainer.appendChild(card);
    allCards.push(cardItems);
  }

  const downloadBtn = document.getElementById('downloadBtn');
  downloadBtn.style.display = 'block';
  downloadBtn.onclick = () => downloadCardsAsPDF(allCards, rows, cols, items, title);

  setupGameplay(items);
});

function generateCardItems(items, totalSlots, rows, cols) {
  let cardItems = [...items];
  if (cardItems.length < totalSlots) {
    cardItems.push('FREE');
    while (cardItems.length < totalSlots) {
      cardItems = cardItems.concat(items);
    }
  }
  cardItems = cardItems.slice(0, totalSlots);
  shuffleArray(cardItems);

  if (rows % 2 === 1 && cols % 2 === 1 && cardItems.includes('FREE')) {
    const centerIndex = Math.floor(totalSlots / 2);
    const freeIndex = cardItems.indexOf('FREE');
    [cardItems[centerIndex], cardItems[freeIndex]] = [cardItems[freeIndex], cardItems[centerIndex]];
  }
  return cardItems;
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

function setupGameplay(items) {
  let shuffledItems = [...items];
  shuffleArray(shuffledItems);
  let index = 0;
  const bingoCage = document.getElementById('bingoCage');
  const currentItemDiv = document.getElementById('currentItem');
  const nextBtn = document.getElementById('nextBtn');
  const usedWordsList = document.getElementById('usedWordsList');

  nextBtn.onclick = () => {
    if (index < shuffledItems.length) {
      bingoCage.className = 'spinning';
      currentItemDiv.textContent = '';
      currentItemDiv.className = '';

      setTimeout(() => {
        bingoCage.className = '';
        currentItemDiv.textContent = shuffledItems[index];
        currentItemDiv.className = 'reveal';

        // Add to used words list horizontally
        const span = document.createElement('span');
        span.textContent = shuffledItems[index];
        usedWordsList.appendChild(span);

        index++;
      }, 1500);
    } else {
      currentItemDiv.textContent = 'Game Over!';
      currentItemDiv.className = 'reveal';
    }
  };
}