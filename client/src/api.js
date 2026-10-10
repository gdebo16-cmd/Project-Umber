// Send JSON to the server and get JSON back.
// If the server says no (400, 401, 404, 500...), this throws an Error with the server's message.
export async function sendJson(url, method = 'POST', body) {
    const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `HTTP error! status: ${res.status}`);
    return data;
}
