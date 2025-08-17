import { useState } from 'react';
import {
  useProjects,
  useCreateProject,
  useUpdateProject,
  useDeleteProject,
} from '../../shared/hooks';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api';

export default function ProjectSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState('');

  const { data: user } = useQuery({ queryKey: ['user'], queryFn: api.me });
  const { data: projects = [] } = useProjects();
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();

  const currentProject = user?.user?.currentProject;

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    try {
      await createProject.mutateAsync(newProjectName.trim());
      setNewProjectName('');
      setIsCreating(false);
    } catch (error) {
      console.error('Failed to create project:', error);
      alert('Failed to create project');
    }
  };

  const handleSwitchProject = async (projectId: string) => {
    try {
      await updateProject.mutateAsync({
        id: projectId,
        data: { isCurrent: true },
      });
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to switch project:', error);
      alert('Failed to switch project');
    }
  };

  const handleDeleteProject = async (
    projectId: string,
    projectTitle: string
  ) => {
    if (
      !confirm(
        `Are you sure you want to delete "${projectTitle}"? This will permanently delete all tasks and staff in this project.`
      )
    ) {
      return;
    }

    try {
      await deleteProject.mutateAsync(projectId);
    } catch (error) {
      console.error('Failed to delete project:', error);
      alert('Failed to delete project');
    }
  };

  const handleTitleEdit = () => {
    setTitleValue(currentProject?.title || '');
    setIsEditingTitle(true);
    setIsOpen(false);
  };

  const handleTitleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProject) return;

    try {
      await updateProject.mutateAsync({
        id: currentProject.id,
        data: { title: titleValue.trim() },
      });
      setIsEditingTitle(false);
    } catch (error) {
      console.error('Failed to update project title:', error);
      alert('Failed to update project title');
    }
  };

  const handleTitleCancel = () => {
    setIsEditingTitle(false);
    setTitleValue('');
  };

  if (!user?.user) return null;

  if (isEditingTitle) {
    return (
      <form
        onSubmit={handleTitleSave}
        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
      >
        <span>📁</span>
        <input
          type='text'
          value={titleValue}
          onChange={(e) => setTitleValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') handleTitleCancel();
          }}
          style={{
            fontSize: '1.2rem',
            fontWeight: 'bold',
            background: 'transparent',
            border: '2px dashed var(--border)',
            color: 'var(--text)',
            padding: '4px 8px',
            borderRadius: '4px',
            minWidth: '200px',
          }}
          placeholder='Enter project title...'
          autoFocus
        />
        <button
          type='submit'
          style={{ padding: '4px 8px', fontSize: '0.75rem' }}
        >
          Save
        </button>
        <button
          type='button'
          onClick={handleTitleCancel}
          style={{
            padding: '4px 8px',
            fontSize: '0.75rem',
            background: 'transparent',
            color: 'var(--text-dim)',
            border: '1px solid var(--border)',
          }}
        >
          Cancel
        </button>
      </form>
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 12px',
          background: 'var(--panel)',
          border: '1px solid var(--border)',
          borderRadius: '6px',
          color: 'var(--text)',
          cursor: 'pointer',
          fontSize: '1.2rem',
          fontWeight: 'bold',
          minWidth: 0,
          maxWidth: '100%',
          overflow: 'hidden',
        }}
      >
        <span style={{ flexShrink: 0 }}>📁</span>
        <span
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            minWidth: 0,
          }}
        >
          {currentProject?.title || 'No Project'}
        </span>
        <span style={{ fontSize: '12px', opacity: 0.7, flexShrink: 0 }}>▼</span>
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: '4px',
            background: 'var(--panel)',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            zIndex: 1000,
            minWidth: '250px',
            maxWidth: '90vw',
            maxHeight: '70vh',
            overflow: 'auto',
          }}
        >
          <div
            style={{ padding: '8px', borderBottom: '1px solid var(--border)' }}
          >
            <div
              style={{
                fontSize: '12px',
                color: 'var(--text-dim)',
                fontWeight: 600,
                marginBottom: '6px',
              }}
            >
              Project Actions
            </div>
            {currentProject && (
              <button
                onClick={handleTitleEdit}
                style={{
                  width: '100%',
                  padding: '6px',
                  background: 'transparent',
                  border: '1px solid var(--border)',
                  borderRadius: '4px',
                  color: 'var(--text)',
                  cursor: 'pointer',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                ✏️ Edit Project Title
              </button>
            )}
          </div>

          <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
            <div
              style={{
                fontSize: '11px',
                color: 'var(--text-dim)',
                fontWeight: 600,
                padding: '6px 12px',
              }}
            >
              Switch Project
            </div>
            {projects.map((project) => (
              <div
                key={project.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  cursor: 'pointer',
                  background:
                    currentProject?.id === project.id
                      ? 'rgba(91, 140, 255, 0.1)'
                      : 'transparent',
                  borderLeft:
                    currentProject?.id === project.id
                      ? '3px solid var(--accent)'
                      : '3px solid transparent',
                }}
                onClick={() => handleSwitchProject(project.id)}
              >
                <div>
                  <div
                    style={{
                      fontWeight: currentProject?.id === project.id ? 600 : 400,
                    }}
                  >
                    {project.title}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                    {new Date(project.createdAt).toLocaleDateString()}
                  </div>
                </div>
                {currentProject?.id === project.id && (
                  <span style={{ fontSize: '12px', color: 'var(--accent)' }}>
                    ✓
                  </span>
                )}
                {projects.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteProject(project.id, project.title);
                    }}
                    style={{
                      padding: '2px 6px',
                      background: 'transparent',
                      border: '1px solid var(--danger)',
                      borderRadius: '4px',
                      color: 'var(--danger)',
                      fontSize: '10px',
                      cursor: 'pointer',
                      marginLeft: '8px',
                    }}
                  >
                    Delete
                  </button>
                )}
              </div>
            ))}
          </div>

          <div style={{ padding: '8px', borderTop: '1px solid var(--border)' }}>
            {isCreating ? (
              <form
                onSubmit={handleCreateProject}
                style={{ display: 'flex', gap: '6px' }}
              >
                <input
                  type='text'
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder='Project name'
                  autoFocus
                  style={{
                    flex: 1,
                    padding: '4px 8px',
                    fontSize: '12px',
                  }}
                />
                <button
                  type='submit'
                  disabled={!newProjectName.trim() || createProject.isPending}
                  style={{
                    padding: '4px 8px',
                    fontSize: '11px',
                    background: 'var(--accent)',
                    color: 'white',
                  }}
                >
                  Create
                </button>
                <button
                  type='button'
                  onClick={() => {
                    setIsCreating(false);
                    setNewProjectName('');
                  }}
                  style={{
                    padding: '4px 8px',
                    fontSize: '11px',
                    background: 'transparent',
                    color: 'var(--text-dim)',
                  }}
                >
                  Cancel
                </button>
              </form>
            ) : (
              <button
                onClick={() => setIsCreating(true)}
                style={{
                  width: '100%',
                  padding: '6px',
                  background: 'transparent',
                  border: '1px dashed var(--border)',
                  borderRadius: '4px',
                  color: 'var(--text-dim)',
                  cursor: 'pointer',
                  fontSize: '12px',
                }}
              >
                + New Project
              </button>
            )}
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999,
          }}
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
