import React, { useEffect, useRef } from 'react';

/**
 * AutoResizeTextarea Component
 * 
 * Automatically expands and contracts based on content.
 * - Starts with minimum rows
 * - Grows as user types
 * - No scrollbars
 * - Feels like writing on a real prescription form
 */
function AutoResizeTextarea({
  value = '',
  onChange = () => {},
  placeholder = '',
  minRows = 2,
  className = '',
  id = '',
}) {
  const textareaRef = useRef(null);

  // Auto-resize logic
  const resizeTextarea = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      // Reset height to auto to get the correct scrollHeight
      textarea.style.height = 'auto';
      
      // Calculate height with minimum
      const newHeight = Math.max(
        textarea.scrollHeight,
        minRows * 24 // Approximate line height
      );
      
      textarea.style.height = `${newHeight}px`;
    }
  };

  // Resize on value change
  useEffect(() => {
    resizeTextarea();
  }, [value, minRows]);

  // Initial resize on mount
  useEffect(() => {
    resizeTextarea();
  }, []);

  return (
    <textarea
      ref={textareaRef}
      id={id}
      className={`auto-resize-textarea ${className}`}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      rows={1}
      style={{
        resize: 'none',
        overflow: 'hidden',
        minHeight: `${minRows * 24}px`,
      }}
    />
  );
}

export default AutoResizeTextarea;
