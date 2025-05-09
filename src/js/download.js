function openDownloadModal() {
  document.getElementById('download-modal').style.display = 'block';
}

function closeDownloadModal() {
  document.getElementById('download-modal').style.display = 'none';
}

function confirmDownload() {
  // Скачивание без перехода
  const link = document.createElement('a');
  link.href = '/backend/download.php';
  link.download = 'debug.log';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  closeDownloadModal();
}