import { useState } from "react";

import { splitsApi } from "../../api/splitsApi";
import { readErrorMessage } from "../../utils";
import { DownloadIcon } from "../icons";

function findCurrentMonth(): string {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
}

function saveFile(fileBlob: Blob, fileName: string) {
  const fileUrl = URL.createObjectURL(fileBlob);
  const downloadLink = document.createElement("a");
  downloadLink.href = fileUrl;
  downloadLink.download = fileName;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  downloadLink.remove();
  setTimeout(() => URL.revokeObjectURL(fileUrl), 1000);
}

export default function ReportExport() {
  const [month, setMonth] = useState(findCurrentMonth);
  const [isDownloading, setIsDownloading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function downloadReport() {
    setIsDownloading(true);
    setErrorMessage(null);
    try {
      saveFile(await splitsApi.downloadReport(month), `grosharey-${month}.pdf`);
    } catch (error) {
      setErrorMessage(readErrorMessage(error, "Couldn't make the report"));
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <div className="settings-group report-export">
      <h3>Export</h3>
      <p className="description">Download a PDF of a month's grocery runs and your share, for reimbursements.</p>
      <div className="report-export-row">
        <input
          type="month"
          value={month}
          max={findCurrentMonth()}
          aria-label="Month to export"
          onChange={(event) => setMonth(event.target.value)}
        />
        <button type="button" className="btn" disabled={isDownloading || !month} onClick={downloadReport}>
          <DownloadIcon /> {isDownloading ? "Making PDF..." : "Download PDF"}
        </button>
      </div>
      {errorMessage && <p className="error-text">{errorMessage}</p>}
    </div>
  );
}
