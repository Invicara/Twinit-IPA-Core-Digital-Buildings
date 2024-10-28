import { IafFileSvc } from "@dtplatform/platform-api";
import _ from "lodash";
import moment from "moment";
import { VALID_FILE_EXT } from "../utils/constants";

export const getSelectedBimpkVersions = (bimpks, bimpkid) =>
  bimpks.find((bimpk) => bimpk._id === bimpkid)?.versions || [];

export const isCurrentModelAndVersion = (row, selectedBimpk, selectedModel) => {
  let result = false;

  if (selectedBimpk && selectedModel) {
    if (selectedBimpk.label.split(' ').slice(0, -1).join() === selectedModel._name) {
      //get current version of model
      let selectedModelVersion = _.find(selectedModel._versions, {
        _id: selectedModel._tipId,
      });
      if (selectedModelVersion._userAttributes && selectedModelVersion._userAttributes.bimpk) {
        result = row._id === selectedModelVersion._userAttributes.bimpk.fileVersionId;
      }
    }
  }

  return result;
}

export const isTipVersion = (row, bimpks, selectedBimpk) => {
  let result = false;

  if (selectedBimpk) {
    let bimpk = _.find(bimpks, { _id: selectedBimpk.value });
    result = bimpk._tipId === row._id;
  }

  return result;
};

export const onVersionChecked = (checkedRow, bimpks, callback) => {
  //check the selected version and uncheck all others
  let checkedVer = {...checkedRow};

  // toggle the checked state of the version and uncheck all others
  const newBimpks = bimpks.map((bimpk) => {
    const newVersions = bimpk.versions.map((version) => {
      let newVersion = {...version};
      if (checkedVer._id === version._id) {
          newVersion.checked = !version.checked;
          checkedVer = newVersion;
      } else {
        newVersion.checked = false;
      }
      return newVersion;
    });

    return {...bimpk, versions: newVersions}
  });

  callback(newBimpks, checkedVer);
};

export const constructModelFileVersions = async (modelFiles) => {
  //for each bimpk file
  //1. get its name with no extension
  //2. get its versions
  //3. sort the versions newest at top
  //4. for each version create a nice create date for display
  //5. set a property to be used in the table for the check box being checked or not

  const promises = modelFiles.map(async (modelFile) => {
    const fetchedVersions = await IafFileSvc.getFileVersions(modelFile._id);
    const versions = fetchedVersions._list;

    const sortedExpandedVersions = versions.map((version) => {
      const created = moment(version._metadata._createdAt);

      return {
        ...version,
        displayCreateDate: created.format('MMM D YYYY, h:mm a'),
        checked: false,
      };
    })
      .sort((a, b) => {
        return b._version - a._version;
      });

    return {
      ...modelFile,
      nameNoExt: modelFile._name.split('.').slice(0, -1).join() + ' (' + modelFile._name.split('.').pop() + ')',
      versions: sortedExpandedVersions,
    }
  });

  const newModelFiles = Promise.all(promises);

  return newModelFiles;
};

export const getCurrentFileNameFromSelect = (selectedFile) => {
  let fileObject = { validFile: false };

  if (selectedFile) {
    // let xelem = document.getElementsByClassName('select__single-value')[0].firstChild.textContent;
    let xelemArr = selectedFile.label.split(' (');
    let currFileName = xelemArr[0];
    let currFileType = xelemArr[1].substring(0, xelemArr[1].length - 1);

    fileObject = { currFileName: currFileName, currFileType: currFileType, validFile: true };
  }

  return fileObject;
};

export const getMissingRelationsResponse = async (fileId, fileVersionId) => {
  let missingElementsFile = await IafFileSvc.getFileUrl(fileId, fileVersionId);

  let resp = await fetch(missingElementsFile._url);

  return resp.json();
};

export const mapMissingRelations = async (missingRelations) => {
  return Promise.all(missingRelations.map((item) => getMissingRelationsResponse(item.fileId, item.fileVersionId)));
};

export const getFileNameAndExtension = (file) => {
  const fileNameAndExtension = file.name.split('.');
  const fileName = fileNameAndExtension[0];
  const fileExtension = fileNameAndExtension[1];

  return {
    fileName,
    fileExtension,
  }
}

export const validateFile = (fileName, fileExtension, dropdownFileName) => {
  let errorMessage = '';
  let isValid = true;

  if (!VALID_FILE_EXT.includes(`.${fileExtension}`)) {
    isValid = false;
    errorMessage = `Invalid file extension. Only ${VALID_FILE_EXT.join(', ')} files are supported.`;
  } else if (dropdownFileName.validFile && fileExtension !== dropdownFileName.currFileType) {
    isValid = false;
    errorMessage = `Invalid file extension. The file you selected is of type ${dropdownFileName.currFileType} and the file you are trying to upload is of type ${fileExtension}.`;
  }
  // 03.02 File Name to Upload = to Current File Nale
  if (dropdownFileName.validFile && fileName !== dropdownFileName.currFileName) {
    isValid = false;
    errorMessage = `The file name selected is different to the existing file.`;
  }

  return {
    isValid,
    errorMessage,
  }
}