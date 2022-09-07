import React, { useState, useEffect } from 'react'
import Countdown from '../widgets/Countdown.js'
import Question from '../widgets/Question.js'
import { io } from "socket.io-client"
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
            p[c] = ((contestantAnswers[c].length / totalAnswers) * 100).toFixed(2) + "%"
            return p
        },{}))
    },[contestantAnswers])

    const Percentage = (props) => {
        return (<div>{percentage[props.answerId]}</div>)
    }

    const Answer = (props) => {
        return (<div style={props.style}>{props.answerId}. {props.value}</div>)
    }

    const AnswerBlockWithPercentage  = () => {
        return (<>
        {answerBlock.map(choice => {
            let s = styles.plainAnswer;
            if (answer === choice.id && frameState === 'timeout') {
                s = styles.correctAnswer
            }
            return (<div key={choice.id}><Answer style={s} answerId={choice.id} value={choice.value} /><Percentage answerId={choice.id} /></div>)
        })}
    </>)}

    const ParticipantBlock = () => (<>{participants.map((p,i) => (<div key={`participant-${i}`}>{p}</div>))}</>)

    const InitLayout = () => (<><ParticipantBlock /></>)

    const ReadyLayout = () => <><Question value={questionText} /><ParticipantBlock /></>

    const CountdownLayout = () => (<>
    <Countdown secondsRemaining={secondsRemaining}/>
    <Question value={questionText} />
    <AnswerBlockWithPercentage />
    <ParticipantBlock />
    </>)

    const TimeoutLayout = () => (<>
    <Question value={questionText} />
    <AnswerBlockWithPercentage />
    <ParticipantBlock />
    </>)

    switch (frameState) {
        case 'ready':
            return (<ReadyLayout />)
        case 'countdown':
            return (<CountdownLayout />)
        case 'timeout':
            return (<TimeoutLayout />)
        case 'init':
        default:
            return (<InitLayout />)
    } 

}

export default Scoreboard