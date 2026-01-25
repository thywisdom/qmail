# Feature Branch Workflow Guide

This guide outlines the best practices for maintaining your `Quantum` feature branch, implementing changes, testing them, and eventually merging them back into the main codebase.

## 1. Maintaining the Branch

Since you are working on a long-lived feature branch (`Quantum`), it's important to keep it up-to-date with `main` to avoid massive conflicts later.

### Pulling Updates from Main
If other team members (or you) push changes to `main` (or `master`), you should periodically merge those into `Quantum`.

```bash
# Switch to your feature branch
git checkout Quantum

# Fetch the latest changes from the remote
git fetch origin

# Merge main into Quantum
git merge origin/master
# OR using rebase (advanced, keeps history cleaner but requires force push)
# git rebase origin/master
```

## 2. Implementing Features

Work on your feature as you normally would.

1.  **Make Changes**: Edit files, add new code.
2.  **Stage Changes**: `git add <files>`
3.  **Commit Often**: `git commit -m "Description of progress"`

> **Tip:** Make small, logical commits. This makes it easier to track changes and revert if necessary.

## 3. Testing Strategies

Before merging, you must verify your changes.

### Local Testing
*   **Run the Dev Server**: `npm run dev` and test the UI manually.
*   **Run Automated Tests**: If you have tests set up:
    ```bash
    npm test
    ```
*   **Linting**: Check for code style issues.
    ```bash
    npm run lint
    ```

### Quantum-Specific Testing
Since you are adding "Quantum" features, ensure you verify:
*   [ ] Key generation flows
*   [ ] Encryption/Decryption logic
*   [ ] UI states for secure/insecure modes

## 4. Merging Back to Main

Once the feature is complete and tested:

1.  **Final Polish**: Ensure all temporary debug code is removed.
2.  **Push Changes**:
    ```bash
    git push origin Quantum
    ```
3.  **Create a Pull Request (PR)**:
    *   Go to GitHub (link provided in terminal output).
    *   Open a Pull Request from `Quantum` to `master`.
    *   Review the file changes in the browser to catch anything you missed.
4.  **Merge**:
    *   Once satisfied (and after any code reviews), merge the PR on GitHub.
    *   *Alternatively, merge locally:*
        ```bash
        git checkout master
        git merge Quantum
        git push origin master
        ```

## 5. Cleanup

After the feature is successfully merged:

```bash
git branch -d Quantum       # Delete local branch
git push origin --delete Quantum # Delete remote branch (optional)
```
