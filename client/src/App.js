import React, { useEffect, useState } from "react"
import { Routes, Route, Link } from "react-router-dom"
import "./App.css"
import Contestant from "./Contestant.js"
import Host from "./Host.js"
import Scoreboard from "./Scoreboard.js"
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { io } from "socket.io-client"
const socket = io()


function App() {
  const [quizName, setQuizName] = useState('')
  useEffect(() => {
    socket.on('quiz:name', (name) => {
      setQuizName(name)
    })
    socket.on('connect', () => {
      socket.emit('quiz:getName')
    })

    return () => {
        socket.off('quiz:name')
        socket.off('connect')
    }

  },[])

  return (
    <Container fluid>
        <Row md className="App mb-3 bg-light border justify-content-md-center">
          <Col>
            <h1>{quizName}</h1>
          </Col>
        </Row>
        <Routes>
          <Route path="/" element={<Contestant />} />
          <Route path="/scoreboard" element={<Scoreboard />} />
          <Route path="/contestant" element={<Contestant />} />
          <Route path="/host" element={<Host quizId={0} />} />
        </Routes>
    </Container>
  );
}

export default App;