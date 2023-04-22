export default class HeadingListRenderer {
	constructor(parentElement, callbacks) {
		this.parentElement = parentElement;
		this.callbacks = callbacks;
		
		this.headingData = null;
		
		this.rootElements = [];
		this.scrollingWrapperElement = null;
		this.ulElement = null;
		this.selectionRowElement = null;
		this.selectionRowEffectElement = null;
		
		this.boundOnKeyDown = this.onKeyDown.bind(this);
	}
	
	get selectionRowRect() {
		return this.selectionRowElement.getBoundingClientRect();
	}
	
	get selectedHeadingIndex() {
		const targetSelectionY = this.selectionRowRect.top + this.selectionRowRect.height / 2;
		
		// Find element closest to selection row
		let closestLiElement = null;
		
		for (let candidateLiElement of this.ulElement.childNodes) {
			if (!closestLiElement) {
				closestLiElement = candidateLiElement;
				continue;
			}
			
			const candidateBoundingRect = candidateLiElement.getBoundingClientRect();
			const closestBoundingRect = closestLiElement.getBoundingClientRect();
			
			const candidateDistance = Math.abs(candidateBoundingRect.top + candidateBoundingRect.height / 2 - targetSelectionY);
			const closestDistance = Math.abs(closestBoundingRect.top + closestBoundingRect.height / 2 - targetSelectionY);
			
			if (candidateDistance < closestDistance) {
				closestLiElement = candidateLiElement;
			}
		}
		
		return Number(closestLiElement.dataset.headingIndex);
	}
	
	render(headingData) {
		this.headingData = headingData;
		
		const headingInfos = headingData.headingInfos;
		
		// Reset
		for (let rootElement of this.rootElements) {
			rootElement.parentNode.removeChild(rootElement);
		}
		this.rootElements = [];
		
		this.scrollingWrapperElement = null;
		this.ulElement = null;
		this.selectionRowElement = null;
		
		removeEventListener("keydown", this.boundOnKeyDown);
		
		// Too few headings?
		if (headingInfos.length <= 1) {
			let messageContainerElement = document.createElement("div");
			this.parentElement.appendChild(messageContainerElement);
			this.rootElements.push(messageContainerElement);
			
			messageContainerElement.className = "messageContainer";
			messageContainerElement.innerText = "No heading in document";
			
			return;
		}
		
		// Create scrolling wrapper
		this.scrollingWrapperElement = document.createElement("div");
		this.parentElement.appendChild(this.scrollingWrapperElement);
		this.rootElements.push(this.scrollingWrapperElement);
		
		this.scrollingWrapperElement.className = "scrollingWrapper";
		
		// Create selection row and effect
		this.selectionRowElement = document.createElement("div");
		this.parentElement.appendChild(this.selectionRowElement);
		this.rootElements.push(this.selectionRowElement);
		
		this.selectionRowElement.className = "selectionRow";
		
		this.selectionRowEffectElement = document.createElement("div");
		this.parentElement.appendChild(this.selectionRowEffectElement);
		this.rootElements.push(this.selectionRowEffectElement);
		
		this.selectionRowEffectElement.className = "selectionRowEffect";
		
		// // Fix backdrop filter rendering glitch
		document.addEventListener("visibilitychange", () => {
			this.selectionRowEffectElement.style["-webkit-backdrop-filter"] = "none";
			setTimeout(() => {
				// Fixes a rendering glitch
				this.selectionRowEffectElement.style["-webkit-backdrop-filter"] = "";
				this.selectionRowEffectElement.style.backgroundColor = this.selectionRowEffectElement.getComputedStyle().backgroundColor;
			}, 200);
		});
		
		// Create <ul>
		this.ulElement = document.createElement("ul");
		this.scrollingWrapperElement.appendChild(this.ulElement);
		
		// Add heading <li> elements
		for (let [headingIndex, headingInfo] of Object.entries(headingInfos)) {
			const liElement = document.createElement("li");
			this.ulElement.appendChild(liElement);
			
			liElement.dataset.headingIndex = headingIndex;
			
			// Set text
			const levelIndentation = "    ".repeat(headingInfo.mappedLevel - 1);
			const formattedHeadingText = levelIndentation + headingInfo.innerText;
			liElement.innerText = formattedHeadingText;
			
			// Listen to taps
			liElement.onclick = () => {
				this.callbacks.userDidSelectHeading(headingIndex);
				this.selectHeadingAtIndex(headingIndex);
			}
		}
		
		// Listen to keyboard events
		window.focus(); // doesn't work (as of iOS 16.4)
		addEventListener("keydown", this.boundOnKeyDown);
		
		// Select current heading
		this.selectHeadingAtIndex(headingData.currentHeadingIndex);
		
		// Finalize
		setTimeout(() => {
			// Start listening to scroll events shortly after the initial scroll
			this.scrollingWrapperElement.addEventListener("scroll", this.userDidScroll.bind(this));
			
			// And make scrolling smooth
			this.scrollingWrapperElement.style.scrollBehavior = "smooth";
		}, 250);
	}
	
	selectHeadingAtIndex(headingIndex) {
		const headingHeight = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--selection-row-height"));
		
		this.scrollingWrapperElement.scrollTo(0, headingIndex * headingHeight);
	}
	
	keyboardSelectHeadingAtIndex(headingIndex) {
		this.scrollingWrapperElement.style.scrollBehavior = "";
		this.selectHeadingAtIndex(headingIndex);
		this.scrollingWrapperElement.style.scrollBehavior = "smooth";
	}
	
	userDidScroll() {
		// Reveal heading in page
		this.callbacks.userDidSelectHeading(this.selectedHeadingIndex);
	}
	
	onKeyDown() {
		const UP_ARROW = 38;
		const DOWN_ARROW = 40;
		
		if (!this.ulElement) return;
		
		if (event.keyCode === UP_ARROW) {
			if (event.altKey) {
				// ⌥↑: move to top
				this.keyboardSelectHeadingAtIndex(0);
			} else {
				// ↑: move up
				if (this.selectedHeadingIndex > 0) {
					this.keyboardSelectHeadingAtIndex(this.selectedHeadingIndex - 1);
				}
			}
		} else if (event.keyCode === DOWN_ARROW) {
			const maxIndex = this.headingData.headingInfos.length - 1;
			
			if (event.altKey) {
				// ⌥↓: move to bottom
				this.keyboardSelectHeadingAtIndex(maxIndex);
			} else {
				// ↓: move down
				if (this.selectedHeadingIndex < maxIndex) {
					this.keyboardSelectHeadingAtIndex(this.selectedHeadingIndex + 1);
				}
			}
		}
	}
};
