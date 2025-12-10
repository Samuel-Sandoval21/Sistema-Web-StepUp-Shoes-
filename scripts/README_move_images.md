Move images script

Purpose
- Explains how to use `move_images_from_db.ps1` to copy existing image files into `src/main/resources/static/images/` so the app serves them locally.

Steps
1. Backup DB and project.
2. Ensure MySQL client is installed and `mysql.exe` is on PATH.
3. From repository root run (dry run first):

   PowerShell example (dry-run):

   ```powershell
   powershell -ExecutionPolicy Bypass -File .\scripts\move_images_from_db.ps1 -DbUser root -DbName stepup_shoes -DryRun
   ```

4. If results look correct, run with password to copy files:

   ```powershell
   powershell -ExecutionPolicy Bypass -File .\scripts\move_images_from_db.ps1 -DbUser root -DbPass 'your_db_password' -DbName stepup_shoes
   ```

Notes
- The script copies files; it does not delete the originals.
- The script will create the needed category subfolders (deportivas, casual, formal, otros) under `src/main/resources/static/images/`.
- Missing files are listed in `scripts/missing_images.csv`.

If you prefer a Java-based migration or want me to generate the exact UPDATE SQL to clean DB entries automatically, tell me and I'll prepare it.