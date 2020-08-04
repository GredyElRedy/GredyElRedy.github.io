const media = {
  card(i, item, type, extension) {
    const cardI = document.createElement("div");
    const isImage = type === "img";
    const url = URL.createObjectURL(item);
    cardI.innerHTML = `
    <${type} src="${url}" class="card-img-top" ${
      isImage ? "" : "controls"
    } alt="such a great Gredy">
    ${isImage ? "" : "</video>"}
    <div class="card-body">
      <h5 class="card-title">Gredy ${i}</h5>
      <form onsubmit='storageMedia(event,${JSON.stringify({
        i,
        url,
        type,
        extension,
      })})'>
        <input autocomplete="off" class="input-group" id="input${i}" placeholder="tag1 tag2 tag3...">
      </form>
    </div>`;
    cardI.setAttribute("class", "card");
    cardI.id = `card${i}`;
    return cardI;
  },
  searched(url, type, tags) {
    const cardI = document.createElement("div");
    const isImage = type === "img";
    cardI.innerHTML = `
    <${type} src="${url}" class="card-img-top" ${
      isImage ? "" : "controls"
    } alt="such a great Gredy">
    ${isImage ? "" : "</video>"}
    <div class="card-body">
      <h5 class="card-title">${tags}</h5>
    </div>`;
    cardI.setAttribute("class", "card");
    return cardI;
  },
  option(tag) {
    const option = document.createElement("option");
    option.innerText = tag;
    return option;
  },
  media: {},
};

firebase
  .database()
  .ref()
  .on("value", (snapshot) => {
    media.media = snapshot.val();
    if (window.location.href.endsWith("viewfiles.html")) {
      chargeTags();
      $("select").selectpicker();
    } else if (window.location.href.endsWith("updatefiles.html")) {
      document.querySelector("p").innerHTML =
        "<b>Recomendación de tags:</b> " + [...getTags()].join(" ");
    }
  });

function getTags() {
  return new Set(
    Object.values(media.media)
      .map((media) => media.tags)
      .reduce((a, b) => a.concat(b), [])
  );
}

function getPhotoRandom(e) {
  e.preventDefault();
  const items = Object.values(media.media);
  const random = Math.floor(Math.random() * items.length);
  const item = items[random];
  const newMedia = document.createElement(item.type);
  newMedia.src = item.url;
  newMedia.setAttribute("class", "media-random");
  const wrapper = document.querySelector("#wrapper-view");
  cleanWrapper(wrapper);
  wrapper.appendChild(newMedia);
}

function cleanWrapper(wrapper) {
  while (wrapper.firstChild) {
    wrapper.removeChild(wrapper.firstChild);
  }
}

const filterValues = (val, type) => val.filter((elem) => elem.type === type);
const unionIntersect = (val, selected, fn) =>
  val.filter((elem) => selected[fn]((tag) => elem.tags.includes(tag)));

function searchByTag(e) {
  e.preventDefault();
  const selected = {
    tags: [...document.querySelectorAll('[label="Tags"] > :checked')].map(
      (option) => option.innerText
    ),
    type: [...document.querySelectorAll('[label="Type"] > :checked')].map(
      (option) => option.innerText
    ),
  };
  const checkBox = document.querySelector('[type="checkbox"]');
  const values = Object.values(media.media).filter(({ type, tags }) => {
    if (checkBox.checked) {
      // Union
      return (
        selected.tags.some((tag) => tags.includes(tag)) ||
        selected.type.includes(type)
      );
    }
    return (
      selected.tags.every((tag) => tags.includes(tag)) &&
      (selected.type.length === 0 || selected.type.includes(type))
    );
  });
  const wrapper = document.querySelector("#wrapper-view");
  cleanWrapper(wrapper);
  for (const { tags, type, url } of values) {
    const newMiauravilla = media.searched(url, type, tags);
    wrapper.appendChild(newMiauravilla);
  }
}

function uploadMedia({ target }) {
  const wrapper = document.querySelector("#wrapper");
  let i = wrapper.children ? wrapper.children.length : 0;
  for (const item of target.files) {
    const type = item.type.startsWith("image/") ? "img" : "video";
    const newMediaFrame = media.card(i, item, type, item.type);
    newMediaFrame.onload = function () {
      URL.revokeObjectURL(this.src);
    };
    wrapper.appendChild(newMediaFrame);
    i++;
  }
}

async function storageMedia(event, { i, url, type, extension }) {
  event.preventDefault();
  document.querySelector("#input" + i).disabled = true;
  const blob = await fetch(url).then((r) => r.blob());
  const tags = document
    .querySelector(`#input${i}`)
    .value.trim()
    .toLowerCase()
    .split(" ");
  const mediasId = firebase.database().ref().push().key;
  const storageRef = firebase.storage().ref();
  try {
    const newFileRef = await storageRef
      .child(`${type}/${mediasId}.${extension.split("/")[1]}`)
      .put(blob);
    const newUrl = await newFileRef.ref.getDownloadURL();
    firebase.database().ref(mediasId).set({ type, url: newUrl, tags });
    document.querySelector(`#card${i}`).remove();
  } catch (e) {
    console.log(e);
  }
}

function chargeTags() {
  const tags = [...getTags()].sort();
  for (const tag of tags) {
    const option = media.option(tag);
    document.querySelector('optgroup[label="Tags"]').appendChild(option);
  }
}
