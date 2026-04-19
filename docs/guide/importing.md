# Importing Content (AI & Auto-Generation)

XulHub provides a powerful "Import" system that allows creators to transform external sources (like PDF tables or clipboard text) into structured exercise data using AI.

As an extension developer, you can define how your extension handles these imports.

## The `contentGenerator` Configuration

When initializing the SDK, you can provide a `contentGenerator` object. This tells XulHub how to process raw data intended for your extension.

```typescript
const sdk = createNotebookSDK({ 
  hasAutoGen: true 
});

sdk.contentGenerator = {
  contentType: 'htmlElement', // The format of data passed to processImport
  instructionFormat: 'Create a MCQ from a table with columns: Question, A, B, C, Correct',
  processImport: (input: HTMLElement | string) => {
    // Transform the raw input into your extension's data structure
    return [
       {
         cellType: 'exercise',
         cellContent: { ...myParsedData },
         text: null
       }
    ];
  }
};
```

---

## 1. `contentType`
Specifies the type of raw data the AI will provide to your `processImport` function.
- `'htmlElement'`: Passes a DOM element.
- `'text'`: Passes a plain string.

## 2. `instructionFormat`
A guiding prompt for the XulHub AI. This tells the AI how it should format the raw data (e.g., in a table or a specific list format) before passing it to your processor.

## 3. `processImport` Function
This function is the bridge between raw data and your extension.
- **Input**: The raw content (either a string or `HTMLElement` depending on `contentType`).
- **Output**: An array of `ProcessImportOutPut` objects.

### `ProcessImportOutPut` Structure:
- **`cellType`**: Set to `'exercise'` to target your extension.
- **`cellContent`**: The actual JSON data that will be saved to your extension's `extensionData` field.
- **`text`**: (Optional) If you want to prepend a separate text cell before your extension.

---

## Real-World Example

If your extension is a "True or False" activity, and the user imports a PDF table:

```typescript
export function processImport(p: HTMLElement | string): ProcessImportOutPut[] {
  const output: ProcessImportOutPut[] = [];
  const root = (typeof p === 'string') ? parseHtml(p) : p;

  const row = root.querySelector('tr');
  // ... parse logical columns ...

  output.push({
    cellType: 'exercise',
    cellContent: {
      statement: "The earth is flat.",
      answer: false,
      explanation: "Science says otherwise."
    }
  });

  return output;
}
```

By implementing this, you allow XulHub users to generate dozens of your custom exercises in seconds just by highlighting text in a PDF!
