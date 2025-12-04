import type {
  Cell,
  NotebookMeta,
  ReferenceObject,
  Source as Resource,
} from "../../types";
import { QuizManager } from "../quizMananger";
import { checkCell, sendMessageToClient } from "../utils/utils";

/**
 * Notebook SDK Interface for extending the application functionality
 *
 * @remarks
 * This SDK provides extensions with access to notebook data, metadata, and persistence capabilities.
 * All extensions run in a sandboxed iframe environment and communicate with the host via postMessage.
 *
 * @example
 * ```typescript
 * // Basic usage
 * notebookSDK.onReady(async () => {
 *   const cells = await notebookSDK.getNotebookCells();
 *   const meta = await notebookSDK.getNotebookMeta();
 *   // Process and save data
 *   notebookSDK.save(processedData);
 * });
 * ```
 *
 * @public
 */
export interface NotebookSDK {
  /**
   * The total score this exercise provides
   *
   * @remarks
   * The score calculation depends on the exercise type:
   * - Multiple choice: 1 point per correct answer
   * - Matching: Sum of all possible correct matches
   * - Custom: Extension-defined scoring logic
   *
   * @example
   * ```typescript
   * const currentScore = notebookSDK.calculatedScore;
   * ```
   */
  calculatedScore: number;

  /**
   * Indicates whether the SDK is ready to communicate with the host application
   *
   * @remarks
   * Use `onReady()` callback instead of polling this property directly
   */
  isReady: boolean;

  published: boolean;
  cellIndex: number;
  cellContentPosition: number;
  quizManager: QuizManager;

  /**
   * Retrieves metadata about the current notebook
   *
   * @returns Promise resolving to NotebookMeta object
   *
   * @example
   * ```typescript
   * const meta = await notebookSDK.getNotebookMeta();
   * console.log(`Notebook: ${meta.title}, Created: ${meta.createdAt}`);
   * ```
   */
  getNotebookMeta(): Promise<NotebookMeta>;

  /**
   * Retrieves the data of the **current cell content**.
   *
   * @typeParam T - The expected data type of the cell content.
   * @returns Promise resolving to the data of type T.
   *
   * @example
   * // For a text cell content
   * const textData = await notebookSDK.getCellContentData<{ text: string }>();
   * console.log(textData.text); // "Handle event listeners"
   *
   * // For a chart cell content
   * interface ChartData {
   *   values: number[];
   *   labels: string[];
   * }
   * const chartData = await notebookSDK.getCellContentData<ChartData>();
   */
  getCellContentData<T>(): T;
  /**
   * Saves your updated cell content.
   *
   * Pass the same kind of data you received in `cellContentData`.
   * The host will persist it automatically.
   *
   * @param data - Your updated cell content (must be serializable)
   *
   * @example
   * sdk.save({ chartType: 'line', values: [1, 2, 3] });
   */
  save<T>(data: T): void;

  /**
   * Registers a callback for when the SDK is ready
   *
   * @param callback - Function to execute when SDK is initialized
   * @param config
   *
   * @remarks
   * The callback will be executed immediately if the SDK is already ready.
   * This is the preferred way to ensure the SDK is initialized before use.
   *
   * @example
   * ```typescript
   * notebookSDK.onReady(() => {
   *   // Safe to call SDK methods here
   *   const cells = await notebookSDK.getNotebookCells();
   * });
   * ```
   */
  onReady(callback: () => void, config?: Config): void;

  /**
   * Registers a callback for SDK errors
   *
   * @param callback - Function to execute when errors occur
   *
   * @example
   * ```typescript
   * notebookSDK.onError((error) => {
   *   console.error('SDK Error:', error.message);
   *   showErrorToUser(error);
   * });
   * ```
   */
  onError(callback: (error: Error) => void): void;

  /**
   * Converts inline TTS markup into interactive play/pause buttons.
   *
   * Markup format:
   *   ▶️[lang_code][hide] text to read ⏸️
   *
   * - ▶️ indicates the starting point of TTS.
   * - ⏸️ marks the stopping point.
   * - [lang_code] specifies the language for TTS (e.g. "en", "ja").
   * - [hide] is optional: if present, the text between ▶️ and ⏸️ will not be visible to users,
   *   but will still be read aloud by the TTS engine.
   *
   * Example:
   *   "▶️[en][hide] Hello world ⏸️"
   *   → Produces a button that triggers TTS in English, with hidden text.
   *
   * @param el - HTML element containing annotated TTS markup.
   * @returns Updated HTML string with markup replaced by interactive buttons.
   */
  processTTs(el: HTMLElement): Promise<void>;

