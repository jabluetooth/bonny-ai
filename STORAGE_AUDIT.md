# Supabase Storage Audit

**Date:** 2026-01-06
**Last Updated:** 2026-01-06
**Scope:** Application Assets & File Uploads

## 1. Executive Summary

~~The application currently relies heavily on external image URLs (Unsplash, etc.) and lacks a robust internal file management system.~~

**RESOLVED:** A reusable `ImageUploader` component has been created and integrated into all admin forms. The application now supports uploading images directly to Supabase Storage.

## 2. Current Status

| Bucket Name | Status | Usage | Policy |
| :--- | :--- | :--- | :--- |
| **`avatars`** | ✅ **Active** | User profile pictures (`avatar-uploader.tsx`) | Public Read |
| **`portfolio`** | ⚠️ **Requires Setup** | Project screenshots, interest images, background cards | See Below |
| **`chat-attachments`** | ❌ **Future** | File sharing in chat (not yet needed) | N/A |

## 3. Implementation Complete

### A. New Component: `ImageUploader`

**Location:** `components/admin/image-uploader.tsx`

A reusable image upload component with the following features:
- **Drag & drop** or click-to-upload interface
- **Image preview** with aspect ratio support
- **External URL fallback** - still allows pasting URLs (for Unsplash, etc.)
- **Automatic file naming** with timestamps to prevent conflicts
- **Folder organization** - uploads to subfolders (projects/, interests/, background/)
- **Size validation** - configurable max file size (default 5MB)
- **Error handling** - graceful bucket-not-found messages

### B. Updated Admin Forms

| Form | Field | Folder | Aspect Ratio |
| :--- | :--- | :--- | :--- |
| **Projects** (`project-edit-dialog.tsx`) | `image_url` | `projects/` | 16:9 |
| **Interests** (`interests-tab.tsx`) | `image_url` | `interests/` | 4:3 |
| **Background Cards** (`background-tab.tsx`) | `image` | `background/` | 16:9 |

## 4. Required: Create Storage Bucket

**You must create the `portfolio` bucket in Supabase Dashboard before uploads will work.**

### Step-by-Step Instructions

1. Go to **Supabase Dashboard** → **Storage**
2. Click **"New bucket"**
3. Configure:
   - **Name:** `portfolio`
   - **Public bucket:** ✅ Yes (allows public read access)
   - **Allowed MIME types:** `image/*` (or leave empty for all)
   - **File size limit:** 5MB (recommended)
4. Click **"Create bucket"**

### Security Policies (RLS)

After creating the bucket, add these policies in **Storage → Policies**:

#### Policy 1: Public Read Access
```sql
-- Allow anyone to view images
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'portfolio');
```

#### Policy 2: Authenticated Upload
```sql
-- Allow authenticated users to upload
CREATE POLICY "Authenticated upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'portfolio'
  AND auth.role() = 'authenticated'
);
```

#### Policy 3: Authenticated Update
```sql
-- Allow authenticated users to update their uploads
CREATE POLICY "Authenticated update"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'portfolio'
  AND auth.role() = 'authenticated'
);
```

#### Policy 4: Authenticated Delete
```sql
-- Allow authenticated users to delete
CREATE POLICY "Authenticated delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'portfolio'
  AND auth.role() = 'authenticated'
);
```

## 5. Folder Structure

After uploads, the bucket will be organized as:

```
portfolio/
├── projects/
│   ├── 1704567890123-abc123.jpg
│   ├── 1704567890456-def456.png
│   └── ...
├── interests/
│   ├── 1704567890789-ghi789.webp
│   └── ...
└── background/
    ├── 1704567891011-jkl012.jpg
    └── ...
```

## 6. Usage Notes

### For Admins
- Click "Upload" to select an image from your computer
- Or click "Use URL" to paste an external image URL (Unsplash, etc.)
- Click the X button on the preview to remove an image
- Images are automatically resized in the preview but stored at full resolution

### Backwards Compatibility
- Existing external URLs (Unsplash, etc.) continue to work
- The "Use URL" option allows mixing hosted and external images
- No migration required for existing data

## 7. Future Enhancements

- [ ] **Image optimization** - Compress images on upload
- [ ] **Image cropping** - Allow cropping before upload
- [ ] **Gallery view** - Browse previously uploaded images
- [ ] **Chat attachments** - Add `chat-attachments` bucket for file sharing
