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
    const [copied, setCopied] = useState(false);
    const isDm = data?.campaign?.role === 'dm';
    const monsters = useFetch(isDm ? `/api/campaigns/${campId}/monsters` : null);
    const catalog = useFetch(isDm ? '/api/monsters' : null);
    const [pickMonster, setPickMonster] = useState('');

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

    const shareInvite = async () => {
        const url = `${window.location.origin}/join/${campaign.invite_code}`;
        if (navigator.share) {
          try {
            await navigator.share({ title: campaign.name, text: `Join my campaign "${campaign.name}"`, url });
          } catch { /* they closed the share menu */ }
        } else if (navigator.clipboard) {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } else {
          window.prompt('Copy this link:', url);
        }
      };

      const addMonster = async () => {
        if (!pickMonster) return;
        const res = await fetch(`/api/campaigns/${campId}/monsters`, {
            method: 'POST', credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ monster_id: Number(pickMonster) }),
        });
        if (!res.ok) return alert('Could not add that monster.');
        const added = await res.json();
        monsters.setData([...(monsters.data || []), { ...added, name: catalog.data.find((m) => m.id === added.monster_id)?.name }]);
        setPickMonster('');
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
                    {isDm && (
                    <button type="button" className={campTab === 'monsters' ? 'home-tab is-active' : 'home-tab'} onClick={() => setCampTab('monsters')}>Monsters</button>
                    )}
                </nav>
                <section className={campTab === 'campaign' ? 'container campaign-tile camp-area-a is-active' : 'campaign-container'}>
                    {editing ? (
                    <>
                        <div className="edit-container">
                            <article className="title-edit">
                                <h2><strong>Edit Tale</strong></h2>
                            </article>
                            
                            <form onSubmit={saveEdit}>
                                <div className="title-edit">
                                    <label className="edit-label" htmlFor="camp-edit-name">Title</label>
                                    <input id="camp-edit-name" className="edit-input" type="text" maxLength={120} value={form.name}
                                        onChange={(e) => setForm({ ...form, name: e.target.value })} />
                                </div>
                                <div className="description-edit">
                                    <label className="edit-label" htmlFor="camp-edit-desc">Description</label>
                                    <textarea id="camp-edit-desc" className="edit-input" rows={5} value={form.description}
                                        onChange={(e) => setForm({ ...form, description: e.target.value })} />
                                </div>
                                
                                <div className="edit-actions">
                                    <button type="submit" className="action-button" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
                                    <button type="button" className="action-button" disabled={saving} onClick={() => setEditing(false)}>Return</button>
                                </div>
                                <div className="image-edit">
                                    <div className="image-grid">
                                        {campaignImages.map((img) => (
                                            <button type="button" key={img.url} title={img.label}
                                                className={form.campaign_img_url === img.url ? 'image-choice is-selected' : 'image-choice'}
                                                onClick={() => setForm({ ...form, campaign_img_url: img.url })}>
                                                <img className="image-select" src={img.url} alt={img.label} loading="lazy" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                {editError && <p className="edit-error" role="alert">{editError}</p>}
                            </form>    
                        </div>
                    </>    
                    ) : (
                        <>
                            <h2 className="title-edit"><strong>{campaign.name}</strong></h2>
                            {campaign.campaign_img_url
                                ? <img className="image-campaign" src={campaign.campaign_img_url} alt={`${campaign.name} picture`} />
                                : <div className="image-campaign" role="img" aria-label={`${campaign.name} picture`} />}
                            <div className="description-edit">
                                <div className="campaign-description">
                                    <p className="edit-label">Description</p>
                                    <input className="edit-input-display" type="text" value={campaign.description} readOnly />
                                </div>
                            </div>
                            {campaign.role === 'dm' && (
                                <div className="edit-actions">
                                    <button type="button" className="action-button" onClick={startEdit}>Edit Tale</button>
                                </div>
                            )}
                        </>
                    )}
                </section>
                <section className={campTab === 'invite' ? 'invite-container is-active' : 'invite-container'}>
                    <article className='invite-tile'>
                        <h2 className="campaign-title"><strong>Invite / Join</strong></h2>
                        {campaign.role === 'dm' && (
                            <div className="invite-set">
                                <p className="invite-label">Invite code</p>
                                <p className="invite-code">{campaign.invite_code}</p>
                                <button type="button" className="share-button" onClick={shareInvite}>
                                    {copied ? 'Copied!' : 'Share invite link'}
                                </button>
                            </div>
                        )}
                            <div className="invite-set">
                                <label className="invite-label-2" htmlFor="camp-character">Your character</label>
                                <select id="camp-character" className="invite-select" value={selectedId} onChange={chooseCharacter}>
                                    <option className='invite-option-disabled' value="" disabled>Choose a character</option>
                                    {characters.map((ch) => (
                                        <option className="invite-option-selected" key={ch.id} value={ch.id}>{ch.name}</option>
                                    ))}
                                </select>
                            </div>
                    </article>
                </section>
                <section className={campTab === 'players' ? 'is-active' : 'player-container'}>
                    <h2 className="players-title"><strong>Current Players</strong></h2>
                    <ul className="players-list">
                        {members.map((mem) => (
                            <li className="player-tile" key={mem.username}>
                                <span className="player-name">{mem.username}</span>
                                <span className={`player-role role-${mem.role}`}>{mem.role === 'dm' ? 'DM' : 'Player'}</span>
                                {/* players never see the DM's character status; the DM sees everything */}
                                {!(mem.role === 'dm' && campaign.role !== 'dm') && <span className="player-character">
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
                {isDm && (
                <section className={campTab === 'monsters' ? 'campaign-tile is-active' : 'monsters-container'}>
                    <article className="monsters-title">
                        <h2 className="monsters-title"><strong>Monsters</strong></h2>
                    </article>
                    <article className="monsters-list">
                        <select className='monsters-set' value={pickMonster} onChange={(e) => setPickMonster(e.target.value)}>
                            <option className='monsters-def-option' value="">Choose a monster…</option>
                                {(catalog.data || []).map((m) => <option className='monsters-option' key={m.id} value={m.id}>{m.name}</option>)}
                        </select>
                        <button type="button" className="action-button" onClick={addMonster} disabled={!pickMonster}>Add Monster</button>
                        <ul>
                            {(monsters.data || []).map((m) => (
                                <li className='monsters-item' key={m.id}>
                                    <Link className='monsters-link' to={`/monsters/${m.id}`}>{m.nickname || m.name}</Link> (HP {m.current_hp})
                                </li>
                            ))}
                        </ul>
                        {monsters.data?.length === 0 && <p>No monsters yet.</p>}
                    </article>
                </section>
                )}
            </main>
            <footer>
            </footer>
        </>
    );
}

export default CampaignPage;