  /**
   * Reverts interactive TTS buttons back into their original inline markup format.
   *
   * Example:
   *   Button-generated HTML → "▶️[en][hide] Hello world ⏸️"
   *
   * @param innerHTML - HTML string containing TTS buttons.
   * @returns HTML string restored to original annotated TTS markup.
   */
  reverseTTS(innerHTML: string): Promise<string>;
  /**
   * Opens a dialog with flexible configuration.
   *
   * Supported properties:
   * - position?: string — where the dialog should appear (e.g. 'top', 'bottom', 'left', 'right', 'center')
   * - fullscreen?: boolean — if true, dialog takes up the entire screen
   * - fullwidth?: boolean — if true, dialog stretches to fill the viewport width
   * - maxwidth?: boolean — if true, dialog respects a maximum width constraint
   * - Any other dialog-related properties supported by the host environment
   *
   * Example:
   *   openDialog({
   *     title: 'Hello',
   *     message: 'World',
   *     position: 'bottom',
   *     fullscreen: false,
   *     fullwidth: true,
   *     maxwidth: true
   *   })
   *
   * @param options - Configuration object containing dialog options.
   * @returns void
   */
  openDialog(options: {
    position?: "standard" | "top" | "right" | "bottom" | "left";
    fullscreen?: boolean;
    fullwidth?: boolean;
    maxwidth?: boolean;
  }): void;

  _registerEvent: (event: string, callback: (data: any) => any) => void;

  get position(): {
    cellIndex: number;
    contentPosition: number;
  };

  /**
   * Generates example content for a cell and processes it using `processImport`.
   *
   * @param options.contentType - 'htmlElement' | 'markdown' | 'json' – format of generated content
   * @param options.instructionFormat - Plain-text instruction or prompt to generate content
   * @param options.processImport - Function that converts generated content into a structured cell
   *
   * @example
   * autoGenerate({
   *   contentType: 'htmlElement',
   *   instructionFormat: 'Generate a multiple-choice question about photosynthesis with 4 options',
   *   processImport
   * });
   */

  /**
   *
   * called if user clicks show answer
   */
  showCorrectAnswer: () => void;
}

/**
 * Configuration options for the component
 *
 * @property `height` - The height of the content area. Use CSS values like "100px", "50%", or "auto"
 * @property `hideCheckButton` - Whether to hide the default check button. Set to `true` if implementing a custom check button within the cell content
 *@property `hasAutoGen` - Whether the extension supports auto-generated cells. Set to `true` if your extension supports importing and implements `autoGenerateCells`
 * @property `background` - Optional background color to override the default  background. Use CSS color values
 */
export type Config = {
  /**
   * Height of the content area. Accepts CSS values like "100px", "50%", or "auto"
   * @default "auto"
   */
  height?: string;

  /**
   * Hide the default check button. Use this when implementing a custom check button within the cell content
   * @default false
   */
  hideCheckButton?: boolean;
  /**
   * Hide the footer. Use this when implementing a custom check button within the cell content
   * @default false
   */
  hideFooter?: boolean;

  /**
   * Enable auto-generation support. Set to true if your extension supports importing and implements `autoGenerateCells`
   * @default false
   */
  hasAutoGen?: boolean;

  tryagain?: boolean;
  sessionID?: string;
};
/**
 * in this function you can write code that process the user input into a valid cell content data structure your app accept
 * @param input the input entered by the user
 */
/**
 * Converts preprocessed user input into a structured cell that your extension can display.
 *
 * `ProcessImport` is called by the SDK after the host app has prepared the content:
 *  - **HTML content**: Host app parses the pasted input into an `HTMLElement` and sends its `innerHTML`.
 *    The SDK reconstructs it into a `Document` before passing it to this function.
 *  - **Markdown content**: Host app sends the raw string as-is.
 *  - **JSON content**: Host app sends the object directly.
 *
 * Your implementation should transform the received input into a format your extension understands
 * (for example, an exercise cell, note, or any custom interactive content).
 *
 * @param input - The preprocessed content provided by the host app. Can be:
 *   - `string` (Markdown)
 *   - `HTMLElement` (HTML content)
 * @returns An array of objects describing the generated cell(s), or `null` if no cell was created:
 *   - `cellType`: `'exercise' | 'note'` – indicates the type of the cell.
 *   - `cellContent`: structured content accepted by your extension.
 *   - `text`: optional initial text (e.g., a question or prompt) to display in the new cell.
 */
export type ProcessImport = (
  input: string | HTMLElement
) => ProcessImportOutPut[] | null;

/**
 * Represents the output of processing an imported cell.
 */
export type ProcessImportOutPut = {
  /** The type of cell, either an exercise or a note */
  cellType: "exercise" | "note";

  /** The structured content of the cell */
  cellContent: any;

  /** Optional initial text for the cell */
  text: string | null;
};

/**
 * Options for automatically generating cells.
 */
export type AutoGenerateCellsOptions = {
  /**
   * The type of content being passed for processing.
   * - `"htmlElement"`: content is an HTML element
   * - `"markdown"`: content is a markdown string
   * - `"json"`: content is a JSON object
   * - `null`: unspecified or unknown content type
   */
  contentType: "htmlElement" | "markdown" | "json" | null;

  /**
   * The instruction prompt to guide the cell generation process.
   * For example, a template or task description for generating exercises.
   */
  instructionFormat: string | null;

  /** Function to process imported content into a `ProcessImportOutPut` */
  processImport: ProcessImport;
};

interface connectPayload {
  cellContentData: any | null;
  cellIndex: number;
  contentPosition: number;
  calculatedScore?: number;
  published: boolean;
  getMeta: boolean;
}
