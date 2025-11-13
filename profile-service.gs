// ========================================
// PROFILE SERVICE - SEPARATE MODULE
// File: profile-service.gs
// ========================================
// This is a separate Apps Script file
// Create new file: Extensions → Apps Script → + (New file)
// Name: profile-service.gs
// Paste this code there
// ========================================

// ========================================
// PROFILE MANAGEMENT HANDLERS
// ========================================

/**
 * Get user profile
 * Called from main auth-service.gs via handleGetProfile()
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
          avatar: data[i][avatarCol] || '',
          joinDate: data[i][joinDateCol] ? formatDateDisplay(data[i][joinDateCol]) : '15/01/2024',
          lastLogin: data[i][lastLoginCol] ? formatDateDisplay(data[i][lastLoginCol]) : '',
          appsCount: '8'
        };
        
        Logger.log('✅ Profile loaded successfully');
        
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

/**
 * Update user profile
 * Called from main auth-service.gs via handleUpdateProfile()
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
    
    if (data.avatar !== undefined) {
      // Option 1: Save base64 directly (simple)
      sheet.getRange(userRow, avatarCol + 1).setValue(data.avatar);
      Logger.log('✓ Updated avatar');
      
      // Option 2: Upload to Drive (uncomment to use)
      // const avatarUrl = uploadAvatarToDrive(data.avatar, email);
      // if (avatarUrl) {
      //   sheet.getRange(userRow, avatarCol + 1).setValue(avatarUrl);
      //   Logger.log('✓ Updated avatar URL');
      // }
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

// ========================================
// HELPER FUNCTIONS
// ========================================

/**
 * Format date for display (DD/MM/YYYY)
 */
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

/**
 * Format date for input field (YYYY-MM-DD)
 */
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

/**
 * Upload avatar to Google Drive (OPTIONAL)
 */
function uploadAvatarToDrive(base64Data, email) {
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
      email.replace('@', '_').replace('.', '_') + '_avatar.jpg'
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
      existingFiles.next().setTrashed(true);
      Logger.log('✓ Deleted old avatar');
    }
    
    // Upload new avatar
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    const url = 'https://drive.google.com/uc?export=view&id=' + file.getId();
    Logger.log('✅ Avatar uploaded: ' + url);
    
    return url;
    
  } catch (error) {
    Logger.log('❌ Error uploading avatar: ' + error.toString());
    return null;
  }
}
