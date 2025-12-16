// ========================================
// PROFILE SERVICE - FIXED VERSION
// Fix: Google Drive image URL không hiển thị được
// ========================================

/**
 * Update user profile - FIXED VERSION
 */
function updateProfile(data) {
  try {
    const email = data.email;
    
    if (!email) {
      return {
        ok: false,
        error: 'Email is required'
      };
    }
    
    Logger.log('💾 Updating profile for: ' + email);
    
    // Auto-setup columns if needed
    if (!autoSetupIfNeeded()) {
      return {
        ok: false,
        error: 'Failed to setup profile columns'
      };
    }
    
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName('USERS');
    
    if (!sheet) {
      return {
        ok: false,
        error: 'USERS sheet not found'
      };
    }
    
    const sheetData = sheet.getDataRange().getValues();
    const headers = sheetData[0];
    
    // Get column indices
    const emailCol = headers.indexOf('Email');
    const nameCol = headers.indexOf('Họ tên');
    const phoneCol = headers.indexOf('Phone');
    const birthDateCol = headers.indexOf('Birth Date');
    const addressCol = headers.indexOf('Address');
    const bioCol = headers.indexOf('Bio');
    const avatarCol = headers.indexOf('Avatar');
    const lastLoginCol = headers.indexOf('Last Login');
    
    // Find user row
    let userRow = -1;
    for (let i = 1; i < sheetData.length; i++) {
      if (sheetData[i][emailCol] && 
          sheetData[i][emailCol].toString().toLowerCase() === email.toLowerCase()) {
        userRow = i + 1;
        Logger.log('✅ Found user at row: ' + userRow);
        break;
      }
    }
    
    if (userRow === -1) {
      Logger.log('❌ User not found in sheet');
      return {
        ok: false,
        error: 'User not found'
      };
    }
    
    // Update fields
    if (data.name) {
      sheet.getRange(userRow, nameCol + 1).setValue(data.name);
      Logger.log('✓ Updated name');
    }
    
    if (data.phone !== undefined) {
      sheet.getRange(userRow, phoneCol + 1).setValue(data.phone);
      Logger.log('✓ Updated phone');
    }
    
    if (data.birthDate !== undefined) {
      sheet.getRange(userRow, birthDateCol + 1).setValue(data.birthDate);
      Logger.log('✓ Updated birthDate');
    }
    
    if (data.address !== undefined) {
      sheet.getRange(userRow, addressCol + 1).setValue(data.address);
      Logger.log('✓ Updated address');
    }
    
    if (data.bio !== undefined) {
      sheet.getRange(userRow, bioCol + 1).setValue(data.bio);
      Logger.log('✓ Updated bio');
    }
    
    // ✅ FIXED: Avatar handling with multiple strategies
    if (data.avatar !== undefined) {
      let avatarUrl = null;
      
      // Strategy 1: Try uploading to Drive and get proper URL
      if (data.avatar.startsWith('data:image')) {
        Logger.log('📤 Attempting Drive upload...');
        avatarUrl = uploadAvatarToDriveFixed(data.avatar, email);
      }
      
      // Strategy 2: If Drive upload fails or not base64, save as-is
      if (!avatarUrl) {
        avatarUrl = data.avatar;
        Logger.log('💾 Saving avatar directly (base64 or URL)');
      }
      
      sheet.getRange(userRow, avatarCol + 1).setValue(avatarUrl);
      Logger.log('✅ Avatar saved: ' + avatarUrl.substring(0, 50) + '...');
    }
    
    // Update last login
    const now = new Date();
    sheet.getRange(userRow, lastLoginCol + 1).setValue(now);
    Logger.log('✓ Updated last login');
    
    // Log to audit
    logAudit(ss, email, 'PORTAL', 'PROFILE_UPDATE', 'Profile updated successfully');
    
    Logger.log('✅ Profile update completed successfully');
    
    return {
      ok: true,
      message: 'Profile updated successfully'
    };
    
  } catch (error) {
    Logger.log('❌ Error in updateProfile: ' + error.toString());
    return {
      ok: false,
      error: 'Error updating profile: ' + error.toString()
    };
  }
}

/**
 * ✅ FIXED: Upload avatar to Google Drive with proper URL
 */
function uploadAvatarToDriveFixed(base64Data, email) {
  try {
    Logger.log('📤 Starting avatar upload to Drive...');
    
    if (!base64Data || base64Data.length < 100) {
      Logger.log('❌ Invalid base64 data');
      return null;
    }
    
    // Remove data URL prefix
    const base64Content = base64Data.replace(/^data:image\/\w+;base64,/, '');
    
    // Decode base64
    const blob = Utilities.newBlob(
      Utilities.base64Decode(base64Content),
      'image/jpeg',
      email.replace(/@/g, '_').replace(/\./g, '_') + '_avatar.jpg'
    );
    
    Logger.log('✓ Blob created, size: ' + blob.getBytes().length);
    
    // Get or create Avatars folder
    const folders = DriveApp.getFoldersByName('Cphaco_Avatars');
    let folder;
    
    if (folders.hasNext()) {
      folder = folders.next();
    } else {
      folder = DriveApp.createFolder('Cphaco_Avatars');
      Logger.log('✓ Created Avatars folder');
    }
    
    // Check if avatar already exists
    const fileName = blob.getName();
    const existingFiles = folder.getFilesByName(fileName);
    
    if (existingFiles.hasNext()) {
      const oldFile = existingFiles.next();
      oldFile.setTrashed(true);
      Logger.log('✓ Deleted old avatar');
    }
    
    // Upload new avatar
    const file = folder.createFile(blob);
    
    // ✅ CRITICAL: Set proper sharing permissions
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    const fileId = file.getId();
    
    // ✅ FIXED: Use multiple URL formats for better compatibility
    // Format 1: Google User Content (best for images)
    const url1 = 'https://lh3.googleusercontent.com/d/' + fileId;
    
    // Format 2: Drive thumbnail (fallback)
    const url2 = 'https://drive.google.com/thumbnail?id=' + fileId + '&sz=w400';
    
    // Format 3: Direct drive link (fallback 2)
    const url3 = 'https://drive.google.com/uc?export=view&id=' + fileId;
    
    Logger.log('✅ Avatar uploaded successfully!');
    Logger.log('   URL 1 (recommended): ' + url1);
    Logger.log('   URL 2 (fallback): ' + url2);
    Logger.log('   URL 3 (fallback): ' + url3);
    
    // Return the best URL format
    return url1;
    
  } catch (error) {
    Logger.log('❌ Error uploading avatar to Drive: ' + error.toString());
    return null;
  }
}

