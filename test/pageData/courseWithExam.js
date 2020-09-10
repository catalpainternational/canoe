export default {
    id: 226,
    meta: {
        type: "elearning_content.CoursePage",
        detail_url: "https://asteroid.tl/api/v2/pages/226/",
        html_url: "https://asteroid.tl/#226",
        slug: "haroman-app-launch-module",
        show_in_menus: false,
        seo_title: "",
        search_description: "",
        first_published_at: "2020-07-16T06:19:11.777342Z",
        parent: {
            id: 3,
            meta: {
                type: "elearning_content.HomePage",
                detail_url: "https://asteroid.tl/api/v2/pages/3/",
                html_url: "https://asteroid.tl/site/olgeta",
            },
            title: "Haroman",
        },
    },
    title: "Haroman App Launch Module",
    data: {
        id: 226,
        slug: "haroman-app-launch-module",
        title: "Haroman App Launch Module",
        lessons_count: 3,
        has_exam: true,
        translations: {
            tet: 227,
        },
    },
    lessons: [
        {
            id: 228,
            title: "1. All About COVID-19",
            slug: "all-about-covid-19",
            description: "This module will give you an overview of COVID-19",
            long_description: "",
            duration: 15,
            coming_soon: false,
            translations: {
                tet: 229,
            },
        },
        {
            id: 230,
            title: "2. Protecting Timor-Leste from COVID-19",
            slug: "protecting-timor-leste-from-covid-19",
            description:
                "In this module you will learn how, together, we can keep the healthcare system strong throughout the COVID-19 pandemic",
            long_description: "",
            duration: 15,
            coming_soon: false,
            translations: {
                tet: 231,
            },
        },
    ],
    tags: [],
    exam: [
        {
            type: "single_choice",
            value: {
                question: "What kind of virus is COVID19?",
                answers: [
                    {
                        text: "Respiratory",
                        correct: true,
                    },
                    {
                        text: "Gastrointestinal",
                        correct: false,
                    },
                    {
                        text: "Neurologic",
                        correct: false,
                    },
                ],
            },
            id: "2c0d37df-213d-4fa9-a304-a82e661a6fad",
        },
        {
            type: "multiple_choice",
            value: {
                question: "Choose all the ways you can prevent spreading COVID19",
                answers: [
                    {
                        text: "Wash your hands regularly",
                        correct: true,
                    },
                    {
                        text: "Wear personal protective equipment",
                        correct: true,
                    },
                    {
                        text: "Keep a distance of at least 1.5 meters from those around you",
                        correct: false,
                    },
                    {
                        text: "Shake hands or greet people with a hug and a kiss on the cheek",
                        correct: false,
                    },
                ],
            },
            id: "71fa44a1-e20c-49de-bf95-cffc140f3cca",
        },
    ],
    is_visible_to_guests: true,
};
