function swapTiles(cell1, cell2) {
    let temp = document.getElementById(cell1).className;
    document.getElementById(cell1).className = document.getElementById(cell2).className;
    document.getElementById(cell2).className = temp;
}

function shuffle() {
    //Use nested loops to access each cell of the 3x3 grid
    for (let row = 1; row <= 3; row++) { //For each row of the 3x3 grid
        for (let column = 1; column <= 3; column++) { //For each column in this row

            let row2 = Math.floor(Math.random() * 3 + 1); //Pick a random row from 1 to 3
            let column2 = Math.floor(Math.random() * 3 + 1); //Pick a random column from 1 to 3

            swapTiles("cell" + row + column, "cell" + row2 + column2); //Swap the look & feel of both cells
        }
    }

    for (let row = 4; row <= 6; row++) { //For each row of the 3x3 grid
        for (let column = 4; column <= 6; column++) { //For each column in this row

            let row2 = Math.floor(Math.random() * 3 + 4); //Pick a random row from 1 to 3
            let column2 = Math.floor(Math.random() * 3 + 4); //Pick a random column from 1 to 3

            swapTiles("cell" + row + column, "cell" + row2 + column2); //Swap the look & feel of both cells
        }
    }
}

function clickTile(row, column) {
    let cell = document.getElementById("cell" + row + column);
    let tile = cell.className;
    if (tile !== "tile9") {
        //Checking if white tile on the right
        if (column < 3) {
            if (document.getElementById("cell" + row + (column + 1)).className === "tile9") {
                swapTiles("cell" + row + column, "cell" + row + (column + 1));
                return null;
            }
        }
        //Checking if white tile on the left
        if (column > 1) {
            if (document.getElementById("cell" + row + (column - 1)).className === "tile9") {
                swapTiles("cell" + row + column, "cell" + row + (column - 1));
                return null;
            }
        }
        //Checking if white tile is above
        if (row > 1) {
            if (document.getElementById("cell" + (row - 1) + column).className === "tile9") {
                swapTiles("cell" + row + column, "cell" + (row - 1) + column);
                return null;
            }
        }
        //Checking if white tile is below
        if (row < 3) {
            if (document.getElementById("cell" + (row + 1) + column).className === "tile9") {
                swapTiles("cell" + row + column, "cell" + (row + 1) + column);
                return null;
            }
        }
    }

}

function clickTile2(row, column) {
    let cell = document.getElementById("cell" + row + column);
    let tile = cell.className;
    if (tile !== "tile18") {
        //Checking if white tile on the right
        if (column < 6) {
            if (document.getElementById("cell" + row + (column + 1)).className === "tile18") {
                swapTiles("cell" + row + column, "cell" + row + (column + 1));
                return null;
            }
        }
        //Checking if white tile on the left
        if (column > 4) {
            if (document.getElementById("cell" + row + (column - 1)).className === "tile18") {
                swapTiles("cell" + row + column, "cell" + row + (column - 1));
                return null;
            }
        }
        //Checking if white tile is above
        if (row > 4) {
            if (document.getElementById("cell" + (row - 1) + column).className === "tile18") {
                swapTiles("cell" + row + column, "cell" + (row - 1) + column);
                return null;
            }
        }
        //Checking if white tile is below
        if (row < 6) {
            if (document.getElementById("cell" + (row + 1) + column).className === "tile18") {
                swapTiles("cell" + row + column, "cell" + (row + 1) + column);
                return null;
            }
        }
    }

}

function images() {
    fetch("data.json") // Legge il file JSON
        .then(response => response.json())
        .then(data => {
            let img = data.image; // Prende l'URL dell'immagine dal JSON

            if (!img) {
                console.error("Nessuna immagine trovata nel database!");
                return;
            }

            let tileSize = 100; // Dimensione di ogni pezzo

            // Imposta l'immagine nei pezzi per il Player 1
            for (let row = 1; row <= 3; row++) {
                for (let col = 1; col <= 3; col++) {
                    let tile = document.getElementById("cell" + row + col);
                    if (tile) {
                        tile.style.backgroundImage = `url(${img})`;
                        tile.style.backgroundSize = "180px 180px";
                        tile.style.backgroundPosition = `-${(col - 1) * tileSize}px -${(row - 1) * tileSize}px`;
                    }
                }
            }

            // Imposta l'immagine nei pezzi per il Player 2
            for (let row = 4; row <= 6; row++) {
                for (let col = 4; col <= 6; col++) {
                    let tile = document.getElementById("cell" + row + col);
                    if (tile) {
                        tile.style.backgroundImage = `url(${img})`;
                        tile.style.backgroundSize = "180px 180px";
                        tile.style.backgroundPosition = `-${(col - 4) * tileSize}px -${(row - 4) * tileSize}px`;
                    }
                }
            }
        })
        .catch(error => console.error("Errore nel caricamento delle immagini:", error));
}

const socket = new WebSocket('ws://localhost:8080');

socket.onmessage = (event) => {
    const data = JSON.parse(event.data);

    if (data.type === "matchFound") {
        localStorage.setItem("player1", data.player1);
        localStorage.setItem("player2", data.player2);

        window.location.href = `game.html`;
    }
};

// Invia il nome utente al server quando si cerca un avversario
function findOpponent() {
    const username = document.getElementById('username').value;
    if (!username) return alert("Inserisci un nome utente!");

    socket.send(JSON.stringify({ type: 'findOpponent', username }));

    socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'matchFound') {
            alert(`Partita trovata! Giocherai contro ${data.opponent}`);
            window.location.href = `game.html?username=${username}`;
        }
    };
}