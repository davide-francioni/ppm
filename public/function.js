let startTime;
let timerInterval;

function ensureUsername() {
    let savedUsername = localStorage.getItem("username");
    let player1 = localStorage.getItem("player1");
    let player2 = localStorage.getItem("player2");

    if (!savedUsername) {
        console.error("❌ Nessun username trovato!");
        //window.location.href = "index.html"; // 🔄 Torna alla home se non c'è un username
    } else {
        console.log("🔒 Username già salvato:", savedUsername);

        // Verifica se l'username è player1 o player2
        let isPlayer1 = savedUsername === player1;
        let isPlayer2 = savedUsername === player2;

        localStorage.setItem("isPlayer1", isPlayer1); // ✅ Salva chi è il giocatore
        localStorage.setItem("isPlayer2", isPlayer2);
    }
}

document.addEventListener("DOMContentLoaded", function () {
    console.log("📢 Pagina caricata! Verifica elementi...");

    ensureUsername(); // ✅ Verifica che l'username sia preservato

    if (document.getElementById("player-name")) {
        console.log("🔄 Caricamento dati puzzle...");
        loadPuzzleData();
        setTimeout(attachTileListeners, 300);
    } else {
        console.warn("⚠️ Elemento #player-name non trovato! Siamo nella pagina sbagliata?");
    }
});

function loadPuzzleData() {
    console.log("✅ Chiamata loadPuzzleData()...");

    let playerName = localStorage.getItem("username"); // 🔥 Recuperiamo il nome esatto

    if (!playerName) {
        console.error("❌ Errore: Username non trovato!");
        return;
    }

    let player1 = localStorage.getItem("player1") || "Player 1";
    let player2 = localStorage.getItem("player2") || "Player 2";

    let savedUsername = localStorage.getItem("username");
    let isPlayer1 = (playerName === player1);
    let isPlayer2 = (playerName === player2);
    let img1 = localStorage.getItem("image1");
    let img2 = localStorage.getItem("image2");

    console.log("👤 Player1:", player1, "| Player2:", player2);
    console.log("🎨 Immagini ricevute:", img1, img2);

    if (!img1 || !img2) {
        console.error("❌ Errore: Mancano le immagini nei dati salvati!");
        return;
    }

    document.getElementById("player-name").textContent = savedUsername;
    document.getElementById("opponent-name").textContent = isPlayer1 ? player2 : player1;

    let playerImg = isPlayer1 ? localStorage.getItem("image1") : localStorage.getItem("image2");
    let opponentImg = isPlayer1 ? localStorage.getItem("image2") : localStorage.getItem("image1");

    setPuzzleImages(playerImg, opponentImg);
    console.log("✅ Immagini assegnate correttamente!");
    startGameTimer(); // 🔥 Inizia il timer

    if (localStorage.getItem("gameState")) {
        console.log("🟢 Stato della partita trovato! Ripristino...");
        loadGameState();
    } else {
        console.log("🟡 Nessuno stato salvato, eseguo shuffle iniziale...");
        setTimeout(shuffle, 1000);
    }

    setTimeout(() => {
        attachTileListeners();
    }, 300);
}

function setPuzzleImages(playerImg, opponentImg) {
    console.log(`🖼️ Impostando immagini: player=${playerImg}, opponent=${opponentImg}`);

    let playerTiles = document.querySelectorAll(".table-player-board td");
    let opponentTiles = document.querySelectorAll(".table-opponent-board td");

    if (!playerImg || !opponentImg) {
        console.error("❌ Errore: immagini non caricate correttamente!");
        return;
    }

    playerTiles.forEach((tile, index) => {
        let row = Math.floor(index / 3);
        let col = index % 3;

        tile.style.backgroundImage = `url(${playerImg})`;
        tile.style.backgroundSize = "540px 540px";
        tile.style.backgroundPosition = `-${col * 180}px -${row * 180}px`;

        console.log(tile.dataset.tile);
        if (index === playerTiles.length - 1) {
            tile.classList.add("tile9");  // Imposta l'ultimo tile come vuoto
        }
    });

    opponentTiles.forEach((tile, index) => {
        let row = Math.floor(index / 3);
        let col = index % 3;

        tile.style.backgroundImage = `url(${opponentImg})`;
        tile.style.backgroundSize = "540px 540px";
        tile.style.backgroundPosition = `-${col * 180}px -${row * 180}px`;

        console.log(tile.dataset.tile);
        if (index === opponentTiles.length - 1) {
            tile.classList.add("tile18");  // Imposta l'ultimo tile come vuoto
        }
    });

    console.log("✅ Immagini e dataset assegnati correttamente!");
}

