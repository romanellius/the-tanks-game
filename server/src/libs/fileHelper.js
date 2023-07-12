///FILE Helper///

const fs = require("fs");
const { resolve, join, parse } = require("path");

const joinPaths = (...paths) => join(...paths);
const resolvePath = (path) => resolve(path);

const getFolders = (path) => {
  const absPath = resolve(path);
  const entries = fs.readdirSync(absPath, {
    withFileTypes: true,
  });

  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => ({
      name: entry.name,
      absPath: join(absPath, entry.name),
    }));
};

const getMatchingFileAbsPath = (absFolderPath, pattern) => {
  const entries = fs.readdirSync(absFolderPath);

  const name = entries.find((entry) => pattern.exec(entry).length > 0);
  return name && join(absFolderPath, name);
};

function* getAllFiles(path) {
  const absPath = resolve(path);
  const entries = fs.readdirSync(absPath, {
    withFileTypes: true,
  });

  for (const entry of entries) {
    if (entry.isDirectory()) {
      yield* getAllFiles(join(absPath, entry.name));
    } else {
      yield { ...entry, absPath: join(absPath, entry.name) };
    }
  }
}

const getFile = (path) => {
  const absPath = resolve(path);
  return fs.readFileSync(absPath);
};

const getFileNameWithNoExtension = (fullName) => parse(fullName).name;

module.exports = {
  joinPaths,
  resolvePath,

  getFolders,
  getMatchingFileAbsPath,
  getAllFiles,
  getFile,
  getFileNameWithNoExtension,
};
