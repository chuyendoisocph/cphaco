// ========================================
// BACKEND: Profile Management
// Add to your auth-service.gs
// ========================================

// ===== ADD TO doGet() =====
/*
function doGet(e) {
  const action = e.parameter.action;
  
  switch(action) {
    case 'verify-email':
      return handleVerifyEmail(e.parameter);
    case 'get-profile':  // 👈 ADD THIS
      return handleGetProfile(e.parameter);
    default:
      return jsonResponse({ ok: false, message: 'Invalid action' });
  }
}
*/

// ===== ADD TO doPost() =====
/*
function doPost(e) {
  const data = parsePostData(e);
  const action = data.action;
  
  switch(action) {
    case 'signup':
      return handleSignup(data);
    case 'signin':
      return handleSignin(data);
    case 'reset-password':
      return handleResetPassword(data);
    case 'change-password':
      return handleChangePassword(data);
    case 'update-profile':  // 👈 ADD THIS
      return handleUpdateProfile(data);
    default:
      return jsonResponse({ ok: false, message: 'Invalid action' });
  }
}
*/

// ========================================
// GET PROFILE
// ========================================

function handleGetProfile(params) {
  try {
    const email = params.email;
    
    if (!email) {
      return jsonResponse({
        ok: false,
        message: 'Email is required'
      });
    }
    
    // Open spreadsheet
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName('USERS');
    const data = sheet.getDataRange().getValues();
    
    // Find user
    for (let i = 1; i < data.length; i++) {
      if (data[i][1] === email) { // Column B = Email
        const profile = {
          email: data[i][1],      // Column B
          name: data[i][0],       // Column A
          role: data[i][4],       // Column E
          branch: data[i][9],     // Column J (if exists)
          department: data[i][10], // Column K (if exists)
          phone: data[i][5],      // Column F (if exists)
          birthDate: data[i][6],  // Column G (if exists)
          address: data[i][7],    // Column H (if exists)
          bio: data[i][8],        // Column I (if exists)
          avatar: data[i][11],    // Column L (if exists)
          joinDate: data[i][12] ? formatDate(data[i][12]) : '',
          lastLogin: formatDate(new Date()),
          appsCount: '8'
        };
        
        return jsonResponse({
          ok: true,
          profile: profile
        });
      }
    }
    
    // User not found
    return jsonResponse({
      ok: false,
      message: 'User not found'
    });
    
  } catch (error) {
    console.error('Error getting profile:', error);
    return jsonResponse({
      ok: false,
      message: 'Error getting profile: ' + error.message
    });
  }
}

// ========================================
// UPDATE PROFILE
// ========================================

function handleUpdateProfile(data) {
  try {
    const email = data.email;
    
    if (!email) {
      return jsonResponse({
        ok: false,
        message: 'Email is required'
      });
    }
    
    // Open spreadsheet
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName('USERS');
    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();
    
    // Find user row
    let userRow = -1;
    for (let i = 1; i < values.length; i++) {
      if (values[i][1] === email) { // Column B = Email
        userRow = i + 1; // +1 because sheet rows are 1-indexed
        break;
      }
    }
    
    if (userRow === -1) {
      return jsonResponse({
        ok: false,
        message: 'User not found'
      });
    }
    
    // Update columns
    // A = Name
    if (data.name) {
      sheet.getRange(userRow, 1).setValue(data.name);
    }
    
    // F = Phone
    if (data.phone !== undefined) {
      sheet.getRange(userRow, 6).setValue(data.phone);
    }
    
    // G = Birth Date
    if (data.birthDate !== undefined) {
      sheet.getRange(userRow, 7).setValue(data.birthDate);
    }
    
    // H = Address
    if (data.address !== undefined) {
      sheet.getRange(userRow, 8).setValue(data.address);
    }
    
    // I = Bio
    if (data.bio !== undefined) {
      sheet.getRange(userRow, 9).setValue(data.bio);
    }
    
    // L = Avatar
    if (data.avatar !== undefined) {
      // Option 1: Save base64 directly (simple but large)
      sheet.getRange(userRow, 12).setValue(data.avatar);
      
      // Option 2: Upload to Drive and save URL (recommended)
      // const avatarUrl = uploadAvatarToDrive(data.avatar, email);
      // sheet.getRange(userRow, 12).setValue(avatarUrl);
    }
    
    // Update last login
    sheet.getRange(userRow, 13).setValue(new Date());
    
    console.log('✅ Profile updated for:', email);
    
    return jsonResponse({
      ok: true,
      message: 'Profile updated successfully'
    });
    
  } catch (error) {
    console.error('Error updating profile:', error);
    return jsonResponse({
      ok: false,
      message: 'Error updating profile: ' + error.message
    });
  }
}

// ========================================
// UPLOAD AVATAR TO GOOGLE DRIVE (OPTIONAL)
// ========================================

function uploadAvatarToDrive(base64Data, email) {
  try {
    // Remove data URL prefix if present
    const base64Content = base64Data.replace(/^data:image\/\w+;base64,/, '');
    
    // Decode base64
    const blob = Utilities.newBlob(
      Utilities.base64Decode(base64Content),
      'image/jpeg',
      email.replace('@', '_') + '_avatar.jpg'
    );
    
    // Get or create Avatars folder
    const folders = DriveApp.getFoldersByName('Cphaco_Avatars');
    let folder;
    
    if (folders.hasNext()) {
      folder = folders.next();
    } else {
      folder = DriveApp.createFolder('Cphaco_Avatars');
    }
    
    // Check if avatar already exists
    const existingFiles = folder.getFilesByName(blob.getName());
    if (existingFiles.hasNext()) {
      // Delete old avatar
      existingFiles.next().setTrashed(true);
    }
    
    // Upload new avatar
    const file = folder.createFile(blob);
    
    // Set sharing permissions
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    // Return direct image URL
    return `https://drive.google.com/uc?export=view&id=${file.getId()}`;
    
  } catch (error) {
    console.error('Error uploading avatar:', error);
    return null;
  }
}

// ========================================
// UTILITY: Format Date
// ========================================

function formatDate(date) {
  if (!date) return '';
  
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  
  return `${day}/${month}/${year}`;
}

// ========================================
// SHEET STRUCTURE REQUIRED
// ========================================

/*
USERS Sheet Columns (add if missing):

A  - Name
B  - Email
C  - Password (hashed)
D  - Verified
E  - Role
F  - Phone          👈 NEW
G  - Birth Date     👈 NEW
H  - Address        👈 NEW
I  - Bio            👈 NEW
J  - Branch         👈 NEW
K  - Department     👈 NEW
L  - Avatar         👈 NEW
M  - Join Date      👈 NEW
N  - Last Login     👈 NEW

Example header row:
Name | Email | Password | Verified | Role | Phone | Birth Date | Address | Bio | Branch | Department | Avatar | Join Date | Last Login
*/

// ========================================
// SETUP INSTRUCTIONS
// ========================================

/*
1. Add columns F-N to your USERS sheet
2. Copy handleGetProfile() to auth-service.gs
3. Copy handleUpdateProfile() to auth-service.gs
4. Update doGet() to handle 'get-profile'
5. Update doPost() to handle 'update-profile'
6. Deploy new version
7. Test with profile.js

OPTIONAL: Avatar Upload to Drive
- Uncomment uploadAvatarToDrive() usage
- This saves Drive URL instead of base64
- Smaller sheet size, faster loading
*/
