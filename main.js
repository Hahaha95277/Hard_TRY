
const imageInput = document.getElementById("imageInput");
const canvas = document.getElementById("styledCanvas");
const ctx = canvas.getContext("2d");

let filterMode = "five";
let currentImage = null;

imageInput.addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function (e) {
    const img = new Image();
    img.onload = function () {
      drawStylizedImage(img);
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
});

function openCamera() {
  imageInput.setAttribute("capture", "environment");
  imageInput.click();
}

function getLineOptions(imgHeight) {
  const autoStripe = document.getElementById("autoStripeCheckbox").checked;
  if (autoStripe) {
    const stripeCount = 512;
    const stripeHeight = Math.max(1, Math.floor(imgHeight / stripeCount));
    return { width: stripeHeight, gap: stripeHeight };
  } else {
    const width = parseInt(document.getElementById("lineWidthSelect").value, 10);
    const gap = parseInt(document.getElementById("lineGapSelect").value, 10);
    return { width, gap };
  }
}

function redrawIfReady() {
  if (currentImage) {
    drawStylizedImage(currentImage);
  }
}

function drawStylizedImage(img) {
  currentImage = img;

  const enableBorder = document.getElementById("enableBorder").checked;
  const whiteBorderWidth = parseInt(document.getElementById("whiteBorderWidth").value, 10);
  const borderSize = enableBorder ? Math.round(Math.max(img.width, img.height) * 0.05) : 0;
  canvas.width = img.width + borderSize * 2;
  canvas.height = img.height + borderSize * 2;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (enableBorder) {
    ctx.fillStyle = "#173D50";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#B3966A";
    ctx.fillRect(borderSize / 2, borderSize / 2, canvas.width - borderSize, canvas.height - borderSize);
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(borderSize + whiteBorderWidth, borderSize + whiteBorderWidth,
                 img.width - whiteBorderWidth * 2, img.height - whiteBorderWidth * 2);
  }

  const tempCanvas = document.createElement("canvas");
  const tempCtx = tempCanvas.getContext("2d");
  tempCanvas.width = img.width;
  tempCanvas.height = img.height;
  tempCtx.drawImage(img, 0, 0);

  const { width: lineWidth, gap: lineGap } = getLineOptions(img.height);

  let imgData = tempCtx.getImageData(0, 0, img.width, img.height);
  let data = imgData.data;

  for (let y = 0; y < img.height; y++) {
    for (let x = 0; x < img.width; x++) {
      const i = (y * img.width + x) * 4;
      const r = data[i], g = data[i + 1], b = data[i + 2];
      const brightness = 0.3 * r + 0.59 * g + 0.11 * b;

      let newColor;
      if (filterMode === "three") {
        if (brightness < 85) newColor = [23, 61, 80];
        else if (brightness < 170) newColor = [255, 255, 255];
        else newColor = [179, 150, 106];
      } else {
        const toggle = Math.floor(y / (lineGap + lineWidth)) % 2;
        if (brightness < 69) newColor = [23, 61, 80];
        else if (brightness < 103) {
          newColor = toggle === 0 ? [23, 61, 80] : [179, 150, 106];
        } else if (brightness < 137) newColor = [179, 150, 106];
        else if (brightness < 171) {
          newColor = toggle === 0 ? [255, 255, 255] : [179, 150, 106];
        } else newColor = [255, 255, 255];
      }

      [data[i], data[i + 1], data[i + 2]] = newColor;
    }
  }

  tempCtx.putImageData(imgData, 0, 0);
  ctx.drawImage(tempCanvas, borderSize, borderSize);
}

function downloadImage() {
  const inputName = document.getElementById("filenameInput").value.trim();
  const now = new Date();
  const timestamp = now.toISOString().replace(/[-:.]/g, "").slice(0, 15);
  const suffix = `_${filterMode}_${timestamp}.png`;
  const filename = inputName ? `${inputName}${suffix}` : `kbk_style${suffix}`;
  const link = document.createElement("a");
  link.download = filename;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

function toggleMode() {
  filterMode = filterMode === "five" ? "three" : "five";
  updateModeDisplay();
  if (currentImage) drawStylizedImage(currentImage);
}

function updateModeDisplay() {
  const modeText = filterMode === "five" ? "五階" : "三階";
  document.getElementById("modeDisplay").textContent = `目前濾鏡模式：${modeText}`;
}

updateModeDisplay();
