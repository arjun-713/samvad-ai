import { useState, useEffect } from 'react';
import './App.css';
import Header from './components/Header';
import LiveSession from './pages/LiveSession';
import Streaming from './pages/Streaming';
import Assistive from './pages/Assistive';
import Replay from './pages/Replay';

function App() {
  const [currentPage, setCurrentPage] = useState('live');
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const renderPage = () => {
    switch (currentPage) {
      case 'live':
        return <LiveSession />;
      case 'streaming':
        return <Streaming />;
      case 'assistive':
        return <Assistive />;
      case 'replay':
        return <Replay />;
      default:
        return <LiveSession />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-x-hidden bg-[#faf8f6] dark:bg-[#1a1614] transition-colors">
      <div className="absolute inset-0 mandala-bg pointer-events-none z-0"></div>

      <Header
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        darkMode={darkMode}
        onDarkModeToggle={() => setDarkMode(!darkMode)}
      />

      {renderPage()}
    </div>
  );
}

export default App;
