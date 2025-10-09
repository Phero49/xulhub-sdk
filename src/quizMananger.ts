import type { NotebookSDK } from "./types/bridge";
import { sendMessageToClient } from "./utils/utils";

/**
 * QuizManager - Manages quiz/exercise functionality within notebook cells
 * 
 * Handles answer verification, scoring, navigation between cells,
 * and communication with the parent application for quiz-related events.
 */
export class QuizManager {
  // ============================================================================
  // Properties
  // ============================================================================
  
  /** Total accumulated score for this quiz content */
  public totalScore = 0;
  
  /** Index of the cell containing this quiz */
  private cellIndex: number = -1;
  
  /** Position of this content within the cell */
  private contentPosition: number = -1;
  
  /** Error handler function from parent SDK */
  private handleError: (err: any) => void;
  
  /** Event registration function from parent SDK */
  private registerEvent: NotebookSDK['_registerEvent'];

  // ============================================================================
  // Initialization
  // ============================================================================

  constructor(
    handleError: (err: any) => void,
    cellIndex: number,
    contentPosition: number,
    registerEvent: NotebookSDK['_registerEvent']
  ) {
    this.handleError = handleError;
    this.cellIndex = cellIndex;
    this.contentPosition = contentPosition;
    this.registerEvent = registerEvent;

    console.log(`QuizManager initialized for cell ${cellIndex}, position ${contentPosition}`);
    
    this.setupEventHandlers();
  }

  /**
   * Gets the current cell position for message routing
   */
  private get position() {
    return {
      cellIndex: this.cellIndex,
      contentPosition: this.contentPosition,
    };
  }

  /**
   * Sets up event handlers for quiz verification
   */
  private setupEventHandlers(): void {
    this.registerEvent("verifyAnswer", () => {
      try {
        const results = this.verifyAnswer();
        this.sendVerificationResults(results);
      } catch (error) {
        this.handleError(error);
      }
    });
  }

  // ============================================================================
  // Answer Verification
  // ============================================================================

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
  public verifyAnswer: () => {
    passed: boolean;
    points: number;
    next: boolean;
  } = () => {
    throw new Error("verifyAnswer must be implemented before use");
  };

  /**
   * Sends verification results to the parent application
   */
  private sendVerificationResults(results: {
    passed: boolean;
    points: number;
    next: boolean;
  }): void {
    window.parent.postMessage(
      {
        event: "verificationResults",
        data: {
          payload: results,
          contentPosition: this.contentPosition,
          cellIndex: this.cellIndex,
        },
      },
      "*"
    );
  }

  /**
   * Notifies parent application that user has answered a question
   * Triggers visual/audio feedback and score updates
   * 
   * @param options - Answer result details
   * @param options.passed - Whether the answer was correct
   * @param options.points - Points awarded for this answer
   * @param options.next - Whether user can proceed to next question
   * @param options.playSound - Whether to play feedback sound (default: false)
   */
  public submitAnswer({
    passed,
    points,
    next,
    playSound = false,
  }: {
    passed: boolean;
    points: number;
    next: boolean;
    playSound?: boolean;
  }): void {
    sendMessageToClient({
      event: "answered",
      data: {
        ...this.position,
        payload: { passed, points, next, playSound },
      },
    });
  }

  // ============================================================================
  // Score Management
  // ============================================================================

  /**
   * Updates the total score for this quiz
   * @param score - New total score value
   */
  public updateTotalScore(score: number): void {
    this.totalScore = score;
  }



  // ============================================================================
  // AI-Powered Verification
  // ============================================================================

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
  public verifyWithAi<T>(inputData: any, prompt: string, output: T): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      // Register error handler first
      this.registerEvent("verifyWithAiError", (errorData) => {
        reject(new Error(errorData.message || "AI verification failed"));
      });

      // Register success handler
      this.registerEvent("verifyWithAi", (response: T) => {
        resolve(response);
      });

      // Send verification request to parent's AI service
      sendMessageToClient({
        event: "verifyWithAi",
        data: {
          ...this.position,
          payload: {
            inputData,
            prompt,
            output, // Output schema helps AI format response correctly
          },
        },
      });
    });
  }


  // ============================================================================
  // UI Control
  // ============================================================================

  /**
   * Requests parent to show the answer verification button
   * Used when quiz is ready for user to submit their answer
   */
  public showVerificationButton(): void {
    sendMessageToClient({
      event: "showVerificationButton",
      data: {
        ...this.position,
        payload: null,
      },
    });
  }

  /**
   * Requests parent to hide the answer verification button
   * Used after answer is submitted or during quiz setup
   */
  public hideVerificationButton(): void {
    sendMessageToClient({
      event: "hideVerificationButton",
      data: {
        ...this.position,
        payload: null,
      },
    });

  } 
  
    /**
   * Requests parent to hide footer 
   * Used if you want implement your own check answer and continue button
   */
  public hideFooter(): void {
    sendMessageToClient({
      event: "hideFooter",
      data: {
        ...this.position,
        payload: null,
      },
    });
  }

  // ============================================================================
  // Navigation
  // ============================================================================

  /**
   * Navigates to the next cell in the notebook
   * Typically called after successful quiz completion
   */
  public goToNextCell(): void {
    sendMessageToClient({
      event: "nextCell",
      data: {
        ...this.position,
        payload: null,
      },
    });
  }

  /**
   * Navigates to the previous cell in the notebook
   * Allows users to review previous content
   */
  public goToPreviousCell(): void {
    sendMessageToClient({
      event: "previousCell",
      data: {
        ...this.position,
        payload: null,
      },
    });
  }


  // ============================================================================
  // Utility Methods
  // ============================================================================

  /**
   * Resets the quiz state
   * Clears score and any progress tracking
   */
  public reset(): void {
    this.totalScore = 0;
    sendMessageToClient({
      event: "resetQuiz",
      data: {
        ...this.position,
        payload: null,
      },
    });
  }

  /**
   * Requests hints for the current question from parent
   * @param hintLevel - Optional hint level (1-3 for progressive hints)
   */
  public requestHint(hintLevel?: number): void {
    sendMessageToClient({
      event: "requestHint",
      data: {
        ...this.position,
        payload: { hintLevel },
      },
    });
  }
}
