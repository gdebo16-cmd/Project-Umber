import { useNavigate } from 'react-router';

// Back / Forward buttons at the top of the character creator steps.
// Pass a path to enable a button, or null to disable it.
function StepNav({ back, forward }) {
    const navigate = useNavigate();
    return (
        <nav id="step-nav">
            <button type="button" className="btn-step" disabled={!back} onClick={() => navigate(back)}>Back</button>
            <button type="button" className="btn-step" disabled={!forward} onClick={() => navigate(forward)}>Forward</button>
        </nav>
    );
}

export default StepNav;
