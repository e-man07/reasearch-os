# 🧹 Repository Cleanup Guide

## What Was Done

### ✅ 1. Created .gitignore Files

**Root .gitignore** (updated)
- Added .next/, out/, .vercel
- Added backup file patterns
- Added Prisma migrations

**apps/web/.gitignore** (new)
- Next.js specific ignores
- Environment files
- Build artifacts
- IDE files

**apps/agent-server/.gitignore** (new)
- Node.js build outputs
- Environment files
- TypeScript build info

### ✅ 2. Files to Ignore

The following are now properly ignored:
```
node_modules/          # Dependencies (never commit)
.env*                  # Environment variables (secrets)
.next/                 # Next.js build cache
dist/                  # Build outputs
*.tsbuildinfo          # TypeScript build info
.DS_Store              # macOS files
*.log                  # Log files
coverage/              # Test coverage
.vercel                # Vercel deployment
prisma/migrations/     # Database migrations
*.backup, *.old.*      # Backup files
```

### ✅ 3. Cleanup Script Created

**CLEAN_REPO.sh** - Automated cleanup script that:
1. Removes current .git directory
2. Cleans build artifacts (.next, dist, etc.)
3. Removes node_modules caches
4. Initializes fresh git repository
5. Creates initial commit

---

## 🚀 How to Clean & Reinitialize

### Option 1: Automated (Recommended)

```bash
# Run the cleanup script
./CLEAN_REPO.sh

# Add your remote
git remote add origin https://github.com/yourusername/research-os.git

# Push to remote
git push -u origin main
```

### Option 2: Manual

```bash
# 1. Remove git
rm -rf .git

# 2. Clean build artifacts
find . -name ".next" -type d -exec rm -rf {} + 2>/dev/null
find . -name "dist" -type d -exec rm -rf {} + 2>/dev/null
find . -name "*.tsbuildinfo" -delete

# 3. Initialize git
git init

# 4. Add files
git add .

# 5. Create initial commit
git commit -m "🚀 Initial commit - ResearchOS"

# 6. Add remote
git remote add origin <your-repo-url>

# 7. Push
git push -u origin main
```

---

## 📋 Pre-Commit Checklist

Before committing, ensure:

- [ ] No .env files are staged
- [ ] No node_modules are included
- [ ] No .next/ build cache
- [ ] No personal API keys
- [ ] No sensitive data
- [ ] .gitignore is up to date

Check with:
```bash
git status
git diff --cached
```

---

## 🗑️ What Gets Removed

### Build Artifacts
```
apps/web/.next/
apps/agent-server/dist/
packages/*/dist/
*.tsbuildinfo
.turbo/
```

### Caches
```
node_modules/.cache/
.next/cache/
```

### Environment Files
```
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
apps/web/.env
apps/agent-server/.env
```

### IDE Files
```
.vscode/
.idea/
*.swp
*.swo
```

---

## 🔒 Security Notes

### Never Commit:
- ❌ API keys (OpenAI, Weaviate, etc.)
- ❌ Database credentials
- ❌ NextAuth secrets
- ❌ .env files
- ❌ node_modules

### Safe to Commit:
- ✅ .env.example (template)
- ✅ Source code
- ✅ Configuration files
- ✅ Documentation
- ✅ package.json

---

## 📦 Repository Size

After cleanup, your repo should be:
- **Without node_modules:** ~5-10 MB
- **With node_modules:** ~500 MB (not committed)

Check size:
```bash
du -sh .git
du -sh . --exclude=node_modules
```

---

## 🎯 Clean Commit History

The cleanup script creates a single initial commit with:
- All source code
- Documentation
- Configuration
- No build artifacts
- No secrets

This gives you a clean starting point for your hackathon submission!

---

## 🚨 Important Notes

1. **Backup First**
   - Make sure you have backups before running cleanup
   - Save any important .env values elsewhere

2. **Team Coordination**
   - If working with a team, coordinate before reinitializing
   - Everyone will need to re-clone

3. **CI/CD**
   - Update any CI/CD pipelines with new repo URL
   - Reconfigure deployment secrets

4. **Environment Variables**
   - Create .env.example with template
   - Document required variables
   - Share secrets securely (not in git)

---

## ✅ Verification

After cleanup, verify:

```bash
# Check git status
git status

# Check what's tracked
git ls-files | head -20

# Check repo size
du -sh .git

# Verify .env is ignored
git check-ignore .env
# Should output: .env

# Verify node_modules is ignored
git check-ignore node_modules
# Should output: node_modules
```

---

## 🎉 Result

You now have:
- ✨ Clean git history
- 🔒 No secrets committed
- 📦 Minimal repository size
- 🚀 Ready for hackathon submission
- 📝 Proper .gitignore files

**Your repository is clean and ready to push!** 🎊
