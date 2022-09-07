import React, { useState } from 'react'
import Countdown from './Countdown.js'
import Question from './Question.js'
import AnswerBlock from './AnswerBlock.js'

function ContestantViewFrame() {
const [question, setQuestion] = useState('')
const [answerBlock, setAnswerBlock] = useState([])
const [answer, setAnswer] = useState('')
const [frameState, setFrameState] = useState('')
// socket.on("active-quiz", (quiz) => {
//     setQuestion(quiz.question)
//     setAnswerBlock(quiz.answerBlock)
//     setAnswer(quiz.answer)
//     setFrameState(quiz.frameState)
// });
return (<>
    <Countdown />
    <Question value={question} />
    <AnswerBlock value={answerBlock} answer={answer} frameState={frameState} />    
</>)

}

export default ContestantViewFrame