import React, { useState, useEffect, useRef } from 'react';
import { studentNames } from './studentNames';
import './App.css';

function App() {
  const [isRunning, setIsRunning] = useState(false);
  const [currentName, setCurrentName] = useState('点击开始抽签');
  const [finalName, setFinalName] = useState('');
  const [isSlowingDown, setIsSlowingDown] = useState(false);
  const [selectedNames, setSelectedNames] = useState([]);
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [isRepicking, setIsRepicking] = useState(false);
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
    
    const totalDuration = 1000; // 1秒总时长
    const startTime = Date.now();
    let currentSpeed = speedRef.current;
    
    const slowDownStep = () => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / totalDuration;
      
      if (progress >= 1) {
        // 1秒到达，停止并显示最终结果
        setIsRunning(false);
        setIsSlowingDown(false);
        const final = getRandomName();
        setCurrentName(final);
        
        // 检查是否重复
        const isNameDuplicate = selectedNames.some(item => item.name === final);
        if (isNameDuplicate) {
          setIsDuplicate(true);
          setFinalName('');
          // 显示重新抽取提示，然后自动重新开始
          setTimeout(() => {
            setIsDuplicate(false);
            setIsRepicking(true);
            setCurrentName('重新抽取中...');
            setTimeout(() => {
              setIsRepicking(false);
              startPicking();
            }, 1000);
          }, 1500);
        } else {
          setFinalName(final);
          setIsDuplicate(false);
          // 添加到已选中名单
          setSelectedNames(prev => [...prev, { name: final, time: new Date().toLocaleTimeString(), isAbsent: false }]);
        }
        return;
      }
      
      // 根据进度调整速度，使其在1秒内逐渐减慢
      currentSpeed = speedRef.current + (progress * 750); // 从初始速度逐渐增加到800ms
      setCurrentName(getRandomName());
      
      timeoutRef.current = setTimeout(slowDownStep, currentSpeed);
    };
    
    slowDownStep();
  };

  const clearHistory = () => {
    setSelectedNames([]);
  };

  const markAsAbsent = () => {
    if (!finalName) return;
    
    setSelectedNames(prev => 
      prev.map(item => 
        item.name === finalName 
          ? { ...item, isAbsent: !item.isAbsent }
          : item
      )
    );
  };

  const exportResults = () => {
    if (selectedNames.length === 0) {
      alert('暂无抽签结果可导出');
      return;
    }

    const currentTime = new Date();
    const formatTime = currentTime.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).replace(/[/:]/g, '').replace(/\s/g, '_');
    
    const filename = `${formatTime}_心智探秘.txt`;
    
    const presentCount = selectedNames.filter(item => !item.isAbsent).length;
    const absentCount = selectedNames.filter(item => item.isAbsent).length;
    
    let content = `心智探秘 - 随机点名结果\n`;
    content += `导出时间: ${currentTime.toLocaleString('zh-CN')}\n`;
    content += `班级总人数: ${studentNames.length} 人\n`;
    content += `已抽中人数: ${selectedNames.length} 人\n`;
    content += `出席人数: ${presentCount} 人\n`;
    content += `缺勤人数: ${absentCount} 人\n`;
    content += `\n=== 抽签结果 ===\n`;
    
    selectedNames.forEach((item, index) => {
      const status = item.isAbsent ? ' [未到]' : ' [已到]';
      content += `${index + 1}. ${item.name}${status} (抽中时间: ${item.time})\n`;
    });
    
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <div className="app">
      <div className="main-content">
        <div className="container">
        <h1 className="title">
          <span className="title-icon">🎯</span>
          随机点名系统
          <span className="title-icon">🎯</span>
        </h1>
        
        <div className="name-display-container">
          <div className={`name-display ${isRunning ? 'running' : ''} ${finalName ? 'final' : ''} ${isDuplicate ? 'duplicate' : ''} ${isRepicking ? 'repicking' : ''}`}>
            {isDuplicate ? '重复抽取！' : currentName}
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
          {finalName && (
            <button 
              className={`absent-btn ${selectedNames.find(item => item.name === finalName)?.isAbsent ? 'marked' : ''}`}
              onClick={markAsAbsent}
            >
              {selectedNames.find(item => item.name === finalName)?.isAbsent ? '✅ 已标记未到' : '❌ 标记未到'}
            </button>
          )}
          {selectedNames.length > 0 && (
            <button 
              className="export-btn"
              onClick={exportResults}
            >
              📁 导出结果 ({selectedNames.length}人)
            </button>
          )}
        </div>
      </div>
      
      <div className="history-panel">
        <div className="history-header">
          <h3>已选中名单</h3>
          <button 
            className="clear-btn" 
            onClick={clearHistory}
            disabled={selectedNames.length === 0}
          >
            清空
          </button>
        </div>
        <div className="history-list">
          {selectedNames.length === 0 ? (
            <p className="empty-message">暂无选中记录</p>
          ) : (
            selectedNames.map((item, index) => (
              <div key={index} className={`history-item ${item.isAbsent ? 'absent' : ''}`}>
                <span className="history-number">{selectedNames.length - index}</span>
                <span className="history-name">
                  {item.name}
                  {item.isAbsent && <span className="absent-tag">未到</span>}
                </span>
                <span className="history-time">{item.time}</span>
              </div>
            )).reverse()
          )}
        </div>
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
