const knownMessages = {
	getHeadingInfos(request, sender, sendResponse) {
		sendResponse(getHeadingInfos());
	},
	revealHeading(request, sender, sendResponse) {
		const headingToReveal = getHeadings()[request.headingIndex];
		
		console.log(headingToReveal);

		headingToReveal.scrollIntoView({
			block: "start",
			inline: "nearest"
		});
		scrollBy(0, -70); // in case element is covered by floating header
	}
}

function getHeadings() {
	return (
		Array.from(document.querySelectorAll("h1, h2, h3, h4, h5, h6, h7, h8, h9, h10"))
		.filter(heading => heading.innerText.trim() !== "")
		.filter(heading => !heading.closest("aside, .sidebar, nav"))
	);
}

function getHeadingInfos() {
	return getHeadings().map(heading => ({
		level: Number(heading.tagName.slice(1)),
		innerText: heading.innerText.trim()
	}));
}

// Initialize
browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
	if (request.action) {
		knownMessages[request.action](request, sender, sendResponse);
	}
});
