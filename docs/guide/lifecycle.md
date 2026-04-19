# SDK Lifecycle

Understanding the lifecycle of an exercise cell is crucial for building robust integrations.

## 1. Handshake
When your application loads inside an iframe, the SDK automatically sends a `reconnect` or `sdkReady` message to the host. The host responds with a `connect` event containing the cell's configuration and saved data.

## 2. Initialization (`onReady`)
The `onReady` callback is the safest place to start your application logic. It ensures that:
- The SDK is fully connected.
- You know whether you are in **Edit** or **Published** mode.
- Any previously saved `contentData` has been retrieved.

```typescript
sdk.onReady((loadedData) => {
  // Your app initialization logic here
});
```

## 3. Interaction & Persistence
Depending on the mode, the cell's behavior changes:

### Edit Mode
- The user configures the exercise (e.g., enters a question, selects correct options, uploads images).
- You should call `sdk.saveContent(data)` whenever a change is made. This persists the data to the XulHub database.

### Published Mode
- The user interacts with the exercise.
- Use `sdk.quizManager.verifyAnswer` to define how the answer is checked.
- Use `sdk.quizManager.showVerificationButton()` to let XulHub manage the "Check Answer" UI.
- Call `sdk.quizManager.submitAnswerResults({...})` if you want to trigger the success/failure feedback (sounds and animations) manually.

## 4. Resetting (`onTryAgain`)
In Published Mode, if the user gets the answer wrong, they might click "Try Again". You should listen for this event to reset your internal UI state.

```typescript
sdk.quizManager.onTryAgain(() => {
  // Reset user selections, clear feedback, etc.
  myUserState.value = null;
});
```

## 5. Completion
Once an exercise is finished (e.g., multiple steps complete), you can notify the host.

```typescript
sdk.quizManager.completed();
```
This helps XulHub track progress and move the student forward in the course content.
