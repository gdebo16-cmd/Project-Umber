import { useState } from 'react';
import { sendJson } from '../../utils/api';

// Shared by the editor forms: POST the form, hand the saved character to onSaved,
// and keep a short message ("Saved" or the server's error) to show under the form.
function useSave(url, onSaved) {
    const [message, setMessage] = useState('');

    const save = async (body) => {
        try {
            const data = await sendJson(url, 'POST', body);
            onSaved(data.character);
            setMessage('Saved');
        } catch (err) {
            setMessage(err.message);
        }
    };

    return { save, message };
}

export default useSave;
