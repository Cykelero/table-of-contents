async function refreshHeadingList() {
	const headingInfos = await sendMessageToCurrentTab({ action: "getHeadingInfos" });
	const hasHeadings = headingInfos.length > 0;
	
	// Render
	body.innerHTML = "";
	
	const selectElement = document.createElement("select");
	body.appendChild(selectElement);
	
	selectElement.size = Math.min(22, hasHeadings ? headingInfos.length : Number.POSITIVE_INFINITY);
	selectElement.addEventListener("change", () => {
		const selectedOption = selectElement.selectedOptions[0];
		
		if (selectedOption) {
			const selectedHeadingIndex = selectedOption.dataset.headingIndex;
			sendMessageToCurrentTab({ action: "revealHeading", headingIndex: selectedHeadingIndex });
		}
	});
	
	if (hasHeadings) {
		// List headings
		for (let headingIndex = 0; headingIndex < headingInfos.length; headingIndex++) {
			let headingInfo = headingInfos[headingIndex];
			
			const optionElement = document.createElement("option");
			selectElement.appendChild(optionElement);
			
			optionElement.dataset.headingIndex = headingIndex;
			const indentedHeadingText = "   ".repeat(headingInfo.level - 1) + headingInfo.innerText;
			optionElement.innerText = indentedHeadingText;
		}
	} else {
		// Show empty state
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
