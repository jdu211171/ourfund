import { useEffect, useRef } from "react";
import { useAppNavigation } from "@/lib/navigation";
import { translations } from "@/lib/translations";

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const { language } = useAppNavigation();

  // Use WeakMap to prevent memory leaks from holding references to deleted DOM nodes
  const originalValues = useRef<WeakMap<Node, string>>(new WeakMap());
  // Since WeakMap is not iterable, keep track of elements/nodes to restore when toggled back to English
  const nodesToRestore = useRef<Set<Node>>(new Set());

  useEffect(() => {
    const translateText = (text: string): string => {
      const trimmed = text.trim();
      if (!trimmed) return text;

      // 1. Exact match
      if (translations[trimmed] !== undefined) {
        return text.replace(trimmed, translations[trimmed]);
      }

      // 2. Exact match after stripping trailing colons/dots/spaces
      const cleanText = trimmed.replace(/[:.·]+$/, "").trim();
      const suffix = trimmed.slice(cleanText.length);
      if (translations[cleanText] !== undefined) {
        return text.replace(trimmed, translations[cleanText] + suffix);
      }

      return text;
    };

    const translateDOM = () => {
      if (typeof document === "undefined") return;

      const walk = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: (node) => {
            const parent = node.parentNode;
            if (parent) {
              const tag = (parent as HTMLElement).tagName?.toUpperCase();
              if (tag === "SCRIPT" || tag === "STYLE" || tag === "INPUT" || tag === "TEXTAREA") {
                return NodeFilter.FILTER_REJECT;
              }
            }
            return NodeFilter.FILTER_ACCEPT;
          },
        }
      );

      let node: Node | null;
      while ((node = walk.nextNode())) {
        const text = node.nodeValue;
        if (text === null) continue;

        if (language === "en") {
          // Restore English
          if (originalValues.current.has(node)) {
            const original = originalValues.current.get(node);
            if (original !== undefined && node.nodeValue !== original) {
              node.nodeValue = original;
            }
          }
          continue;
        }

        // Japanese translation
        const trimmed = text.trim();
        if (!trimmed) continue;

        if (!originalValues.current.has(node)) {
          originalValues.current.set(node, text);
          nodesToRestore.current.add(node);
        }

        const translated = translateText(text);
        if (translated !== text) {
          node.nodeValue = translated;
        }
      }

      // Translate placeholders
      const inputs = document.querySelectorAll("input[placeholder], textarea[placeholder]");
      inputs.forEach((el) => {
        const input = el as HTMLInputElement | HTMLTextAreaElement;
        const placeholder = input.getAttribute("placeholder");
        if (!placeholder) return;

        if (language === "en") {
          if (originalValues.current.has(input)) {
            const original = originalValues.current.get(input);
            if (original !== undefined && input.getAttribute("placeholder") !== original) {
              input.setAttribute("placeholder", original);
            }
          }
          return;
        }

        if (!originalValues.current.has(input)) {
          originalValues.current.set(input, placeholder);
          nodesToRestore.current.add(input);
        }

        const translated = translateText(placeholder);
        if (translated !== placeholder) {
          input.setAttribute("placeholder", translated);
        }
      });
    };

    // Execute translation immediately
    translateDOM();

    // Setup MutationObserver to watch for React updates
    const observer = new MutationObserver(() => {
      observer.disconnect();
      translateDOM();
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true,
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => {
      observer.disconnect();
      // On unmount/language switch to English, restore cached values
      if (language === "en") {
        nodesToRestore.current.forEach((node) => {
          const original = originalValues.current.get(node);
          if (original !== undefined) {
            if ("nodeValue" in node) {
              node.nodeValue = original;
            } else if (node instanceof HTMLElement && node.hasAttribute("placeholder")) {
              node.setAttribute("placeholder", original);
            }
          }
        });
        nodesToRestore.current.clear();
      }
    };
  }, [language]);

  return <>{children}</>;
}
