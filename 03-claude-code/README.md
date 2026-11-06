# 3. Take it into Claude Code

All the boards from steps 1 and 2 export as one file, [`tokens.css`](../01-design-system/tokens.css): about 70 lines of named values that Claude Code can build with.

## Export from Claude Design

In your Claude Design project, open **Export**. You can download the files, or use **Hand off to Claude Code**. The handoff includes the design files, your chat with Claude Design, and a README for Claude Code. In the session we downloaded the files into a project folder.

## The prompt

Open Claude Code in that folder, drag in `tokens.css`, and ask:

```
Here is our design system, tokens.css, which follows Tailwind. Create a simple HTML page that shows the system: colours, type scale, buttons, cards and a form, using only these tokens.
```

[`design-system.html`](../01-design-system/design-system.html) is that kind of page. Every value on it comes from `tokens.css`, so changing a colour there changes it everywhere on the page.

## Keep Claude Code on the system

Claude Code reads a file called `CLAUDE.md` at the start of every session, so put the design system rules there. [Ours](CLAUDE.md) tells it to use the tokens for everything, follow the tailwind-design rules, and never add a raw colour or pixel value.

Next: [4. Redesign a real page](../04-redesign-a-page/)
