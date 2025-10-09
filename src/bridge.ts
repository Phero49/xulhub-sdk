import type {
  Cell,
  NotebookMeta,
  ReferenceObject,
  Source as Resource,
} from "../types";
import { QuizManager } from "./quizMananger";
import type {
  AutoGenerateCellsOptions,
  Config,
} from "./types/bridge";
import { checkCell, sendMessageToClient } from "./utils/utils";

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
    ready: [] as (() => void)[],
    error: [] as ((error: Error) => void)[],
  };
  
  /** Registry of message handlers for incoming postMessage events */
  private messageHandlers: Record<string, (data: any) => any | void> = {};

  // ============================================================================
  // Initialization
  // ============================================================================
  
  constructor(config?: Config) {
    this.initializeSDK(config);
  }

  /**
   * Initializes the SDK by setting up message listeners and notifying the parent
   * Validates environment and establishes communication channel
   */
  private initializeSDK(config?:Config): void {
    // Validate browser environment
    if (typeof window === "undefined") {
      this.triggerError(new Error("SDK must run in a browser environment"));
      return;
    }

    // Validate iframe context
    if (typeof parent === "undefined") {
      this.triggerError(
        new Error("SDK must run in an iframe within the host application")
      );
      return;
    }

    // Setup message handling
    window.addEventListener("message", this.handleIncomingMessage.bind(this));
    this.registerCoreMessageHandlers();

    // Notify parent that SDK is ready for initialization
    this.sendToParent('sdkReady',config)

    // Set timeout for initialization response
    setTimeout(() => {
      if (!this.isInitialized) {
        this.triggerError(
          new Error("Host application did not respond to SDK initialization")
        );
      }
    }, 3000);
  }

  /**
   * Registers core message handlers for SDK operation
   */
  private registerCoreMessageHandlers(): void {
    this.messageHandlers["sdkInitialized"] = this.handleInitialization.bind(this);
    this.messageHandlers["scoreUpdated"] = this.handleScoreUpdate.bind(this);
    this.messageHandlers["getConfig"] = this.handleConfigRequest.bind(this);
    this.messageHandlers["showCorrectAnswer"] = this.handleShowCorrectAnswer.bind(this);
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
    const { cellIndex: messageCell, contentPosition: messagePosition } = data.data;

    // Verify message is intended for this cell instance
    if (this.isInitialized) {
      const isTargetCell = checkCell(
        messageCell,
        messagePosition,
        this.cellIndex,
        this.contentPosition
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
    callback: (data: any) => any | void
  ) => {
    this.messageHandlers[event] = callback.bind(this);
  };

  // ============================================================================
  // Initialization Handlers
  // ============================================================================

  /**
   * Handles the initialization data from parent application
   * Sets up cell state and quiz manager
   */
  private handleInitialization(data: {
    cellContentData: any;
    cellIndex: number;
    contentPosition: number;
    calculatedScore?: number;
    published: boolean;
  }): void {
    console.log("SDK initialized with data:", data.cellContentData);
    
    this.isPublished = data.published;
    this.cellIndex = data.cellIndex;
    this.contentPosition = data.contentPosition;
    this.score = data.calculatedScore || 0;
    this.contentData = data.cellContentData;

    // Handle auto-generation if configured
    if (data.cellContentData.processCells) {
      const generatedContent = this.contentGenerator.processImport(
        data.cellContentData.dataToProcess
      );

      this.sendToParent("autoGenerateCells", generatedContent);
      return
    }

    // Initialize quiz manager
    this.quizManager = new QuizManager(
      this.triggerError.bind(this),
      this.cellIndex,
      this.contentPosition,
      this.registerMessageHandler
    );

    this.isInitialized = true;
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
   * @returns Typed content data
   */
  public getContentData<T>(): T {
    return this.contentData as T;
  }

  /**
   * Saves content data to parent application
   * @param data - Content data to save
   */
  public saveContent<T>(data: T): void {
    if (!this.isInitialized) {
      throw new Error(
        "SDK not initialized. Wait for onReady() event before saving data."
      );
    }

    if (data === undefined || data === null) {
      throw new Error("Cannot save null or undefined data");
    }

    this.contentData = data;
    this.sendToParent("saveData", data);
  }

  /**
   * Content generator configuration for auto-generating cells
   */
  public contentGenerator: AutoGenerateCellsOptions = {
    contentType: null,
    instructionFormat: null,
    processImport: (input) => {
      this.sendToParent(
        "notImplemented",
        "Content import processing not implemented"
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
      "Show correct answer not implemented for this cell type"
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
   * @returns Promise that resolves when processing is complete
   */
  public processTTS(element: HTMLElement): Promise<void> {
    return new Promise<void>((resolve) => {
      this.sendToParent("processTTs", element.innerHTML);

      this.messageHandlers["processTTs"] = (processedHTML: string) => {
        element.innerHTML = processedHTML;
        this.attachTTSControls(element);
        resolve();
      };
    });
  }

  /**
   * Attaches interactive TTS controls to elements with data-tts attribute
   * @param container - Container element to search within
   */
  private attachTTSControls(container: HTMLElement): HTMLElement {
    const ttsElements = container.querySelectorAll("[data-tts]");
    
    ttsElements.forEach((element) => {
      // Skip if already has controls
      if (element.querySelector('[data-role="speak-btn"]')) {
        return;
      }

      const button = this.createTTSButton(element as HTMLElement);
      element.prepend(button);
    });

    return container;
  }

  /**
   * Creates a TTS control button with play/stop functionality
   * @param element - Element containing the text to speak
   * @returns Configured button element
   */
  private createTTSButton(element: HTMLElement): HTMLSpanElement {
    const button = document.createElement("span");
    this.styleTTSButton(button);

    const icons = this.getTTSIcons();
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
  private getTTSIcons() {
    return {
      play: '<svg height="24px" viewBox="0 -960 960 960" width="18px" fill="rgba(238, 42, 84, 1)"><path d="m380-300 280-180-280-180v360ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z"/></svg>',
      stop: '<svg height="20px" viewBox="0 -960 960 960" width="18px" fill="#EA3323"><path d="M336-336h288v-288H336v288ZM480.28-96Q401-96 331-126t-122.5-82.5Q156-261 126-330.96t-30-149.5Q96-560 126-629.5q30-69.5 82.5-122T330.96-834q69.96-30 149.5-30t149.04 30q69.5 30 122 82.5T834-629.28q30 69.73 30 149Q864-401 834-331t-82.5 122.5Q699-156 629.28-126q-69.73 30-149 30Zm-.28-72q130 0 221-91t91-221q0-130-91-221t-221-91q-130 0-221 91t-91 221q0 130 91 221t221 91Zm0-312Z"/></svg>',
    };
  }

  /**
   * Creates a speech utterance with appropriate voice settings
   */
  private createSpeechUtterance(
    text: string,
    languageCode: string
  ): SpeechSynthesisUtterance {
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = speechSynthesis.getVoices();

    // Find matching voice (exact match first, then prefix match)
    const voice = voices.find(
      (v) => v.lang.toLowerCase() === languageCode.toLowerCase()
    ) || voices.find((v) =>
      v.lang.toLowerCase().startsWith(languageCode.toLowerCase())
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
        "SDK not initialized. Wait for onReady() event before requesting data."
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
          new Error(`Timeout: No response for ${eventName} after 10 seconds`)
        );
      }, 10000);
    });
  }

  /**
   * Fetches notebook metadata from parent application
   */
  public getNotebookMetadata(): Promise<NotebookMeta> {
    return this.requestDataFromParent("getMeta");
  }

  // ============================================================================
  // Event Lifecycle
  // ============================================================================

  /**
   * Registers a callback to execute when SDK is ready
   * @param callback - Function to execute when ready
   * @param config - Optional configuration to send to parent
   */
  public onReady(callback: () => void, config?: Config): void {
    this.eventHandlers.ready.push(callback);

    if (this.isInitialized) {
      // Send configuration to parent
      this.sendToParent("config", config ?? {
        hideCheckButton: false,
        hasAutoGen: false,
      });
      
      // Execute callback asynchronously
      setTimeout(() => callback(), 0);
    }
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
    this.eventHandlers.ready.forEach((callback) => callback());
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
export const createNotebookSDK = (config?:Config): NotebookSDK => {
  return new NotebookSDK(config);
};
