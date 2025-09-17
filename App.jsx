import React, { useEffect, useMemo, useRef, useState } from "react";

export default function App() {
  const [size, setSize] = useState(5); // 3..9
  const [mode, setMode] = useState("numbers"); // numbers | numbers-desc | letters
  const [showFixation, setShowFixation] = useState(true);
  const [autoNext, setAutoNext] = useState(true);

  const [grid, setGrid] = useState([]);
  const [targetIndex, setTargetIndex] = useState(0);
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);

  const [ms, setMs] = useState(0);
  const timerRef = useRef(null);

  const bestKey = (s, m) => `schulte_best_${s}_${m}`;
  const bestMs = useMemo(() => {
    const raw = localStorage.getItem(bestKey(size, mode));
    return raw ? parseInt(raw, 10) : null;
  }, [size, mode]);

  const sequence = useMemo(() => {
    if (mode === "numbers" || mode === "numbers-desc") {
      const total = size * size;
      const arr = Array.from({ length: total }, (_, i) => i + 1);
      return (mode === "numbers" ? arr : arr.reverse()).map(String);
    }
    const total = size * size;
    const letters = [];
    let code = "A".charCodeAt(0);
    for (let i = 0; i < total; i++) {
      letters.push(String.fromCharCode(code));
      code++;
      if (code > "Z".charCodeAt(0)) code = "A".charCodeAt(0);
    }
    return letters;
  }, [size, mode]);

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startTimer = () => {
    if (timerRef.current) return;
    const start = performance.now() - ms;
    timerRef.current = window.setInterval(() => {
      setMs(Math.floor(performance.now() - start));
    }, 16);
  };

  const regenerate = () => {
    setFinished(false);
    setStarted(false);
    setTargetIndex(0);
    setMs(0);
    stopTimer();
    setGrid(shuffle(sequence));
  };

  useEffect(() => {
    regenerate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sequence]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.code === "Space") {
        e.preventDefault();
        if (!started) {
          setStarted(true);
          startTimer();
        } else if (finished) {
          regenerate();
        }
      } else if (e.key.toLowerCase() === "r") {
        regenerate();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [started, finished]);

  const handleClick = (value) => {
    if (!started) {
      setStarted(true);
      startTimer();
    }
    const current = sequence[targetIndex];
    if (value === current) {
      if (targetIndex + 1 === sequence.length) {
        setFinished(true);
        stopTimer();
        const prev = bestMs ?? Infinity;
        if (ms < prev) {
          localStorage.setItem(bestKey(size, mode), String(ms));
        }
      } else {
        setTargetIndex((i) => i + 1);
      }
    }
  };

  const nextTarget = sequence[targetIndex];

  const formatMs = (val) => {
    const s = Math.floor(val / 1000);
    const msec = val % 1000;
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m > 0 ? m + ":" : ""}${String(sec).padStart(2, "0")}.${String(msec).padStart(3, "0")}`;
  };

  const fontSize = useMemo(() => {
    const base = 8 - (size - 3); // 3=>8, 9=>2
    return `clamp(${base}vmin, ${base * 8}px, ${base * 10}px)`;
  }, [size]);

  return (
    <div className="app">
      <div className="container">
        <header className="header">
          <h1>Таблицы Шульте</h1>
          <div className="actions">
            <button className="btn btn-primary" onClick={() => { setStarted(true); if (!finished) startTimer(); }}>
              Старт (Space)
            </button>
            <button className="btn" onClick={regenerate}>Новая сетка (R)</button>
          </div>
        </header>

        <div className="top">
          <div className="card">
            <h2>Настройки</h2>
            <div className="row">
              <label>Размер сетки</label>
              <select value={size} onChange={(e) => setSize(parseInt(e.target.value))}>
                {[3,4,5,6,7,8,9].map(n => <option key={n} value={n}>{n} × {n}</option>)}
              </select>
            </div>
            <div className="row">
              <label>Режим</label>
              <select value={mode} onChange={(e) => setMode(e.target.value)}>
                <option value="numbers">Числа ↑ (1 → …)</option>
                <option value="numbers-desc">Числа ↓ (… → 1)</option>
                <option value="letters">Буквы (A → …)</option>
              </select>
            </div>
            <div className="row checkbox">
              <label><input type="checkbox" checked={showFixation} onChange={(e)=>setShowFixation(e.target.checked)} /> Точка фиксации в центре</label>
            </div>
            <div className="row checkbox">
              <label><input type="checkbox" checked={autoNext} onChange={(e)=>setAutoNext(e.target.checked)} /> Подсветка следующей цели</label>
            </div>
            <p className="hint">Совет: держи взгляд на центре, находи элементы периферийным зрением.</p>
          </div>

          <div className="card stats">
            <div>
              <div className="muted">Текущий режим</div>
              <div className="bold">{size}×{size} · {labelForMode(mode)}</div>
            </div>
            <div className="right">
              <div className="muted">Время</div>
              <div className="time">{formatMs(ms)}</div>
              <div className="muted">{started ? (finished ? "Готово! Нажми R для новой сетки" : "Идёт… нажми R для перезапуска") : "Нажми Старт или Space"}</div>
            </div>
            <div className="right">
              <div className="muted">Лучшее время</div>
              <div className="best">{bestMs ? formatMs(bestMs) : "—"}</div>
              <div className="muted">Сохраняется локально</div>
            </div>
          </div>
        </div>

        <div className="target">
          <div className="muted">Следующая цель:</div>
          <div className="next">{nextTarget}</div>
        </div>

        <div className="grid-wrap">
          {showFixation && <div className="fixation" title="Фиксация"></div>}
          <div className="grid" style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }} role="grid" aria-label="Таблица Шульте">
            {grid.map((value, idx) => {
              const isTarget = value === nextTarget;
              return (
                <button
                  key={`${value}-${idx}`}
                  onClick={() => handleClick(value)}
                  className={"cell" + (autoNext && isTarget ? " cell--target" : "")}
                  role="gridcell"
                  aria-label={`Клетка ${value}`}
                  style={{ fontSize }}
                >
                  {value}
                </button>
              );
            })}
          </div>
        </div>

        <div className="cards">
          <div className="card">
            <div className="bold mb">Как тренироваться</div>
            <ul>
              <li>Фокусируй взгляд на центре. Работай периферийным зрением.</li>
              <li>Начни с 3×3 → 4×4 → 5×5, повышай сложность постепенно.</li>
              <li>Веди учёт времени и соревнуйся с собой (смотри «Лучшее время»).</li>
            </ul>
          </div>
          <div className="card">
            <div className="bold mb">Горячие клавиши</div>
            <ul>
              <li><code>Space</code> — старт / продолжить</li>
              <li><code>R</code> — новая сетка</li>
            </ul>
          </div>
          <div className="card">
            <div className="bold mb">Режимы</div>
            <ul>
              <li><b>Числа ↑</b> — ищи 1 → N</li>
              <li><b>Числа ↓</b> — ищи N → 1</li>
              <li><b>Буквы</b> — A → … (новички: начни с 4×4)</li>
            </ul>
          </div>
        </div>

        <footer className="footer">Совет: 5–10 минут в день достаточно, чтобы увидеть прогресс за 2–3 недели.</footer>
      </div>
    </div>
  );
}

function labelForMode(m) {
  switch (m) {
    case "numbers": return "Числа по возрастанию";
    case "numbers-desc": return "Числа по убыванию";
    case "letters": return "Буквы по алфавиту";
    default: return m;
  }
}
