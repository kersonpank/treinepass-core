
import { useState } from "react";

export function useClipboard(timeout = 3000) {
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    
    setTimeout(() => {
      setCopiedText(null);
    }, timeout);
  };

  return {
    copiedText,
    handleCopyToClipboard
  };
}
