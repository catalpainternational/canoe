import { getAuthenticationToken } from '../AuthenticationUtilities.js';
import { BACKEND_BASE_URL } from '../urls.js';

const url = `${BACKEND_BASE_URL}/progress/completions`;

export function postAction(action) {
    return fetch(url, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(action),
    }).then(response => {
        return true;  
    }).catch(err => {
        return false;
    });
}

export function getActions() {
    return fetch(url, {
        method: 'GET',
        headers: getHeaders(),
    }).then(response => {
        return response.json();
    }).then(actions => {
        actions.forEach(action => {
            action.date = new Date(action.date);
        });
        return actions;
    });
}

function getHeaders() {
    const token = getAuthenticationToken();
    return {
        'Content-Type': 'application/json',
        'Authorization': `JWT ${token}`
    }
}
