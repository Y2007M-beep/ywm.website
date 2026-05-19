const suits = ["Diamonds", "Hearts", "Clubs", "Spades"];
const ranks = [
  "A",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "J",
  "Q",
  "K",
];

function assetPath(...parts) {
  const p = parts.join("/");
  return encodeURI(p);
}

const backCoverPath = "./Pomegranate.png";
const assetBase = ["..", "Cards", "Flat Playing Cards Set"];

let deck = [];
let playerHand = [];
let dealerHand = [];
let hideDealerHole = true;

const playerCardsEl = document.getElementById("player-cards");
const dealerCardsEl = document.getElementById("dealer-cards");
const playerScoreEl = document.getElementById("player-score");
const dealerScoreEl = document.getElementById("dealer-score");
const resultEl = document.getElementById("result");

const hitBtn = document.getElementById("hit-button");
const standBtn = document.getElementById("stand-button");
const restartBtn = document.getElementById("restart-button");

function buildDeck() {
  const d = [];
  for (const s of suits) {
    for (const r of ranks) {
      // prefer local images in the E5-blackjack folder named like sA.png, h10.png, cK.png, d3.png
      const suitLetter = s[0].toLowerCase(); // Diamonds->d, Hearts->h, Clubs->c, Spades->s
      const fileName = `${suitLetter}${r}.png`;
      // local path (same folder as index.html)
      const localPath = `./${fileName}`;
      // fallback to packaged set if local not present (keeps original structure)
      const packagedPath = assetPath(...assetBase, s, `${r}.png`);
      // Use local path first (browser will load it if present), otherwise packagedPath will work when available.
      d.push({ rank: r, suit: s, img: localPath, fallback: packagedPath });
    }
  }
  return d;
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function startGame() {
  deck = buildDeck();
  shuffle(deck);
  playerHand = [];
  dealerHand = [];
  hideDealerHole = true;
  resultEl.textContent = "";
  hitBtn.disabled = true;
  standBtn.disabled = true;
  playerCardsEl.innerHTML = "";
  dealerCardsEl.innerHTML = "";

  // Deal sequence: player, dealer(hole), player, dealer(face)
  await dealCardTo(playerCardsEl, playerHand, drawCard(), true);
  await sleep(160);
  await dealCardTo(dealerCardsEl, dealerHand, drawCard(), false); // hole card
  await sleep(160);
  await dealCardTo(playerCardsEl, playerHand, drawCard(), true);
  await sleep(160);
  await dealCardTo(dealerCardsEl, dealerHand, drawCard(), true);

  hitBtn.disabled = false;
  standBtn.disabled = false;

  const playerScore = calcScore(playerHand);
  if (playerScore === 21) {
    endRound();
  } else {
    render();
  }
}

function drawCard() {
  return deck.shift();
}

function calcScore(hand) {
  let total = 0;
  let aces = 0;
  for (const c of hand) {
    const r = c.rank;
    if (r === "A") {
      total += 11;
      aces++;
    } else if (["J", "Q", "K"].includes(r)) total += 10;
    else total += Number(r);
  }
  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }
  return total;
}

function createCardElement(cardObj, showFront, index) {
  const wrapper = document.createElement("div");
  wrapper.className = "card-wrapper";
  const inner = document.createElement("div");
  inner.className = "card-inner";
  inner.dataset.index = index ?? "";

  const faceBack = document.createElement("div");
  faceBack.className = "card-face back";
  const imgBack = document.createElement("img");
  // try the actual file (some assets use a double .png suffix), then fallback names
  const backFallbacks = [
    "./Pomegranate.png",
  ];
  let backTry = 0;
  imgBack.src = backFallbacks[backTry];
  imgBack.onerror = () => {
    backTry++;
    if (backTry < backFallbacks.length) {
      imgBack.src = backFallbacks[backTry];
    }
  };
  faceBack.appendChild(imgBack);

  const faceFront = document.createElement("div");
  faceFront.className = "card-face front";
  const imgFront = document.createElement("img");
  imgFront.src = cardObj.img;
  imgFront.onload = () => {
    console.debug(`Loaded: ${imgFront.src}`);
  };
  imgFront.onerror = () => {
    console.warn(`Failed: ${imgFront.src}`);
    if (cardObj.fallback && imgFront.src !== cardObj.fallback) {
      imgFront.src = cardObj.fallback;
      return;
    }
    imgFront.style.background = "#ff6b6b";
    imgFront.alt = "missing";
  };
  faceFront.appendChild(imgFront);

  inner.appendChild(faceBack);
  inner.appendChild(faceFront);
  if (showFront) inner.classList.add("flipped");
  wrapper.appendChild(inner);
  return { wrapper, inner };
}

