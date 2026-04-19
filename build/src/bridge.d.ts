import { QuizManager } from "./quizMananger";
import type { AutoGenerateCellsOptions, Config } from "../types";
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
declare class NotebookSDK {
    /** Current calculated score for this cell */
    score: number;
    /** Indicates if SDK has completed initialization */
    isInitialized: boolean;
    /** Whether the notebook is in published/read-only mode */
    isPublished: boolean;
    /** Index of this cell within the notebook */
    cellIndex: number;
    /** Position of this content within the cell */
    contentPosition: number;
    /** Quiz management instance */
    quizManager: QuizManager;
    /** Stored cell content data */
    private contentData;
    /** SDK configuration options */
    private config;
    /** Registered event handlers for lifecycle events */
    private eventHandlers;
    /** Registry of message handlers for incoming postMessage events */
    private messageHandlers;
    constructor(config: Config);
    /**
     * Initializes the SDK by setting up message listeners and notifying the parent
     * Validates environment and establishes communication channel
     */
    private initializeSDK;
    /**
     * Requests the host application to reconnect.
     *
     * Useful during development when the extension hot-reloads and loses its state.
     * Calling this prompts the host to resend the necessary data so the SDK can
     * restore its state.
     */
    private reconnect;
    private connect;
    /**
     * Registers core message handlers for SDK operation
     */
    private registerCoreMessageHandlers;
    /**
     * Handles incoming postMessage events from parent application
     * Routes messages to appropriate handlers based on cell position
     */
    private handleIncomingMessage;
    /**
     * Sends a message to the parent application
     */
    private sendToParent;
    /**
     * Registers a custom message handler
     * @param event - Event name to listen for
     * @param callback - Handler function
     */
    registerMessageHandler: (event: string, callback: (data: any) => any | void) => void;
    private unRegisterMessageHandler;
    /**
     * Handles the initialization data from parent application
     * Sets up cell state and quiz manager
     */
    private handleInitialization;
    /**
     * Handles score updates from parent application
     */
    private handleScoreUpdate;
    /**
     * Handles configuration requests from parent
     */
    private handleConfigRequest;
    /**
     * Updates SDK configuration (currently a stub)
     */
    updateConfig({}: {
        height?: string;
        hideVerifyAnswerButton?: boolean;
    }): void;
    /**
     * Gets the current cell content data
     * @returns Typed content data or  null if  no data available
     */
    getContentData<T>(): T | null;
    /**
     * Saves content data to parent application
     * @param data - Content data to save
     */
    saveContent<T>(data: T): void;
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
    uploadFile(file: File | Blob | string, timeoutMs?: number): Promise<string>;
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
    onCaptureScreenshot: null | (() => Promise<void>);
    /**
     * a call back called when the screen shot has been captured
     * @defaultValue  null
     */
    onScreenshotCaptured: null | (() => void);
    private takeScreenShot;
    /**
     * Content generator configuration for auto-generating cells
     */
    contentGenerator: AutoGenerateCellsOptions;
    /**
     * Shows the correct answer for quiz content
     * Must be implemented by specific cell types
     */
    showCorrectAnswer: () => void;
    /**
     * Handles showCorrectAnswer requests from parent
     */
    private handleShowCorrectAnswer;
    /**
     * Reverses TTS markup to plain text
     * @param innerHTML - HTML with TTS markup
     * @returns Promise resolving to plain text
     */
    reverseTTS(innerHTML: string): Promise<string>;
    /**
     * Processes an element's HTML to add TTS functionality
     * @param element - HTML element to process
     * @param size - play button size css units
     * @returns Promise that resolves when processing is complete
     */
    processTTS(element: HTMLElement, size: string): Promise<void>;
    /**
     * Attaches interactive TTS controls to elements with data-tts attribute
     * @param container - Container element to search within
     */
    private attachTTSControls;
    /**
     * Creates a TTS control button with play/stop functionality
     * @param element - Element containing the text to speak
     * @returns Configured button element
     */
    private createTTSButton;
    /**
     * Applies styling to TTS button
     */
    private styleTTSButton;
    /**
     * Gets SVG icons for TTS controls
     */
    private getTTSIcons;
    /**
     * Creates a speech utterance with appropriate voice settings
     */
    private createSpeechUtterance;
    /**
     * Opens a dialog in the parent application
     * @param options - Dialog configuration options
     */
    openDialog(options: {
        position?: string;
        fullscreen?: boolean;
        fullwidth?: boolean;
        maxwidth?: boolean;
        [key: string]: any;
    }): void;
    /**
     * close a dialog in the parent application
     */
    closeDialog(): void;
    /**
     * Requests data from parent application with timeout
     * @param eventName - Event name to request
     * @returns Promise with requested data
     */
    private requestDataFromParent;
    /**
     * Fetches notebook metadata from parent application
     */
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
    onReady<T>(callback: (data: T) => number): void;
    /**
     * Registers an error callback
     * @param callback - Function to execute on errors
     */
    onError(callback: (error: Error) => void): void;
    /**
     * Notifies all registered ready callbacks
     */
    private notifyReady;
    /**
     * Triggers error callbacks and logs error
     */
    private triggerError;
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
export declare const createNotebookSDK: (config: Config) => NotebookSDK;
export {};
