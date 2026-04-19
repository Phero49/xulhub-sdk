# Example: True or False Exercise

This example shows how to build a True or False exercise using Vue 3 and XulHub SDK.

## Key Logic

### 1. SDK Initialization

We initialize the SDK and set up the `onReady` hook to handle both Edit and Published modes.

```typescript
import { createNotebookSDK, createFileUploadArea } from "xulhub-sdk";

const sdk = createNotebookSDK({ height: "370px" });

sdk.onReady((loadedData) => {
  if (sdk.isPublished) {
    // STUDENT MODE
    if (loadedData) {
      // Store the correct answer internally but don't show it yet
      correctAnswer = loadedData.answer;
      // Show exercise data without the answer
      displayData = { ...loadedData, answer: undefined };
    }

    // Define how to verify the answer
    sdk.quizManager.verifyAnswer = () => {
      const passed = userSelectedAnswer === correctAnswer;
      return {
        passed: passed,
        points: passed ? 1 : 0,
        next: true
      };
    };

    // Reset when user retries
    sdk.quizManager.onTryAgain = () => {
      userSelectedAnswer = null;
    };
  } else {
    // EDITOR MODE
    if (loadedData) {
      editorData = loadedData;
    }
  }
});
```

### 2. Saving Content (Editor)

In edit mode, whenever the creator changes the question or the correct answer, we persist it:

```typescript
function selectCorrectAnswer(answer: boolean) {
  if (!sdk.isPublished) {
    editorData.answer = answer;
    sdk.saveContent(editorData);
  } else {
    // In student mode, just record their choice
    userSelectedAnswer = answer;
    // Show the "Check" button
    sdk.quizManager.showVerificationButton();
  }
}
```

### 3. Handling Media Uploads

Using `createFileUploadArea` to allow creators to add images or audio to the exercise.

```typescript
function openUploadDialog(type: 'image' | 'audio') {
  // ... open modal ...
  nextTick(() => {
    createFileUploadArea(dropZoneElement, {
      acceptedFiles: [type === "audio" ? "audio/*" : "image/*"],
      expectedFileOutput: "string",
      success: (base64) => {
        // Save to our data structure
        editorData.media.push({ type, data: base64 });
        sdk.saveContent(editorData);
      },
    });
  });
}
```

## Complete Application Structure

A typical True or False app would have:
1. **Display Section**: Shows text, images, or audio from `loadedData`.
2. **Action Section**: Two buttons ("True" and "False").
3. **Admin Section** (Hidden in published mode): Controls to edit text, upload media, and set the correct answer.
