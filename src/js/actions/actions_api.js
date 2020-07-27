import { getAuthenticationToken } from "../AuthenticationUtilities.js";
import { BACKEND_BASE_URL } from "../urls.js";

const getActionsURL = `${BACKEND_BASE_URL}/progress/actions`;
const postActionsURL = `${BACKEND_BASE_URL}/progress/post_actions`;

export function postAction(action) {
    return fetch(postActionsURL, {
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
    return fetch(getActionsURL, {
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
