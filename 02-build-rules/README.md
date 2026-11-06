# 2. Add build rules

After step 1, the design system says things like "the minimum font size is 16 pixels". That's an arbitrary value: someone else could pick 17 or 14 next time, and the system drifts. [Tailwind CSS](https://tailwindcss.com) fixes this with a shared, open-source set of named sizes and colours. You write `text-base` or `amber-300`, and each name means the same size or colour everywhere. When someone helps with your project, you can tell them "we use Tailwind v4" and they already know the rules.

The [tailwind-design skill](skills/tailwind-design/SKILL.md) in this folder tells Claude which rules to hold to:

- **Tokens first.** Every colour, size and gap comes from a named token.
- **Readable contrast.** Every text and background pair passes WCAG AA, and text never uses transparency.
- **Flexbox first.** Layouts use flexbox, and grid only when rows and columns both matter.
- **Nothing tiny.** Body text, labels and buttons stay at 16px or larger.

## Install the skill

**In the Claude app:** zip the `skills/tailwind-design` folder and add it as a custom skill. Anthropic's [guide to using skills](https://support.claude.com/en/articles/12512180-using-skills-in-claude) has the steps.

**In Claude Code:** copy the folder into your skills folder.

```
cp -r 02-build-rules/skills/tailwind-design ~/.claude/skills/
```

## The prompt

Back in your Claude Design project, call the skill by typing `/tailwind-design`, then:

```
Here is our tailwind-design skill. Adapt the design system to follow it: give every colour, font size and spacing value a named token, swap our colours for Tailwind's standard palette, fix any text and background pair below WCAG AA, and keep body text at 16px or larger.
```

The page looks almost the same afterwards, because the change is to the values underneath, which become named Tailwind tokens. The results are [`tokens.css`](../01-design-system/tokens.css) and the [Tailwind theme](../01-design-system/tailwind-theme.css) in step 1's folder.

Once a larger model has made the design decisions, you can ask Claude to run the conversion with a Haiku agent. It's faster, and converting values needs little judgement.

## Further reading

- [Tailwind's theme variables](https://tailwindcss.com/docs/theme), where the named tokens live
- [Tailwind's colour palette](https://tailwindcss.com/docs/colors)
- [shadcn/ui](https://ui.shadcn.com), ready-made components built on Tailwind, useful for dashboards

Next: [3. Take it into Claude Code](../03-claude-code/)
