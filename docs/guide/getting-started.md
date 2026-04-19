# Getting Started

Learn how to integrate the XulHub SDK into your project and build your first interactive exercise.

## Installation

You can install the SDK using your favorite package manager:

```bash
npm install xulhub-sdk
# or
yarn add xulhub-sdk
# or
bun add xulhub-sdk
```

## Basic Setup

Once installed, you can initialize the SDK in your main entry file (e.g., `main.ts` or `App.vue`).

### 1. Initialize the SDK

```typescript
import { createNotebookSDK } from 'xulhub-sdk';

const sdk = createNotebookSDK({
  height: '400px', // Set default height for the iframe
  hasAutoGen: true  // Enable AI-powered auto-generation if supported
});
```

### 2. Handle Initialization

The `onReady` method is triggered once the SDK has established a connection with the host and retrieved any existing data.

```typescript
sdk.onReady((data) => {
  if (sdk.isPublished) {
    // Mode: Published (Student viewing)
    console.log('Running in interactive mode with data:', data);
    setupExercise(data);
  } else {
    // Mode: Edit (Creator designing)
    console.log('Running in editor mode with data:', data);
    setupEditor(data);
  }
});
```

### 3. Save Exercise Data (Edit Mode)

When the creator makes changes to the exercise configuration, save the data back to XulHub.

```typescript
function saveMyExercise(config) {
  sdk.saveContent(config);
}
```

### 4. Verify Answers (Published Mode)

When the student submits their answer, use the `QuizManager` to validate it.

```typescript
sdk.quizManager.verifyAnswer = () => {
    const isCorrect = checkUserAnswer();
    return {
        passed: isCorrect,
        points: isCorrect ? 1 : 0,
        next: isCorrect,
        userAnswer: getUserAnswerAsString(),
        correctAnswer: getCorrectAnswerAsString()
    };
};

// Call this to show the "Check Answer" button in the XulHub footer
sdk.quizManager.showVerificationButton();
```

## Next Steps

Now that you have the basics down, explore the [Lifecycle](./lifecycle) and [API Reference](../api/) to learn about advanced features like file uploads and AI verification.
