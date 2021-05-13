import { BACKEND_BASE_URL } from 'js/urls';

export const getDiscussionComments = async (discussionId) => {
    return fetch(`${BACKEND_BASE_URL}/discussion/discussion/${discussionId}/`, {
        mode: 'cors',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
        },
    })
    .then((response) => {
        if (!response.ok) return response.status;
        return response.json();
    })
}

const postRequest = async (url, body) => {
    return fetch(url, {
        method: 'POST',
        mode: 'cors',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    })
}

export const postComment = async (commentBody) => {
    return postRequest(`${BACKEND_BASE_URL}/discussion/posting/`, commentBody);
}

export const flagComment = async (commentBody) => {
    return postRequest(`${BACKEND_BASE_URL}/discussion/flag/`, commentBody)
}
