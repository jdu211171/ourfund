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
    // Generate a lowercase lookup map of translations for case-insensitive lookup
    const lowercaseMap = new Map<string, string>();
    for (const key in translations) {
      lowercaseMap.set(key.toLowerCase(), translations[key]);
    }

    const translateText = (text: string): string => {
      let result = text;

      const trimmed = text.trim();
      if (!trimmed) return text;

      // 1. Case-insensitive exact match of full trimmed text
      const cleanText = trimmed.replace(/[:.·,，。、\s]+$/, "").trim();
      const suffix = trimmed.slice(cleanText.length);
      const lowerClean = cleanText.toLowerCase();

      if (lowercaseMap.has(lowerClean)) {
        return text.replace(trimmed, lowercaseMap.get(lowerClean)! + suffix);
      }

      // 2. Case-insensitive exact match of trimmed text
      const lowerTrimmed = trimmed.toLowerCase();
      if (lowercaseMap.has(lowerTrimmed)) {
        return text.replace(trimmed, lowercaseMap.get(lowerTrimmed)!);
      }

      // 3. Substring replacement for individual keys (longer keys replaced first)
      const sortedKeys = Array.from(lowercaseMap.keys()).sort((a, b) => b.length - a.length);
      for (const key of sortedKeys) {
        if (key.length <= 2) continue; // skip very short words to avoid matching parts of syllables

        // Escape regex special chars
        const escapedKey = key.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");

        // Match word boundaries for alphanumeric keys
        if (/^[a-zA-Z0-9\s]+$/.test(key)) {
          const regex = new RegExp(`\\b${escapedKey}\\b`, "gi");
          if (regex.test(result)) {
            result = result.replace(regex, () => lowercaseMap.get(key)!);
          }
        } else {
          // Direct replace for keys with special characters (e.g. middot, colons, possessives)
          if (result.toLowerCase().includes(key)) {
            const index = result.toLowerCase().indexOf(key);
            if (index !== -1) {
              const originalPart = result.substring(index, index + key.length);
              result = result.replace(originalPart, lowercaseMap.get(key)!);
            }
          }
        }
      }

      // 4. Dynamic possessive matches (e.g. "John's wallets", "Morgans' household")
      if (
        result.includes("'s ") ||
        result.includes("'s") ||
        result.includes("' ") ||
        result.includes("’s")
      ) {
        const possessiveRegex = /([a-zA-Z0-9_-]+)(?:'s|'|’s|’)\s*([a-zA-Z0-9\s_&-]+)/gi;
        result = result.replace(possessiveRegex, (match, name, item) => {
          const lowerItem = item.trim().toLowerCase();
          const translatedItem = lowercaseMap.get(lowerItem) || item;
          return `${name}の${translatedItem}`;
        });
      }

      return result;
    };

    const translateDOM = () => {
      if (typeof document === "undefined") return;

      const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
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
      });

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
            if (node instanceof Text) {
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
