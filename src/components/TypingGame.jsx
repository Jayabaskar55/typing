import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";


import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const easyParagraphs = [
  "The quick brown fox jumps over the lazy dog.",
  "Typing is fun when you get better at it.",
  "Practice daily to improve your typing skills.",
];

const hardParagraphs = [
  "A good developer understands the importance of clean, maintainable code.",
  "Learning React opens up many opportunities in frontend development.",
  "Debugging is twice as hard as writing the code in the first place.",
];

const veryHardParagraphs = [
  "JavaScript is single-threaded, event-driven, and asynchronous, which makes its concurrency model both powerful and complex.",
  "Framer Motion enables developers to easily orchestrate animations across components using declarative syntax and powerful transitions.",
  "Accessibility in web design is essential for inclusivity, ensuring that all users regardless of ability can interact with content seamlessly.",
];

const TypingGame = () => {
  const [level, setLevel] = useState("easy");
  const [paragraphs, setParagraphs] = useState(easyParagraphs);
  const [text, setText] = useState(easyParagraphs[0]);
  const [input, setInput] = useState("");
  const [startTime, setStartTime] = useState(null);
  const [isFinished, setIsFinished] = useState(false);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [timeLeft, setTimeLeft] = useState(30);
  const [username, setUsername] = useState("");
  const [darkMode, setDarkMode] = useState(true);
  const [countdown, setCountdown] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [leaderboard, setLeaderboard] = useState(() => JSON.parse(localStorage.getItem("leaderboard")) || []);
  const [emoji, setEmoji] = useState(null);
  const [correctStreak, setCorrectStreak] = useState();

  const timerRef = useRef(null);
  const inputRef = useRef(null);
  const correctAudio = useRef(new Audio("/correct.mp3"));
  const wrongAudio = useRef(new Audio("/wrong.mp3"));


  useEffect(() => {
    if (startTime && timeLeft > 0 && !isFinished) {
      timerRef.current = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
      return () => clearInterval(timerRef.current);
    } else if (timeLeft === 0 && !isFinished) {
      finishGame();
    }
  }, [timeLeft, startTime]);

  useEffect(() => {
    const disableContextMenu = (e) => e.preventDefault();
    const disablePaste = (e) => e.preventDefault();
    const disableDrag = (e) => e.preventDefault();

    document.addEventListener("contextmenu", disableContextMenu);
    document.addEventListener("paste", disablePaste);
    document.addEventListener("copy", disablePaste);
    document.addEventListener("cut", disablePaste);
    document.addEventListener("dragstart", disableDrag);
    document.addEventListener("drop", disableDrag);

    return () => {
      document.removeEventListener("contextmenu", disableContextMenu);
      document.removeEventListener("paste", disablePaste);
      document.removeEventListener("copy", disablePaste);
      document.removeEventListener("cut", disablePaste);
      document.removeEventListener("dragstart", disableDrag);
      document.removeEventListener("drop", disableDrag);
    };
  }, []);

  const handleStart = () => {
    let time = 3;
    setCountdown(time);
    const interval = setInterval(() => {
      time--;
      if (time === 0) {
        clearInterval(interval);
        setCountdown(null);
        setGameStarted(true);

        const randomIndex = Math.floor(Math.random() * paragraphs.length);
        setText(paragraphs[randomIndex]);
        setInput("");
        setStartTime(Date.now());
        setIsFinished(false);
        setWpm(0);
        setAccuracy(100);
        setTimeLeft(30);
        inputRef.current.focus();
      } else {
        setCountdown(time);
      }
    }, 1000);
  };

  const handleStop = () => {
  clearInterval(timerRef.current);
  setIsFinished(true);
  setTimeLeft(0);
  setInput(""); // clear input box
  toast.error("⛔ Game stopped!");
};


  const finishGame = () => {
    const inputWords = input.trim().split(/\s+/);
    const expectedWords = text.trim().split(/\s+/);
    const correctWords = inputWords.filter((word, idx) => word === expectedWords[idx]).length;
    const accCalc = Math.round((correctWords / expectedWords.length) * 100);
    const wpmCalc = Math.round(correctWords / 0.5);

    setWpm(wpmCalc);
    setAccuracy(accCalc);
    setIsFinished(true);

    const newScore = {
      user: username.trim(),
      wpm: wpmCalc,
      accuracy: accCalc,
      date: new Date().toLocaleString(),
    };
    const updatedLeaderboard = [newScore, ...leaderboard].slice(0, 5);
    setLeaderboard(updatedLeaderboard);
    localStorage.setItem("leaderboard", JSON.stringify(updatedLeaderboard));

    const finalEmoji = accCalc > 85 ? "🥳" : accCalc > 50 ? "🙂" : "😢";
    setEmoji(finalEmoji);

    toast.success(`✅ Finished! WPM: ${wpmCalc} | Accuracy: ${accCalc}%`);
  };

  const handleChange = (e) => {
    const val = e.target.value;
    const lastChar = val.slice(-1);
    const currentIndex = val.length - 1;

    if (text[currentIndex] === lastChar) {
      correctAudio.current.play();
      setCorrectStreak((prev) => {
        const newStreak = prev + 1;
        if (newStreak >= 5) {
          setEmoji("😃");
        } else {
          setEmoji("💪");
        }
        return newStreak;
      });
    } else {
      wrongAudio.current.play();
      setEmoji("😢");
      setCorrectStreak(0);
    }

    setInput(val);
  };
  const renderText = () => {
    const inputWords = input.trim().split(" ");
    const textWords = text.trim().split(" ");

    return textWords.map((word, i) => {
      const typedWord = inputWords[i];
      const isTyped = typedWord !== undefined && typedWord !== "";
      const isCorrect = typedWord === word;

      return (
        <span
          key={i}
          className={`inline-block mr-2 ${
            isTyped ? (isCorrect ? "text-green-400" : "text-red-500") : ""
          }`}
        >
          {word}
        </span>
      );
    });
  };

  const changeLevel = (lvl) => {
    setLevel(lvl);
    let newParagraphs;
    if (lvl === "easy") newParagraphs = easyParagraphs;
    else if (lvl === "hard") newParagraphs = hardParagraphs;
    else newParagraphs = veryHardParagraphs;

    setParagraphs(newParagraphs);
    setText(newParagraphs[0]);
  };

const handleKeyDown = (e) => {
  if (e.key === "Enter") {
    if (!gameStarted && username.trim() !== "") {
      handleStart();
    } else if (gameStarted) {
      handleStop(); // manually stop game
    }
  }




  return (
    <>
      {countdown > 0 && <h2 className="text-xl font-bold">Starting in: {countdown}</h2>}
    </>
  );
}

  return (
    <div
      className={`${
        darkMode ? "bg-black text-white" : "bg-white text-black"
      } w-full p-6 user-select-none`}
    >
      <Toaster />
      {/* Your existing UI layout */}
      {emoji && (
        <div className="text-5xl text-center my-4 animate-pulse">{emoji}</div>
      )}
      <Toaster />
      <div>
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">⚡ Typing Speed Test</h1>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="bg-gray-600 text-green-500 px-4 py-1 rounded"
          >
            {darkMode ? "Light Mode" : "Dark Mode"}
          </button>
        </div>

        <div className="mb-4">
        <input
          type="text"
          placeholder="Enter your name"
          className=" p-2 rounded bg-gray-800 border border-gray-600"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyDown={handleKeyDown}
        />
      </div>

  
      {username && (
        <p className="text-sm text-gray-400 mb-2">👤 Playing as: <strong>{username}</strong></p>
      )}
  <AnimatePresence>
        {countdown > 0 && (
          <motion.div
            key="countdown"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="text-center text-6xl text-yellow-400 font-bold mb-4"
          >
            {countdown === 0 ? "Go!" : countdown}
          </motion.div>
        )}
      </AnimatePresence>
        <div className="flex gap-4 mb-4">
          <button
            onClick={() => changeLevel("easy")}
            className={`px-4 py-2 rounded ${
              level === "easy" ? "bg-green-600" : "bg-gray-700"
            }`}
          >
            Easy
          </button>
          <button
            onClick={() => changeLevel("hard")}
            className={`px-4 py-2 rounded ${
              level === "hard" ? "bg-red-600" : "bg-gray-700"
            }`}
          >
            Hard
          </button>
          <button
            onClick={() => changeLevel("veryHard")}
            className={`px-4 py-2 rounded ${
              level === "veryHard" ? "bg-purple-600" : "bg-gray-700"
            }`}
          >
            Very Hard
          </button>
        </div>

        <div className="bg-gray-800 p-4 rounded mb-4 text-lg leading-7 min-h-[120px]">
          {renderText()}
        </div>

        <textarea
          ref={inputRef}
          disabled={isFinished || !text}
          rows={5}
          className="w-full p-3 rounded outline-none border focus:ring-2 focus:ring-blue-500 mb-4 bg-gray-900 text-white"
          value={input}
          onChange={handleChange}
          placeholder="Start typing here..."
        />

        <div className="flex justify-between items-center mb-4">
          <button
            onClick={handleStart}
            className="bg-blue-600 text-black hover:bg-blue-700 px-6 py-2 rounded font-semibold"
          >
            {text && !isFinished && startTime ? "Restart" : "Start"}
          </button>

          {startTime && !isFinished && (
            <button
              onClick={handleStop}
              className="bg-red-600 text-black hover:bg-red-700 px-6 py-2 rounded font-semibold"
            >
              Stop
            </button>
          )}

          <div className="ml-auto text-sm animate-pulse">
            ⏱ Time Left: <strong>{timeLeft}s</strong>
          </div>
        </div>

        <AnimatePresence>
          {isFinished && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-green-700 p-4 rounded text-center text-white mb-6"
            >
              <h2 className="text-xl font-bold mb-2">🎉 Results</h2>
              <p>WPM: <strong>{wpm}</strong></p>
              <p>Accuracy: <strong>{accuracy}%</strong></p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-6">
          <h2 className="text-xl font-bold mb-2">🏆 Leaderboard (Top 5)</h2>
          <ul className="bg-gray-700 p-4 rounded space-y-2 text-white">
            {leaderboard.length === 0 ? (
              <p className="text-sm">No scores yet.</p>
            ) : (
              leaderboard.map((score, idx) => (
                <li key={idx} className="text-sm flex justify-between">
                  <span>{score.user} | {score.date}</span>
                  <span>WPM: {score.wpm} / Acc: {score.accuracy}%</span>
                </li>
              ))
            )}
          </ul>
        </div>

        {leaderboard.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mt-10"
          >
            <h2 className="text-xl font-bold mb-2 text-center">📈 Performance Chart</h2>
            <div className="bg-gray-800 p-4 rounded">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={leaderboard}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fill: "#ccc", fontSize: 10 }} />
                  <YAxis tick={{ fill: "#ccc" }} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="wpm"
                    stroke="#00ff00"
                    strokeWidth={2}
                    name="WPM"
                    activeDot={{ r: 8 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="accuracy"
                    stroke="#00bfff"
                    strokeWidth={2}
                    name="Accuracy (%)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default TypingGame;
