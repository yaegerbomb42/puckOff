import React, { useEffect, useState } from 'react';
import BattleArena from './components/BattleArena';
import StartupAnimation from './components/UI/StartupAnimation';
import AuthScreen from './components/UI/AuthScreen';
import LoadingScreen from './components/UI/LoadingScreen';
import { useAuth } from './contexts/AuthContext';
import { audio } from './utils/audio';
import AutoTester from './components/Debug/AutoTester';
import './App.css';

function App() {
  const { user, loading, loginWithGoogle } = useAuth();
  const [showIntro, setShowIntro] = useState(true);
  const [showTester, setShowTester] = useState(false);
  const [offlineMode, setOfflineMode] = useState(false);

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

  if (showIntro) {
    return <StartupAnimation onComplete={() => setShowIntro(false)} />;
  }

  if (loading) {
    return <LoadingScreen />;
  }

  // Auth Wall
  if (!user && !offlineMode) {
    return (
      <AuthScreen
        onLogin={loginWithGoogle}
        onOffline={() => setOfflineMode(true)}
      />
    );
  }

  return (
    <>
      <BattleArena forceOffline={offlineMode} />
      {showTester && <AutoTester onClose={() => setShowTester(false)} />}
    </>
  );
}

export default App;
