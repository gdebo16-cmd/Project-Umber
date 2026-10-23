import { useState} from 'react';
import { useNavigate } from 'react-router';
import usePageStyle from '../hooks/usePageStyle';
import campCreateCss from '../styles/campCreate.css?inline';
import { sendJson } from '../utils/api';
import SiteNav from '../components/SiteNav';


function CreateCampaign() {
    usePageStyle(campCreateCss);
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
            <header id="site-title">
                <img src="/Logo.png" alt="Eldrid Tales Logo" className="title-logo" />
                <h1>Create Campaign</h1>
            </header>
                <SiteNav />
            <main>
                <section id="campaign-container" className="campaign-container">
                    <form onSubmit={submit}>
                        <article id="campaign-name-container" className="campaign-tile">
                            <label className="campaign-label" htmlFor="name">Campaign name</label>
                            <input className="campaign-value" type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="A tale in the making" />
                        </article>
                        <article id="campaign-description-container" className="campaign-tile">
                            <label className="campaign-label" htmlFor="description">Description</label>
                            <textarea className="campaign-value" id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="A brief description of the campaign" />
                        </article>
                        <article id="campaign-button-container" className="campaign-tile">
                            <button type="submit" id="submit-button" className="campaign-button">Create Campaign</button>
                        </article>
                        {saveError && <p className="error-message">{saveError}</p>}
                    </form>
                </section>
            </main>
            <footer>
                <p className="footer-text">copyrite Eldrid Tales LLC</p>
            </footer>
        </>     
    );
}

export default CreateCampaign;