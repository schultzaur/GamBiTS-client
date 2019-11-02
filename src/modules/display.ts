// hrmmm
// tilemap
// sprites
// html canvas with pixel by pixel createimagedata/setimagedata

export function createDisplay(id, parent) {
    let div = document.createElement('div');
    parent.appendChild(div);
    div.id = id;

    return {
      id: id
    };
  }