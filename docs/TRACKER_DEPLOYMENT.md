# 🚀 Tracker Deployment Process

**Date Created:** October 29, 2025  
**Domain:** tracker.3iatlas.mysticarcana.com  
**Repository:** 3dsolardeepagent  
**Vercel Project:** frontend (kjfsouls-projects)

---

## ⚠️ CRITICAL: Deployment Process

### How to Deploy Updates

**THIS IS THE ONLY WAY TO UPDATE THE LIVE TRACKER:**

1. **Make changes on feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   # Make changes
   git add .
   git commit -m "your message"
   git push origin feature/your-feature-name
   ```

2. **Test on preview**
   - Vercel automatically creates preview URLs
   - Get preview link: `vercel ls | head -8`
   - Test thoroughly

3. **Deploy to production**
   ```bash
   cd /Users/kfitz/3dsolardeepagent
   vercel --prod
   ```

4. **Verify deployment**
   ```bash
   vercel ls | grep "production\|Ready"
   ```

---

## 📁 Project Structure

```
3dsolardeepagent/                          ← Main repo
├── .vercel/                               ← Vercel config (DO NOT DELETE)
├── vercel.json                            ← Root deployment config
├── code_artifacts/
│   └── 3iatlas-flight-tracker/
│       └── frontend/                      ← This is the actual app
│           ├── src/
│           ├── public/
│           └── package.json
```

---

## 🎯 Vercel Configuration

### Root `vercel.json`:
```json
{
  "version": 2,
  "framework": null,
  "installCommand": "npm --prefix code_artifacts/3iatlas-flight-tracker/frontend ci || npm --prefix code_artifacts/3iatlas-flight-tracker/frontend install",
  "buildCommand": "npm --prefix code_artifacts/3iatlas-flight-tracker/frontend run build",
  "outputDirectory": "code_artifacts/3iatlas-flight-tracker/frontend/dist"
}
```

**This tells Vercel to:**
1. Install dependencies in `frontend/` subdirectory
2. Build from `frontend/` subdirectory
3. Serve from `frontend/dist/` output

---

## 🔗 Vercel Project Links

**Project Name:** `frontend`  
**Project ID:** `prj_qyXnGt2QaGowpE1rotXdbbssR5hW`  
**Organization:** `kjfsouls-projects`

**Connected to:**
- ✅ Repository: `3dsolardeepagent` (GitHub)
- ✅ Domain: `tracker.3iatlas.mysticarcana.com`
- ✅ Auto-deploys from `main` branch

---

## ❌ DO NOT

- ❌ Delete `.vercel/` directory
- ❌ Run `vercel` from `frontend/` directory (use root!)
- ❌ Change `vercel.json` without understanding the build path
- ❌ Deploy without testing on preview first

---

## ✅ DO

- ✅ Always test on preview before production
- ✅ Deploy from repo root: `cd /Users/kfitz/3dsolardeepagent && vercel --prod`
- ✅ Check deployment status: `vercel inspect [deployment-url]`
- ✅ Verify domain alias: Should show `tracker.3iatlas.mysticarcana.com`

---

## 🔍 Troubleshooting

### Issue: "Domain not connected"
Run: `vercel link --project frontend --yes` (from root)

### Issue: "Build fails"
Check: `vercel.json` paths are correct for subdirectory structure

### Issue: "Changes not appearing"
Run: `vercel --prod` to force production deployment

---

## 📊 Current Deployment

**Last Deployed:** October 29, 2025 1:23 AM EDT  
**Deployment ID:** `dpl_7DcPw3qB9BMphjsub2GvTsK2GVcE`  
**Production URL:** https://tracker.3iatlas.mysticarcana.com  
**Status:** ● Ready  

---

## 🎓 Important Notes

1. **Frontend project IS needed** - This is the Vercel project name
2. **Always deploy from root** - Don't cd into frontend/
3. **Auto-deploy setup** - Pushing to `main` should trigger automatic deployment
4. **Feature branches** - Still require manual `vercel --prod` command

---

**Last Updated:** October 29, 2025

