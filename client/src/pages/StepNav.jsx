import { useNavigate } from 'react-router';

// Back / Forward buttons at the top of the character creator steps.
// Pass a path to enable a button, or null to disable it.
function StepNav({ back, forward }) {
    const navigate = useNavigate();
    return (
        <nav id="stepNav">
            <button type="button" className="stepNavButton" disabled={!back} onClick={() => navigate(back)}>Back</button>
            <button type="button" className="stepNavButton" disabled={!forward} onClick={() => navigate(forward)}>Forward</button>
        </nav>
    );
}

export default StepNav;
