import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Task from './Task';
import Home from './Home';

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