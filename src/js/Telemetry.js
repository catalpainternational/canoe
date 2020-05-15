import {
    initializeGoogleAnalytics,
    logPageView,
    logNotificationReceived,
    logClickedPlayOnVideo,
    logATestAnswer,
    setGoogleAnalyticsGlobalDimensions
} from 'js/GoogleAnalytics';
import { ON_PLAY_VIDEO, ON_ANSWERED_TEST_QUESTION } from 'js/Events';

export default {
    onMounted() {
        setGoogleAnalyticsGlobalDimensions();

        window.addEventListener('hashchange', () => {
            logPageView(window.location.hash);
        });

        navigator.serviceWorker.addEventListener('message', (event) => {
            const type = event.data;
            logNotificationReceived(type);
        });

        window.addEventListener(ON_PLAY_VIDEO, (event) => {
            const videoTitle = event.detail;
            logClickedPlayOnVideo(videoTitle);
        });

        window.addEventListener(ON_ANSWERED_TEST_QUESTION, (event) => {
            logATestAnswer(event.detail);
        });
    }
}