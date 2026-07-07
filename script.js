document.addEventListener("DOMContentLoaded", () => {

    /* ===== AUDIO ===== */
    const tickSound = new Audio("sounds/tick.wav");
    const correctSound = new Audio("sounds/correct.wav");
    const wrongSound = new Audio("sounds/wrong.wav");
    const gameOverSound = new Audio("sounds/gameover.wav");
    const finishSound = new Audio("sounds/finish.wav");

    /* ===== STATE ===== */
    let countries = [];
    let current = 0;
    let score = 0;
    let combo = 0;
    let lives = 5;
    let gameEnded = false;
    let timeLeft = 10;
    let maxTime = 10;
    let timerInterval;

    let username = "";
    let level = "easy";
    let questionsSeen = 0;
    let selectedRegion = "All";

    /* ===== DOM ===== */
    const loginSection = document.getElementById("login-section");
    const regionSection = document.getElementById("region-section");
    const levelSection = document.getElementById("level-section");
    const quizSection = document.getElementById("quiz-section");
    const finalSection = document.getElementById("final-section");

    const questionEl = document.getElementById("question");
    const optionsEl = document.getElementById("options");
    const scoreEl = document.getElementById("score");
    const timerEl = document.getElementById("timer");
    const livesEl = document.getElementById("lives");
    const progressBar = document.getElementById("progress-bar");
    const progressText = document.getElementById("progress-text");
    const finalScoreEl = document.getElementById("final-score");
    const leaderboardEl = document.getElementById("leaderboard");
    const comboPopup = document.getElementById("combo-popup");

    const startBtn = document.getElementById("start-btn");
    const exitBtn = document.getElementById("exit-btn");

    /* ===== LOAD DATA ===== */
    async function loadCountries() {
        const res = await fetch("countries.json"); // JSON file with {country,capital,region}
        countries = await res.json();
        shuffle(countries);
    }

    /* ===== LOGIN ===== */
    startBtn.onclick = async () => {
        username = document.getElementById("username").value.trim();
        if (!username) return alert("Enter your name");

        await loadCountries();
        loginSection.classList.add("hidden");
        regionSection.classList.remove("hidden");
    };

    /* ===== REGION SELECTION ===== */
    window.selectRegion = (region) => {
        selectedRegion = region;
        if (region !== "All") {
            countries = countries.filter(c => c.region === region);
        }
        regionSection.classList.add("hidden");
        levelSection.classList.remove("hidden");
    };

    /* ===== LEVEL SELECTION ===== */
    window.selectLevel = (lvl) => {
        level = lvl;
        maxTime = lvl === "easy" ? 15 : lvl === "medium" ? 10 : 7;

        resetGame();
        levelSection.classList.add("hidden");
        quizSection.classList.remove("hidden");
        loadQuestion();
    };

    /* ===== RESET GAME ===== */
    function resetGame() {
        current = 0;
        score = 0;
        combo = 0;
        lives = 5;
        questionsSeen = 0;
        gameEnded = false;

        scoreEl.textContent = "Score: 0";
        document.getElementById("combo").textContent = `🔥 Combo: 0`;
        updateLives();
        updateProgress();
    }

    /* ===== LOAD QUESTION ===== */
    function loadQuestion() {
        if (current >= countries.length || lives === 0) {
            endQuiz();
            return;
        }

        const q = countries[current];
        questionsSeen++;

        questionEl.textContent = `Capital of ${q.country}?`;
        optionsEl.innerHTML = "";
        updateProgress();
        startTimer();

        getOptions(q.capital).forEach(opt => {
            const btn = document.createElement("button");
            btn.textContent = opt;
            btn.onclick = () => checkAnswer(btn, q.capital);
            optionsEl.appendChild(btn);
        });
    }

    function getOptions(correct) {
        const count = level === "easy" ? 2 : level === "medium" ? 3 : 4;
        const others = countries.map(c => c.capital).filter(c => c !== correct);
        shuffle(others);
        const opts = others.slice(0, count - 1).concat(correct);
        shuffle(opts);
        return opts;
    }

    /* ===== TIMER ===== */
    function startTimer() {
        clearInterval(timerInterval);
        timeLeft = maxTime;
        timerEl.textContent = `⏱️ ${timeLeft}s`;
        timerEl.style.color = "#333";

        timerInterval = setInterval(() => {
            timeLeft--;
            timerEl.textContent = `⏱️ ${timeLeft}s`;

            if (timeLeft <= 3 && timeLeft > 0) {
                timerEl.style.color = "red";
                tickSound.currentTime = 0;
                tickSound.play();
            }

            if (timeLeft === 0) {
                clearInterval(timerInterval);
                autoSkip();
            }
        }, 1000);
    }

    /* ===== CHECK ANSWER ===== */
    function checkAnswer(btn, correct) {
        clearInterval(timerInterval);
        disableButtons(correct);

        if (btn.textContent === correct) {
            score += 10;
            combo++;
            correctSound.currentTime = 0;
            correctSound.play();
            applyBonus();
        } else {
            handleWrong();
            btn.classList.add("wrong");
        }

        scoreEl.textContent = `Score: ${score}`;
        document.getElementById("combo").textContent = `🔥 Combo: ${combo}`;
        nextQuestion();
    }

    function autoSkip() {
        disableButtons(countries[current].capital);
        handleWrong();
        nextQuestion();
    }

    /* ===== HANDLE WRONG ===== */
    function handleWrong() {
        combo = 0;
        document.getElementById("combo").textContent = `🔥 Combo: 0`;
        lives--;
        wrongSound.currentTime = 0;
        wrongSound.play();
        updateLives();

        if (lives === 0 && !gameEnded) {
            triggerGameOver();
        }
    }

    /* ===== BONUS & COMBO POPUP ===== */
    function applyBonus() {
        let bonus = 0;
        if (combo === 3) bonus = 5;
        if (combo === 5) bonus = 10;
        if (combo === 10) bonus = 20;

        if (bonus > 0) {
            score += bonus;
            showComboPopup(`+${bonus} pts!`);
        }
    }

    function showComboPopup(text) {
        comboPopup.textContent = text;
        comboPopup.classList.add("show");

        // Remove class after animation ends so it can appear again
        setTimeout(() => {
            comboPopup.classList.remove("show");
        }, 1000); // matches CSS transition duration
    }

    /* ===== NEXT QUESTION ===== */
    function nextQuestion() {
        setTimeout(() => {
            if (lives === 0) return;
            current++;
            loadQuestion();
        }, 800);
    }

    function disableButtons(correct) {
        document.querySelectorAll("#options button").forEach(b => {
            b.disabled = true;
            if (b.textContent === correct) b.classList.add("correct");
        });
    }

    function updateLives() {
        livesEl.textContent = `❤️ Lives: ${lives}`;
    }

    function updateProgress() {
        const percent = Math.round((current / countries.length) * 100);
        progressBar.style.width = percent + "%";
        progressText.textContent = `Progress: ${current}/${countries.length}`;
    }

    /* ===== GAME OVER ===== */
    function triggerGameOver() {
        gameEnded = true;
        gameOverSound.currentTime = 0;
        gameOverSound.play();
        setTimeout(() => endQuiz(), 500); // Short delay for gameover sound
    }

    function endQuiz() {
        clearInterval(timerInterval);
        quizSection.classList.add("hidden");
        finalSection.classList.remove("hidden");

        finalScoreEl.textContent =
            `${username}, your final score is ${score} / ${questionsSeen * 10}`;

        finishSound.currentTime = 0;
        finishSound.play();
        saveLeaderboard();
    }

    /* ===== LEADERBOARD ===== */
    function saveLeaderboard() {
        const entry = { name: username, score };
        let data = JSON.parse(localStorage.getItem("capitalQuizLB")) || [];
        data.push(entry);
        data.sort((a,b)=>b.score - a.score);
        localStorage.setItem("capitalQuizLB", JSON.stringify(data));
        showLeaderboard(data.slice(0,5));
    }

    function showLeaderboard(list) {
        leaderboardEl.innerHTML = "";
        list.forEach((e,i)=>{
            const li = document.createElement("li");
            li.textContent = `${i+1}. ${e.name} — ${e.score}`;
            leaderboardEl.appendChild(li);
        });
    }

    /* ===== EXIT BUTTON ===== */
    exitBtn.onclick = () => {
        clearInterval(timerInterval);
        gameEnded = true;
        quizSection.classList.add("hidden");
        finalSection.classList.remove("hidden");

        finalScoreEl.textContent = `${username}, your final score is ${score} / ${questionsSeen*10}`;
        finishSound.currentTime = 0;
        finishSound.play();
        saveLeaderboard();
    };

    /* ===== UTILS ===== */
    function shuffle(arr) {
        for (let i=arr.length-1;i>0;i--){
            const j=Math.floor(Math.random()*(i+1));
            [arr[i],arr[j]]=[arr[j],arr[i]];
        }
    }

});
