# Notebook Structure

To build effective extensions, it's important to understand how XulHub organizes content. A XulHub **Notebook** is a hierarchical structure of metadata and cells.

## The Hierarchy

1.  **Notebook**: The top-level document (e.g., "Biology 101").
2.  **Cell**: A single unit of content or an exercise within the notebook.
3.  **Content Block**: Individual items inside a cell (Text, Images, YouTube, or **Third-Party Extensions**).

---

## 1. Notebook Metadata
Every notebook has metadata that describes its state, ownership, and configuration.
- **Name/Title**: The name of the notebook.
- **Published**: Whether the notebook is in draft or live mode.
- **Category**: Determines the general behavior (e.g., `mixed`, `quiz`).

## 2. Cells
A notebook is composed of an array of cells. Each cell has:
- **`cellType`**: Either `'notes'` (purely instructional) or `'question'` (graded).
- **`label`**: A label for the cell (e.g., "Q1", "Intro").
- **`contents`**: An array of different content blocks.

## 3. Third-Party Extension Block
This is where your SDK-powered application lives. Within the `contents` array of a cell, your extension appears as a block with the type `thirdParty`.

### Data Structure of an Extension Block:
- **`source`**: The URL of your application (running in an iframe).
- **`extensionData`**: The actual JSON data you manage via `sdk.saveContent()` and receive in `sdk.onReady()`.
- **`id`**: A unique identifier for the block instance.

### Example representation:
```json
{
  "cellType": "question",
  "label": "Vocabulary Check",
  "contents": [
    {
      "contentType": "text",
      "data": { "text": "Match the words with their definitions:" }
    },
    {
      "contentType": "thirdParty",
      "data": {
        "source": "https://my-exercise-app.com",
        "extensionData": {
          "pairs": [ { "word": "Apple", "def": "A red fruit" } ]
        },
        "id": "ext-123"
      }
    }
  ]
}
```

By understanding this structure, you can see that your extension sits alongside other standard XulHub blocks, allowing for a rich, mixed-media learning experience.
