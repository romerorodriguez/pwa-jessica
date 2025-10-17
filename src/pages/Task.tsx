import { useState, useEffect } from "react";
import { 
  addTask, 
  getAllTasks, 
  deleteTaskDB, 
  updateTaskDB, 
  clearCompletedDB,
  registerBackgroundSync
} from "../utils/idb";
import { 
  subscribeToPushNotifications, 
  unsubscribeFromPushNotifications,
  sendTestNotification,
  checkNotificationStatus 
} from "../utils/pushNotifications";
import "./Task.css";

interface TaskItem {
  id: number;
  text: string;
  completed: boolean;
  createdAt: Date;
}

// --- Componente principal ---
function Task() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [newTask, setNewTask] = useState("");
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState<string>('');
  const [notificationStatus, setNotificationStatus] = useState<{
    supported: boolean;
    permission: NotificationPermission;
    subscribed: boolean;
  }>({
    supported: false,
    permission: 'default',
    subscribed: false
  });

    useEffect(() => {
    const checkStatus = async () => {
      const status = await checkNotificationStatus();
      setNotificationStatus(status);
    };
    checkStatus();
  }, []);

    const handleEnableNotifications = async () => {
    const subscription = await subscribeToPushNotifications();
    if (subscription) {
      setNotificationStatus(prev => ({
        ...prev,
        permission: 'granted',
        subscribed: true
      }));
      alert('✅ Notificaciones push activadas correctamente');
    }
  };

  const handleDisableNotifications = async () => {
    const success = await unsubscribeFromPushNotifications();
    if (success) {
      setNotificationStatus(prev => ({
        ...prev,
        subscribed: false
      }));
      alert('🔕 Notificaciones push desactivadas');
    }
  };
  const handleTestNotification = async () => {
    await sendTestNotification();
  };


  // Detectar cambios de conexión
  useEffect(() => {
    const updateOnlineStatus = () => {
      const online = navigator.onLine;
      setIsOnline(online);
      if (online) {
        setSyncStatus('🔄 Sincronizando...');
        // Cuando vuelve la conexión, forzar sync
        setTimeout(() => setSyncStatus('✅ Sincronizado'), 2000);
      } else {
        setSyncStatus('⏳ Pendiente de sincronización');
      }
    };

    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);

    // Escuchar mensajes del Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'SYNC_SUCCESS') {
          setSyncStatus('✅ Tarea sincronizada: ' + event.data.task.text);
          setTimeout(() => setSyncStatus(''), 3000);
        }
      });
    }

    return () => {
      window.removeEventListener("online", updateOnlineStatus);
      window.removeEventListener("offline", updateOnlineStatus);
    };
  }, []);

  // Cargar tareas desde IndexedDB al iniciar
  useEffect(() => {
    const loadTasks = async () => {
      const stored = await getAllTasks();
      setTasks(stored);
    };
    loadTasks();
  }, []);

  // Función principal para agregar tareas
  const handleAddTask = async () => {
    if (newTask.trim() === "") return;
    const task = {
      text: newTask.trim(),
      completed: false,
      createdAt: new Date(),
    };
    await addTask(task);
    
    // Registrar background sync si está offline
    if (!navigator.onLine) {
      await registerBackgroundSync();
      setSyncStatus('⏳ Tarea guardada offline - Se sincronizará después');
    } else {
      setSyncStatus('✅ Tarea guardada y sincronizada');
    }

    const updated = await getAllTasks();
    setTasks(updated);
    setNewTask("");
    setTimeout(() => setSyncStatus(''), 3000);
  };

  const deleteTask = async (id: number) => {
    await deleteTaskDB(id);
    const updated = await getAllTasks();
    setTasks(updated);
  };

  const toggleTask = async (id: number) => {
    const updatedTasks = tasks.map((t) =>
      t.id === id ? { ...t, completed: !t.completed } : t
    );
    setTasks(updatedTasks);
    const toggled = updatedTasks.find((t) => t.id === id);
    if (toggled) await updateTaskDB({
      ...toggled,
      createdAt: toggled.createdAt.toISOString() // Convertir para IndexedDB
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleAddTask();
  };

  const clearCompleted = async () => {
    await clearCompletedDB();
    const updated = await getAllTasks();
    setTasks(updated);
  };

  return (
    <div className="task-container">
      <header className="task-header">
        <h1>Mis Tareas</h1>
        <p>Organiza tu día de manera eficiente</p>
        <p className={`status ${isOnline ? "online" : "offline"}`}>
          {isOnline ? "🟢 Conectado" : "🔴 Sin conexión"}
        </p>
        {syncStatus && (
          <p className="sync-status">
            {syncStatus}
          </p>
        )}
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
          <button onClick={handleAddTask} className="add-btn">
            Agregar
          </button>
        </div>
      </div>

      <div className="tasks-stats">
        <span>{tasks.filter((t) => !t.completed).length} tareas pendientes</span>
        {tasks.some((t) => t.completed) && (
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
            <div
              key={task.id}
              className={`task-item ${task.completed ? "completed" : ""}`}
            >
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

      <div className="notifications-section">
        <h3>🔔 Notificaciones Push</h3>
        
        {!notificationStatus.supported ? (
          <div className="notification-status unsupported">
            <p>❌ Tu navegador no soporta notificaciones push</p>
          </div>
        ) : notificationStatus.permission === 'denied' ? (
          <div className="notification-status denied">
            <p>🔕 Permiso de notificaciones denegado</p>
            <small>Para activarlas, ve a configuración de tu navegador</small>
          </div>
        ) : !notificationStatus.subscribed ? (
          <div className="notification-status available">
            <p>💡 Activa las notificaciones push</p>
            <small>Recibe alertas cuando se sincronicen tus tareas</small>
            <button 
              onClick={handleEnableNotifications}
              className="enable-notifications-btn"
            >
              Activar Notificaciones
            </button>
          </div>
        ) : (
          <div className="notification-status active">
            <p>✅ Notificaciones push activadas</p>
            <div className="notification-actions">
              <button 
                onClick={handleTestNotification}
                className="test-notification-btn"
              >
                Probar Notificación
              </button>
              <button 
                onClick={handleDisableNotifications}
                className="disable-notifications-btn"
              >
                Desactivar
              </button>
            </div>
          </div>
        )}
      </div>

      <footer className="task-footer">
        <small>TaskFlow - Organiza tu vida</small>
      </footer>
    </div>
  );
}

export default Task;