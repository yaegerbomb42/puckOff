---
name: Project DNA Extractor
description: Autonomously scans a project to distill core architectural patterns, implicit developer rules, and anti-patterns into a highly concentrated, persistent `.agent_dna.yml` file. This acts as long-term, context-injected memory for the agent.
---

# Project DNA Extractor Skill

## Why this skill exists

As an AI agent, my greatest weakness is context loss across sessions and missing unwritten rules of a codebase. Human developers build "muscle memory" for a project's quirks. This skill allows me to synthesize that muscle memory artificially. By running this skill, I can extract the "DNA" of a repository—custom libraries, state management flow, forbidden anti-patterns, and architectural decisions—and store it permanently.

## When to use this skill

- When entering a new, undocumented codebase.
- When the user states that I am making "out-of-character" mistakes for the project (e.g., using standard `print` instead of a custom `logger`).
- When concluding a massive refactor, to leave an updated map for my future self.

## Execution Steps

### 1. Initial Scan

Run the provided helper script to generate a dependency and structure map of the project.

```bash
python .agents/skills/project_dna_extractor/scripts/analyze_structure.py <target_directory>
```

### 2. Semantic Analysis

Review the output of the script. Identify the following:

- **Core Entities**: What are the main classes/data structures?
- **Control Flow**: How does data move? (e.g., "Main loop -> Orchestrator -> Executor")
- **Custom Overrides**: Are there custom implementations of standard tools? (e.g., custom Motor controls instead of raw PyAutoGUI).
- **Anti-Patterns**: What standard approaches should be avoided here? (e.g., "Do not use absolute coordinates, use relative mirror regions").

### 3. DNA Generation

Using `.agents/skills/project_dna_extractor/resources/dna_template.yml` as a guide, generate a `.agent_dna.yml` file in the root of the project.

### 4. Integration

Once created, you must gracefully inform the user that the project's DNA has been sequenced. Instruct the user (or your future self) to simply say "Read the project DNA" in future sessions to instantly regain full context of the project's unique constraints without needing to read every file.
