import { QuizManager } from "./quizMananger";
import type {
  AutoGenerateCellsOptions,
  Config,
  connectPayload,
} from "../types";
import { checkCell, sendMessageToClient, takeScreenShot } from "./utils/utils";

/**
 * @internal
 * Implementation of the Notebook SDK - not intended for direct use by extensions
 */
/**
 * NotebookSDK - Main SDK for notebook cell content interaction
 *
 * Handles communication between notebook cells and the parent application,
 * manages state, scoring, TTS functionality, and quiz operations.
 */
class NotebookSDK {
  // ============================================================================
  // State Properties
  // ============================================================================

  /** Current calculated score for this cell */
  public score = 0;

  /** Indicates if SDK has completed initialization */
  public isInitialized = false;

  /** Whether the notebook is in published/read-only mode */
  public isPublished = false;

  /** Index of this cell within the notebook */
  public cellIndex = 0;

  /** Position of this content within the cell */
  public contentPosition = 0;

  /** Quiz management instance */
  public quizManager!: QuizManager;

  /** Stored cell content data */
  private contentData: any = null;

  /** SDK configuration options */
  private config: Config | undefined;

  // ============================================================================
  // Event Management
  // ============================================================================

  /** Registered event handlers for lifecycle events */
  private eventHandlers = {
    ready: [] as ((data?: any) => void)[],
    error: [] as ((error: Error) => void)[],
  };

  /** Registry of message handlers for incoming postMessage events */
  private messageHandlers: Record<string, (data: any) => any | void> = {};

  // ============================================================================
  // Initialization
  // ============================================================================

  constructor(config: Config) {
    this.config = config;
    // this.reconnect()
    this.initializeSDK(config);
  }

  /**
   * Initializes the SDK by setting up message listeners and notifying the parent
   * Validates environment and establishes communication channel
   */
  private initializeSDK(_config?: Config, tries = 10): void {
    // Validate browser environment
    if (typeof window === "undefined") {
      this.triggerError(new Error("SDK must run in a browser environment"));
      return;
    }

    // Validate iframe context
    if (typeof parent === "undefined") {
      this.triggerError(
        new Error("SDK must run in an iframe within the host application"),
      );
      return;
    }

    // Setup message handling
    window.addEventListener("message", this.handleIncomingMessage.bind(this));
    this.registerCoreMessageHandlers();
    // Notify parent that SDK is ready for initialization
    // this.sendToParent('sdkReady',config)

    // Set timeout for initialization response
    setTimeout(() => {
      if (!this.isInitialized) {
        if (tries >= 0) {
          console.log("not initialized ", tries);
          this.reconnect();
          return this.initializeSDK(this.config, tries - 1);
        }
        this.triggerError(
          new Error("Host application did not respond to SDK initialization"),
        );
      }
    }, 3000);
  }
  /**
   * Requests the host application to reconnect.
   *
   * Useful during development when the extension hot-reloads and loses its state.
   * Calling this prompts the host to resend the necessary data so the SDK can
   * restore its state.
   */
  private reconnect() {
    if (this.isInitialized === false) {
      this.sendToParent("reconnect");
    }
  }

  private connect(data: connectPayload) {
    this.handleInitialization(data);
    this.sendToParent("connected", this.config);
    console.log("connected");
  }
  /**
   * Registers core message handlers for SDK operation
   */
  private registerCoreMessageHandlers(): void {
    this.messageHandlers["connect"] = this.connect.bind(this);
    // this.messageHandlers["sdkInitialized"] = this.handleInitialization.bind(this);
    this.messageHandlers["scoreUpdated"] = this.handleScoreUpdate.bind(this);
    this.messageHandlers["getConfig"] = this.handleConfigRequest.bind(this);
    this.messageHandlers["captureScreenshot"] = this.takeScreenShot.bind(this);
    this.messageHandlers["showCorrectAnswer"] =
      this.handleShowCorrectAnswer.bind(this);
    this.messageHandlers["error"] = (data) => {
      this.triggerError(new Error(data.message));
    };
  }

  // ============================================================================
  // Message Handling
  // ============================================================================

