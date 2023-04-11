const HEADING_TOP_OFFSET = 70; // don't completely align headings to the top of the viewport, in case there's a floating header that'd obscure them

// Functions
// // Communication
const knownMessages = {
	getHeadingData(request, sender, sendResponse) {
		sendResponse(getHeadingData());
	},
	revealHeading(request, sender, sendResponse) {
		brieflyForceAutoScrollingBehavior();
		
		const headingToReveal = getHeadings()[request.headingIndex];
		const headingToRevealRect = headingToReveal.getBoundingClientRect();
		scrollBy(0, headingToRevealRect.top - HEADING_TOP_OFFSET);
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
	
	const responsePromise =
		browser.runtime.sendMessage({
			action: "setCurrentHeadingIndex",
			value: currentHeadingIndex
		})
		.catch(() => ({continueStreaming: false}));
	
	// Decide whether to continue streaming
	// Safari: promise never resolves
	// Firefox: promise is rejected
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
		.filter(heading => !heading.closest(":not(body):is(aside, nav, .table-of-contents, .sidebar, #sidebar, footer, .footer, #footer)"))
		.filter(heading => {
			// Exclude invisible elements, and position: fixed elements
			let currentElement = heading.offsetParent;
			
			while (currentElement !== document.body) {
				if (!currentElement) {
					return false;
				}
				
				currentElement = currentElement.offsetParent;
			}
			
			return true;
		})
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
	
	const headingInfos = headings.map(heading => {
		const isEditableWikipediaHeading = heading.querySelector(".mw-headline") && heading.querySelector(".mw-editsection");
		
		return {
			level: Number(heading.tagName.slice(1)),
			innerText: isEditableWikipediaHeading ? heading.querySelector(".mw-headline").innerText.trim() : heading.innerText.trim()
		};
	});
	
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

// // Other
function brieflyForceAutoScrollingBehavior() {
	// Doing this has a performance cost (probably causes a repaint), so debounce the reversal
	
	// If first call: record first value, disable smooth scrolling
	if (revertScrollingBehaviorTimeout === null) {
		initialHTMLScrollBehavior = document.documentElement.style.scrollBehavior;
		document.documentElement.style.scrollBehavior = "auto";
	}
	
	// Clear reversal timeout if any
	if (revertScrollingBehaviorTimeout !== null) {
		clearTimeout(revertScrollingBehaviorTimeout);
		revertScrollingBehaviorTimeout = null;
	}
	
	// Set reversal timeout
	revertScrollingBehaviorTimeout = setTimeout(() => {
		document.documentElement.style.scrollBehavior = initialHTMLScrollBehavior;
		revertScrollingBehaviorTimeout = null;
		initialHTMLScrollBehavior = null;
	}, 100);
}

// Initialize
let isStreamingCurrentHeadingIndex = false;
let initialHTMLScrollBehavior = null;
let revertScrollingBehaviorTimeout = null;

browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
	if (request.action) {
		knownMessages[request.action](request, sender, sendResponse);
	}
});
