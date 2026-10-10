import { Link, useParams, useNavigate } from 'react-router';
import usePageStyle from '../usePageStyle';
import sheetCss from '../charSheet.css?inline';
import ItemShop from '../ItemShop';

// Replaces views/inventory.ejs. The list itself lives in ItemShop,
// which the character sheet's Inventory tab also uses.
function InventoryPage() {
    usePageStyle(sheetCss, 'subpage');
    const { id } = useParams();
    const navigate = useNavigate();

    return (
        <>
            <header>
                <h1 id="inventoryTitle">Inventory</h1>
                <p id="inventoryLink"><Link to={`/characters/${id}`}>Back to character sheet</Link></p>
            </header>
            <main className="subpage-main">
                <ItemShop characterId={id} onDone={() => navigate(`/characters/${id}`)} />
            </main>
        </>
    );
}

export default InventoryPage;