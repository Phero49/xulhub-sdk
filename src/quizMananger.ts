import type { NotebookSDK } from "./types/bridge";
import { sendMessageToClient } from "./utils/utils";

interface QuizManagerInter {
  /**
   * The total achievable score for the cell content.
   *
   * - For multiple-choice questions, this might be 1.
   * - For matching questions, it could be the sum of all correct matches.
   */
  totalScore: number;

  /**
   * Verifies the user's answer and returns the result.
   *
   * @returns An object containing:
   *  - `passed`: `true` if the user passed, `false` if they failed.
   *  - `points`: Number of points awarded (0 if failed).
   *  - `next`: Whether the next question should be prompted.
   *
   * Notes:
   * - For multiple-choice questions, `next` can be true immediately after an answer.
   * - For matching questions, `next` can become true after all matches are completed.
   */
  verifyAnswer: () =>
    | { passed: boolean; points: number; next: boolean }
    | undefined;

  /**
   * Called whenever the user provides an answer.
   *
   * @returns An object containing:
   *  - `next`: true if the host should advance immediately (e.g. instant verification).
   *            false if the host must still trigger `verifyAnswer` (e.g. MCQ with external check).
   */
  answered({
    next,
    passed,
    points,
  }: {
    passed: boolean;
    points: number;
    next: boolean;
  }): void;


  nextCell(): void;
  previous(): void;
}
export class QuizManager implements QuizManagerInter {
  public totalScore = 0;
  cellIndex: number = -1;
  contentPosition: number = -1;

  private get position() {
    return {
      cellIndex: this.cellIndex,
      contentPosition: this.contentPosition,
    };
  }

  public verifyAnswer: () => {
    passed: boolean;
    points: number;
    next: boolean;
  } = () => {
    throw new Error("verifyAnswer must be implemented before use");
  };

  public answered({
    next,
    passed,
    points,
    playSound = false,
  }: {
    passed: boolean;
    points: number;
    next: boolean;
    playSound?: boolean;
  }): void {
    window.parent.postMessage(
      {
        event: "answered",
        data: {
          payload: { next, passed, points, playSound },
          contentPosition: this.contentPosition,
          cellIndex: this.cellIndex,
        },
      },
      "*"
    );
  }

  private handleError: (err: any) => void;
  private registerEvent: NotebookSDK['_registerEvent'];

  constructor(
    handleError: (err: any) => void,
    cellIndex: number,
    contentPosition: number,
    registerEvent: NotebookSDK['_registerEvent']
  ) {
    this.handleError = handleError;
    this.contentPosition = contentPosition;
    this.cellIndex = cellIndex;
    this.registerEvent = registerEvent;

    console.log(cellIndex, contentPosition, "cells added");

    this.initialize();
  }

  nextCell(): void {
    sendMessageToClient({
      event:'nextCell',
      data:{
        ...this.position,
        payload:null
      }
    })
    // implement your logic
  }

  previous(): void {
   sendMessageToClient({
      event:'previousCell',
      data:{
        ...this.position,
        payload:null
      }
    })
  }

  showVerificationButton() {
    sendMessageToClient({
      event: "showVerificationButton",
      data: {
        cellIndex: this.cellIndex,
        contentPosition: this.contentPosition,
        payload: null,
      },
    });
  }

  set setTotalScore(score: number) {
    this.totalScore = score;
  }

  private initialize(): void {
    // Use registerEvent instead of window.addEventListener
    this.registerEvent("verifyAnswer", () => {
      const data = this.verifyAnswer();
      window.parent.postMessage(
        {
          event: "verificationResults",
          data: {
            payload: data,
            contentPosition: this.contentPosition,
            cellIndex: this.cellIndex,
          },
        },
        "*"
      );
    }); 
  }
}
