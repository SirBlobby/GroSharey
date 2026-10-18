const DATA_URL_PREFIX = "data:image/png;base64,";

function downloadImage(dataUrl: string, fileName: string) {
  const downloadLink = document.createElement("a");
  downloadLink.href = dataUrl;
  downloadLink.download = fileName;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  downloadLink.remove();
}

export function readBase64(dataUrl: string): string {
  return dataUrl.slice(DATA_URL_PREFIX.length);
}

export async function shareImageInBrowser(dataUrl: string, fileName: string, title: string): Promise<"shared" | "downloaded"> {
  const imageBlob = await (await fetch(dataUrl)).blob();
  const imageFile = new File([imageBlob], fileName, { type: "image/png" });
  if (navigator.canShare?.({ files: [imageFile] })) {
    try {
      await navigator.share({ files: [imageFile], title });
      return "shared";
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return "shared";
      }
    }
  }
  downloadImage(dataUrl, fileName);
  return "downloaded";
}
