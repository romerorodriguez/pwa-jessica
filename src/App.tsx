import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Task from './pages/Task';
import Home from './pages/Home';

function MainApp() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home/>} />
        <Route path="/task" element={<Task />} />
      </Routes>
    </Router>
  );
}

export default MainApp;