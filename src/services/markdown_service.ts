import TurndownService from "turndown";

const turndown = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
  emDelimiter: "*",
  bulletListMarker: "-"
});

turndown.addRule("preserveSubSup", {
  filter: ["sub", "sup"],
  replacement(content, node) {
    const name = node.nodeName.toLowerCase();
    return `<${name}>${content}</${name}>`;
  }
});

export function htmlToMarkdown(html: string): string {
  const source = String(html || "").trim();
  if (!source) return "";
  try {
    return turndown.turndown(source).trim();
  } catch {
    return "";
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function sanitizeUrl(raw: string): string {
  const value = String(raw || "").trim();
  if (!value) return "#";
  if (/^(https?:\/\/|mailto:|tel:|\/|#)/i.test(value)) return value;
  return "#";
}

function renderInline(text: string): string {
  let out = escapeHtml(text);
  out = out.replace(/&lt;(\/?)(sub|sup|b|strong|i|em|u|s|strike|small|mark|code)&gt;/gi, "<$1$2>");
  out = out.replace(/`([^`]+)`/g, "<code>$1</code>");
  out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  out = out.replace(/~~([^~]+)~~/g, "<s>$1</s>");
  out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, label: string, href: string) => {
    const safe = escapeHtml(sanitizeUrl(href));
    return `<a href="${safe}" target="_blank" rel="noopener">${label}</a>`;
  });
  return out;
}

export function markdownToSafeHtml(markdown: string): string {
  const source = String(markdown || "").replace(/\r\n/g, "\n").trim();
  if (!source) return "";
  const lines = source.split("\n");
  const chunks: string[] = [];
  let inList = false;
  let listClass = "";

  const closeList = () => {
    if (inList) {
      chunks.push("</ul>");
      inList = false;
      listClass = "";
    }
  };

  for (const line of lines) {
    const text = line.trim();
    if (!text) {
      closeList();
      continue;
    }

    const heading = text.match(/^(#{1,4})\s+(.+)$/);
    if (heading) {
      closeList();
      const level = heading[1].length;
      chunks.push(`<h${level}>${renderInline(heading[2])}</h${level}>`);
      continue;
    }

    const checkItem = text.match(/^-\s\[( |x|X)\]\s+(.+)$/);
    if (checkItem) {
      if (!inList || listClass !== "md-checklist") {
        closeList();
        chunks.push('<ul class="md-checklist">');
        inList = true;
        listClass = "md-checklist";
      }
      const checked = checkItem[1].toLowerCase() === "x" ? " checked" : "";
      chunks.push(
        `<li><label><input type="checkbox" disabled${checked}> <span>${renderInline(checkItem[2])}</span></label></li>`
      );
      continue;
    }

    const bullet = text.match(/^-\s+(.+)$/);
    if (bullet) {
      if (!inList || listClass !== "md-list") {
        closeList();
        chunks.push('<ul class="md-list">');
        inList = true;
        listClass = "md-list";
      }
      chunks.push(`<li>${renderInline(bullet[1])}</li>`);
      continue;
    }

    closeList();
    chunks.push(`<p>${renderInline(text)}</p>`);
  }

  closeList();
  return chunks.join("");
}
