window.config = {
    // DONT CHANGE THIS UNLESS YOU KNOW WHAT YOU ARE DOING 
    remoteBase: "https://raw.githubusercontent.com/Blutmonsterr/amp-cubecoders-app-catalog/main/", 
    // --------------------------------------
    
    // SETTINGS
    title: "CubeCoders App Catalog",
    placeholder: "Minecraft, Valve, mc ...",
    
    language: {
        enabled: true,
        default: 'de', // Options: 'de', 'en', 'nl', 'fr'
        disabled: []   // e.g. ['nl', 'fr']
    },
    features: {
        checkForUpdates: true, // Github new commits (github.com/blutmonsterr)
        gitUpdate: true, // (remotebase) apps.json, apps-g.json (fallback is local images (placeholder.wabp))
        GreelanApps: true, // (B: MAIN) - set to false to disable the Greelan-Apps section
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