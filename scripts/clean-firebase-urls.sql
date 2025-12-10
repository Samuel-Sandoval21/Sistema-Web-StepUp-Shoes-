-- Script: clean-firebase-urls.sql
-- Purpose: Convert Firebase/storage URLs stored in 'productos.imagen_url' into
--          normalized local paths that match the project's static images layout.
-- IMPORTANT: Review the PREVIEW results before running the UPDATE statements.

USE stepup_shoes;

-- ===== PREVIEW: show current and proposed values =====
SELECT id, imagen_url AS original,
       -- Case 1: Firebase storage URL (contains '/o/')
       CASE
         WHEN imagen_url LIKE '%firebasestorage.googleapis.com%/o/%' THEN
           REPLACE(SUBSTRING_INDEX(SUBSTRING_INDEX(imagen_url, '/o/', -1), '?', 1), '%2F', '/')
         WHEN imagen_url LIKE '%stepup-shoes-3fbfb.appspot.com/%' THEN
           -- For storage.googleapis.com urls containing the bucket
           TRIM(LEADING '/'
             FROM SUBSTRING(imagen_url, LOCATE('stepup-shoes-3fbfb.appspot.com/', imagen_url) + CHAR_LENGTH('stepup-shoes-3fbfb.appspot.com/')))
         WHEN imagen_url LIKE 'http%/%' THEN
           -- Generic fallback: take last path segment and strip query
           SUBSTRING_INDEX(SUBSTRING_INDEX(imagen_url, '/', -1), '?', 1)
         ELSE
           imagen_url
       END AS proposed_path
FROM productos
WHERE imagen_url IS NOT NULL AND imagen_url <> ''
LIMIT 200;

-- ===== SAFE UPDATE: Uncomment only after reviewing PREVIEW =====
-- START TRANSACTION;
--
-- -- 1) Firebase Storage public URLs (encoded path after /o/)
-- UPDATE productos
-- SET imagen_url = REPLACE(SUBSTRING_INDEX(SUBSTRING_INDEX(imagen_url, '/o/', -1), '?', 1), '%2F', '/')
-- WHERE imagen_url LIKE '%firebasestorage.googleapis.com%/o/%';
--
-- -- 2) Google Storage public URLs with bucket in path
-- UPDATE productos
-- SET imagen_url = TRIM(LEADING '/' FROM SUBSTRING(imagen_url, LOCATE('stepup-shoes-3fbfb.appspot.com/', imagen_url) + CHAR_LENGTH('stepup-shoes-3fbfb.appspot.com/')))
-- WHERE imagen_url LIKE '%stepup-shoes-3fbfb.appspot.com/%';
--
-- -- 3) Generic fallback: keep only the final filename (if still contains http)
-- UPDATE productos
-- SET imagen_url = SUBSTRING_INDEX(SUBSTRING_INDEX(imagen_url, '/', -1), '?', 1)
-- WHERE imagen_url LIKE 'http%/%' AND imagen_url NOT LIKE '%firebasestorage.googleapis.com%/o/%' AND imagen_url NOT LIKE '%stepup-shoes-3fbfb.appspot.com/%';
--
-- COMMIT;

-- ===== NOTE =====
-- After running the updates, files should be placed under:
--   src/main/resources/static/images/<proposed_path>
-- For example, if proposed_path = 'productos/casual/foo.jpg' then the file should be at
-- 'src/main/resources/static/images/productos/casual/foo.jpg'.
-- The application maps images under /images/... so the browser URL will be /images/productos/casual/foo.jpg

-- If you want me to run these updates for you, I can generate the exact SQL (uncommented),
-- or create a small Java migration. Make sure you have a DB backup before performing updates.
