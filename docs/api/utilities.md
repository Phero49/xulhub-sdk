# Utilities

The SDK exports several standalone utility functions to help with common tasks.

## `createFileUploadArea(container, options)`

Sets up a drag-and-drop and click-to-upload area on a DOM element.

- **Arguments**:
  - `container`: `HTMLElement` - The target element.
  - `options`:
    - `success`: `(file: File | string) => void` - Callback when a file is ready.
    - `maxSize`: `number` - Maximum file size in bytes.
    - `acceptedFiles`: `string[]` - Allowed MIME types (e.g., `['image/*']`).
    - `expectedFileOutput`: `'string' | 'file'` - Whether to return a Base64 string or a `File` object.

- **Example**:
  ```typescript
  import { createFileUploadArea } from 'xulhub-sdk';

  createFileUploadArea(myEl, {
      acceptedFiles: ['image/*'],
      expectedFileOutput: 'string',
      success: (base64) => {
          console.log('Image uploaded:', base64);
      }
  });
  ```

## `escapeHtml(text)`

Escapes HTML special characters in a string to prevent XSS.
- **Converts**: `&`, `<`, `>`, `"`, `'`, `` ` ``.

## `createSpeechUtterance(text, languageCode)`

A thinner wrapper around the Web Speech API `SpeechSynthesisUtterance`.
- **Returns**: An object with `play()`, `stop()`, `isPlaying()`, `setText()`, etc.
