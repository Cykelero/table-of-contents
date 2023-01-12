// Functions
// // Communication
const knownMessages = {
	setCurrentHeadingIndex(request, sender, sendResponse) {
		// If user didn't choose a heading just now, update selection
		if (new Date().getTime() > lastSelectionChangeTime + 500) {
			selectHeadingAtIndex(request.value);
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

function startStreamingCurrentHeadingIndex() {
	sendMessageToCurrentTab({action: "startStreamingCurrentHeadingIndex"});
}

async function sendMessageToCurrentTab(request) {
	const currentTab = await browser.tabs.getCurrent();
	return await browser.tabs.sendMessage(currentTab.id, request);
}

// // Render
async function refreshHeadingList() {
	const headingData = await sendMessageToCurrentTab({ action: "getHeadingData" });
	const headingInfos = headingData.headingInfos;
	const hasEnoughHeadings = headingInfos.length > 1;
	
	// Render
	document.body.innerHTML = "";
	
	if (hasEnoughHeadings) {
		// Create <select>
		const selectElement = document.createElement("select");
		document.body.appendChild(selectElement);
		selectElement.focus();
		
		selectElement.size = headingInfos.length;
		selectElement.addEventListener("change", userDidChangeHeadingSelection);
		
		// Add heading <option> elements
		let levelMappings = [];
		for (let headingIndex = 0; headingIndex < headingInfos.length; headingIndex++) {
			let headingInfo = headingInfos[headingIndex];
			
			const optionElement = document.createElement("option");
			selectElement.appendChild(optionElement);
			
			optionElement.dataset.headingIndex = headingIndex;
			
			// Remap levels to avoid level gaps
			// E.g. if a h1 directly contains a h4, then the h4 becomes a h2
			// // Pop mappings that are to deep
			let activeLevelMapping = levelMappings[levelMappings.length - 1];
			while (activeLevelMapping && activeLevelMapping.actual > headingInfo.level) {
				levelMappings.pop();
				activeLevelMapping = levelMappings[levelMappings.length - 1]
			}
			
			// // Add mapping if necessary
			if (!activeLevelMapping) {
				// No mapping? Map to top-level
				levelMappings.push({
					actual: headingInfo.level,
					mapped: 1
				});
			} else if (activeLevelMapping.actual < headingInfo.level) {
				// Parent mapping? Nest
				levelMappings.push({
					actual: headingInfo.level,
					mapped: activeLevelMapping.mapped + 1
				});
			}
			
			const currentLevelMapping = levelMappings[levelMappings.length - 1];
			
			// Set text
			const levelIndentation = "    ".repeat(currentLevelMapping.mapped - 1);
			const formattedHeadingText = levelIndentation + headingInfo.innerText;
			optionElement.innerText = formattedHeadingText;
		}
		
		// Select current heading
		selectHeadingAtIndex(headingData.currentHeadingIndex);
	} else {
		let messageContainerElement = document.createElement("div");
		document.body.appendChild(messageContainerElement);
		
		messageContainerElement.className = "messageContainer";
		messageContainerElement.innerText = "No heading in document";
	}
}

function selectHeadingAtIndex(headingIndex) {
	document.querySelector("select").selectedIndex = headingIndex;
	revealHeadingAtIndex(headingIndex);
}

function revealHeadingAtIndex(headingIndex) {
	const verticalPadding = 10;
	
	const selectElement = document.querySelector("select");
	if (!selectElement) return;
	
	const selectedOption = selectElement.options[headingIndex];
	const selectedOptionRect = selectedOption.getBoundingClientRect();
	const viewportHeight = document.documentElement.clientHeight;
	
	if (selectedOptionRect.top < verticalPadding) {
		scrollBy(0, selectedOptionRect.top - verticalPadding);
	} else if (selectedOptionRect.bottom > viewportHeight - verticalPadding) {
		scrollBy(0, selectedOptionRect.bottom - viewportHeight + verticalPadding);
	}
}

function userDidChangeHeadingSelection() {
	const selectElement = document.querySelector("select");
	if (!selectElement) return;
	
	const selectedOption = selectElement.selectedOptions[0];
	
	if (selectedOption) {
		lastSelectionChangeTime = new Date().getTime();
		
		// Reveal heading in popup
		revealHeadingAtIndex(selectElement.selectedIndex);
		
		// Reveal heading in page
		const selectedHeadingIndex = selectedOption.dataset.headingIndex;
		sendMessageToCurrentTab({
			action: "revealHeading",
			headingIndex: selectedHeadingIndex
		});
	}
}

// Initialize
let lastSelectionChangeTime = 0;

browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
	if (request.action) {
		knownMessages[request.action](request, sender, sendResponse);
	}
});
addEventListener("visibilitychange", function() {
	if (document.visibilityState !== "visible") return;
	
	refreshHeadingList();
	startStreamingCurrentHeadingIndex();
});

if (document.visibilityState === "visible") {
	refreshHeadingList();
	startStreamingCurrentHeadingIndex();
}

addEventListener("keydown", function(event) {
	const UP_ARROW = 38;
	const DOWN_ARROW = 40;
	
	const selectElement = document.querySelector("select");
	if (!selectElement) return;
	
	if (event.keyCode === UP_ARROW && event.altKey) {
		selectElement.selectedIndex = 0;
		userDidChangeHeadingSelection();
	} else if (event.keyCode === DOWN_ARROW && event.altKey) {
		selectElement.selectedIndex = selectElement.options.length - 1;
		userDidChangeHeadingSelection();
	}
});

addEventListener("mousemove", function(event) {
	if (event.buttons > 0) {
		userDidChangeHeadingSelection();
	}
});
