# English Practice

Single GitHub Pages repository for five independent classes: **5E4, 4E2, 4E3, 3E2, 3E4**.

The website is an optional practice support. It does not replace classroom lessons.

## Structure

```text
english-practice/
├── index.html
├── assets/
│   ├── css/style.css
│   └── js/app.js
├── 5E4/
│   └── index.html
├── 4E2/
│   └── index.html
├── 4E3/
│   └── index.html
├── 3E2/
│   └── index.html
└── 3E4/
    └── index.html
```

Each class evolves independently. Recommended future structure:

```text
5E4/
├── index.html
├── unit-1/
│   ├── index.html
│   ├── lesson-a/
│   │   ├── index.html
│   │   ├── exercise-1.html
│   │   └── exercise-2.html
│   └── lesson-b/
└── unit-2/
```

The shared `assets/` directory contains only the common visual design and reusable exercise utilities. Class-specific content stays inside its class directory.

## GitHub Pages

Upload the contents of this project to the repository root, then in GitHub open **Settings → Pages** and publish from the repository's main branch/root folder.

## Common exercise engine

`assets/js/app.js` currently provides reusable helpers for text-answer checking, select/choice checking, immediate feedback, and reset. It is deliberately small so new exercise types can be added centrally later without coupling class content together.