  /**
   * Handles incoming postMessage events from parent application
   * Routes messages to appropriate handlers based on cell position
   */
  private handleIncomingMessage(event: MessageEvent): void {
    // TODO: Add origin validation for production
    // if (event.origin !== EXPECTED_ORIGIN) return;

    const { data } = event;
    if (data == undefined || data.data == undefined) {
      return;
    }
    const { cellIndex: messageCell, contentPosition: messagePosition } =
      data.data;
    // Verify message is intended for this cell instance
    if (this.isInitialized) {
      const isTargetCell = checkCell(
        messageCell,
        messagePosition,
        this.cellIndex,
        this.contentPosition,
      );

      if (!isTargetCell) {
        return;
      }
    }

    // Route to appropriate handler
    const handler = this.messageHandlers[data.event];
    if (handler) {
      handler(data.data.payload);
    }
  }

  /**
   * Sends a message to the parent application
   */
  private sendToParent(event: string, payload?: any): void {
    sendMessageToClient({
      event,
      data: {
        cellIndex: this.cellIndex,
        contentPosition: this.contentPosition,
        payload,
      },
    });
  }

  /**
   * Registers a custom message handler
   * @param event - Event name to listen for
   * @param callback - Handler function
   */
  public registerMessageHandler = (
    event: string,
    callback: (data: any) => any | void,
  ) => {
    this.messageHandlers[event] = callback.bind(this);
  };

  private unRegisterMessageHandler(event: string) {
    delete this.messageHandlers[event];
  }

  // ============================================================================
  // Initialization Handlers
  // ============================================================================

  /**
   * Handles the initialization data from parent application
   * Sets up cell state and quiz manager
   */
  private handleInitialization(data: connectPayload): void {
    if (data.getMeta) {
      //used  to get the instruction and type and saved to db  and other meta
      let icon = "";
      const iconEl = document.querySelector(
        'link[rel="icon"]',
      ) as HTMLLinkElement | null;

      if (iconEl) {
        const href = iconEl.getAttribute("href") || "";

        // Check if href already starts with http or https
        if (/^https?:\/\//i.test(href)) {
          icon = href;
        } else {
          // Convert relative or protocol-less URL to full
          icon = new URL(href, window.location.origin).href;
        }
      }

      this.sendToParent("get-meta-response", {
        autoGen: {
          icon: icon,
          type: this.contentGenerator.contentType,
          instruction: this.contentGenerator.instructionFormat,
        },
      });
      data.published = false;
    }

    this.isPublished = data.published;
    this.cellIndex = data.cellIndex;
    this.contentData = data.cellContentData;
    this.contentPosition = data.contentPosition;
    //TODO look into calculated score
    this.score = data.calculatedScore || 0;
    this.isInitialized = true;

    if (data.cellContentData != null && data.cellContentData.processCells) {
      let rawData = data.cellContentData.dataToProcess;
      if (
        this.contentGenerator &&
        this.contentGenerator.contentType?.includes("html")
      ) {
        const div = document.createElement("div");
        div.innerHTML = data.cellContentData.dataToProcess;
        rawData = div;
      }
      const generatedContent = this.contentGenerator.processImport(rawData);

      // Handle auto-generation if configured

      this.sendToParent("autoGenerateCells", generatedContent);
      return;
    }

    // Initialize quiz manager
    this.quizManager = new QuizManager(
      this.triggerError.bind(this),
      this.cellIndex,
      this.contentPosition,
      this.registerMessageHandler,
      this.sendToParent,
    );

    delete this.messageHandlers["sdkInitialized"];
    this.notifyReady();
  }

  // ============================================================================
  // Score Management
  // ============================================================================

  /**
   * Handles score updates from parent application
   */
  private handleScoreUpdate(data: any): void {
    this.score = data.score;
  }

  // ============================================================================
  // Configuration
  // ============================================================================

  /**
   * Handles configuration requests from parent
   */
  private handleConfigRequest(): void {
    this.sendToParent("getConfig", this.config);
  }

  /**
   * Updates SDK configuration (currently a stub)
   */
  public updateConfig({}: {
    height?: string;
    hideVerifyAnswerButton?: boolean;
  }): void {
    // Configuration logic to be implemented
  }

