const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let waitingPlayer = null;

app.use(express.static(path.join(__dirname, 'public')));  // Serve files like your CSS, JS, images, etc.
app.use(express.json());

// Route principale per servire index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/data.json', (req, res) => {
    res.sendFile(path.join(__dirname, 'data.json'));
});

const fs = require('fs');

app.get('/puzzle-data', (req, res) => {
    fs.readFile('data.json', 'utf8', (err, data) => {
        if (err) {
            res.status(500).send("Errore nel leggere il file JSON");
            return;
        }
        res.json(JSON.parse(data));
    });
});

let activeGames = new Map();

wss.on("connection", (ws) => {
    ws.on("message", (message) => {
        const data = JSON.parse(message);

        if (data.type === "findOpponent") {
            ws.username = data.username; // Salva il nome del giocatore nel WebSocket

            if (waitingPlayer) {
                const player1 = waitingPlayer;
                const player2 = ws;

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

                    let img1 = images[img1Index];
                    let img2 = images[img2Index];

                    const gameId = Date.now();
                    activeGames.set(gameId, { img1, img2, player1: player1.username, player2: player2.username });

                    player1.send(JSON.stringify({
                        type: "matchFound",
                        opponent: player2.username,
                        gameId,
                        img: img1
                    }));

                    player2.send(JSON.stringify({
                        type: "matchFound",
                        opponent: player1.username,
                        gameId,
                        img: img2
                    }));

                    waitingPlayer = null;
                });
            } else {
                waitingPlayer = ws;
            }
        }
    });

    ws.on("close", () => {
        if (waitingPlayer === ws) {
            waitingPlayer = null; // Libera il posto per un nuovo giocatore
        }
    });
});

server.listen(8080, () => console.log('Server avviato su http://localhost:8080'));