const canvas = document.getElementById("snake");
const ctx = canvas.getContext("2d");
const caixa = 32;

const startScreen = document.getElementById("startScreen");
const pauseScreen = document.getElementById("pauseScreen");
const gameOverScreen = document.getElementById("gameOverScreen");

const btnStart = document.getElementById("btnStart");
const btnPause = document.getElementById("btnPause");
const btnResume = document.getElementById("btnResume");
const btnRestart = document.getElementById("btnRestart");
const btnMute = document.getElementById("btnMute");
const skinSelect = document.getElementById("skinSelect");

const scoreSpan = document.getElementById("score");
const recordSpan = document.getElementById("record");
const finalScore = document.getElementById("finalScore");
const finalRecord = document.getElementById("finalRecord");

let snake = [];
let comida = {};
let direcao = "";
let pontuacao = 0;
let recorde = localStorage.getItem("recorde") || 0;
let jogoInterval = null;
let velocidade = 150;
let isPaused = false;
let isPlaying = false;
let muted = false;

let skinColors = {
    classic: "green",
    blue: "#2196F3",
    red: "#E53935"
};

let skin = "classic";

let touchStartX = null;
let touchStartY = null;

function randomPosition() {
    return {
        x: Math.floor(Math.random() * 16) * caixa,
        y: Math.floor(Math.random() * 16) * caixa,
    };
}

function criarFundo() {
    // Fundo com gradiente animado
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, "#a5d6a7");
    gradient.addColorStop(1, "#4caf50");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function criarCobrinha() {
    for (let i = 0; i < snake.length; i++) {
        ctx.fillStyle = skinColors[skin];
        ctx.fillRect(snake[i].x + 2, snake[i].y + 2, caixa - 4, caixa - 4);
        // desenho "3D" simples
        ctx.strokeStyle = "#004d40";
        ctx.strokeRect(snake[i].x + 2, snake[i].y + 2, caixa - 4, caixa - 4);
    }
}

function desenharComida() {
    ctx.fillStyle = "red";
    ctx.beginPath();
    ctx.arc(comida.x + caixa / 2, comida.y + caixa / 2, caixa / 2 - 4, 0, 2 * Math.PI);
    ctx.fill();
    ctx.strokeStyle = "#b71c1c";
    ctx.stroke();
}

function desenharPontuacao() {
    scoreSpan.textContent = pontuacao;
    recordSpan.textContent = recorde;
}

function iniciarJogo() {
    if (isPaused || !isPlaying) return;

    // Colisão com parede
    if (
        snake[0].x < 0 ||
        snake[0].x >= 16 * caixa ||
        snake[0].y < 0 ||
        snake[0].y >= 16 * caixa
    ) {
        gameOver();
        return;
    }

    // Colisão com o próprio corpo
    for (let i = 1; i < snake.length; i++) {
        if (snake[0].x === snake[i].x && snake[0].y === snake[i].y) {
            gameOver();
            return;
        }
    }

    criarFundo();
    criarCobrinha();
    desenharComida();
    desenharPontuacao();

    let snakeX = snake[0].x;
    let snakeY = snake[0].y;

    if (direcao === "direita") snakeX += caixa;
    else if (direcao === "esquerda") snakeX -= caixa;
    else if (direcao === "cima") snakeY -= caixa;
    else if (direcao === "baixo") snakeY += caixa;

    if (snakeX === comida.x && snakeY === comida.y) {
        pontuacao++;
        if (pontuacao > recorde) {
            recorde = pontuacao;
            localStorage.setItem("recorde", recorde);
        }
        criarParticulas(comida.x + caixa / 2, comida.y + caixa / 2);
        comida = randomPosition();
        tocarSom("comer");
        if (pontuacao % 5 === 0 && velocidade > 50) {
            velocidade -= 10;
            clearInterval(jogoInterval);
            jogoInterval = setInterval(iniciarJogo, velocidade);
        }
    } else {
        snake.pop();
    }

    snake.unshift({ x: snakeX, y: snakeY });
}

function gameOver() {
    clearInterval(jogoInterval);
    isPlaying = false;
    mostrarTela(gameOverScreen);
    finalScore.textContent = `Frutas comidas: ${pontuacao}`;
    finalRecord.textContent = `Recorde: ${recorde}`;
    tocarSom("gameover");
    document.body.classList.remove("playing", "paused");
}

