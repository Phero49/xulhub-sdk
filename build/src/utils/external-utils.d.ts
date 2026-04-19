/**
 * Drag-and-drop, click-to-upload, AND paste-to-upload file handler.
 *
 * @param {HTMLElement} container The drop/click/paste target.
 * @param {Object} opts Configuration options.
 * @param {(ev:DragEvent)=>void} [opts.onDrag] Fired on dragover.
 * @param {(ev:DragEvent)=>void} [opts.onDrop] Fired on raw drop.
 * @param {(ev:ClipboardEvent)=>void} [opts.onPaste] Fired on raw paste.
 * @param {(file: File|string)=>("string"|void)} opts.success
 *        Return "string" to receive Base64 instead of File.
 * @param {number} [opts.maxSize] Max file size in bytes. Optional.
 * @param {string[]} [opts.acceptedFiles] Allowed MIME types, e.g. ["image/png","video/mp4"].
 * @param {"string"|"file"} [opts.expectedFileOutput] Force return type: "string" for Base64, "file" for File object.
 * @throws throws an error when creation failed or file validation fails
 */
export declare function createFileUploadArea(container: HTMLElement, { onDrag, onDrop, onPaste, success, maxSize, acceptedFiles, expectedFileOutput, }: {
    onDrag?: (ev: DragEvent) => void;
    onDrop?: (ev: DragEvent) => void;
    onPaste?: (ev: ClipboardEvent) => void;
    success: (file: File | string) => "string" | void;
    maxSize?: number;
    acceptedFiles?: string[];
    expectedFileOutput?: "string" | "file";
}): void;
export declare function createSpeechUtterance(text: string, languageCode: string): {
    play(): void;
    stop(): void;
    isPlaying(): boolean;
    setText(newText: string): void;
    setRate(rate: number): void;
    setPitch(pitch: number): void;
    getUtterance(): SpeechSynthesisUtterance;
    setVolume(volume: number): void;
};
/**
 * Escapes HTML special characters in a string to prevent XSS attacks.
 *
 * Converts the following characters to their HTML entity equivalents:
 * - `&` → `&amp;`
 * - `<` → `&lt;`
 * - `>` → `&gt;`
 * - `"` → `&quot;`
 * - `'` → `&#39;`
 * - `` ` `` → `&#96;`
 *
 * @param text - The string to escape
 * @returns The escaped string with HTML special characters converted to entities
 *
 * @example
 * ```typescript
 * escapeHtml('<script>alert("XSS")</script>');
 * // Returns: '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;'
 * ```
 */
export declare function escapeHtml(text: string): string;
