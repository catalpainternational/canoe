import { BACKEND_BASE_URL } from 'js/urls';
import { getAuthenticationToken } from "js/AuthenticationUtilities";

export const postComment = async (commentBody) => {
    const token = getAuthenticationToken();
    return fetch(`${BACKEND_BASE_URL}/discussion/posting/${commentBody.id}/`, {
        method: 'POST',
        mode: 'cors',
        headers: {
            Authorization: `JWT ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(commentBody),
    })
}

export const getDiscussionComments = async (discussionId) => {
    const token = getAuthenticationToken();
    return fetch(`${BACKEND_BASE_URL}/discussion/discussion/${discussionId}/`, {
        mode: 'cors',
        headers: {
            Authorization: `JWT ${token}`,
            'Content-Type': 'application/json',
        },
    })
    .then((response) => {
        if (!response.ok) throw new Error(`Comment failed, HTTP status: ${response.status}`);
        return response.json();
    })
}

export const flagComment = async (commentBody) => {
    const token = getAuthenticationToken();
    return fetch(`${BACKEND_BASE_URL}/discussion/flag/${commentBody.id}/`, {
        method: 'POST',
        mode: 'cors',
        headers: {
            Authorization: `JWT ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(commentBody),
    })
}
