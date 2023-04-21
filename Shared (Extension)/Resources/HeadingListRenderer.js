export default class HeadingListRenderer {
	constructor(parentElement, callbacks) {
		this.parentElement = parentElement;
		this.callbacks = callbacks;
		
		this.rootElement = null; // can be the <select> or something else
		this.selectElement = null;
	}
	
	render(headingData) {
		const headingInfos = headingData.headingInfos;
		
		if (this.rootElement) {
			this.rootElement.parentNode.removeChild(this.rootElement);
			
			this.rootElement = null;
			this.selectElement = null;
		}
		
		// Too few headings?
		if (headingInfos.length <= 1) {
			let messageContainerElement = document.createElement("div");
			this.parentElement.appendChild(messageContainerElement);
			this.rootElement = messageContainerElement;
			
			messageContainerElement.className = "messageContainer";
			messageContainerElement.innerText = "No heading in document";
			
			return;
		}
		
		// Create <select>
		this.selectElement = document.createElement("select");
		this.parentElement.appendChild(this.selectElement);
		this.rootElement = this.selectElement;
		
		this.selectElement.focus();
		
		this.selectElement.size = headingInfos.length;
		this.selectElement.addEventListener("change", this.userDidChangeSelection.bind(this));
		
		this.selectElement.addEventListener("mousedown", () => {
			// On mousedown, the <select> selection hasn't updated yet
			setTimeout(this.userDidChangeSelection.bind(this), 0);
		});
		
		this.selectElement.addEventListener("mousemove", event => {
			if (event.buttons > 0) {
				this.userDidChangeSelection();
			}
		});
		
		this.selectElement.addEventListener("keydown", event => {
			const UP_ARROW = 38;
			const DOWN_ARROW = 40;
			
			if (!this.selectElement) return;
			
			if (event.keyCode === UP_ARROW && event.altKey) {
				this.selectElement.selectedIndex = 0;
				this.userDidChangeSelection();
			} else if (event.keyCode === DOWN_ARROW && event.altKey) {
				this.selectElement.selectedIndex = this.selectElement.options.length - 1;
				this.userDidChangeSelection();
			}
		});
		
		// Add heading <option> elements
		for (let [headingIndex, headingInfo] of Object.entries(headingInfos)) {
			const optionElement = document.createElement("option");
			this.selectElement.appendChild(optionElement);
			
			optionElement.dataset.headingIndex = headingIndex;
			
			// Set text
			const levelIndentation = "    ".repeat(headingInfo.mappedLevel - 1);
			const formattedHeadingText = levelIndentation + headingInfo.innerText;
			optionElement.innerText = formattedHeadingText;
		}
		
		// Select current heading
		this.selectHeadingAtIndex(headingData.currentHeadingIndex);
	}
	
	selectHeadingAtIndex(headingIndex) {
		this.selectElement.selectedIndex = headingIndex;
		this.revealHeadingAtIndex(headingIndex);
	}
	
	revealHeadingAtIndex(headingIndex) {
		const verticalPadding = 10;
		
		if (!this.selectElement) return;
		
		const selectedOption = this.selectElement.options[headingIndex];
		const selectedOptionRect = selectedOption.getBoundingClientRect();
		const viewportHeight = document.documentElement.clientHeight;
		
		if (selectedOptionRect.top < verticalPadding) {
			scrollBy(0, selectedOptionRect.top - verticalPadding);
		} else if (selectedOptionRect.bottom > viewportHeight - verticalPadding) {
			scrollBy(0, selectedOptionRect.bottom - viewportHeight + verticalPadding);
		}
	}
	
	userDidChangeSelection() {
		if (!this.selectElement) return;
		
		const selectedOption = this.selectElement.selectedOptions[0];
		
		if (selectedOption) {
			const selectedHeadingIndex = selectedOption.dataset.headingIndex;
			
			// Reveal heading in popup
			this.revealHeadingAtIndex(selectedHeadingIndex);
			
			// Reveal heading in page
			this.callbacks.userDidSelectHeading(selectedHeadingIndex);
		}
	}
};
