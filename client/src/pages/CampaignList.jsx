import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { sendJson } from '../utils/api';
import useFetch from '../hooks/useFetch';
import usePageStyle from '../hooks/usePageStyle';
import campaignListCss from '../styles/campaignList.css?inline';
import SiteNav from '../components/SiteNav';
import Loader from '../components/Loader';


function CampaignList() {
    const [code, setCode] = useState('');
    const [joinError, setJoinError] = useState('');
    const navigate = useNavigate();

    usePageStyle(campaignListCss);
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
            <main>
                <section className="cl-panel">
                    <h2 className="cl-header"><strong>Start or Join a Tale</strong></h2>
                    <div className="cl-body cl-actions">
                        <Link className="btn cl-create" to="/create_campaign">Create Campaign</Link>
                        <form onSubmit={joinCampaign} className="cl-join">
                            <input className="field" type="text" placeholder="Invite code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} maxLength={8} />
                            <button className="btn" type="submit">Join</button>
                        </form>
                        {joinError && <p className="cl-error">{joinError}</p>}
                    </div>
                </section>
                <section className="cl-panel">
                    <h2 className="cl-header"><strong>Your Campaigns</strong></h2>
                    <div className="cl-body">
                        {campaigns.length === 0 ? (
                            <p className="cl-empty">No Tales Yet</p>
                        ) : (
                            <ul className="cl-list">
                                {campaigns.map((camp) => (
                                    <li key={camp.id} className="cl-card">
                                        <Link className="cl-card-link" to={`/campaign/${camp.id}`}>
                                            {camp.campaign_img_url
                                                ? <img className="cl-card-image" src={camp.campaign_img_url} alt="" />
                                                : <div className="cl-card-image" aria-hidden="true" />}
                                            <div className="cl-card-text">
                                                <h3 className="cl-card-name">{camp.name}</h3>
                                                <span className={`cl-role role-${camp.role}`}>{camp.role === 'dm' ? 'DM' : 'Player'}</span>
                                                <p className="cl-card-description">{camp.description}</p>
                                            </div>
                                        </Link>
                                        {camp.role === 'dm' && (
                                            <button type="button" className="btn cl-delete" onClick={(e) => deleteCampaign(e, camp)}>Delete</button>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </section>
            </main>
        </>
    );
}

export default CampaignList;