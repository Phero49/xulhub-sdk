/**
 * Drag-and-drop, click-to-upload, AND paste-to-upload file handler.
 *
 * @param {HTMLElement} container The drop/click/paste target.
 * @param {Object} opts Configuration options.
 * @param {(ev:DragEvent)=>void} [opts.onDrag] Fired on dragover.
 * @param {(ev:DragEvent)=>void} [opts.onDrop] Fired on raw drop.
 * @param {(ev:ClipboardEvent)=>void} [opts.onPaste] Fired on raw paste.
 * @param {(file: File|string)=>("string"|void)} opts.success
 *        Return "string" to receive Base64 instead of File.
 * @param {number} [opts.maxSize] Max file size in bytes. Optional.
 * @param {string[]} [opts.acceptedFiles] Allowed MIME types, e.g. ["image/png","video/mp4"].
 * @param {"string"|"file"} [opts.expectedFileOutput] Force return type: "string" for Base64, "file" for File object.
 * @throws throws an error when creation failed or file validation fails
 */
export function createFileUploadArea(
  container: HTMLElement,
  {
    onDrag,
    onDrop,
    onPaste,
    success,
    maxSize,
    acceptedFiles,
    expectedFileOutput,
  }: {
    onDrag?: (ev: DragEvent) => void;
    onDrop?: (ev: DragEvent) => void;
    onPaste?: (ev: ClipboardEvent) => void;
    success: (file: File | string) => "string" | void;
    maxSize?: number;
    acceptedFiles?: string[];
    expectedFileOutput?: "string" | "file";
  },
) {
  const input = document.createElement("input");
  input.type = "file";
  input.style.display = "none";
  container.appendChild(input);

  // 1. Click to upload
  container.addEventListener("click", () => {
    input.value = "";
    input.click();
  });

  input.addEventListener("change", () => {
    const files = Array.from(input.files || []);
    if (!files.length) return;
    handleFiles(files);
  });

  // Helper to prevent default browser behavior
  function preventDefaults(ev: Event) {
    ev.preventDefault();
    ev.stopPropagation();
  }

  // 2. Drag and Drop events
  ["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) =>
    container.addEventListener(eventName, preventDefaults),
  );

  container.addEventListener("dragover", (ev) => onDrag?.(ev));

  container.addEventListener("drop", (ev) => {
    onDrop?.(ev);
    const dt = ev.dataTransfer;
    const files = dt?.files ? Array.from(dt.files) : [];
    if (!files.length) return;
    handleFiles(files);
  });

  // 3. Paste event listener
  container.addEventListener("paste", (ev: ClipboardEvent) => {
    onPaste?.(ev);

    const items = ev.clipboardData?.items;
    if (!items) return;

    const files: File[] = [];

    // Iterate over clipboard items
    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      // We only care about files (images, videos, etc.)
      if (item!.kind === "file") {
        const file = item!.getAsFile();
        if (file) {
          files.push(file);
        }
      }
    }

    if (files.length > 0) {
      handleFiles(files);
    }
  });

  function handleFiles(files: File[]) {
    files.forEach((file) => {
      // Check max size
      if (typeof maxSize === "number" && file.size > maxSize) {
        console.warn("File too large:", file.name);
        // Optionally throw or callback error here depending on needs
        return;
      }

      // Check accepted MIME types
      if (Array.isArray(acceptedFiles) && acceptedFiles.length > 0) {
        const isAccepted = acceptedFiles.some((accepted) => {
          if (accepted.endsWith("/*")) {
            const type = accepted.split("/")[0];
            return file.type.startsWith(type + "/");
          }
          return file.type === accepted;
        });

        if (!isAccepted) {
          throw new Error(`File type not allowed: ${file.type}`);
        }
      }

      if (!success) return;

      // Determine output mode:
      // 1. Explicit config flag takes precedence
      // 2. Otherwise, use the return value of success() if it returns 'string'
      const outputMode = expectedFileOutput || success(file);

      if (outputMode === "string") {
        const reader = new FileReader();
        reader.onload = () => {
          success(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        success(file);
      }
    });
  }
}

export function createSpeechUtterance(text: string, languageCode: string) {
  const utterance = new SpeechSynthesisUtterance(text);
  const voices = speechSynthesis.getVoices();

  // Find matching voice (exact match first, then prefix match)
  const voice =
    voices.find((v) => v.lang.toLowerCase() === languageCode.toLowerCase()) ||
    voices.find((v) =>
      v.lang.toLowerCase().startsWith(languageCode.toLowerCase()),
    );

  if (voice) {
    utterance.voice = voice;
  }

  let isPlaying = false;

  utterance.onstart = () => {
    isPlaying = true;
  };

  utterance.onend = () => {
    isPlaying = false;
  };

  utterance.onerror = () => {
    isPlaying = false;
  };

  return {
    play() {
      if (!isPlaying) {
        speechSynthesis.speak(utterance);
      }
    },

    stop() {
      speechSynthesis.cancel();
      isPlaying = false;
    },

    isPlaying() {
      return isPlaying;
    },

    setText(newText: string) {
      utterance.text = newText;
    },

    setRate(rate: number) {
      utterance.rate = rate;
    },

    setPitch(pitch: number) {
      utterance.pitch = pitch;
    },
    getUtterance() {
      return utterance;
    },
    setVolume(volume: number) {
      utterance.volume = volume;
    },
  };
}

/**
 * Escapes HTML special characters in a string to prevent XSS attacks.
 *
 * Converts the following characters to their HTML entity equivalents:
 * - `&` → `&amp;`
 * - `<` → `&lt;`
 * - `>` → `&gt;`
 * - `"` → `&quot;`
 * - `'` → `&#39;`
 * - `` ` `` → `&#96;`
 *
 * @param text - The string to escape
 * @returns The escaped string with HTML special characters converted to entities
 *
 * @example
 * ```typescript
 * escapeHtml('<script>alert("XSS")</script>');
 * // Returns: '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;'
 * ```
 */
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
    "`": "&#96;",
  };
  return text.replace(/[&<>"'`]/g, (char) => map[char] ?? char);
}