  // ============================================================================
  // Content Management
  // ============================================================================

  /**
   * Gets the current cell content data
   * @returns Typed content data or  null if  no data available
   */
  public getContentData<T>(): T | null {
    return this.contentData as T;
  }

  /**
   * Saves content data to parent application
   * @param data - Content data to save
   */
  public saveContent<T>(data: T): void {
    if (!this.isInitialized) {
      throw new Error("SDK not initialized. Wait for onReady() before saving.");
    }

    if (data == null) {
      throw new Error("Cannot save null or undefined data");
    }

    const type = typeof data;

    // allow only string, array, or plain object
    if (type !== "string" && type !== "object") {
      throw new Error("Data must be a string, array, or plain object");
    }

    // JSON-safe deep clone
    let cloned: any;

    if (type === "string") {
      cloned = data; // no cloning needed for strings
    } else {
      // must be array or object, not a proxy
      try {
        cloned = JSON.parse(JSON.stringify(data));
      } catch {
        throw new Error("Data contains non-JSON-safe values");
      }
    }

    this.contentData = cloned;
    this.sendToParent("saveData", cloned);
  }

  /**
   * Uploads a file to the host application.
   * Accepts File, Blob, or base64 string.
   * Ensures file size ≤ 3.5 MB (binary) and only allowed types.
   * Converts all files to ArrayBuffer before sending to host.
   *
   * @param file - File, Blob, or base64 string to upload
   * @param timeoutMs - Optional timeout in milliseconds (default: 15000)
   * @returns Promise resolving with the uploaded file URL
   * @throws Error if the file type is unsupported, size exceeds 3.5 MB, or upload fails/times out
   */
  public async uploadFile(
    file: File | Blob | string,
    timeoutMs: number = 15000,
  ): Promise<string> {
    const allowedTypes = [
      "image/png",
      "image/jpeg",
      "image/gif",
      "image/webp",
      "audio/mpeg",
      "audio/ogg",
      "audio/wav",
      "video/mp4",
      "video/webm",
      "video/ogg",
      "text/plain",
    ];

    const base64ToArrayBuffer = (base64: string) => {
      const clean = base64.split(",")[1] || base64;
      const binary = atob(clean);
      const len = binary.length;
      const buffer = new ArrayBuffer(len);
      const view = new Uint8Array(buffer);
      for (let i = 0; i < len; i++) view[i] = binary.charCodeAt(i);
      return buffer;
    };

    const sendToHost = (payload: any): Promise<string> => {
      return new Promise<string>((resolve, reject) => {
        const eventSuccess = "fileUploaded";
        const eventError = "fileUploadError";

        const handleSuccess = (url: string) => {
          clearTimeout(timeoutId);
          this.unRegisterMessageHandler(eventSuccess);
          this.unRegisterMessageHandler(eventError);
          resolve(url);
        };

        const handleFailure = (errMsg: string) => {
          clearTimeout(timeoutId);
          this.unRegisterMessageHandler(eventSuccess);
          this.unRegisterMessageHandler(eventError);
          reject(new Error(errMsg || "Host failed to upload file"));
        };

        this.registerMessageHandler(eventSuccess, handleSuccess);
        this.registerMessageHandler(eventError, handleFailure);

        const timeoutId = window.setTimeout(() => {
          this.unRegisterMessageHandler(eventSuccess);
          this.unRegisterMessageHandler(eventError);
          reject(new Error("File upload timed out"));
        }, timeoutMs);

        this.sendToParent("uploadFile", payload);
      });
    };

    const processFile = async (
      f: File | Blob,
      name?: string,
    ): Promise<string> => {
      if (!allowedTypes.includes(f.type))
        throw new Error(`File type ${f.type} not supported`);

      const arrayBuffer = await f.arrayBuffer();
      if (arrayBuffer.byteLength > 3.5 * 1024 * 1024)
        throw new Error(
          "File too large (max 3.5 MB). Please resize for better performance.",
        );

      return sendToHost({
        fileName: name || (f instanceof File ? f.name : "file"),
        mimeType: f.type,
        data: arrayBuffer,
      });
    };

    if (typeof file === "string") {
      const arrayBuffer = base64ToArrayBuffer(file);
      if (arrayBuffer.byteLength > 3.5 * 1024 * 1024)
        throw new Error(
          "Base64 file too large (max 3.5 MB). Please resize for better performance.",
        );

      const mimeMatch = file.match(/^data:(.+);base64,/);
      const mimeType = mimeMatch ? mimeMatch[1] : "application/octet-stream";
      if (!allowedTypes.includes(mimeType as string))
        throw new Error(`File type ${mimeType} not supported`);

      return sendToHost({
        fileName: "file",
        mimeType,
        data: arrayBuffer,
      });
    } else {
      return processFile(file);
    }
  }

