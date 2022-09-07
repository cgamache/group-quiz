import React, { useState, useEffect } from 'react'
import Countdown from '../widgets/Countdown.js'
import Question from '../widgets/Question.js'
import AnswerBlock from '../widgets/AnswerBlock.js'
import { io } from "socket.io-client"
const socket = io()

function Host(props) {
    
    const [questionText, setQuestionText] = useState('')
    const [maxQuestions, setMaxQuestions] = useState(0)
    const [questionId, setQuestionId] = useState(-1)
    const [answerBlock, setAnswerBlock] = useState([])
    const [answer, setAnswer] = useState('')
    const [frameState, setFrameState] = useState('')
    const [secondsRemaining, setSecondsRemaining] = useState(-1)
    const [timeStamp, setTimeStamp] = useState(-1)
    const [maxTimeout, setMaxTimeout] = useState(-1)
    const remaining = (maxTimeout, timeStamp) => maxTimeout - (Math.round(Date.now() / 1000) - timeStamp)
    const isLastQuestion = () => questionId === maxQuestions - 1
    // 
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
        })
        socket.on('question:current', (question) => {
            setQuestionText(question.question)
            setMaxQuestions(question.maxQuestions)
            setQuestionId(question.questionId)
            setAnswerBlock(question.choices)
            setAnswer(question.answer)
            setTimeStamp(question.ts)
            setMaxTimeout(question.duration)
            setSecondsRemaining(remaining(question.duration, question.ts))
        })
        socket.on('connect', () => {
            socket.emit('question:getCurrent')
            socket.emit('frameState:getCurrent')
        })
        return () => {
            socket.off('question:current')
            socket.off('frameState')
            socket.off('connect')
        }
    },[])

    function startCountdown() {
        socket.emit('question:startCountdown')
    }
    function nextQuestion() {
        socket.emit('question:nextQuestion',props.quizId)
    }
    function newSession() {
        socket.emit('question:newSession',props.quizId)
    }

    const NextQuestion = () => (<button onClick={nextQuestion}>Next Question</button>)
    const NewSession = () => (<button onClick={newSession}>New Session</button>)
    const TimeoutButtons = () => {
        if (isLastQuestion()) {
            return (<NewSession />)
        } else {
            return (<NextQuestion />)
        }
    }
    const StartCountdown = () => (<button onClick={startCountdown}>Start Countdown</button>)

    const InitLayout = () => (<><NewSession /></>)

    const ReadyLayout = () => (<>
    <Question value={questionText} />
    <AnswerBlock value={answerBlock} answer={answer} frameState={frameState} />
    <StartCountdown />
    </>)

    const CountdownLayout = () => (<>
    <Countdown secondsRemaining={secondsRemaining}/>
    <Question value={questionText} />
    <AnswerBlock value={answerBlock} answer={answer} frameState={frameState} />
    </>)

    const TimeoutLayout = () => (<>
    <Question value={questionText} />
    <AnswerBlock value={answerBlock} answer={answer} frameState={frameState} />
    <TimeoutButtons />
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

 //     return (<>
//         <button onClick={activateLasers}>
//             Activate Lasers
//         </button>
//         <Countdown />
//         <Question value={question} />
//         <AnswerBlock value={answerBlock} answer={answer} frameState={frameState} />    
//     </>)
}
// function Host () {
//     return (<div>Hello host...</div>)
// }
export default Host