function attachTileListeners() {
    console.log("🔵 Collegando gli eventi di click ai tile...");

    let playerName = localStorage.getItem("username");
    let player1 = localStorage.getItem("player1");
    let player2 = localStorage.getItem("player2");

    if (!playerName || !player1 || !player2) {
        console.error("❌ Errore: Dati dei giocatori mancanti!");
        return;
    }

    let isPlayer1 = (playerName === player1);
    let isPlayer2 = (playerName === player2);

    console.log(`👤 Giocatore attuale: ${playerName} (Player1=${isPlayer1}, Player2=${isPlayer2})`);

    let playerTiles = document.querySelectorAll(isPlayer1 ? ".table-player-board td" : ".table-opponent-board td");
    console.log("📌 Numero di tiles trovati:", playerTiles.length);

    document.querySelectorAll("td").forEach(tile => {
        tile.addEventListener("click", function () {
            let id = tile.id.replace("cell", "");
            let row = parseInt(id.charAt(0));
            let col = parseInt(id.charAt(1));

            console.log(`🟢 Click su tile (${row}, ${col})`);
            moveTile(row, col);
        });
    });

    console.log("✅ Eventi di click collegati!");
}

function shuffle() {
    let player1Tiles = [
        "cell11", "cell12", "cell13",
        "cell21", "cell22", "cell23",
        "cell31", "cell32"
    ];

    function safeSwap(tileId1, tileId2) {
        let tile1 = document.getElementById(tileId1);
        let tile2 = document.getElementById(tileId2);

        if (!tile1 || !tile2) {
            console.warn(`⚠️ Tentativo di scambio fallito: ${tileId1} o ${tileId2} non esistono.`);
            return;
        }

        swapTiles(tile1, tile2);
    }

    // **Mescola solo i tile del giocatore 1 tra di loro**
    for (let i = player1Tiles.length - 1; i > 0; i--) {
        let randIndex = Math.floor(Math.random() * (i + 1));
        safeSwap(player1Tiles[i], player1Tiles[randIndex]);
    }

    console.log("✅ Shuffle completato!");
}

// Funzione per muovere le tessere
function moveTile(row, column) {
    let cell = document.getElementById(`cell${row}${column}`);
    let blankTile = Array.from(document.querySelectorAll("td")).find(tile =>
        tile.classList.contains("tile9") || tile.classList.contains("tile18")
    );

    console.log(`🔍 Tentativo di muovere il tile: ${cell ? cell.id : "❌ Nessuna cella trovata!"}`);
    console.log(`🔍 Tessera vuota attuale: ${blankTile ? blankTile.id : "❌ Nessuna tessera bianca trovata!"}`);

    if (!cell || !blankTile) {
        console.error("❌ Errore: Una delle tessere è null. Impossibile spostare!");
        return;
    }

    let cellRow = parseInt(cell.id.charAt(4));
    let cellCol = parseInt(cell.id.charAt(5));
    let blankRow = parseInt(blankTile.id.charAt(4));
    let blankCol = parseInt(blankTile.id.charAt(5));

    let isAdjacent =
        (cellRow === blankRow && Math.abs(cellCol - blankCol) === 1) ||
        (cellCol === blankCol && Math.abs(cellRow - blankRow) === 1);

    if (isAdjacent) {
        console.log(`✅ Movimento valido! Scambio ${cell.id} con ${blankTile.id}`);
        swapTiles(cell, blankTile);
        checkWin();
    } else {
        console.log("❌ Movimento non valido! Le tessere non sono adiacenti.");
    }
}

