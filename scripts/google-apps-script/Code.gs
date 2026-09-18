/**
 * =========================================================================
 * RUANG DIGITAL — GOOGLE APPS SCRIPT (GAS) BRIDGE
 * =========================================================================
 * 
 * Script ini bertindak sebagai API Bridge antara aplikasi Ruang Digital
 * dan Google Drive untuk:
 * 1. Upload foto produk & aset publik (Otomatis share public link)
 * 2. Upload file produk digital (Software, Ebook, Template - Private)
 * 3. Secure download stream berkas digital untuk pembeli terverifikasi
 * 4. Hapus file dari Google Drive
 */

// Ganti secret ini sesuai nilai GOOGLE_APPS_SCRIPT_SECRET di file .env Anda
var SHARED_SECRET = "your-gas-hmac-shared-secret-token";

// Nama folder utama di Google Drive untuk menyimpan aset Ruang Digital
var DEFAULT_FOLDER_NAME = "Ruang Digital - Storage";

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(30000);

  try {
    if (!e || !e.postData || !e.postData.contents) {
      return responseJSON({ success: false, error: "Payload kosong." });
    }

    // Verifikasi Secret Token
    var headers = e.headers || {};
    var requestSecret = headers["x-gas-secret"] || headers["X-GAS-Secret"];
    
    var data = JSON.parse(e.postData.contents);
    if (!requestSecret && data.secret) {
      requestSecret = data.secret;
    }

    if (SHARED_SECRET && requestSecret !== SHARED_SECRET) {
      return responseJSON({ success: false, error: "Unauthorized: Invalid GAS Secret Token." });
    }

    var action = data.action;

    // -------------------------------------------------------------
    // 1. ACTION: UPLOAD (Foto Produk atau File Digital)
    // -------------------------------------------------------------
    if (action === "upload") {
      var fileName = data.fileName || ("file_" + new Date().getTime());
      var mimeType = data.mimeType || "application/octet-stream";
      var base64Data = data.base64Data;
      var isPublic = data.isPublic === true; // true untuk foto produk

      if (!base64Data) {
        return responseJSON({ success: false, error: "base64Data wajib diisi." });
      }

      var decodedBytes = Utilities.base64Decode(base64Data);
      var blob = Utilities.newBlob(decodedBytes, mimeType, fileName);

      // Cari atau buat folder penyimpanan
      var targetFolder = getOrCreateFolder(data.folderId || DEFAULT_FOLDER_NAME);
      var file = targetFolder.createFile(blob);

      // Jika foto produk (isPublic: true), setel permission menjadi Public View
      if (isPublic) {
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      }

      var fileId = file.getId();

      return responseJSON({
        success: true,
        fileId: fileId,
        fileName: file.getName(),
        fileSize: file.getSize(),
        mimeType: file.getMimeType(),
        // Direct CDN preview URL Google untuk foto
        directImageUrl: "https://lh3.googleusercontent.com/d/" + fileId,
        webContentLink: file.getDownloadUrl(),
      });
    }

    // -------------------------------------------------------------
    // 2. ACTION: DOWNLOAD (Streaming Berkas Digital Terenkripsi)
    // -------------------------------------------------------------
    else if (action === "download") {
      var fileId = data.fileId;
      if (!fileId) {
        return responseJSON({ success: false, error: "fileId wajib diisi." });
      }

      var file = DriveApp.getFileById(fileId);
      var fileBlob = file.getBlob();
      var base64Bytes = Utilities.base64Encode(fileBlob.getBytes());

      return responseJSON({
        success: true,
        fileId: fileId,
        fileName: file.getName(),
        mimeType: file.getMimeType(),
        fileSize: file.getSize(),
        base64Data: base64Bytes,
      });
    }

    // -------------------------------------------------------------
    // 3. ACTION: DELETE
    // -------------------------------------------------------------
    else if (action === "delete") {
      var fileId = data.fileId;
      if (!fileId) {
        return responseJSON({ success: false, error: "fileId wajib diisi." });
      }

      var file = DriveApp.getFileById(fileId);
      file.setTrashed(true);

      return responseJSON({ success: true, message: "File berhasil dihapus." });
    }

    else {
      return responseJSON({ success: false, error: "Aksi tidak dikenal: " + action });
    }

  } catch (err) {
    return responseJSON({ success: false, error: err.toString() });
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  return responseJSON({
    status: "OK",
    service: "Ruang Digital Google Drive API Bridge",
    time: new Date().toISOString(),
  });
}

// Helper: Cari atau buat folder di Google Drive
function getOrCreateFolder(folderNameOrId) {
  try {
    return DriveApp.getFolderById(folderNameOrId);
  } catch (e) {
    // Jika bukan ID, cari berdasarkan nama folder
    var folders = DriveApp.getFoldersByName(folderNameOrId);
    if (folders.hasNext()) {
      return folders.next();
    }
    return DriveApp.createFolder(folderNameOrId);
  }
}

// Helper: Format response JSON
function responseJSON(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
