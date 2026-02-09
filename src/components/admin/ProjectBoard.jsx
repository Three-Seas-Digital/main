import { useState, useEffect } from 'react';
import {
  CalendarDays, User, Trash2, CheckCircle, Plus, X,
  ChevronLeft, Edit3, ArrowRight, Flag,
  Circle, CircleCheckBig, ListTodo, Milestone, GripVertical,
  FolderKanban, Users, RefreshCw,
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import TimeTracker from './TimeTracker';
import { formatDisplayDate } from './adminUtils';

function KanbanCard({ task, client, project, canManage }) {
  const { updateProjectTask, deleteProjectTask } = useAppContext();
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: task.title,
    goal: task.goal || '',
    assignee: task.assignee || '',
    dueDate: task.dueDate || '',
    priority: task.priority || 'normal',
  });

  const handleSave = () => {
    updateProjectTask(client.id, project.id, task.id, editForm);
    setEditing(false);
  };

  const priorityColors = { low: '#9ca3af', normal: '#3b82f6', high: '#f59e0b', urgent: '#ef4444' };

  if (editing && canManage) {
    return (
      <div className="kanban-card editing">
        <div className="kanban-edit-form">
          <input type="text" value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} placeholder="Task title" className="kanban-edit-title" />
          <textarea value={editForm.goal} onChange={(e) => setEditForm({ ...editForm, goal: e.target.value })} placeholder="Goal / description — what does 'done' look like?" rows={2} className="kanban-edit-goal" />
          <div className="kanban-edit-row">
            <input type="text" value={editForm.assignee} onChange={(e) => setEditForm({ ...editForm, assignee: e.target.value })} placeholder="Assignee" />
            <input type="date" value={editForm.dueDate} onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })} />
            <select value={editForm.priority} onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}>
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          <div className="kanban-edit-actions">
            <button className="btn btn-sm btn-primary" onClick={handleSave}>Save</button>
            <button className="btn btn-sm btn-outline" onClick={() => setEditing(false)}>Cancel</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="kanban-card">
      {task.priority && task.priority !== 'normal' && (
        <div className="kanban-priority-bar" style={{ background: priorityColors[task.priority] }} />
      )}
      <div className="kanban-card-title">
        <GripVertical size={14} className="grip" />
        <span>{task.title}</span>
        {canManage && (
          <button className="kanban-edit-btn" onClick={() => { setEditForm({ title: task.title, goal: task.goal || '', assignee: task.assignee || '', dueDate: task.dueDate || '', priority: task.priority || 'normal' }); setEditing(true); }}>
            <Edit3 size={12} />
          </button>
        )}
      </div>
      {task.goal && <p className="kanban-goal">{task.goal}</p>}
      <div className="kanban-card-meta">
        {task.assignee && <span className="kanban-assignee"><User size={12} /> {task.assignee}</span>}
        {task.dueDate && <span className="kanban-due"><CalendarDays size={12} /> {formatDisplayDate(task.dueDate)}</span>}
        {task.priority && task.priority !== 'normal' && (
          <span className="kanban-priority-tag" style={{ color: priorityColors[task.priority] }}>
            <Flag size={11} /> {task.priority}
          </span>
        )}
      </div>
      {canManage && (
        <div className="kanban-card-actions">
          {task.status !== 'todo' && (
            <button onClick={() => updateProjectTask(client.id, project.id, task.id, { status: task.status === 'done' ? 'in-progress' : 'todo' })}>
              <ChevronLeft size={14} />
            </button>
          )}
          {task.status !== 'done' && (
            <button onClick={() => updateProjectTask(client.id, project.id, task.id, { status: task.status === 'todo' ? 'in-progress' : 'done' })}>
              <ArrowRight size={14} />
            </button>
          )}
          <button className="kanban-delete" onClick={() => deleteProjectTask(client.id, project.id, task.id)}>
            <Trash2 size={13} />
          </button>
        </div>
      )}
    </div>
  );
}

