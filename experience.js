const Jimp = require("jimp");
const fs = require("fs-extra");
const { access } = require("fs/promises");
// const upscale = require("pixel-scale-epx");
// const getPixels = require("get-pixels");

// const BACKGROUND_COLOR_TO_REPLACE = Jimp.rgbaToInt(255, 0, 0, 255); //RED
const BACKGROUND_COLOR_TO_REPLACE = Jimp.cssColorToHex("#B9EFF7"); //Charlotte
const LINE_COLOR = Jimp.cssColorToHex("black");
// const COLOR_YELLOW = Jimp.cssColorToHex("yellow");
console.log("LINE_COLOR: ", LINE_COLOR);
// const BACKGROUND_COLOR_TO_REPLACE_RGBA = Jimp.intToRGBA(
//   BACKGROUND_COLOR_TO_REPLACE
// );
console.log(BACKGROUND_COLOR_TO_REPLACE);
// console.log(BACKGROUND_COLOR_TO_REPLACE_RGBA);
const WHITE = Jimp.cssColorToHex("white");
const TRANSPARENT_COLOR = 00000000;
const BLACK_SHADE = 152;
// 0xffffffff

const colorObj = {};
let colorList = [];
const colorObjStep1 = {};
let colorListStep1 = [];
const colorObjStep2 = {};
let colorListStep2 = [];
// const fileName = "pixilart-drawing.png";
const fileName = "tong-hop-tranh-to-mau-cho-be-5-tuoi-du-cac-chu-de-25.jpg";
// const fileName = "20221213_seal_v001.jpg";
let imgWidth = 0;
let imgHeight = 0;
let imageInArr = [];
const fileNameArr = fileName.split(".");

/**
 * Save Color to TXT file for tracking
 * @param array colorList
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
 * @param array colorList
 * @param object colorObj
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

const fExists = async (path) => {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
};

const fExists1 = async (path) => {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
};

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
 * @param string fileName
 */
async function cloneImage(fileName) {
  await Jimp.read(`./${fileName}`)
    .then((image) => {
      // image.background(LINE_COLOR).write(`./jimp/${fileName}`);
      image.grayscale().contrast(1).write(`./jimp/${fileNameArr[0]}.png`);
    })
    .catch((err) => {
      console.log({ err });
    });
}

/**
 * Upload image
 * @param string fileName
 */
async function uploadImage(fileName) {
  // await Jimp.read(`./jimp/${fileName}`)
  await Jimp.read(`./jimp/${fileNameArr[0]}.png`)
    .then((image) => {
      // console.log(image);

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
 * @param string fileName
 * @param string color
 * @param object colorObj
 */
async function replaceBackgroundColor(fileName, color, colorObj) {
  await Jimp.read(`./jimp/${fileNameArr[0]}.png`)
    .then((image) => {
      // colorObj[colorList[1]].forEach(coord => {
      // colorObj[4294967295].forEach(coord => {
      // colorObj[0].forEach(coord => {
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

function getColor(image, w, h) {
  return image.getPixelColor(w, h);
}

/**
 * Upload image
 * @param string fileName
 */
async function uploadImageAfterStep1(fileName) {
  // await Jimp.read(`./jimp/${fileName}`)
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
      }

      for (let heightIdx = imgHeight; heightIdx > 0; heightIdx--) {
        for (let widthIdx = imgWidth; widthIdx > 0; widthIdx--) {
          color = getColor(image, widthIdx, heightIdx);
          // if (!colorListStep1.includes(color)) {
          //   colorListStep1.push(color);
          // }
          // if (colorObjStep1[color] === undefined) {
          //   colorObjStep1[color] = [[widthIdx, heightIdx]];
          // } else {
          //   tempArr = colorObjStep1[color];
          //   tempArr.push([widthIdx, heightIdx]);
          //   colorObjStep1[color] = tempArr;
          // }
          if (
            color == TRANSPARENT_COLOR &&
            !isBlack(getColor(image, widthIdx, heightIdx + 1)) &&
            !isBlack(getColor(image, widthIdx + 1, heightIdx))
          ) {
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
      // colorObj[colorList[1]].forEach(coord => {
      // colorObj[4294967295].forEach(coord => {
      // colorObj[0].forEach(coord => {
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
    await uploadImage(fileName);
    await saveColorToTXT(colorList);
    await replaceBackgroundColor(fileName, LINE_COLOR, colorObj);
    const isImageStep1Existed = setInterval(() => {
      checkImageExistStep1(fileName);
      if (fExists1(`./jimp/step1-${fileNameArr[0]}.png`)) {
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
  if (await fExists1(`./jimp/step1-${fileNameArr[0]}.png`)) {
    console.log("File is here");
    await uploadImageAfterStep1(fileName);
    // await saveColorToTXT(colorListStep1, "1");
    // await saveColorToTXT(imageInArr, "-image");
    // let pointingString = "";
    // colorListStep1.forEach((colorStep1) => {
    //   if (isBlack(colorStep1)) {
    //     colorObj[colorStep1].forEach((coord, idx) => {
    //       idx === 0
    //         ? (pointingString += `${coord[0]},${coord[1]}`)
    //         : (pointingString += ` ${coord[0]},${coord[1]}`);
    //     });
    //   }
    // });
    // await saveColorToTXT([pointingString], "svg-pointing");
    // await replaceBackgroundColorStep1(
    //   fileName,
    //   TRANSPARENT_COLOR,
    //   colorObjStep1
    // );
    // await replaceBackgroundColor(fileName, BACKGROUND_COLOR_TO_REPLACE, colorObj);
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
