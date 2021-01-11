import { getUserGroups, getUserId } from "@/AuthenticationUtilities";

const isGoogleAnalyticsAvailable = () => {
    return !!process.env.GA_TAG;
};

const getUserAndGroupDimensions = () => {
    const userId = getUserId();
    const groups = getUserGroups();
    return {
        dimension1: userId,
        dimension2: groups,
    };
};

export const setGoogleAnalyticsGlobalDimensions = () => {
    if (!isGoogleAnalyticsAvailable()) {
        return;
    }
};

export const logPageView = (pageUrl) => {
    if (!isGoogleAnalyticsAvailable()) {
        return;
    }

    gtag("config", process.env.GA_TAG, {
        page_location: `${pageUrl}`,
        page_path: `/${pageUrl}`,
        ...getUserAndGroupDimensions(),
    });
};

export const logNotificationReceived = (type) => {
    if (!isGoogleAnalyticsAvailable()) {
        return;
    }

    gtag("event", "Received", {
        event_category: "Notifications",
        event_label: `${type}`,
        ...getUserAndGroupDimensions(),
    });
};

export const logUnsubscribedFromNotifications = () => {
    if (!isGoogleAnalyticsAvailable()) {
        return;
    }

    gtag("event", "Unsubscribed", {
        event_category: "Notifications",
        ...getUserAndGroupDimensions(),
    });
};

export const logClickedPlayOnVideo = (videoUrl) => {
    if (!isGoogleAnalyticsAvailable()) {
        return;
    }

    gtag("event", "Clicked Play", {
        event_category: "Videos",
        event_label: videoUrl,
        ...getUserAndGroupDimensions(),
    });
};

export const logATestAnswer = (answerData) => {
    if (!isGoogleAnalyticsAvailable()) {
        return;
    }

    const { lesson, question, answer, isAnswerCorrect } = answerData;
    const printAnswerDataInThisOrder = ["lesson", "question", "answer", "isAnswerCorrect"];

    gtag("event", "Answered a test question", {
        event_category: "Tests",
        event_label: JSON.stringify(answerData, printAnswerDataInThisOrder),
        ...getUserAndGroupDimensions(),
        dimension3: lesson,
        dimension4: question,
        dimension5: answer,
        metric1: isAnswerCorrect,
    });
};

export const logLessonFeedback = (answerData) => {
    if (!isGoogleAnalyticsAvailable()) {
        return;
    }

    const { lesson } = answerData;
    const printAnswerDataInThisOrder = ["lesson", "feedback"];

    gtag("event", "Submitted lesson feedback", {
        event_category: "Lesson Feedback",
        event_label: JSON.stringify(answerData, printAnswerDataInThisOrder),
        ...getUserAndGroupDimensions(),
        dimension3: lesson,
    });
};
