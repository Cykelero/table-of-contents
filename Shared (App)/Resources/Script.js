function show(platform, enabled, useSettingsInsteadOfPreferences) {
    document.body.classList.add(`platform-${platform}`);

    if (useSettingsInsteadOfPreferences) {
        document.getElementsByClassName('platform-mac state-on')[0].innerText = "Table of contents is currently on. You can turn it off in the Extensions section of Safari Settings.\n\nTo show the list, click the toolbar button, or press ⌃G.";
        document.getElementsByClassName('platform-mac state-off')[0].innerText = "Table of contents is currently off. You can turn it on in the Extensions section of Safari Settings.\n\nOnce enabled, show the list using the toolbar button, or by pressing ⌃G.";
        document.getElementsByClassName('platform-mac state-unknown')[0].innerText = "You can turn on Table of contents in the Extensions section of Safari Settings.\n\nOnce enabled, show the list using the toolbar button, or by pressing ⌃G.";
        document.getElementsByClassName('platform-mac open-preferences')[0].innerText = "Quit and Open Safari Settings…";
    }

    if (typeof enabled === "boolean") {
        document.body.classList.toggle(`state-on`, enabled);
        document.body.classList.toggle(`state-off`, !enabled);
    } else {
        document.body.classList.remove(`state-on`);
        document.body.classList.remove(`state-off`);
    }
}

function openPreferences() {
    webkit.messageHandlers.controller.postMessage("open-preferences");
}

document.querySelector("button.open-preferences").addEventListener("click", openPreferences);
