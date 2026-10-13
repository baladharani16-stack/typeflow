import { useEffect, useRef, useState } from "react";
import "./App.css";

const PASSAGES = {
  Easy: [
    "Learning something new every day helps us grow and become better. Practice makes difficult tasks easier over time.",
    "A good habit can change your life. Read a little, write a little, and keep improving your skills every day.",
    "Technology helps people solve problems and connect with others. Use your time wisely and keep learning new things.",
  ],
  Medium: [
    "Consistency is more important than perfection. Small improvements made every day can produce excellent results over time.",
    "Successful developers write readable code, solve problems carefully, and test their applications before sharing them with users.",
    "Building a useful project requires planning, patience, creativity, and the ability to learn from mistakes along the way.",
  ],
  Hard: [
    "Modern applications combine thoughtful design, reliable architecture, efficient algorithms, and accessible interfaces to create meaningful user experiences.",
    "Debugging requires a systematic approach: reproduce the issue, inspect relevant state, identify the root cause, and verify the solution.",
    "Software development is an iterative process in which experimentation, critical thinking, and continuous feedback improve product quality.",
  ],
};

const DURATIONS = [15, 30, 60];
const DIFFICULTIES = ["Easy", "Medium", "Hard"];
const HISTORY_KEY = "typeflow-history-v1";

function getPassage(difficulty, previous = "") {
  const options = PASSAGES[difficulty].filter(
    (passage) => passage !== previous
  );
  const available = options.length ? options : PASSAGES[difficulty];
  return available[Math.floor(Math.random() * available.length)];
}

function getStats(typedText, passage, elapsedSeconds) {
  let correctChars = 0;

  for (let i = 0; i < typedText.length; i++) {
    if (typedText[i] === passage[i]) {
      correctChars++;
    }
  }

  const errors = typedText.length - correctChars;
  const accuracy =
    typedText.length === 0
      ? 100
      : Math.round((correctChars / typedText.length) * 100);

  const minutes = elapsedSeconds / 60;
  const wpm =
    minutes <= 0 ? 0 : Math.round(correctChars / 5 / minutes);

  return { wpm, accuracy, errors, correctChars };
}

