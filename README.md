# storybookAuto
This tool automatically generates Storybook stories from your React components. It reads your React files, extracts component information, and creates corresponding Storybook files to streamline your development workflow.

## Features
- Only read components inside index file (one per file)
- Parses React components and generates Storybook stories.
- Automatically extracts and documents component props.
- Add exemple prop values for each prop type
  - Add exemple values for object prop types

### To be done
- Read folders and files and use same structure on storybook
- Read react elements that are not named index
- Add CVS files with content exemples
- Define prop name for array props that have specific content
  - images src, svgs, title, colors

  
## Runnig
node generateStories.js
