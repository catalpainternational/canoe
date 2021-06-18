import { v4 as uuidv4 } from "uuid";
import Cookies from "js-cookie";

import { BACKEND_BASE_URL, CSRF_COOKIE_NAME } from "js/urls";

const DISCUSSION_BASE_URL = `${BACKEND_BASE_URL}/discussion`;

export class Discussion {
    static CreateComment(
        commentBody: string,
        parentId = "",
        pageId = "",
        discussionId = ""
    ): Record<string, any> {
        const comment: Record<string, any> = {
            page_id: pageId,
            discussion_id: discussionId,
            date_created: new Date().toISOString().replace("Z", "+00:00"),
            comment: commentBody,
            id: uuidv4(),
        };
        if (parentId) {
            comment["parent_id"] = parentId;
        }

        return comment;
    }

    static CreateFlag(
        postingId: string,
        flagInappropriate: boolean
    ): Record<string, any> {
        return {
            posting_id: postingId,
            date_created: new Date().toISOString().replace("Z", "+00:00"),
            flag_inappropriate: flagInappropriate,
            id: uuidv4(),
        };
    }

    static async Get(
        discussionId: string
    ): Promise<Array<Record<string, any>> | number> {
        const url = `${DISCUSSION_BASE_URL}/discussion/${discussionId}/`;
        const init = {
            method: "GET",
            mode: "cors",
            credentials: "include",
            headers: {
                "content-type": "application/json",
            },
        } as RequestInit;

        // Should also add network error handling here
        const discussionResponse = await fetch(url, init);

        if (!discussionResponse.ok) {
            return discussionResponse.status;
        }

        const discussion: Array<Record<string, any>> =
            await discussionResponse.json();

        // Ensure that we have initials for every user's comments and replies
        return discussion.map((posting: Record<string, any>) => {
            const noNames = !posting.user_first_name && !posting.user_last_name;
            const firstname = posting.user_first_name || posting.user_username;
            const lastname = posting.user_last_name || posting.user_username;
            const initials = noNames
                ? ("00" + posting.user_username).slice(-2)
                : `${firstname[0]}${lastname[0]}`;

            return {
                ...posting,
                initials,
                date: new Date(posting.date_created),
            };
        });
    }

    /** Reconstitute discussion hierarchies from the flat list of discussion postings */
    static Rebuild(
        discussion: Array<Record<string, any>>,
        parentId = null
    ): Array<Record<string, any>> {
        const postingRoots = discussion.filter(
            (posting) => (posting as any).parent_id === parentId
        );
        if (postingRoots.length === 0) {
            return postingRoots;
        }
        return postingRoots.map((posting) => {
            const postingWithReplies = {
                ...posting,
                replies: this.Rebuild(discussion, posting.id),
            };
            return postingWithReplies;
        });
    }

    static PostRequest = async (
        url: string,
        body: Record<string, any>
    ): Promise<Response> => {
        const init = {
            method: "POST",
            mode: "cors",
            credentials: "include",
            headers: {
                "content-type": "application/json",
                "X-CSRFToken": Cookies.get(CSRF_COOKIE_NAME),
            },
            body: JSON.stringify(body),
        } as RequestInit;

        return fetch(url, init);
    };

    static PostComment = async (
        commentBody: Record<string, any>
    ): Promise<Response> => {
        return Discussion.PostRequest(
            `${DISCUSSION_BASE_URL}/posting/`,
            commentBody
        );
    };

    static FlagComment = async (
        flagBody: Record<string, any>
    ): Promise<Response> => {
        return Discussion.PostRequest(`${DISCUSSION_BASE_URL}/flag/`, flagBody);
    };
}
