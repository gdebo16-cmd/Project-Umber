import {Link, useParams} from 'react-router';
import { useState } from 'react';
import { sendJson } from '../utils/api';
import useFetch from '../hooks/useFetch';
import usePageStyle from '../hooks/usePageStyle';
import campaignPageCss from '../styles/campaignPage.css?inline';
import Loader from '../components/Loader';
import SiteNav from '../components/SiteNav';
import campaignImages from '../data/campaignImages';


function CampaignPage() {
    usePageStyle(campaignPageCss);
    const {campId} = useParams();
    const {data, setData, loading, error} = useFetch(`/api/campaigns/${campId}`);
    const home = useFetch('/api/home');
    const [picked, setPicked] = useState(null);
    const [campTab, setCampTab] = useState('campaign'); // which section shows on mobile
    const [editing, setEditing] = useState(false); // DM edit-campaign form
    const [form, setForm] = useState({ name: '', description: '', campaign_img_url: null });
    const [saving, setSaving] = useState(false);
    const [editError, setEditError] = useState('');


    if (error) return <p>Failure is upon us: {error}</p>;
    if (loading) return <Loader text='Summoning your stories...'/>;

    const {campaign, members} = data;
    
    const characters = home.data?.characters ?? [];
    const selectedId = picked ?? campaign.character_id ?? '';
    const chooseCharacter = async (e) => {
        const id = Number(e.target.value);
        setPicked(id);
        await sendJson(`/api/campaigns/${campId}/character`, 'PUT', { characterId: id }); // refresh the members list
        const res = await fetch(`/api/campaigns/${campId}`, { credentials: 'include' });
        if (res.ok) setData(await res.json());
    };

    const startEdit = () => {
        setForm({ name: campaign.name ?? '', description: campaign.description ?? '', campaign_img_url: campaign.campaign_img_url ?? null });
        setEditError('');
        setEditing(true);
    };
    const saveEdit = async (e) => {
        e.preventDefault();
        if (!form.name.trim()) { setEditError('Campaign name is required.'); return; }
        setSaving(true);
        setEditError('');
        try {
            const body = { name: form.name.trim(), description: form.description, campaign_img_url: form.campaign_img_url };
            await sendJson(`/api/campaigns/${campId}`, 'PATCH', body);
            setData((prev) => ({ ...prev, campaign: { ...prev.campaign, ...body } }));
            setEditing(false);
        } catch (err) {
            setEditError(err.message || 'Could not save the campaign.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            <header id="site-title">
                <img src="/Logo.png" alt="Eldrid Tales Logo" className="title-logo" />
                <h1>Campaign</h1>
            </header>
            <SiteNav />
            <main>
                <nav className="home-tabs">
                    <button type="button" className={campTab === 'campaign' ? 'home-tab is-active' : 'home-tab'} onClick={() => setCampTab('campaign')}>Campaign</button>
                    <button type="button" className={campTab === 'invite' ? 'home-tab is-active' : 'home-tab'} onClick={() => setCampTab('invite')}>Invite / Join</button>
                    <button type="button" className={campTab === 'players' ? 'home-tab is-active' : 'home-tab'} onClick={() => setCampTab('players')}>Current Players</button>
                </nav>
                <section className={campTab === 'campaign' ? 'container campaign-tile is-active' : 'container campaign-tile'}>
                    {editing ? (
                        <>
                            <h2 className="campaign-name"><strong>Edit Campaign</strong></h2>
                            <form className="camp-panel camp-edit-form" onSubmit={saveEdit}>
                                <div className="camp-panel-row">
                                    <label className="camp-panel-label" htmlFor="camp-edit-name">Title</label>
                                    <input id="camp-edit-name" className="field" type="text" maxLength={120} value={form.name}
                                        onChange={(e) => setForm({ ...form, name: e.target.value })} />
                                </div>
                                <div className="camp-panel-row">
                                    <label className="camp-panel-label" htmlFor="camp-edit-desc">Description</label>
                                    <textarea id="camp-edit-desc" className="field" rows={5} value={form.description}
                                        onChange={(e) => setForm({ ...form, description: e.target.value })} />
                                </div>
                                <div className="camp-panel-row">
                                    <p className="camp-panel-label">Campaign image</p>
                                    <div className="camp-img-grid">
                                        <button type="button" className={form.campaign_img_url === null ? 'camp-img-choice camp-img-none is-selected' : 'camp-img-choice camp-img-none'}
                                            onClick={() => setForm({ ...form, campaign_img_url: null })}>
                                            <span>None</span>
                                        </button>
                                        {campaignImages.map((img) => (
                                            <button type="button" key={img.url} title={img.label}
                                                className={form.campaign_img_url === img.url ? 'camp-img-choice is-selected' : 'camp-img-choice'}
                                                onClick={() => setForm({ ...form, campaign_img_url: img.url })}>
                                                <img src={img.url} alt={img.label} loading="lazy" />
                                                <span>{img.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                {editError && <p className="camp-edit-error" role="alert">{editError}</p>}
                                <div className="camp-edit-actions">
                                    <button type="submit" className="btn btn-form" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
                                    <button type="button" className="btn btn-form" disabled={saving} onClick={() => setEditing(false)}>Cancel</button>
                                </div>
                            </form>
                        </>
                    ) : (
                        <>
                            <h2 className="campaign-name"><strong>{campaign.name}</strong></h2>
                            {campaign.campaign_img_url
                                ? <img className="campaign-image" src={campaign.campaign_img_url} alt={`${campaign.name} picture`} />
                                : <div className="campaign-image" role="img" aria-label={`${campaign.name} picture`} />}
                            <p className="campaign-description"> <em>Description:</em> <br /> {campaign.description}</p>
                            {campaign.role === 'dm' && (
                                <div className="camp-edit-actions">
                                    <button type="button" className="btn btn-form" onClick={startEdit}>Edit Campaign</button>
                                </div>
                            )}
                        </>
                    )}
                </section>
                <section className={campTab === 'invite' ? 'container campaign-tile camp-panel-tile is-active' : 'container campaign-tile camp-panel-tile'}>
                    <h2 className="campaign-name"><strong>Invite / Join</strong></h2>
                    <div className="camp-panel">
                        {campaign.role === 'dm' && (
                            <div className="camp-panel-row">
                                <p className="camp-panel-label">Invite code</p>
                                <p className="camp-invite-code">{campaign.invite_code}</p>
                                <p className="camp-panel-hint">Share this code so players can join.</p>
                            </div>
                        )}
                        <div className="camp-panel-row">
                            <label className="camp-panel-label" htmlFor="camp-character">Your character</label>
                            <select id="camp-character" className="field" value={selectedId} onChange={chooseCharacter}>
                                <option value="" disabled>Choose a character</option>
                                {characters.map((ch) => (
                                    <option className="field-option" key={ch.id} value={ch.id}>{ch.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </section>
                <section className={campTab === 'players' ? 'container campaign-tile camp-panel-tile is-active' : 'container campaign-tile camp-panel-tile'}>
                    <h2 className="campaign-name"><strong>Current Players</strong></h2>
                    <ul className="camp-panel campaign-member-list">
                        {members.map((mem) => (
                            <li className="camp-panel-row campaign-member" key={mem.username}>
                                <span className="member-name">{mem.username}</span>
                                <span className={`member-role role-${mem.role}`}>{mem.role === 'dm' ? 'DM' : 'Player'}</span>
                                {/* players never see the DM's character status; the DM sees everything */}
                                {!(mem.role === 'dm' && campaign.role !== 'dm') && <span className="member-character">
                                    {mem.character_name
                                        ? (campaign.role === 'dm'
                                            ? <Link to={`/characters/${mem.character_id}`}>{mem.character_name}</Link>
                                            : mem.character_name)
                                        : (mem.role === 'dm' ? null : <em>No character yet</em>)}
                                </span>}
                            </li>
                        ))}
                    </ul>
                </section>
            </main>
            <footer>
                <Link id="home-link" to="/home">Home</Link>
            </footer>
        </>
    );
}

export default CampaignPage;
