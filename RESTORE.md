# Restoring the verified Twitch baseline

The user-confirmed Twitch/OAuth/EventSub baseline is preserved by the annotated Git tag:

```text
crowdquest-working-twitch-baseline
```

It points to commit `c11b548da5e1f63757fd06a0001f8c6e1649128f` and is pushed to GitHub. It contains no `.env`, access token, or client secret.

To inspect or run that version without changing your current branch:

```powershell
git fetch --tags origin
git switch --detach crowdquest-working-twitch-baseline
npm install
npm run dev
```

To return to the CrowdQuest 3 upgrade work:

```powershell
git switch crowdquest-3-upgrade
```

To make a new recovery branch from the baseline:

```powershell
git switch -c recovery/twitch-baseline crowdquest-working-twitch-baseline
```

Never copy `.env` into Git history. Restore it from your private local configuration before starting either version.
