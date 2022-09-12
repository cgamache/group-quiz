import React, { useState, useEffect } from 'react'
import { io } from "socket.io-client"
import Stack from 'react-bootstrap/Stack'
import Alert from 'react-bootstrap/Alert'
import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import ProgressBar from 'react-bootstrap/ProgressBar'
import FloatingLabel from 'react-bootstrap/FloatingLabel'
import Gravatar from 'react-gravatar'
const socket = io()

function Scoreboard() {
    const [questionText, setQuestionText] = useState('')
    const [answerBlock, setAnswerBlock] = useState([])
    const [answer, setAnswer] = useState('')
    const [frameState, setFrameState] = useState('')
    const [secondsRemaining, setSecondsRemaining] = useState(-1)
    const [timeStamp, setTimeStamp] = useState(-1)
    const [maxTimeout, setMaxTimeout] = useState(-1)
    const [contestantAnswers, setContestantAnswers] = useState({})
    const [participants, setParticipants] = useState([])
    const [percentage, setPercentage] = useState([])
    const remaining = (maxTimeout, timeStamp) => maxTimeout - (Math.round(Date.now() / 1000) - timeStamp)

    const resetAll = () => {
        setQuestionText('')
        setAnswerBlock([])
        setAnswer('')
        setTimeStamp(-1)
        setMaxTimeout(-1)
        setSecondsRemaining(-1)
        setPercentage([])
        setContestantAnswers({})
    }  
    useEffect(() => {
        if (secondsRemaining < 0) return;
        const id = setInterval(() => {
            setSecondsRemaining(remaining(maxTimeout, timeStamp))
          }, 1000)
        return () => clearInterval(id);
    },[secondsRemaining, setSecondsRemaining, timeStamp, maxTimeout])

    useEffect(() => {
        socket.on('frameState', (frameState) => {
            setFrameState(frameState)
            if (frameState === 'init' || frameState === '' || frameState === 'ready') {
                resetAll()
            }
        })
        socket.on('question:current', (question) => {
            setQuestionText(question.question)
            setAnswerBlock(question.choices)
            setAnswer(question.answer)
            setTimeStamp(question.ts)
            setMaxTimeout(question.duration)
            setSecondsRemaining(remaining(question.duration, question.ts))
        })
        socket.on('contestant:answers', (contestantAnswers) => {
            setContestantAnswers(contestantAnswers)
        })
        socket.on('connect', () => {
            socket.emit('question:getCurrent')
            socket.emit('contestant:getAnswers')
            socket.emit('contestant:getParticipants')
            socket.emit('frameState:getCurrent')
        })
        socket.on('contestant:didRegister', (participants) => {
            setParticipants(participants)
        })
        return () => {
            socket.off('question:current')
            socket.off('contestant:answers')
            socket.off('frameState')
            socket.off('connect')
        }
    },[])

    const styles = {
        grayAnswer:{
          opacity: "50"
        },
        correctAnswer:{
            fontWeight: "bold"
        },
        plainAnswer:{},
        hide: {
            display: "none",
            opacity: "0"
        }
      };

    useEffect(() => {
        if (!contestantAnswers) return
        let totalAnswers = Object.keys(contestantAnswers).reduce((p,c,i) => {
            p += contestantAnswers[c].length
            return p
        },0)
        if (totalAnswers === 0) return
        setPercentage(Object.keys(contestantAnswers).reduce((p,c,i) => {
            p[c] = ((contestantAnswers[c].length / totalAnswers) * 100).toFixed(2)
            return p
        },{}))
    },[contestantAnswers])

    const Layout = ({children}) => (<Container sm={12} fluid gap={3}>{children}</Container>)

    const AnswerBlockWithPercentage  = () => (<Stack direction="vertical" className="pt-3">
        {answerBlock.map(c => {
            let v = 'secondary'
            if (answer === c.id && frameState === 'timeout') {
                v = 'primary'
            }
            return (<>
            <Alert variant={v} className="mx-auto col-sm-12 col-xs-12 col-md-12 col-lg-8 text-center mb-0" key={c.id}>{`${c.value} (${percentage[c.id] || 0}%)`}</Alert>
            <ProgressBar className="mx-auto col-sm-12 col-xs-12 col-md-12 col-lg-8 text-center mb-3" key={`progress-${c.id}`} now={percentage[c.id]}/>
            </>)
        })}
    </Stack>)

    const Countdown = () => { if (parseInt(secondsRemaining) && parseInt(secondsRemaining) >= 0) {
            return (<Stack direction="vertical"><h3 className="pt-3 mx-auto">Time Remaining</h3><h1 className="pb-3 mx-auto">{secondsRemaining}</h1></Stack>)
        }
    }

    const Question = () => (<h2 className="my-auto mx-auto text-center">{ questionText }</h2>)

    const ParticipantBlock = () => (<div className="fixed-right"><Container fluid>{participants.map((p,i) => 
        (<Gravatar key={`participant-${i}`} email={p} />)
    )}</Container></div>)

    const InitLayout = () => (<><ParticipantBlock /></>)

    const ReadyLayout = () => <><Question /></>

    const CountdownLayout = () => (<>
        <Question />
        <Stack direction="vertical">
        <Countdown />
        <AnswerBlockWithPercentage />
        </Stack>
    </>)

    const TimeoutLayout = () => (<>
    <Question />
    <AnswerBlockWithPercentage />
    </>)

    switch (frameState) {
        case 'ready':
            return (<Layout><Row><Col sm={11}><ReadyLayout /></Col><Col sm={1}><ParticipantBlock /></Col></Row></Layout>)
        case 'countdown':
            return (<Layout><Row><Col sm={11}><CountdownLayout /></Col><Col sm={1}><ParticipantBlock /></Col></Row></Layout>)
        case 'timeout':
            return (<Layout><Row><Col sm={11}><TimeoutLayout /></Col><Col sm={1}><ParticipantBlock /></Col></Row></Layout>)
        case 'init':
        default:
            return (<Layout><Row><Col sm={11}><div/></Col><Col sm={1}><ParticipantBlock /></Col></Row></Layout>)
    } 

}

export default Scoreboard