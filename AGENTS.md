<!-- OPENSPEC:START -->
# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:
- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:
- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

# AGENTS.md

Guide for using the essentials-claude-code plugin workflow. Designed to be fault-tolerant - if you forget a step, this document helps you recover.

## Quick Decision: Which Workflow?

| Task Size | Time Estimate | Use This |
|-----------|---------------|----------|
| **Small** | < 1 hour, single session | Plan → Implement Loop |
| **Medium** | 1-4 hours, needs review | Plan → Proposal → Spec Loop |
| **Large** | Multi-session, complex | Plan → Proposal → Beads → Beads Loop |

**When in doubt, start with `/plan-creator`** - you can always escalate to a larger workflow.

---

## Workflow Commands

### 1. PLANNING (Always Start Here)

```
/plan-creator <describe your task>
```

For bugs:
```
/bug-plan-creator <error message> <description of issue>
```

For code quality:
```
/code-quality-plan-creator <files to analyze>
```

**Output:** `.claude/plans/<plan-name>.md`

---

### 2. IMPLEMENTATION OPTIONS

#### Option A: Direct Implementation (Small Tasks)

```
/implement-loop <path-to-plan>
```

Flags:
- `--step` (default) - Pauses after each task for review
- `--auto` - Runs continuously until exit criteria pass
- `--max-iterations N` - Limit iterations

#### Option B: With Human Review (Medium Tasks)

```
/proposal-creator <path-to-plan>
```
**→ Review the proposal in `openspec/changes/`**
**→ Then:**
```
/spec-loop <change-id>
```

#### Option C: Multi-Session (Large Tasks)

```
/proposal-creator <path-to-plan>
```
**→ Review proposal**
**→ Then:**
```
/beads-creator <path-to-spec>
```
**→ This creates atomic work units (beads)**
**→ Then:**
```
/beads-loop
```

Filter beads by label:
```
/beads-loop --label feature-auth
```

---

## Recovery Guide

### "I forgot where I was"

1. Check for existing plans: `ls .claude/plans/`
2. Check for proposals: `ls openspec/changes/` (if directory exists)
3. Check for beads: Look for bead files from previous sessions

### "The loop stopped unexpectedly"

Just restart the appropriate loop:
- `/implement-loop <plan>` - Resumes from current state
- `/spec-loop <change-id>` - Checkboxes track progress
- `/beads-loop` - Beads are persistent, picks up where it left off

### "I started coding without a plan"

Stop. Create a plan now:
```
/plan-creator <describe what you're building>
```
Then use `/implement-loop` to continue properly.

### "The task grew larger than expected"

Escalate the workflow:
1. If in implement-loop → Create proposal: `/proposal-creator <plan>`
2. If in spec-loop → Break into beads: `/beads-creator <spec>`

---

## Utility Commands

| Command | Purpose |
|---------|---------|
| `/codemap-creator` | Generate JSON code map with symbols |
| `/document-creator` | Create DEVGUIDE.md documentation |
| `/prompt-creator` | Refine a description into a prompt |
| `/mr-description-creator` | Generate PR/MR description |
| `/github-cli` | GitHub CLI operations |
| `/gitlab-cli` | GitLab CLI operations |

---

## Key Principles

1. **Always plan first** - Even small tasks benefit from `/plan-creator`
2. **Beads are self-contained** - Each bead has all context needed; no external references
3. **Exit criteria matter** - Loops continue until specific criteria pass, not vague goals
4. **Review before autonomous execution** - Use proposals for anything non-trivial

---

## Output Locations

```
.claude/
├── plans/      # Architectural plans from /plan-creator
├── maps/       # Code maps from /codemap-creator
└── prompts/    # Refined prompts from /prompt-creator

openspec/
└── changes/    # Proposals from /proposal-creator
```

---

## If All Else Fails

**Default safe action:** Run `/plan-creator <describe current goal>`

This resets your workflow to a known state and produces a plan you can work from.

## Landing the Plane (Session Completion)

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** - Create issues for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **PUSH TO REMOTE** - This is MANDATORY:
   ```bash
   git pull --rebase
   bd sync
   git push
   git status  # MUST show "up to date with origin"
   ```
5. **Clean up** - Clear stashes, prune remote branches
6. **Verify** - All changes committed AND pushed
7. **Hand off** - Provide context for next session

**CRITICAL RULES:**
- Work is NOT complete until `git push` succeeds
- NEVER stop before pushing - that leaves work stranded locally
- NEVER say "ready to push when you are" - YOU must push
- If push fails, resolve and retry until it succeeds