function reiniciarJogo() {
    snake = [{ x: 8 * caixa, y: 8 * caixa }];
    direcao = "direita";
    pontuacao = 0;
    velocidade = 150;
    comida = randomPosition();
    desenharPontuacao();
    esconderTodasTelas();
    isPaused = false;
    isPlaying = true;
    clearInterval(jogoInterval);
    jogoInterval = setInterval(iniciarJogo, velocidade);
    document.body.classList.add("playing");
    tocarSom("click");
}

function pausarJogo() {
    if (!isPlaying) return;
    isPaused = true;
    clearInterval(jogoInterval);
    mostrarTela(pauseScreen);
    document.body.classList.add("paused");
    document.body.classList.remove("playing");
    tocarSom("click");
}

function continuarJogo() {
    if (!isPlaying) return;
    isPaused = false;
    jogoInterval = setInterval(iniciarJogo, velocidade);
    esconderTodasTelas();
    document.body.classList.add("playing");
    document.body.classList.remove("paused");
    tocarSom("click");
}

function mostrarTela(tela) {
    esconderTodasTelas();
    tela.classList.add("active");
}

function esconderTodasTelas() {
    startScreen.classList.remove("active");
    pauseScreen.classList.remove("active");
    gameOverScreen.classList.remove("active");
}

function tocarSom(tipo) {
    if (muted) return;

    let audio = new Audio();

    switch (tipo) {
        case "comer":
            // Som de pop
            audio.src = "https://actions.google.com/sounds/v1/cartoon/wood_plank_flicks.ogg";
            break;
        case "gameover":
            audio.src = "https://actions.google.com/sounds/v1/cartoon/cartoon_boing.ogg";
            break;
        case "click":
            audio.src = "https://actions.google.com/sounds/v1/ui/click.ogg";
            break;
        default:
            return;
    }

    audio.play();
}

// Partículas quando come fruta
function criarParticulas(x, y) {
    for (let i = 0; i < 15; i++) {
        const p = document.createElement("div");
        p.classList.add("particle");
        document.getElementById("gameContainer").appendChild(p);

        p.style.setProperty("--dx", (Math.random() - 0.5) * 100 + "px");
        p.style.setProperty("--dy", (Math.random() - 0.5) * 100 + "px");
        p.style.left = x + "px";
        p.style.top = y + "px";
        p.style.width = "6px";
        p.style.height = "6px";
        p.style.background = skinColors[skin];

        setTimeout(() => {
            p.remove();
        }, 600);
    }
}

// Controle via teclado
document.addEventListener("keydown", (e) => {
    if (!isPlaying) return;

    if (e.key === "ArrowLeft" && direcao !== "direita") direcao = "esquerda";
    else if (e.key === "ArrowUp" && direcao !== "baixo") direcao = "cima";
    else if (e.key === "ArrowRight" && direcao !== "esquerda") direcao = "direita";
    else if (e.key === "ArrowDown" && direcao !== "cima") direcao = "baixo";

    if (e.key === "p") {
        if (isPaused) continuarJogo();
        else pausarJogo();
    }
});

// Controle via toque/swipe no celular
canvas.addEventListener("touchstart", (e) => {
    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
});
canvas.addEventListener("touchend", (e) => {
    const touch = e.changedTouches[0];
    let deltaX = touch.clientX - touchStartX;
    let deltaY = touch.clientY - touchStartY;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX > 30 && direcao !== "esquerda") direcao = "direita";
        else if (deltaX < -30 && direcao !== "direita") direcao = "esquerda";
    } else {
        if (deltaY > 30 && direcao !== "cima") direcao = "baixo";
        else if (deltaY < -30 && direcao !== "baixo") direcao = "cima";
    }
});

btnStart.addEventListener("click", () => {
    reiniciarJogo();
    esconderTodasTelas();
    document.body.classList.add("playing");
});

btnPause.addEventListener("click", () => {
    pausarJogo();
});

btnResume.addEventListener("click", () => {
    continuarJogo();
});

btnRestart.addEventListener("click", () => {
    reiniciarJogo();
});

btnMute.addEventListener("click", () => {
    muted = !muted;
    btnMute.textContent = muted ? "Unmute" : "Mute";
    tocarSom("click");
});

skinSelect.addEventListener("change", () => {
    skin = skinSelect.value;
    tocarSom("click");
});

window.onload = () => {
    esconderTodasTelas();
    mostrarTela(startScreen);
    recordSpan.textContent = recorde;
};
