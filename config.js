window.config = {
    title: "CubeCoders App Catalog",
    placeholder: "Minecraft, Valve, ...",
    language: {
        enabled: true,
        default: 'en', // Options: 'de', 'en', 'nl', 'fr'
        disabled: []   // e.g. ['nl', 'fr']
    },
    features: {
        customApps: true,
        themeSwitcher: true,
        filterButtons: true,
        defaultTheme: 'dark', // 'dark' or 'light'
        backButton: {
            enabled: true,
            url: "ADRESS",
            text: "" // Leave empty to use translation
        },
        extraLink: {
            enabled: true,
            url: "https://amp.domain.com/",
            text: "AMP - Login"
        },
        searchHelp: {
            enabled: true,
            items: [
                "f:new",
                "f:beta",
                "f:crossplay"
            ]
        }
    }
}