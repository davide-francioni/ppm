const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let waitingPlayer = null;
let activeGames = new Map();

app.use(express.static(path.join(__dirname, 'public')));  // Serve files come CSS, JS, immagini, ecc.
app.use(express.json());

// Route principale per servire index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/data.json', (req, res) => {
    res.sendFile(path.join(__dirname, 'data.json'));
});

app.get('/puzzle-data', (req, res) => {
    fs.readFile("data.json", "utf8", (err, data) => {
        if (err) {
            res.status(500).send("Errore nel leggere il file JSON");
            return;
        }
        res.json(JSON.parse(data));
    });
});

wss.on("connection", (ws) => {
    console.log("Nuovo giocatore connesso");

    ws.on("message", (message) => {
        const data = JSON.parse(message);
        console.log("Messaggio ricevuto:", data);
        console.log(`Client WebSocket connessi: ${wss.clients.size}`);

        if (data.type === "findOpponent") {
            console.log(`${data.username} sta cercando un avversario...`);
            ws.username = data.username;

            if (waitingPlayer) {
                const player1 = waitingPlayer;
                const player2 = ws;

                console.log(`Match trovato: ${player1.username} vs ${player2.username}`);

                fs.readFile("data.json", "utf8", (err, jsonData) => {
                    if (err) {
                        console.error("Errore nel caricamento delle immagini:", err);
                        return;
                    }
                    const images = JSON.parse(jsonData).puzzleImages;

                    if (images.length < 2) {
                        console.error("Non ci sono abbastanza immagini!");
                        return;
                    }

                    let img1Index = Math.floor(Math.random() * images.length);
                    let img2Index;
                    do {
                        img2Index = Math.floor(Math.random() * images.length);
                    } while (img2Index === img1Index);

                    let img1 = images[img1Index].path;
                    let img2 = images[img2Index].path;
                    let img1Name = images[img1Index].name;
                    let img1Desc = images[img1Index].description;
                    let img2Name = images[img2Index].name;
                    let img2Desc = images[img2Index].description;

                    const gameId = Date.now();
                    activeGames.set(gameId, {
                        img1,
                        img2,
                        player1: player1.username,
                        player2: player2.username,
                    });

                    // Invia i dati ai due giocatori
                    player1.send(JSON.stringify({
                        type: "matchFound",
                        gameId,
                        currentPlayer: player1.username,
                        opponent: player2.username,
                        currentImage:img1,
                        opponentImage:img2,
                        imgCName: img1Name,
                        imgCDesc: img1Desc,
                        imgOName: img2Name,
                        imgODesc: img2Desc
                    }));

                    player2.send(JSON.stringify({
                        type: "matchFound",
                        gameId,
                        currentPlayer: player2.username,
                        opponent: player1.username,
                        currentImage:img2,
                        opponentImage:img1,
                        imgCName: img2Name,
                        imgCDesc: img2Desc,
                        imgOName: img1Name,
                        imgODesc: img1Desc
                    }));

                    console.log(`Inviato a Player1: ${player1.username}, currentPlayer=${player1.username}`);
                    console.log(`Inviato a Player2: ${player2.username}, currentPlayer=${player2.username}`);

                    waitingPlayer = null;
                });
            } else {
                console.log(`${ws.username} è in attesa di un avversario...`);
                waitingPlayer = ws;
            }
        }else if (data.type === "move") {
            console.log(`Ricevuta mossa: ${data.from} ↔ ${data.to}`);

            wss.clients.forEach(client => {
                if (client !== ws && client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({
                        type: "move",
                        from: data.from,
                        to: data.to
                    }));
                }
            });
        } else if (data.type === 'gameWon') {
            console.log(`Partita vinta da: ${data.winner}`);

            wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({
                        type: "gameWon",
                        winner: data.winner
                    }));
                }
            });
        }
    });

    ws.on("close", () => {
        if (waitingPlayer === ws) {
            console.log(`${ws.username} ha abbandonato la ricerca.`);
            waitingPlayer = null;
        }
    });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, '0.0.0.0', () => console.log(`Server avviato su porta ${PORT}`));
