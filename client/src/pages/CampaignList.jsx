import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { sendJson } from '../utils/api';
import useFetch from '../hooks/useFetch';
import usePageStyle from '../hooks/usePageStyle';
import homeCss from '../styles/home.css?inline';
import SiteNav from '../components/SiteNav';
import Loader from '../components/Loader';


function CampaignList() {
    const [code, setCode] = useState('');
    const [joinError, setJoinError] = useState('');
    const navigate = useNavigate();

    usePageStyle(homeCss);
    const { data, setData, loading, error } = useFetch('/api/campaigns');

    const deleteCampaign = async (e, camp) => {
        e.preventDefault();
        e.stopPropagation();
        if (!window.confirm(`Do you want to delete ${camp.name}? This cannot be undone.`)) return;

        const res = await fetch(`/api/campaigns/${camp.id}`, { method: 'DELETE' });
        if (res.ok) {
            setData((prev) => ({ ...prev, campaigns: prev.campaigns.filter((c) => c.id !== camp.id) }));
        }
    };

    const joinCampaign = async (e) => {
        e.preventDefault();
        setJoinError('');
        try {
            const { id } = await sendJson('/api/campaigns/join', 'POST', { code });
            navigate(`/campaign/${id}`);
        } catch (err) {
            setJoinError(err.message);
        }
    };

    if (error) return <p>Failure is upon us: {error}</p>;
    if (loading) return <Loader text='Summoning your stories...'/>;

    const { campaigns } = data;

    return (
        <>
            <header id="site-title">
                <img src="/Logo.png" alt="Eldrid Tales Logo" className="title-logo" />
                <h1>Campaigns</h1>
            </header>
            <SiteNav />
            <main className="page-campaign">
                <section className="campaign-tabs">
                    <Link to="/create_campaign">Create Campaign</Link>
                    <form onSubmit={joinCampaign} className='join-campaign'>
                        <input className='field' type='text' placeholder='invite-code' value={code} onChange={(e) => setCode(e.target.value)} maxLength={8} />
                        <button className='btn' type='submit'>Join Campaign</button>
                        {joinError && <p className='error'>{joinError}</p>}
                    </form>
                </section>
                <section className="campaign-list">
                    {campaigns.length === 0 ? (
                        <p>No Tales Yet</p>
                    ) : (
                        <ul className="tile-list" id="campaign-list">
                            {campaigns.map((camp) => (
                                <li key={camp.id} className="campaign-tile">
                                    <Link to={`/campaign/${camp.id}`}>
                                        <h3 className="campaign-name">{camp.name}</h3>
                                        <p className="campaign-description">{camp.description}</p>
                                        {camp.role === 'dm' && (<button type="button" className="campaign-delete-button" onClick={(e) => deleteCampaign(e, camp)}>Delete</button>)}  
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            </main>
        </>
    );
}

export default CampaignList;