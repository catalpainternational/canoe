import { BACKEND_BASE_URL } from 'js/urls';
import { getAuthenticationToken } from "js/AuthenticationUtilities";

export const getDiscussionComments = async (discussionId) => {
    const token = getAuthenticationToken();
    return fetch(`${BACKEND_BASE_URL}/discussion/discussion/${discussionId}/`, {
        mode: 'cors',
        headers: {
            Authorization: `JWT ${token}`,
            'Content-Type': 'application/json',
        },
    })
}

const postRequest = async (url, body) => {
    const token = getAuthenticationToken();

    return fetch(url, {
        method: 'POST',
        mode: 'cors',
        headers: {
            Authorization: `JWT ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    })
}

export const postComment = async (commentBody) => {
    return postRequest(`${BACKEND_BASE_URL}/discussion/posting/${commentBody.id}/`, commentBody);
}

export const flagComment = async (commentBody) => {
    return postRequest(`${BACKEND_BASE_URL}/discussion/flag/${commentBody.id}/`, commentBody)
}
