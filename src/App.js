import React, { useState, useEffect, useRef } from 'react';
import { studentNames } from './studentNames';
import './App.css';

function App() {
  const [isRunning, setIsRunning] = useState(false);
  const [currentName, setCurrentName] = useState('点击开始抽签');
  const [finalName, setFinalName] = useState('');
  const [isSlowingDown, setIsSlowingDown] = useState(false);
  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);
  const speedRef = useRef(50);

  const getRandomName = () => {
    const randomIndex = Math.floor(Math.random() * studentNames.length);
    return studentNames[randomIndex];
  };

  const startPicking = () => {
    if (isRunning) return;
    
    setIsRunning(true);
    setIsSlowingDown(false);
    setFinalName('');
    speedRef.current = 50;
    
    const updateName = () => {
      setCurrentName(getRandomName());
    };
    
    intervalRef.current = setInterval(updateName, speedRef.current);
  };

  const stopPicking = () => {
    if (!isRunning || isSlowingDown) return;
    
    setIsSlowingDown(true);
    clearInterval(intervalRef.current);
    
    const totalDuration = 3000; // 3秒总时长
    const startTime = Date.now();
    let currentSpeed = speedRef.current;
    
    const slowDownStep = () => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / totalDuration;
      
      if (progress >= 1) {
        // 3秒到达，停止并显示最终结果
        setIsRunning(false);
        setIsSlowingDown(false);
        const final = getRandomName();
        setCurrentName(final);
        setFinalName(final);
        return;
      }
      
      // 根据进度调整速度，使其在3秒内逐渐减慢
      currentSpeed = speedRef.current + (progress * 750); // 从初始速度逐渐增加到800ms
      setCurrentName(getRandomName());
      
      timeoutRef.current = setTimeout(slowDownStep, currentSpeed);
    };
    
    slowDownStep();
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <div className="app">
      <div className="container">
        <h1 className="title">
          <span className="title-icon">🎯</span>
          随机点名系统
          <span className="title-icon">🎯</span>
        </h1>
        
        <div className="name-display-container">
          <div className={`name-display ${isRunning ? 'running' : ''} ${finalName ? 'final' : ''}`}>
            {currentName}
          </div>
          
          {finalName && (
            <div className="confetti-container">
              {[...Array(20)].map((_, i) => (
                <div key={i} className="confetti" style={{
                  '--delay': `${i * 0.1}s`,
                  '--x': `${Math.random() * 100}%`,
                  '--rotation': `${Math.random() * 360}deg`
                }}></div>
              ))}
            </div>
          )}
        </div>
        
        <div className="controls">
          <button 
            className={`control-btn start-btn ${isRunning && !isSlowingDown ? 'disabled' : ''}`}
            onClick={startPicking}
            disabled={isRunning && !isSlowingDown}
          >
            {isRunning ? '抽签中...' : '开始抽签'}
          </button>
          
          <button 
            className={`control-btn stop-btn ${!isRunning || isSlowingDown ? 'disabled' : ''}`}
            onClick={stopPicking}
            disabled={!isRunning || isSlowingDown}
          >
            {isSlowingDown ? '停止中...' : '停止抽签'}
          </button>
        </div>
        
        <div className="info">
          <p>班级总人数: {studentNames.length} 人</p>
          {finalName && (
            <p className="result">
              🎉 恭喜 <strong>{finalName}</strong> 同学被选中！
            </p>
          )}
        </div>
      </div>
      
      <div className="background-animation">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="floating-shape" style={{
            '--delay': `${i * 2}s`,
            '--duration': `${10 + i * 2}s`,
            left: `${10 + i * 15}%`
          }}></div>
        ))}
      </div>
    </div>
  );
}

export default App;