function render() {
  playerCardsEl.innerHTML = "";
  dealerCardsEl.innerHTML = "";

  playerHand.forEach((c, i) => {
    const { wrapper } = createCardElement(c, true, i);
    playerCardsEl.appendChild(wrapper);
  });

  dealerHand.forEach((c, i) => {
    const show = !(i === 0 && hideDealerHole);
    const { wrapper } = createCardElement(c, show, i);
    dealerCardsEl.appendChild(wrapper);
  });

  playerScoreEl.textContent = `Score: ${calcScore(playerHand)}`;
  dealerScoreEl.textContent = hideDealerHole
    ? "Score: ?"
    : `Score: ${calcScore(dealerHand)}`;
}

async function dealCardTo(containerEl, handArray, cardObj, revealFront) {
  if (!cardObj) return;
  handArray.push(cardObj);
  const { wrapper, inner } = createCardElement(
    cardObj,
    revealFront,
    handArray.length - 1,
  );
  wrapper.classList.add("dealing");
  containerEl.appendChild(wrapper);
  // force reflow then remove dealing class so animation runs
  void wrapper.offsetWidth;
  wrapper.classList.remove("dealing");
  // if it's a hidden dealer card, ensure not flipped until reveal
  if (!revealFront) inner.classList.remove("flipped");
  else inner.classList.add("flipped");
  await sleep(240);
}

function playerHit() {
  if (hitBtn.disabled) return;
  playerHand.push(drawCard());
  render();
  const score = calcScore(playerHand);
  if (score > 21) endRound();
  if (score === 21) endRound();
}

async function dealerPlay() {
  hideDealerHole = false;
  // reveal hole with flip animation
  render();
  const firstInner = dealerCardsEl.querySelector('.card-inner[data-index="0"]');
  if (firstInner && !firstInner.classList.contains("flipped")) {
    // small delay to let DOM update
    setTimeout(() => firstInner.classList.add("flipped"), 80);
  }
  // dealer draws until 17+
  while (calcScore(dealerHand) < 17) {
    const card = drawCard();
    dealerHand.push(card);
    // append with animation
    const { wrapper, inner } = createCardElement(
      card,
      true,
      dealerHand.length - 1,
    );
    dealerCardsEl.appendChild(wrapper);
    // trigger drop-in
    wrapper.classList.add("dealing");
    void wrapper.offsetWidth;
    wrapper.classList.remove("dealing");
    await sleep(260);
    render();
  }
}

function endRound() {
  hitBtn.disabled = true;
  standBtn.disabled = true;
  dealerPlay();

  const p = calcScore(playerHand);
  const d = calcScore(dealerHand);

  let out = "";
  if (p > 21) out = "You busted — Dealer wins.";
  else if (d > 21) out = "Dealer busted — You win!";
  else if (p === d) out = "Push — it's a tie.";
  else if (
    p === 21 &&
    playerHand.length === 2 &&
    !(d === 21 && dealerHand.length === 2)
  )
    out = "Blackjack! You win!";
  else if (
    d === 21 &&
    dealerHand.length === 2 &&
    !(p === 21 && playerHand.length === 2)
  )
    out = "Dealer has Blackjack — You lose.";
  else if (p > d) out = "You win!";
  else out = "Dealer wins.";

  resultEl.textContent = out;
}

function playerStand() {
  endRound();
}

hitBtn.addEventListener("click", async () => {
  playerHit();
});
standBtn.addEventListener("click", async () => {
  playerStand();
});
restartBtn.addEventListener("click", () => startGame());

// init
startGame();