function KanbanColumn({ colKey, label, color, items, client, project, canManage }) {
  const { addProjectTask } = useAppContext();
  const [adding, setAdding] = useState(false);
  const [quickTitle, setQuickTitle] = useState('');

  const handleQuickAdd = () => {
    if (!quickTitle.trim()) return;
    addProjectTask(client.id, project.id, { title: quickTitle, status: colKey });
    setQuickTitle('');
    setAdding(false);
  };

  return (
    <div className="kanban-column">
      <div className="kanban-col-header">
        <div className="kanban-col-dot" style={{ background: color }} />
        <span>{label}</span>
        <span className="kanban-count">{items.length}</span>
        {canManage && (
          <button className="kanban-col-add" onClick={() => setAdding(!adding)} title={`Add task to ${label}`}>
            <Plus size={14} />
          </button>
        )}
      </div>
      {adding && (
        <div className="kanban-quick-add">
          <input
            type="text"
            value={quickTitle}
            onChange={(e) => setQuickTitle(e.target.value)}
            placeholder={`Add task to ${label}...`}
            onKeyDown={(e) => { if (e.key === 'Enter') handleQuickAdd(); if (e.key === 'Escape') setAdding(false); }}
            autoFocus
          />
          <div className="kanban-quick-actions">
            <button className="btn btn-sm btn-primary" onClick={handleQuickAdd} disabled={!quickTitle.trim()}>Add</button>
            <button className="btn btn-sm btn-outline" onClick={() => setAdding(false)}>Cancel</button>
          </div>
        </div>
      )}
      <div className="kanban-cards">
        {items.length === 0 && !adding && <p className="kanban-empty">No tasks</p>}
        {items.map((task) => (
          <KanbanCard key={task.id} task={task} client={client} project={project} canManage={canManage} />
        ))}
      </div>
    </div>
  );
}

