import './Home.css';
import { useNavigate } from 'react-router-dom';

function Home() {
    const navigate = useNavigate();
    const goToTask = () => {
        navigate('/task');
    }
  
  return (
    <div className="app-shell">
      <header>
        <h1>TaskFlow - JRR</h1>
      </header>
      <main>
        <p>Tu organizador de tareas offline</p>
      </main>
      <footer>
        <small>© 2025 TaskFlow</small>
      </footer>
      <button onClick={goToTask}>
        Comenzar
      </button>
      <button>
        Descargar App
      </button>
    </div>
  )
}

export default Home;