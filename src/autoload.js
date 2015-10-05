
export function load (file) {
  return new Promise((resolve, reject) => {
    if (__COMPILED__) {
      const old = require('icd-10-cm-parser/dist/' + file);
      fetch('dist/' + old)
      .then((res) => {
        resolve(res.json());
      })
    } else {
      resolve(require('icd-10-cm-parser/dist/' + file));
    }
  });
}