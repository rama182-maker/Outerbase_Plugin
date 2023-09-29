var privileges = ["cellValue", "configuration"];

var templateCell_$PLUGIN_ID = document.createElement("template");
templateCell_$PLUGIN_ID.innerHTML = `
  <style>
    #container {
      display: flex;
      align-items: center;
      gap: 8px;
      justify-content: space-between;
      height: 100%;
      width: calc(100% - 16px);
      padding: 0 8px;
    }
    input {
      height: 100%;
      flex: 1;
      background-color: transparent;
      border: 0;
      min-width: 0;
      white-space: nowrap;
      text-overflow: ellipsis;
      overflow: hidden;
    }
    input:focus {
      outline: none;
    }
  </style>
  <div id="container">
    <input type="text" id="content-value" placeholder="Enter...">
    <button id="view-content">Summarize</button>
  </div>
`;

var templateEditor_$PLUGIN_ID = document.createElement('template')
templateEditor_$PLUGIN_ID.innerHTML = `
<style>
    #container {
      overflow: hidden; /* Add this line to hide overflow */
      background-color: black;
      padding: 10px;
      border: 2px solid white; 
      max-width: 405px;
    }
    #content-old {
      width:100%;
      height:100%;
    }
    #content {
      background-size: contain;
      background-repeat:no-repeat;
      max-width:400px;
      overflow: hidden; /* Add this line to hide overflow */
    }
    #background-content {
      background-repeat:no-repeat;
      background-size:contain;
      display:flex;
      align-items:center;
      justify-content:center;
      font-family: "Gill Sans Extrabold", sans-serif;
    }
    .loading-spinner {
      border: 4px solid rgba(255, 255, 255, 0.3);
      border-top: 4px solid #000000;
      border-radius: 50%;
      width: 30px;
      height: 30px;
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  </style>
  <div id="container">
    <div id="background-content"></div>
  </div>
`

class OuterbasePluginConfig_$PLUGIN_ID {
	constructor(object) {}
}

class OuterbasePluginCell_$PLUGIN_ID extends HTMLElement {
	static get observedAttributes() {
		return privileges;
	}

	config = new OuterbasePluginConfig_$PLUGIN_ID({});

	constructor() {
		super();
		this.shadow = this.attachShadow({
			mode: "open"
		});
		this.shadow.appendChild(templateCell_$PLUGIN_ID.content.cloneNode(true));
	}

	connectedCallback() {
		this.config = new OuterbasePluginConfig_$PLUGIN_ID(
			JSON.parse(this.getAttribute("configuration"))
		);
		var cellValue = this.getAttribute("cellvalue");
		this.shadow.querySelector("#content-value").value = cellValue;
		var contentInput = this.shadow.getElementById("content-value");
		var viewContentButton = this.shadow.getElementById("view-content");

		if (contentInput && viewContentButton) {
			contentInput.addEventListener("focus", () => {
				this.callCustomEvent({
					action: "onstopedit",
					value: true,
				});
			});

			contentInput.addEventListener("blur", () => {
				this.callCustomEvent({
					action: "cellvalue",
					value: contentInput.value,
				});
				this.callCustomEvent({
					action: "onstopedit",
					value: true,
				});
			});

			viewContentButton.addEventListener("click", () => {
				var message = cellValue;
				contentInput.value = message;
				this.callCustomEvent({
					action: "onedit",
					value: true,
				});
			});
		}
	}

	callCustomEvent(data) {
		const event = new CustomEvent("custom-change", {
			detail: data,
			bubbles: true,
			composed: true,
		});

		this.dispatchEvent(event);
	}
}

class OuterbasePluginEditor_$PLUGIN_ID extends HTMLElement {
	static get observedAttributes() {
		return privileges;
	}

	constructor() {
		super();
		this.shadow = this.attachShadow({
			mode: "open"
		});
		this.shadow.appendChild(templateEditor_$PLUGIN_ID.content.cloneNode(true));
		this.config = new OuterbasePluginConfig_$PLUGIN_ID(
			JSON.parse(this.getAttribute("configuration"))
		);
	}

