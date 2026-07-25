import DOMPurify from "dompurify";

const SANITIZE_CONFIG = {
  ADD_TAGS: ["iframe"],
  ADD_ATTR: ["allow", "allowfullscreen", "frameborder", "target"],
};

export function sanitizeContentHtml(html: string): string {
  return DOMPurify.sanitize(html, SANITIZE_CONFIG);
}
