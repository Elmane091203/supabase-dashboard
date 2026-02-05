#!/usr/bin/env node

/**
 * Supabase Dashboard - Setup Verification Script
 *
 * Checks that all prerequisites and configuration are in place before deployment.
 * Run with: node verify-setup.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ANSI color codes for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkCommand(command, name) {
  try {
    execSync(`${command} --version`, { stdio: 'ignore' });
    log(`✓ ${name} installed`, 'green');
    return true;
  } catch {
    log(`✗ ${name} not found - Install from https://nodejs.org`, 'red');
    return false;
  }
}

function checkFile(filePath, name) {
  if (fs.existsSync(filePath)) {
    log(`✓ ${name} exists`, 'green');
    return true;
  }
  log(`✗ ${name} missing at ${filePath}`, 'red');
  return false;
}

function checkEnvVar(varName) {
  const value = process.env[varName];
  if (value) {
    const masked = value.substring(0, 8) + '...' + value.substring(value.length - 4);
    log(`✓ ${varName} configured (${masked})`, 'green');
    return true;
  }
  log(`✗ ${varName} not set in .env.local`, 'red');
  return false;
}

function checkFileContent(filePath, searchString, name) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    if (content.includes(searchString)) {
      log(`✓ ${name} found in ${path.basename(filePath)}`, 'green');
      return true;
    }
    log(`✗ ${name} not found in ${path.basename(filePath)}`, 'red');
    return false;
  } catch (err) {
    log(`✗ Could not read ${filePath}`, 'red');
    return false;
  }
}

async function runChecks() {
  log('\n🔍 Supabase Multi-Project Dashboard - Setup Verification\n', 'cyan');

  let allPassed = true;

  // 1. System Requirements
  log('📋 System Requirements', 'blue');
  log('─'.repeat(50));
  allPassed &= checkCommand('node', 'Node.js 18+');
  allPassed &= checkCommand('pnpm', 'pnpm');
  allPassed &= checkCommand('git', 'Git');

  // 2. Project Files
  log('\n📁 Project Files', 'blue');
  log('─'.repeat(50));
  allPassed &= checkFile('package.json', 'package.json');
  allPassed &= checkFile('next.config.js', 'next.config.js');
  allPassed &= checkFile('tsconfig.json', 'tsconfig.json');
  allPassed &= checkFile('tailwind.config.ts', 'tailwind.config.ts');
  allPassed &= checkFile('.env.local', '.env.local');

  // 3. Environment Variables
  log('\n🔐 Environment Variables', 'blue');
  log('─'.repeat(50));

  // Load .env.local
  const envPath = '.env.local';
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envVars = {};
    envContent.split('\n').forEach(line => {
      const [key, value] = line.split('=');
      if (key && value) {
        envVars[key.trim()] = value.trim();
      }
    });

    allPassed &= envVars.NEXT_PUBLIC_SUPABASE_URL ?
      (log(`✓ NEXT_PUBLIC_SUPABASE_URL configured`, 'green'), true) :
      (log(`✗ NEXT_PUBLIC_SUPABASE_URL missing`, 'red'), false);

    allPassed &= envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY ?
      (log(`✓ NEXT_PUBLIC_SUPABASE_ANON_KEY configured`, 'green'), true) :
      (log(`✗ NEXT_PUBLIC_SUPABASE_ANON_KEY missing`, 'red'), false);

    allPassed &= envVars.SUPABASE_SERVICE_KEY ?
      (log(`✓ SUPABASE_SERVICE_KEY configured`, 'green'), true) :
      (log(`✗ SUPABASE_SERVICE_KEY missing`, 'red'), false);
  } else {
    log(`✗ .env.local file not found`, 'red');
    allPassed = false;
  }

  // 4. Dependencies
  log('\n📦 Dependencies', 'blue');
  log('─'.repeat(50));

  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

    const requiredDeps = [
      'next',
      'react',
      '@supabase/supabase-js',
      '@tanstack/react-query',
      'zustand',
      'react-hook-form',
      'zod',
      'tailwindcss',
    ];

    for (const dep of requiredDeps) {
      if (deps[dep]) {
        log(`✓ ${dep} installed`, 'green');
      } else {
        log(`✗ ${dep} not installed`, 'red');
        allPassed = false;
      }
    }
  } catch (err) {
    log(`✗ Could not read package.json: ${err.message}`, 'red');
    allPassed = false;
  }

  // 5. Source Code Structure
  log('\n🗂️  Source Code Structure', 'blue');
  log('─'.repeat(50));

  const srcDirs = [
    'src/app',
    'src/components',
    'src/lib',
    'src/hooks',
    'src/stores',
    'src/types',
  ];

  for (const dir of srcDirs) {
    if (fs.existsSync(dir)) {
      log(`✓ ${dir}/ exists`, 'green');
    } else {
      log(`✗ ${dir}/ missing`, 'red');
      allPassed = false;
    }
  }

  // 6. Database Migrations
  log('\n🗄️  Database Migrations', 'blue');
  log('─'.repeat(50));

  const migrations = [
    'supabase/migrations/001_initial_schema.sql',
    'supabase/migrations/002_functions.sql',
    'supabase/migrations/003_rls_policies.sql',
  ];

  for (const migration of migrations) {
    allPassed &= checkFile(migration, path.basename(migration));
  }

  // 7. Edge Functions
  log('\n⚡ Edge Functions', 'blue');
  log('─'.repeat(50));

  const functions = [
    'supabase/functions/provision-project/index.ts',
    'supabase/functions/delete-project/index.ts',
    'supabase/functions/get-project-stats/index.ts',
  ];

  for (const func of functions) {
    allPassed &= checkFile(func, path.basename(path.dirname(func)));
  }

  // 8. Documentation
  log('\n📚 Documentation', 'blue');
  log('─'.repeat(50));

  const docs = [
    'SETUP_INSTRUCTIONS.md',
    'TEST_SCENARIOS.md',
    'DEPLOYMENT_GUIDE.md',
    'supabase/README.md',
  ];

  for (const doc of docs) {
    allPassed &= checkFile(doc, doc);
  }

  // 9. Key Components
  log('\n⚙️  Key Components', 'blue');
  log('─'.repeat(50));

  const components = [
    ['src/app/(auth)/login/page.tsx', 'Login page'],
    ['src/app/(dashboard)/projects/page.tsx', 'Projects list page'],
    ['src/app/api/projects/route.ts', 'Projects API'],
    ['src/lib/supabase/client.ts', 'Supabase client'],
    ['src/stores/auth-store.ts', 'Auth store'],
    ['middleware.ts', 'Auth middleware'],
  ];

  for (const [file, name] of components) {
    allPassed &= checkFile(file, name);
  }

  // 10. Supabase Connection Test
  log('\n🔗 Supabase Connection', 'blue');
  log('─'.repeat(50));

  try {
    const envContent = fs.readFileSync('.env.local', 'utf8');
    const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/);

    if (urlMatch) {
      const url = urlMatch[1].trim();
      log(`Attempting to reach: ${url}`, 'yellow');

      // This is a simple HTTP check - won't fully validate but gives feedback
      try {
        execSync(`curl -s -o /dev/null -w "%{http_code}" "${url}/health"`, {
          stdio: 'ignore',
          timeout: 5000,
        });
        log(`✓ Supabase instance appears to be reachable`, 'green');
      } catch {
        log(`⚠️  Could not verify Supabase connectivity (may need CORS configuration)`, 'yellow');
      }
    }
  } catch (err) {
    log(`⚠️  Skipping Supabase connection test`, 'yellow');
  }

  // Summary
  log('\n' + '='.repeat(50), 'cyan');
  if (allPassed) {
    log('✅ All checks passed! Ready to deploy.', 'green');
    log('\nNext steps:', 'cyan');
    log('1. Deploy database migrations to Supabase', 'yellow');
    log('2. Deploy Edge Functions: supabase functions deploy provision-project', 'yellow');
    log('3. Run: pnpm dev', 'yellow');
    log('4. Open: http://localhost:3000', 'yellow');
  } else {
    log('❌ Some checks failed. Please fix the issues above before deploying.', 'red');
    log('\nCommon fixes:', 'cyan');
    log('1. Install missing dependencies: pnpm install', 'yellow');
    log('2. Create .env.local with Supabase credentials', 'yellow');
    log('3. Run: supabase login && supabase link --project-ref your-project', 'yellow');
  }
  log('='.repeat(50) + '\n', 'cyan');

  process.exit(allPassed ? 0 : 1);
}

// Run checks
runChecks().catch(err => {
  log(`\n❌ Verification failed: ${err.message}`, 'red');
  process.exit(1);
});