// Funzione per scambiare le tessere
function swapTiles(tile1, tile2) {

    if (!tile1 || !tile2) {
        console.error("❌ Errore: Uno dei tiles non è valido!", tile1, tile2);
        return;
    }
    console.log(`🔄 Scambio: ${tile1.id} ↔ ${tile2.id}`);

    if (!tile1.style || !tile2.style) {
        console.error("❌ Errore: `backgroundImage` non definito per uno dei tiles!", tile1, tile2);
        return;
    }

    // **Scambia classi**
    let tempClass = tile1.className;
    tile1.className = tile2.className;
    tile2.className = tempClass;

    // **Scambia le immagini**
    let tempBackground = tile1.style.backgroundImage;
    let tempPosition = tile1.style.backgroundPosition;

    tile1.style.backgroundImage = tile2.style.backgroundImage;
    tile1.style.backgroundPosition = tile2.style.backgroundPosition;

    tile2.style.backgroundImage = tempBackground;
    tile2.style.backgroundPosition = tempPosition;

    console.log("✅ Dopo lo scambio:");
    console.log("📌 Tile 1 - Background:", tile1.style.backgroundImage, "Posizione:", tile1.style.backgroundPosition);
    console.log("📌 Tile 2 - Background:", tile2.style.backgroundImage, "Posizione:", tile2.style.backgroundPosition);

    saveGameState();  // 🔥 Ora chiamiamo `saveGameState()` dopo ogni scambio!

    let tile1Id = parseInt(tile1.id.replace("cell", ""));
    let tile2Id = parseInt(tile2.id.replace("cell", ""));

    if(tile1Id<34 && tile2Id<34) {
        tile1Id += 33;
        tile2Id += 33;
        if (socket.readyState === WebSocket.OPEN) {  // 🔥 Aspetta che WebSocket sia aperto prima di inviare
            console.log(`📩 Inviando mossa al server: cell${tile1Id} ↔ cell${tile2Id}`);
            socket.send(JSON.stringify({
                type: "move",
                from: `cell${tile1Id}`,
                to: `cell${tile2Id}`
            }));
        }else {
            console.warn("⚠️ WebSocket non ancora connesso! La mossa non è stata inviata.");
        }
    }
}


// Funzione per salvare lo stato del gioco
function saveGameState() {
    let gameState = [];

    document.querySelectorAll("td").forEach(tile => {
        gameState.push({
            id: tile.id,
            className: tile.className
        });
    });

    localStorage.setItem("gameState", JSON.stringify(gameState));
    console.log("💾 Stato della partita salvato!");
}

// Funzione per caricare lo stato del gioco
function loadGameState() {
    let savedState = localStorage.getItem("gameState");
    if (!savedState) {
        console.warn("⚠️ Nessuno stato salvato trovato.");
        return;
    }

    let gameState = JSON.parse(savedState);
    console.log("🔄 Ripristino stato della partita...", gameState);

    let playerName = localStorage.getItem("username");
    let player1 = localStorage.getItem("player1");
    let player2 = localStorage.getItem("player2");

    let isPlayer1 = (playerName === player1);
    let isPlayer2 = (playerName === player2);

    gameState.forEach(tileData => {
        let tile = document.getElementById(tileData.id);
        if (tile) {
            tile.className = tileData.className;

            let tileNumber = parseInt(tileData.className.replace("tile", ""), 10);
            let belongsToPlayer1 = tileNumber >= 1 && tileNumber <= 9;
            let belongsToPlayer2 = tileNumber >= 10 && tileNumber <= 18;

            let row = Math.floor((tileNumber - (belongsToPlayer2 ? 10 : 1)) / 3);
            let col = (tileNumber - (belongsToPlayer2 ? 10 : 1)) % 3;
            const tileSize = 180;

            let imgToUse = belongsToPlayer1 ? localStorage.getItem("image1") : localStorage.getItem("image2");
            if (!imgToUse) {
                console.error("❌ Errore: Immagine non trovata per il tile", tileData.id);
                return;
            }

            tile.style.backgroundImage = `url('${imgToUse}')`;
            tile.style.backgroundSize = "540px 540px";
            tile.style.backgroundPosition = `-${col * tileSize}px -${row * tileSize}px`;
        }
    });

    console.log("✅ Stato della partita ripristinato!");
}

