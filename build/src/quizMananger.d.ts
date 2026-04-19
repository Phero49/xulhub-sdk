import type { NotebookSDK } from "../types";
/**
 * QuizManager - Manages quiz/exercise functionality within notebook cells
 *
 * Handles answer verification, scoring, navigation between cells,
 * and communication with the parent application for quiz-related events.
 */
export declare class QuizManager {
    /** Total accumulated score for this quiz content */
    totalScore: number;
    /** Index of the cell containing this quiz */
    private cellIndex;
    /** Position of this content within the cell */
    private contentPosition;
    /** Error handler function from parent SDK */
    private handleError;
    /** Event registration function from parent SDK */
    private registerEvent;
    private sendToParent;
    constructor(handleError: (err: any) => void, cellIndex: number, contentPosition: number, registerEvent: NotebookSDK["_registerEvent"], sendToParent: (event: string, payload?: any) => void);
    /**
     * Gets the current cell position for message routing
     */
    private get position();
    /**
     * Sets up event handlers for quiz verification
     */
    private setupEventHandlers;
    /**
     * Verification function that must be implemented by the quiz content.
     * This should contain the logic to check if the user's answer is correct.
     *
     * @returns Object containing verification results
     * @throws Error if not implemented before use
     *
     * @example
     * quizManager.verifyAnswer = () => {
     *   const userAnswer = getUserInput();
     *   const isCorrect = userAnswer === correctAnswer;
     *   return {
     *     passed: isCorrect,
     *     points: isCorrect ? 10 : 0,
     *     next: isCorrect // Allow progression if correct
     *   };
     * };
     */
    verifyAnswer: () => {
        passed: boolean;
        points: number;
        next: boolean;
        userAnswer?: string;
        correctAnswer?: string;
    };
    /**
     * Sends verification results to the parent application
     */
    private sendVerificationResults;
    /**
     * Called when a user submits an answer.
     * Notifies the parent app about the result, updates accumulative points,
     * optionally plays a sound, and allows the parent to save the result.
     *
     * @param options - Details of the answer result
     * @param options.passed - Whether the answer matches the expected result
     * @param options.points - Points awarded for this answer (added to accumulative score)
     * @param options.next - Whether the user can proceed to the next question
     * @param options.playSound - Whether to play feedback sound (default: false)
     */
    submitAnswerResults({ passed, points, next, playSound, }: {
        passed: boolean;
        points: number;
        next: boolean;
        playSound?: boolean;
    }): void;
    /**
     * Notify the parent context that an incorrect answer occurred so it can play the "incorrect" sound.
     *
     * Sends a message using `sendToParent` with two pieces of information:
     * - event: `"playSound"` — the event name the parent listens for to trigger feedback sounds.
     * - payload: `{ correct: true }` — an object whose `correct` property is `false` to indicate an incorrect response.
     *
     * @remarks
     * The parent or host is expected to handle the `"playSound"` event and play the appropriate audio when `payload.correct === false`.
     *
     * @returns void
     */
    playCorrectSound(): void;
    /**
     * Notify the parent context that an incorrect answer occurred so it can play the "incorrect" sound.
     *
     * Sends a message using `sendToParent` with two pieces of information:
     * - event: `"playSound"` — the event name the parent listens for to trigger feedback sounds.
     * - payload: `{ correct: false }` — an object whose `correct` property is `false` to indicate an incorrect response.
     *
     * @remarks
     * The parent or host is expected to handle the `"playSound"` event and play the appropriate audio when `payload.correct === false`.
     *
     * @returns void
     */
    playIncorrectSound(): void;
    /**
     * Notifies the parent application that the exercise has been completed.
     *
     * This method should be called when the user has finished all required
     * interactions with the exercise and no further actions are needed.
     *
     * @example
     * // When user completes a quiz
     * sdk.completed();
     *
     * @example
     * // When conversation reaches the end
     * if (currentStep >= totalSteps) {
     *   sdk.completed();
     * }
     *
     * @fires completed - Sends a "completed" event to the parent application
     *                   to indicate the exercise is finished.
     */
    completed(): void;
    /**
     * Updates the total score for this quiz
     * @param score - New total score value
     */
    updateTotalScore(score: number): void;
    /**
     * Registers a callback that runs when the user requests to retry the exercise.
     *
     * This method allows the exercise to handle "try again" or "reset" actions
     * initiated by the user or parent application. The callback should reset the
     * exercise to its initial state and clear any previous user inputs or progress.
     *
     * @example
     * // Basic usage - reset exercise state
     * sdk.onTryAgain(() => {
     *   userAnswers = [];
     *   currentStep = 0;
     *   resetUI();
     * });
     *
     * @example
     * // Chat exercise - reset conversation
     * sdk.onTryAgain(() => {
     *   emptyChat.messages = [];
     *   guide.value = '';
     *   botWrite(); // Restart the conversation
     * });
     *
     * @example
     * // Quiz exercise - reset answers and UI
     * sdk.onTryAgain(() => {
     *   selectedAnswers.clear();
     *   resetQuizUI();
     *   showQuestion(0);
     * });
     *
     * @param callback - Function to execute when try again is triggered.
     *                   This should reset the exercise to its initial state.
     */
    onTryAgain(callback: () => void): void;
    /**
     * Verifies user input using AI with a custom prompt and expected output format
     *
     * Sends the user's input to the parent application's AI service for evaluation.
     * Useful for open-ended questions, essay grading, code review, or complex answers
     * that require contextual understanding beyond simple pattern matching.
     *
     * @template T - The expected response type from AI verification
     * @param inputData - The user's answer/input to be verified (can be text, code, etc.)
     * @param prompt - Instructions for the AI on how to evaluate the input
     * @param output - Example/schema of expected AI response format
     * @returns Promise resolving to AI verification results in the specified format
     * @throws Error if AI verification fails or times out
     *
     * @example
     * // Grade an essay
     * const result = await quizManager.verifyWithAi(
     *   userEssay,
     *   "Grade this essay on clarity, grammar, and argument strength. Provide scores 0-10.",
     *   { clarity: 0, grammar: 0, argument: 0, feedback: "" }
     * );
     *
     * @example
     * // Verify code solution
     * const result = await quizManager.verifyWithAi(
     *   userCode,
     *   "Check if this code correctly implements bubble sort. Identify bugs if any.",
     *   { correct: false, bugs: [], suggestions: "" }
     * );
     *
     * @example
     * // Check mathematical reasoning
     * const result = await quizManager.verifyWithAi(
     *   userExplanation,
     *   "Evaluate if the student correctly explained the Pythagorean theorem.",
     *   { understands_concept: false, score: 0, missing_points: [] }
     * );
     */
    verifyWithAi<T>(inputData: any, prompt: string, output: T): Promise<T>;
    /**
     * Requests parent to show the answer verification button
     * Used when quiz is ready for user to submit their answer
     */
    showVerificationButton(): void;
    /**
     * Requests parent to hide the answer verification button
     * Used after answer is submitted or during quiz setup
     */
    hideVerificationButton(): void;
    /**
     * Requests parent to hide footer
     * Used if you want implement your own check answer and continue button
     */
    hideFooter(): void;
    /**
     * Navigates to the next cell in the notebook
     * Typically called after successful quiz completion
     */
    goToNextCell(): void;
    /**
     * Navigates to the previous cell in the notebook
     * Allows users to review previous content
     */
    goToPreviousCell(): void;
    /**
     * Resets the quiz state
     * Clears score and any progress tracking
     */
    reset(): void;
    /**
     * Requests hints for the current question from parent
     * @param hintLevel - Optional hint level (1-3 for progressive hints)
     */
    requestHint(hintLevel?: number): void;
}