  /**
   * Optional asynchronous callback invoked before capturing a screenshot.
   *
   * Assign an async function to this property to preprocess the DOM before screenshot capture.
   * Use this to hide elements, add elements, modify styles, or perform other DOM manipulations
   * that should be reflected in the captured screenshot (e.g., using html2canvas).
   *
   * When unset (null), screenshot capture proceeds without preprocessing.
   *
   * Implementations should:
   * - Modify the DOM as needed for the screenshot
   * - Keep the callback short-running
   * - Catch and handle errors where appropriate
   *
   * Example:
   * notebookSDK.onCaptureScreenshot = async () => {
   *   // Hide UI elements not needed in screenshot
   *   document.querySelector('.toolbar')?.style.display = 'none';
   *   // Add watermark or branding
   *   const watermark = document.createElement('div');
   *   watermark.textContent = 'My App';
   *   document.body.appendChild(watermark);
   * };
   *
   * @defaultValue null
   */
  public onCaptureScreenshot = null as null | (() => Promise<void>);
  /**
   * a call back called when the screen shot has been captured
   * @defaultValue  null
   */
  public onScreenshotCaptured = null as null | (() => void);
  private async takeScreenShot() {
    if (this.onCaptureScreenshot) {
      await this.onCaptureScreenshot();
    }
    const image = await takeScreenShot();
    this.sendToParent("screenshotCaptured", image);
    if (this.onScreenshotCaptured) [this.onScreenshotCaptured()];
  }

  /**
   * Content generator configuration for auto-generating cells
   */
  public contentGenerator: AutoGenerateCellsOptions = {
    contentType: null,
    instructionFormat: null,
    processImport: (_input) => {
      this.sendToParent(
        "notImplemented",
        "Content import processing not implemented",
      );
      throw new Error("Content import processing not implemented");
    },
  };

  // ============================================================================
  // Quiz/Answer Display
  // ============================================================================

  /**
   * Shows the correct answer for quiz content
   * Must be implemented by specific cell types
   */
  public showCorrectAnswer = (): void => {
    this.sendToParent(
      "notImplemented",
      "Show correct answer not implemented for this cell type",
    );
    throw new Error("Show correct answer not implemented");
  };

  /**
   * Handles showCorrectAnswer requests from parent
   */
  private handleShowCorrectAnswer(): void {
    this.showCorrectAnswer();
  }

  // ============================================================================
  // Text-to-Speech (TTS) Functionality
  // ============================================================================

  /**
   * Reverses TTS markup to plain text
   * @param innerHTML - HTML with TTS markup
   * @returns Promise resolving to plain text
   */
  public reverseTTS(innerHTML: string): Promise<string> {
    return new Promise<string>((resolve) => {
      this.messageHandlers["reverseTTS"] = (data: string) => {
        resolve(data);
      };
      this.sendToParent("reverseTTS", innerHTML);
    });
  }

  /**
   * Processes an element's HTML to add TTS functionality
   * @param element - HTML element to process
   * @param size - play button size css units
   * @returns Promise that resolves when processing is complete
   */
  public processTTS(element: HTMLElement, size: string): Promise<void> {
    return new Promise<void>((resolve) => {
      this.sendToParent("processTTs", element.innerHTML);

      this.messageHandlers["processTTs"] = (processedHTML: string) => {
        element.innerHTML = processedHTML;
        this.attachTTSControls(element, size);
        resolve();
      };
    });
  }