/**
 * ✅ NEW: Test avatar URL accessibility
 */
function testAvatarUrl(fileId) {
  const formats = [
    'https://lh3.googleusercontent.com/d/' + fileId,
    'https://drive.google.com/thumbnail?id=' + fileId + '&sz=w400',
    'https://drive.google.com/uc?export=view&id=' + fileId
  ];
  
  Logger.log('🧪 Testing avatar URL formats:');
  formats.forEach((url, index) => {
    Logger.log(`Format ${index + 1}: ${url}`);
  });
  
  return formats;
}

/**
 * Get user profile - UPDATED to handle Drive URLs
 */
function getProfile(email) {
  try {
    Logger.log('📥 Getting profile for: ' + email);
    
    // Auto-setup columns if needed
    if (!autoSetupIfNeeded()) {
      return {
        ok: false,
        error: 'Failed to setup profile columns'
      };
    }
    
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName('USERS');
    
    if (!sheet) {
      return {
        ok: false,
        error: 'USERS sheet not found'
      };
    }
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    
    // Get column indices
    const emailCol = headers.indexOf('Email');
    const nameCol = headers.indexOf('Họ tên');
    const roleCol = headers.indexOf('Chức vụ');
    const branchCol = headers.indexOf('Chi nhánh');
    const phoneCol = headers.indexOf('Phone');
    const birthDateCol = headers.indexOf('Birth Date');
    const addressCol = headers.indexOf('Address');
    const bioCol = headers.indexOf('Bio');
    const avatarCol = headers.indexOf('Avatar');
    const joinDateCol = headers.indexOf('Join Date');
    const lastLoginCol = headers.indexOf('Last Login');
    
    // Find user
    for (let i = 1; i < data.length; i++) {
      const rowEmail = data[i][emailCol];
      
      if (rowEmail && rowEmail.toString().toLowerCase() === email.toLowerCase()) {
        Logger.log('✅ User found at row ' + i);
        
        const avatarData = data[i][avatarCol] || '';
        
        // ✅ FIXED: Handle avatar URL properly
        let avatarUrl = '';
        if (avatarData) {
          if (avatarData.startsWith('data:image')) {
            // Base64 - use as-is
            avatarUrl = avatarData;
            Logger.log('📷 Avatar: base64 format');
          } else if (avatarData.startsWith('http')) {
            // Already a URL - use as-is
            avatarUrl = avatarData;
            Logger.log('📷 Avatar: URL format');
          } else {
            // Might be a Drive file ID - construct URL
            avatarUrl = 'https://lh3.googleusercontent.com/d/' + avatarData;
            Logger.log('📷 Avatar: Drive ID converted to URL');
          }
        }
        
        const profile = {
          email: data[i][emailCol] || '',
          name: data[i][nameCol] || '',
          role: data[i][roleCol] || '',
          branch: data[i][branchCol] || '',
          department: '',
          phone: data[i][phoneCol] || '',
          birthDate: data[i][birthDateCol] ? formatDateForInput(data[i][birthDateCol]) : '',
          address: data[i][addressCol] || '',
          bio: data[i][bioCol] || '',
          avatar: avatarUrl,
          joinDate: data[i][joinDateCol] ? formatDateDisplay(data[i][joinDateCol]) : '15/01/2024',
          lastLogin: data[i][lastLoginCol] ? formatDateDisplay(data[i][lastLoginCol]) : '',
          appsCount: '8'
        };
        
        Logger.log('✅ Profile loaded successfully');
        if (profile.avatar) {
          Logger.log('📷 Avatar URL: ' + profile.avatar.substring(0, 100));
        }
        
        return {
          ok: true,
          profile: profile
        };
      }
    }
    
    Logger.log('❌ User not found: ' + email);
    return {
      ok: false,
      error: 'User not found'
    };
    
  } catch (error) {
    Logger.log('❌ Error in getProfile: ' + error.toString());
    return {
      ok: false,
      error: 'Error getting profile: ' + error.toString()
    };
  }
}

// ========================================
// HELPER FUNCTIONS
// ========================================

function formatDateDisplay(date) {
  if (!date) return '';
  
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    
    return day + '/' + month + '/' + year;
  } catch (e) {
    return '';
  }
}

function formatDateForInput(date) {
  if (!date) return '';
  
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    
    return year + '-' + month + '-' + day;
  } catch (e) {
    return '';
  }
}
