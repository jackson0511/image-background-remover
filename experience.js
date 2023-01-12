const Jimp = require("jimp");
const fs = require("fs-extra");
const { access } = require("fs/promises");

// constant declaration
const LINE_COLOR = Jimp.cssColorToHex("black");
const WHITE = Jimp.cssColorToHex("white");
const TRANSPARENT_COLOR = 00000000;
const BLACK_SHADE = 152;
const colorObj = {};
const colorObjStep1 = {};
// const fileName = "20221213_seal_v001.jpg";
const fileName = "tong-hop-tranh-to-mau-cho-be-5-tuoi-du-cac-chu-de-25.jpg";
const fileNameArr = fileName.split(".");
let colorList = [];
let colorListStep1 = [];
let imgWidth = 0;
let imgHeight = 0;

/**
 * Save Color to TXT file for tracking
 * @param {number[]} colorList list of hex color
 */
async function saveColorToTXT(colorList, step = "0") {
  fs.writeFile(
    `./color/color-step${step}.txt`,
    colorList
      .map((color, idx) => {
        return idx === 0 ? `${color}` : ` \n${color}`;
      })
      .toString(),
    function (err) {
      console.log(err ? "Error :" + err : "ok");
    }
  );
}

/**
 * Save Color to JSON file for tracking
 * @param {number[]} colorList list of hex color
 * @param {object} colorObj coordinates of each color
 */
async function saveColorToJSON(colorList, colorObj) {
  fs.writeFile(
    "./color/color.json",
    JSON.stringify(colorObj[colorList[0]]),
    function (err) {
      console.log(err ? "Error :" + err : "ok");
    }
  );
}

/**
 * Check file is exist
 * @param {string} path path of file to check
 * @returns boolean
 */
const fExists = async (path) => {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
};

/**
 * Check hex color is black or not
 * @param {int} color hex color
 * @returns boolean
 */
function isBlack(color) {
  const rgba = Jimp.intToRGBA(color);
  if (
    rgba.r - 0 < BLACK_SHADE &&
    rgba.g - 0 < BLACK_SHADE &&
    rgba.b - 0 < BLACK_SHADE
  )
    return true;
  return false;
}

/**
 * Get black colors from color list
 * @param {number[]} colorList list of hex color
 * @returns hex colors are black
 */
function getBlackColor(colorList) {
  const blackColorList = [255];
  colorList.forEach((color) => {
    if (color !== 255 && color !== 4294967295 && isBlack(color)) {
      blackColorList.push(color);
    }
  });
  return blackColorList;
}

/**
 * Clone image
 * @param {string} fileName name of image to clone
 */
async function cloneImage(fileName) {
  await Jimp.read(`./${fileName}`)
    .then((image) => {
      image.grayscale().contrast(1).write(`./jimp/${fileNameArr[0]}.png`);
    })
    .catch((err) => {
      console.log({ err });
    });
}

/**
 * Upload image
 */
async function uploadImage() {
  await Jimp.read(`./jimp/${fileNameArr[0]}.png`)
    .then((image) => {
      // bitmap for png | _exif for jpg
      imgWidth = image._exif ? image._exif.imageSize.width : image.bitmap.width;
      imgHeight = image._exif
        ? image._exif.imageSize.height
        : image.bitmap.height;

      // Get image's pixel color list
      for (let heightIdx = 0; heightIdx < imgHeight; heightIdx++) {
        for (let widthIdx = 0; widthIdx < imgWidth; widthIdx++) {
          color = image.getPixelColor(widthIdx, heightIdx);
          if (!colorList.includes(color)) {
            colorList.push(color);
          }
          if (colorObj[color] === undefined) {
            colorObj[color] = [[widthIdx, heightIdx]];
          } else {
            tempArr = colorObj[color];
            tempArr.push([widthIdx, heightIdx]);
            colorObj[color] = tempArr;
          }
        }
      }
    })
    .catch((err) => {
      console.log({ err });
    });
}

/**
 * Color background with BACKGROUND_COLOR_TO_REPLACE
 * 4294967295 is value of white
 * 255 is value of black
 * @param {string} color hex color
 * @param {object} colorObj coordinates of each color
 */
async function replaceBackgroundColor(color, colorObj) {
  await Jimp.read(`./jimp/${fileNameArr[0]}.png`)
    .then((image) => {
      getBlackColor(colorList).forEach((blackColor) => {
        colorObj[blackColor].forEach((coord) => {
          image.setPixelColor(color, parseInt(coord[0]), parseInt(coord[1]));
        });
      });
      return image;
    })
    .then((image) => {
      // Output image with background colored
      image
        .grayscale()
        .contrast(1)
        .resize(imgWidth, imgHeight, Jimp.RESIZE_NEAREST_NEIGHBOR)
        .write(`./jimp/step1-${fileNameArr[0]}.png`);
    })
    .catch((err) => {
      console.log({ err });
    });
}

/**
 * get pixel color in image at w and h
 * @param {any} image image to get color
 * @param {number} w coordinates x
 * @param {number} h coordinates y
 * @returns {number} hex color in image at w and h
 */
function getColor(image, w, h) {
  return image.getPixelColor(w, h);
}

/**
 * Upload image after step 1
 */
