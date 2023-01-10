const HEADING_TOP_OFFSET = 70; // don't completely align headings to the top of the viewport, in case there's a floating header that'd obscure them

// Functions
// // Communication
const knownMessages = {
	getHeadingData(request, sender, sendResponse) {
		sendResponse(getHeadingData());
	},
	revealHeading(request, sender, sendResponse) {
		const headingToReveal = getHeadings()[request.headingIndex];
		
		console.log(headingToReveal);

		headingToReveal.scrollIntoView({
			block: "start",
			inline: "nearest"
		});
		scrollBy(0, -HEADING_TOP_OFFSET);
	},
	startStreamingCurrentHeadingIndex(request, sender, sendResponse) {
		startStreamingCurrentHeadingIndex();
	}
}

function startStreamingCurrentHeadingIndex() {
	if (isStreamingCurrentHeadingIndex) return;
	isStreamingCurrentHeadingIndex = true;
	
	addEventListener("scroll", sendCurrentHeadingIndex);
	sendCurrentHeadingIndex();
}

function stopStreamingCurrentHeadingIndex() {
	if (!isStreamingCurrentHeadingIndex) return;
	isStreamingCurrentHeadingIndex = false;
	
	removeEventListener("scroll", sendCurrentHeadingIndex);
}

async function sendCurrentHeadingIndex() {
	// Send value
	const currentHeadingIndex = getHeadingData().currentHeadingIndex;
	
	const responsePromise = browser.runtime.sendMessage({
		action: "setCurrentHeadingIndex",
		value: currentHeadingIndex
	});
	
	// Decide whether to continue streaming
	const timeoutPromise = new Promise(resolve => {
		setTimeout(resolve, 300, {continueStreaming: false});
	});
	
	const response = await Promise.race([responsePromise, timeoutPromise]);
	
	const continueStreaming = response && response.continueStreaming;
	if (!continueStreaming) {
		stopStreamingCurrentHeadingIndex();
	}
}

// // Heading data
function getHeadings() {
	return (
		Array.from(document.querySelectorAll("h1, h2, h3, h4, h5, h6, h7, h8, h9, h10"))
		.filter(heading => heading.innerText.trim() !== "")
		.filter(heading => !heading.closest("aside, nav, .sidebar, #sidebar, footer, .footer, #footer"))
		.filter(heading => heading.offsetParent !== null) // rules out both invisible element, and “position: fixed” elements
		.filter(heading => {
			// Check that element is contained within page frame, and not minuscule
			const boundingRect = heading.getBoundingClientRect();
			const documentBoundingRect = {
				left: boundingRect.left + scrollX,
				top: boundingRect.top + scrollY,
				right: boundingRect.right + scrollX,
				bottom: boundingRect.bottom + scrollY,
				width: boundingRect.width,
				height: boundingRect.height
			};
			
			return (
				documentBoundingRect.right > 0
				&& documentBoundingRect.bottom > 0
				&& documentBoundingRect.width > 4
				&& documentBoundingRect.height > 4
			)
		})
	);
}

function getHeadingData() {
	const headings = getHeadings();
	
	const headingInfos = headings.map(heading => ({
		level: Number(heading.tagName.slice(1)),
		innerText: heading.innerText.trim()
	}));
	
	const currentHeading = headings.reduce((result, current, currentIndex) => {
		const resultY =
			result
			? result.getBoundingClientRect().y
			: Number.NEGATIVE_INFINITY;
		const currentY = current.getBoundingClientRect().y;
		
		const toleranceMargin = 10;
		if (currentY - HEADING_TOP_OFFSET - toleranceMargin > 0) {
			return result;
		}
		
		if (currentY > resultY) {
			return current;
		} else {
			return result;
		}
	}, headings[0] ?? null);
	
	const currentHeadingIndex = headings.indexOf(currentHeading);
	
	return {
		headingInfos,
		currentHeadingIndex
	};
}

// Initialize
let isStreamingCurrentHeadingIndex = false;

browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
	if (request.action) {
		knownMessages[request.action](request, sender, sendResponse);
	}
});
