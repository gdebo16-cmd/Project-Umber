import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import RequireLogin from './RequireLogin';
import CharacterSheet from './CharacterSheet';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import SettingsPage from './pages/SettingsPage';
import InventoryPage from './pages/InventoryPage';
import EditCharacterPage from './pages/EditCharacterPage';
import CreateStep1 from './pages/CreateStep1';
import CreateStep2 from './pages/CreateStep2';
import CreateStep3 from './pages/CreateStep3';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* anyone can see these */}
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                {/* these need you to be logged in */}
                <Route element={<RequireLogin />}>
                    <Route path="/home" element={<HomePage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                    <Route path="/create_char" element={<CreateStep1 />} />
                    <Route path="/create_char/step2" element={<CreateStep2 />} />
                    <Route path="/create_char/step3" element={<CreateStep3 />} />
                    <Route path="/characters/:id" element={<CharacterSheet />} />
                    <Route path="/characters/:id/inventory" element={<InventoryPage />} />
                    <Route path="/characters/:id/edit" element={<EditCharacterPage />} />
                </Route>

                {/* "*" means anything that didn't match above */}
                <Route path="*" element={<p>Page not found. <a href="/home">Go home</a></p>} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
