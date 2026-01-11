import React, { useEffect } from 'react';
import BattleArena from './components/BattleArena';
import { audio } from './utils/audio';
import './App.css';

function App() {
  useEffect(() => {
    const handleGesture = () => {
      audio.init();
      window.removeEventListener('click', handleGesture);
      window.removeEventListener('keydown', handleGesture);
    };

    window.addEventListener('click', handleGesture);
    window.addEventListener('keydown', handleGesture);
  }, []);

  return <BattleArena />;
}

export default App;
