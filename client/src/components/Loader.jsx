function Loader({ text = 'Loading...' }) {
    return (
        <div className="loader" role="status" aria-live='polite'>
            <div className='loader-ring'></div>
            <p className='loader-text'>{text}</p>
        </div>
    );
}

export default Loader;