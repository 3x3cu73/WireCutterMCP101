import './App.css'
import {Dashboard} from "./pages/Dashboard.jsx";
import {Route, Routes} from "react-router-dom";
import Team from "./pages/Team.jsx";


function App() {
return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/Team" element={<Team />} />
    </Routes>
)
}

export default App
