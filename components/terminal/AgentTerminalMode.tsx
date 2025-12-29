'use client';

import { useState, useRef, useEffect } from 'react';
import { api } from '@/lib/api';
import './AgentTerminalMode.css';

// ============================================================================
// Type Definitions (from backend)
// ============================================================================

interface CommandEvent {
  command: string;
  cwd?: string;
  stdout: string;
  stderr: string;
  exitCode: number;
  duration?: number;
}

interface FileEditEvent {
  file: string;
  diff: string;
  linesChanged: number;
}

interface FileReadEvent {
  file: string;
  preview: string;
  size: number;
}

interface FileCreateEvent {
  file: string;
  content: string;
  lines: number;
}

interface SearchEvent {
  query: string;
  results: Array<{
    file: string;
    line: number;
    content: string;
  }>;
}

interface ErrorEvent {
  message: string;
  tool?: string;
  details?: string;
}

interface TextEvent {
  text: string;
}

type ExecutionEvent =
  | { type: 'command'; timestamp: number; data: CommandEvent }
  | { type: 'file_edit'; timestamp: number; data: FileEditEvent }
  | { type: 'file_read'; timestamp: number; data: FileReadEvent }
  | { type: 'file_create'; timestamp: number; data: FileCreateEvent }
  | { type: 'search'; timestamp: number; data: SearchEvent }
  | { type: 'error'; timestamp: number; data: ErrorEvent }
  | { type: 'text'; timestamp: number; data: TextEvent };

interface TerminalAgentResponse {
  sessionId: string;
  events: ExecutionEvent[];
  summary: string;
  status: 'success' | 'error' | 'partial';
  toolsUsed: Array<{
    name: string;
    status: 'success' | 'error';
  }>;
  context: {
    filesAccessed: string[];
    commandsRun: string[];
    errorsEncountered: string[];
  };
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  events?: ExecutionEvent[];
  summary?: string;
  status?: 'success' | 'error' | 'partial';
  toolsUsed?: Array<{
    name: string;
    status: 'success' | 'error';
  }>;
  context?: {
    filesAccessed?: string[];
    commandsRun?: string[];
    errorsEncountered?: string[];
  };
  timestamp: Date;
}

interface AgentTerminalModeProps {
  projectId: string;
  workspaceId: string;
  agentMode?: 'chat' | 'terminal';
  onModeChange?: (mode: 'chat' | 'terminal') => void;
}

// ============================================================================
// Event Rendering Functions
// ============================================================================

