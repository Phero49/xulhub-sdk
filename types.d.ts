// Define content types for the notebook
export type CellBlockContentType =
  | 'text'
  | 'chart'
  | 'table'
  | 'draw'
  | 'images'
  | 'youTube'
  | 'multiple choice options'
  | 'shortAnswer'
  | 'match pair'
  | 'word builder';

// Define content types for multiple choice blocks, excluding 'multiple choice options'
export type MultipleChoiceBlockContentType = Exclude<
  CellBlockContentType,
  'multiple choice options'
>;

// Interface for notebook chart data
export interface NotebookChartData {
  type: string;
  dataset: ChartDataset[];
  xTitle: string;
  yTitle: string;
}

// Interface for chart dataset
export interface ChartDataset {
  title: string;
  backgroundColor?: string;
  borderColor?: string;
  color?: string;
  borderWidth?: number;
  x: string[] | number[];
  y: string[] | number[];
}

// Type for table data
export type TableData = {
  title: string;
  tableData: {
    values: (number | string)[][];
    style?: {
      color?: string;
      background?: string;
      bold?: string;
      padding?: number;
    };
  };
};

// Supported chart types
export type SupportedCharts = 'bar' | 'pie' | 'line';

export interface MatchingPair {
  contentType: 'match pair';
  data: {
    [key: number]: {
      type: 'text' | 'image';
      data: string;
      id?: string;
      tag?: any;
    }[];
  };
}
export interface SequenceExercise {
  contentType: 'sequenceExercise';
  data: [
    {
      type: 'image' | 'text';
      data: string;
    }
  ];
}

export interface WordBuilder {
  contentType: 'word builder';
  data: {
    splitText: string[];
    splitBy: string;
  };
}
// Interface for content props
export interface ContentProps {
  cellNumber: number;
  source?: string;
  answerNumber?: number;
  answerContentPosition?: number;
  contentPosition: number;
  type?: string;
  contents?: any;
}

// Type for position
export type Position = {
  x: number;
  y: number;
};

// Interface for box
interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
  top: number;
  right: number;
  bottom: number;
  left: number;
}

// Type for size
type Size = { width: number; height: number };

// Type for image object
export type ImageObject = {
  src: string;
  scale: number;
  caption: string;
};

// Interface for notebook metadata
export interface NotebookMeta {
  userId: string;
  version: number;
  createdOn: Date;
  notebookId: string;
  category: string;
  name: string;
  published: boolean;
  description: string | null;
  tags: string | string[];
  userName: string;
}

// Type for vote notebook cell response
export type VoteNotebookCellResponse = {
  notebook_id: number;
  cell_number: number;
  vote_difference: number;
  user_vote: boolean;
  user_voted: boolean;
  comment_count: number;
};

// Interface for cell block contents

// Interfaces for different content types
interface TextData {
  contentType: 'text';
  data: {
    text: string;
  };
}

interface YoutubeVideoContent {
  contentType: 'youTube';
  data: { url: string };
}

interface TableContent {
  contentType: 'table';
  data: TableData;
}

interface ImageData {
  contentType: 'images';
  data: ImageObject[];
}

interface NotebookChart {
  contentType: 'chart';
  data: NotebookChartData;
}

export interface Draw {
  contentType: 'draw';
  data: any;
}
export interface ShortAnswerMath {
  contentType: 'math';
  data: {
    latex: string;
  };
}
// Interface for multiple choice contents
export interface MultipleChoiceContents {
  label: string;
  optionContent: MultipleChoiceBlockContents[];
}

export type shortAnswerContentData =
  | TextData
  | TableContent
  | NotebookChart
  | ShortAnswerMath;

export type CorrectShortAnswers = {
  [key: number]: {
    loc: number[];
    data: shortAnswerContentData[];
  };
};

export interface ShortAnswer {
  contentType: 'shortAnswer';
  data: shortAnswerContentData[];
}
// Interface for multiple choice options
interface MultipleChoiceOptions {
  contentType: 'multiple choice options';
  data: MultipleChoiceContents[];
  correctAnswer?: string;
}

interface AnnotationExercise {
  contentType: 'AnnotationExercise';
  data: {
    originalText: string;
    annotatedText: string;
  };
}
// Union type for all cell contents
export type CellBlockContents =
  | TextData
  | TableContent
  | ImageData
  | MultipleChoiceOptions
  | YoutubeVideoContent
  | NotebookChart
  | Draw
  | ShortAnswer
  | MatchingPair
  | AnnotationExercise
  | WordBuilder;

// Type for multiple block choice contents (excluding MultipleChoiceOptions)
export type MultipleChoiceBlockContents = Exclude<
  CellBlockContents | ShortAnswer,
  MultipleChoiceOptions
>;

// Interface for a cell
export interface Cell {
  cellType: 'notes' | 'question';
  label: string;
  refs?: string[];
  group?: string;
  contents: CellBlockContents[];
}


export type cellMode = 'draft' | 'comment' | 'published';

export type sourceType = 'pdfUrl' | 'url' | 'pdf' | 'offline';
export type OfflineSource = {
  type: 'offline';
  item: {
    title: string;
    url: string;
  };
};
export type ReferenceObject = {
  type: 'pdf' | 'markdown' | 'image' | 'url' | 'videoUrl';
  title: string;
  content: string | string[];
  referenceItem?: string;
  path?: string;
  id?: number | string;
};
export type Reference = {
  [title: string]: ReferenceObject;
};
type Source =
  | {
      type: 'pdfUrl' | 'url';
      item: string;
    }
  | OfflineSource
  | {
      type: 'pdf';
      item: { id: string; cover: string; title: string; url?: string };
    };

// Main interface for a question or note
export interface OutputEntry {
  type: 'question' | 'note';
  questionNumber: string | null; // Question number or null for notes
  correctAnswer?: string | null; // Included for questions, null if not applicable
  body: BodyElement[]; // Array of text, diagram, table, or chart elements
  multipleChoiceOptions?: MultipleChoiceOption[]; // Optional for questions
  expectedWrittenAnswers: null | BodyElement[]; // Optional for questions
}

// Types for the body elements
export type BodyElement =
  | { text: string } // Descriptive or instructional text
  | { diagram: string } // Diagram placeholder
  | {
      table: {
        title: string;
        data: string[][];
      };
    } // Tabular data in a 2D array
  | { chart: SimpleChart }; // Chart details

// Chart details
export interface SimpleChart {
  title: string;
  type: string; // Type of chart (e.g., 'bar', 'line')
  x: string[]; // X-axis values
  y: number[] | string[]; // Y-axis values
  xtitle: string;
  ytitle: string;
}

// Multiple-choice option structure
interface MultipleChoiceOption {
  option: 'A' | 'B' | 'C' | 'D'; // Choice label
  body: BodyElement[]; // Reference to the body structure
}
export type Options = {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation?: string | null;
};

export type AnswerSheet = {
  options: string[];
  multipleChoice: boolean[];
  multipleChoiceData: (Options | null)[];
  openEnd: Cell[];
  pages: Record<number | string, number | string>;
  pageLinking: {
    [key: string | number]: {
      type: 'page' | 'question';
      page: string;
      question: string;
    };
  };
  score?: Record<number | string, number | string>;
};


