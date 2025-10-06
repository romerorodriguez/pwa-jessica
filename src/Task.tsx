import { useState, useEffect } from 'react';
import './Task.css';

interface TaskItem {
  id: string;
  text: string;
  completed: boolean;
  createdAt: Date;
}

function Task() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [newTask, setNewTask] = useState('');

  // Cargar tareas del localStorage al iniciar
  useEffect(() => {
    const savedTasks = localStorage.getItem('taskflow-tasks');
    if (savedTasks) {
      try {
        const parsedTasks = JSON.parse(savedTasks).map((task: any) => ({
          ...task,
          createdAt: new Date(task.createdAt)
        }));
        setTasks(parsedTasks);
      } catch (error) {
        console.error('Error loading tasks:', error);
      }
    }
  }, []);

  // Guardar tareas en localStorage cuando cambien
  useEffect(() => {
    localStorage.setItem('taskflow-tasks', JSON.stringify(tasks));
  }, [tasks]);

  const addTask = () => {
    if (newTask.trim() === '') return;
    
    const task: TaskItem = {
      id: Date.now().toString(),
      text: newTask.trim(),
      completed: false,
      createdAt: new Date()
    };
    
    setTasks([...tasks, task]);
    setNewTask('');
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  const toggleTask = (id: string) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addTask();
    }
  };

  const clearCompleted = () => {
    setTasks(tasks.filter(task => !task.completed));
  };

  return (
    <div className="task-container">
      <header className="task-header">
        <h1>TaskFlow - Organizador de Tareas</h1>
        <p>Organiza tu día de manera eficiente</p>
      </header>

      <div className="task-input-section">
        <div className="input-group">
          <input
            type="text"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Escribe una nueva tarea..."
            className="task-input"
          />
          <button onClick={addTask} className="add-btn">
            Agregar
          </button>
        </div>
      </div>

      <div className="tasks-stats">
        <span>{tasks.filter(t => !t.completed).length} tareas pendientes</span>
        {tasks.some(t => t.completed) && (
          <button onClick={clearCompleted} className="clear-btn">
            Limpiar completadas
          </button>
        )}
      </div>

      <div className="tasks-list">
        {tasks.length === 0 ? (
          <div className="empty-state">
            <p>No hay tareas aún</p>
            <small>¡Agrega tu primera tarea arriba!</small>
          </div>
        ) : (
          tasks.map((task) => (
            <div key={task.id} className={`task-item ${task.completed ? 'completed' : ''}`}>
              <div className="task-content">
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => toggleTask(task.id)}
                  className="task-checkbox"
                />
                <span className="task-text">{task.text}</span>
                <small className="task-date">
                  {task.createdAt.toLocaleDateString()}
                </small>
              </div>
              <button
                onClick={() => deleteTask(task.id)}
                className="delete-btn"
                aria-label="Eliminar tarea"
              >
                🗑️
              </button>
            </div>
          ))
        )}
      </div>

      <footer className="task-footer">
        <small>© 2025 TaskFlow - Organiza tu vida</small>
      </footer>
    </div>
  );
}

export default Task;