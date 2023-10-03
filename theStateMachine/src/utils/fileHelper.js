const fs = require("fs");
const { join, parse } = require("path");

//private functions
const getAbsPath = (relativePath) => join(require.main.path, relativePath);

//public functions
const getFolders = (path) => {
  const absPath = getAbsPath(path);
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

//returns First matching file
const getMatchingFileAbsPath = (absFolderPath, pattern) => {
  const entries = fs.readdirSync(absFolderPath);

  const name = entries.find((entry) => pattern.exec(entry)?.length > 0);
  return name && join(absFolderPath, name);
};

function* genGetAllFiles(path) {
  const absPath = getAbsPath(path);
  const entries = fs.readdirSync(absPath, {
    withFileTypes: true,
  });

  for (const entry of entries) {
    if (entry.isDirectory()) {
      yield* genGetAllFiles(join(absPath, entry.name));
    } else {
      yield { ...entry, absPath: join(absPath, entry.name) };
    }
  }
}

const getFile = (path) => {
  const absPath = getAbsPath(path);
  return fs.readFileSync(absPath);
};

const getFileNameWithNoExtension = (fullName) => parse(fullName).name;

module.exports = {
  getFolders,
  getMatchingFileAbsPath,
  getAllFiles: genGetAllFiles,
  getFile,
  getFileNameWithNoExtension,
};
