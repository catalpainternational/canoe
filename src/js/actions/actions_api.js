import Cookies from "js-cookie";
import { BACKEND_BASE_URL } from "js/urls";

const ACTIONS_ENDPOINT_URL = `${BACKEND_BASE_URL}/progress/actions`;

export function postAction(action) {
    return fetch(ACTIONS_ENDPOINT_URL, {
        method: "POST",
        credentials: 'include',
        headers: getHeaders(),
        body: JSON.stringify(action),
    })
        .then((response) => {
            return response.ok;
        })
        .catch((err) => {
            return false;
        });
}

export function getActions() {
    return fetch(ACTIONS_ENDPOINT_URL, {
        method: "GET",
        credentials: 'include',
        headers: getHeaders(),
    })
        .then((response) => {
            if (response.ok) {
                return response.json();
            } else {
                throw new Error(`HTTP error ${response.status} while fetching ${ACTIONS_ENDPOINT_URL}`);
            }
        })
        .then((actions) => {
            actions.forEach((action) => {
                action.date = action.date;
            });
            return actions;
        })
        .catch(err => {
            console.warn(err);
            return [];
        });
}

function getHeaders() {
    return {
        "Content-Type": "application/json",
        "X-CSRFToken": Cookies.get("csrftoken"),
    };
}
