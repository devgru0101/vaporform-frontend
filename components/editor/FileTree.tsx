'use client';

import { useState, useEffect, useCallback, useRef, useMemo, memo } from 'react';
import { api } from '@/lib/api';

interface FileNode {
  id: string;
  path: string;
  filename: string;
  is_directory: boolean;
  children?: FileNode[];
}

interface FileTreeProps {
  projectId: string;
  onFileSelect: (path: string) => void;
  selectedPath?: string;
}

// Create a hash of the file list for comparison
function createFileHash(files: any[]): string {
  return files.map(f => `${f.path}:${f.id}:${f.is_directory}`).join('|');
}

// Deep comparison to check if tree structure changed
function hasTreeChanged(oldNodes: FileNode[], newFiles: any[], path: string): boolean {
  const oldHash = oldNodes.map(n => `${n.path}:${n.id}`).sort().join('|');
  const newHash = newFiles.map(f => `${f.path}:${f.id}`).sort().join('|');
  return oldHash !== newHash;
}

// File icon component - returns SVG icon based on file type
function FileIcon({ filename }: { filename: string }) {
  const ext = filename.split('.').pop()?.toLowerCase();

  // TypeScript
  if (ext === 'ts' || ext === 'tsx') {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
        <rect width="16" height="16" rx="2" fill="#3178C6" />
        <text x="8" y="12" fontSize="10" fontWeight="600" textAnchor="middle" fill="white">TS</text>
      </svg>
    );
  }

  // JavaScript
  if (ext === 'js' || ext === 'jsx' || ext === 'mjs' || ext === 'cjs') {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
        <rect width="16" height="16" rx="2" fill="#F7DF1E" />
        <text x="8" y="12" fontSize="10" fontWeight="600" textAnchor="middle" fill="#000">JS</text>
      </svg>
    );
  }

  // Python
  if (ext === 'py' || ext === 'pyw') {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
        <rect width="16" height="16" rx="2" fill="#3776AB" />
        <text x="8" y="12" fontSize="10" fontWeight="600" textAnchor="middle" fill="white">PY</text>
      </svg>
    );
  }

  // Rust
  if (ext === 'rs') {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
        <rect width="16" height="16" rx="2" fill="#CE422B" />
        <text x="8" y="12" fontSize="10" fontWeight="600" textAnchor="middle" fill="white">RS</text>
      </svg>
    );
  }

  // Go
  if (ext === 'go') {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
        <rect width="16" height="16" rx="2" fill="#00ADD8" />
        <text x="8" y="12" fontSize="10" fontWeight="600" textAnchor="middle" fill="white">GO</text>
      </svg>
    );
  }

  // Java
  if (ext === 'java') {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
        <rect width="16" height="16" rx="2" fill="#007396" />
        <text x="8" y="12" fontSize="9" fontWeight="600" textAnchor="middle" fill="white">JAVA</text>
      </svg>
    );
  }

  // C/C++
  if (ext === 'c' || ext === 'h') {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
        <rect width="16" height="16" rx="2" fill="#A8B9CC" />
        <text x="8" y="12" fontSize="11" fontWeight="700" textAnchor="middle" fill="#283593">C</text>
      </svg>
    );
  }

  if (ext === 'cpp' || ext === 'cc' || ext === 'cxx' || ext === 'hpp') {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
        <rect width="16" height="16" rx="2" fill="#00599C" />
        <text x="8" y="12" fontSize="9" fontWeight="600" textAnchor="middle" fill="white">C++</text>
      </svg>
    );
  }

  // C#
  if (ext === 'cs') {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
        <rect width="16" height="16" rx="2" fill="#239120" />
        <text x="8" y="12" fontSize="10" fontWeight="600" textAnchor="middle" fill="white">C#</text>
      </svg>
    );
  }

  // Ruby
  if (ext === 'rb') {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
        <rect width="16" height="16" rx="2" fill="#CC342D" />
        <text x="8" y="12" fontSize="10" fontWeight="600" textAnchor="middle" fill="white">RB</text>
      </svg>
    );
  }

  // PHP
  if (ext === 'php') {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
        <rect width="16" height="16" rx="2" fill="#777BB4" />
        <text x="8" y="12" fontSize="9" fontWeight="600" textAnchor="middle" fill="white">PHP</text>
      </svg>
    );
  }

  // Swift
  if (ext === 'swift') {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
        <rect width="16" height="16" rx="2" fill="#FA7343" />
        <text x="8" y="12" fontSize="8" fontWeight="600" textAnchor="middle" fill="white">SWIFT</text>
      </svg>
    );
  }

  // Kotlin
  if (ext === 'kt' || ext === 'kts') {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
        <rect width="16" height="16" rx="2" fill="#7F52FF" />
        <text x="8" y="12" fontSize="10" fontWeight="600" textAnchor="middle" fill="white">KT</text>
      </svg>
    );
  }
  
  // Dart (Flutter)
  if (ext === 'dart') {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
        <rect width="16" height="16" rx="2" fill="#0175C2"/>
        <text x="8" y="12" fontSize="8" fontWeight="600" textAnchor="middle" fill="white">DART</text>
      </svg>
    );
  }
  
  // Electron config
  if (filename === 'electron.js' || filename === 'electron.config.js' || filename === 'forge.config.js') {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
        <rect width="16" height="16" rx="2" fill="#47848F"/>
        <circle cx="8" cy="8" r="2" fill="white"/>
        <circle cx="5" cy="5" r="1" fill="white"/>
        <circle cx="11" cy="5" r="1" fill="white"/>
      </svg>
    );
  }
  
  // Vue
  if (ext === 'vue') {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
        <rect width="16" height="16" rx="2" fill="#42B883"/>
        <text x="8" y="12" fontSize="9" fontWeight="600" textAnchor="middle" fill="white">VUE</text>
      </svg>
    );
  }

  // JSON
  if (ext === 'json') {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
        <rect width="16" height="16" rx="2" fill="#F5C244" />
        <path d="M5 4h1v1h-1zm2 0h1v1h-1zm-2 2h1v1h-1zm2 0h1v1h-1z" fill="#2E2E2E" />
        <path d="M10 4h2v1h-2zm0 2h1v1h-1zm0 2h2v1h-2z" fill="#2E2E2E" />
      </svg>
    );
  }

  // YAML
  if (ext === 'yaml' || ext === 'yml') {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
        <rect width="16" height="16" rx="2" fill="#CB171E" />
        <text x="8" y="12" fontSize="8" fontWeight="600" textAnchor="middle" fill="white">YAML</text>
      </svg>
    );
  }

  // SQL
  if (ext === 'sql') {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
        <rect width="16" height="16" rx="2" fill="#E38C00" />
        <text x="8" y="12" fontSize="9" fontWeight="600" textAnchor="middle" fill="white">SQL</text>
      </svg>
    );
  }

  // Shell scripts
  if (ext === 'sh' || ext === 'bash' || ext === 'zsh') {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
        <rect width="16" height="16" rx="2" fill="#4EAA25" />
        <text x="8" y="12" fontSize="10" fontWeight="600" textAnchor="middle" fill="white">SH</text>
      </svg>
    );
  }

  // CSS
  if (ext === 'css' || ext === 'scss' || ext === 'sass' || ext === 'less') {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
        <rect width="16" height="16" rx="2" fill="#1572B6" />
        <path d="M4 4h8l-.5 8-3.5 1-3.5-1z" fill="white" opacity="0.9" />
      </svg>
    );
  }

  // HTML
  if (ext === 'html' || ext === 'htm') {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
        <rect width="16" height="16" rx="2" fill="#E34F26" />
        <path d="M4 3l.5 10 3.5 1 3.5-1 .5-10z" fill="white" opacity="0.9" />
      </svg>
    );
  }

  // Markdown
  if (ext === 'md') {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
        <rect width="16" height="16" rx="2" fill="#519ABA" />
        <text x="8" y="12" fontSize="9" fontWeight="600" textAnchor="middle" fill="white">MD</text>
      </svg>
    );
  }

  // XML
  if (ext === 'xml') {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
        <rect width="16" height="16" rx="2" fill="#E37933" />
        <text x="8" y="12" fontSize="9" fontWeight="600" textAnchor="middle" fill="white">XML</text>
      </svg>
    );
  }

  // SVG
  if (ext === 'svg') {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
        <rect width="16" height="16" rx="2" fill="#FFB13B" />
        <text x="8" y="12" fontSize="9" fontWeight="600" textAnchor="middle" fill="white">SVG</text>
      </svg>
    );
  }

  // Docker
  if (filename === 'Dockerfile' || ext === 'dockerfile') {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
        <rect width="16" height="16" rx="2" fill="#2496ED" />
        <rect x="4" y="6" width="2" height="2" fill="white" />
        <rect x="7" y="6" width="2" height="2" fill="white" />
        <rect x="10" y="6" width="2" height="2" fill="white" />
      </svg>
    );
  }

  // Images
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'ico', 'bmp'].includes(ext || '')) {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
        <rect width="16" height="16" rx="2" fill="#A855F7" />
        <rect x="3" y="3" width="10" height="8" rx="1" stroke="white" strokeWidth="1" fill="none" />
        <circle cx="6" cy="6" r="1" fill="white" />
        <path d="M3 9l3-2 2 1.5 3-2.5 2 2" stroke="white" strokeWidth="1" fill="none" />
      </svg>
    );
  }

  // Default file icon
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" opacity="0.5" style={{ flexShrink: 0 }}>
      <path d="M3 2h7l3 3v9H3V2z" />
      <path d="M10 2v3h3" stroke="currentColor" strokeWidth="0.5" fill="none" />
    </svg>
  );
}