  /**
   * Attaches interactive TTS controls to elements with data-tts attribute
   * @param container - Container element to search within
   */
  private attachTTSControls(container: HTMLElement, size: string): HTMLElement {
    const ttsElements = container.querySelectorAll("[data-tts]");

    ttsElements.forEach((element) => {
      // Skip if already has controls
      if (element.querySelector('[data-role="speak-btn"]')) {
        return;
      }

      const button = this.createTTSButton(element as HTMLElement, size);
      element.prepend(button);
    });

    return container;
  }

  /**
   * Creates a TTS control button with play/stop functionality
   * @param element - Element containing the text to speak
   * @returns Configured button element
   */
  private createTTSButton(element: HTMLElement, size: string): HTMLSpanElement {
    const button = document.createElement("span");
    this.styleTTSButton(button);

    const icons = this.getTTSIcons(size);
    button.innerHTML = icons.play;

    let isSpeaking = false;

    button.addEventListener("click", (e) => {
      e.stopImmediatePropagation();

      // Stop if currently speaking
      if (isSpeaking) {
        speechSynthesis.cancel();
        isSpeaking = false;
        button.innerHTML = icons.play;
        return;
      }

      // Start speaking
      const text = (element.textContent ?? "").trim().normalize();
      const languageCode = element.getAttribute("lang") || "en";

      const utterance = this.createSpeechUtterance(text, languageCode);

      utterance.onend = () => {
        isSpeaking = false;
        button.innerHTML = icons.play;
      };

      speechSynthesis.speak(utterance);
      button.innerHTML = icons.stop;
      isSpeaking = true;
    });

    button.setAttribute("data-role", "speak-btn");
    return button;
  }

  /**
   * Applies styling to TTS button
   */
  private styleTTSButton(button: HTMLSpanElement): void {
    Object.assign(button.style, {
      padding: "0px",
      margin: "0px",
      cursor: "pointer",
      display: "inline-flex",
      alignItems: "center",
      verticalAlign: "middle",
      marginRight: "8px",
    });
  }

  /**
   * Gets SVG icons for TTS controls
   */
  private getTTSIcons(size: string) {
    return {
      play: `<svg height="${size}" viewBox="0 -960 960 960" width="${size}" fill="rgba(238, 42, 84, 1)"><path d="m380-300 280-180-280-180v360ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z"/></svg>`,
      stop: `<svg height="${size}" viewBox="0 -960 960 960" width="${size}" fill="#EA3323"><path d="M336-336h288v-288H336v288ZM480.28-96Q401-96 331-126t-122.5-82.5Q156-261 126-330.96t-30-149.5Q96-560 126-629.5q30-69.5 82.5-122T330.96-834q69.96-30 149.5-30t149.04 30q69.5 30 122 82.5T834-629.28q30 69.73 30 149Q864-401 834-331t-82.5 122.5Q699-156 629.28-126q-69.73 30-149 30Zm-.28-72q130 0 221-91t91-221q0-130-91-221t-221-91q-130 0-221 91t-91 221q0 130 91 221t221 91Zm0-312Z"/></svg>`,
    };
  }

  /**
   * Creates a speech utterance with appropriate voice settings
   */
  private createSpeechUtterance(
    text: string,
    languageCode: string,
  ): SpeechSynthesisUtterance {
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = speechSynthesis.getVoices();

    // Find matching voice (exact match first, then prefix match)
    const voice =
      voices.find((v) => v.lang.toLowerCase() === languageCode.toLowerCase()) ||
      voices.find((v) =>
        v.lang.toLowerCase().startsWith(languageCode.toLowerCase()),
      );

    if (voice) {
      utterance.voice = voice;
    }

    return utterance;
  }

  // ============================================================================
  // UI Dialogs
  // ============================================================================

  /**
   * Opens a dialog in the parent application
   * @param options - Dialog configuration options
   */
  public openDialog(options: {
    position?: string;
    fullscreen?: boolean;
    fullwidth?: boolean;
    maxwidth?: boolean;
    [key: string]: any;
  }): void {
    this.sendToParent("openDialog", options);
  }

  /**
   * close a dialog in the parent application
   */
  public closeDialog(): void {
    this.sendToParent("closeDialog");
  }

  // ============================================================================
  // Data Fetching
  // ============================================================================

