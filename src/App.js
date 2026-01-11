import React, { useEffect, useState } from 'react';
import BattleArena from './components/BattleArena';
import StartupAnimation from './components/UI/StartupAnimation';
import { audio } from './utils/audio';
import AutoTester from './components/Debug/AutoTester';
import './App.css';

function App() {
  const [showIntro, setShowIntro] = useState(true);
  const [showTester, setShowTester] = useState(false);

  useEffect(() => {
    // Check for test mode query param
    if (window.location.search.includes('test=true')) {
      setShowTester(true);
      setShowIntro(false); // Skip intro in test mode
    }
  }, []);

  useEffect(() => {
    const handleGesture = () => {
      audio.init();
      window.removeEventListener('click', handleGesture);
      window.removeEventListener('keydown', handleGesture);
    };

    window.addEventListener('click', handleGesture);
    window.addEventListener('keydown', handleGesture);
  }, []);

  return (
    <>
      {showIntro && (
        <StartupAnimation onComplete={() => setShowIntro(false)} />
      )}
      <BattleArena />
      {showTester && <AutoTester onClose={() => setShowTester(false)} />}
    </>
  );
}

export default App;