export function FileTree({ projectId, onFileSelect, selectedPath }: FileTreeProps) {
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set(['/']));
  const [loading, setLoading] = useState(true);
  const expandedDirsRef = useRef<Set<string>>(new Set(['/']));

  // Cache directory contents to avoid unnecessary updates
  const directoryCacheRef = useRef<Map<string, string>>(new Map());
  const loadQueueRef = useRef<Set<string>>(new Set());
  const isLoadingRef = useRef<boolean>(false);

  // Keep ref in sync with state
  useEffect(() => {
    expandedDirsRef.current = expandedDirs;
  }, [expandedDirs]);

  // Update tree node only if content changed
  const updateTreeNode = useCallback((nodes: FileNode[], targetPath: string, newChildren: any[]): FileNode[] => {
    let updated = false;

    const result = nodes.map(node => {
      if (node.path === targetPath) {
        // Check if children actually changed
        if (!node.children || hasTreeChanged(node.children, newChildren, targetPath)) {
          updated = true;
          return {
            ...node,
            children: newChildren.map((f: any) => ({
              id: f.id,
              path: f.path,
              filename: f.filename,
              is_directory: f.is_directory,
              children: f.is_directory ? (node.children?.find(c => c.path === f.path)?.children || []) : undefined
            }))
          };
        }
        return node; // No change, return same reference
      } else if (node.is_directory && node.children) {
        const updatedChildren = updateTreeNode(node.children, targetPath, newChildren);
        if (updatedChildren !== node.children) {
          updated = true;
          return { ...node, children: updatedChildren };
        }
        return node;
      }
      return node;
    });

    return updated ? result : nodes; // Return same reference if nothing changed
  }, []);

  // Background loader - doesn't trigger re-renders unless data changed
  const loadDirectoryInBackground = useCallback(async (path: string) => {
    try {
      const response = await api.listDirectory(projectId, path);
      if (response.files) {
        const newHash = createFileHash(response.files);
        const oldHash = directoryCacheRef.current.get(path);

        // Only update if content actually changed
        if (newHash !== oldHash) {
          directoryCacheRef.current.set(path, newHash);

          setFileTree(prevTree => {
            if (path === '/') {
              // Check if root changed
              if (hasTreeChanged(prevTree, response.files, path)) {
                return response.files.map((f: any) => {
                  const existingNode = prevTree.find(n => n.path === f.path);
                  return {
                    id: f.id,
                    path: f.path,
                    filename: f.filename,
                    is_directory: f.is_directory,
                    children: f.is_directory ? (existingNode?.children || []) : undefined
                  };
                });
              }
              return prevTree; // No change
            } else {
              // Update specific directory
              return updateTreeNode(prevTree, path, response.files);
            }
          });
        }
      }
    } catch (error) {
      console.error('Failed to load directory:', error);
    }
  }, [projectId, updateTreeNode]);

  // Process load queue in background
  const processLoadQueue = useCallback(async () => {
    if (isLoadingRef.current || loadQueueRef.current.size === 0) {
      return;
    }

    isLoadingRef.current = true;
    const paths = Array.from(loadQueueRef.current);
    loadQueueRef.current.clear();

    // Load all queued paths in background (doesn't block UI)
    await Promise.all(paths.map(path => loadDirectoryInBackground(path)));

    isLoadingRef.current = false;
  }, [loadDirectoryInBackground]);

  // Initial load
  useEffect(() => {
    const init = async () => {
      await loadDirectoryInBackground('/');
      setLoading(false);
    };
    init();
  }, [loadDirectoryInBackground]);

  // Background refresh - only updates changed files
  useEffect(() => {
    const interval = setInterval(() => {
      // Queue all expanded directories for background refresh
      loadQueueRef.current.add('/');
      for (const dirPath of expandedDirsRef.current) {
        if (dirPath !== '/') {
          loadQueueRef.current.add(dirPath);
        }
      }
      processLoadQueue();
    }, 5000); // Can be more frequent since it only updates changes

    return () => clearInterval(interval);
  }, [processLoadQueue]);

  const toggleDirectory = useCallback(async (path: string) => {
    const newExpanded = new Set(expandedDirs);

    if (newExpanded.has(path)) {
      // Collapse - instant, no API call
      newExpanded.delete(path);
      setExpandedDirs(newExpanded);
    } else {
      // Expand - instant UI update
      newExpanded.add(path);
      setExpandedDirs(newExpanded);

      // Load in background (won't re-render if data already cached)
      loadQueueRef.current.add(path);
      processLoadQueue();
    }
  }, [expandedDirs, processLoadQueue]);

  const handleNodeClick = useCallback((node: FileNode) => {
    if (node.is_directory) {
      toggleDirectory(node.path);
    } else {
      onFileSelect(node.path);
    }
  }, [toggleDirectory, onFileSelect]);

  const renderNode = useCallback((node: FileNode, level: number = 0) => {
    const isExpanded = expandedDirs.has(node.path);
    const isSelected = selectedPath === node.path;

    return (
      <div key={node.path}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            paddingTop: 'var(--vf-space-1)',
            paddingBottom: 'var(--vf-space-1)',
            paddingLeft: `calc(${level * 16 + 8}px)`,
            paddingRight: 'var(--vf-space-2)',
            cursor: 'pointer',
            background: isSelected ? 'var(--vf-accent-primary)' : 'transparent',
            color: isSelected ? 'var(--vf-bg-primary)' : 'var(--vf-text-primary)',
            fontWeight: isSelected ? 'var(--vf-weight-bold)' : 'var(--vf-weight-normal)',
            transition: 'background 0.1s ease, color 0.1s ease',
            borderLeft: isSelected ? '2px solid var(--vf-accent-primary)' : '2px solid transparent',
          }}
          onMouseEnter={(e) => {
            if (!isSelected) {
              e.currentTarget.style.background = 'var(--vf-bg-secondary)';
              e.currentTarget.style.borderLeftColor = 'var(--vf-border-secondary)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isSelected) {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.borderLeftColor = 'transparent';
            }
          }}
          onClick={() => handleNodeClick(node)}
        >
          <span style={{
            marginRight: 'var(--vf-space-2)',
            display: 'flex',
            alignItems: 'center'
          }}>
            {node.is_directory ? (
              <span style={{ fontSize: '10px', opacity: 0.7 }}>{isExpanded ? '▼' : '▶'}</span>
            ) : (
              <FileIcon filename={node.filename} />
            )}
          </span>
          <span style={{
            fontFamily: 'var(--vf-font-mono)',
            fontSize: 'var(--vf-text-sm)',
            letterSpacing: '0.02em'
          }}>
            {node.filename}
          </span>
        </div>
        {node.is_directory && isExpanded && node.children?.map(child =>
          renderNode(child, level + 1)
        )}
      </div>
    );
  }, [expandedDirs, selectedPath, handleNodeClick]);

  if (loading) {
    return (
      <div style={{
        height: '100%',
        width: '100%',
        background: 'var(--vf-bg-tertiary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--vf-space-4)'
      }}>
        <div style={{
          fontFamily: 'var(--vf-font-display)',
          fontSize: 'var(--vf-text-xs)',
          color: 'var(--vf-accent-primary)',
          textTransform: 'uppercase',
          letterSpacing: '0.1em'
        }}>
          LOADING FILES...
        </div>
      </div>
    );
  }

  return (
    <div style={{
      height: '100%',
      width: '100%',
      background: 'var(--vf-bg-tertiary)',
      overflow: 'auto',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{
        borderBottom: '2px solid var(--vf-border-primary)',
        padding: 'var(--vf-space-2)',
        background: 'var(--vf-bg-secondary)'
      }}>
        <h3 style={{
          fontFamily: 'var(--vf-font-display)',
          fontSize: 'var(--vf-text-xs)',
          fontWeight: 'var(--vf-weight-bold)',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color: 'var(--vf-text-primary)'
        }}>
          FILES
        </h3>
      </div>
      <div style={{ padding: 'var(--vf-space-1)' }}>
        {fileTree.map(node => renderNode(node))}
      </div>
    </div>
  );
}
