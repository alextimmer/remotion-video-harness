# Client readiness gate

Before any reel work for a client (new composition, scene, copy, theme change),
run:

```bash
scripts/check-client.sh <client>
```

- `READY`: proceed.
- `NOT READY`: use the `onboarding-clients` skill first
  (`.agents/skills/onboarding-clients/SKILL.md`). Brand facts come from the
  user, never from the agent. A user in a hurry gets the express questions, not
  assumptions. Brand-independent work (folder, scene structure, copy draft with
  theme tokens) may proceed while answers are pending; `src/brand/theme.ts`
  values may not be chosen by the agent.

The gate is deliberately strict: a wrong theme baked into a rendered reel is
rework, one message of questions is not.
