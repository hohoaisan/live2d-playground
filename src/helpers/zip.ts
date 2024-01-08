import json5 from 'json5';
import JSZip from 'jszip';
import { utils } from 'pixi.js';
import { ModelSettings, ZipLoader } from 'pixi-live2d-display';

ZipLoader.unzip = async (
  reader: JSZip,
  settings: ModelSettings
): Promise<File[]> => {
  // const filePaths = await ZipLoader.getFilePaths(reader);

  const requiredFilePaths: string[] = [];

  // only consume the files defined in settings
  for (const definedFile of settings.getDefinedFiles()) {
    // FIXME: deprecated API
    const actualPath = decodeURI(utils.url.resolve(settings.url, definedFile));

    // if (filePaths.includes(actualPath)) {
    requiredFilePaths.push(actualPath);
    // }
  }

  const files = await ZipLoader.getFiles(reader, requiredFilePaths);

  for (let i = 0; i < files.length; i++) {
    const path = requiredFilePaths[i];
    const file = files[i];
    // let's borrow this property...
    Object.defineProperty(file, 'webkitRelativePath', {
      value: path,
    });
  }

  return files;
};

ZipLoader.zipReader = (data: Blob, _url: string) => {
  return JSZip.loadAsync(data);
};

ZipLoader.getFilePaths = async (jsZip: JSZip) => {
  const paths: string[] = [];
  jsZip.forEach((relativePath) => paths.push(relativePath));
  return paths;
};

ZipLoader.getFiles = (jsZip: JSZip, paths: string[]) => {
  return Promise.all(
    paths.map(async (path) => {
      const fileName = path.slice(path.lastIndexOf('/') + 1, path.length);
      // const fileName = path.slice(1, path.lastIndexOf('/') + 1);
      const blob = await jsZip.file(path.slice(1, path.length))?.async('blob');
      return new File(blob ? [blob] : [], fileName);
    })
  );
};

ZipLoader.readText = async (jsZip: JSZip, path: string) => {
  const file = jsZip.file(path);

  if (!file) {
    throw new Error('Cannot find file: ' + path);
  }

  const text = await file.async('text');

  if (path.endsWith('.json')) {
    const parsedText = JSON.stringify(json5.parse(text));

    return parsedText;
  }

  return text;
};