function startGameTimer() {
    if (!localStorage.getItem("startTime")) {
        localStorage.setItem("startTime", Date.now()); // Salva il tempo di inizio solo la prima volta
    }

    startTime = parseInt(localStorage.getItem("startTime"), 10);
    timerInterval = setInterval(updateGameTimer, 1000);
}

function updateGameTimer() {
    let currentTime = Date.now();
    let elapsedTime = Math.floor((currentTime - startTime) / 1000);

    let minutes = Math.floor(elapsedTime / 60);
    let seconds = elapsedTime % 60;

    document.getElementById("game-timer").textContent = `Tempo: ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function stopGameTimer() {
    clearInterval(timerInterval);
    let endTime = Date.now();
    let totalTime = Math.floor((endTime - startTime) / 1000);

    let minutes = Math.floor(totalTime / 60);
    let seconds = totalTime % 60;
    let finalTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    console.log(`⏹️ Partita conclusa! Tempo totale: ${finalTime}`);
    localStorage.setItem("finalTime", finalTime);

    document.getElementById("game-timer").textContent = `Tempo Finale: ${finalTime}`;

    // 🔥 Rimuoviamo il tempo salvato per evitare problemi al prossimo gioco
    localStorage.removeItem("startTime");
}

function checkWin() {
    let tiles = document.querySelectorAll(".table-player-board td");
    let correctOrder = true;

    tiles.forEach((tile, index) => {
        let expectedTile = `tile${index + 1}`;
        if (!tile.classList.contains(expectedTile)) {
            correctOrder = false;
        }
    });

    if (correctOrder) {
        console.log("🎉 Partita completata! Un giocatore ha vinto!");
        stopGameTimer(); // 🔥 Ferma il timer
        let winner = localStorage.getItem("username");
        socket.send(JSON.stringify({
            type: "gameWon",
            winner: winner
        }));
        showGameOverPopup();
    }
}

function showGameOverPopup(winner) {
    stopGameTimer();

    let currentPlayer = localStorage.getItem("username");

    let isWinner = (winner === currentPlayer);
    let winMessage = isWinner ? "🎉 Hai vinto!" : "❌ Hai perso!";

    let puzzleImage =localStorage.getItem("image1");
    let puzzleName = localStorage.getItem("img1Name");
    let puzzleDesc = localStorage.getItem("img1Desc");
    let finalTime = localStorage.getItem("finalTime") || "00:00"; // 🔥 Recupera il tempo di gioco

    document.getElementById("win-lose-message").textContent = winMessage;
    document.getElementById("puzzle-image").src = puzzleImage;
    document.getElementById("puzzle-name").textContent = puzzleName;
    document.getElementById("puzzle-description").textContent = puzzleDesc;

    document.getElementById("game-time-result").textContent = `Durata partita: ${finalTime}`;
    document.getElementById("overlay").style.display = "block";
    document.getElementById("game-over").style.display = "flex";
}

function restartGame() {
    localStorage.removeItem("startTime");
    localStorage.removeItem("finalTime");
    localStorage.removeItem("gameState");
    document.getElementById("overlay").style.display = "none";
    document.getElementById("game-over").style.display = "none";
    window.location.href = "index.html"; // 🔥 Torna alla homepage
}

function showMatchToast(message) {
    const searchMessage = document.getElementById('search-message');
    searchMessage.style.display = "none";
    const toast = document.getElementById("match-toast");
    toast.textContent = message;
    toast.classList.remove("hidden");
    toast.classList.add("visible");

    setTimeout(() => {
        toast.classList.remove("visible");
        toast.classList.add("hidden");
    }, 3000); // 🔥 Il toast resta visibile per 3 secondi
}
// Connessione WebSocket
const socket = new WebSocket(`wss://${window.location.hostname}`);

socket.onmessage = (event) => {
    const data = JSON.parse(event.data);

    if (data.type === "move") {
        console.log(`🔄 Mossa ricevuta: ${data.from} ↔ ${data.to}`);
        let cellOppF = document.getElementById(data.from);
        let cellOppT = document.getElementById(data.to);
        swapTiles(cellOppF, cellOppT);
    } else if (data.type === "gameWon") {
        console.log(`🎮 Game Over! Winner: ${data.winner}`);
        stopGameTimer();
        showGameOverPopup(data.winner);
    }
};

document.addEventListener("DOMContentLoaded", function () {
    console.log("🔵 Funzione collegata correttamente!");

    // Controlla se il bottone esiste prima di collegare l'evento
    const newGameButton = document.querySelector(".new_game");
    if (newGameButton) {
        newGameButton.addEventListener("click", findOpponent);
        console.log("🎮 Bottone 'Cerca avversario' collegato!");
    } else {
        console.warn("⚠️ Attenzione: Nessun bottone '.new_game' trovato in questa pagina.");
    }
});

// 🔹 Funzione per cercare un avversario e avviare la partita
function findOpponent() {
    console.log("🟢 findOpponent() è stata chiamata!");

    const username = document.getElementById('username')?.value;
    if (!username) {
        alert("Inserisci un nome utente!");
        return;
    }

    console.log(`📩 Invio richiesta al server con username: ${username}`);

    // Mostra il messaggio "Ricerca in corso..."
    const searchMessage = document.getElementById('search-message');
    if (!searchMessage) {
        console.error("❌ Errore: 'search-message' non trovato nel DOM");
        return;
    }
    searchMessage.textContent = "Ricerca in corso...";
    searchMessage.style.display = "block";

    // Verifica che il WebSocket sia connesso prima di inviare
    if (socket.readyState !== WebSocket.OPEN) {
        console.error("❌ Errore: WebSocket non connesso!");
        return;
    }

    // Invia richiesta al server per trovare un avversario
    socket.send(JSON.stringify({ type: 'findOpponent', username }));

    // Riceve la risposta dal server
    socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log("📩 Risposta ricevuta dal server:", data);

        if (data.type === 'matchFound') {
            console.log("👥 Giocatori assegnati:", data.currentPlayer, data.opponent);

            showMatchToast(`✅ Partita trovata! Giocherai contro ${data.opponent || "sconosciuto"}`);
            // Salva i dati localmente
            localStorage.setItem("player1", data.currentPlayer);
            localStorage.setItem("player2", data.opponent);
            localStorage.setItem("image1", data.currentImage);
            localStorage.setItem("image2", data.opponentImage);
            localStorage.setItem("img1Name", data.imgCName);
            localStorage.setItem("img1Desc", data.imgCDesc);
            localStorage.setItem("img2Name", data.imgOName);
            localStorage.setItem("img2Desc", data.imgODesc);

            // Salva il giocatore corrente
            if (username === data.currentPlayer || username === data.opponent) {
                localStorage.setItem("username", username);
                console.log(`✅ Giocatore corrente salvato: ${username}`);
            } else {
                console.error("❌ Errore: Il giocatore corrente non è tra i partecipanti!");
            }

            // Nasconde il messaggio di ricerca
            searchMessage.textContent = "";

            // Reindirizza alla pagina di gioco
            window.location.href = "game.html";
        }
    };
}

function solvePuzzle() {
    console.log("🟢 Risoluzione automatica del puzzle...");

    let tiles = document.querySelectorAll(".table-player-board td");

    tiles.forEach((tile, index) => {
        tile.className = `tile${index + 1}`;
    });

    console.log("✅ Puzzle risolto!");
    checkWin();  // 🔥 Dopo la risoluzione automatica, controlliamo se il puzzle è stato completato
}