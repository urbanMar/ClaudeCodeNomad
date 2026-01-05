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

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ClaudeCodeNomad - A new project repository. Architecture and build commands will be documented here as the project develops.

## Workflow

**See [AGENTS.md](./AGENTS.md)** for the complete development workflow using the essentials-claude-code plugin.

**Default action when starting work:** `/plan-creator <task description>`

## Directory Structure

- `.claude/plans/` - Implementation plans
- `.claude/maps/` - Codebase maps and architecture diagrams
- `.claude/prompts/` - Reusable prompts and templates
