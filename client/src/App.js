import * as React from "react"
import { Routes, Route, Link } from "react-router-dom"
import "./App.css"
import Contestant from "./Contestant/index.js"
import Host from "./Host/index.js"
import Scoreboard from "./Scoreboard/index.js"

function App() {
  return (
    <div className="App">
      <h1>Welcome to React Router!</h1>
      <Routes>
        <Route path="/" element={<Contestant />} />
        <Route path="/scoreboard" element={<Scoreboard />} />
        <Route path="/contestant" element={<Contestant />} />
        <Route path="/host" element={<Host quizId={0} />} />
      </Routes>
    </div>
  );
}

export default App;