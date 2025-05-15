import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';

import HomePage from './pages/Home/HomePage';
import EditorPage from './pages/Editor/EditorPage';
import PreviewPage from './pages/Preview/PreviewPage';

import { MediaProvider } from './context/MediaContext';

function App() {
  return (
    <Router>
      <MediaProvider>
        <div className="app">
          <nav className="navbar">
            <div className="container">
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                <div className="logo">
                  <span className="logo-symbol">*</span> MemeMaker
                </div>
                <div>
                  <Link to="/" className="btn" style={{ marginRight: '12px' }}>
                    Home
                  </Link>
                  <Link to="/editor" className="btn" style={{ marginRight: '12px' }}>
                    Editor
                  </Link>
                  <Link to="/preview" className="btn">
                    Preview
                  </Link>
                </div>
              </div>
            </div>
          </nav>
          <main style={{ paddingTop: 80 }}>
            <div className="container">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/editor" element={<EditorPage />} />
                <Route path="/preview" element={<PreviewPage />} />
              </Routes>
            </div>
          </main>
        </div>
      </MediaProvider>
    </Router>
  );
}

export default App;
