import { Marked } from "marked";
import { markedHighlight } from "marked-highlight";
import DOMPurify from "isomorphic-dompurify";
import markedAlert from 'marked-alert';
import hljs from 'highlight.js';

class PenguinModMarkdown {
    /**
     * @typedef {Object} PenguinModMarkdownOptions
     * @property {"untrusted"|"trusted"} permission A ruleset to follow when parsing.
     * - `"untrusted"` - disables some Markdown features. (for user profiles, project descriptions, etc.)
     * - `"trusted"` - enables all Markdown features. (for event pages, defined text, etc.)
     * @property {boolean?} inline Whether or not the parser should make inline HTML. Default is `true`
     * @property {"light"|"moderate"|"heavy"|null} weight How many features should be accessible. Default is `"heavy"`
     * - `"light"` - Explicitly disallows tables, codeblocks, and other large elements. (for translation strings)
     * - `"moderate"` - Doesn't disallow any features, but doesn't add any styling. (default)
     * - `"heavy"` - Doesn't disallow anything and adds highlighting + scratchblocks.
     * @property {string?} className Add a className to all of the HTML elements. Default is `"penguinmod-markdown-html"`
     * @property {"svelte"|"react"|null} environment Define which environment is being used. Default is `null`
     * @property {boolean?} htmlWhitelist Define a whitelist of HTML tags. Specify `false` to disable the whitelist. Default is `["a", "b", "blockquote", "code", "del", "em", "hr", "i", "img", "p", "pre", "strong", "table", "thead", "tbody", "tr", "th", "td", "ul", "ol", "li", "h1", "h2", "h3", "h4", "h5", "h6"]`
     * @property {boolean?} scriptEnabled Allow arbitrary `<script>` elements. Probably a bad idea. Default is `false`
     * @property {boolean?} scriptTokens Doesn't allow for `<script>` elements in the markdown itself, just adds `<script>` elements to the output HTML if event tags are used. Default is `false`
     * @property {import("marked").MarkedOptions?} markedOptions Override for specific MarkedOptions
     */

    /** @private */
    static _defHtmlWhitelist = ["a", "b", "blockquote", "code", "del", "em", "hr", "i", "img", "p", "pre", "strong", "table", "thead", "tbody", "tr", "th", "td", "ul", "ol", "li", "h1", "h2", "h3", "h4", "h5", "h6"];
    /** @private */
    static _renderer = {
        // TODO: this renderer is broken reall badly
        // TODO: Respect className
        paragraph(text) {
            return `<p class="${"className"}">${text}</p>`;
        },
        heading({ tokens, depth }) {
            const text = this.parser.parseInline(tokens);
            return `<h${depth} class="${"className"}">${text}</h${depth}>`;
        },
        list(body, ordered) {
            const type = ordered ? 'ol' : 'ul';
            return `<${type} class="${"className"}">${body}</${type}>`;
        },
        listitem(text) {
            return `<li class="${"className"}">${text}</li>`;
        },
        link({ href, title, text }) {
            return `<a class="${"className"}" target="_blank" href="${href}" ${title ? `title="${title}"` : ''}>${text}</a>`;
        }
    };
    // TODO: Probably create these within parse because otherwise we cant do a lot of specific rule stuff
    /** @private */
    static _markedLight = new Marked()
        .use({ renderer: this._renderer });
    /** @private */
    static _markedHeavy = new Marked()
        .use({ renderer: this._renderer })
        .use(markedAlert())
        .use(markedHighlight({
            emptyLangClass: 'hljs',
            langPrefix: 'hljs language-',
            highlight(code, lang, info) {
                const language = hljs.getLanguage(lang) ? lang : 'plaintext';
                return hljs.highlight(code, { language }).value;
            }
        }));

    /**
     * Compiles markdown to HTML synchronously.
     * @param {string} source String of markdown source to be compiled
     * @param {PenguinModMarkdownOptions} options Options to configure the parser
     * @returns {string} String of HTML code
     */
    static parse(src = "", options) {
        if (!options) throw new Error("PenguinModMarkdownOptions is required alongside PenguinModMarkdownOptions.permission");
        if (!options.permission) throw new Error("PenguinModMarkdownOptions.permission is required");
        const inline = options.inline !== false;
        const weight = options.weight || "moderate";
        const className = options.className || "penguinmod-markdown-html";
        const environment = options.environment;
        const scriptEnabled = options.scriptEnabled === true;
        const scriptTokens = options.scriptTokens === true;
        const htmlWhitelist = options.htmlWhitelist === false ? false : (options.htmlWhitelist || this._defHtmlWhitelist)

        // https://marked.js.org/#usage
        src = String(src).replace(/^[\u200B\u200C\u200D\u200E\u200F\uFEFF]/, "");

        const marked = weight !== "heavy" ? this._markedLight : this._markedHeavy;
        const parseFunc = inline ? marked.parseInline : marked.parse;
        const html = parseFunc(src, {
            gfm: true,
            breaks: true,
            ...(options.markedOptions || {}),
            async: false,
        });
        return DOMPurify.sanitize(html, {
            ALLOWED_TAGS: htmlWhitelist === false ? null : htmlWhitelist,
            ADD_ATTR: ['class']
        });
    }
}

export default PenguinModMarkdown;