const Countdown = (props) => (<div>{ (parseInt(props.secondsRemaining) && parseInt(props.secondsRemaining) >= 0) ? `Time Remaining ${props.secondsRemaining}` : '' }</div>)

export default Countdown;