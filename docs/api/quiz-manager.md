# Quiz Manager

The `QuizManager` handles the interactive logic of an exercise, such as scoring and feedback. It is accessible via `sdk.quizManager`.

## Properties

### `verifyAnswer`
This property **must** be assigned a function that returns the result of the exercise evaluation.
- **Type**: `() => VerificationResult`
- **VerificationResult Object**:
  - `passed`: `boolean` - Whether the user got the answer right.
  - `points`: `number` - The score to award for this attempt.
  - `next`: `boolean` - Whether the host should allow navigation to the next cell.
  - `userAnswer`: `string | undefined` - The student's response string (optional, for storage/AI review).
  - `correctAnswer`: `string | undefined` - The expected correct answer string (optional, for storage/AI review).
- **Example**:
  ```typescript
  sdk.quizManager.verifyAnswer = () => {
    return {
      passed: true,
      points: 10,
      next: true,
      userAnswer: "Paris",
      correctAnswer: "Paris"
    };
  };
  ```

## Methods

### `showVerificationButton()`
Displays the "Check Answer" button in the XulHub interface footer.

### `hideVerificationButton()`
Hides the "Check Answer" button.

### `submitAnswerResults(options)`
Manually reports answer results to the host.
- **Options**:
  - `passed`: `boolean`
  - `points`: `number`
  - `next`: `boolean`
  - `playSound`: `boolean` (default: `true`)

### `onTryAgain(callback)`
Registers a handler that runs when the user wants to restart the exercise.

### `playCorrectSound()` / `playIncorrectSound()`
Triggers the host to play success or failure audio feedback.

### `completed()`
Signals that the entire exercise/interaction is finished.

### `goToNextCell()` / `goToPreviousCell()`
Commands the host to navigate the notebook.

### `updateTotalScore(score)`
Sets the maximum possible score for this exercise. (Used for grading weights).

## AI Verification

### `verifyWithAi<T>(inputData, prompt, outputSchema)`
Sends user input to XulHub's AI engine for evaluation.
- **Arguments**:
  - `inputData`: The content to be checked (e.g., an essay or spoken text).
  - `prompt`: Instructions for the AI grader.
  - `outputSchema`: A template object that defines the structure of the expected AI response.
- **Returns**: `Promise<T>` (The AI's evaluation matched to your schema).
