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

const adminUser = { username: "admin", password: "1234" };

app.post('/admin/login', (req, res) => {
    const { username, password } = req.body;
    if (username === adminUser.username && password === adminUser.password) {
        res.sendStatus(200);
    } else {
        res.sendStatus(401);
    }
});

app.delete('/admin/opera/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const filePath = path.join(__dirname, 'data.json');
    fs.readFile(filePath, 'utf8', (err, json) => {
        if (err) return res.sendStatus(500);
        let data = JSON.parse(json);
        data.puzzleImages = data.puzzleImages.filter(op => op.id !== id);
        fs.writeFile(filePath, JSON.stringify(data, null, 2), () => res.sendStatus(200));
    });
});

const multer = require('multer');
const upload = multer();
const axios = require('axios');

const GITHUB_TOKEN = "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";
const REPO = "davide-francioni/ppm";
const GITHUB_API = "https://api.github.com/repos/davide-francioni/ppm/contents/";
const IMAGE_FOLDER = "public/image/";
const DATA_JSON = "data.json";
//sossio
// 👉 Route per upload immagine + aggiornamento data.json
app.post('/admin/upload', upload.single('image'), async (req, res) => {
    try {
        const { name, description } = req.body;
        const file = req.file;

        if (!file) {
            return res.status(400).send("Nessun file caricato");
        }

        const base64Image = file.buffer.toString('base64');
        const timestamp = Date.now();
        const safeFileName = `${timestamp}-${file.originalname.replace(/\s+/g, '_')}`;
        const githubImagePath = `${IMAGE_FOLDER}${safeFileName}`;

        // 🔥 1. Carica immagine su GitHub
        await axios.put(`${GITHUB_API}${githubImagePath}`, {
            message: `Aggiunta immagine ${safeFileName}`,
            content: base64Image
        }, {
            headers: {
                Authorization: `Bearer ${GITHUB_TOKEN}`,
                Accept: "application/vnd.github.v3+json"
            }
        }).then(() => {
            console.log("✅ Immagine caricata correttamente su GitHub!");
        }).catch((error) => {
            console.error("❌ Errore upload immagine su GitHub:", error.response?.data || error.message);
            throw new Error("Errore upload immagine su GitHub");
        });

        const publicImageUrl = `https://raw.githubusercontent.com/${REPO}/main/${githubImagePath}`;

        // 🔥 2. Scarica il data.json attuale da GitHub
        const getDataJson = await axios.get(`${GITHUB_API}${DATA_JSON}`, {
            headers: {
                Authorization: `Bearer ${GITHUB_TOKEN}`,
                Accept: "application/vnd.github.v3+json"
            }
        });

        const dataContent = Buffer.from(getDataJson.data.content, 'base64').toString('utf-8');
        let data = JSON.parse(dataContent);
        const shaOld = getDataJson.data.sha;

        // 🔥 3. Aggiorna i dati in RAM
        const newId = Math.max(0, ...data.puzzleImages.map(o => o.id)) + 1;
        data.puzzleImages.push({
            id: newId,
            name,
            description,
            path: publicImageUrl
        });

        const updatedDataJson = Buffer.from(JSON.stringify(data, null, 2)).toString('base64');

        // 🔥 4. Carica nuovo data.json su GitHub
        await axios.put(`${GITHUB_API}${DATA_JSON}`, {
            message: "Aggiornamento data.json con nuova opera",
            content: updatedDataJson,
            sha: shaOld
        }, {
            headers: {
                Authorization: `Bearer ${GITHUB_TOKEN}`,
                Accept: "application/vnd.github.v3+json"
            }
        });

        console.log("✅ Immagine e data.json caricati con successo!");
        res.sendStatus(201);

    } catch (error) {
        console.error("❌ Errore durante upload su GitHub:", error.response?.data || error.message);
        res.status(500).send("Errore durante upload su GitHub");
    }
});

app.put('/admin/opera/:id', (req, res) => {
    const { name, description } = req.body;
    const id = parseInt(req.params.id);

    const filePathJson = path.join(__dirname, 'data.json');
    fs.readFile(filePathJson, 'utf8', (err, json) => {
        if (err) return res.sendStatus(500);
        let data = JSON.parse(json);
        const index = data.puzzleImages.findIndex(o => o.id === id);
        if (index !== -1) {
            data.puzzleImages[index].name = name;
            data.puzzleImages[index].description = description;
            fs.writeFile(filePathJson, JSON.stringify(data, null, 2), () => res.sendStatus(200));
        } else {
            res.sendStatus(404);
        }
    });
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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
