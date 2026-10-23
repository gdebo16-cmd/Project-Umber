import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { sendJson } from '../utils/api';
import usePageStyle from '../hooks/usePageStyle';
import joinCampaignCss from '../styles/joinCampaign.css?inline';


export default function JoinCampaign() {
    usePageStyle(joinCampaignCss);
    const { code } = useParams();
    const [error, setError] = useState('');
    const ran = useRef(false);
    const navigate = useNavigate();



    useEffect(() => {
        if (ran.current) return;
        ran.current = true;

        const join = async () => {
            try {
               const {id} = await sendJson('/api/campaigns/join', 'POST', { code });
                navigate(`/campaign/${id}`);
            } catch (err) {
                setError(err.message);
            }
        };
        join();
    }, [code]);

    return (
        <>
        <header id="site-title">
            <img src="/Logo.png" alt="Eldrid Tales Logo" className="title-logo" />
            <h1>Join Campaign</h1>
        </header>
        <main>
        <div>
        {error ? (
            <>
              <p>{error}</p>
              <Link to="/campaign_list">Back to Campaign List</Link>
            </>
        ) : (
            <p>Joining campaign...</p>
        )}
        </div>
        </main>
        <footer>
            <p className="footer-text">copyrite Eldrid Tales LLC</p>
        </footer>
        </>
    );
}