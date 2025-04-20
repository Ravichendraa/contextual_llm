import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { FileUp, Send, Book, CheckCircle, Loader2, HelpCircle, Upload, ArrowRight, Trash, Copy, CheckCheck, Menu, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function App() {
  // Existing state variables
  const [files, setFiles] = useState(null);
  const [contextName, setContextName] = useState('');
  const [userQuestion, setUserQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [step, setStep] = useState(1); // Step 1: Upload, Step 2: Ask
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFileNames, setUploadedFileNames] = useState([]);
  const [error, setError] = useState('');
  const [conversations, setConversations] = useState([]);
  const [loadingDots, setLoadingDots] = useState(1);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [copiedIndex, setCopiedIndex] = useState(null);
  
  // New state for responsive sidebar
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Existing useEffects...
  useEffect(() => {
    let interval;
    if (isLoading) {
      interval = setInterval(() => {
        setLoadingDots(prev => prev < 3 ? prev + 1 : 1);
      }, 500);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversations, isLoading, currentQuestion]);

  useEffect(() => {
    if (copiedIndex !== null) {
      const timer = setTimeout(() => {
        setCopiedIndex(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [copiedIndex]);

  // New useEffect for handling resize events
  useEffect(() => {
    const handleResize = () => {
      // Auto-collapse sidebar on smaller screens when moving between breakpoints
      if (window.innerWidth <= 768) {
        setSidebarExpanded(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Function to toggle sidebar on mobile
  const toggleSidebar = () => {
    setSidebarExpanded(!sidebarExpanded);
  };

  // Existing functions...
  const handleFileUpload = async () => {
    if (!files || files.length === 0 || !contextName.trim()) {
      setError('Please select files and enter a context name');
      return;
    }
    
    setError('');
    setIsLoading(true);
    
    const formData = new FormData();
    const fileNames = [];
    
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
      fileNames.push(files[i].name);
    }
    formData.append('contextName', contextName);

    try {
      // Simulating upload progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 500);

      await axios.post('https://contextual-llm.onrender.com/upload', formData);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      setUploadedFileNames(fileNames);
      
      // Move to Step 2 after a short delay to show completion
      setTimeout(() => {
        setStep(2);
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      setError('Upload failed. Please try again.');
      setIsLoading(false);
      setUploadProgress(0);
    }
  };

  const handleAsk = async () => {
    if (!userQuestion.trim()) {
      setError('Please enter a question');
      return;
    }
    
    setError('');
    setIsLoading(true);
    
    // Store the current question and clear the input field immediately
    const question = userQuestion;
    setCurrentQuestion(question);
    setUserQuestion('');
    
    try {
      const response = await axios.post('https://contextual-llm.onrender.com/ask', {
        contextName,
        question,
      });
      
      const newConversation = {
        question,
        answer: response.data.answer
      };
      
      setConversations([...conversations, newConversation]);
      setAnswer(response.data.answer);
      setCurrentQuestion(''); // Clear the current question after adding to conversations
      
      // On mobile, auto-collapse sidebar after asking a question
      if (window.innerWidth <= 768) {
        setSidebarExpanded(false);
      }
    } catch (error) {
      setError('Failed to get answer. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetAndUploadNew = () => {
    setStep(1);
    setFiles(null);
    setUploadedFileNames([]);
    setContextName('');
    setUserQuestion('');
    setAnswer('');
    setUploadProgress(0);
    setConversations([]);
    setCurrentQuestion('');
    
    // On mobile, auto-collapse sidebar after resetting
    if (window.innerWidth <= 768) {
      setSidebarExpanded(false);
    }
  };

  const copyToClipboard = (text, index) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedIndex(index);
    }).catch(err => {
      console.error('Failed to copy text: ', err);
    });
  };
  
  const resizeTextarea = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  };

  useEffect(() => {
    resizeTextarea();
  }, [userQuestion]);

  const renderLoadingDots = () => {
    return '.'.repeat(loadingDots);
  };

  return (
    <div className="app-container">
      {/* Mobile sidebar toggle button - only visible on mobile */}
      <div className="mobile-sidebar-toggle">
        <button 
          onClick={toggleSidebar} 
          className="menu-button"
          aria-label={sidebarExpanded ? "Close sidebar" : "Open sidebar"}
        >
          {sidebarExpanded ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
      
      {/* Sidebar - add expanded class on mobile */}
      <div className={`sidebar ${sidebarExpanded ? 'expanded' : ''}`}>
  <div className="sidebar-header">
    <img src="../logo.png" alt="Contextual LLM Logo" className="logo" />
    <h2>Contextual LLM</h2>
  </div>

        
        <button 
          className={`new-chat-btn ${step === 1 ? 'active' : ''}`}
          onClick={resetAndUploadNew}
        >
          <span>+ New Context</span>
        </button>
        
        {uploadedFileNames.length > 0 && (
          <div className="context-info">
            <div className="context-header">
              <span>Current Context</span>
            </div>
            <div className="context-name">
              <CheckCircle size={14} className="mr-2" />
              {contextName}
            </div>
            <div className="file-count">
              {uploadedFileNames.length} {uploadedFileNames.length === 1 ? 'file' : 'files'} uploaded
            </div>
          </div>
        )}
        
        {conversations.length > 0 && (
          <div className="conversations-list">
            <div className="list-header">
              <span>Conversations</span>
            </div>
            {conversations.map((conv, index) => (
              <div key={index} className="conversation-item">
                <span className="truncate">{conv.question}</span>
              </div>
            ))}
          </div>
        )}
        
        <div className="sidebar-footer">
          <span>Powered by Gemini AI</span>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="main-content">
        {step === 1 ? (
          /* Step 1: Upload Files */
          <div className="upload-container">
            <div className="upload-header">
              <h1>Upload Documents</h1>
              <p>Start by uploading your documents and creating a context</p>
            </div>
            
            <div className="upload-form">
              <div className="form-group">
                <label>Context Name</label>
                <input
                  type="text"
                  placeholder="Enter context name (e.g., DS-Sem3)"
                  value={contextName}
                  onChange={(e) => setContextName(e.target.value)}
                />
                <p className="form-hint">
                  This name will help identify your documents when asking questions later.
                </p>
              </div>

              <div className="form-group">
                <label>Upload Documents</label>
                <div className="file-upload-area">
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.txt,.doc,.docx"
                    className="hidden"
                    id="file-upload"
                    onChange={(e) => setFiles(e.target.files)}
                  />
                  <label htmlFor="file-upload" className="file-upload-label">
                    <FileUp size={30} />
                    <span className="upload-text">
                      {files ? `${files.length} files selected` : 'Select PDF, TXT, DOC, or DOCX files'}
                    </span>
                    <span className="upload-hint">
                      Click or drag files here
                    </span>
                  </label>
                </div>
              </div>

              {isLoading && (
                <div className="upload-progress">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="progress-text">
                    Uploading and processing files{renderLoadingDots()}
                  </p>
                </div>
              )}

              {error && (
                <div className="error-message">
                  {error}
                </div>
              )}

              <button
                onClick={handleFileUpload}
                disabled={isLoading}
                className="action-button"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin mr-2" size={20} />
                    Processing{renderLoadingDots()}
                  </>
                ) : (
                  <>
                    <Upload className="mr-2" size={20} />
                    Upload & Create Context
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* Step 2: Chat Interface */
          <div className="chat-container">
            {uploadedFileNames.length > 0 && (
              <div className="context-banner">
                <CheckCircle size={16} className="mr-2" />
                <span>Using context: <strong>{contextName}</strong> ({uploadedFileNames.length} files)</span>
                <button onClick={resetAndUploadNew} className="reset-button">
                  <Trash size={14} className="mr-1" />
                  Change
                </button>
              </div>
            )}
            
            <div className="messages-container">
              {/* Welcome message */}
              <div className="message system-message">
                <div className="message-icon">
                  <Book size={24} />
                </div>
                <div className="message-content">
                  <p>I'm your Contextual LLM Assistant. Ask me questions about your uploaded documents!</p>
                </div>
              </div>
              
              {/* Conversation history */}
              {conversations.map((conv, index) => (
                <React.Fragment key={index}>
                  <div className="message user-message">
                    <div className="message-content">
                      <p>{conv.question}</p>
                    </div>
                  </div>
                  <div className="message system-message">
                    <div className="message-icon">
                      <Book size={24} />
                    </div>
                    <div className="message-content markdown-content">
                      <div className="message-header">
                        <button 
                          className="copy-button" 
                          onClick={() => copyToClipboard(conv.answer, index)}
                          title="Copy to clipboard"
                        >
                          {copiedIndex === index ? <CheckCheck size={16} /> : <Copy size={16} />}
                        </button>
                      </div>
                      <ReactMarkdown>{conv.answer}</ReactMarkdown>
                    </div>
                  </div>
                </React.Fragment>
              ))}
              
              {/* Display current question when loading */}
              {currentQuestion && (
                <div className="message user-message">
                  <div className="message-content">
                    <p>{currentQuestion}</p>
                  </div>
                </div>
              )}
              
              {/* Loading indicator */}
              {isLoading && (
                <div className="message system-message">
                  <div className="message-icon">
                    <Loader2 className="animate-spin" size={24} />
                  </div>
                  <div className="message-content">
                    <p>Generating response{renderLoadingDots()}</p>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            
            {/* Input area */}
            <div className="input-container">
              {error && <div className="input-error">{error}</div>}
              <div className="input-wrapper">
                <textarea
                  ref={textareaRef}
                  placeholder="Ask a question about your documents..."
                  value={userQuestion}
                  onChange={(e) => setUserQuestion(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (!isLoading) handleAsk();
                    }
                  }}
                  rows={1}
                />
                <button 
                  onClick={handleAsk}
                  disabled={isLoading || !userQuestion.trim()}
                  className="send-button"
                >
                  <Send size={20} />
                </button>
              </div>
              <div className="input-hint">
                Press Enter to send, Shift+Enter for new line
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Mobile overlay when sidebar is expanded */}
      {sidebarExpanded && (
        <div className="sidebar-overlay" onClick={() => setSidebarExpanded(false)}></div>
      )}
    </div>
  );
}