function readHistory() {
  try {
    const saved = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function App() {
  const [duration, setDuration] = useState(30);
  const [difficulty, setDifficulty] = useState("Medium");
  const [passage, setPassage] = useState(() => getPassage("Medium"));
  const [typedText, setTypedText] = useState("");
  const [timeLeft, setTimeLeft] = useState(30);
  const [isRunning, setIsRunning] = useState(false);
  const [history, setHistory] = useState(readHistory);
  const [showHistory, setShowHistory] = useState(false);

  const inputRef = useRef(null);
  const savedResultRef = useRef(false);

  const elapsedSeconds = duration - timeLeft;
  const stats = getStats(typedText, passage, elapsedSeconds);
  const isFinished = timeLeft === 0;

  const bestWpm = history.length
    ? Math.max(...history.map((item) => item.wpm))
    : 0;

  const averageAccuracy = history.length
    ? Math.round(
        history.reduce((sum, item) => sum + item.accuracy, 0) /
          history.length
      )
    : 0;

  useEffect(() => {
    if (!isRunning) return;

    const timer = window.setInterval(() => {
      setTimeLeft((previous) => {
        if (previous <= 1) {
          window.clearInterval(timer);
          setIsRunning(false);
          return 0;
        }

        return previous - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [isRunning]);

  useEffect(() => {
    if (!isFinished || savedResultRef.current || !typedText.length) {
      return;
    }

    savedResultRef.current = true;

    const result = {
      id: `${Date.now()}-${Math.random()}`,
      wpm: stats.wpm,
      accuracy: stats.accuracy,
      errors: stats.errors,
      difficulty,
      duration,
      date: new Date().toLocaleString(),
    };

    setHistory((previous) => {
      const updated = [result, ...previous].slice(0, 20);

      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
      } catch {
        // The current test still works if storage is unavailable.
      }

      return updated;
    });
  }, [
    isFinished,
    typedText,
    stats.wpm,
    stats.accuracy,
    stats.errors,
    difficulty,
    duration,
  ]);

  function resetTest(nextDuration = duration, nextDifficulty = difficulty) {
    setIsRunning(false);
    setDuration(nextDuration);
    setDifficulty(nextDifficulty);
    setTimeLeft(nextDuration);
    setTypedText("");
    setPassage((previous) => getPassage(nextDifficulty, previous));
    savedResultRef.current = false;

    window.setTimeout(() => inputRef.current?.focus(), 0);
  }

  function handleTyping(event) {
    if (isFinished) return;

    const value = event.target.value;

    // Prevent typing beyond the displayed paragraph.
    if (value.length > passage.length) return;

    setTypedText(value);

    if (value.length > 0 && !isRunning && timeLeft > 0) {
      setIsRunning(true);
    }

    if (value.length === passage.length) {
      setIsRunning(false);
    }
  }

  function clearHistory() {
    setHistory([]);

    try {
      localStorage.removeItem(HISTORY_KEY);
    } catch {
      // Ignore storage errors.
    }
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#home" aria-label="TypeFlow home">
          <span className="brand-icon">T</span>
          <span>typeflow<span className="brand-dot">.</span></span>
        </a>

        <div className="topbar-right">
          <span className="status-dot" />
          <span className="status-label">Typing practice</span>
          <button
            className="history-toggle"
            onClick={() => setShowHistory((value) => !value)}
          >
            {showHistory ? "Hide history" : "History"}
          </button>
        </div>
      </header>

      <section className="hero" id="home">
        <div className="eyebrow">
          <span className="eyebrow-line" />
          YOUR DAILY PRACTICE
        </div>
        <h1>
          Find your <span>flow.</span>
        </h1>
        <p className="hero-description">
          Less hesitation. More precision. Build your typing speed,
          one keystroke at a time.
        </p>
      </section>

      <section className="stats-grid" aria-label="Current test statistics">
        <article className="stat-card">
          <div className="stat-label">SPEED <span>↗</span></div>
          <div className="stat-value">
            {stats.wpm}<small> WPM</small>
          </div>
          <div className="stat-foot">Words per minute</div>
        </article>

        <article className="stat-card">
          <div className="stat-label">ACCURACY <span>◎</span></div>
          <div className="stat-value">
            {stats.accuracy}<small>%</small>
          </div>
          <div className="stat-foot">Character precision</div>
        </article>

        <article className="stat-card">
          <div className="stat-label">ERRORS <span>⌁</span></div>
          <div className="stat-value">{stats.errors}</div>
          <div className="stat-foot">Incorrect characters</div>
        </article>

        <article className="stat-card timer-card">
          <div className="stat-label">TIME LEFT <span>◷</span></div>
          <div className={`stat-value ${timeLeft <= 5 ? "urgent" : ""}`}>
            00:{String(timeLeft).padStart(2, "0")}
          </div>
          <div className="timer-track">
            <div
              className="timer-progress"
              style={{ width: `${(timeLeft / duration) * 100}%` }}
            />
          </div>
        </article>
      </section>

      <section className="practice-card">
        <div className="practice-heading">
          <div>
            <span className="section-kicker">THE WORKOUT</span>
            <h2>Ready, set, type.</h2>
          </div>
          <span className={`live-badge ${isRunning ? "live" : ""}`}>
            <span />
            {isFinished ? "Completed" : isRunning ? "Live test" : "Ready"}
          </span>
        </div>

        <div className="controls">
          <div className="control-group">
            <span className="control-label">DURATION</span>
            <div className="segmented">
              {DURATIONS.map((seconds) => (
                <button
                  key={seconds}
                  className={duration === seconds ? "selected" : ""}
                  disabled={isRunning}
                  onClick={() => resetTest(seconds, difficulty)}
                >
                  {seconds}s
                </button>
              ))}
            </div>
          </div>

          <div className="control-group">
            <span className="control-label">DIFFICULTY</span>
            <div className="segmented">
              {DIFFICULTIES.map((level) => (
                <button
                  key={level}
                  className={difficulty === level ? "selected" : ""}
                  disabled={isRunning}
                  onClick={() => resetTest(duration, level)}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="passage-box">
          <div className="passage-top">
            <span>TYPE THE TEXT BELOW</span>
            <span>{typedText.length} / {passage.length} characters</span>
          </div>

          <div className="passage-text" aria-label="Text to type">
            {passage.split("").map((character, index) => {
              let className = "";

              if (index < typedText.length) {
                className =
                  typedText[index] === character
                    ? "character-correct"
                    : "character-wrong";
              } else if (index === typedText.length && !isFinished) {
                className = "character-current";
              }

              return (
                <span className={className} key={index}>
                  {character}
                </span>
              );
            })}
          </div>
        </div>

        <label className="typing-label" htmlFor="typing-input">
          YOUR INPUT
        </label>
        <textarea
          ref={inputRef}
          id="typing-input"
          className="typing-input"
          placeholder={
            isFinished
              ? "Test completed. Start a new test to keep practicing."
              : "Click here and start typing the text above..."
          }
          value={typedText}
          onChange={handleTyping}
          disabled={isFinished}
          spellCheck="false"
          autoCapitalize="off"
          autoComplete="off"
          autoCorrect="off"
          rows={3}
        />

        <div className="practice-footer">
          <p>
            {isFinished
              ? "Nice work! Review your results or try again."
              : isRunning
              ? "Keep going — accuracy matters as much as speed."
              : "The timer starts with your first keystroke."}
          </p>

          <button
            className="restart-button"
            onClick={() => resetTest(duration, difficulty)}
          >
            <span>↻</span> {isFinished ? "Try again" : "Restart test"}
          </button>
        </div>

        {isFinished && (
          <div className="result-banner">
            <div>
              <span className="section-kicker">TEST COMPLETE</span>
              <h3>You finished with {stats.wpm} WPM!</h3>
              <p>
                {stats.accuracy}% accuracy · {stats.errors} incorrect
                characters
              </p>
            </div>
            <span className="result-trophy">✦</span>
          </div>
        )}
      </section>

      <section className="bottom-grid">
        <article className="info-card">
          <span className="info-icon">⌘</span>
          <div>
            <h3>Stay consistent</h3>
            <p>Short, regular practice sessions help build muscle memory.</p>
          </div>
        </article>

        <article className="info-card">
          <span className="info-icon">◎</span>
          <div>
            <h3>Accuracy first</h3>
            <p>Build a clean typing rhythm before pushing for higher speed.</p>
          </div>
        </article>
      </section>

      <section className="history-section">
        {showHistory && (
          <div className="history-card">
            <div className="history-heading">
              <div>
                <span className="section-kicker">YOUR PROGRESS</span>
                <h2>Practice history</h2>
              </div>
              <button className="clear-button" onClick={clearHistory}>
                Clear history
              </button>
            </div>

            <div className="history-summary">
              <div>
                <span>PERSONAL BEST</span>
                <strong>{bestWpm} <small>WPM</small></strong>
              </div>
              <div>
                <span>AVERAGE ACCURACY</span>
                <strong>{averageAccuracy}<small>%</small></strong>
              </div>
              <div>
                <span>TESTS SAVED</span>
                <strong>{history.length}</strong>
              </div>
            </div>

            {history.length === 0 ? (
              <p className="empty-history">
                Your completed tests will appear here.
              </p>
            ) : (
              <div className="history-list">
                {history.map((item) => (
                  <div className="history-row" key={item.id}>
                    <div>
                      <strong>{item.wpm} WPM</strong>
                      <span>{item.date}</span>
                    </div>
                    <span>{item.accuracy}% accuracy</span>
                    <span>{item.duration}s · {item.difficulty}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      <footer className="footer">
        <a className="footer-brand" href="#home">typeflow.</a>
        <span>Built for better typing, one day at a time.</span>
        <span>Practice. Progress. Repeat.</span>
      </footer>
    </main>
  );
}

export default App;