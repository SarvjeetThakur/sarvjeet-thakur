@AGENTS.md

## Claude Code specifics

All project rules and the skills table are in `AGENTS.md` (imported above); design rules are in [DESIGN.md](DESIGN.md). Do not duplicate either here.

- Skills live in `.claude/skills/` and are invoked as `/<skill-name>`. Add more with `npx skills add <repo> --skill <name> -a claude-code --copy`.
- `ponytail` is installed as a skill. Its optional plugin adds `/ponytail-review` and `/ponytail-audit`:
  ```
  /plugin marketplace add DietrichGebert/ponytail
  /plugin install ponytail@ponytail
  ```
