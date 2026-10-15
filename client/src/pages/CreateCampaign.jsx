import { useState} from 'react';
import { Link, useNavigate } from 'react-router';
import usePageStyle from '../hooks/usePageStyle';
import createCss from '../styles/char_create.css?inline';
import { sendJson } from '../utils/api';



function CreateCampaign() {
    usePageStyle(createCss, null, 'page-create');
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [saveError, setSaveError] = useState('');


    const submit = async (e) => {
        e.preventDefault();
        try {
            const { id } = await sendJson('/api/campaigns', 'POST', { name, description });
            navigate(`/campaign/${id}`);
        } catch (err) {
            setSaveError(err.message);
        }
    };


    return (
        <>
            <header id="topContainer">
                <h1 id="site-title">Create Campaign</h1>
                <h2 id="form-title">Name and description</h2>
            </header>

            <main>
                <section id="form-container">
                    <form className="form-container" onSubmit={submit}>
                        <article id="campaign-name-container" className="form-section tile">
                            <label className="tile-top" htmlFor="name">Campaign name</label>
                            <input className="tile-bottom" type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="A tale in the making" />
                        </article>
                        <article id="campaign-description-container" className="form-section tile">
                            <label className="tile-top" htmlFor="description">Description</label>
                            <textarea className="tile-bottom" id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="A brief description of the campaign" />
                        </article>
                        <button type="submit" id="submit-button" className="btn btn-primary">Create Campaign</button>
                        {saveError && <p className="error-message">{saveError}</p>}
                    </form>
                </section>
            </main>
            <footer>
                <Link id="home-link" to="/home">Cancel</Link>
            </footer>
        </>     
    );
}

export default CreateCampaign;