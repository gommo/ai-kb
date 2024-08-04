#!/usr/bin/env node

import fs from 'fs-extra';
import { glob } from 'glob';
import path from 'path';
import process from 'process';

function debugLog(...args) {
    if (process.env.NODE_ENV !== 'production') {
      console.log(...args);
    }
  }

// List of file extensions for whitespace-sensitive languages
const WHITESPACE_SENSITIVE_EXTENSIONS = [
    '.py',    // Python
    '.yaml',  // YAML
    '.yml',   // YAML
    '.jade',  // Jade/Pug
    '.haml',  // Haml
    '.slim',  // Slim
    '.coffee',// CoffeeScript
    '.pug',   // Pug
    '.styl'   // Stylus
  ];


// Global ignores
const GLOBAL_IGNORES = [
  // Node.js
  'node_modules/**',
  'package-lock.json',
  'npm-debug.log',
  // Yarn
  'yarn.lock',
  'yarn-error.log',
  // pnpm
  'pnpm-lock.yaml',
  // Bun
  'bun.lockb',
  // Deno
  'deno.lock',
  // PHP (Composer)
  'vendor/**',
  'composer.lock',
  // Python
  '__pycache__/**',
  '**/*.pyc',
  '**/*.pyo',
  '**/*.pyd',
  '.Python',
  'pip-log.txt',
  'pip-delete-this-directory.txt',
  '.venv/**',
  'venv/**',
  'ENV/**',
  'env/**',
  // Ruby
  'Gemfile.lock',
  '.bundle/**',
  // Java
  'target/**',
  '**/*.class',
  // Gradle
  '.gradle/**',
  'build/**',
  // Maven
  'pom.xml.tag',
  'pom.xml.releaseBackup',
  'pom.xml.versionsBackup',
  'pom.xml.next',
  // .NET
  'bin/**',
  'obj/**',
  '**/*.suo',
  '**/*.user',
  // Go
  'go.sum',
  // Rust
  'Cargo.lock',
  'target/**',
  // General
  '.git/**',
  '.svn/**',
  '.hg/**',
  '.DS_Store',
  'Thumbs.db',
  // Environment variables
  '.env',
  '.env.local',
  '.env.development.local',
  '.env.test.local',
  '.env.production.local',
  '**/*.env',
  '**/*.env.*',
  // Common framework directories
  '.svelte-kit/**',
  '.next/**',
  '.nuxt/**',
  '.vuepress/**',
  '.cache/**',
  'dist/**',
  'tmp/**',
  // Our output files
  'ai-kb-*.md'
];

// Function to read and parse the config file
function readConfig() {
  const configPath = '.ai-kb-config';
  if (!fs.existsSync(configPath)) {
    console.error('Config file .ai-kb-config not found');
    process.exit(1);
  }
  const configContent = fs.readFileSync(configPath, 'utf8');
  const config = {};
  let currentSection = null;

  configContent.split('\n').forEach(line => {
    line = line.trim();
    if (line.startsWith('[') && line.endsWith(']')) {
      currentSection = line.slice(1, -1);
      config[currentSection] = [];
    } else if (currentSection && line) {
      config[currentSection].push(line);
    }
  });

  return config;
}

// Function to get matching files for a section
async function getMatchingFiles(patterns, excludePatterns) {
    let files = [];
  
    console.log('Include patterns:', patterns);
    console.log('Exclude patterns:', excludePatterns);
  
    for (const pattern of patterns) {
      debugLog(`Processing pattern: ${pattern}`);
      
      // Check if the pattern explicitly includes a globally ignored path
      const explicitInclude = GLOBAL_IGNORES.some(ignore => 
        pattern.includes(ignore.replace('/**', '').replace('**/', '')));
      
      let globPattern = pattern;
      if (!explicitInclude) {
        const ignorePatterns = GLOBAL_IGNORES.map(p => `!${p}`);
        globPattern = [pattern, ...ignorePatterns];
      }
  
      debugLog(`Glob pattern:`, globPattern);
  
      try {
        const matchedFiles = await glob(globPattern);
        debugLog(`Matched files for ${pattern}:`, matchedFiles);
        files = files.concat(matchedFiles);
      } catch (error) {
        console.error(`Error processing pattern ${pattern}:`, error);
      }
    }
  
    debugLog('Files before exclusion:', files);
  
    for (const pattern of excludePatterns) {
        debugLog(`Processing exclude pattern: ${pattern}`);
      try {
        const excludeFiles = await glob(pattern);
        debugLog(`Files to exclude:`, excludeFiles);
        files = files.filter(file => !excludeFiles.includes(file));
      } catch (error) {
        console.error(`Error processing exclude pattern ${pattern}:`, error);
      }
    }
  
    debugLog('Final file list:', files);
    return files;
  }
  

// Function to remove unnecessary whitespace
function removeWhitespace(content, isWhitespaceSensitive) {
    if (isWhitespaceSensitive) {
      // For whitespace-sensitive languages, only trim line ends and remove blank lines
      return content.split('\n')
        .map(line => line.trimEnd())
        .filter(line => line.trim() !== '')
        .join('\n');
    } else {
      // For other languages, apply more aggressive whitespace removal
      return content.split('\n')
        .map(line => line.trim())
        .filter(line => line !== '')
        .join(' ')
        .replace(/\s+/g, ' ')  // Replace multiple spaces with a single space
        .replace(/\s*([(){}\[\]])\s*/g, '$1')  // Remove spaces around brackets and parentheses
        .replace(/;\s+/g, ';')  // Remove spaces after semicolons
        .replace(/,\s+/g, ',');  // Remove spaces after commas
    }
  }
  
  // Function to process files and generate markdown
  async function generateMarkdown(files) {
    const markdowns = await Promise.all(files.map(async file => {
      const content = await fs.readFile(file, 'utf8');
      const extension = path.extname(file);
      const isWhitespaceSensitive = WHITESPACE_SENSITIVE_EXTENSIONS.includes(extension);
      const processedContent = removeWhitespace(content, isWhitespaceSensitive);
      
      return `## ${file}\n\`\`\`${extension.slice(1)}\n${processedContent}\n\`\`\``;
    }));
    return markdowns.join('\n\n');
  }

// Main function
async function main() {
    const config = readConfig();
    debugLog('Parsed config:', config);
  
    for (const [section, patterns] of Object.entries(config)) {
      console.log(`Processing section: ${section}`);
      const includePatterns = patterns.filter(p => !p.startsWith('-'));
      const excludePatterns = patterns.filter(p => p.startsWith('-')).map(p => p.slice(1));
  
      const files = await getMatchingFiles(includePatterns, excludePatterns);
      console.log(`Matching files for ${section}:`, files);
  
      if (files.length > 0) {
        const markdown = await generateMarkdown(files);
        const outputFile = `ai-kb-${section}.md`;
        await fs.writeFile(outputFile, markdown);
        console.log(`Generated ${outputFile}`);
      } else {
        console.log(`No files found for section ${section}. Skipping markdown generation.`);
      }
    }
  }

main().catch(error => {
  console.error('An error occurred:', error);
  process.exit(1);
});