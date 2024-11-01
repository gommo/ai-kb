# AI-KB: AI-friendly Knowledge Base Generator

AI-KB is a command-line tool that generates AI-friendly knowledge bases from your codebase. It scans your project files based on specified patterns and creates markdown files that can be easily consumed by AI models like Claude for context-aware code understanding and assistance.

## Features

- Configurable file inclusion and exclusion patterns
- Global ignore patterns for common non-code directories and files
- Explicit include patterns to override global ignores
- Whitespace optimization to reduce file size while preserving context
- Special handling for whitespace-sensitive languages (e.g., Python)
- Environment-based debug logging

## Installation

You don't need to install AI-KB permanently. You can run it directly using npx:

    npx ai-kb@latest


This command will download and execute the latest version of AI-KB.

## Usage

1. Create a `.ai-kb-config` file in your project root with the following format:

```
[section-name]
src/**/*.js
**/*.tsx
+node_modules/specific-package/**/*.js  # Explicitly include specific ignored paths

- src/**/some.js

[another-section]
src/**/*.js
**/*.tsx

- src/**/some.js
```

Each section can contain:

- Include patterns (normal glob patterns)
- Explicit include patterns (prefixed with +) to override global ignores
- Exclude patterns (prefixed with -)

2. Run the tool:

```
   npx ai-kb@latest
```

## Pattern Priority
Patterns are processed in the following order:

Explicit includes (+ prefix) override global ignores for specific paths
Normal includes match files while respecting global ignores
Excludes (- prefix) remove files from the final set

For example, to include a specific package from node_modules while keeping the general node_modules ignore:


```
[section]
+node_modules/important-package/**/*.js  # This package will be included
**/*.js                                 # Other .js files (excluding node_modules)
```


## Debug Mode

To run the application in debug mode and see additional logging information, use the `-v` flag when starting the application:

```
   npx ai-kb -v
```

This will provide detailed logging information about the file matching process, which can be helpful for troubleshooting or understanding how the tool processes your codebase.

## Output

The tool generates markdown files named `ai-kb-<section-name>.md` for each section defined in your config file. These files contain the content of the matched source files, optimized for AI consumption.

## Customization

The tool uses sensible defaults, but you can customize its behavior:

- Global ignore patterns
- Whitespace-sensitive file extensions
- Whitespace removal rules

For advanced customization, you can fork the repository and modify the source code.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request to the GitHub repository.

## License

This project is licensed under the MIT License.

## Support

If you encounter any issues or have questions, please file an issue on the GitHub repository.

## Privacy Note

This tool processes your source code locally. No code is sent to external servers. However, the generated markdown files may contain sensitive information from your codebase. Handle these files with appropriate care.
