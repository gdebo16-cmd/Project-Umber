import {Link, useParams} from 'react-router';
import useFetch from '../hooks/useFetch';
import usePageStyle from '../hooks/usePageStyle';
import homeCss from '../styles/home.css?inline';
import Loader from '../components/Loader';
import SiteNav from '../components/SiteNav';


function CampaignPage() {
    usePageStyle(homeCss);
    const {campId} = useParams();
    const {data, loading, error} = useFetch(`/api/campaigns/${campId}`);

    if (error) return <p>Failure is upon us: {error}</p>;
    if (loading) return <Loader text='Summoning your stories...'/>;

    const {campaign} = data;

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
                    <p className="campaign-description"> <em>Description:</em> <br /> {campaign.description}</p>
                </section>
            </main>
            <footer>
                <Link id="home-link" to="/home">Home</Link>
            </footer>
        </>
    );
}

export default CampaignPage;