	async connectedCallback() {
		var cellValue = this.getAttribute("cellvalue").toLowerCase();
		var originalCellValue = this.getAttribute("cellvalue").toLowerCase();
		var message;

		const loadingIndicator = document.createElement("div");
		loadingIndicator.className = "loading-spinner";
		this.shadow.querySelector("#background-content").appendChild(loadingIndicator);

		var cellValueWordCount = originalCellValue.split(/\s+/).filter(Boolean).length;


		if (cellValueWordCount > 40) {
			const apiKey = '7AzKl7dB0PQOKu0okqTT4T9hoZbU5KNq';
			const apiUrl = 'https://api.ai21.com/studio/v1/summarize';
			const requestData = {
				"sourceType": "TEXT",
				"source": cellValue
			}
			let response = await fetch(apiUrl, {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${apiKey}`,
					'Accept': 'application/json',
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(requestData),
			});
			this.shadow.querySelector("#background-content").removeChild(loadingIndicator);
			var data = await response.json();
			message = data.summary;
		} else {
			const apiKey = '7AzKl7dB0PQOKu0okqTT4T9hoZbU5KNq';
			const apiUrl = 'https://api.ai21.com/studio/v1/paraphrase';
			const paraphraseRequestData = {
				"style": 'short',
				"text": cellValue
			};
			let response = await fetch(apiUrl, {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${apiKey}`,
					'Accept': 'application/json',
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(paraphraseRequestData),
			});
			this.shadow.querySelector("#background-content").removeChild(loadingIndicator);
			var data = await response.json();
			message = data.suggestions[0].text;
		}
		var messageWordCount = message.split(/\s+/).filter(Boolean).length;
		let translatedText = "Translate...";

		var backgroundContentView = this.shadow.getElementById("background-content");
		if (backgroundContentView) {
			backgroundContentView.innerHTML = `
        <div style="display: flex; flex-wrap: wrap;">
        <div style="flex: 1; min-width: 120px; margin: 8px; margin-bottom: 20px;">
          <div style="padding: 8px; border: 1px solid #fff; height: 100%;">
            Character Count<br>
            <hr>
            ${cellValue.length} -> ${message.length}
          </div>
        </div>
        <div style="flex: 1; min-width: 120px; margin: 8px; margin-bottom: 20px;">
          <div style="padding: 8px; border: 1px solid #fff; height: 100%;">
            Word Count<br>
            <hr>
            ${cellValueWordCount} -> ${messageWordCount}
          </div>
        </div>
        <div style="flex: 2; min-width: 300px; margin: 8px; margin-bottom: 20px;">
          <div style="padding: 8px; border: 1px solid #fff; height: 100%; position: relative; overflow: auto;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                Original Text<br>
                <hr>
                <div id="original-translated-value">${originalCellValue}</div>
              </div>
              <button id="original-translate-content" style="position: absolute; top: 8px; right: 8px;">Spanish</button>
            </div>
          </div>
        </div>
        <div style="flex: 2; min-width: 300px; margin: 8px; margin-bottom: 20px;">
          <div style="padding: 8px; border: 1px solid #fff; height: 100%; position: relative;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                Summary<br>
                <hr>
                ${message}
              </div>
              <button id="copy-content" style="position: absolute; top: 8px; right: 8px;">Copy</button>
            </div>
          </div>
        </div>
        <div style="flex: 2; min-width: 300px; margin: 8px; margin-bottom: 20px;">
          <div style="padding: 8px; border: 1px solid #fff; height: 100%; position: relative;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                Translaion<br>
                <hr>
                <div id="translated-value">${translatedText}</div>
              </div>
              <button id="translate-content" style="position: absolute; top: 8px; right: 8px;">Spanish</button>
            </div>
          </div>
        </div>
      </div>
      `;
		}
		backgroundContentView.style.color = 'white';
		backgroundContentView.style.fontFamily = 'Inter';
		backgroundContentView.style.fontSize = 'bold';

		const copyContentButton = this.shadow.querySelector("#copy-content");
		if (copyContentButton) {
			copyContentButton.addEventListener("click", () => {
				const summary = message;

				const textarea = document.createElement("textarea");
				textarea.value = summary;
				this.shadow.querySelector("#background-content").appendChild(textarea);

				textarea.select();
				document.execCommand("copy");

				this.shadow.querySelector("#background-content").removeChild(textarea);

				copyContentButton.textContent = "Copied";
				setTimeout(() => {
					copyContentButton.textContent = "Copy";
				}, 2000);
			});
		}


		const originalTranslateContentButton = this.shadow.querySelector("#original-translate-content");
		if (originalTranslateContentButton) {
			originalTranslateContentButton.addEventListener("click", async () => {
				translatedText = await translateTo(originalCellValue);
				const originalTranslatedValue = this.shadow.querySelector("#original-translated-value");
				originalTranslatedValue.textContent = translatedText;
			});
		}

		const translateContentButton = this.shadow.querySelector("#translate-content");
		if (translateContentButton) {
			translateContentButton.addEventListener("click", async () => {
				translatedText = await translateTo(message);
				const translatedValue = this.shadow.querySelector("#translated-value");
				translatedValue.textContent = translatedText;
			});
		}

		async function translateTo(sourceText) {
			var sourceText = sourceText;
			var sourceLang = 'en';
			var targetLang = 'es';

			var url = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=" + sourceLang + "&tl=" + targetLang + "&dt=t&q=" + encodeURI(sourceText);

			await fetch(url)
				.then((response) => response.json())
				.then((data) => {
					translatedText = data[0][0][0];
				})
				.catch((error) => {
					translatedText = "";
				});
			return translatedText;
		}
	}
}


window.customElements.define(
	"outerbase-plugin-cell-$PLUGIN_ID",
	OuterbasePluginCell_$PLUGIN_ID
);
window.customElements.define(
	"outerbase-plugin-editor-$PLUGIN_ID",
	OuterbasePluginEditor_$PLUGIN_ID
);