  /**
   * Requests data from parent application with timeout
   * @param eventName - Event name to request
   * @returns Promise with requested data
   */
  private async requestDataFromParent<T>(eventName: string): Promise<T> {
    if (!this.isInitialized) {
      throw new Error(
        "SDK not initialized. Wait for onReady() event before requesting data.",
      );
    }

    return new Promise<T>((resolve, reject) => {
      const handler = ({ data }: MessageEvent) => {
        if (data.event === eventName) {
          window.removeEventListener("message", handler);
          resolve(data.data as T);
        } else if (data.event === "error" && data.requestId === eventName) {
          window.removeEventListener("message", handler);
          reject(new Error(data.message));
        }
      };

      window.addEventListener("message", handler);

      const requestId = `${eventName}_${Date.now()}`;
      window.parent.postMessage({ event: eventName, requestId }, "*");

      // 10 second timeout
      setTimeout(() => {
        window.removeEventListener("message", handler);
        reject(
          new Error(`Timeout: No response for ${eventName} after 10 seconds`),
        );
      }, 10000);
    });
  }

  /**
   * Fetches notebook metadata from parent application
   */
  // public getNotebookMetadata(): Promise<NotebookMeta> {
  //   return this.requestDataFromParent("getMeta");
  // }

  // ============================================================================
  // Event Lifecycle
  // ============================================================================
  /**
   * Registers a callback that runs when the SDK becomes ready.
   *
   * The callback receives the resolved data the SDK collected during
   * its initialization phase. Basically, whatever info the SDK had to
   * fetch, load, or compute before considering itself "ready" ends up
   * being passed here.
   *
   * The callback can return an expected maximum score for the exercise,
   * which helps the system understand the scoring potential of this
   * activity. This is useful for normalizing scores across different
   * exercise types or for progress tracking.
   *
   * @example
   * // Multiple Choice Question - maximum possible score is 1
   * onReady<MCQData>((data) => {
   *   return 1; // Single correct answer worth 1 point
   * });
   *
   * @example
   * // Matching Exercise - maximum score equals number of matches
   * onReady<MatchingData>((data) => {
   *   return data.totalMatches; // Each correct match is worth 1 point
   * });
   *
   * @example
   * // Programming Exercise - maximum points defined by exercise
   * onReady<CodeData>((data) => {
   *   return data.maxPoints; // e.g., 10 points maximum
   * });
   *
   * @typeParam T - The type of the initialization data provided to the callback.
   * @param callback - Function that will be called with the data the SDK
   *                   has already received or prepared. Can return a number
   *                   representing the maximum possible score for this exercise.
   */
  public onReady<T>(callback: (data: T) => number): void {
    // Store the callback so the SDK can fire it once
    // all initialization data is available.

    this.eventHandlers.ready.push((data: T) => {
      const expectedScore = callback(data);
      if (expectedScore > 0 && this.isPublished) {
        this.quizManager.updateTotalScore(expectedScore);
      }
    });
  }
  /**
   * Registers an error callback
   * @param callback - Function to execute on errors
   */
  public onError(callback: (error: Error) => void): void {
    this.eventHandlers.error.push(callback);
  }

  /**
   * Notifies all registered ready callbacks
   */
  private notifyReady(): void {
    this.eventHandlers.ready.forEach((callback) => callback(this.contentData));
  }

  /**
   * Triggers error callbacks and logs error
   */
  private triggerError(error: Error): void {
    this.eventHandlers.error.forEach((callback) => callback(error));
    console.error("[NotebookSDK] Error:", error);
  }
}

/**
 * Creates a new instance of the Notebook SDK
 *
 * @returns A new NotebookSDK instance
 *
 * @remarks
 * Use this function only if you need multiple independent SDK instances.
 * Most extensions should use the singleton `notebookSDK` instead.
 *
 * @example
 * ```typescript
 * import { createNotebookSDK } from '@your-app/sdk';
 *
 * const customSDK = createNotebookSDK();
 * customSDK.onReady(() => { /* ... *\/ });
 * ```
 */
export const createNotebookSDK = (config: Config): NotebookSDK => {
  return new NotebookSDK(config);
};