function renderExecutionEvent(event: ExecutionEvent, index: number): React.ReactNode {
  switch (event.type) {
    case 'command':
      return (
        <div key={index} className="terminal-event terminal-event-command">
          <div className="terminal-command-line">
            <span className="terminal-prompt">$</span>
            <span className="terminal-command-text">{event.data.command}</span>
            {event.data.cwd && <span className="terminal-cwd"> (in {event.data.cwd})</span>}
          </div>
          {event.data.stdout && (
            <pre className="terminal-stdout">{event.data.stdout}</pre>
          )}
          {event.data.stderr && (
            <pre className="terminal-stderr">{event.data.stderr}</pre>
          )}
          <div className={`terminal-exit-code ${event.data.exitCode === 0 ? 'terminal-success' : 'terminal-error'}`}>
            <span className="terminal-exit-label">Exit Code:</span> {event.data.exitCode}
            {event.data.exitCode === 0 ? ' ✓' : ' ✗'}
            {event.data.duration && <span className="terminal-duration"> ({event.data.duration}ms)</span>}
          </div>
        </div>
      );

    case 'file_edit':
      return (
        <div key={index} className="terminal-event terminal-event-edit">
          <div className="terminal-event-header terminal-event-header-edit">
            <span className="terminal-event-icon">✎</span>
            <span className="terminal-event-label">EDIT</span>
            <span className="terminal-event-file">{event.data.file}</span>
          </div>
          <pre className="terminal-diff">{event.data.diff}</pre>
          <div className="terminal-event-meta">
            {event.data.linesChanged} line{event.data.linesChanged !== 1 ? 's' : ''} changed
          </div>
        </div>
      );

    case 'file_create':
      return (
        <div key={index} className="terminal-event terminal-event-create">
          <div className="terminal-event-header terminal-event-header-create">
            <span className="terminal-event-icon">+</span>
            <span className="terminal-event-label">CREATE</span>
            <span className="terminal-event-file">{event.data.file}</span>
          </div>
          <div className="terminal-event-meta">
            {event.data.lines} line{event.data.lines !== 1 ? 's' : ''}
          </div>
        </div>
      );

    case 'file_read':
      return (
        <div key={index} className="terminal-event terminal-event-read">
          <div className="terminal-event-header terminal-event-header-read">
            <span className="terminal-event-icon">📄</span>
            <span className="terminal-event-label">READ</span>
            <span className="terminal-event-file">{event.data.file}</span>
          </div>
          {event.data.preview && (
            <pre className="terminal-preview">{event.data.preview}</pre>
          )}
          <div className="terminal-event-meta">
            {event.data.size} bytes
          </div>
        </div>
      );

    case 'search':
      return (
        <div key={index} className="terminal-event terminal-event-search">
          <div className="terminal-event-header terminal-event-header-search">
            <span className="terminal-event-icon">🔍</span>
            <span className="terminal-event-label">SEARCH</span>
            <span className="terminal-search-query">&quot;{event.data.query}&quot;</span>
          </div>
          {event.data.results.length > 0 ? (
            <div className="terminal-search-results">
              {event.data.results.map((result, i) => (
                <div key={i} className="terminal-search-result">
                  <span className="terminal-search-location">
                    {result.file}:{result.line}
                  </span>
                  <span className="terminal-search-content">{result.content}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="terminal-event-meta">No results found</div>
          )}
        </div>
      );

    case 'error':
      return (
        <div key={index} className="terminal-event terminal-event-error">
          <div className="terminal-event-header terminal-event-header-error">
            <span className="terminal-event-icon">✗</span>
            <span className="terminal-event-label">ERROR</span>
          </div>
          <div className="terminal-error-message">{event.data.message}</div>
          {event.data.tool && (
            <div className="terminal-event-meta">Tool: {event.data.tool}</div>
          )}
          {event.data.details && (
            <pre className="terminal-error-details">{event.data.details}</pre>
          )}
        </div>
      );

    case 'text':
      return (
        <div key={index} className="terminal-event terminal-event-text">
          <div className="terminal-text-content">{event.data.text}</div>
        </div>
      );

    default:
      return <div key={index} className="terminal-event">Unknown event type</div>;
  }
}

// ============================================================================
// Main Component
// ============================================================================

export function AgentTerminalMode({ projectId, workspaceId, agentMode = 'terminal', onModeChange }: AgentTerminalModeProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      console.log('[AgentTerminalMode] Sending message:', input);

      const response: TerminalAgentResponse = await api.sendTerminalAgentMessage({
        projectId,
        workspaceId,
        message: input,
        sessionId: sessionId || undefined
      });

      console.log('[AgentTerminalMode] Received response:', response);

      setSessionId(response.sessionId);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.summary || '',
        events: response.events,
        summary: response.summary,
        status: response.status,
        toolsUsed: response.toolsUsed,
        context: response.context,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error('[AgentTerminalMode] Error:', error);

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error.message || 'Unknown error'}. Please try again.`,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setSessionId(null);
  };

  return (
    <div className="terminal-agent-container">
      {/* Messages Area */}
      <div className="terminal-agent-messages">
        {messages.length === 0 && (
          <div className="terminal-agent-empty">
            <div className="terminal-agent-icon-wrapper">
              <svg
                className="terminal-agent-icon"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
              >
                <polyline points="4 17 10 11 4 5" />
                <line x1="12" y1="19" x2="20" y2="19" />
              </svg>
            </div>
            <p className="terminal-agent-title">AI Terminal Agent</p>
            <p className="terminal-agent-description">
              Ask me to run commands, read files, debug issues, or help with your code.
              I have full access to your workspace and can execute commands for you.
            </p>
            <div className="terminal-agent-suggestions">
              <p className="terminal-agent-suggestions-title">Try asking:</p>
              <ul className="terminal-agent-suggestions-list">
                <li>&quot;List all JavaScript files in the src directory&quot;</li>
                <li>&quot;Show me the contents of package.json&quot;</li>
                <li>&quot;Run npm test and tell me what failed&quot;</li>
                <li>&quot;Find all files that import from &apos;react&apos;&quot;</li>
              </ul>
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`terminal-message-wrapper ${msg.role === 'user' ? 'terminal-message-user' : 'terminal-message-assistant'}`}>
            {msg.role === 'user' ? (
              // User message - simple text display
              <div className="terminal-message terminal-message-user-bubble">
                <div className="terminal-message-content">{msg.content}</div>
                <div className="terminal-message-timestamp">
                  {msg.timestamp.toLocaleTimeString()}
                </div>
              </div>
            ) : (
              // Assistant message - render execution events
              <div className="terminal-message terminal-message-assistant-bubble">
                {/* Execution Events - Claude Code style */}
                {msg.events && msg.events.length > 0 && (
                  <div className="terminal-events-container">
                    {msg.events.map((event, idx) => renderExecutionEvent(event, idx))}
                  </div>
                )}

                {/* Summary (if no events or as fallback) */}
                {(!msg.events || msg.events.length === 0) && msg.content && (
                  <div className="terminal-summary">{msg.content}</div>
                )}

                {/* Status Indicator */}
                {msg.status && (
                  <div className={`terminal-status terminal-status-${msg.status}`}>
                    {msg.status === 'success' && '✓ Completed successfully'}
                    {msg.status === 'error' && '✗ Failed with errors'}
                    {msg.status === 'partial' && '⚠ Partially completed (some errors)'}
                  </div>
                )}

                {/* Tools Used (collapsed) */}
                {msg.toolsUsed && msg.toolsUsed.length > 0 && (
                  <details className="terminal-tools-details">
                    <summary className="terminal-tools-summary">
                      Tools used: {msg.toolsUsed.length}
                    </summary>
                    <div className="terminal-tools-list">
                      {msg.toolsUsed.map((tool, idx) => (
                        <span
                          key={idx}
                          className={`terminal-tool-badge ${tool.status === 'success' ? 'terminal-tool-success' : 'terminal-tool-error'}`}
                        >
                          {tool.name}
                        </span>
                      ))}
                    </div>
                  </details>
                )}

                {/* Context Info (collapsed) */}
                {msg.context && (msg.context.filesAccessed?.length || msg.context.commandsRun?.length || msg.context.errorsEncountered?.length) && (
                  <details className="terminal-context-details">
                    <summary className="terminal-context-summary">
                      Session context
                    </summary>
                    <div className="terminal-context-info">
                      {msg.context.filesAccessed && msg.context.filesAccessed.length > 0 && (
                        <div className="terminal-context-item">
                          <span className="terminal-context-label">Files accessed:</span>
                          <span className="terminal-context-value">{msg.context.filesAccessed.join(', ')}</span>
                        </div>
                      )}
                      {msg.context.commandsRun && msg.context.commandsRun.length > 0 && (
                        <div className="terminal-context-item">
                          <span className="terminal-context-label">Commands run:</span>
                          <span className="terminal-context-value">{msg.context.commandsRun.join('; ')}</span>
                        </div>
                      )}
                      {msg.context.errorsEncountered && msg.context.errorsEncountered.length > 0 && (
                        <div className="terminal-context-item terminal-context-error">
                          <span className="terminal-context-label">Errors:</span>
                          <span className="terminal-context-value">{msg.context.errorsEncountered.join('; ')}</span>
                        </div>
                      )}
                    </div>
                  </details>
                )}

                {/* Timestamp */}
                <div className="terminal-message-timestamp">
                  {msg.timestamp.toLocaleTimeString()}
                </div>
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="terminal-message-wrapper terminal-message-assistant">
            <div className="terminal-message terminal-message-assistant-bubble">
              <div className="terminal-loading">
                <div className="terminal-loading-spinner" />
                <span className="terminal-loading-text">Agent is executing commands...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="terminal-agent-input-container">
        <div className="terminal-mode-toggle">
          <button
            className={`terminal-mode-button terminal-mode-chat ${agentMode === 'chat' ? 'active' : ''}`}
            onClick={() => onModeChange?.('chat')}
            aria-label="Chat mode"
            title="Chat Mode"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </button>
          <button
            className={`terminal-mode-button terminal-mode-terminal ${agentMode === 'terminal' ? 'active' : ''}`}
            onClick={() => onModeChange?.('terminal')}
            aria-label="Terminal mode"
            title="Terminal Mode"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="4 17 10 11 4 5" />
              <line x1="12" y1="19" x2="20" y2="19" />
            </svg>
          </button>
        </div>
        <div className="terminal-agent-input-wrapper">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Ask the AI agent to run commands, read files, or help debug..."
            className="terminal-agent-input"
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="terminal-agent-send-button"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
