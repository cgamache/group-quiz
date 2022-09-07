import React, { useState, useEffect } from 'react'
import { io } from "socket.io-client"
const socket = io()

function Contestant(props) {
    const [contestantIdInput, setContestantIdInput] = useState('')
    const [contestantId, setContestantId] = useState('')
    const [questionText, setQuestionText] = useState('')
    const [questionId, setQuestionId] = useState(-1)
    const [quizId, setQuizId] = useState(-1)
    const [answerBlock, setAnswerBlock] = useState([])
    const [answer, setAnswer] = useState('')
    const [frameState, setFrameState] = useState('')
    const [secondsRemaining, setSecondsRemaining] = useState(-1)
    const [timeStamp, setTimeStamp] = useState(-1)
    const [maxTimeout, setMaxTimeout] = useState(-1)
    const [answerSent, setAnswerSent] = useState('')
    const remaining = (maxTimeout, timeStamp) => maxTimeout - (Math.round(Date.now() / 1000) - timeStamp)
    // 
    useEffect(() => {
        if (secondsRemaining < 0) return;
        const id = setInterval(() => {
            setSecondsRemaining(remaining(maxTimeout, timeStamp))
          }, 1000)
        return () => clearInterval(id);
    },[secondsRemaining, setSecondsRemaining, timeStamp, maxTimeout])

    useEffect(() => {
        const resetAll = () => {
            setQuestionText('')
            setQuizId(-1)
            setQuestionId(-1)
            setAnswerBlock([])
            setAnswer('')
            setTimeStamp(-1)
            setMaxTimeout(-1)
            setSecondsRemaining(-1)
            setAnswerSent('')
        }    

        socket.on('frameState', (frameState) => {
            setFrameState(frameState)
            if (frameState === 'init' || frameState === '' || frameState === 'ready') {
                resetAll()
            }
        })

        socket.on('resetState', () => {
            setQuestionText('')
            setQuizId(-1)
            setQuestionId(-1)
            setAnswerBlock([])
            setAnswer('')
            setTimeStamp(-1)
            setMaxTimeout(-1)
            setSecondsRemaining(-1)
            setAnswerSent('')
        })
        socket.on('contestant:current', (question) => {
            setQuestionText(question.question)
            setQuizId(question.quizId)
            setQuestionId(question.questionId)
            setAnswerBlock(question.choices)
            setAnswer(question.answer)
            setTimeStamp(question.ts)
            setMaxTimeout(question.duration)
            setSecondsRemaining(remaining(question.duration, question.ts))
        })
        socket.on('connect', () => {
            socket.emit('contestant:getCurrent')
            socket.emit('frameState:getCurrent')
        })
        return () => {
            socket.off('contestant:current')
            socket.off('connect')
            socket.off('frameState')
        }
    },[])

    const sendAnswer = (id) => {
        return (event) => {
            console.log('sendAnswer', quizId, questionId, contestantId, id)
            socket.emit('contestant:submitAnswer', quizId, questionId, contestantId, id)
            setAnswerSent(id)
        }
    }

    const styles = {
        plainAnswer:{},
        correctAnswer:{
            fontWeight: "bold"
        },
        hide: {
            display: "none",
            opacity: "0"
        }
      };

    const AnswerBlockCountdown = () => (<>{answerBlock.reduce((p,c,i) => {
            let s = styles.plainAnswer;
            if (answerSent === c.id) {
                p.push((<div key={c.id} style={s}>Your Answer: {c.value}</div>))                    
            } else if (answerSent === '') {
                p.push((<div key={c.id} style={s}>
                    <button onClick={sendAnswer(c.id)}>{c.value}</button>                
                </div>))
            }
            return p
        },[])}
        </>)

    const AnswerBlockTimeout = () => (<>{answerBlock.reduce((p,c,i) => {
        let s = styles.plainAnswer;
        if (c.id === answer) {
            s = styles.correctAnswer
        }    
        if (answerSent === c.id) {
            p.push((<div key={c.id} style={s}>Your Answer: {c.value}</div>))                    
        } else {
            p.push((<div key={c.id} style={s}>{c.value}</div>))
        }
        return p
    },[])}
    </>)

    const Countdown = (props) => (<div>{ (parseInt(props.secondsRemaining) && parseInt(props.secondsRemaining) >= 0) ? `Time Remaining ${props.secondsRemaining}` : '' }</div>)

    const Question = (props) => (<div>{ props.value }</div>)

    const InitLayout = () => {
        return (<></>)
    }

    const ReadyLayout = () => <Question value={questionText} />

    const CountdownLayout = () => 
        (<>
            <Countdown secondsRemaining={secondsRemaining} />
            <Question value={questionText} />
            <AnswerBlockCountdown answerBlock={answerBlock} frameState={frameState} />
        </>)

    const TimeoutLayout = () => (<><Question value={questionText} />
        <AnswerBlockTimeout answerBlock={answerBlock} frameState={frameState} answerSent={answerSent} answer={answer} />
        </>)
    
    if (contestantId === '') {
        const handleSubmit = (e) => {
            e.preventDefault()
            setContestantId(contestantIdInput)
            socket.emit("contestant:register", contestantIdInput)
            setContestantIdInput('')
        }
        const handleChange = (e) => {
            setContestantIdInput(e.target.value);
        }
        return (<form onSubmit={handleSubmit}><label>Email Address:</label><input type="text" value={contestantIdInput} onChange={handleChange} /><input type="submit" value="Submit" /></form>)
    } else {
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

}

export default Contestant;