async function uploadImageAfterStep1() {
  await Jimp.read(`./jimp/${fileNameArr[0]}.png`)
    .then((image) => {
      // Get image's pixel color list
      const checkColor = [TRANSPARENT_COLOR, LINE_COLOR];

      for (let heightIdx = 0; heightIdx < imgHeight; heightIdx++) {
        for (let widthIdx = 0; widthIdx < imgWidth; widthIdx++) {
          color = getColor(image, widthIdx, heightIdx);
          if (!colorListStep1.includes(color)) {
            colorListStep1.push(color);
          }
          if (colorObjStep1[color] === undefined) {
            colorObjStep1[color] = [[widthIdx, heightIdx]];
          } else {
            tempArr = colorObjStep1[color];
            tempArr.push([widthIdx, heightIdx]);
            colorObjStep1[color] = tempArr;
          }
          if (
            color != LINE_COLOR &&
            checkColor.includes(getColor(image, widthIdx, heightIdx - 1)) &&
            checkColor.includes(getColor(image, widthIdx - 1, heightIdx))
          ) {
            image.setPixelColor(
              TRANSPARENT_COLOR,
              parseInt(widthIdx),
              parseInt(heightIdx)
            );
          }
        }
        for (let widthIdx = imgWidth; widthIdx > 0; widthIdx--) {
            color = getColor(image, widthIdx, heightIdx);
            if (
              color == TRANSPARENT_COLOR &&
              !isBlack(getColor(image, widthIdx + 1, heightIdx))
            ) {
              image.setPixelColor(WHITE, parseInt(widthIdx), parseInt(heightIdx));
            }
          }
      }

      for (let heightIdx = imgHeight; heightIdx > 0; heightIdx--) {
        for (let widthIdx = imgWidth; widthIdx > 0; widthIdx--) {
          // console.log(`(${widthIdx}, ${heightIdx})`);
          color = getColor(image, widthIdx, heightIdx);
          if (
            color == TRANSPARENT_COLOR &&
            !isBlack(getColor(image, widthIdx, heightIdx + 1)) &&
            !isBlack(getColor(image, widthIdx + 1, heightIdx))
          ) {
            image.setPixelColor(WHITE, parseInt(widthIdx), parseInt(heightIdx));
          }
        }
      }

      for (let widthIdx = 0; widthIdx < imgWidth; widthIdx++) {
        for (let heightIdx = imgHeight; heightIdx > 0; heightIdx--) {
          // console.log(`(${widthIdx}, ${heightIdx})`);
          color = getColor(image, widthIdx, heightIdx);
          if (
            color == TRANSPARENT_COLOR &&
            !isBlack(getColor(image, widthIdx, heightIdx + 1))
          ) {
            // console.log('true');
            image.setPixelColor(WHITE, parseInt(widthIdx), parseInt(heightIdx));
          }
        }
      }
      
      return image;
    })
    .then((image) => {
      // Output image with background colored
      image.contrast(1).write(`./jimp/step2-${fileNameArr[0]}.png`);
    })
    .catch((err) => {
      console.log({ err });
    });
}

/**
 * Color background with BACKGROUND_COLOR_TO_REPLACE
 * 4294967295 is value of white
 * 255 is value of black
 * @param string fileName
 * @param string color
 * @param object colorObj
 */
async function replaceBackgroundColorStep1(fileName, color, colorObj) {
  await Jimp.read(`./jimp/step1-${fileName}`)
    .then((image) => {
      colorListStep1.forEach((colorStep1) => {
        if (!isBlack(colorStep1)) {
          colorObj[colorStep1].forEach((coord) => {
            image.setPixelColor(color, parseInt(coord[0]), parseInt(coord[1]));
          });
        }
      });
      return image;
    })
    .then((image) => {
      // Output image with background colored
      image.contrast(1).write(`./jimp/step2-${fileNameArr[0]}.png`);
    })
    .catch((err) => {
      console.log({ err });
    });
}

/**
 * Check if existed image
 * @param string fileName
 */
async function checkImageExist(fileName) {
  if (await fExists(`./jimp/${fileNameArr[0]}.png`)) {
    console.log("File is here");
    await uploadImage();
    await saveColorToTXT(colorList);
    await replaceBackgroundColor(LINE_COLOR, colorObj);
    const isImageStep1Existed = setInterval(() => {
      checkImageExistStep1(fileName);
      if (fExists(`./jimp/step1-${fileNameArr[0]}.png`)) {
        clearInterval(isImageStep1Existed);
      }
    }, 1000);
    console.log("Done Processing");
  } else {
    console.log("File not here - so make one");
  }
}

/**
 * Check if existed image
 * @param string fileName
 */
async function checkImageExistStep1(fileName) {
  if (await fExists(`./jimp/step1-${fileNameArr[0]}.png`)) {
    console.log("File is here");
    await uploadImageAfterStep1();
    console.log("Done Processing");
  } else {
    console.log("File not here - so make one");
  }
}
/**
 * Image Processor
 * @param string fileName
 */
async function imageProcessor(fileName) {
  console.log("imageProcessor begin");

  await cloneImage(fileName);

  const isImageExisted = setInterval(() => {
    checkImageExist(fileName);
    if (fExists(`./jimp/${fileNameArr[0]}.png`)) {
      clearInterval(isImageExisted);
    }
  }, 1000);
}

imageProcessor(fileName);
