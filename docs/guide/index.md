# Introduction

XulHub SDK is a powerful toolkit designed to help developers build interactive, educational, and engaging exercise cells that run seamlessly within the XulHub Notebook environment.

Whether you're building Multiple Choice Questions (MCQs), fill-in-the-blanks, hotspot activities, or complex AI-powered grading systems, this SDK provides the necessary bridge to communicate with the XulHub host application.

## Key Features

- **Seamless Integration**: Standardized communication via `postMessage` bridge.
- **Lifecycle Management**: Easy handling of initial data loading and state persistence.
- **Scoring & Validation**: Built-in support for grading and giving feedback to users.
- **AI Integration**: Native support for AI-powered content generation and answer verification.
- **Multimedia Support**: Standard utilities for handling image and audio uploads.
- **Framework Agnostic**: Works with Vue, React, Svelte, or even Vanilla JavaScript.

## Core Concepts

The SDK revolves around a single `NotebookSDK` instance that manages the communication between your exercise (running in an iframe) and the XulHub host.

- **[Notebook Structure](./notebook-structure)**: Understand how XulHub organizes pages into cells and blocks.
- **Edit Mode**: Used by creators to design and configure the exercise.
- **Published Mode**: Used by students to interact with and complete the exercise.
- **Save Content**: In Edit Mode, you save the configuration data that defines the exercise.
- **Verify Answer**: In Published Mode, you evaluate the user's input and report scores.
