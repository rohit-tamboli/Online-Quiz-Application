const quizSettings = {};
let user = "";
let state = { questions: [], current: 0, score: 0, timer: null, timeLeft: 20 };

function showStep(id) {
  document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// Fetch categories
fetch('https://opentdb.com/api_category.php')
  .then(r => r.json())
  .then(data => {
    const sel = document.getElementById('category');
    data.trivia_categories.forEach(c => {
      let o = document.createElement('option'); o.value = c.id; o.textContent = c.name; sel.appendChild(o);
    });
  });

// Step navigation
document.getElementById('nextName').addEventListener('click', () => {
  let val = document.getElementById('username').value.trim();
  if (!val) return alert("Enter your name");
  user = val;
  showStep('stepAmount');
});
document.getElementById('guestBtn').addEventListener('click', () => { user = "Guest"; showStep('stepAmount'); });
document.getElementById('nextAmount').addEventListener('click', () => {
  let amt = parseInt(document.getElementById('amount').value);
  if (!amt || amt < 1 || amt > 50) return alert("Enter 1–50");
  quizSettings.amount = amt; showStep('stepCategory');
});
document.getElementById('nextCategory').addEventListener('click', () => {
  quizSettings.category = document.getElementById('category').value;
  showStep('stepDifficulty');
});
document.getElementById('nextDifficulty').addEventListener('click', () => {
  quizSettings.difficulty = document.getElementById('difficulty').value;
  showStep('stepType');
});
document.getElementById('nextType').addEventListener('click', () => {
  quizSettings.type = document.getElementById('type').value;
  const catSel = document.getElementById('category');
  const catText = catSel.options[catSel.selectedIndex].text;
  document.getElementById('summary').innerHTML = `
        👤 User: <b>${user}</b><br>
        ❓ Questions: <b>${quizSettings.amount}</b><br>
        📂 Category: <b>${quizSettings.category ? catText : 'Any'}</b><br>
        🎯 Difficulty: <b>${quizSettings.difficulty || 'Any'}</b><br>
        📝 Type: <b>${quizSettings.type || 'Any'}</b>`;
  showStep('stepStart');
});

// Start quiz
document.getElementById('startQuizBtn').addEventListener('click', () => {
  const btn = document.getElementById('startQuizBtn'); btn.disabled = true; btn.innerHTML = `<span class="loader"></span> Loading...`;
  const p = new URLSearchParams({ amount: quizSettings.amount });
  if (quizSettings.category) p.append('category', quizSettings.category);
  if (quizSettings.difficulty) p.append('difficulty', quizSettings.difficulty);
  if (quizSettings.type) p.append('type', quizSettings.type);
  fetch("https://opentdb.com/api.php?" + p.toString())
    .then(r => r.json()).then(data => {
      if (!data.results.length) return alert("No questions found"), location.reload();
      state.questions = data.results.map(q => ({
        question: q.question,
        correct: q.correct_answer,
        answers: shuffle([q.correct_answer, ...q.incorrect_answers]),
        category: q.category
      }));
      state.current = 0; state.score = 0; renderQuizUI();
    });
});

function renderQuizUI() {
  document.querySelector('.container').innerHTML = `
        <header><h1>🔥 Quiz — ${user}</h1></header>
        <div class="card">
          <div class="meta">
            <div class="pill" id="qIndex">0/0</div>
            <div class="pill" id="qCategory">Category</div>
            <div class="pill timer" id="timer">--</div>
          </div>
          <div class="question" id="question"></div>
          <div class="answers" id="answers"></div>
          <div class="footer" style="display:flex;align-items:center;margin-top:16px;">
            <div class="pill small" id="scorePill">Score:0</div>
            <div class="progress"><span id="progBar"></span></div>
          </div>
        </div>
        <div class="card finish" id="finish">
          <div class="score" id="finalScore"></div>
          <div class="small" id="finalText"></div>
          <div style="display:flex;gap:10px;margin-top:12px">
            <button onclick="location.reload()">Play Again</button>
          </div>
        </div>`;
  initRefs(); renderQuestion();
}

function initRefs() { state.qEl = document.getElementById('question'); state.aEl = document.getElementById('answers'); state.tEl = document.getElementById('timer'); state.qIndex = document.getElementById('qIndex'); state.qCat = document.getElementById('qCategory'); state.progBar = document.getElementById('progBar'); state.scorePill = document.getElementById('scorePill'); state.finish = document.getElementById('finish'); state.finalScore = document.getElementById('finalScore'); state.finalText = document.getElementById('finalText'); }
function shuffle(a) { return a.sort(() => Math.random() - 0.5); }

function renderQuestion() {
  if (state.current >= state.questions.length) return finishQuiz();
  const q = state.questions[state.current];
  state.qEl.innerHTML = q.question; state.qCat.textContent = q.category; state.qIndex.textContent = `${state.current + 1}/${state.questions.length}`;
  state.aEl.innerHTML = ""; q.answers.forEach(ans => { let d = document.createElement('div'); d.className = "answer"; d.textContent = ans; d.onclick = () => checkAnswer(d, q.correct); state.aEl.appendChild(d); });
  startTimer(); state.progBar.style.width = ((state.current + 1) / state.questions.length * 100) + "%";
}

function checkAnswer(el, correct) {
  stopTimer(); const chosen = el.textContent;
  state.aEl.querySelectorAll('.answer').forEach(a => { a.classList.add('disabled'); if (a.textContent === correct) a.classList.add('correct'); });
  if (chosen === correct) { state.score++; el.classList.add('correct'); } else el.classList.add('wrong');
  state.scorePill.textContent = `Score:${state.score}`;
  setTimeout(() => { state.current++; renderQuestion(); }, 1000);
}

function startTimer() {
  state.timeLeft = 20;
  state.tEl.textContent = state.timeLeft;
  state.tEl.style.color = "";
  state.timer = setInterval(() => {
    state.timeLeft--;
    state.tEl.textContent = state.timeLeft;
    if (state.timeLeft <= 5) state.tEl.style.color = "var(--danger)";
    if (state.timeLeft <= 0) {
      stopTimer();
      state.current++;
      renderQuestion();
    }
  }, 1000);
}

function stopTimer() { clearInterval(state.timer); }

function finishQuiz() {
  state.qEl.innerHTML = ""; state.aEl.innerHTML = "";
  state.finish.classList.add('show');
  state.finalScore.textContent = `${state.score}/${state.questions.length}`;
  state.finalText.textContent = state.score > state.questions.length / 2 ? "🌟 Great job!" : "💡 Keep practicing!";
}