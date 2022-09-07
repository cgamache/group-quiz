function ContestantAnswers(props) {
    const styles = {
        plainAnswer:{},
        hide: {
            display: "none",
            opacity: "0"
        }
      };
    return (<div>
        {props.value.map(choice => {
            let s = styles.plainAnswer;
            if (props.answerSent !== '' || props.frameState === 'ready') {
                s = styles.hide
            }
            if (props.answerSent === choice.id) {
                return (<div key={choice.id}>Your Answer: {choice.value}</div>)
            } else {
                return (<div key={choice.id} style={s}>
                    <button onClick={props.sendAnswer}>{choice.value}</button>                
                </div>)    
            }
        })}
    </div>)
}

export default ContestantAnswers