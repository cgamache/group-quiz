import { useEffect, useState } from "react";
import ContestantAnswers from "./ContestantAnswers";

function AnswerBlock(props) {
    const [percentage, setPercentage] = useState([])
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
        if (!props.contestantAnswers) return
        let totalAnswers = Object.keys(props.contestantAnswers).reduce((p,c,i) => {
            p += props.contestantAnswers[c].length
            return p
        },0)
        if (totalAnswers === 0) return
        setPercentage(Object.keys(props.contestantAnswers).reduce((p,c,i) => {
            p[c] = ((props.contestantAnswers[c].length / totalAnswers) * 100).toFixed(2) + "%"
            return p
        },{}))
    },[props.contestantAnswers])

    const Percentage = (props) => {
        return (<div>{percentage[props.answerId]}</div>)
    }

    const Answer = (props) => {
        return (<div style={props.style}>{props.answerId}. {props.value}</div>)
    }

    return (<div>
        {props.value.map(choice => {
            let s = styles.plainAnswer;
            if (props.answer === choice.id && props.frameState === 'timeout') {
                s = styles.correctAnswer
            }
            if (props.frameState === '') {
                s = styles.hide
            }
            return (<div key={choice.id}><Answer style={s} answerId={choice.id} value={choice.value} /><Percentage answerId={choice.id} /></div>)
        })}
    </div>)
}

export default AnswerBlock