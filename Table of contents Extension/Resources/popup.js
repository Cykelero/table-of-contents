async function refreshHeadingList() {
	const headingInfos = await sendMessageToCurrentTab({ action: "getHeadingInfos" });
	const hasEnoughHeadings = headingInfos.length > 1;
	
	// Render
	body.innerHTML = "";
	
	const selectElement = document.createElement("select");
	body.appendChild(selectElement);
	
	selectElement.size = Math.min(22, headingInfos.length);
	selectElement.addEventListener("change", () => {
		const selectedOption = selectElement.selectedOptions[0];
		
		if (selectedOption) {
			const selectedHeadingIndex = selectedOption.dataset.headingIndex;
			sendMessageToCurrentTab({ action: "revealHeading", headingIndex: selectedHeadingIndex });
		}
	});
	
	if (hasEnoughHeadings) {
		// List headings
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
	} else {
		// Show empty state
		selectElement.size = 5;
		selectElement.style.pointerEvents = "none";
		
		// // Pad for vertical alignement
		const topPaddingAmount = Math.ceil(selectElement.size / 2) - 1;
		for (let i = 0; i < topPaddingAmount; i++) {
			selectElement.appendChild(document.createElement("option"));
		}
		
		// // Add message option
		const optionElement = document.createElement("option");
		selectElement.appendChild(optionElement);
		
		optionElement.innerText = "No heading in document";
		optionElement.style.textAlign = "center";
	}
}

async function sendMessageToCurrentTab(request) {
	const currentTab = await browser.tabs.getCurrent();
	return await browser.tabs.sendMessage(currentTab.id, request);
}

// Initialize
const body = document.body;

addEventListener("visibilitychange", function() {
	if (document.visibilityState !== "visible") return;
	
	refreshHeadingList();
});

if (document.visibilityState === "visible") {
	refreshHeadingList();
}
