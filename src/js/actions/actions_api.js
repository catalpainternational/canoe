import { getAuthenticationToken } from "../AuthenticationUtilities.js";
import { BACKEND_BASE_URL } from "../urls.js";

const ACTIONS_ENDPOINT_URL = `${BACKEND_BASE_URL}/progress/actions`;

export function postAction(action) {
    return fetch(ACTIONS_ENDPOINT_URL, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(action),
    })
        .then((response) => {
            return true;
        })
        .catch((err) => {
            return false;
        });
}

export function getActions() {
    return fetch(ACTIONS_ENDPOINT_URL, {
        method: "GET",
        headers: getHeaders(),
    })
        .then((response) => {
            return response.json();
        })
        .then((actions) => {
            actions.forEach((action) => {
                action.date = new Date(action.date);
            });
            console.log(actions);
            return actions;
        });
}

function getHeaders() {
    const token = getAuthenticationToken();
    return {
        "Content-Type": "application/json",
        Authorization: `JWT ${token}`,
    };
}
