
import quizz from './quiz.json' assert { type: 'json' }

let quiz = null
let question = null
let contestantQuestion = null
let ts = null
let answers = {}
let frameState = ''
let participants = []

function registerEvents(io) {

    const createQuestionCollection = (q) => {
        if (!q) return
        return q.reduce((p,c,i) => {
            p[i] = c.choices.reduce((p1,c1,i1) => {
                p1[c1.id] = []
                return p1
            },{})
            return p
        },[])
    }

    const setQuestion = (questionId) => {
        question = quiz && quiz.questions && quiz.questions[questionId]
        if (question) {
            question.questionId = questionId
            question.quizId = quiz.quizId
            contestantQuestion = Object.assign({}, question)
            contestantQuestion.answer = ''
        }
    }

    const setQuiz = (quizId) => {
        quiz = quizz && quizz[quizId]
        if (quiz) {
            quiz.quizId = quizId
            answers[quiz.quizId] = createQuestionCollection(quiz.questions)
        }
    }

    const getAnswers = (quizId, questionId) => {
        if (answers && answers[quizId] && answers[quizId][questionId]) {
            return answers[quizId][questionId] || {}
        }
    }

    const nextQuestion = (socket) => {
        return (quizIdValue) => {
            setQuiz(quizIdValue)
            if (!quiz || !question) return
            setQuestion(question.questionId + 1)    
            if (!question) return
            question.maxQuestions = quiz.questions.length || 0 
            question.contestantAnswers = getAnswers(quiz.quizId,question.questionId)
            frameState = 'ready'
            io.emit("frameState", frameState)
            io.emit("question:current", question)
            io.emit("contestant:current", contestantQuestion)
        }
    }
    const startCountdown = (socket) => {
        return () => {
            if (!question || frameState !== 'ready') return
            ts = Math.round(Date.now() / 1000)
            question.ts = ts
            contestantQuestion.ts = ts
            frameState = 'countdown'
            io.emit("frameState", frameState)
            io.emit("question:current", question)
            io.emit("contestant:current", contestantQuestion)
            setTimeout(() => {
                frameState = 'timeout'
                // question.answer = quiz.questions[question.questionId].answer
                if (answers && question) {
                    io.emit("contestant:answers", getAnswers(question.quizId,question.questionId))
                }
                io.emit("frameState", frameState)
                io.emit("question:current", question)
                io.emit("contestant:current", question)
            }, 1000 * question.duration)
        }
    }

    const currentQuestion = (socket) => {
        return () => {
            if (!question) return
            socket.emit("question:current", question)
        }
    }

    const newSession = (socket) => {
        return (quizIdValue) => {
            setQuiz(quizIdValue)
            setQuestion(0)
            ts = null
            answers = {}
            if (!question) return;
            question.maxQuestions = quiz.questions.length || 0 
            question.contestantAnswers = getAnswers(quiz.quizId,question.questionId)
            frameState = 'ready'
            io.emit("frameState", frameState)
            io.emit("question:current", question)
            io.emit("contestant:current", contestantQuestion)
        }    
    }

    const contestantCurrent = (socket) => {
        return () => {
            if (!contestantQuestion) return
            socket.emit("contestant:current", contestantQuestion)
        }
    }

    const currentFrameState = (socket) => {
        return () => {
            socket.emit("frameState", frameState)
        }
    }

    const setAnswer = (quizId, questionId, answerValue, contestantId) => {
        if (!answers) {
            answers = {}
        }
        if (!answers[quizId]) {
            answers[quizId] = []
        }
        if (!answers[quizId][questionId]) {
            answers[quizId][questionId] = {}
        }
        answers[question.quizId][question.questionId][answerValue] = [...answers[question.quizId][question.questionId][answerValue] || [], contestantId]
    }

    const isValidAnswer = (value) => {
        return true
    }
    const contestantAnswer = (socket) => {
        return (quizId, questionId, contestantId, answerValue) => {
            if (!question) return
            if (frameState === 'countdown' && 
                question.quizId === quizId && 
                question.questionId === questionId && 
                isValidAnswer(answerValue)) {
                    setAnswer(quizId,questionId,answerValue,contestantId)
                    question.contestantAnswers = getAnswers(quizId,questionId)
            }
            io.emit("contestant:answers", getAnswers(question.quizId,question.questionId))
            io.emit("question:current", question)
            socket.emit("contestant:current", question)
        }
    }

    const contestantGetAnswers = (socket) => {
        return () => {
            if (!question || !answers || !answers[question.quizId]) return
            socket.emit("contestant:answers", getAnswers(question.quizId,question.questionId))
        }
    }

    const contestantRegister = (socket) => {
        return (emailAddress) => {
            const email = emailAddress.toLowerCase()
            if (participants.indexOf(email) === -1) {
                participants.push(email)
            }
            io.emit("contestant:didRegister", participants)
        }
    }

    const contestantGetParticipants = (socket) => {
        return () => {
            if (participants) {
                io.emit("contestant:didRegister", participants)
            }
        }
    }

    const quizGetName = (socket) => {
        return (quizId) => {
            socket.emit("quiz:name", quizz[quizId || 0].name)
        }
    }

    const onConnection = (socket) => {
        socket.on("quiz:getName", quizGetName(socket))
        socket.on("question:newSession", newSession(socket))
        socket.on("question:getCurrent", currentQuestion(socket))
        socket.on("question:nextQuestion", nextQuestion(socket))
        socket.on("question:startCountdown", startCountdown(socket))
        socket.on("contestant:getCurrent", contestantCurrent(socket))
        socket.on("contestant:submitAnswer", contestantAnswer(socket))
        socket.on("frameState:getCurrent", currentFrameState(socket))
        socket.on("contestant:getAnswers", contestantGetAnswers(socket))
        socket.on("contestant:register", contestantRegister(socket))
        socket.on("contestant:getParticipants", contestantGetParticipants(socket))
    }

    io.on("connection", onConnection);

}

export default registerEvents