import {Link, useParams} from 'react-router';
import { useState } from 'react';
import { sendJson } from '../utils/api';
import useFetch from '../hooks/useFetch';
import usePageStyle from '../hooks/usePageStyle';
import homeCss from '../styles/home.css?inline';
import Loader from '../components/Loader';
import SiteNav from '../components/SiteNav';


function CampaignPage() {
    usePageStyle(homeCss);
    const {campId} = useParams();
    const {data, setData, loading, error} = useFetch(`/api/campaigns/${campId}`);
    const home = useFetch('/api/home');
    const [picked, setPicked] = useState(null);


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

    

    return (
        <>
            <header id="site-title">
                <img src="/Logo.png" alt="Eldrid Tales Logo" className="title-logo" />
                <h1>Campaign</h1>
            </header>
            <SiteNav />
            <main>
                <section id="campaign-info">
                    <h2 className="title-text"> <em>Campaign:</em> <br />{campaign.name}</h2>
                    {campaign.campaign_img_url
                        ? <img className="campaign-image" src={campaign.campaign_img_url} alt={`${campaign.name} picture`} />
                        : <div className="campaign-image" role="img" aria-label={`${campaign.name} picture`} />}
                    <p className="campaign-description"> <em>Description:</em> <br /> {campaign.description}</p>
                    <select className="field" value={selectedId} onChange={chooseCharacter}>
                        <option value="" disabled>Choose a character</option>
                        {characters.map((ch) => (
                            <option key={ch.id} value={ch.id}>{ch.name}</option>
                        ))}
                    </select>
                    <ul className="campaign-members">
                        {members.map((mem) => (
                            <li key={mem.username}>
                                {mem.username} ({mem.role}){' '}
                                {mem.character_name
                                    ? (campaign.role === 'dm'
                                        ? <Link to={`/characters/${mem.character_id}`}>as {mem.character_name}</Link>
                                        : `as ${mem.character_name}`)
                                    : 'has not picked a character'}
                            </li>
                        ))}
                    </ul>
                    {campaign.role === 'dm' && <p className="campaign-invite">Invite code: {campaign.invite_code}</p>}
                </section>
            </main>
            <footer>
                <Link id="home-link" to="/home">Home</Link>
            </footer>
        </>
    );
}

export default CampaignPage;
