import React, { useState, useEffect } from 'react'
import { io } from "socket.io-client"
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'
import Stack from 'react-bootstrap/Stack'
import Alert from 'react-bootstrap/Alert';

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

    const AnswerBlockCountdown = () => (<Stack sm={12} direction="vertical" gap={3}>{answerBlock.reduce((p,c,i) => {
            if (answerSent === c.id) {
                p.push((<Alert key={c.id} variant='secondary'>Your Answer: {c.value}</Alert>))                    
            } else if (answerSent === '') {
                p.push((<Button key={c.id} variant='outline-primary' size='lg' onClick={sendAnswer(c.id)}>{c.value}</Button>))
            }
            return p
        },[])}
        </Stack>)

    const AnswerBlockTimeout = () => (<Stack sm={12} direction="vertical" gap={3}>{answerBlock.reduce((p,c,i) => {
        let v = 'secondary'
        if (c.id === answer || (answer === '' && c.id === answerSent)) {
            v = 'primary'
        }    
        if (answerSent === c.id) {
            p.push((<Alert key={c.id} variant={v}>Your Answer: {c.value}</Alert>))                    
        } else {
            p.push((<Alert key={c.id} variant={v}>{c.value}</Alert>))
        }
        return p
    },[])}
    </Stack>)

    const Countdown = () => { if (parseInt(secondsRemaining) && parseInt(secondsRemaining) >= 0) {
            return (<Stack direction="vertical"><h3 className="pt-3 mx-auto">Time Remaining</h3><h1 className="pb-3 mx-auto">{secondsRemaining}</h1></Stack>)
        }
    }

    const Question = () => (<h2 className="my-auto mx-auto">{ questionText }</h2>)

    const InitLayout = () => {
        return (<></>)
    }

    const Container = ({children}) => (<Stack sm={12} direction="vertical" className="w-50 mx-auto my-auto" gap={3}>{children}</Stack>)


    const ReadyLayout = () => <Question value={questionText} />

    const CountdownLayout = () => 
        (<>
            <Question />
            <Stack direction="vertical">
            <Countdown />
            <AnswerBlockCountdown answerBlock={answerBlock} frameState={frameState} />
            </Stack>
            
        </>)

    const TimeoutLayout = () => (<>
    <Question />
    <Stack direction="horizontal">
        <AnswerBlockTimeout answerBlock={answerBlock} frameState={frameState} answerSent={answerSent} answer={answer} />    
    </Stack>
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

        const handleEnter = (e) => {
            if(e.key === 'Enter'){
                handleSubmit(e)
            }
        }
        return (
            <Stack direction="horizontal" className="col-xl-6 col-lg-6 col-md-8 col-sm-12 mx-auto my-auto" gap={3}>
                <Form.Control placeholder="Email address..." className="" value={contestantIdInput} onKeyPress={handleEnter} onChange={handleChange} />
                <Button variant="secondary" onClick={handleSubmit} className>Submit</Button>
            </Stack>)
    } else {
        switch (frameState) {
            case 'ready':
                return (<Container><ReadyLayout /></Container>)
            case 'countdown':
                return (<Container><CountdownLayout /></Container>)
            case 'timeout':
                return (<Container><TimeoutLayout /></Container>)
            case 'init':
            default:
                return (<Container><InitLayout /></Container>)
        }    
    }

}

export default Contestant;