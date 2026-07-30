import { useLayoutEffect, useRef } from "react";

import { capitalizeWords } from "../utils/textFormat";

/**
 * Capitalize a controlled text input on change without moving the caret.
 * Attach `inputRef` to the input and pass the input element to `capitalizeInputValue`.
 */
const useCaretSafeCapitalize = () => {
  const inputRef = useRef(null);
  const pendingSelectionRef = useRef(null);

  useLayoutEffect(() => {
    const input = inputRef.current;
    const selection = pendingSelectionRef.current;

    if (!input || !selection) {
      return;
    }

    input.setSelectionRange(selection.start, selection.end);
    pendingSelectionRef.current = null;
  });

  const capitalizeInputValue = (input, options = { trim: false }) => {
    pendingSelectionRef.current = {
      start: input.selectionStart ?? 0,
      end: input.selectionEnd ?? 0,
    };

    return capitalizeWords(input.value, options);
  };

  return { inputRef, capitalizeInputValue };
};

export default useCaretSafeCapitalize;