export default function ProjectBoard({ client: clientProp }) {
  const {
    addProject, updateProject, deleteProject,
    addProjectTask, updateProjectTask, deleteProjectTask,
    addMilestone, toggleMilestone, deleteMilestone,
    assignDeveloperToProject, removeDeveloperFromProject, completeProject,
    hasPermission, users, clients,
  } = useAppContext();
  const canManage = hasPermission('manage_clients');

  // Get live client data from context to ensure we have the latest projects
  const client = clients.find((c) => c.id === clientProp?.id) || clientProp;

  const [showNewProject, setShowNewProject] = useState(false);
  const [projectForm, setProjectForm] = useState({ title: '', description: '', startDate: '', dueDate: '', developers: [] });
  const [activeProject, setActiveProject] = useState(null);
  const [milestoneForm, setMilestoneForm] = useState({ title: '', dueDate: '' });
  const [showMilestoneForm, setShowMilestoneForm] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completionOptions, setCompletionOptions] = useState({
    archive: true,
    createFollowUp: false,
    followUpDate: '',
    followUpNote: '',
    createInvoice: false,
    invoiceTitle: '',
    invoiceAmount: '',
  });
  const [showDevDropdown, setShowDevDropdown] = useState(false);

  // Staff members for developer assignment
  const staffMembers = users.filter((u) => u.status === 'approved' && ['admin', 'manager', 'staff'].includes(u.role));

  const projects = client?.projects || [];
  const project = activeProject ? projects.find((p) => p.id === activeProject) : null;

  // Reset activeProject if the project no longer exists in this client
  useEffect(() => {
    if (activeProject && projects.length > 0 && !projects.find((p) => p.id === activeProject)) {
      setActiveProject(null);
    }
  }, [activeProject, projects]);

  const handleAddProject = (e) => {
    e.preventDefault();
    if (!projectForm.title.trim()) return;
    addProject(client.id, projectForm);
    setProjectForm({ title: '', description: '', startDate: '', dueDate: '', developers: [] });
    setShowNewProject(false);
  };

  const handleAddMilestone = (e) => {
    e.preventDefault();
    if (!milestoneForm.title.trim()) return;
    addMilestone(client.id, project.id, milestoneForm);
    setMilestoneForm({ title: '', dueDate: '' });
    setShowMilestoneForm(false);
  };

  const handleCompleteProject = () => {
    completeProject(client.id, project.id, {
      archive: completionOptions.archive,
      createFollowUp: completionOptions.createFollowUp,
      followUpData: completionOptions.createFollowUp ? {
        date: completionOptions.followUpDate,
        note: completionOptions.followUpNote || `Follow-up for ${project.title}`,
      } : null,
      createInvoice: completionOptions.createInvoice,
      invoiceData: completionOptions.createInvoice ? {
        title: completionOptions.invoiceTitle || `Final Invoice - ${project.title}`,
        amount: parseFloat(completionOptions.invoiceAmount) || 0,
      } : null,
    });
    setShowCompletionModal(false);
    setCompletionOptions({ archive: true, createFollowUp: false, followUpDate: '', followUpNote: '', createInvoice: false, invoiceTitle: '', invoiceAmount: '' });
    if (completionOptions.archive) {
      setActiveProject(null);
    }
  };

  const getProgress = (p) => {
    const tasks = p.tasks || [];
    if (!tasks.length) return 0;
    const done = tasks.filter((t) => t.status === 'done').length;
    return Math.round((done / tasks.length) * 100);
  };

  const statusColors = {
    planning: '#6366f1',
    'in-progress': '#0ea5e9',
    review: '#f59e0b',
    completed: '#22c55e',
    archived: '#9ca3af',
  };

  const getDevById = (id) => staffMembers.find((u) => u.id === id);

  // Project detail view
  if (project) {
    const progress = getProgress(project);
    const tasks = project.tasks || [];
    const todoTasks = tasks.filter((t) => t.status === 'todo');
    const inProgressTasks = tasks.filter((t) => t.status === 'in-progress');
    const doneTasks = tasks.filter((t) => t.status === 'done');
    const projectDevs = (project.developers || []).map(getDevById).filter(Boolean);

    return (
      <div className="project-detail">
        {/* Completion Modal */}
        {showCompletionModal && (
          <div className="completion-modal-overlay" onClick={() => setShowCompletionModal(false)}>
            <div className="completion-modal" onClick={(e) => e.stopPropagation()}>
              <button className="completion-modal-close" onClick={() => setShowCompletionModal(false)}><X size={20} /></button>
              <h3><CheckCircle size={20} /> Complete Project</h3>
              <p className="completion-modal-desc">Choose what happens when this project is completed:</p>

              <div className="completion-options">
                <label className="completion-option">
                  <input type="checkbox" checked={completionOptions.archive} onChange={(e) => setCompletionOptions({ ...completionOptions, archive: e.target.checked })} />
                  <div>
                    <strong>Archive Project</strong>
                    <span>Move project to archived status</span>
                  </div>
                </label>

                <label className="completion-option">
                  <input type="checkbox" checked={completionOptions.createFollowUp} onChange={(e) => setCompletionOptions({ ...completionOptions, createFollowUp: e.target.checked })} />
                  <div>
                    <strong>Schedule Follow-Up</strong>
                    <span>Create a maintenance/check-in appointment</span>
                  </div>
                </label>
                {completionOptions.createFollowUp && (
                  <div className="completion-sub-options">
                    <input type="date" value={completionOptions.followUpDate} onChange={(e) => setCompletionOptions({ ...completionOptions, followUpDate: e.target.value })} placeholder="Follow-up date" />
                    <input type="text" value={completionOptions.followUpNote} onChange={(e) => setCompletionOptions({ ...completionOptions, followUpNote: e.target.value })} placeholder="Follow-up note (optional)" />
                  </div>
                )}

                <label className="completion-option">
                  <input type="checkbox" checked={completionOptions.createInvoice} onChange={(e) => setCompletionOptions({ ...completionOptions, createInvoice: e.target.checked })} />
                  <div>
                    <strong>Create Final Invoice</strong>
                    <span>Generate a closing invoice for the project</span>
                  </div>
                </label>
                {completionOptions.createInvoice && (
                  <div className="completion-sub-options">
                    <input type="text" value={completionOptions.invoiceTitle} onChange={(e) => setCompletionOptions({ ...completionOptions, invoiceTitle: e.target.value })} placeholder={`Final Invoice - ${project.title}`} />
                    <input type="number" step="0.01" value={completionOptions.invoiceAmount} onChange={(e) => setCompletionOptions({ ...completionOptions, invoiceAmount: e.target.value })} placeholder="Amount ($)" />
                  </div>
                )}
              </div>

              <div className="completion-modal-actions">
                <button className="btn btn-primary" onClick={handleCompleteProject}>
                  <CheckCircle size={16} /> Complete Project
                </button>
                <button className="btn btn-outline" onClick={() => setShowCompletionModal(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        <button className="btn btn-sm btn-outline" onClick={() => setActiveProject(null)}>
          <ChevronLeft size={16} /> Back to Projects
        </button>

        <div className="project-detail-header">
          <div>
            <h3>{project.title}</h3>
            {project.description && <p>{project.description}</p>}
            <div className="project-dates">
              {project.startDate && <span><CalendarDays size={12} /> Start: {formatDisplayDate(project.startDate)}</span>}
              {project.dueDate && <span><CalendarDays size={12} /> Due: {formatDisplayDate(project.dueDate)}</span>}
            </div>
          </div>
          <div className="project-detail-actions">
            {canManage && project.status !== 'archived' && (
              <select
                value={project.status}
                onChange={(e) => {
                  if (e.target.value === 'completed') {
                    setShowCompletionModal(true);
                  } else {
                    updateProject(client.id, project.id, { status: e.target.value });
                  }
                }}
                className="filter-select"
              >
                <option value="planning">Planning</option>
                <option value="in-progress">In Progress</option>
                <option value="review">Review</option>
                <option value="completed">Completed</option>
              </select>
            )}
            <span className="project-status-pill" style={{ background: statusColors[project.status] }}>
              {project.status}
            </span>
          </div>
        </div>

        {/* Assigned Developers */}
        <div className="project-developers-section">
          <div className="project-section-header">
            <h4><Users size={16} /> Assigned Developers</h4>
          </div>
          <div className="project-developers-list">
            {projectDevs.length === 0 && <span className="text-muted">No developers assigned</span>}
            {projectDevs.map((dev) => (
              <div key={dev.id} className="project-dev-chip" style={{ borderColor: dev.color }}>
                <div className="project-dev-avatar" style={{ background: dev.color }}>{dev.name.charAt(0).toUpperCase()}</div>
                <span>{dev.name}</span>
                {canManage && (
                  <button className="project-dev-remove" onClick={() => removeDeveloperFromProject(client.id, project.id, dev.id)}>
                    <X size={12} />
                  </button>
                )}
              </div>
            ))}
            {canManage && (
              <div className="project-dev-add-wrapper">
                <button className="project-dev-add-btn" onClick={() => setShowDevDropdown(!showDevDropdown)}>
                  <Plus size={14} /> Add
                </button>
                {showDevDropdown && (
                  <div className="project-dev-dropdown">
                    {staffMembers.filter((u) => !(project.developers || []).includes(u.id)).map((u) => (
                      <button key={u.id} onClick={() => { assignDeveloperToProject(client.id, project.id, u.id); setShowDevDropdown(false); }}>
                        <div className="project-dev-avatar sm" style={{ background: u.color }}>{u.name.charAt(0).toUpperCase()}</div>
                        {u.name}
                      </button>
                    ))}
                    {staffMembers.filter((u) => !(project.developers || []).includes(u.id)).length === 0 && (
                      <span className="text-muted">All staff assigned</span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="project-progress">
          <div className="progress-info">
            <span>Overall Progress</span>
            <strong>{progress}%</strong>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <div className="progress-stats">
            <span>{todoTasks.length} To Do</span>
            <span>{inProgressTasks.length} In Progress</span>
            <span>{doneTasks.length} Done</span>
          </div>
        </div>

        {/* Milestones */}
        <div className="project-section">
          <div className="project-section-header">
            <h4><Milestone size={16} /> Milestones</h4>
            {canManage && (
              <button className="btn btn-sm btn-outline" onClick={() => setShowMilestoneForm(!showMilestoneForm)}>
                <Plus size={14} /> {showMilestoneForm ? 'Cancel' : 'Add'}
              </button>
            )}
          </div>
          {showMilestoneForm && (
            <form onSubmit={handleAddMilestone} className="inline-form">
              <input type="text" placeholder="Milestone title" value={milestoneForm.title} onChange={(e) => setMilestoneForm({ ...milestoneForm, title: e.target.value })} required />
              <input type="date" value={milestoneForm.dueDate} onChange={(e) => setMilestoneForm({ ...milestoneForm, dueDate: e.target.value })} />
              <button type="submit" className="btn btn-sm btn-primary">Add</button>
            </form>
          )}
          {(project.milestones || []).length === 0 ? (
            <p className="text-muted">No milestones yet</p>
          ) : (
            <div className="milestones-list">
              {(project.milestones || []).map((m) => (
                <div key={m.id} className={`milestone-item ${m.completed ? 'completed' : ''}`}>
                  <button className="milestone-check" onClick={() => canManage && toggleMilestone(client.id, project.id, m.id)} disabled={!canManage}>
                    {m.completed ? <CircleCheckBig size={18} /> : <Circle size={18} />}
                  </button>
                  <div className="milestone-info">
                    <span className={m.completed ? 'line-through' : ''}>{m.title}</span>
                    {m.dueDate && <small>Due: {formatDisplayDate(m.dueDate)}</small>}
                  </div>
                  {canManage && <button className="note-delete" onClick={() => deleteMilestone(client.id, project.id, m.id)}><Trash2 size={13} /></button>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Kanban Board */}
        <div className="project-section">
          <div className="project-section-header">
            <h4><ListTodo size={16} /> Tasks</h4>
          </div>
          <div className="kanban-board">
            {[
              { key: 'todo', label: 'To Do', color: '#6366f1', items: todoTasks },
              { key: 'in-progress', label: 'In Progress', color: '#0ea5e9', items: inProgressTasks },
              { key: 'done', label: 'Done', color: '#22c55e', items: doneTasks },
            ].map((col) => (
              <KanbanColumn
                key={col.key}
                colKey={col.key}
                label={col.label}
                color={col.color}
                items={col.items}
                client={client}
                project={project}
                canManage={canManage}
              />
            ))}
          </div>
        </div>

        {/* Time Tracking */}
        <TimeTracker clientId={client.id} projectId={project.id} />

        {/* Project Actions */}
        {canManage && project.status !== 'archived' && (
          <div className="project-actions-footer">
            {project.status === 'review' && (
              <button className="btn btn-confirm" onClick={() => setShowCompletionModal(true)}>
                <CheckCircle size={16} /> Mark Complete
              </button>
            )}
            <button className="btn btn-outline-danger" onClick={() => { updateProject(client.id, project.id, { status: 'archived' }); setActiveProject(null); }}>
              Archive Project
            </button>
          </div>
        )}
      </div>
    );
  }

  // Projects list
  const activeProjects = projects.filter((p) => p.status !== 'archived');
  const archivedProjects = projects.filter((p) => p.status === 'archived');

  return (
    <div className="projects-list-section">
      <div className="project-section-header">
        <h4><FolderKanban size={18} /> Projects</h4>
        {canManage && (
          <button className="btn btn-sm btn-primary" onClick={() => setShowNewProject(!showNewProject)}>
            <Plus size={14} /> {showNewProject ? 'Cancel' : 'New Project'}
          </button>
        )}
      </div>
      {showNewProject && (
        <form onSubmit={handleAddProject} className="um-form-card project-form" style={{ marginBottom: 16 }}>
          <div className="form-group"><label>Project Title *</label><input type="text" value={projectForm.title} onChange={(e) => setProjectForm({ ...projectForm, title: e.target.value })} required /></div>
          <div className="form-group"><label>Description</label><textarea value={projectForm.description} onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })} rows={2} /></div>
          <div className="form-row">
            <div className="form-group"><label>Start Date</label><input type="date" value={projectForm.startDate} onChange={(e) => setProjectForm({ ...projectForm, startDate: e.target.value })} /></div>
            <div className="form-group"><label>Due Date</label><input type="date" value={projectForm.dueDate} onChange={(e) => setProjectForm({ ...projectForm, dueDate: e.target.value })} /></div>
          </div>
          <div className="form-group">
            <label>Assign Developers</label>
            <div className="project-dev-multi-select">
              {staffMembers.map((u) => (
                <label key={u.id} className={`dev-checkbox ${projectForm.developers.includes(u.id) ? 'selected' : ''}`}>
                  <input
                    type="checkbox"
                    checked={projectForm.developers.includes(u.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setProjectForm({ ...projectForm, developers: [...projectForm.developers, u.id] });
                      } else {
                        setProjectForm({ ...projectForm, developers: projectForm.developers.filter((id) => id !== u.id) });
                      }
                    }}
                  />
                  <div className="project-dev-avatar sm" style={{ background: u.color }}>{u.name.charAt(0).toUpperCase()}</div>
                  <span>{u.name}</span>
                </label>
              ))}
            </div>
          </div>
          <button type="submit" className="btn btn-sm btn-primary">Create Project</button>
        </form>
      )}
      {activeProjects.length === 0 && !showNewProject ? (
        <div className="empty-state-sm"><p>No active projects. Create one to start tracking work.</p></div>
      ) : (
        <div className="projects-grid">
          {activeProjects.map((p) => {
            const prog = getProgress(p);
            const devs = (p.developers || []).map(getDevById).filter(Boolean);
            return (
              <div key={p.id} className="project-card" onClick={() => setActiveProject(p.id)}>
                <div className="project-card-header">
                  <h5>{p.title}</h5>
                  <span className="project-status-pill" style={{ background: statusColors[p.status] }}>{p.status}</span>
                </div>
                {p.description && <p className="project-card-desc">{p.description}</p>}
                {devs.length > 0 && (
                  <div className="project-card-devs">
                    {devs.slice(0, 3).map((dev) => (
                      <div key={dev.id} className="project-dev-avatar sm" style={{ background: dev.color }} title={dev.name}>
                        {dev.name.charAt(0).toUpperCase()}
                      </div>
                    ))}
                    {devs.length > 3 && <span className="project-dev-more">+{devs.length - 3}</span>}
                  </div>
                )}
                <div className="project-card-progress">
                  <div className="progress-bar sm"><div className="progress-fill" style={{ width: `${prog}%` }} /></div>
                  <span>{prog}%</span>
                </div>
                <div className="project-card-footer">
                  <span>{(p.tasks || []).length} tasks</span>
                  <span>{(p.milestones || []).length} milestones</span>
                  {p.dueDate && <span><CalendarDays size={11} /> {formatDisplayDate(p.dueDate)}</span>}
                </div>
                {canManage && (
                  <button className="project-card-delete" onClick={(e) => { e.stopPropagation(); deleteProject(client.id, p.id); }}>
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Archived Projects */}
      {archivedProjects.length > 0 && (
        <div className="archived-projects-section">
          <h5 className="archived-header"><FolderKanban size={14} /> Archived Projects ({archivedProjects.length})</h5>
          <div className="projects-grid archived">
            {archivedProjects.map((p) => {
              const prog = getProgress(p);
              return (
                <div key={p.id} className="project-card archived">
                  <div className="project-card-header">
                    <h5>{p.title}</h5>
                    <span className="project-status-pill" style={{ background: statusColors[p.status] }}>{p.status}</span>
                  </div>
                  <div className="project-card-progress">
                    <div className="progress-bar sm"><div className="progress-fill" style={{ width: `${prog}%` }} /></div>
                    <span>{prog}%</span>
                  </div>
                  <div className="project-card-footer">
                    <span>{(p.tasks || []).length} tasks</span>
                    {p.completedAt && <span>Completed {new Date(p.completedAt).toLocaleDateString()}</span>}
                  </div>
                  {canManage && (
                    <div className="archived-project-actions">
                      <button
                        className="btn btn-sm btn-confirm"
                        onClick={(e) => {
                          e.stopPropagation();
                          updateProject(client.id, p.id, { status: 'completed', restoredAt: new Date().toISOString() });
                        }}
                        title="Restore project"
                      >
                        <RefreshCw size={14} /> Restore
                      </button>
                      <button
                        className="btn btn-sm btn-delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteProject(client.id, p.id);
                        }}
                        title="Delete permanently"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
