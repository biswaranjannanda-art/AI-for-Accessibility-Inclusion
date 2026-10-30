import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api.ts';
import { useAuth } from './AuthContext.tsx';

export interface WorkspaceItem {
  id: string;
  name: string;
  description: string;
  domain: string;
  documentCount?: number;
  indexedCount?: number;
  created_at: string;
}

interface WorkspaceContextType {
  workspaces: WorkspaceItem[];
  activeWorkspace: WorkspaceItem | null;
  isLoading: boolean;
  setActiveWorkspace: (ws: WorkspaceItem | null) => void;
  refreshWorkspaces: () => Promise<void>;
  createWorkspace: (data: { name: string; description?: string; domain?: string }) => Promise<WorkspaceItem>;
  deleteWorkspace: (id: string) => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [workspaces, setWorkspaces] = useState<WorkspaceItem[]>([]);
  const [activeWorkspace, setActiveWorkspace] = useState<WorkspaceItem | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const refreshWorkspaces = async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    try {
      const res = await api.workspaces.list();
      const list = res.workspaces || [];
      setWorkspaces(list);

      // Preserve or set active workspace
      if (list.length > 0) {
        setActiveWorkspace((prev) => {
          if (prev) {
            const found = list.find((w: WorkspaceItem) => w.id === prev.id);
            if (found) return found;
          }
          return list[0];
        });
      } else {
        setActiveWorkspace(null);
      }
    } catch (err) {
      console.error('Failed to load workspaces:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      refreshWorkspaces();
    } else {
      setWorkspaces([]);
      setActiveWorkspace(null);
    }
  }, [isAuthenticated]);

  const createWorkspace = async (data: { name: string; description?: string; domain?: string }) => {
    const res = await api.workspaces.create(data);
    await refreshWorkspaces();
    setActiveWorkspace(res.workspace);
    return res.workspace;
  };

  const deleteWorkspace = async (id: string) => {
    await api.workspaces.delete(id);
    await refreshWorkspaces();
  };

  return (
    <WorkspaceContext.Provider
      value={{
        workspaces,
        activeWorkspace,
        isLoading,
        setActiveWorkspace,
        refreshWorkspaces,
        createWorkspace,
        deleteWorkspace,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
}
