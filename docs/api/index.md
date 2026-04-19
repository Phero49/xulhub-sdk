# SDK Core API

The core of the SDK is accessed via the `NotebookSDK` instance, typically created using `createNotebookSDK`.

## `createNotebookSDK(config)`

Initializes the SDK and returns a `NotebookSDK` instance.

- **Arguments**:
  - `config`: `Config` (optional)
    - `height`: string (e.g., `'500px'`) - Initial height of the iframe.
    - `hasAutoGen`: boolean - Enables AI auto-generation features.
    - `hideVerifyAnswerButton`: boolean - Hides the host's default check button.

## Properties

### `isPublished`
- **Type**: `boolean`
- `true` if the cell is being viewed by a student (read-only/interactive mode).
- `false` if the cell is in the editor (edit mode).

### `score`
- **Type**: `number`
- The current score for this cell.

### `cellIndex`
- **Type**: `number`
- The index of the current cell in the notebook.

### `quizManager`
- **Type**: `QuizManager`
- Instance of the [Quiz Manager](./quiz-manager) for handling exercise logic.

## Methods

### `onReady(callback)`
Registers a handler that runs when the SDK completes initialization.
- **Callback Signature**: `(data: T | null) => number | void`
- The callback receives the saved content data.
- It can optionally return a number representing the maximum possible score for this cell.

### `saveContent(data)`
Saves the exercise configuration data. (Mainly used in Edit Mode).
- **Arguments**:
  - `data`: Any JSON-serializable object, array, or string.

### `getContentData<T>()`
Returns the current content data stored in the SDK.

### `uploadFile(file)`
Uploads a file to the XulHub host and returns a URL.
- **Arguments**:
  - `file`: `File | Blob | string` (Base64 string supported).
- **Returns**: `Promise<string>` (The public URL of the uploaded file).
- **Throws**: Error if file exceeds 3.5MB or if the type is not allowed.

### `openDialog(options)`
Requests the host application to open a modal dialog.
- **Arguments**:
  - `options`: Object containing layout preferences (`position`, `fullscreen`, etc.).

### `getNotebookMetadata()`
Fetches metadata about the entire notebook.
- **Returns**: `Promise<NotebookMeta>`

## TTS (Text-to-Speech)

### `processTTS(element, size)`
Enriches an HTML element with TTS play buttons. It scans for elements with `data-tts` attributes.
- **Arguments**:
  - `element`: `HTMLElement` - The container to process.
  - `size`: `string` - The size of the play button (e.g., `'24px'`).

### `reverseTTS(html)`
Removes TTS markup from a string and returns plain text.
