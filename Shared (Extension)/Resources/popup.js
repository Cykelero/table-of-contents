import HeadingListRenderer from "./HeadingListRenderer.js"

// Functions
// // Communication
const knownMessages = {
	setCurrentHeadingIndex(request, sender, sendResponse) {
		// If user didn't choose a heading just now, update selection
		if (new Date().getTime() > lastSelectionChangeTime + 500) {
			headingListRenderer.selectHeadingAtIndex(request.value);
		}
		
		// Acknowledge
		sendResponse({continueStreaming: true});
	},
	tabDidLoad: async function(request, sender, sendResponse) {
		if (sender.tab === await browser.tabs.getCurrent()) {
			refreshHeadingList();
		}
	}
}

async function injectContentScript() {
	// Does nothing if the script has already been injected into this page
	return await browser.scripting.executeScript({
		files: ["/content.js"],
		target: {
			tabId: (await getActiveTab()).id,
		},
		injectImmediately: true
	});
}

function startStreamingCurrentHeadingIndex() {
	sendMessageToActiveTab({action: "startStreamingCurrentHeadingIndex"});
}

async function getActiveTab() {
	const queryResults = await browser.tabs.query({ currentWindow: true, active: true });
	return queryResults[0];
}

async function sendMessageToActiveTab(request) {
	return await browser.tabs.sendMessage((await getActiveTab()).id, request);
}

// // Render
async function refreshHeadingList() {
	const headingData = await sendMessageToActiveTab({ action: "getHeadingData" });
	
	headingListRenderer.render(headingData);
}

// Initialize
let lastSelectionChangeTime = 0;

const headingListRenderer = new HeadingListRenderer(document.body, {
	userDidSelectHeading: selectedHeadingIndex => {
		lastSelectionChangeTime = new Date().getTime();
		
		sendMessageToActiveTab({
			action: "revealHeading",
			headingIndex: selectedHeadingIndex
		});
	}
});

browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
	if (request.action) {
		knownMessages[request.action](request, sender, sendResponse);
	}
});

document.body.innerHTML = "";

(async function() {
	await injectContentScript();
	
	refreshHeadingList();
	startStreamingCurrentHeadingIndex();
})();
