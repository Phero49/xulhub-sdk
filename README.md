
# Xulhub SDK

Build custom interactive exercises and cell content for Xulhub educational notebooks.

[![npm version](https://img.shields.io/npm/v/@xulhub/sdk.svg)](https://www.npmjs.com/package/@xulhub/sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## What is Xulhub?

Xulhub is a community-driven learning platform that connects learners with academic resources through interactive study tools, quizzes, and collaborative notebooks. The platform transforms static documents into interactive learning experiences and enables communities to share curriculum-specific resources.

Think of it as combining the best of social platforms with powerful educational tools - where learners can discover study notes, join communities, and interact with content through dynamic notebooks instead of passive PDFs.

## 🚀 Quick Start

```bash
npm install @xulhub/sdk
```

```javascript
import { createNotebookSDK } from '@xulhub/sdk';

const sdk = createNotebookSDK();

sdk.onReady(() => {
    // Get existing content
    const data = sdk.getContentData();
    
    // Setup quiz verification
    sdk.quizManager.verifyAnswer = () => {
        const isCorrect = checkUserAnswer();
        return {
            passed: isCorrect,
            points: isCorrect ? 10 : 0,
            next: isCorrect
        };
    };
    
    // Show the check button
    sdk.quizManager.showVerificationButton();
});
```

## 📚 What is Xulhub SDK?

The Xulhub SDK enables developers to create custom interactive content that runs inside Xulhub notebook cells. Your extensions operate in an isolated environment with a powerful bridge to the parent application.

### Notebook Structure
```
📓 Notebook
  └─ 📄 Cell
      └─ 🧩 Cell Content  ← Your extension runs here
```

## ✨ Key Features

- **Quiz & Exercise Management** - Built-in scoring, verification, and navigation
- **AI-Powered Verification** - Use AI to grade open-ended questions and essays
- **Text-to-Speech** - Add audio accessibility to your content
- **Data Persistence** - Automatic state management and content saving
- **Auto-Generation** - Import and generate cells from HTML, Markdown, or JSON
- **Isolated Execution** - Secure iframe environment with parent communication

## 🎯 Use Cases

- Multiple choice quizzes
- Coding exercises with AI verification
- Interactive flashcards
- Essay questions with AI grading
- Math problem solvers
- Language learning exercises
- Custom visualizations and simulations

## 📖 Examples

### Multiple Choice Quiz

```javascript
import { createNotebookSDK } from '@xulhub/sdk';

const sdk = createNotebookSDK();

sdk.onReady(() => {
    const { question, options, correctAnswer } = sdk.getContentData();
    
    // Render quiz UI
    renderQuiz(question, options);
    
    // Setup verification
    sdk.quizManager.verifyAnswer = () => {
        const selected = getSelectedOption();
        const isCorrect = selected === correctAnswer;
        
        return {
            passed: isCorrect,
            points: isCorrect ? 10 : 0,
            next: isCorrect
        };
    };
    
    sdk.quizManager.showVerificationButton();
}, {
    height: '400px'
});
```

### AI-Verified Essay

```javascript
sdk.onReady(async () => {
    const checkButton = document.getElementById('check');
    
    checkButton.addEventListener('click', async () => {
        const essay = document.getElementById('essay').value;
        
        // Use AI to grade the essay
        const result = await sdk.quizManager.verifyWithAi(
            essay,
            'Evaluate this essay on clarity, grammar, and argument strength (0-10 each)',
            { clarity: 0, grammar: 0, argument: 0, feedback: '' }
        );
        
        displayFeedback(result);
        
        sdk.quizManager.submitAnswer({
            passed: result.clarity >= 7 && result.grammar >= 7,
            points: (result.clarity + result.grammar + result.argument) / 3,
            next: true
        });
    });
}, {
    hideCheckButton: true  // Using custom button
});
```

### Text-to-Speech

```javascript
sdk.onReady(async () => {
    const container = document.getElementById('content');
    
    // Add TTS markup: ▶️[lang_code] text ⏸️
    container.innerHTML = `
        <p>▶️[en] Welcome to the lesson! ⏸️</p>
        <p>▶️[es] ¡Bienvenido a la lección! ⏸️</p>
    `;
    
    // Process TTS - converts markup to interactive buttons
    await sdk.processTTS(container, '24px');
});
```

## 🔧 Core API

### Lifecycle

```javascript
// Initialize SDK
sdk.onReady(callback, config?)

// Handle errors
sdk.onError(error => console.error(error))
```

### Data Management

```javascript
// Get content
const data = sdk.getContentData<T>()

// Save content
sdk.saveContent(data)

// Get notebook metadata
const meta = await sdk.getNotebookMetadata()
```

### Quiz Manager

```javascript
// Verify answer (you implement this)
sdk.quizManager.verifyAnswer = () => ({ passed, points, next })

// Submit answer
sdk.quizManager.submitAnswer({ passed, points, next, playSound })

// AI verification
const result = await sdk.quizManager.verifyWithAi(input, prompt, outputSchema)

// UI controls
sdk.quizManager.showVerificationButton()
sdk.quizManager.hideVerificationButton()
sdk.quizManager.goToNextCell()
sdk.quizManager.reset()
```

### Text-to-Speech

```javascript
// Process TTS markup
await sdk.processTTS(element, size)

// Reverse TTS to markup
const markup = await sdk.reverseTTS(innerHTML)
```

## 🎨 Configuration

```javascript
sdk.onReady(() => {
    // Your code
}, {
    height: '500px',           // Content area height
    hideCheckButton: false,     // Hide default check button
    hasAutoGen: false          // Enable auto-generation
});
```

## 📦 TypeScript Support

The SDK is written in TypeScript and includes full type definitions:

```typescript
interface QuizData {
    question: string;
    options: string[];
    correctAnswer: number;
}

const data = sdk.getContentData<QuizData>();
// data is fully typed!
```

## 🌐 Full Documentation

Visit **[sdk.xulhub.com](https://sdk.xulhub.com)** for complete documentation including:

- Detailed API reference
- Advanced features and examples
- Auto-generation guide
- Best practices
- Troubleshooting
- Complete code examples

## 📄 License

MIT © Xulhub

## 🤝 Contributing

Contributions are welcome! Please visit our [GitHub repository](https://github.com/Phero49/xulhub-sdk) for guidelines.

## 💬 Support

- **Documentation**: [sdk.xulhub.com](https://sdk.xulhub.com)
- **Issues**: [GitHub Issues](https://github.com/Phero49/xulhub-sdk/issues)
- **Email**: feedback@xulhub.com

---

**Made with ❤️ by the pemphero mkuka**
