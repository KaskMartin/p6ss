import { readFileSync } from 'fs'
import { join } from 'path'
import { db } from '../src/lib/database'
import { generateImageUID } from '../src/lib/utils'

interface ImageRow {
  thumbnail: string
  fullUrl: string
}

async function importImages() {
  try {
    console.log('Starting image import...')
    
    // Read the CSV file
    const csvPath = join(process.cwd(), 'P6SS_IMAGES.csv')
    const csvContent = readFileSync(csvPath, 'utf-8')
    
    // Parse CSV content and group thumbnail/full image pairs
    const lines = csvContent.trim().split('\n')
    const imageMap = new Map<string, { thumbnail?: string, fullUrl?: string }>()
    
    for (const line of lines) {
      const [filename, url] = line.split(',')
      if (filename && url) {
        const trimmedUrl = url.trim()
        const trimmedFilename = filename.trim()
        
        // Extract base name (without extension and _thumbnail_150x200)
        let baseName = trimmedFilename
        if (baseName.includes('_thumbnail_150x200')) {
          baseName = baseName.replace('_thumbnail_150x200.jpg', '')
        } else if (baseName.endsWith('.png')) {
          baseName = baseName.replace('.png', '')
        }
        
        // Group by base name
        if (!imageMap.has(baseName)) {
          imageMap.set(baseName, {})
        }
        
        const imageData = imageMap.get(baseName)!
        if (trimmedFilename.includes('_thumbnail_150x200')) {
          imageData.thumbnail = trimmedUrl
        } else {
          imageData.fullUrl = trimmedUrl
        }
      }
    }
    
    // Convert map to array of complete images
    const images: ImageRow[] = []
    for (const [baseName, data] of imageMap) {
      if (data.thumbnail && data.fullUrl) {
        images.push({
          thumbnail: data.thumbnail,
          fullUrl: data.fullUrl
        })
      } else {
        console.log(`⚠ Incomplete pair for ${baseName}:`, data)
      }
    }
    
    console.log(`Found ${images.length} images to import`)
    
    // Check for existing images to avoid duplicates
    console.log('Checking for existing images...')
    const existingImages = await db
      .selectFrom('images')
      .select(['url', 'thumb_url', 'uid'])
      .execute()
    
    const existingUrls = new Set(existingImages.map(img => img.url))
    const existingThumbUrls = new Set(existingImages.map(img => img.thumb_url))
    const existingUids = new Set(existingImages.map(img => img.uid))
    
    console.log(`Found ${existingImages.length} existing images in database`)
    
    // Import each image
    let imported = 0
    let skipped = 0
    let errors = 0
    
    for (const image of images) {
      try {
        // Check for duplicates by URL
        if (existingUrls.has(image.fullUrl) || existingThumbUrls.has(image.thumbnail)) {
          console.log(`⚠ Skipped (duplicate URL): ${image.fullUrl}`)
          skipped++
          continue
        }
        
        // Generate unique UID and check for UID duplicates
        let uid = generateImageUID()
        let attempts = 0
        while (existingUids.has(uid) && attempts < 10) {
          uid = generateImageUID()
          attempts++
        }
        
        if (attempts >= 10) {
          console.log(`⚠ Skipped (could not generate unique UID): ${image.fullUrl}`)
          skipped++
          continue
        }
        
        const now = new Date()
        
        // Insert into database
        await db
          .insertInto('images')
          .values({
            uid,
            url: image.fullUrl,
            thumb_url: image.thumbnail,
            width: 896,
            height: 1280,
            type: 'background',
            created_at: now,
            updated_at: now,
          })
          .execute()
        
        // Add new UID to existing set to prevent duplicates in same run
        existingUids.add(uid)
        
        imported++
        console.log(`✓ Imported: ${image.fullUrl}`)
        console.log(`  Thumbnail: ${image.thumbnail}`)
        console.log(`  UID: ${uid}`)
      } catch (error) {
        errors++
        console.error(`✗ Failed to import ${image.fullUrl}:`, error)
      }
    }
    
    console.log(`\nImport completed!`)
    console.log(`✓ Successfully imported: ${imported}`)
    console.log(`⚠ Skipped (duplicates): ${skipped}`)
    console.log(`✗ Errors: ${errors}`)
    
  } catch (error) {
    console.error('Import failed:', error)
  } finally {
    // Close database connection
    await db.destroy()
  }
}

// Run the import
importImages()
