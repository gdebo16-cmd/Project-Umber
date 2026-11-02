
import '../styles/loader.css';

function Loader({ text = 'Trying my best...' }) {
    return (
        <div className="loader" role="status" aria-live='polite'>
            <div className='loader-ring'></div>
            <p className='loader-text'>{text}</p>
        </div>
    );
}

export default Loader;