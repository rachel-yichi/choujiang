import React, { useState, useEffect, useRef } from 'react';
import { studentNames } from './studentNames';
import emailjs from '@emailjs/browser';
import './App.css';

function App() {
  const [isRunning, setIsRunning] = useState(false);
  const [currentName, setCurrentName] = useState('点击开始抽签');
  const [finalName, setFinalName] = useState('');
  const [isSlowingDown, setIsSlowingDown] = useState(false);
  const [selectedNames, setSelectedNames] = useState([]);
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [isRepicking, setIsRepicking] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
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
    setEmailSent(false);
    setIsSendingEmail(false);
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
          setSelectedNames(prev => [...prev, { name: final, time: new Date().toLocaleTimeString() }]);
          // 发送邮件通知
          sendEmailResult(final);
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

  const sendEmailResult = async (selectedName) => {
    setIsSendingEmail(true);
    
    // EmailJS配置 - 这些是公开的服务配置，不是敏感信息
    const serviceID = 'service_choujiang';
    const templateID = 'template_result';
    const publicKey = 'your_public_key_here';
    
    const templateParams = {
      to_email: 'yichi-zh25@mails.tsinghua.edu.cn',
      selected_name: selectedName,
      selection_time: new Date().toLocaleString('zh-CN'),
      total_students: studentNames.length,
      selected_count: selectedNames.length + 1,
      from_name: '随机点名系统'
    };

    try {
      await emailjs.send(serviceID, templateID, templateParams, publicKey);
      setEmailSent(true);
      console.log('邮件发送成功');
    } catch (error) {
      console.error('邮件发送失败:', error);
      // 即使失败也不影响主要功能
    } finally {
      setIsSendingEmail(false);
    }
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
            <div>
              <p className="result">
                🎉 恭喜 <strong>{finalName}</strong> 同学被选中！
              </p>
              {isSendingEmail && (
                <p className="email-status sending">
                  📧 正在发送邮件通知...
                </p>
              )}
              {emailSent && !isSendingEmail && (
                <p className="email-status sent">
                  ✅ 结果已发送到 yichi-zh25@mails.tsinghua.edu.cn
                </p>
              )}
            </div>
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
              <div key={index} className="history-item">
                <span className="history-number">{selectedNames.length - index}</span>
                <span className="history-name">{item.name}</span>
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
