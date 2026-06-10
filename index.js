import { Marked } from "marked";
import { markedHighlight } from "marked-highlight";
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
     * @property {"svelte"|"react"|null} environment Define which environment is being used. Default is `null`
     * @property {boolean?} htmlWhitelist Define a whitelist of HTML tags. Specify `false` to disable the whitelist. Default is `["a", "b", "em", "i", "img", "p", "strong", "ul", "li", "h1", "h2", "h3", "h4", "h5", "h6"]`
     * @property {boolean?} scriptEnabled Allow arbitrary `<script>` elements. Probably a bad idea. Default is `false`
     * @property {boolean?} scriptTokens Doesn't allow for `<script>` elements in the markdown itself, just adds `<script>` elements to the output HTML if event tags are used. Default is `false`
     * @property {import("marked").MarkedOptions?} markedOptions Override for specific MarkedOptions
     */

    /** @private */
    static _markedLight = new Marked();
    /** @private */
    static _markedHeavy = new Marked()
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
        const environment = options.environment;
        const scriptEnabled = options.scriptEnabled === true;
        const scriptTokens = options.scriptTokens === true;
        const htmlWhitelist = options.htmlWhitelist === false ? false : (options.htmlWhitelist || ["a", "b", "em", "i", "img", "p", "strong", "ul", "li", "h1", "h2", "h3", "h4", "h5", "h6"])

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
        return html;
    }
}

export default PenguinModMarkdown;